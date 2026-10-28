# Gap Dash

A standalone Canvas arcade game about Zip, a blue courier spark with one route and one decision: when to cross. No installation, build step, network services, or downloaded assets. STORY.md is preserved.

## Launch

From a terminal:

```sh
cd /Users/eherbert/Documents/ChatGPT/edwardofclt-gamestudio/gap-dash
python3 -m http.server 4172 --bind 0.0.0.0
```

Open http://localhost:4172/ in a modern browser. Use HTTP rather than opening index.html directly because the JavaScript uses modules. If port 4172 is occupied, choose another free port and use that number in the URLs. Do not stop another app's server.

## Phone or tablet on the same Wi-Fi

1. Keep this computer awake and the server terminal running.
2. Connect the phone/tablet and computer to the same Wi-Fi network.
3. On the phone/tablet, open **http://192.168.1.130:4172/** in Safari or another browser. This was the computer's actual LAN address at implementation time; it may change.
4. If it changes, find the current address in macOS System Settings → Wi-Fi → Details → TCP/IP, then open `http://YOUR-LAN-IP:4172/`.
5. Allow Python incoming connections if macOS asks. Guest networks or Wi-Fi client isolation may prevent devices from reaching each other. Use the full `http://` address.

## Play

- Tap anywhere on the playfield, click, or press **Space** to launch to the opposite wall.
- Zip stays at a fixed height. Once launched, you cannot steer; extra taps during flight are ignored.
- Anticipate where the moving gap will be when Zip arrives. You can wait as long as you like.
- Each safe landing earns one point and reverses the next crossing direction.
- Touching the coral gate ends the run. Press **Try again** or Space to reset, then tap/Space to launch.
- Use the pause button or **P** to pause/resume. Space also resumes a paused route.
- Switching tabs/apps or losing window focus pauses the run. Rotation/resizing pauses an active crossing. Resume explicitly when ready.
- The best score saves in this browser when local storage is available. When blocked, the best survives only until the page reloads.
- No sound. Reduced-motion settings remove trails, landing rings, and sparks.

## Implementation

`index.html` and `style.css` provide the responsive frame and accessible native buttons. `game.js` draws the real game geometry and handles input/state. `rules.js` isolates collision geometry and bounded difficulty. All game coordinates are fixed at 400 × 680; the canvas is rendered at up to 3× device pixel density. Simulation uses 1/240-second steps, with a capped elapsed interval after long frame stalls. A full crossing takes 0.46 seconds. The gap follows a sine wave; speed rises gradually from 0.95 to a maximum of 2 radians/second. Difficulty changes only after a landing. Long stalls slow game time instead of causing a sudden large jump.

## Checks

Run the dependency-free rule checks with a recent Node.js:

```sh
node tests/rules.test.mjs
```

Optional browser checks use Playwright and an installed Chrome. The scripts default to the bundled Codex Playwright path on the development machine; override `PLAYWRIGHT_PATH` to an absolute Playwright module directory and `CHROME_PATH` to your Chrome executable as needed. The HTTP server must already be running on port 4172. A WebKit executable can optionally be supplied with `WEBKIT_PATH`.

```sh
node tests/browser-check.cjs
node tests/layout-check.cjs
```

Verified in actual desktop Chrome: touch start, two successive landings, ignored in-flight taps, collision/failure, retry, pause/resume, Space input, best-score reload, blocked-storage fallback, simulated visibility change, and rotation pause. Layouts checked at 320×568, 390×844, 820×1180, 844×390, and 1440×900; screenshots are in `tests/`. Rule checks cover collision boundaries and capped speed. A desktop WebKit touch smoke test also scored a crossing.

Physical iPhone/iPad Safari, Safari toolbar changes, actual device app switching, touch ergonomics, and Wi-Fi access from a second device still need hands-on testing. Desktop WebKit is useful coverage but does not replace those device checks. Landscape remains playable in a narrower portrait panel; portrait is recommended.
