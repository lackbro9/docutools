# DocuTools

DocuTools is a free, static PDF and document tools website. It is built with plain HTML, CSS and vanilla JavaScript (no build step, no framework, no backend, no database) and is designed to run at zero hosting cost on Cloudflare Pages or GitHub Pages.

"DocuTools" is a working name. You can rename it later; see "Renaming the site" below.

## What is actually in this project

- 20 HTML pages: a homepage, an All Tools directory, 14 tool pages, and About / Privacy / Terms / Contact.
- One shared stylesheet (css/style.css) and a small set of shared JavaScript helper files (js/main.js, js/components.js, js/lib-loader.js, js/pdf-helpers.js, js/image-helpers.js), plus one JavaScript file per tool.
- sitemap.xml and robots.txt for search engines.
- This README.

No images, fonts or other binary assets are required; the logo is drawn with CSS/text, so the whole site is plain text files.

## Which tools genuinely work, and their real limitations

Every tool below was tested by actually feeding it a real file and checking the real output (not just checking that a button exists). Testing notes:

- JPG to PDF, Images to PDF, Merge PDF, Split PDF, PDF Page Extractor, Text to PDF: fully working. Verified by generating real test files, running them through the tool's real code, and re-opening the resulting PDF bytes with pdf-lib to confirm page counts and valid PDF structure.
- PDF to JPG: fully working, including the ZIP packaging path for multi-page PDFs (verified the ZIP's internal file list).
- PDF to Text: fully working for text-based PDFs. It cannot extract text from scanned/photographed pages that have no embedded text layer; the page tells users to try OCR instead.
- Image Resizer, Image Compressor, JPG to PNG, PNG to JPG: fully working, verified with real before/after file sizes and dimensions.
- OCR: fully working using Tesseract.js running entirely in the browser. Accuracy depends on image quality; the first run on a device is slower because the recognition engine and language data are downloaded from a CDN.
- Compress PDF: works honestly, not magically. "Optimize" mode re-saves the PDF structure (modest, safe savings, text stays selectable). "Strong compression" mode rasterizes pages to JPEG images (can significantly shrink scanned/image-heavy PDFs, but the text is no longer selectable, and for text-only PDFs the result can legitimately end up larger, which the tool will tell you rather than hide).

All of the above run 100% locally in the browser using the File API, Canvas API and the open-source libraries pdf-lib, PDF.js, Tesseract.js and JSZip, loaded from a public CDN only when a specific tool needs them. No document content is uploaded to any server operated by this project.

## Running it on your own computer

1. Download and unzip the project folder.
2. Double-click index.html (or right-click and "Open with" your browser). Because the site uses only relative file paths and CDN scripts, it works straight from your local disk with no server and no install step.
3. To click around more comfortably, you can also serve the folder with any simple local server (for example, VS Code's "Live Server" extension), but this is optional.

## Deploying it for free

### Option A: Cloudflare Pages (recommended)

1. Create a free account at pages.cloudflare.com (Cloudflare's free tier requires no payment card for a basic Pages site).
2. Click "Create a project" then choose "Upload assets" (direct upload), rather than connecting a Git repo, if you just want to upload this folder as-is.
3. Drag the whole project folder (or a zip of it, if the interface asks for one) into the upload area.
4. Cloudflare will give you a free *.pages.dev URL within a minute or two. That URL is your live website.
5. To update the site later, make changes to the files and re-upload/redeploy from the same Cloudflare Pages project (or connect it to a GitHub repository for automatic redeploys on every commit, see Option B).

### Option B: GitHub Pages

1. Create a free GitHub account if you do not already have one, and create a new public repository.
2. Upload every file in this project into that repository (GitHub's web interface lets you drag and drop files directly, or you can use Git from your computer).
3. In the repository, go to Settings > Pages, set the source branch to your main branch and the folder to the repository root, then save.
4. GitHub will publish the site at https://yourusername.github.io/yourrepositoryname/ within a few minutes.
5. To update the site later, just push or upload new/changed files to the same repository; GitHub Pages redeploys automatically.

## Before you go live: a few placeholders to update

- Replace https://www.docutools.example/ in sitemap.xml and in every page's canonical/Open Graph tags with your real domain once you have one.
- Replace the placeholder email address hello@docutools.example in contact.html and privacy.html with a real email address you control.
- Update the 'Governing law' line in terms.html if you want a specific legal jurisdiction named.

## Renaming the site

The name "DocuTools" appears in js/main.js (the SITE_NAME variable), in each page's <title> and meta description tags, and in the footer copyright line. Search-and-replace "DocuTools" across the project files to rename it; there is no other configuration to change.

## Submitting to Google Search Console (optional, free)

1. Go to search.google.com/search-console and sign in with a Google account.
2. Add your deployed site as a property (the "URL prefix" method is simplest).
3. Verify ownership using one of Search Console's free methods (for example, uploading a small HTML verification file, or adding a DNS record if you own the domain).
4. Once verified, open "Sitemaps" in the left menu and submit sitemap.xml (for example, https://yourdomain.com/sitemap.xml).
5. You can also use "URL inspection" to request indexing of individual pages.
6. Indexing and ranking are not guaranteed or controlled by this project; Search Console simply helps Google discover the pages faster.

## Known limitations and honest notes

- Very large files (tens of megabytes) or very long PDFs can be slow, or can fail on low-powered devices, because all processing happens in the visitor's own browser memory rather than on a server.
- The 'Compress PDF' tool cannot match the compression ratio of dedicated desktop software for every PDF; it reports real, measured results rather than a guaranteed percentage.
- OCR accuracy depends on image quality and is not perfect, especially for handwriting or low-resolution scans.
- This build has no analytics, no ads, and no account system by design, per the zero-cost, privacy-first requirements it was built to.

## Ideas for later (not implemented, and not required)

- A server-side component for heavier PDF compression or very large files.
- Additional OCR languages.
- Optional, clearly-disclosed analytics or advertising once the site has real traffic.
- A custom domain (works with both Cloudflare Pages and GitHub Pages once you own one).