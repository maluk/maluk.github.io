import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';

const periodAmounts = {
  weekly: { standard: 245.19, head: 367.79, allowance: 48.08 },
  biweekly: { standard: 490.38, head: 735.58, allowance: 96.15 },
  semimonthly: { standard: 531.25, head: 796.88, allowance: 104.17 },
  monthly: { standard: 1062.50, head: 1593.75, allowance: 208.33 },
};

const metadata: TaxRuleMetadata = {
  jurisdiction: 'NC', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1',
  sources: [{
    title: '2026 Income Tax Withholding Tables and Instructions for Employers, NC-30',
    authority: 'North Carolina Department of Revenue',
    url: 'https://www.ncdor.gov/income-tax-withholding-tables-and-instructions-employers/open',
  }],
};

export const nc2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['North Carolina uses the NC-30 percentage method and zero NC-4 allowances unless entered. The withholding rate is 4.09%, including the 0.1 percentage point withholding adjustment.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const allowances = Number(input.stateOptions?.ncAllowances ?? 0);
    if (!Number.isInteger(allowances) || allowances < 0) throw new Error('North Carolina NC-4 allowances must be a nonnegative whole number');
    const amounts = periodAmounts[input.payFrequency];
    const standard = input.federal.filingStatus === 'head_of_household' ? amounts.head : amounts.standard;
    const taxable = Math.max(0, stateTaxableWages - standard - allowances * amounts.allowance);
    return {
      incomeTaxWithholding: Math.round(taxable * .0409),
      payrollDeductions: [],
      localWithholding: 0,
      localSupported: true,
      assumptions: [],
    };
  },
};
