# TheTax.us paycheck calculator

The site calculates estimated **paycheck withholding**, rather than annual tax liability. The calculator library in `src/calculator` is independent of React and Next.js. Federal rules follow IRS Publication 15-T and FICA limits; each state has its own versioned module with government source metadata.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm test
npm run dev
```

`npm run build` exports static HTML to `out/`. The HTML already contains the calculator default, example result, methodology, sources, and state links.

## Rule status

The current-year sitemap and state selector include only jurisdictions whose rule modules have `metadata.status === 'verified'`. An unsupported state or year throws an error. Do not mark another state verified before implementing its withholding method, statewide employee deductions, official-source metadata, and golden/boundary tests.

Implemented 2026: all 50 states. Implemented historical 2025: CA, FL, TX, WA. Historical 2025 NY and District of Columbia are pending. Local New York City and Yonkers withholding is supported. Other local taxes are disclosed when omitted; Maryland county tax applies to residents and is excluded from the current estimate.

The calculation assumes one employer and that the worker lives and works in the selected state. When YTD wages are blank, the library projects them from pay date and current earnings. Actual employer payroll records can differ, especially for midyear changes, benefits, and wage-base crossings.

## Deployment

The site uses the existing `gh-pages` branch and `thetax.us` GitHub Pages custom domain. `npm run build` exports static HTML to `out/` and adds the `CNAME`, `.nojekyll`, and legacy current-year URL pages. CI runs tests, builds, verifies the export, and uploads it as an artifact. After release review, run `npm run deploy` from a clean checkout. It repeats those checks, replaces the contents of the `gh-pages` branch, and pushes a deployment commit. Check the live site after GitHub Pages finishes publishing.

GitHub Pages serves legacy `/state/2026/` pages with HTTP 200. Those pages have an immediate refresh, a canonical link to `/state/`, and `noindex`; GitHub Pages cannot send the requested HTTP 301 redirects. A hosting layer that supports redirects is required to satisfy that exact SEO requirement.

The old CRA source is no longer part of the build. The Node Dockerfile serves `out/` through Nginx for local static preview.
