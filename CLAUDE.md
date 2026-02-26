# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start dev server at localhost:3000
npm run build        # Production build (also used as the CI test gate)
npm test             # Run tests in interactive watch mode
```

**Note:** On newer Node versions (18+), the build requires `NODE_OPTIONS=--openssl-legacy-provider` due to the older `react-scripts` version. This is already set in the Dockerfile.

## Architecture

This is a **US Paycheck Tax Calculator** React app (Create React App) deployed at `thetax.us`. It uses Material-UI v4.

### Data flow

1. `src/calc/data.js` — All tax bracket data, exported as two objects:
   - `w` — Federal brackets: `w[year][status]` → `{deduction, brackets}`
   - `s` — State brackets: `s[state][year][status]` → `{deduction, brackets}`
   - Bracket entries use `{p: rate, s: cumulative_tax_at_bracket_start}` — the bracket key is the income threshold where that rate begins
   - Supported states: CA, NY, TX, WA; supported years: 2025, 2026 (and 2024 historical)

2. `src/util/calcutil.js` — Core calculation logic. The exported `calculate(income, status, year, state)` function calls individual calculators and returns `{fed, state, social, medicare, sdi, totals}`. Notable:
   - `calculateProgressive()` looks up the appropriate bracket by walking sorted bracket keys
   - Social Security uses a flat rate with a cap
   - Medicare has an additional 0.9% on income above $200k
   - SDI is CA-only, with hardcoded rates by year

3. `src/components/calculatorcomponent.js` — Single class component holding all UI state (`income`, `status`, `year`, `state`) and the derived `calculation` object. Calls `calculate()` on every state change (no debounce). Renders input, chip selectors, and results tables.

4. `src/App.js` — Thin wrapper: sets up MUI `ThemeProvider` and renders `CalculatorComponent`.

### Adding a new year's tax data

Add entries to both `w` (federal) and `s[state]` (for each supported state) in `src/calc/data.js`, following the existing bracket format. Also add the new year as a `<Chip>` in `calculatorcomponent.js`.

### Adding a new state

Add the state's data under `s[STATE_CODE]` in `src/calc/data.js` (for all supported years), then add a `<Chip>` for it in `calculatorcomponent.js`.

## Deployment

The app is deployed via GitHub Actions to GitHub Pages (`gh-pages` branch). `npm run predeploy` (build) runs automatically before `npm run deploy`.

## Pull Requests

Use the `gh` CLI to create pull requests:

```bash
gh pr create --title "your title" --body "description"
```

Always create a new branch before opening a PR — never commit directly to `master`.
