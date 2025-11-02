React migration notes

This workspace was converted in-place to support a small React app scaffold using Vite.

How to run (after installing deps):

1. Ensure Node.js and npm are installed.
2. From project root run:

```powershell
npm install
npm run dev
```

3. Open http://localhost:5173

Notes:
- Image uploads are handled by the Backend API (no Cloudinary config needed in Frontend)
- Existing static HTML files were left intact in `HTML/` folder; React app is now served from root `index.html` and `src/`.
- CSS files are organized by feature in component folders and `/src/styles` for shared styles.
