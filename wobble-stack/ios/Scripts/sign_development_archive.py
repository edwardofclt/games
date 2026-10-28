#!/usr/bin/env python3
"""Sign an already-built archive using an existing local development profile.

This post-build step also avoids Finder metadata being copied into the signature
from a synced Documents folder. It does not create/download certificates or profiles.
Use Xcode's standard App Store Connect export afterward for distribution signing.
"""
import argparse
import fnmatch
import plistlib
import shutil
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('--identity', required=True, help='Existing Apple Development signing identity name or SHA-1')
parser.add_argument('--team', required=True)
args = parser.parse_args()
app = args.archive / 'Products/Applications/WobbleStack.app'
info = plistlib.loads((app / 'Info.plist').read_bytes())
bundle_id = info['CFBundleIdentifier']
candidates = [app / 'embedded.mobileprovision']
for directory in [Path.home() / 'Library/MobileDevice/Provisioning Profiles', Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles']:
    if directory.exists(): candidates.extend(directory.glob('*.mobileprovision'))
profile = None
for path in candidates:
    if not path.exists(): continue
    decoded = subprocess.run(['/usr/bin/security', 'cms', '-D', '-i', str(path)], capture_output=True)
    if decoded.returncode: continue
    data = plistlib.loads(decoded.stdout)
    ent = data.get('Entitlements', {})
    if args.team not in data.get('TeamIdentifier', []): continue
    if data.get('ExpirationDate', datetime.min) <= datetime.now(timezone.utc).replace(tzinfo=None): continue
    if not ent.get('get-task-allow'): continue
    if not fnmatch.fnmatchcase(args.team + '.' + bundle_id, ent.get('application-identifier', '')): continue
    profile = (path, data); break
if profile is None:
    raise SystemExit('No existing valid development profile covers this app/team. Archive with automatic signing in Xcode first.')
path, data = profile
embedded = app / 'embedded.mobileprovision'
if path.resolve() != embedded.resolve(): shutil.copyfile(path, embedded)
ent = data['Entitlements'].copy()
ent['application-identifier'] = args.team + '.' + bundle_id
ent['com.apple.developer.team-identifier'] = args.team
if 'keychain-access-groups' in ent:
    ent['keychain-access-groups'] = [value.replace('*', bundle_id) for value in ent['keychain-access-groups']]
ent_path = args.archive.parent / 'development-entitlements.plist'
ent_path.write_bytes(plistlib.dumps(ent))
# Only generated build products are touched. Source files retain their metadata.
subprocess.run(['/usr/bin/xattr', '-cr', str(app)], check=True)
subprocess.run(['/usr/bin/codesign', '--force', '--sign', args.identity, '--entitlements', str(ent_path), '--generate-entitlement-der', str(app)], check=True)
# The sync service can reattach Finder metadata as codesign writes its signature.
subprocess.run(['/usr/bin/xattr', '-cr', str(app)], check=True)
subprocess.run(['/usr/bin/codesign', '--verify', '--deep', '--strict', str(app)], check=True)
archive_info_path = args.archive / 'Info.plist'
archive_info = plistlib.loads(archive_info_path.read_bytes())
archive_info['ApplicationProperties']['SigningIdentity'] = args.identity
archive_info['ApplicationProperties']['Team'] = args.team
archive_info_path.write_bytes(plistlib.dumps(archive_info))
# ZIP stores the signed files, not Finder/file-provider extended attributes.
zip_path = args.archive.with_suffix(args.archive.suffix + '.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as output:
    for item in sorted(args.archive.rglob('*')):
        if item.is_file(): output.write(item, item.relative_to(args.archive.parent))
print(f'Packaged metadata-free archive: {zip_path}')
print(f'Development-signed and verified {bundle_id} version {info["CFBundleShortVersionString"]} ({info["CFBundleVersion"]}).')
