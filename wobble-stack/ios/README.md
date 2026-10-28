# Wobble Stack for iOS / iPadOS

An offline SwiftUI + WKWebView app for the approved Wobble Stack game. Deployment target: **iOS/iPadOS 16.0**. Universal iPhone/iPad app; portrait and landscape supported.

Open `WobbleStack.xcodeproj` in Xcode and choose the shared **WobbleStack** scheme. There are no Swift packages, CocoaPods, npm dependencies, servers, accounts, or permissions required by the game.

## Current release identity

- Home Screen display name: Wobble Stack
- App Store Connect name: Wobble Stack: Jelly Drop (the shorter name was already taken)
- App Store Connect app ID: `6828092755`
- Bundle identifier: `com.edwardofclt.wobblestack` (registered under team `6SHL6PHRS9`)
- Current project version / build: `1.0` / `2`
- Signing team: `6SHL6PHRS9`, matching the existing local Apple Development certificate
- Distribution goal: private family TestFlight first; no public App Store submission

The team and identifier are ordinary Xcode build settings. Changing the identifier after distribution creates a different app and local score namespace.

## What is implemented

- Offline bundled gameplay; only local bundle navigation is allowed.
- iOS scene lifecycle pauses the game on inactivity and waits for intentional resume.
- Validated, monotonic native best-score persistence using UserDefaults, with browser/session fallbacks.
- Native load/process-failure recovery with an explicit restart button.
- Edge-to-edge viewport, device safe areas, no web scrolling or browser chrome.
- Opaque 1024px app icon, launch background, privacy manifest and encryption declaration.
- No external runtime dependencies and no server or private WebKit file-access settings.

`Scripts/package_web.py` derives `Web/index.html`, `Web/game.js`, and `Web/style.css` from the browser game's source at build time. A classic JavaScript bundle avoids file-origin module restrictions without changing gameplay rules. The generated Web folder is placed inside the built app, not maintained as a second source tree. The iOS version removes the browser's desktop frame and uses a native score/lifecycle bridge.

## Build and test

Run from the project root `/Users/eherbert/Documents/ChatGPT/edwardofclt-gamestudio`:

```sh
node --check wobble-stack/game.mjs
node --test wobble-stack/rules.test.mjs wobble-stack/game.test.mjs

xcodebuild -project wobble-stack/ios/WobbleStack.xcodeproj \
  -scheme WobbleStack -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3' \
  -derivedDataPath wobble-stack/ios/build.nosync/DerivedData \
  CODE_SIGNING_ALLOWED=NO -parallel-testing-enabled NO test
```

For iPad, change the destination to an available iPad simulator, for example `platform=iOS Simulator,name=iPad mini (A17 Pro),OS=26.3`. Run `xcrun simctl list devices available` to see this Mac's devices. Xcode and the matching simulator runtime must be installed.

There are seven JavaScript checks and three genuine touch UI tests per device. The UI tests exercise scoring, loss/retry, persistence, pause/resume, backgrounding, and rotation without overriding the game state.

## Archive and TestFlight export

First sign in with the Apple Developer account in **Xcode → Settings → Accounts**. Select the signing team in the target's Signing & Capabilities panel. Register this exact bundle identifier and create the corresponding app record in App Store Connect before uploading.

Normally use **Product → Archive → Distribute App → App Store Connect**. Export options are supplied in `Release/ExportOptions.plist`.

This workspace lives under a synced Documents folder, where Finder metadata was added to generated `.app` directories and caused automatic code signing to fail. To keep all work in this app folder, the verified archive path builds first and signs the generated archive immediately after removing that metadata:

```sh
xcodebuild -project wobble-stack/ios/WobbleStack.xcodeproj \
  -scheme WobbleStack -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath wobble-stack/ios/build.nosync/ArchiveDerivedData \
  -archivePath wobble-stack/ios/build.nosync/WobbleStack.xcarchive \
  CODE_SIGNING_ALLOWED=NO archive

python3 wobble-stack/ios/Scripts/sign_development_archive.py \
  wobble-stack/ios/build.nosync/WobbleStack.xcarchive \
  --identity 'Apple Development: Edward Herbert II (4C735DNVTE)' \
  --team 6SHL6PHRS9

xcodebuild -exportArchive \
  -archivePath wobble-stack/ios/build.nosync/WobbleStack.xcarchive \
  -exportPath wobble-stack/ios/build.nosync/TestFlightExport \
  -exportOptionsPlist wobble-stack/ios/Release/ExportOptions.plist \
  -allowProvisioningUpdates
```

The signing helper also creates `WobbleStack.xcarchive.zip` without extended attributes. Use that stable archive copy if the Documents sync service reattaches Finder metadata to the unpacked folder.

The signing helper uses an existing valid local development profile and certificate. It does not create credentials, download profiles, change keychain access, or distribute anything. Development signing is a staging step: App Store Connect export must obtain a distribution profile and re-sign the archive. The supplied export plist uses `destination=export`, so it produces a local IPA rather than silently uploading. Upload that exported IPA with Xcode/Transporter, or deliberately change the export destination to `upload` after the app record exists.

Build directories, provisioning data, entitlements and archives are ignored by Git. The `.nosync` suffix is only a build-folder convention; the post-build signer is what removes the observed metadata immediately before signing.

## Actual verification and release status

- Xcode 26.6 successfully compiled the app and created an iOS arm64 archive.
- The archive was development-signed with the existing certificate; strict code-signature verification passed immediately before packaging it as `build.nosync/WobbleStack.xcarchive.zip`. This ZIP excludes Finder extended attributes. The synced folder can reattach Finder metadata to the unpacked `.app` later, which requires clearing those attributes again before verification/export. Preserve the ZIP as the stable artifact and extract it into a local, non-synced build location when finishing distribution.
- Three native UI tests passed on **iPhone 17 / iOS 26.3** and the same three passed on **iPad mini (A17 Pro) / iPadOS 26.3**.
- Native UserDefaults best-score values were confirmed in both simulator app containers.
- Seven JavaScript rule/game-loop checks passed, including the native pause event and bridge failure fallback.
- Simulator screenshots are in `Release/iphone-simulator.png` and `Release/ipad-simulator.png`.
- **App Store distribution export succeeded**, producing `build.nosync/TestFlightExport/WobbleStack.ipa`.
- **Upload succeeded** on October 28, 2026. **Build 1.0 (2) is now Testing in Private Beta (1 tester, 2 available builds).** Apple accepted version **1.0 (1)** and reported that the uploaded package was processing. The exported IPA was also checked for the correct identity/version, all offline resources, the privacy manifest, an App Store distribution profile, and a valid code signature.
- The explicit bundle identifier and app record have been created. The private internal testing group is **Private Beta**, with manual build selection and the owner's account added as its single tester. Beta app description and feedback email are saved.
- No public release or public TestFlight link has been created. External family invitations have not been sent.

App Store Connect: [Wobble Stack TestFlight](https://appstoreconnect.apple.com/teams/69a6de90-98e4-47e3-e053-5b8c7c11a4d1/apps/6828092755/testflight).

The original account sign-in blocker is resolved. `Release/UploadOptions.plist` is the explicit upload variant of the export configuration. To upload a future incremented build:

```sh
xcodebuild -exportArchive \
  -archivePath wobble-stack/ios/build.nosync/WobbleStack.xcarchive \
  -exportOptionsPlist wobble-stack/ios/Release/UploadOptions.plist \
  -allowProvisioningUpdates
```

Increment `CURRENT_PROJECT_VERSION` before uploading a new build for version 1.0. Use `Release/TestFlight-notes.txt` for tester notes. The latest build, **1.0 (2)**, finished processing, is assigned to **Private Beta**, and has status **Testing**. App Store Connect previously confirmed the owner installed build 1 on an **iPhone 16 Pro**; installation of the icon update has not been observed. External testers would need Apple's Beta App Review.

**Children under 13 cannot use TestFlight**, according to [Apple's TestFlight terms](https://www.apple.com/legal/internet-services/itunes/testflight/). For the original 9–12-year-old audience, use direct development/ad-hoc device installation or the eventual App Store version. The private TestFlight beta is for the eligible adult tester account.

Source: [Apple TestFlight](https://developer.apple.com/testflight/) and [Apple upload-build documentation](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/).

## Remaining checks

App Store Connect confirms TestFlight installation on the owner's iPhone 16 Pro. Physical gameplay, device performance, and interruption handling have not been observed directly; iPad device installation is not confirmed. Distribution signing, upload, processing, and internal TestFlight activation succeeded. External Beta App Review has not been requested. A live run is paused while the app is inactive but is not restored after process termination. Best score survives relaunch; it does not sync across devices.

No price, Kids Category selection, public privacy/support URLs, completed public App Store listing, or public release has been configured. The privacy-policy text in `Release/Privacy-policy-draft.md` is an unpublished draft for later release preparation. The App Store-signed IPA has been uploaded, processed, and activated for the private internal tester. No public release or public beta link has been created.


## Icon update — build 1.0 (2)

Build 2 fixes a blank app icon caused by an unsupported 24-bit AppKit bitmap drawing context. The renderer now uses a supported opaque Core Graphics canvas, checks representative image pixels, and exports a 1024×1024 PNG with no alpha channel. Both the source icon and the compiled app's icon were visually inspected. Gameplay is unchanged.

Apple accepted the build 2 upload on October 28, 2026. Apple completed processing and build 2 was added to **Private Beta**. Its build notes describe the corrected icon. The previous build remains available; testers can update to **1.0 (2)** in TestFlight. The current release state is recorded in `Release/status.json`.
