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

The repository builds a static export and CI uploads `out/` as an artifact. For production, create a Cloudflare Pages Direct Upload project named `thetax-us` with production branch `master`. Configure the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then run the manual **Deploy TheTax.us to Cloudflare Pages** workflow after release review. The workflow runs tests and builds before uploading `out/`. Attach `thetax.us` as the custom domain. Cloudflare Pages applies `public/_redirects`, which sends old `/state/2026/` URLs to the canonical current-year `/state/` URL with HTTP 301. Verify those responses and the generated `/sitemap.xml` before switching DNS. The legacy GitHub Pages workflow no longer deploys because GitHub Pages cannot apply those redirect rules.

The old CRA source is no longer part of the build. The Node Dockerfile serves `out/` through Nginx for local static preview, but Cloudflare Pages is needed for the 301 redirects in `public/_redirects`.
