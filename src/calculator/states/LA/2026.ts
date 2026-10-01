import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'LA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Form R-1210, 2026 Withholding Tax Formula Method', authority: 'Louisiana Department of Revenue', url: 'https://dam.ldr.la.gov/taxforms/R-1210-1-26.pdf' },
  ],
};

export const la2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Louisiana uses the 2026 Form R-1210 formula at a 3.09% withholding rate after the elected L-4 standard deduction.',
    'The estimate assumes one standard deduction for single or married-separate filers and two for joint or head-of-household filers.',
    'Employees without a completed L-4 have withholding on all wages; choose no standard deduction in Advanced options.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const noDeduction = input.stateOptions?.laNoStandardDeduction ?? false;
    const extra = input.stateOptions?.laExtraWithholding ?? 0;
    if (typeof noDeduction !== 'boolean') throw new Error('Louisiana standard deduction setting must be a checkbox');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Louisiana extra withholding must be nonnegative');
    const jointOrHead = input.federal.filingStatus === 'married_joint' || input.federal.filingStatus === 'head_of_household';
    const deduction = noDeduction ? 0 : jointOrHead ? 25750 : 12875;
    const wages = Math.max(0, stateTaxableWages - deduction / periods[input.payFrequency]);
    return { incomeTaxWithholding: roundMoney(wages * .0309 + extra), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
