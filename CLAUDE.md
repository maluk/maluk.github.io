# Repository guide

TheTax.us is a Next.js 16 static-export paycheck calculator. The UI is in `app/` and `src/components/`; the deterministic, UI-independent calculation library is in `src/calculator/`.

## Commands

```sh
npm ci
npm test
npm run build
```

The build produces `out/`. CI verifies tests and build, then uploads that directory as an artifact. It does not deploy to production.

## Payroll rules

`src/calculator/federal/` implements federal withholding and FICA. Each state module in `src/calculator/states/XX/YYYY.ts` contains its own withholding logic and official-source metadata. The registry in `src/calculator/states/index.ts` only exposes rule modules marked `verified`. `src/site/states.ts` controls current-year page generation and the state selector.

When editing a tax rule, use the applicable primary government publication, update its verification metadata, and add a worked-example or boundary test. Keep local income taxes visible when omitted. Do not infer annual tax liability from paycheck withholding.

The branch contains all 50 state engines for 2026. Historical 2025 support exists for CA, FL, TX, and WA. The remaining release work is tracked in `docs/paycheck-v2-remaining-plan.md`.
