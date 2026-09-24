import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const deductions = {
  weekly: { other: 250, head: 375, joint: 500 },
  biweekly: { other: 500, head: 750, joint: 1000 },
  semimonthly: { other: 541.67, head: 812.50, joint: 1083.33 },
  monthly: { other: 1083.33, head: 1625, joint: 2166.67 },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'IA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Iowa Individual Income Tax Withholding Formula, effective January 1, 2026', authority: 'Iowa Department of Revenue', url: 'https://revenue.iowa.gov/media/53/download?inline=' },
  ],
};

export const ia2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Iowa uses the 2026 IA W-4 formula with zero annual allowance dollars unless entered.', 'The married default assumes a spouse with no earned income, as the 2026 IA W-4 directs when that answer is blank.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const spouseEarnedIncome = input.stateOptions?.iaSpouseEarnedIncome ?? false;
    const allowance = input.stateOptions?.iaAnnualAllowance ?? 0;
    const extra = input.stateOptions?.iaExtraWithholding ?? 0;
    if (typeof spouseEarnedIncome !== 'boolean') throw new Error('Iowa spouse income setting must be a checkbox');
    if (typeof allowance !== 'number' || !Number.isFinite(allowance) || allowance < 0 || typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Iowa IA W-4 amounts must be nonnegative');
    const group = input.federal.filingStatus === 'head_of_household' ? 'head'
      : input.federal.filingStatus === 'married_joint' && !spouseEarnedIncome ? 'joint' : 'other';
    const deduction = deductions[input.payFrequency][group];
    const taxablePeriod = Math.max(0, roundMoney(stateTaxableWages - deduction));
    const baseTax = roundMoney(taxablePeriod * .038);
    return {
      incomeTaxWithholding: Math.max(0, roundMoney(baseTax - allowance / periods[input.payFrequency] + extra)),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
