import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'VA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Withholding Tables for Wages Paid after July 1, 2025', authority: 'Virginia Department of Taxation', url: 'https://www.tax.virginia.gov/sites/default/files/taxforms/withholding/any/employer-withholding-tables-july-2025-and-later-any.pdf' },
  ],
};

export const va2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Virginia withholding uses the exact employer formula with the $8,750 deduction shown in the official table, independent of federal filing status. Personal and age/blind VA-4 exemptions default to zero.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const personal = input.stateOptions?.vaPersonalExemptions ?? 0;
    const ageBlind = input.stateOptions?.vaAgeBlindExemptions ?? 0;
    if (typeof personal !== 'number' || !Number.isInteger(personal) || personal < 0 || typeof ageBlind !== 'number' || !Number.isInteger(ageBlind) || ageBlind < 0) throw new Error('Virginia VA-4 exemptions must be nonnegative whole numbers');
    const count = periods[input.payFrequency];
    const taxable = Math.max(0, stateTaxableWages * count - 8750 - personal * 930 - ageBlind * 800);
    const annual = taxable <= 3000 ? taxable * .02
      : taxable <= 5000 ? 60 + (taxable - 3000) * .03
        : taxable <= 17000 ? 120 + (taxable - 5000) * .05
          : 720 + (taxable - 17000) * .0575;
    return {
      incomeTaxWithholding: roundMoney(Math.round(annual) / count),
      payrollDeductions: [], localWithholding: 0, localSupported: true,
      assumptions: [],
    };
  },
};
