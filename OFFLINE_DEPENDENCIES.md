# Offline / No-CDN Mode

This project now supports a **no-CDN** deployment mode for GitHub Pages.

## What changed

All previously external front-end dependencies are vendored under `assets/vendor/`:

- `assets/vendor/ffmpeg/`
- `assets/vendor/gif/`
- `assets/vendor/exifr/`
- `assets/vendor/dom-to-image/`
- `assets/vendor/piexif/`
- `assets/vendor/vue/`
- `assets/vendor/tailwind/`
- `assets/vendor/easymde/`
- `assets/vendor/html2pdf/`
- `assets/vendor/html-docx-js/`
- `assets/vendor/qrcode-generator/`
- `assets/vendor/jsqr/`

## Updated pages / scripts

- `tools/audio-toolbox.html`
- `en/tools/audio-toolbox.html`
- `tools/image-toolbox.html`
- `en/tools/image-toolbox.html`
- `tools/nano-banana.html`
- `en/tools/nano-banana.html`
- `tools/markdown-editor.html`
- `en/tools/markdown-editor.html`
- `tools/dev-toolbox.html`
- `en/tools/dev-toolbox.html`
- `assets/js/photosign.js`

## Notes about FFmpeg core files

`@ffmpeg/core-st@0.11.1` publishes:

- `ffmpeg-core.js`
- `ffmpeg-core.wasm`
- `ffmpeg-core.worker.js` (empty file in upstream package metadata)

This repository mirrors that package structure under `assets/vendor/ffmpeg/`.

## Validation

Run:

```bash
python scripts/check_site.py
```

And locally preview:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` and test tool pages manually.
