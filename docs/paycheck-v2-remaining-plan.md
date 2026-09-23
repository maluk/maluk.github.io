# Paycheck Calculator V2: remaining work

Status on 2026-09-22: the branch exports the homepage, all 50 current-year state pages, and four 2025 historical pages. It has 125 passing calculation tests. The branch is not deployed; CI currently uploads the static build as an artifact. The V2 definition of done is not yet met.

Completed since the first draft: input validation fails closed for invalid pay dates, W-4 values, deductions, and negative net pay; an invalid entry hides the prior result. Period comparisons run a separate withholding calculation for each frequency. The result can be shared without sending wage amounts to analytics. The 50 current-year state modules now include jurisdiction-specific withholding logic and applicable statewide employee contributions. Georgia and Ohio select the withholding schedule using their 2026 change dates. West Virginia rejects pay dates before June 12, 2026, and Idaho rejects pay dates before July 31, 2026, until their earlier schedules are verified. North Dakota, New Mexico, and Oregon publish internally inconsistent examples or thresholds; their engines follow the cited formula tables and disclose the discrepancy. Maryland's county income tax is excluded and prominently disclosed. Each state page contains an HTML-rendered result, four pay-frequency comparisons, six common-salary examples, primary sources, and a verification date.

## 1. Close the accuracy gate on existing coverage

**PAY-002 — Audit the implemented rules.** Review the 2026 CA, FL, NY, TX, WA, AK, NV, SD, TN, NH, WY, PA, IL, and IN modules and the 2025 CA, FL, TX, and WA modules against each jurisdiction's primary payroll source. Add a named official-example golden test for every jurisdiction/year where one exists, plus zero-wage, high-wage, wage-cap, and final-paycheck crossing tests for applicable programs. Check deduction wage treatment by state, especially 401(k), HSA, and cafeteria benefits. Any rule that cannot be substantiated returns to `pending_review` and leaves the sitemap until corrected.

**PAY-003 — Finish 2025 New York.** Implement the 2025 NYS, NYC, and Yonkers withholding schedules from the publications identified by the NY Tax Department's 2025 notice, plus 2025 Paid Family Leave. Publish `/new-york/2025/` only after official-example and cap tests pass.

**PAY-004 — Harden paycheck inputs and results.** Core validation, invalid-result handling, and pay-frequency recalculation are implemented. Review optional YTD labels and projection assumptions with users, and audit all state-specific input validation. Keep omitted local taxes visible in the result.

## 2. Finish 2026 state coverage

Add one jurisdiction-specific calculator per state. For each module, record the effective dates, version, verification date, and official government sources. Implement the state withholding method and statewide mandatory employee contributions in code; model any state-specific inputs in Advanced mode. Add golden and boundary tests before setting `status: 'verified'`. Unverified states must remain absent from the state selector, generated pages, and sitemap.

All 50 2026 state calculators and pages are implemented. Add **District of Columbia** in the same release if its withholding rules and worker programs can be verified. County and municipal taxes beyond NYC and Yonkers remain outside V2; Maryland and other affected states disclose that local income tax is excluded. Verify the earlier 2026 West Virginia and Idaho schedules before supporting dates prior to their current rule effective dates. Review Oregon's conflicting published formula numbers with the Department of Revenue before treating estimates exactly at the $50,000 annualized-wage transition as final.

## 3. Complete the product and indexable pages

**PAY-005 — Product completion.** Result sharing and `result_shared` tracking are implemented with state and frequency only. Track `related_salary_clicked` when related pages exist. Review analytics to ensure no exact salary or YTD amount is sent to third parties. Add state-specific examples and assumptions for every state page.

**PAY-006 — SEO and page QA.** The 50 direct HTML pages contain title, description, H1, calculator defaults, result, six common-salary examples, methodology, sources, and internal links. Their current-year URLs self-canonicalize and all 50 are in the sitemap. Review each state explanation for accuracy and add only genuinely state-specific FAQs. Do not create salary or comparison links to pages that do not yet exist.

**PAY-007 — Year rollover.** Promote a new current year only when its federal and state rules are verified. Preserve prior-year calculators under `/state/YYYY/`, update current-year duplicate redirects, and test canonical and sitemap changes. Remove the 2026 date assumptions from UI code during this work.

## 4. Deploy and measure

**PAY-008 — Production deployment.** Configure the Cloudflare Pages project and production CI from the tested `out/` artifact. Attach the domain, verify HTTP 301 responses for the five existing `/state/2026/` duplicates, check 404 and canonical behavior, then submit the sitemap. The current CI artifact step does not deploy the site. Keep production changes behind the normal release review.

**PAY-009 — Search Console review.** After all current-year state pages are live and indexed, report impressions, clicks, CTR, and position by state and query cluster. Use that evidence to choose the first salary buckets. Build salary pages only for observed demand, then add comparison links and the W-2 vs 1099 tool in the later product phase.

## Release gate

V2 launches only when all 50 state engines (and DC if ready) have verified official sources, each jurisdiction has golden and boundary tests, mandatory statewide employee deductions are accounted for, the complete calculator UI is tested on desktop and mobile, and the live static pages and redirects pass direct HTTP checks.
