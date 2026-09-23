import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'KY', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Withholding Tax Tables: Computer Formula 42A003', authority: 'Kentucky Department of Revenue', url: 'https://revenue.ky.gov/Software-Developer/Software%20Development%20Documents/2026%20Withholding%20Tax%20Tables%20-%20Computer%20Formula%2042A003%20%28TCF%29%2810-2025%29%282026%29.pdf' },
    { title: 'Employer Payroll Withholding', authority: 'Kentucky Department of Revenue', url: 'https://revenue.ky.gov/Business/Pages/Employer-Payroll-Withholding.aspx' },
  ],
};

export const ky2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Kentucky withholding uses the 2026 computer formula with a $3,360 annual standard deduction and a 3.5% rate.', 'Local occupational license taxes are excluded.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const count = periods[input.payFrequency];
    const taxableAnnual = Math.max(0, stateTaxableWages * count - 3360);
    return {
      incomeTaxWithholding: roundMoney(taxableAnnual * .035 / count),
      payrollDeductions: [], localWithholding: 0, localSupported: false, assumptions: [],
    };
  },
};
