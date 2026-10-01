import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [upper: number, base: number, rate: number, over: number];
const tables: Record<PayFrequency, Record<'single' | 'married', Step[]>> = {
  weekly: {
    single: [[194, 0, 0, 0], [216, 0, .025, 194], [261, .55, .035, 216], [Infinity, 2.10, .045, 261]],
    married: [[388, 0, 0, 0], [433, 0, .025, 388], [521, 1.11, .035, 433], [Infinity, 4.20, .045, 521]],
  },
  biweekly: {
    single: [[388, 0, 0, 0], [433, 0, .025, 388], [521, 1.11, .035, 433], [Infinity, 4.20, .045, 521]],
    married: [[777, 0, 0, 0], [865, 0, .025, 777], [1042, 2.21, .035, 865], [Infinity, 8.40, .045, 1042]],
  },
  semimonthly: {
    single: [[421, 0, 0, 0], [469, 0, .025, 421], [565, 1.20, .035, 469], [Infinity, 4.55, .045, 565]],
    married: [[842, 0, 0, 0], [938, 0, .025, 842], [1129, 2.40, .035, 938], [Infinity, 9.10, .045, 1129]],
  },
  monthly: {
    single: [[842, 0, 0, 0], [938, 0, .025, 842], [1129, 2.40, .035, 938], [Infinity, 9.10, .045, 1129]],
    married: [[1683, 0, 0, 0], [1875, 0, .025, 1683], [2258, 4.79, .035, 1875], [Infinity, 18.21, .045, 2258]],
  },
};
const allowance: Record<PayFrequency, number> = { weekly: 19.23, biweekly: 38.46, semimonthly: 41.67, monthly: 83.33 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'OK', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Packet OW-2 Oklahoma Income Tax Withholding Tables', authority: 'Oklahoma Tax Commission', url: 'https://www.oklahoma.gov/content/dam/ok/en/tax/documents/resources/publications/businesses/withholding-tables/WHTables-2026.pdf' },
  ],
};

export const ok2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Oklahoma uses the 2026 OW-2 percentage formula and rounds income tax withholding to whole dollars.',
    'The estimate starts with zero OK-W-4 allowances; enter the employee’s election in Advanced options.',
    'Married employees can elect the higher single withholding schedule on OK-W-4.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.okAllowances ?? 0;
    const singleRate = input.stateOptions?.okSingleRate ?? false;
    const extra = input.stateOptions?.okExtraWithholding ?? 0;
    const exempt = input.stateOptions?.okExempt ?? false;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Oklahoma allowances must be nonnegative whole numbers');
    if (typeof singleRate !== 'boolean' || typeof exempt !== 'boolean') throw new Error('Oklahoma election must be a checkbox');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Oklahoma extra withholding must be nonnegative');
    const wages = Math.max(0, roundMoney(stateTaxableWages - roundMoney(allowances * allowance[input.payFrequency])));
    const schedule = input.federal.filingStatus === 'married_joint' && !singleRate ? 'married' : 'single';
    const step = tables[input.payFrequency][schedule].find(([upper]) => wages <= upper)!;
    const tax = Math.floor(Math.max(0, step[1] + (wages - step[3]) * step[2]) + .5);
    return {
      incomeTaxWithholding: exempt ? 0 : roundMoney(tax + extra),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
