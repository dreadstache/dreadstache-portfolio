# Lucien Marcel Cote — Games, Film & 3D Portfolio

One portfolio with two delivery targets:

- **ChatGPT Sites** runs the complete application, including the owner-only Studio and model storage.
- **GitHub Pages** runs the public, static viewer and reads the same public model collection.

The shared CareerOS ecosystem manifest supplies the cross-site navigation for Tech & Systems, Games/Film/3D, Music, and the résumé library.

Public addresses:

- Games, Film & 3D: `https://games.luccote.com/`
- Earlier-work Archive: `https://games.luccote.com/archive.html`

## Local development

```powershell
npm install
npm run dev
```

## Production builds

`npm run build` validates the full Sites application. GitHub Actions assembles the static viewer from `github-pages/` and the shared `app/globals.css`, then publishes it to GitHub Pages.

Studio uploads and model deletion intentionally remain available only on the authenticated Sites deployment.

## Refreshing the earlier-work archive

To refresh the preserved earlier-work collection, run:

```powershell
python scripts/archive_legacy_site.py
```

The script preserves the complete source snapshot in the ignored, OneDrive-synced `legacy-source-archive/` folder and rebuilds the public-safe archive under `public/legacy-work/`. Commit the public archive and deploy both targets normally.

## Owner collection order


In `/studio`, use Earlier/Later on each saved model, then Save order. Reset discards the draft order. Saved order is stored in R2 at `metadata/model-order.json`; both the Sites showcase and GitHub Pages viewer read the same ordered `/api/models` response. New uploads follow explicitly ordered models; removed models are ignored. Mutations require the owner account. Stale collection lists and concurrent order saves are rejected rather than overwriting another session. Upload and removal controls are disabled while an order draft is pending.

Run ordering and access-control regression tests with `node --test tests/model-order.test.mjs`.
