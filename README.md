# OpenQuacks
Free version of a medieval, fun, push-your-luck game.

Prompts by Gemini 3; Art by Nano Banana 2, animation by Veo 3. Code by Gemini Canvas.

Play at: https://doonch.github.io/OpenQuacks

From iPhone/iPad, best to save as Web App (Share -> Add to home screen -> check "Web App")

File any issues or contribute to the code here.

## Deployment

This repo deploys to GitHub Pages via a single workflow at
`.github/workflows/deploy.yml`, using the official
`actions/upload-pages-artifact` and `actions/deploy-pages`. There's no
`gh-pages` branch and no per-branch preview channel — production only.

The workflow runs only when an annotated tag matching `v*` is pushed AND
points to a commit on `main`. Lightweight tags and tags off `main` are
rejected at the verify step.

### One-time setup
**Settings → Pages → Source: GitHub Actions** → Save. Nothing else to
configure; no branch to create.

### Cutting a release

    git tag -a v1.0.0 -m "Release 1.0.0"
    git push origin v1.0.0

### Testing non-formal versions

There's no built-in preview URL. Two options:

- **Local server**: `python -m http.server 8000` from the repo root, then
  open `http://localhost:8000`. Service-worker and PWA features work fine
  on `localhost`.
- **Your fork**: each fork's Pages site is independent — fork the repo,
  enable Pages on your fork (`Source: GitHub Actions`), tag your fork to
  deploy.