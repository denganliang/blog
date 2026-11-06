# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Preview
This is a static site with no build step. Use any local HTTP server to preview:
*   **Python:** `python -m http.server 8000`
*   **Node.js:** `npx http-server -p 8000`

### Maintenance Tasks
*   **Search Index:** Update `search-index.json` manually when adding new blog posts or tools to ensure they are searchable.
*   **Sitemap:** Update `sitemap.xml` when adding new pages or tools.
*   **Deployment:** The site is hosted on GitHub Pages. Changes pushed to the `master` branch are automatically deployed.

## Code Architecture

### Directory Structure
*   `/` - Root contains the Chinese version of the site.
*   `/en/` - Contains the English version of the site (mirrors the root structure).
*   `/blog/` - Blog posts, each in its own directory with an `index.html`.
*   `/tools/` - Standalone HTML-based online tools.
*   `/projects/` - Project showcase pages.
*   `/assets/` - Static resources:
    *   `css/`: Categorized into `themes.css` (variables), `main.css` (layout), `components.css` (UI elements), and `utilities.css`.
    *   `js/`: Vanilla JS modules for `theme-switcher.js`, `i18n.js` (language), `search.js`, and `main.js` (global UI logic).

### Key Systems
*   **Bilingual Logic:** Uses URL path prefixes (`/en/` for English). `assets/js/i18n.js` handles user preference in `localStorage` and provides a global `window.I18n` object for switching.
*   **Theme System:** Uses `data-theme="dark"` or `data-theme="light"` on the `<html>` element. Styles are driven by CSS variables in `assets/css/themes.css`.
*   **Search System:** Client-side only. `assets/js/search.js` performs fuzzy matching against entries in `search-index.json`.
*   **Tools UI System:** All `/tools/` and `/en/tools/` pages use `<body class="tool-scope">` plus the scoped design layer `assets/css/tools-ui.css` and the interaction runtime `assets/js/tools-ui.js` (`window.ToolUI`: Tabs, DropZone, Notify, State, Progress, Copy, Modal, zh/en message dictionary). The catalog page additionally loads `assets/css/tools-layout.css` and `assets/js/tools-index.js`. The catalog controller also owns the developer-first default card order, local usage-based reordering (`localStorage` key `tools:usage:v1`, shared across languages) and its low-key reset control. The developer toolbox pages (`tools/dev-toolbox.html`, `en/tools/dev-toolbox.html`) additionally use `<body class="tool-scope dev-toolbox-scope">` and `assets/js/dev-toolbox-ui.js` (`window.ToolBox`) for per-card label association, copy/example/clear actions and inline status feedback; card capabilities are declared with `data-hint` / `data-example` / `data-copy-source`. Styles are scoped to `body.tool-scope` so other sections are unaffected. See `TOOLS-DESIGN.md` for the full design spec, page templates and integration guide.

### Content Workflow
*   **Adding Blog Posts:** Create `/blog/[slug]/index.html` (ZH) and `/en/blog/[slug]/index.html` (EN). Update `search-index.json`.
*   **Adding Tools:** Create `/tools/[name].html` (ZH) and `/en/tools/[name].html` (EN) using the shared tools layer (`body.tool-scope`, `tools-ui.css`, `tools-ui.js`). Use `ToolUI` for status feedback — never `alert()`. Keep `data-categories` / `data-keywords` on catalog cards. Update `/tools/index.html`, `/en/tools/index.html`, `search-index.json` and `sitemap.xml`. Verify with `python3 scripts/check_site.py`.
*   **Updating Projects:** Update `/projects/index.html` and `/en/projects/index.html`.
