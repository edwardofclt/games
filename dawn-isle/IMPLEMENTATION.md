# Dawn Isle Implementation Plan

**Goal:** Build the approved first chapter through the first watchfire.
**Spec:** DESIGN.md, approved by the user on 2026-10-28.
**Architecture:** Standalone Canvas app; pure state/rules, authored rooms, pixel renderer, and browser input/save adapter. No build or runtime dependencies.
**Constraints:** App-local files; original assets; root static index; relative URLs; phone/tablet touch and keyboard; explicit chapter completion.

## Task 1 — campaign rules and maps
- [x] Write and run failing behavior tests for directional shield, invulnerability, sword hit limits, dash collision/pits, permanent progression, safe save/retry and chapter completion.
- [x] Implement `world.mjs` and `engine.mjs`: `makeGame`, `tick`, `act`, `useItem`, `equip`, `hitPlayer`, `enterRoom`, `retry`, `toSave`, `fromSave`.
- [x] Run `node --test dawn-isle/tests/engine.test.mjs`; require all passing.

## Task 2 — playable presentation
- [x] Implement original pixel tiles/sprites and `render.mjs`, then HTML/CSS/browser adapter.
- [x] Check actual keyboard and touch actions, dialogue priority, pause/release, five device layouts and save fallback in a browser.

## Task 3 — deployment and review
- [x] Add project root index with all four playable games, app README and local preview.
- [x] Check full chapter in engine simulation, browser completion flow and root/subpath loading without failed assets.
- [x] Run the repository's game rule suites, inspect screenshots and obtain an independent final review.

## Review focus
Checkpoint after boots cannot soft-lock; guardian must expose watchfire after reload; interrupted input cannot remain held; dash must not tunnel through walls; root/subpath relative URLs must resolve.

## Execution ledger
- Setup: feature branch `codex/dawn-isle-prototype`; current checkout retained so the project and local preview stay together. Changes scoped to `dawn-isle/` and root index. No worktree, publish or push.
- Ruling: implement inline as a compact prototype; retain app-local plan/verification record rather than introducing project-wide build machinery.
- Task 1 complete: 14 Dawn Isle rule/campaign checks pass. Full campaign uses actual movement/actions from fresh game through guardian and watchfire, with no progression injection.
- Task 2 complete: Chromium checks passed keeper, equipment, real two-pointer input, pause, five layouts, chest/save/reload, completion/save/reload, confirmed reset, hidden-page pause and denied storage. Late-stage browser checks use explicit saved-state fixtures; they are not a full combat playthrough in a physical browser.
- Task 3 complete: all four games and assets loaded under root and `/edwardofclt-gamestudio/`; combined repository rule run passed with 29 reported Node tests (the Gap Dash suite additionally reports nine internal checks).
- Final review fixes: shortcut water arrival/approach repaired; graph-wide safe-arrival and both-direction shortcut checks failed then passed. Living enemy bodies added to swept dash collision; focused test failed then passed. Full campaign remained passing.
- Final: minor (deferred): guardian can be defeated during one stun by a quick player. This is forgiving first-encounter balancing; additional charge-cycle pacing can be tuned after family testing.
- Final: Ruling: physical Safari touch/performance remains a device playtest; desktop WebKit runtime is unavailable. No audio is included. These limitations are documented rather than represented as tested features.
- Final delivery: changes left on local feature branch; no publication, push or merge performed. Root preview server uses port 4170; prefix-verification server uses 4175.
- User visual feedback pass: replaced placeholder pixel patterns with directional hero art, distinct NPCs, foliage, chest, building/terrain details and bottom HUD. Added runtime-rendered art review page. Rules and map collision are unchanged; browser/static-prefix verification rerun against the new art module.
