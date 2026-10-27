# Geography of the Twenties

Two full Jeopardy-style review games — one on U.S. geography, one on Europe and the road into World War I — built to go alongside the Roaring Twenties Jeopardy game. Each game is a standalone 5-category, 25-clue board with two parallel question sets and support for solo play or up to four teams.

## Play it online
Once GitHub Pages is turned on for this repo (Settings -> Pages -> Deploy from branch -> `main` / root), the games will be live at:

- Landing page: https://jimmaoscott-lang.github.io/roaringtwentiesgeography/
- Geography: The United States — https://jimmaoscott-lang.github.io/roaringtwentiesgeography/us-geography.html
- Geography: Europe & the Great War — https://jimmaoscott-lang.github.io/roaringtwentiesgeography/europe-geography.html

## Play it locally
Open `index.html` to get to both games, or open `us-geography.html` / `europe-geography.html` directly. No install, no build step.

## Geography: The United States
- Great Migration Routes
- Industrial Boomtowns
- Harlem & the Jazz Circuit
- Immigration Gateways
- Scopes Trial & Bible Belt Geography

## Geography: Europe & the Great War
- The Western Front
- Alliance System Before the War
- The U-boat War & the Lusitania's Route
- Versailles' New Borders
- 1924 Immigration Quotas by Region

All five Europe categories are scoped to what shows up in U.S. History itself (why the U.S. entered WWI, where U.S. troops fought, the peace treaty, and the immigration law that followed) rather than general European history.

## Players and sets
Each game's setup screen lets the teacher pick:
- **Solo, 2, 3, or 4 players/teams** — Solo mode hides the "Turn" button and just tracks one running score.
- **Set 1 or Set 2** — two full sets of 25 clues per game, so you can run the same board in back-to-back class periods without repeating questions.

## Maps
Every map is drawn as inline SVG from real, public-domain boundary data:
- U.S. state boundaries: U.S. Census TIGER lines via the `us-atlas` npm package
- Europe and world country boundaries: Natural Earth data via the `world-atlas` npm package

These are not screenshots or licensed map images — just real geographic boundary coordinates projected and drawn as paths, the same way an atlas or a GIS tool would. City pins and routes (like the Great Migration arrows or the Zimmermann Telegram's Berlin-to-Mexico-City line) and the U-boat danger zone are plotted at real latitude/longitude using the same projection as the underlying map, so everything lines up accurately.

## File structure
- `index.html` — landing page linking to both games
- `us-geography.html` / `europe-geography.html` — the two games; each defines its own `GAME_SETS` (clue content) and loads the shared engine
- `engine.js` — shared board/scoreboard/timer/sound/Daily-Double engine used by both games
- `style.css` — shared Art Deco-styled theme (light and dark mode)
- `map-data.js` — the real boundary/city data for all three map regions (`us`, `europe`, `atlantic`)

## Editing questions
Each game's clues live in the `GAME_SETS` array near the top of its HTML file. Each clue's `map` object specifies which region to draw (`us`, `europe`, or `atlantic`), which areas to highlight, and which city pins, routes, or zones to show — see `map-data.js` for the available state/country names and city coordinates.
