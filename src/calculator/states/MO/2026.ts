import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const widths = [1348, 1348, 1348, 1348, 1348, 1348, 1348];
const rates = [0, .02, .025, .03, .035, .04, .045];
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MO', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Missouri Withholding Tax Formula', authority: 'Missouri Department of Revenue', url: 'https://dor.mo.gov/forms/Withholding%20Formula_2026.pdf' },
  ],
};

export const mo2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Missouri withholding uses the 2026 annual computer formula. The married default assumes the spouse works unless MO W-4 says otherwise.', 'Kansas City and St. Louis earnings taxes are excluded.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const spouseDoesNotWork = input.stateOptions?.moSpouseDoesNotWork ?? false;
    const extra = input.stateOptions?.moExtraWithholding ?? 0;
    if (typeof spouseDoesNotWork !== 'boolean') throw new Error('Missouri spouse employment setting must be a checkbox');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Missouri extra withholding must be nonnegative');
    const deduction = input.federal.filingStatus === 'head_of_household' ? 24150
      : input.federal.filingStatus === 'married_joint' && spouseDoesNotWork ? 32200 : 16100;
    let remaining = Math.max(0, stateTaxableWages * periods[input.payFrequency] - deduction);
    let annualTax = 0;
    for (let i = 0; i < widths.length; i++) {
      const amount = Math.min(remaining, widths[i]);
      annualTax += Math.round(amount * rates[i]);
      remaining -= amount;
    }
    annualTax += Math.round(remaining * .047 * 100) / 100;
    return {
      incomeTaxWithholding: Math.round(annualTax / periods[input.payFrequency] + extra),
      payrollDeductions: [], localWithholding: 0, localSupported: false, assumptions: [],
    };
  },
};
