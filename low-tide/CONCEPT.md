# Low Tide
Status: proposed concept, not an approved implementation plan or playable game.
Audience: ages 9–12.
Format: a compact, finite top-down adventure for iPhone and iPad with a flat Game Boy Color-inspired tile-map presentation.
Working title: Low Tide.

## The opening
You wake up to silence where the waves should be. The water has withdrawn from the harbor, leaving boats on the sand and exposing paths nobody has walked in generations.

Your older brother Finn went down to investigate before sunrise. He has not returned. On the harbor floor you find his blue boat, his yellow scarf and chalk arrows pointing toward a passage beneath the old lighthouse.

The first goal is direct: follow his trail and bring him home.

## What the player does
Walk through connected maps, talk to people, examine clues and solve environmental puzzles with a rope-hook. The tool can pull loose objects into place, draw a floating raft closer and retrieve objects across small gaps. Puzzles are built from those understandable uses.

The core cycle is: notice something strange, explore it, work out how to reach it, and discover a clue or a new route. Light creature hazards can create movement challenges without requiring a battle or leveling system.

A D-pad or touch movement plus a contextual action button is enough for the first prototype.

## The plot
### 1. The empty harbor
Follow Finn's trail from the town to the stranded boats and the exposed wreckyard. Conversations and physical clues establish that the lighthouse lit up during last night's storm, despite being abandoned.

The first small puzzles teach the rope-hook while answering an immediate question: which way did Finn go?

### 2. Beneath the lighthouse
The wreckyard leads into old tidal passages and the ruins of the lower harbor. You find Finn in a gatehouse. The storm damaged a forgotten system of sea gates. He is holding its emergency brake; letting go would release a dangerous surge toward town.

Finding him changes the goal naturally. You now need a safe route home for both of you.

### 3. Bring the water back
Explore the adjoining gate chambers, secure the damaged mechanism and reconnect its controls. Restoring sections changes the water level in specific places: a dry path becomes a raft crossing, a jammed boat floats free, and an old route becomes a shortcut.

There is no real-time countdown in the proposed first version. Water changes happen through explicit story actions, allowing the player to explore and solve puzzles at their own pace.

### 4. Home
You and Finn return by boat as the harbor refills safely. The ending revisits the opening view: boats floating at their moorings, the shop reopened and the lighthouse working. People remember what you did. The journey has a definite conclusion.

## Progress and rewards
Progress is represented by meaningful changes in the adventure:
- A clue answers a question or suggests a destination.
- A solved puzzle opens a route.
- A repaired gate changes part of the map.
- Finding Finn advances the central relationship and objective.
- The final repair restores the harbor and resolves the story.

Optional discoveries can include old ship nameplates and sketches of the former harbor, revealing local history. They should enrich exploration without gating the main ending.

## Visual direction
Flat overhead maps, chunky tiles, compact sprites, simple front-facing building walls, restrained animation and a limited warm-sand/teal/navy palette. Short dialogue boxes and a small tool display keep the world readable. The mockup is visual direction, not a verified hardware-accurate GBC asset specification.

## First playable slice
The town entrance, dry harbor and first tidal passage. Introduce Finn's disappearance, find his boat, learn the rope-hook through one traversal puzzle, and discover the first gate mechanism. End on a tangible mystery reveal rather than an arbitrary score target.

## Files
- concept/mockup.png: generated gameplay visual.
- concept/generation-prompt.json: complete prompt, using the built-in image_gen tool.
