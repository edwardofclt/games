# Little Familiars

A static, cozy pet-care game inspired by the supplied dark collectible UI. The approved scope is a playable prototype with simulated purchases.

## Experience
A charcoal and teal interface frames a moonlit pet room. The player feeds, waters, cleans, plays a five-star catching activity, and pets a companion. Every useful interaction builds bond and growth. A balanced care round rewards variety. Pets progress from baby to youngster to grown companion. Starter dog, cat, and hamster are free; rabbit, fox, dragon, and starter coat variations use clearly labeled simulated purchases with confirmation, no payment details or money.

## Implementation decisions
Buildless HTML, CSS, ES modules, local original art. All assets and source stay inside little-familiars. No remote runtime dependencies. Every adopted pet keeps separate stats, nickname, growth and bond; localStorage stores validated versioned state. Care declines gently with elapsed time, capped after long absence; no death. Growth is accelerated for a prototype. Full meters limit rewards to discourage endless button spam. Play rewards require completing the activity. Mobile layout stacks panels and supports keyboard and touch.

## Completion criteria
All care actions affect the selected pet, growth and bond are visible, all free pets can be adopted, paid items require explicit simulated confirmation, refresh preserves progress, corrupt/unavailable storage is handled. Root directory includes a game card. Verify desktop/mobile layouts and all assets under both root and repository prefix.
