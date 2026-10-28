# Loop Hop

A small, standalone Canvas arcade game. Pip runs clockwise around a mint ring. Tap anywhere in the game or press **Space** to jump outward over the coral spike. One point per complete lap. No double jumps. Speed starts at 1.3 radians/second and climbs by 0.13 each lap, reaching its 2.8 ceiling by lap twelve. Jumps last 0.56 seconds, so timing matters from the first lap. A fresh run gives about 3.4 seconds before the first obstacle.

After a collision, tap to retry (a 250 ms guard prevents an accidental immediate restart). Use the top-right pause button, **P**, or **Escape** to pause/resume. Switching away from the page pauses the run; tap to resume when you return. There is no sound.

## Launch

No installation, build, or network service is required. From the project directory:

```sh
python3 -m http.server 4171 --bind 0.0.0.0 --directory loop-hop
```

Open **http://localhost:4171** on the host computer. Keep the terminal/server running. If Python is named `python` on your machine, use that name instead. If the port is occupied, choose a different unused port and use it in the URLs below; do not stop another app's server.

## Phone or tablet on the same Wi-Fi

1. Connect the computer and iPhone/iPad to the same Wi-Fi network.
2. Open Safari and enter **http://192.168.1.130:4171**. This was the host's detected Wi-Fi address; it may change later. The server listens on all interfaces, but reachability from a second device has not been verified.
3. If that address changes, run `ipconfig getifaddr en0` on the Mac (or check System Settings → Wi-Fi → Details → IP address), and open `http://<that-address>:4171` on the device.
4. Allow incoming connections for Python if macOS prompts. Guest Wi-Fi/client isolation or a VPN can prevent devices from reaching each other.

Portrait is the intended composition; landscape is supported with a smaller ring. The viewport includes safe-area padding for device cutouts. Safari's address bar may remain visible.

Try: start with one tap, jump just before Pip meets the spike, complete a lap, intentionally collide, retry, pause in mid-jump, rotate, and switch apps then return. Best score is saved to this browser's local storage. If storage is unavailable it works for the current page session. Private mode/storage clearing may remove the record.

## Files and checks

- `index.html`, `style.css`, `game.mjs`: accessible controls, responsive presentation, input, drawing, pause, storage.
- `physics.mjs`: fixed-step orbit, jump, triangle collision, lap scoring and capped speed.
- `STORY.md`: original approved story, preserved.
- `rules.test.mjs`: small dependency-free rules suite. Run `node --test loop-hop/rules.test.mjs` from the project directory.
- `checks/browser-check.cjs`: optional Playwright smoke check; screenshots are saved beside it. Requires Playwright available to Node and installed Chrome (uses its `chrome` channel); also tries WebKit if its runtime is installed. Run `node loop-hop/checks/browser-check.cjs`. This is a developer check only; the game itself has no dependencies.

Verified in headless installed Chrome with touch/mobile emulation: start, Space jump, lap scoring, failure, retry, pause/resume, persistent best after reload, blocked-storage fallback, and a simulated page-hidden event. Layouts checked at 390×844, 320×568, 768×1024 and 844×390, including screenshots. Rules checks exercise collision without jumping, rejection of double jump, repeated safe jumps at maximum speed, and deterministic fixed-step timing.

Actual iPhone/iPad Safari, physical touch feel, Safari browser chrome changes, and real OS background/resume behavior have not been verified on hardware. WebKit automation was unavailable on this machine. No audio, installable offline mode, or online features are included.
