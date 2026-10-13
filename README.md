# OpenQuacks
Free version of a medieval, fun, push-your-luck game.

Prompts by Gemini 3; Art by Nano Banana 2, animation by Veo 3. Code by Gemini Canvas.

Play at: https://doonch.github.io/OpenQuacks

On iPhone/iPad, the in-app Settings → "How to Install on iPhone" walks you through Add to Home Screen. Once installed, the game runs full-screen with offline support.

File any issues or contribute to the code here.

## Project Architecture & File Structure

The codebase is organized into modular files separating HTML markup, styles, game data, core simulation logic, canvas rendering, and app initialization:

```
├── index.html              # Main HTML markup: board layout, panels, and modals
├── css/
│   └── style.css           # UI styles, theme variables, responsive layout, animations
├── js/
│   ├── data.js             # Game constants, ingredient book sets (1-4), track maps, i18n helper
│   ├── sprites.js          # Sprite sheet coordinates, asset preloading, cookies & preferences
│   ├── engine.js           # Core game engine: QuacksPlayer, GameController, and Bot AI logic
│   ├── ui.js               # QuacksUIManager: Canvas rendering, animations, audio, modals, tutorial
│   └── app.js              # Bootstrap entry: PWA registration, language detection, game setup
├── lang/                   # Localization JSON files (en, es, he, ar, fa, de, ja, etc.)
├── assets/                 # Sprite sheets, video backgrounds, icons, and audio
├── manifest.json           # Progressive Web App (PWA) manifest configuration
└── sw.js                   # Service Worker for offline caching and media range requests
```

### Module Responsibilities

- **`index.html`**
  Contains the structural markup of the game: Cauldron canvas container, player rosters, status headers, control buttons, and 9 modal overlays (Shop, Bag View, Character Select, Settings, Ingredient Books, Game Over, and Action Prompts). It imports the modular scripts in dependency order.

- **`css/style.css`**
  Defines CSS custom properties (colors, dimensions, safe area insets for mobile devices), board grid layouts, responsive breakpoints for portrait/landscape screens, modal overlay styling, and animation keyframes.

- **`js/data.js`**
  Houses immutable and configurable game data:
  - Global `I18N` store and `t(key, fallback)` translation helper.
  - Pot board spiral track score, rubies, and coin mappings (`TRACK_DATA`).
  - All four Ingredient Book Sets (`INGREDIENT_BOOKS_SET_1` through `SET_4`) detailing token rules and prices.
  - Fortune Teller card deck definitions and Achievement catalogs.

- **`js/sprites.js`**
  Manages graphic asset definitions and helper utilities:
  - Sprite sheet grid mappings (`CHIP_SPRITE_MAP`, `UTIL_SPRITE_MAP`, `CHAR_SPRITE_MAP`, `BOOK_SPRITE_MAP`).
  - Helper functions for creating inline sprite elements (`createChipSprite`, `createUtilSprite`).
  - Cookie helpers and player preference storage (sound volume, fast AI mode).
  - `AssetManager`: handles preloading and caching of sprite images and textures.

- **`js/engine.js`**
  Contains pure game logic and simulation state, decoupled from the DOM:
  - **`QuacksPlayer`**: Manages individual player state (bag tokens, drawn chips, pot position, victory points, rubies, rat tails, character powers) and AI bot heuristics (evaluating draw risk, purchasing strategies, power activations).
  - **`GameController`**: Governs round transitions (Day 1 through 9), round phases (Brewing, Evaluation, Market/Buying, Cleanup), fortune teller events, and game-over conditions.

- **`js/ui.js`**
  Implements **`QuacksUIManager`**, coordinating user input and visual presentation:
  - High-performance HTML5 Canvas rendering for the pot track spiral, chip placement, droplet marker, and explosion visual effects.
  - Audio synthesizer & sound effect playback using the Web Audio API.
  - Modal dialog controllers and inventory visualizers.
  - Interactive onboarding tutorial system with a subtle top-corner skip option.

- **`js/app.js`**
  Application entry point:
  - Registers the Service Worker (`sw.js`) and handles update prompts.
  - Handles iOS "Add to Home Screen" installation hints.
  - Initializes the selected language from cookie/browser preferences and applies localized text to DOM elements (`[data-i18n]`).
  - Unlocks audio contexts on first user touch/click.
  - Instantiates `GameController` and `QuacksUIManager` to start the game.

- **`sw.js`**
  PWA Service Worker implementing versioned caching (`CACHE_NAME`). Pre-caches all scripts, stylesheets, translations, and media to ensure complete offline functionality, with support for HTTP 206 partial range requests on iOS Safari.

## Deployment

This repo deploys to GitHub Pages via two workflows under `.github/workflows/`,
sharing a composite action under `.github/actions/`.

- **`deploy-prod.yml`** — runs only when an annotated tag matching `v*` is pushed
  AND points to a commit on `main`. Publishes to the root of the `gh-pages`
  branch. Existing `/preview/*` directories are preserved.
- **`deploy-preview.yml`** — runs on every push to a non-`main` branch.
  Publishes to `/preview/<branch-slug>/` of `gh-pages`. The production root is
  never touched. If a PR is open for the branch, the workflow comments the URL
  on it.
- **`.github/actions/publish-to-gh-pages/`** — composite action both workflows
  call to do the actual gh-pages checkout + write + commit + push.

Quick refresher on the GitHub Actions terms: a *workflow* is a YAML in
`.github/workflows/` that GitHub runs on a trigger; an *action* is a reusable
building block a workflow calls via `uses:`. The composite action above is the
shared logic; the two workflows are the entry points.

### One-time setup
**Settings → Pages → Source: Deploy from a branch → Branch: `gh-pages`, root `/`** → Save.
The `gh-pages` branch auto-creates on the first preview push, so it may not
appear in the dropdown until then.

### Cutting a release

    git tag -a v1.0.0 -m "Release 1.0.0"
    git push origin v1.0.0

Lightweight tags and tags that aren't on `main` are rejected by the workflow.

### Preview lifecycle

**Previews never auto-expire.** A preview is created the first time a branch
is pushed and lives on `gh-pages` from that moment until the directory is
removed by hand. **Deleting the branch on GitHub does not remove the
preview** — that's a known gap; a follow-up `branch_delete` workflow can
plug it.

A preview's URL is `https://doonch.github.io/OpenQuacks/preview/<slug>/`,
where `<slug>` is the branch name with `/` replaced by `-` and
non-alphanumeric characters stripped (`feature/foo` → `feature-foo`).

| Event | Effect on `/preview/<slug>/` |
|---|---|
| First push to a non-`main` branch | Created |
| Subsequent push to the same branch | Replaced atomically (the workflow runs `rm -rf <slug>/` then re-rsyncs the new tree) |
| Production tag deploy | Untouched — only `/` is rewritten; all `preview/*` are preserved |
| Branch deleted | **Persists.** No auto-cleanup; remove the directory manually from `gh-pages` |
| Pages source toggled away from `gh-pages` | URL keeps loading briefly while the GitHub CDN cache expires (~minutes), and **indefinitely for any browser that already installed the PWA service worker for that path**. That's a property of PWAs, not a leak — to truly evict, the visitor needs to clear browser data or unregister the SW |

Previews on a public repo are public — anyone with the URL can visit. That's
the same as production. Pages has no per-path access control; the whole site
inherits the repo's visibility.

### Should I ever touch the `gh-pages` branch?

**No, not in normal use.** It's 100% managed by the two workflows above. You
never commit to it, merge into it, or pull from it as part of regular
development. The only times a human edits it directly are:

- **Cleanup**: removing a stale preview directory after deleting its branch
  (one-off, until an auto-cleanup workflow is added).
- **Emergency rollback**: reverting a bad production deploy by hand. Rare.

`gh-pages` is an orphan branch (no shared history with `main`) — that's how
the "deploy from branch" Pages model works. Treat it like a build-output
directory: auto-generated, not for hand-editing.

### Concurrency

The two workflows share a `gh-pages-deploy` concurrency group, so a tag push
and a branch push that happen at the same time serialize cleanly rather than
racing on `gh-pages`.