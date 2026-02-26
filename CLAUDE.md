# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:3000
npm test           # Run tests (interactive watch mode)
npm test -- --watchAll=false  # Run tests once (non-interactive)
npm run build      # Production build to ./build
```

**Build note:** Due to webpack 4 + Node 18 compatibility, the CI uses `NODE_OPTIONS=--openssl-legacy-provider`. If builds fail locally with OpenSSL errors, prepend this env var.

## Architecture

This is a Create React App (React 16 + Material-UI v4) paycheck tax calculator deployed to thetax.us via GitHub Pages.

### Data flow

```
src/calc/data.js          ← Static tax bracket tables (federal + state)
    ↓ imported by
src/util/calcutil.js      ← Pure calculation functions
    ↓ imported by
src/components/calculatorcomponent.js  ← Stateful class component (form + results)
    ↓ rendered by
src/App.js                ← MUI ThemeProvider wrapper + disclaimer footer
```

### Tax data structure (`src/calc/data.js`)

- `w` — federal brackets, keyed by year → filing status (`s`/`m`) → `{deduction, brackets}`
- `s` — state brackets, keyed by state code (`CA`, `NY`, `WA`, `TX`) → year → filing status → same shape

Each bracket object: `{ p: marginalRate, s: precomputedTaxForLowerBrackets }`. Bracket keys are the lower bound of income above the deduction.

### Calculation logic (`src/util/calcutil.js`)

`calculateProgressive(taxes, grossIncome, status, year)`:
1. Subtract standard deduction → taxable income
2. Walk bracket keys to find the applicable bracket
3. Apply `tax = (incomeAboveBracketFloor × p) + s`

The exported `calculate(g, status, year, state)` calls all sub-calculators and returns:
```js
{ fed, state, social, medicare, sdi, totals: { net, netMonthly, tax } }
```

FICA is hardcoded: Social Security at 6.2% capped at $8,239.80; Medicare at 1.45% (+ 0.9% above $200k). SDI is only applied for CA.

### Adding a new state

1. Add state brackets to `src/calc/data.js` under `s` (match the CA/NY shape)
2. Add a `<Chip>` button in `calculatorcomponent.js` for the state selector
3. If the state has SDI, add handling in `calculateSdi()` in `calcutil.js`

### Adding a new tax year

Add the year to both `w` (federal) and all state entries in `s` in `src/calc/data.js`, then add a `<Chip>` in the Year selector row in `calculatorcomponent.js`.

## Deployment

Pushes to `master` auto-deploy via GitHub Actions (`.github/workflows/node.js.yml`) → `gh-pages` branch → thetax.us (custom domain via CNAME).

To deploy manually, use the `/deploy` Claude skill or run:

```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build && npm run deploy
```

## Pull Requests

Use the `gh` CLI to create pull requests:

```bash
gh pr create --title "your title" --body "description"
```

Always create a new branch before opening a PR — never commit directly to `master`.
