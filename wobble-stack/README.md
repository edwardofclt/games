# Wobble Stack

A small, standalone Canvas game for the rooftop jelly factory in the approved `STORY.md`. No build step, packages, network services, sound, or external assets.

## Play now

The development server is bound to `0.0.0.0:4173`.

- This computer: **http://localhost:4173/**
- Phone or tablet on the same Wi-Fi: **http://192.168.1.130:4173/**

That LAN address was discovered on this Mac during setup. It can change when the Mac changes networks. Keep this computer awake and the server running. If macOS asks about incoming connections for Python, allow them for local device testing. Guest networks with client isolation may prevent devices from reaching the Mac.

## Launch / relaunch

From any terminal, run exactly:

```sh
cd /Users/eherbert/Documents/ChatGPT/edwardofclt-gamestudio/wobble-stack
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open **http://localhost:4173/**. Use HTTP instead of opening `index.html` directly because the JavaScript uses ES modules. Python 3 is the only launch dependency. If 4173 is already occupied, leave the other server alone and choose another port (for example 4176), using that port in both URLs.

To find the current Wi-Fi address on macOS:

```sh
ipconfig getifaddr en0
```

If the command returns nothing, find the Wi-Fi IP address under System Settings → Wi-Fi → Details → TCP/IP. On the phone/tablet, open Safari and enter `http://` followed by that actual IP address and `:4173/`. `localhost` on a phone refers to the phone, so use the Mac's IP address there.

## How to play

- A jelly block slides left and right. **Tap/click the play area or press Space** to release it.
- Aim near the middle of the block below. Each successfully settled block adds **one point**.
- Blocks keep their full width. Crooked drops leave overhangs; weight high up can upset a lower joint.
- A miss or an unsupported stack produces a short tumble. Tap **Stack again**, anywhere on the result screen, or Space to clear the roof; the fresh slider is then ready for your next drop.
- Tap **Ⅱ** to pause; tap **Keep stacking** to resume. Desktop: **P** or **Escape** also toggles pause.
- Leaving/hiding the page pauses safely. Returning waits for a deliberate resume.
- Best score is saved in the browser on this device and origin. If browser storage is restricted, the best score still works for the current session. Different devices and different host URLs have separate best scores.

The play area disables scrolling, selection, and double-tap gestures. iOS safe-area insets are respected. Portrait is the intended composition; landscape preserves the whole board and all controls with a smaller play area.

## Stability approximation

`rules.mjs` checks every joint from the top down. Blocks have equal density, so mass is proportional to width. At each joint:

1. Compute the overlap between the bottom block of the upper group and its support.
2. Require at least **28% of the narrower block's width** to touch.
3. Compute the horizontal center of mass of **all blocks above that joint**, and require it inside the actual contact patch with a **7 logical-pixel inset**.

The rooftop platform is another support joint. A bad seam can fail even when the newly dropped block overlaps the top block. A compensating placement can reduce stress at lower seams. A gentle visual sway reflects the worst remaining joint risk; it is cosmetic and does not secretly alter the stability calculation. Jelly squash and the final tumble are also stylized animation rather than a rigid-body physics simulation.

Movement and collision run at a fixed 120 Hz with a bounded accumulator. The horizontal slider uses reflected travel rather than per-frame position increments. The camera follows tower height. Resizing only updates the drawing transform; it does not alter positions, scoring, or support geometry.

## Checks

With Node.js installed, from the app folder:

```sh
node --check game.mjs
node --test rules.test.mjs game.test.mjs
```

Seven checks cover centered towers, insufficient overlap, upper weight tipping a lower seam, a balancing placement relieving a lower seam, platform support, frame-rate-independent reflection, and a full real-game-loop simulation. The last check runs 30 successful placements, camera follow, pause during a fall, hidden-page pause, intentional resume, unavailable storage, collapse with no extra point, and retry. Its small DOM/canvas adapter verifies game state and drawing coordinates; it does not substitute for browser layout checks.

### Verified in this environment

- HTTP 200 from the running server; JavaScript syntax check; all seven automated checks pass.
- Actual in-app browser play: Space start/drop, pointer drop, successful landing and score increment, colorful failure/result, quick retry, score reset, best-score persistence after reload, pause and resume.
- Visually checked **320 × 568** and **390 × 844** phone sizes, **768 × 1024** tablet portrait, **1024 × 768** tablet landscape, and the normal desktop viewport. Changed tablet orientation during a falling block without resetting the run.
- No browser errors/warnings were reported in the inspected console.

### Still to test on physical devices

Actual iPhone/iPad Safari, touch-event delivery, safe-area behavior around a notch/home indicator, the mobile browser address bar opening/closing, performance on older devices, app switching, and real Wi-Fi access. The browser tool supported pointer/keyboard input and viewport resizing, but did not support synthetic touch input. Thirty-block camera follow and storage-denied behavior were checked in the automated game-loop simulation, not through physical-device play.

## Files

- `index.html`, `style.css`: responsive shell, score, pause and result controls.
- `game.mjs`: input, simulation, rendering, camera, pause and best score.
- `rules.mjs`: pure slider and tower-support rules.
- `rules.test.mjs`, `game.test.mjs`: small built-in Node test suite.
- `STORY.md`: original approved story, preserved unchanged.

## Native iOS app

The offline iPhone/iPad app is in [`ios/`](ios/README.md). Open `ios/WobbleStack.xcodeproj` in Xcode. It builds from the same game source, includes native score persistence and lifecycle pause, and has native touch UI tests. See the iOS README for archive/export commands and the confirmed private TestFlight release status.
