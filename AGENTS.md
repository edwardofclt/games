# Project directives

## App organization

- Each app must live in its own dedicated folder within this project.
- Keep each app's source code, assets, dependencies, configuration, and app-specific documentation together in that app's folder.
- Use a descriptive folder name for each app, such as `loop-hop/` or `gap-dash/`.

## GitHub Pages and project index

- Every game prototype must be deployable to GitHub Pages as a static site, with all required runtime assets included in the deployment and no required backend server.
- Each game must have an `index.html` entry point under its own folder in the deployed site, such as `loop-hop/index.html`.
- Use relative links and asset paths, or an explicitly configured repository base path, so games work under a GitHub Pages project URL as well as during local preview.
- Maintain an `index.html` at the project root that lists every game prototype with its name, a short description, and a relative link to its playable entry point.
- Update the root index whenever a game prototype is added, renamed, moved, or removed.
- Document any required build and local preview steps in each game's own `README.md`. Any build output used for deployment must preserve the root index and per-game URL structure.
- Before marking a prototype ready, verify that the root index, game links, and game assets load correctly when served together from the project root, including under a repository URL subpath.
