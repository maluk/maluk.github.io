import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'SC', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Formula for Computing South Carolina 2026 Withholding Tax, WH-1603F', authority: 'South Carolina Department of Revenue', url: 'https://dor.sc.gov/sites/dor/files/SoftwareDeveloperForms/WH1603F_2026.pdf' },
  ],
};

export const sc2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['South Carolina SC W-4 allowances default to zero until entered. With one or more allowances, the standard deduction is 10% of annualized wages, capped at $7,500.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.scAllowances ?? 0;
    const extra = input.stateOptions?.scExtraWithholding ?? 0;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0 ||
      typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) {
      throw new Error('South Carolina allowances must be whole numbers and extra withholding must be nonnegative');
    }
    const annualGross = stateTaxableWages * periods[input.payFrequency];
    const standardDeduction = allowances > 0 ? Math.min(annualGross * .1, 7500) : 0;
    const taxable = Math.max(0, annualGross - allowances * 5000 - standardDeduction);
    const annualTax = taxable < 3640 ? 0 : taxable < 18230 ? (taxable - 3640) * .03 : (taxable - 18230) * .06 + 437.70;
    return {
      incomeTaxWithholding: roundMoney(annualTax / periods[input.payFrequency] + extra),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
