# Geography of the Twenties

A Jeopardy-style review game pairing U.S. History geography with the road into World War I, built to go alongside the Roaring Twenties Jeopardy game.

## Play it online
Once GitHub Pages is turned on for this repo (Settings -> Pages -> Deploy from branch -> `main` / root), the game will be live at:

https://jimmaoscott-lang.github.io/roaringtwentiesgeography/

## Play it locally
Open `index.html` in any browser. No install, no build step.

## Categories
- **Geography: USA** — Harlem, the Great Migration, Detroit's auto industry, the Texas oil boom, the Scopes Trial
- **Geography: Europe & WWI** — the Lusitania, the Zimmermann Telegram, the Meuse-Argonne Offensive, the Treaty of Versailles, the 1924 immigration quotas

All five Europe clues are scoped to what shows up in U.S. History itself (why the U.S. entered WWI, where U.S. troops fought, the peace treaty, and the immigration law that followed) rather than general European history.

## Maps
Every map is drawn as inline SVG from real, public-domain boundary data:
- U.S. state boundaries: U.S. Census TIGER lines via the `us-atlas` npm package
- Europe and world country boundaries: Natural Earth data via the `world-atlas` npm package

These are not screenshots or licensed map images — just real geographic boundary coordinates projected and drawn as paths, the same way an atlas or a GIS tool would. City pins and routes (like the Great Migration arrows or the Zimmermann Telegram's Berlin-to-Mexico-City line) are plotted at their real latitude/longitude using the same projection as the underlying map, so everything lines up accurately.

## Editing questions
All clues and their map configuration live in the `CATEGORIES` array near the top of the script in `index.html`. Each clue's `map` object specifies which region to draw (`us`, `europe`, or `atlantic`), which areas to highlight, and which city pins or routes to show — see `map-data.js` for the available state/country names and city coordinates.
