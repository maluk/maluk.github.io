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

## Embeddable calculator

`/widgets/` offers a free salary-only widget builder with default-state and accent-color controls, a working preview, and copyable code. `/embed/paycheck/?state=CA&accent=006b60` serves the compact calculator without site navigation or automatic pageview tracking. It reuses the main engine, current verified year, and `defaultInput()` assumptions, including the displayed pay date. Invalid configuration falls back to California and the site accent.

Publishers can use the auto-height `/embed/v1.js` loader or a plain 900px iframe with internal scrolling. Both snippets retain a fallback link. The loader supports multiple widgets and repeated inclusion. Sites with CSP must allow `https://thetax.us` in `frame-src`, and in `script-src` for the loader. Resizing exchanges only frame heights, checks origin and source, and never exposes calculator inputs to the publisher. New plain iframe snippets use an origin-only referrer so only the publisher hostname is available for usage attribution.

The full-calculator link carries a versioned fragment with salary, status, frequency, and tax year. The destination validates the payload and removes it before loading site analytics; historical-year and malformed handoffs are ignored. No salaries or results are sent to analytics. New current-year rules must remain compatible with the existing widget URLs; preserve the v1 loader contract when adding future versions.

### Widget adoption reports

The Umami account is currently at its website limit. Production therefore uses the existing **US Paycheck Tax Calculator** property (`03bf5d23-1333-4402-bb47-5791c5df95ff`). Embedded events use the fixed `/embed/paycheck/` path and the event names below; filter on that path to separate them from the main site. Embedded activity can contribute to the property's overall visitor/session totals. When another property is available, replace the public `NEXT_PUBLIC_WIDGET_UMAMI_WEBSITE_ID` in `.env.production`, or override it through CI or `.env.production.local`, then rebuild and redeploy. Missing, empty, or invalid IDs disable embedded collection. This is a public website identifier, not an API key.

| Event | Meaning |
| --- | --- |
| `widget_banner_clicked` | Homepage widget CTA clicked; main-site event. |
| `widget_code_copied` | Clipboard copy succeeded; includes `embed_method` and is not evidence of installation. |
| `widget_loaded` | Widget initialized; once per embedded document, not per resize or React update. |
| `widget_interacted` | First input change per embedded document. |
| `widget_full_calculator_clicked` | Full-calculator link clicked. |

To inspect adoption, open the property in Umami, select the last 30 days, filter to `widget_loaded`, and open **Events → Properties → publisher_hostname**. The distinct known hostname values are **Observed active publishers**; do not use Umami's visitor count as the installation count or count a truncated top-values list as a complete report. Export the complete property breakdown if necessary. Hostnames are lowercased with trailing dots removed; subdomains remain distinct. View `unknown` separately. Umami's [event-property reporting](https://docs.umami.is/docs/event-data) provides load counts by publisher. For the same date range, `widget_interacted / widget_loaded` is the interaction rate and `widget_full_calculator_clicked / widget_loaded` is clicks per load (multiple clicks can make it exceed 100%). Banner clicks and copies are publisher-interest measures; no cross-site person matching is performed.

Embedded events are sent directly to Umami's public collection endpoint without loading its automatic tracker, using only an allowlisted hostname, method, version, and attribution source (`postmessage`, `referrer`, or `unknown`). There are no visitor IDs, cookies, calculator inputs, results, publisher paths, query strings, or URL fragments in the event payload. The automatic-height loader identifies itself using `embed=script`; the validated parent handshake supplies attribution. After five seconds without a handshake, a load is recorded as unknown. Older plain iframe snippets keep working but may remain unknown until replaced because they suppressed referrers. Tracking starts at rollout; it cannot reconstruct earlier installations or exact uninstall dates, and blockers or sites without traffic cause undercounting.

Tracking is suppressed for `preview=1`, direct standalone visits, local/development builds, TheTax.us publishers, and Do Not Track. Publishers can disable it using `data-tracking="off"` on the automatic-height container or `&tracking=off` in a plain iframe URL. Collection is best effort and never blocks calculation, resizing, copying, or navigation. The setup page discloses this behavior.

## Deployment

The site uses the existing `gh-pages` branch and `thetax.us` GitHub Pages custom domain. `npm run build` exports static HTML to `out/` and adds the `CNAME`, `.nojekyll`, and legacy current-year URL pages. CI runs tests, builds, verifies the export, and uploads it as an artifact. After release review, run `npm run deploy` from a clean checkout. It repeats those checks, replaces the contents of the `gh-pages` branch, and pushes a deployment commit. Check the live site after GitHub Pages finishes publishing.

GitHub Pages serves legacy `/state/2026/` pages with HTTP 200. Those pages have an immediate refresh, a canonical link to `/state/`, and `noindex`; GitHub Pages cannot send the requested HTTP 301 redirects. A hosting layer that supports redirects is required to satisfy that exact SEO requirement.

The old CRA source is no longer part of the build. The Node Dockerfile serves `out/` through Nginx for local static preview.
