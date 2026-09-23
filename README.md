# Design Challenge Generator

Random product design practice challenges: mobile screens, web apps,
dashboards, design systems, motion, data viz, UX research and more. Like a
challenge to unlock a short brief with what to think about, what to avoid, and
a "done when" checklist.

- **600 challenges** across 11 categories and 3 levels, drawn at random without
  repeats until you've seen the whole pool.
- **Private by design.** No accounts, no server, no tracking. Your likes,
  checklist progress, recent challenges, filters and theme are saved in your
  own browser.
- **Shareable links.** Every challenge has its own URL (`#/c/42`).
- Light and dark mode, keyboard shortcuts (`Space` next, `L` like, `C` copy),
  and a bottom sheet for likes on mobile.

## Run it locally

Requires Node 18+. There are no dependencies to install.

```bash
npm start
```

Open http://localhost:4600.

## Deploy

The site is fully static: everything in `docs/` is the app.

**GitHub Pages:** *Settings → Pages → Build and deployment → Deploy from a
branch → `main` / `/docs`*. Every push to `main` updates the site.

**Anywhere else** (Netlify, Vercel, Cloudflare Pages, etc.): no build command,
publish directory `docs`.

## Project layout

```
docs/                                The whole app (served by GitHub Pages)
  index.html, styles.css, app.js     UI
  theme.js                           Applies the saved theme before first paint
  600_design_practice_prompts.txt    The challenge library
  lib/prompts.js                     Parses the library, random draws without repeats
  lib/brief.js                       Brief content per task, product domain and constraint
  lib/api.js                         Data layer backed by the visitor's localStorage
  concepts.html                      Earlier layout explorations, kept for reference
scripts/check.js                     Validates the library (npm test)
server.js                            Tiny static server for local development
```

## Adding or editing challenges

Each line in `docs/600_design_practice_prompts.txt` looks like this:

```
001. [Beginner] [Mobile screens] Design ... for a <domain> product. <Constraint sentence>
```

Briefs are matched by the task text, the product domain and the constraint
sentence, using the tables in `docs/lib/brief.js`. After editing, run:

```bash
npm test
```

It tells you exactly which challenge is missing brief content and where to add
it.

## Privacy

Saved data lives in `localStorage` under keys starting with `dcg:`. Clearing
your browser's site data resets everything. See [SECURITY.md](SECURITY.md) for
details.

## License

[MIT](LICENSE)
