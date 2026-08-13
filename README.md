# Lucien Marcel Cote — Games, Film & 3D Portfolio

One portfolio with two delivery targets:

- **ChatGPT Sites** runs the complete application, including the owner-only Studio and model storage.
- **GitHub Pages** runs the public, static viewer and reads the same public model collection.

The shared CareerOS ecosystem manifest supplies the cross-site navigation for Tech & Systems, Games/Film/3D, Music, and the résumé library.

## Local development

```powershell
npm install
npm run dev
```

## Production builds

`npm run build` validates the full Sites application. GitHub Actions assembles the static viewer from `github-pages/` and the shared `app/globals.css`, then publishes it to GitHub Pages.

Studio uploads and model deletion intentionally remain available only on the authenticated Sites deployment.

## Refreshing the earlier-work archive

Before moving `luccote.com`, run:

```powershell
python scripts/archive_legacy_site.py
```

The script preserves the complete source snapshot in the ignored, OneDrive-synced `legacy-source-archive/` folder and rebuilds the public-safe archive under `public/legacy-work/`. Commit the public archive and deploy both targets normally.
