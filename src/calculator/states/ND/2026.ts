import type { FilingStatus, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const tables: Record<FilingStatus, [first: number, second: number, secondBase: number]> = {
  single: [57625, 258450, 3916.09],
  married_separate: [57625, 258450, 3916.09],
  married_joint: [57500, 168525, 2164.99],
  head_of_household: [78475, 289675, 4118.40],
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'ND', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'North Dakota Income Tax Withholding Rates and Instructions, 2026 Calendar Year', authority: 'North Dakota Office of State Tax Commissioner', url: 'https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2026-iit/2026-income-tax-withholding-rates-booklet.pdf' },
  ],
};

export const nd2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'North Dakota uses its 2026 percentage method for Forms W-4 from 2020 onward and rounds each paycheck’s state withholding to the nearest dollar.',
    'Married filing separately uses the Single W-4 withholding schedule.',
    'North Dakota’s published current-W-4 worksheet uses filing status and taxable wages; other federal W-4 fields do not enter the state formula.',
    'The guide’s $1,800 weekly worked example conflicts with its published Single percentage table; this estimate follows the table.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const extra = input.stateOptions?.ndExtraWithholding ?? 0;
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('North Dakota extra withholding must be nonnegative');
    const count = periods[input.payFrequency];
    const wages = stateTaxableWages * count;
    const [first, second, secondBase] = tables[input.federal.filingStatus];
    const annual = wages < first ? 0 : wages < second ? (wages - first) * .0195 : secondBase + (wages - second) * .025;
    return {
      incomeTaxWithholding: Math.floor(Math.max(0, annual / count) + .5) + roundMoney(extra),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
