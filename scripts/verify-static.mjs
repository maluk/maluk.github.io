import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { verifiedStatePages } from '../src/site/states.ts';

const root = join(process.cwd(), 'out');
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const home = readFileSync(join(root, 'index.html'), 'utf8');
assert.ok(home.includes('Know what actually lands in your bank account.'), 'Homepage must be prerendered');
assert.equal(verifiedStatePages.length, 50, 'Exactly 50 current state pages must be verified');
assert.equal(readFileSync(join(root, 'CNAME'), 'utf8').trim(), 'thetax.us', 'GitHub Pages custom domain is missing');
assert.ok(existsSync(join(root, '.nojekyll')), 'GitHub Pages must serve _next assets');
const widgets = readFileSync(join(root, 'widgets/index.html'), 'utf8');
const embed = readFileSync(join(root, 'embed/paycheck/index.html'), 'utf8');
assert.ok(widgets.includes('Set up your widget') && widgets.includes('Live preview'), 'Publisher builder must be prerendered');
assert.ok(widgets.includes('rel="canonical" href="https://thetax.us/widgets/"'), 'Builder must have a canonical URL');
assert.ok(home.includes('href="/widgets/"'), 'Widget offering must be discoverable');
assert.ok(sitemap.includes('<loc>https://thetax.us/widgets/</loc>'), 'Builder missing from sitemap');
assert.ok(!sitemap.includes('/embed/'), 'Embeds must not appear in sitemap');
assert.ok(embed.includes('name="robots" content="noindex, follow"'), 'Embed must not be indexed');
assert.ok(embed.includes('What’s your take-home pay?') && embed.includes('Powered by'), 'Embed must contain calculator and attribution');
assert.ok(!embed.includes('<header class="site-header"') && !embed.includes('<footer class="site-footer"') && !embed.includes('cloud.umami.is/script.js'), 'Embed must omit site chrome and the automatic analytics tracker');
assert.ok(widgets.includes('Tracking respects Do Not Track.') && widgets.includes('tracking=off'), 'Widget tracking disclosure and opt-out must be visible');
assert.ok(widgets.includes('preview=1'), 'Builder preview must disable embedded tracking');
assert.ok(existsSync(join(root, 'embed/v1.js')), 'Widget loader missing from static export');

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
  assert.ok(!sitemap.includes(`<loc>${canonical.slice(0, -1)}/2026/</loc>`), `${page.code} has a duplicate sitemap entry`);
}

for (const slug of ['california', 'texas', 'new-york', 'florida', 'washington']) {
  const legacy = readFileSync(join(root, slug, '2026', 'index.html'), 'utf8');
  assert.ok(legacy.includes(`content="0;url=/${slug}/"`), `${slug} missing legacy refresh`);
  assert.ok(legacy.includes(`href="https://thetax.us/${slug}/"`), `${slug} missing canonical target`);
  assert.ok(legacy.includes('content="noindex, follow"'), `${slug} legacy page must not be indexed`);
}

assert.ok(readFileSync(join(root, 'maryland', 'index.html'), 'utf8').includes('Local income taxes are not included in this estimate.'), 'Maryland county-tax omission must be visible');
console.log(`Verified GitHub Pages HTML, sitemap, and legacy URL handling for ${verifiedStatePages.length} states.`);
