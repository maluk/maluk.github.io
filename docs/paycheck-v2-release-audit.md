# Paycheck Calculator V2 release audit

Reviewed September 23, 2026 for the 2026 current-year release on GitHub Pages.

## Calculation evidence

- The deterministic federal and state engines pass 133 tests. These include official worked examples, zero and high wages for all 50 states, pay-frequency tables, tax bracket edges, Social Security and state program wage caps, final-paycheck cap crossings, and additional Medicare withholding.
- The 2025 historical coverage is California, Florida, Texas, and Washington. The 2025 New York engine is not published because its historical withholding schedules have not been verified.
- The 2026 current-year registry contains exactly 50 states. Every module has government-source metadata and a verification status. The static build includes only `verified` states.
- The official-source URL check found 104 unique citations: 96 returned HTTP 200 and eight returned HTTP 403 to the automated client. No citation returned HTTP 404. HTTP 403 does not establish that a source is dead; the affected Colorado, Rhode Island, New York, Maryland, and Tennessee sources were also reviewed through their government publications or web results.
- California SDI, Washington Paid Leave and WA Cares, New York Paid Family Leave, Alaska unemployment insurance, and Pennsylvania employee unemployment insurance were checked against their issuing agencies. Federal FICA rates and limits are covered by the federal tests and source metadata.
- Traditional 401(k), HSA, and cafeteria benefit wage treatment was reviewed for federal withholding and the documented California, New Jersey, and Pennsylvania exceptions. The custom-deduction path requires explicit tax treatment.

## Date-sensitive rules and known limits

- Utah's revised Publication 14 is effective June 1, 2026. The engine rejects earlier pay dates until the prior schedule is implemented. It uses the pay date as a proxy for the pay-period start, which is disclosed in its assumptions.
- Maine's August 2026 revised tables were announced as effective immediately. The engine supports pay dates from September 1, the first full month after that announcement, and rejects earlier 2026 dates pending implementation of the prior method. September 1 is a conservative support boundary, not the asserted legal effective date.
- Idaho and West Virginia likewise reject dates before their verified 2026 schedules. Georgia and Ohio select their earlier or later schedules by pay date.
- New York City and Yonkers are supported. Other local income taxes, including Maryland county withholding, are excluded and disclosed. GitHub Pages can provide canonical, noindex refresh pages for the five old `/state/2026/` URLs, but cannot issue HTTP 301 redirects.
- DC, 2025 New York, earlier 2026 schedules for the four guarded states, and additional local taxes remain follow-up work. Their absence does not change the calculation of a supported current-year paycheck.

## Release checks

`npm test`, `npm run build`, and `npm run verify:static` are the required release commands. `verify:static` checks all 50 HTML state pages, prerendered results, sitemap entries, self canonicals, the custom domain, Next asset support, and the five legacy refresh pages. Desktop and 390px mobile calculator flows were checked in Chrome on September 23, 2026.
