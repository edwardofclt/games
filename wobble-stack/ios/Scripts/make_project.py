#!/usr/bin/env python3
"""Recreate the dependency-free Xcode project with stable object identifiers."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def ident(name): return hashlib.sha1(name.encode()).hexdigest()[:24].upper()
def ref(name): return ident(name)
def q(value): return json.dumps(value)
objects = []
def add(name, body): objects.append(f'{ref(name)} = {{ {body} }};')

def file(name, path, kind, tree='<group>'):
    add(name, f'isa = PBXFileReference; lastKnownFileType = {kind}; path = {q(path)}; sourceTree = {q(tree)};')
def build(name, f): add(name, f'isa = PBXBuildFile; fileRef = {ref(f)};')
def group(name, children, path=None):
    add(name, f'isa = PBXGroup; children = ({", ".join(ref(c) for c in children)},); ' + (f'path = {q(path)}; ' if path else '') + 'sourceTree = "<group>";')

for name, path, kind in [('appSwift','WobbleStackApp.swift','sourcecode.swift'),('gameSwift','GameView.swift','sourcecode.swift'),('info','Info.plist','text.plist.xml'),('privacy','PrivacyInfo.xcprivacy','text.xml'),('assets','Assets.xcassets','folder.assetcatalog')]: file(name,path,kind)
file('testsSwift','WobbleStackUITests.swift','sourcecode.swift')
file('appProduct','WobbleStack.app','wrapper.application','BUILT_PRODUCTS_DIR')
file('testsProduct','WobbleStackUITests.xctest','wrapper.cfbundle','BUILT_PRODUCTS_DIR')
group('appGroup',['appSwift','gameSwift','info','privacy','assets'],'App')
group('testsGroup',['testsSwift'],'UITests')
group('products',['appProduct','testsProduct'])
group('main',['appGroup','testsGroup','products'])
for name, f in [('buildApp','appSwift'),('buildGame','gameSwift'),('buildPrivacy','privacy'),('buildAssets','assets'),('buildTests','testsSwift')]: build(name,f)
for name, isa, children in [('sources','PBXSourcesBuildPhase',['buildApp','buildGame']),('resources','PBXResourcesBuildPhase',['buildPrivacy','buildAssets']),('frameworks','PBXFrameworksBuildPhase',[]),('testSources','PBXSourcesBuildPhase',['buildTests']),('testResources','PBXResourcesBuildPhase',[]),('testFrameworks','PBXFrameworksBuildPhase',[])]:
    add(name, f'isa = {isa}; buildActionMask = 2147483647; files = ({", ".join(ref(c) for c in children)}); runOnlyForDeploymentPostprocessing = 0;')
script = '/usr/bin/python3 "${SRCROOT}/Scripts/package_web.py" "${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/Web"\n'
inputs = ['$(SRCROOT)/Scripts/package_web.py','$(SRCROOT)/../index.html','$(SRCROOT)/../game.mjs','$(SRCROOT)/../rules.mjs','$(SRCROOT)/../style.css']
outputs = ['$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/Web/'+f for f in ['index.html','game.js','style.css']]
add('webPhase', 'isa = PBXShellScriptBuildPhase; buildActionMask = 2147483647; files = (); inputPaths = (' + ','.join(q(x) for x in inputs) + '); outputPaths = (' + ','.join(q(x) for x in outputs) + '); name = "Bundle offline game"; shellPath = /bin/sh; shellScript = ' + q(script) + '; runOnlyForDeploymentPostprocessing = 0;')
add('proxy',f'isa = PBXContainerItemProxy; containerPortal = {ref("project")}; proxyType = 1; remoteGlobalIDString = {ref("appTarget")}; remoteInfo = WobbleStack;')
add('dependency',f'isa = PBXTargetDependency; target = {ref("appTarget")}; targetProxy = {ref("proxy")};')

for name, product, config, phases, kind, deps in [
    ('appTarget','appProduct','appConfigs',['sources','frameworks','resources','webPhase'],'application',[]),
    ('testTarget','testsProduct','testConfigs',['testSources','testFrameworks','testResources'],'bundle.ui-testing',['dependency'])]:
    productname = 'WobbleStack' if name == 'appTarget' else 'WobbleStackUITests'
    add(name, f'isa = PBXNativeTarget; buildConfigurationList = {ref(config)}; buildPhases = ({", ".join(ref(p) for p in phases)},); buildRules = (); dependencies = ({", ".join(ref(d) for d in deps)}); name = {productname}; productName = {productname}; productReference = {ref(product)}; productType = "com.apple.product-type.{kind}";')

common = {'SDKROOT':'iphoneos','IPHONEOS_DEPLOYMENT_TARGET':'16.0','CLANG_ENABLE_MODULES':'YES','SWIFT_VERSION':'5.0','SWIFT_STRICT_CONCURRENCY':'complete','TARGETED_DEVICE_FAMILY':'1,2','SUPPORTED_PLATFORMS':'iphoneos iphonesimulator','ENABLE_USER_SCRIPT_SANDBOXING':'YES','CODE_SIGN_STYLE':'Automatic','DEVELOPMENT_TEAM':'6SHL6PHRS9','CURRENT_PROJECT_VERSION':'2','MARKETING_VERSION':'1.0','ALWAYS_SEARCH_USER_PATHS':'NO'}
app = {'PRODUCT_BUNDLE_IDENTIFIER':'com.edwardofclt.wobblestack','PRODUCT_NAME':'$(TARGET_NAME)','INFOPLIST_FILE':'App/Info.plist','ASSETCATALOG_COMPILER_APPICON_NAME':'AppIcon','ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME':'','GENERATE_INFOPLIST_FILE':'NO','LD_RUNPATH_SEARCH_PATHS':'$(inherited) @executable_path/Frameworks','SUPPORTS_MACCATALYST':'NO','SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD':'NO','SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD':'NO','SWIFT_EMIT_LOC_STRINGS':'YES','ENABLE_PREVIEWS':'YES'}
tests = {'PRODUCT_BUNDLE_IDENTIFIER':'com.edwardofclt.wobblestack.uitests','PRODUCT_NAME':'$(TARGET_NAME)','GENERATE_INFOPLIST_FILE':'YES','TEST_TARGET_NAME':'WobbleStack','SWIFT_EMIT_LOC_STRINGS':'NO'}
for prefix, extras in [('project',{}),('app',app),('test',tests)]:
    for mode in ['Debug','Release']:
        settings = dict(common if prefix=='project' else extras)
        if prefix=='project': settings.update({'SWIFT_OPTIMIZATION_LEVEL':'-Onone' if mode=='Debug' else '-O','DEBUG_INFORMATION_FORMAT':'dwarf' if mode=='Debug' else 'dwarf-with-dsym','SWIFT_ACTIVE_COMPILATION_CONDITIONS':'DEBUG' if mode=='Debug' else '', 'ENABLE_TESTABILITY':'YES' if mode=='Debug' else 'NO'})
        add(prefix+mode, f'isa = XCBuildConfiguration; name = {mode}; buildSettings = {{ ' + ' '.join(f'{k} = {q(v)};' for k,v in settings.items()) + ' };')
    add(prefix+'Configs',f'isa = XCConfigurationList; buildConfigurations = ({ref(prefix+"Debug")}, {ref(prefix+"Release")}); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
add('project',f'isa = PBXProject; attributes = {{ BuildIndependentTargetsInParallel = 1; LastUpgradeCheck = 2660; TargetAttributes = {{ {ref("appTarget")} = {{ CreatedOnToolsVersion = 26.6; }}; {ref("testTarget")} = {{ CreatedOnToolsVersion = 26.6; TestTargetID = {ref("appTarget")}; }}; }}; }}; buildConfigurationList = {ref("projectConfigs")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en, Base); mainGroup = {ref("main")}; productRefGroup = {ref("products")}; projectDirPath = ""; projectRoot = ""; targets = ({ref("appTarget")}, {ref("testTarget")});')
project = ROOT/'WobbleStack.xcodeproj'
(project/'project.pbxproj').write_text('// !$*UTF8*$!\n{ archiveVersion = 1; classes = {}; objectVersion = 56; objects = {\n'+'\n'.join(objects)+f'\n}}; rootObject = {ref("project")}; }}\n')
scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2660" version="1.3">
<BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ref('appTarget')}" BuildableName="WobbleStack.app" BlueprintName="WobbleStack" ReferencedContainer="container:WobbleStack.xcodeproj"/></BuildActionEntry></BuildActionEntries></BuildAction>
<TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables><TestableReference skipped="NO"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ref('testTarget')}" BuildableName="WobbleStackUITests.xctest" BlueprintName="WobbleStackUITests" ReferencedContainer="container:WobbleStack.xcodeproj"/></TestableReference></Testables></TestAction>
<LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="NO"><BuildableProductRunnable runnableDebuggingMode="0"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ref('appTarget')}" BuildableName="WobbleStack.app" BlueprintName="WobbleStack" ReferencedContainer="container:WobbleStack.xcodeproj"/></BuildableProductRunnable></LaunchAction>
<ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ref('appTarget')}" BuildableName="WobbleStack.app" BlueprintName="WobbleStack" ReferencedContainer="container:WobbleStack.xcodeproj"/></BuildableProductRunnable></ProfileAction>
<AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>'''
(project/'xcshareddata/xcschemes/WobbleStack.xcscheme').write_text(scheme)
