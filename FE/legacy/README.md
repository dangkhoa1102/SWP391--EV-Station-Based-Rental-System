This folder contains the original legacy static site assets (HTML/CSS/JS) moved here during the migration to a React-based structure.

Why these files were moved here
- The project was refactored to use a React app under `src/` and a Vite entry at the repository root. The original static pages and styles are archived here so they can be referenced or restored if needed.

What is included
- `HTML/` - copies of the original HTML pages.
- `CSS/` - copies of the original CSS files.
- Other top-level legacy files (e.g., `api.js`, `diagnose_api.html`) may also be present.

Next steps
- Verify the React app runs and that no `src/` code references files that were moved. If some assets are required by `src/`, move only those into `src/assets/` and update imports.

Keep this folder until you confirm you want the originals permanently removed from the repository root.
