Deploy the app to GitHub Pages.

Steps:
1. Run `NODE_OPTIONS=--openssl-legacy-provider npm run build` to build the production bundle
2. If the build succeeds, run `npm run deploy` to publish to the `gh-pages` branch via the `gh-pages` npm package
3. Report the result — on success, confirm the app is live at https://thetax.us
