import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const output = join(process.cwd(), 'out');
const legacyCurrentYearSlugs = ['california', 'new-york', 'texas', 'florida', 'washington'];

for (const slug of legacyCurrentYearSlugs) {
  const target = `/${slug}/`;
  const directory = join(output, slug, '2026');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Moved — TheTax.us</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://thetax.us${target}">
<meta http-equiv="refresh" content="0;url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
</head><body><p>This calculator has moved to <a href="${target}">${target}</a>.</p></body></html>\n`);
}
