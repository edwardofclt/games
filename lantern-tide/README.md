# The Lantern Beyond the Tide — Brindle Harbor

A playable 3D visual prototype for the Vesper Island story. Explore a miniature harbor, meet Mira, collect three lantern sparks, find a blade, open the Rootbound Garden, light its braziers, defeat a charging guardian, and restore the first beacon. An optional fisherman’s bell quest and twelve shell collectibles are included.

This is a short opening slice, **not the proposed 40-hour campaign**. Its original procedural models establish a rounded miniature art direction inspired by the Nintendo Switch remake of *Link’s Awakening*. It does not use Nintendo artwork or claim equivalent finished production quality.

## Run locally

No installation or build step is required. Serve the entire project root:

```sh
python3 -m http.server 4186 --bind 0.0.0.0 --directory /Users/eherbert/Documents/ChatGPT/edwardofclt-gamestudio
```

Open <http://localhost:4186/lantern-tide/> or choose the game from <http://localhost:4186/>. Use a different available port if necessary. For a phone or tablet on the same Wi-Fi, replace `localhost` with the Mac’s local network address; firewall and network access must permit the connection.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move | WASD / arrow keys | D-pad, or click/tap clear ground |
| Talk, collect spark, open chest, light brazier, enter/exit garden | E | E button / contextual prompt |
| Advance dialogue | E / Space | Continue button |
| Sword | Space / J | Sword button |
| Roll | Shift / K | Roll button |
| Journal and quest guidance | Q | Journal button |
| Pause | Escape | Pause button |
| Music | Sound button | Sound button |

Click-to-walk follows a direct route, slides around shallow obstacles, and stops when blocked; use the directional controls to navigate around buildings. Music is an optional synthesized melody, initially muted. No audio is downloaded.

Meet Mira beside the starting path. The sparks are west of the well, north of the well, and beside the southern pier. The blade is in the chest east of Mira’s workshop. Take the three sparks to the northeast garden gate, interact once to open it, then again to enter. Light the three braziers. The guardian flashes red before charging; roll aside, wait for its green core to become exposed, then strike with the sword. Four hits defeat it. Light the beacon and return to Mira to finish.

Five hearts, a safe retry, a journal, pause controls, and browser-local autosaving are implemented. Autosaving occurs after important actions and periodically during play. Continue restores progress and area. Restarting requires confirmation. If storage is blocked or corrupt, the game remains playable but progress may not persist. An active guardian encounter resets on reload; lit braziers persist.

## Deployment to GitHub Pages

Publish the **project root** with its root `index.html` and each app folder intact. This game lives at `lantern-tide/index.html` and works under a repository prefix such as `/edwardofclt-gamestudio/lantern-tide/`. All runtime JavaScript and CSS use relative URLs. Three.js and its rounded-box helper are bundled in `vendor/` with the MIT license. Models, materials, water, environment lighting, and music are created locally by the game. There is no backend, external font, CDN, API key, package installation, or network asset dependency at runtime.

WebGL 2 is required. Graphics performance and touch feel vary by device. Desktop Chromium and emulated phone/tablet layouts are covered by the browser check; that does not substitute for physical-device Safari and performance testing.

## Verification

```sh
node --test lantern-tide/tests/rules.test.mjs
node lantern-tide/tests/browser-check.cjs
```

The browser check uses this Mac’s bundled Playwright package and installed Google Chrome. Override `PLAYWRIGHT_PATH` or `CHROME_PATH` if needed. It starts its own temporary static server, checks the root index and repository-prefix deployment, plays the main quest and optional bell quest through the actual UI/game rules, tests keyboard movement/collisions/save/reload, checks responsive controls, and captures the real WebGL output under `tests/screenshots/`.

The opt-in `?test=1` query exposes a small test harness for positioning and inspecting game state. Ordinary play does not expose it.

## Files and art direction

- `art.mjs`: original geometry, materials, prop construction, world layout, water, and static mesh batching.
- `main.mjs`: lighting, follow camera, tilt-shift effect, characters, input, dialogue, quest interactions, guardian behavior, audio, and saves.
- `rules.mjs`: progression, save validation, shoreline collision boundary, and objective text.
- `index.html` / `style.css`: title screen, HUD, conversations, journal, touch controls, and error state.
- `vendor/`: Three.js r170 and RoundedBoxGeometry. The helper’s import is rewritten to the local module.
- `tests/`: progression checks, browser integration checks, and screenshots.

The visual direction uses rounded geometry, individual roof tiles, warm directional light, soft contact shadows, an environment reflection, animated water, a gentle edge blur, and a restrained game HUD. Further production work would focus on sculpted hero animation, richer terrain, authored texture work, environmental storytelling, additional creatures, and more nuanced encounters.

## Verified on 2026-10-30

Eight quest/save-rule tests and 58 browser checks passed. The browser run completed the required quest and the optional bell quest, verified combat vulnerability timing and save/reload, exercised keyboard and touch input, checked desktop plus 320×568, 390×844, 844×390 and 820×1180 layouts, and loaded the studio and game under both root and repository-prefix URLs. No JavaScript/WebGL errors or failed runtime asset requests were recorded. Screenshots show the actual renderer. Physical-device Safari, sustained hardware performance, and the full proposed campaign are not covered by this prototype.
