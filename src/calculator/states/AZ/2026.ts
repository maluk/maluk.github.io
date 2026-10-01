import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const allowedRates = new Set([0, 0.005, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035]);
const metadata: TaxRuleMetadata = {
  jurisdiction: 'AZ', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Form A-4, Employee’s Arizona Withholding Election', authority: 'Arizona Department of Revenue', url: 'https://azdor.gov/sites/default/files/document/FORMS_WITHHOLDING_2026_A-4_f.pdf' },
    { title: 'Withholding Tax for Individuals', authority: 'Arizona Department of Revenue', url: 'https://azdor.gov/individuals/withholding-tax-individual' },
  ],
};

export const az2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Arizona Form A-4 lets the employee elect a wage withholding percentage. The default is 2.0% if no A-4 is supplied.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const rate = input.stateOptions?.azWithholdingRate ?? .02;
    const extra = input.stateOptions?.azExtraWithholding ?? 0;
    if (typeof rate !== 'number' || !allowedRates.has(rate) || typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Invalid Arizona A-4 withholding election');
    return {
      incomeTaxWithholding: roundMoney(stateTaxableWages * rate + extra),
      payrollDeductions: [], localWithholding: 0, localSupported: true,
      assumptions: [],
    };
  },
};
