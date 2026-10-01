import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'IL', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 IL-700-T Illinois Withholding Tax Tables', authority: 'Illinois Department of Revenue', url: 'https://tax.illinois.gov/forms/withholding/currentyear/il-700-t-withholding-guide-tables.html' },
  ],
};

export const il2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Illinois uses the IL-700-T formula method with zero IL-W-4 allowances unless entered.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const line1 = Number(input.stateOptions?.ilLine1Allowances ?? 0);
    const line2 = Number(input.stateOptions?.ilLine2Allowances ?? 0);
    const extra = Number(input.stateOptions?.ilExtraWithholding ?? 0);
    if (![line1, line2, extra].every(v => Number.isFinite(v) && v >= 0) || !Number.isInteger(line1) || !Number.isInteger(line2)) throw new Error('Invalid Illinois withholding options');
    const allowance = (line1 * 2925 + line2 * 1000) / periods[input.payFrequency];
    const incomeTaxWithholding = roundMoney(Math.max(0, stateTaxableWages - allowance) * .0495 + extra);
    return { incomeTaxWithholding, payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
