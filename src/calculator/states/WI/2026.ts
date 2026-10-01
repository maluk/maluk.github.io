import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'WI', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Publication W-166, January 2026, approved alternate withholding method', authority: 'Wisconsin Department of Revenue', url: 'https://www.revenue.wi.gov/DOR%20Publications/pb166.pdf' },
  ],
};

function annualTax(wage: number): number {
  if (wage <= 12760) return wage * .0354;
  if (wage <= 25520) return 451.70 + (wage - 12760) * .0465;
  if (wage <= 280950) return 1045.04 + (wage - 25520) * .053;
  return 14582.83 + (wage - 280950) * .0765;
}

export const wi2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Wisconsin uses the department-approved alternate method in Publication W-166, not its wage-bracket tables.',
    'Married filing jointly uses the married withholding deduction; other filing statuses use the single deduction.',
    'The estimate starts with zero Wisconsin WT-4 exemptions until they are entered in Advanced options.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.wiExemptions ?? 0;
    const extra = input.stateOptions?.wiExtraWithholding ?? 0;
    const exempt = input.stateOptions?.wiExempt ?? false;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Wisconsin exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Wisconsin extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('Wisconsin exempt setting must be a checkbox');
    const count = periods[input.payFrequency];
    const annualGross = stateTaxableWages * count;
    const married = input.federal.filingStatus === 'married_joint';
    const deduction = married
      ? annualGross < 25727 ? 9461 : annualGross >= 73032 ? 0 : 9461 - .2 * (annualGross - 25727)
      : annualGross < 17780 ? 6702 : annualGross >= 73630 ? 0 : 6702 - .12 * (annualGross - 17780);
    const annualNet = Math.max(0, annualGross - deduction - exemptions * 400);
    return {
      incomeTaxWithholding: exempt ? 0 : Math.max(0, roundMoney(annualTax(annualNet) / count + extra)),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
