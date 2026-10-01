import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MI', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1',
  sources: [{
    title: '2026 Michigan Income Tax Withholding Guide (Form 446)',
    authority: 'Michigan Department of Treasury',
    url: 'https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/SUW/TY2026/446_Withholding-Guide_2026.pdf',
  }],
};

export const mi2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Michigan withholding uses the MI-W4 exemption count; the default is zero.', 'Michigan city income taxes are excluded.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const exemptions = Number(input.stateOptions?.miExemptions ?? 0);
    if (!Number.isInteger(exemptions) || exemptions < 0) throw new Error('Michigan MI-W4 exemptions must be a nonnegative whole number');
    const taxable = Math.max(0, stateTaxableWages - 5900 * exemptions / periods[input.payFrequency]);
    return {
      incomeTaxWithholding: roundMoney(taxable * .0425),
      payrollDeductions: [],
      localWithholding: 0,
      localSupported: false,
      assumptions: [],
    };
  },
};
