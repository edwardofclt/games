# Dawn Isle — first playable chapter

Status: opening approved by the user on 2026-10-28; first-chapter prototype implemented and verified in engine tests and Chromium. Physical device playtesting remains.

## Intent

Make an original compact top-down action adventure inspired by the exploration, combat, item progression, dungeon puzzles, and approachable presentation of the Game Boy Color era. The user specifically named Link's Awakening as the reference, likes chosen heroes and a fallen world, and wants a straightforward story. Use original characters, maps, sprites, music, and writing.

The intended audience is ages 9–12, with testing on iPhone, iPad, and desktop. Prioritize understandable goals, enjoyable movement and combat, and satisfying discoveries over elaborate lore.

## Story

Monsters have overrun Dawn Isle and its three watchfires have gone dark. An ancient shrine chooses a young villager to carry its blade, rekindle the watchfires, and open the way to the Night Warden's fortress.

The first chapter begins in a surviving village. Its keeper gives the hero the shrine blade and a shield. The immediate objective is to reach the old watchtower, defeat its guardian, and relight the first watchfire. Completing that goal ends this prototype with a clear chapter-complete screen. The other watchfires and the final fortress belong to a potential later game, not this implementation.

Keep conversations to a few short lines. Use one hero, one keeper, one optional villager, and one named antagonist. The hero's appearance is an implementation choice: red scarf, amber jacket, dark hair, no pointed cap.

## Art and presentation

Flat overhead tile maps, small sprites, hard pixel edges, limited per-area palettes, and simple animation. Aim for a 160×144-style view with 16-pixel tiles, enlarged without smoothing. This is a GBC-inspired visual constraint, not a claim of hardware emulation. Keep a compact HUD for three hearts and the equipped item. Original drawn pixel sprites must remain legible at phone size; generated concept images are visual references, not a runtime screenshot background.

Use a real gameplay viewport with touch controls outside it when possible. Landscape places a D-pad beside the view; portrait places controls below. Both orientations must fit without hiding the play area or action buttons. Include safe-area padding and a normal page link back to the project index.

## Connected overworld

- Village: keeper, optional villager, shrine and a safe starting area.
- Greenway: introduces one enemy and a shield-blocking encounter.
- Watchtower courtyard: first dungeon entrance and a visible gap that the hero can revisit after finding the boots.
- Small optional shore: a recoverable health pickup and a side path; keep it small enough to omit if it would delay core play.

The player walks between authored screens through explicit exits. Each exit has a matching arrival tile in its destination. Walls, water, trees and pits have collision. A blocked route should look blocked. The courtyard gap leads to a shortcut back toward the village once the player has the boots.

## Dungeon and progression

Use five compact rooms with a readable return route:

1. Entry: the hero can always return to the courtyard.
2. Trial: defeat its enemy to unlock the next door.
3. Boots room: an open chest gives the Gust Boots once; a short safe gap teaches their use, and the route back remains available.
4. Bridge room: cross a one-tile pit with the boots to reach the guardian door. This gate makes the boots necessary for progression.
5. Guardian room: defeat the guardian to reveal the watchfire; interacting with it completes the chapter.

Keep this first dungeon to enemy-gated doors, a chest and pits; there is no consumable key economy. The boots must remain acquired after returning between rooms. Completed door/chest/boss states must not reset and trap the player. Permanent flags are authoritative: a cleared trial always leaves its door open, and a defeated guardian always reveals the watchfire even if the player quit before lighting it.

## Actions and combat

Movement is four-directional, with normalized movement if diagonals are accepted. The sword swings in the facing direction with a short visible arc and a defined cooldown. A hit may damage a particular enemy only once per swing. Receiving a hit removes one heart, applies brief knockback and gives visible temporary invulnerability.

The shield blocks incoming damage from the direction the hero faces, not from behind. It slows or stops walking while held. Gust Boots provide a brief burst across a single pit. They do not pass through walls, closed doors or enemies; check the swept movement path so large animation frames cannot skip collision. A pit crossed successfully has a valid landing tile. Falling into a pit costs one heart and returns the hero to the last safe position.

The guardian telegraphs a charge. The hero dodges with the boots; the guardian hits a wall and exposes its vulnerable state, allowing sword damage. Repeat a few times to win. Do not require pixel-perfect timing. Use a clear arena without pits so the guardian can always reach a wall and the hero has enough room to dodge. The boss may be a large original stone beetle rather than a humanoid character.

At zero hearts, show a retry action that restores health at a known safe checkpoint. Preserve acquired items and completed permanent objectives. Reset transient enemies as necessary so a retry cannot create a soft lock.

## Controls

Keyboard: arrows or WASD move; Space or J attacks, or talks/interacts when facing an interactable; K uses the equipped item; the inventory slot or I swaps shield and boots after the boots are acquired; Escape pauses. Dialogues advance with the action button. A reachable interactable in the facing direction takes priority over an attack. Shield is hold-to-use; boots activate on a fresh press. Releasing input or switching items cancels shielding.

Touch: D-pad, A for sword/interact, B for equipped item, a tappable item slot to swap, and a small pause control. Track simultaneous movement plus action through pointer IDs. Releasing a pointer, losing focus or changing orientation must clear held controls. Page hiding pauses the game, and return requires a deliberate resume. No accidental page scrolling during play.

## Saving and deployment

Autosave a small validated state: acquired items, completed dungeon gates, guardian/watchfire completion, and a safe checkpoint. Never persist a midair, mid-charge or half-dead transient state. Saved checkpoints beyond a boots-required gap must imply boots ownership; an invalid combination falls back to an earlier safe checkpoint. Arrival, retry and pit-recovery tiles must be walkable, outside enemy overlap and outside immediate exit triggers. Invalid or unavailable localStorage must fall back safely to a new/in-memory game. Include an explicit restart-chapter action separate from retry.

Use standalone HTML, CSS and JavaScript modules under `dawn-isle/`, with all runtime assets local and all paths relative. No backend, runtime CDN dependency, account, or paid service. Add a root `index.html` listing the existing playable games and Dawn Isle, with relative playable links. Do not list concept-only folders as playable games. Include game-local launch/build instructions in `README.md`; a no-build static implementation is preferred.

## Prototype acceptance

- A normal player can start, talk to the keeper, traverse the overworld, complete the dungeon, defeat the guardian and reach a chapter-complete screen.
- Blocking terrain and room transitions are consistent; the hero cannot leave the map accidentally.
- Directional shielding, attack cooldowns, pit crossing, death/retry and permanent progression have focused rule checks.
- Touch movement and actions work together, and pause/background handling cannot leave a stuck input.
- Save/reload and blocked or corrupted storage are exercised.
- Browser checks cover phone portrait, phone landscape, and tablet layouts, with screenshots inspected.
- The root index, each linked game and all runtime assets load when served from the project root and from a repository-style URL prefix.
- Report physical iPhone/iPad checks separately from browser emulation; do not imply hardware testing occurred when it did not.

## Decisions made for this proposal

The working title, island/watchfire story, hero appearance, Gust Boots, guardian design, first-chapter scope and no-build Canvas implementation were assistant proposals approved as an opening by the user. The user's fixed direction is a game like Link's Awakening, a flat GBC-style top-down view, a heroic story, and the project organization/deployment directives.
