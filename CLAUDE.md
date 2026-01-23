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

### Content Workflow
*   **Adding Blog Posts:** Create `/blog/[slug]/index.html` (ZH) and `/en/blog/[slug]/index.html` (EN). Update `search-index.json`.
*   **Adding Tools:** Create `/tools/[name].html`. Update `/tools/index.html` and `/en/tools/index.html`. Update `sitemap.xml`.
*   **Updating Projects:** Update `/projects/index.html` and `/en/projects/index.html`.
