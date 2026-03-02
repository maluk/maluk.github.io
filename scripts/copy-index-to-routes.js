/**
 * Post-build script: copies build/index.html into each static route directory
 * so GitHub Pages returns 200 for direct navigation (e.g. /new-york/).
 */
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX = path.join(BUILD_DIR, 'index.html');

const SLUGS = ['california', 'new-york', 'texas', 'washington'];
const YEARS = ['2025', '2026'];

const routes = [
  ...SLUGS,
  ...SLUGS.flatMap((slug) => YEARS.map((year) => `${slug}/${year}`)),
];

for (const route of routes) {
  const dir = path.join(BUILD_DIR, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(INDEX, path.join(dir, 'index.html'));
  console.log(`Created ${route}/index.html`);
}
