# Dawn Isle — The First Watchfire

An original, flat, pixel-art action-adventure prototype inspired by Game Boy Color-era exploration and puzzle dungeons. This is a complete opening chapter, through the first watchfire; the rest of the proposed island campaign is not implemented.

## Play locally

No installation or build is required. Serve the **project root**, so the studio index and sibling games work together:

```sh
python3 -m http.server 4170 --bind 0.0.0.0 --directory /Users/eherbert/Documents/ChatGPT/edwardofclt-gamestudio
```

Open http://localhost:4170/ for the studio, or http://localhost:4170/dawn-isle/ for this game. If the port is occupied, use another available port and adjust the URL; leave other games' servers alone.

For an iPhone/iPad on the same Wi-Fi, replace `localhost` with the Mac's Wi-Fi address. On this Mac, `ipconfig getifaddr en0` can report it. Keep the Mac awake and the server running. Physical device access also depends on local firewall and network settings.

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move | D-pad | Arrows / WASD |
| Sword, talk, chest, watchfire, advance dialogue | A | Space / J |
| Guard | Hold B with shield equipped | Hold K |
| Dash | Press B with boots equipped | Press K |
| Swap shield / boots | Item slot | I |
| Pause / resume | Pause button | Escape |

Face a person or object before pressing A. A nearby interactable in front of you takes priority over the sword. Shielding only protects the direction you face. Movement and action can be held together on touch devices.

The game pauses on loss of focus, hidden page, or resizing. Resume deliberately. Rotating does not change world geometry. There is no audio in this prototype.

## Your quest

Speak to the keeper by the shrine. Follow Fernway east to the old watchtower. Clear the trial, find the Gust Boots, cross the broken bridge, and defeat the guardian. Interact with the revealed watchfire to finish the chapter.

The guardian flashes before charging. Dodge, wait for it to hit a wall, then strike its exposed core. The optional shore south of Fernway restores health. A pit costs one heart and returns you to safe ground.

Progress saves automatically in the current browser when storage is available. Acquired equipment, cleared trial, defeated guardian and watchfire completion survive retries and reloads. Death restores full hearts at a safe checkpoint. **Restart chapter** is a separate confirmed action that resets progress. Blocked/corrupt storage falls back safely; private browsing or clearing site data can remove progress.

## GitHub Pages / static hosting

Publish the project root with its root `index.html` and all game folders. This game's entry point is `dawn-isle/index.html`. There is no backend, build step, external font, CDN, fetch-based data file, or remote runtime asset. Maps and original pixel artwork are included in local JavaScript modules.

All scripts, styles and navigation use relative URLs. The same folder structure works at a domain root or a project prefix such as `/edwardofclt-gamestudio/dawn-isle/`. `concept/` contains design references and is not loaded by the game. Keep sibling game runtime files when publishing the whole studio.

## Developer verification

```sh
node --test dawn-isle/tests/*.test.mjs
```

The full-campaign test plays through the required rooms using movement and actions, including the item gate, guardian and completion. Focused checks cover directional guard, sword hit limits, dash/pit/wall collision, safe retry and save validation.

For browser checks, start the normal root server above and, separately:

```sh
python3 dawn-isle/tests/prefix-server.py --port 4175
node dawn-isle/tests/browser-check.cjs
```

The browser test uses Playwright plus installed Chrome. Set `PLAYWRIGHT_PATH` to the installed Playwright package if it is not at this machine's bundled runtime path; optionally set `CHROME_PATH`, `GAME_ROOT` and `PREFIX_ROOT`. These are developer-only tools, not game dependencies. Screenshots are written under `tests/screenshots/`.

Browser emulation does not establish physical iPhone/iPad Safari touch feel, home-indicator behavior, browser chrome resizing or performance. Those remain hands-on playtest checks.

Verified on 2026-10-28: 14 Dawn Isle rule/campaign checks passed, including a fresh-game full route. Chromium passed the UI/input/save checks and five layouts (320×568, 390×844, 844×390, 820×1180, 1180×820). All four studio games and runtime assets loaded from both the project root and repository-style prefix without HTTP errors. Desktop WebKit could not run because its executable is not installed. A fast player can defeat the guardian within one stun; boss pacing is intentionally left forgiving for this first playtest.

## Files

- `world.mjs`: authored maps, objects and exits.
- `engine.mjs`: simulation, combat, progression, checkpoints and validated save data.
- `render.mjs`: original pixel font, sprites, tiles and drawing.
- `art.mjs`: original editable pixel patterns for directional hero poses, villagers, foliage and objects.
- `main.mjs`: browser input, menus, pause, save adapter and animation loop.
- `index.html`, `style.css`: responsive page and touch controls.
- `DESIGN.md`, `IMPLEMENTATION.md`, `concept/`: approved scope, execution record and visual direction.

## Art revision

The playable renderer now uses directional character sprites, distinct keeper/villager designs, larger foliage silhouettes, connected dirt paths, shoreline edges, roof/window details, a bottom HUD and dungeon torches. The visual-only changes preserve maps, combat and progression rules. `tests/art-review.html` shows four static scenes drawn by the actual runtime renderer; these are not AI concept images or a separate art implementation.
