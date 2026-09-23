Deploy the app to GitHub Pages.

Steps:
1. Run `npm run deploy` from a clean checkout. The script tests, builds, verifies, and publishes `out/` to the existing `gh-pages` branch.
2. Verify the live homepage, one state page, `sitemap.xml`, and an old `/state/2026/` URL after GitHub Pages publishes.
3. Report the result. Legacy year URLs use an HTML refresh because GitHub Pages cannot serve HTTP 301 redirects.
