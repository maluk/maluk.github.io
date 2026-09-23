import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { verifiedStatePages } from '../src/site/states.ts';

const root = join(process.cwd(), 'out');
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const redirects = readFileSync(join(root, '_redirects'), 'utf8');
const home = readFileSync(join(root, 'index.html'), 'utf8');
assert.ok(home.includes('Know what actually lands in your bank account.'), 'Homepage must be prerendered');
assert.equal(verifiedStatePages.length, 50, 'Exactly 50 current state pages must be verified');

for (const page of verifiedStatePages) {
  const path = join(root, page.slug, 'index.html');
  assert.ok(existsSync(path), `Missing /${page.slug}/`);
  const html = readFileSync(path, 'utf8');
  const canonical = `https://thetax.us/${page.slug}/`;
  for (const [name, token] of [
    ['title', `<title>${page.name} Paycheck Calculator`],
    ['description', '<meta name="description"'],
    ['canonical', `<link rel="canonical" href="${canonical}"`],
    ['H1', `<h1>${page.name}`],
    ['paycheck result', 'Your estimated paycheck'],
    ['salary examples', '<table class="salary-table"'],
    ['methodology', 'Methodology and sources'],
    ['verification date', 'Tax rules verified:'],
    ['disclaimer', 'Estimated paycheck — not tax advice.'],
  ]) assert.ok(html.includes(token), `${page.code} missing ${name}`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${page.code} missing from sitemap`);
  assert.ok(!existsSync(join(root, page.slug, '2026', 'index.html')), `${page.code} has a duplicate current-year page`);
}

for (const slug of ['california', 'texas', 'new-york', 'florida', 'washington']) {
  assert.ok(redirects.includes(`/${slug}/2026/ /${slug}/ 301`), `${slug} missing legacy redirect`);
}

assert.ok(readFileSync(join(root, 'maryland', 'index.html'), 'utf8').includes('Local income taxes are not included in this estimate.'), 'Maryland county-tax omission must be visible');
console.log(`Verified static HTML, sitemap, and redirects for ${verifiedStatePages.length} states.`);
