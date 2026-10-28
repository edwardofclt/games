# iPad and iPhone game concepts — ages 9–12

These are visual concepts, not working apps. The three final mockups were generated with the built-in image-generation tool. Each shows an iPad landscape layout and an iPhone portrait layout. The proposed titles are working names.

## Rescue Grid
**Pitch:** Plan electric rescue-rover routes through a flooded island town, repair bridges and deliver supplies within a limited energy budget.

**Play loop:** Inspect the mission → plot a route → choose repairs → dispatch → watch the plan → revise.
**Example decision:** Spend two energy repairing a bridge to open a shortcut, or preserve repair energy and try a longer road route.
**Why it suits this audience:** Multi-step planning, visible consequences, and room to improve a solution after completing the mission.
**Session target:** 3–6 minutes per puzzle.
**Progression:** New route constraints, a second vehicle type, optional efficiency medals and vehicle paint unlocks.
**Small first release:** One neighborhood, 12 hand-authored puzzles, one rover, one repair drone and three obstacle types.
**Build approach:** A fixed camera and a small road graph can keep the game logic manageable; the apparent 3D scene can be delivered as layered 2D or a compact 3D map.
**Design risk:** The route, road connections and energy cost must remain readable on a phone. Early playtesting should focus on planning and undo.
**Mockup:** rescue-grid.png

## Wild Pocket
**Pitch:** Restore a damaged island by placing habitats that support connected plant and animal needs.

**Play loop:** Inspect a species' needs → place habitat tiles → preview the next day → observe changes → rebalance.
**Example decision:** Use scarce water on reeds that complete a wetland, or flowers that support pollinators and a future objective.
**Why it suits this audience:** Creative ownership plus systems thinking; success can come from different arrangements.
**Session target:** 5–10 minutes per restoration puzzle.
**Progression:** New biomes, a field journal, additional species and optional placement challenges.
**Small first release:** One wetland biome, six habitat pieces, four species and 10 restoration puzzles. Use explicit placement rules rather than a full ecosystem simulation.
**Build approach:** A hex grid and a small rule table can power the prototype. Water and leaf resources are game abstractions.
**Design risk:** Cause and effect must be explained visually. The phone view should allow zooming and selecting larger tiles; the mockup's exact scale needs testing.
**Mockup:** wild-pocket.png

## Monster Food Truck
**Pitch:** Invent strange dishes for quirky monster customers by combining ingredients and preparation methods.

**Play loop:** Read a flavor request → choose ingredients → chop, sizzle or blend → inspect flavor changes → serve → see the customer's reaction.
**Example decision:** Sizzling an ingredient could increase heat but reduce crunch, so another ingredient may be needed to balance the dish.
**Why it suits this audience:** Humor, experimentation and discovering combinations instead of only copying a recipe.
**Session target:** 2–5 minutes per order set.
**Progression:** A recipe journal, new customers, truck decorations and new food locations.
**Small first release:** One truck, six ingredients, three preparation methods, five customers and 10 recipe challenges.
**Build approach:** Defined ingredient attributes and method modifiers can create variety without simulating cooking.
**Design risk:** Recipe discovery needs understandable feedback, and customer reactions need enough animation variety to stay rewarding.
**Mockup:** monster-food-truck.png

## Recommended first prototype
Start with Rescue Grid. One map, one rover, a repair action and three puzzles should be enough to test whether route planning and replay are fun. Its rules are more contained than ecosystem balancing, and it needs less character animation than the food truck.

## Shared product direction
- Design for ages 9–12, with readable text, strong iconography and an art style that avoids a preschool feel.
- Use the iPad's space for simultaneous map and inspector views. Reflow inspectors into bottom sheets on iPhone.
- Keep sessions bounded and allow pause, undo and retry.
- Aim for offline single-player play, local saves and a one-time paid release as an initial product direction.
- These visuals have not been validated for touch-target size, accessibility, performance or actual enjoyment. Test a small playable prototype before investing in the full art set.
- Full generation prompts are saved in prompts.json.
