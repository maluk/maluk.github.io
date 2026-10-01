# Paycheck Calculator V2: remaining work

Status on 2026-09-23: V2 is deployed at https://thetax.us/ through the existing GitHub Pages site. The accuracy review is recorded in [the release audit](paycheck-v2-release-audit.md); 133 calculation tests and the static export check pass. Live HTTP checks passed for the homepage, representative state pages, legacy refresh URL, sitemap, and 404 page. The 55-URL sitemap was resubmitted in Search Console. Remaining work below is outside the supported 2026 release coverage or awaits Google indexing.

Completed since the first draft: input validation fails closed for invalid pay dates, W-4 values, deductions, and negative net pay; an invalid entry hides the prior result. Period comparisons run a separate withholding calculation for each frequency. The result can be shared without sending wage amounts to analytics. The 50 current-year state modules now include jurisdiction-specific withholding logic and applicable statewide employee contributions. Georgia and Ohio select the withholding schedule using their 2026 change dates. West Virginia rejects pay dates before June 12, 2026, and Idaho rejects pay dates before July 31, 2026, until their earlier schedules are verified. North Dakota, New Mexico, and Oregon publish internally inconsistent examples or thresholds; their engines follow the cited formula tables and disclose the discrepancy. Maryland's county income tax is excluded and prominently disclosed. Each state page contains an HTML-rendered result, four pay-frequency comparisons, six common-salary examples, primary sources, and a verification date.

## 1. Close the accuracy gate on existing coverage

**PAY-002 — Audit the implemented rules.** Completed for the supported 2026 release dates and four 2025 historical modules. California 2025 and 2026 use EDD's four pay-period Method B tables; official Examples B–D and bracket boundaries pass. The 133 tests include official examples, zero and high wages, federal and state contribution caps, and final-paycheck crossings. The review found incorrect Utah and Maine effective-date coverage and three dead citation URLs; these were corrected. The release audit records primary-source checks, date guards, and remaining limits. Continue monitoring agency revisions after release.

**PAY-003 — Finish 2025 New York.** Implement the 2025 NYS, NYC, and Yonkers withholding schedules from the publications identified by the [NY Tax Department's 2025 notice](https://content.govdelivery.com/accounts/NYTAX/bulletins/3c1a1c6), plus 2025 Paid Family Leave. The notice identifies the 2023 NYS and Yonkers and 2018 NYC tables as the applicable 2025 sources, but the historical PDF links currently return HTTP 404. Retrieve and archive those primary publications before marking the historical module verified. Publish `/new-york/2025/` only after official-example and cap tests pass.

**PAY-004 — Harden paycheck inputs and results.** Core validation, invalid-result handling, and pay-frequency recalculation are implemented. Review optional YTD labels and projection assumptions with users, and audit all state-specific input validation. Keep omitted local taxes visible in the result.

## 2. Finish 2026 state coverage

Add one jurisdiction-specific calculator per state. For each module, record the effective dates, version, verification date, and official government sources. Implement the state withholding method and statewide mandatory employee contributions in code; model any state-specific inputs in Advanced mode. Add golden and boundary tests before setting `status: 'verified'`. Unverified states must remain absent from the state selector, generated pages, and sitemap.

All 50 2026 state calculators and pages are implemented. **District of Columbia** remains a follow-up because its withholding rules and worker programs are not yet verified. County and municipal taxes beyond NYC and Yonkers remain outside V2; Maryland and other affected states disclose that local income tax is excluded. Verify the earlier 2026 West Virginia, Idaho, Utah, and Maine schedules before supporting dates prior to their current rule effective dates. Review Oregon's conflicting published formula numbers with the Department of Revenue before treating estimates exactly at the $50,000 annualized-wage transition as final.

## 3. Complete the product and indexable pages

**PAY-005 — Product completion.** Result sharing and `result_shared` tracking are implemented with state and frequency only. Track `related_salary_clicked` when related pages exist. Review analytics to ensure no exact salary or YTD amount is sent to third parties. Add state-specific examples and assumptions for every state page.

**PAY-006 — SEO and page QA.** The 50 direct HTML pages contain title, description, H1, calculator defaults, result, six common-salary examples, methodology, sources, and internal links. Their current-year URLs self-canonicalize and all 50 are in the sitemap. Review each state explanation for accuracy and add only genuinely state-specific FAQs. Do not create salary or comparison links to pages that do not yet exist. The five indexed `/state/2026/` URLs receive static HTML refresh pages with `noindex` and a canonical to `/state/`; GitHub Pages cannot return HTTP 301 for them.

Desktop and mobile visual QA passed on September 23, 2026 in Chrome. The homepage and New York state page rendered at desktop and 390px mobile widths. Salary, hourly, Advanced, New York City, and Calculate controls updated the breakdown; mobile Calculate scrolled to the result, and the mobile page had no horizontal overflow. The only browser error was a development hydration warning showing Grammarly-added body attributes.

**PAY-007 — Year rollover.** Promote a new current year only when its federal and state rules are verified. Preserve prior-year calculators under `/state/YYYY/`, update current-year duplicate redirects, and test canonical and sitemap changes. Remove the 2026 date assumptions from UI code during this work.

## 4. Deploy and measure

**PAY-008 — Production deployment.** Completed September 23, 2026 on the existing GitHub Pages site. `npm run deploy` tested, built, verified, and published to `gh-pages` commit `54daf01`. The live homepage and representative state pages returned 200 with prerendered calculator content and self canonicals; the legacy `/texas/2026/` page returned its canonical noindex refresh page; a nonexistent path returned 404. The live sitemap contains 55 URLs and Search Console confirmed successful resubmission. GitHub Pages cannot provide HTTP 301 redirects, so the original 301 acceptance criterion remains unmet without a redirect-capable proxy.

**PAY-009 — Search Console review.** After all current-year state pages are live and indexed, report impressions, clicks, CTR, and position by state and query cluster. Use that evidence to choose the first salary buckets. Build salary pages only for observed demand, then add comparison links and the W-2 vs 1099 tool in the later product phase.

## Release gate

The supported 50-state 2026 release passed the calculation, static HTML, desktop and mobile, and live HTTP checks on September 23, 2026. DC and historical periods with unverified tables remain unpublished. HTTP 301 redirects require a hosting change or redirect-capable proxy.
