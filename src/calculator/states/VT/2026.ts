import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Row = [threshold: number, base: number, rate: number];
const schedules: Record<string, { allowance: number; single: Row[]; married: Row[] }> = {
  weekly: {
    allowance: 103.85,
    single: [[75, 0, .0335], [1051, 32.70, .066], [2438, 124.24, .076], [5004, 319.25, .0875]],
    married: [[226, 0, .0335], [1855, 54.57, .066], [4164, 206.96, .076], [6227, 363.75, .0875]],
  },
  biweekly: {
    allowance: 207.69,
    single: [[151, 0, .0335], [2103, 65.39, .066], [4876, 248.41, .076], [10009, 638.52, .0875]],
    married: [[453, 0, .0335], [3711, 109.14, .066], [8328, 413.87, .076], [12455, 727.52, .0875]],
  },
  semimonthly: {
    allowance: 225,
    single: [[164, 0, .0335], [2278, 70.82, .066], [5282, 269.08, .076], [10843, 691.72, .0875]],
    married: [[491, 0, .0335], [4020, 118.22, .066], [9022, 448.35, .076], [13493, 788.15, .0875]],
  },
  monthly: {
    allowance: 450,
    single: [[327, 0, .0335], [4556, 141.67, .066], [10565, 538.27, .076], [21685, 1383.39, .0875]],
    married: [[981, 0, .0335], [8040, 236.48, .066], [18044, 896.74, .076], [26985, 1576.26, .0875]],
  },
};

const metadata: TaxRuleMetadata = {
  jurisdiction: 'VT', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'GB-1210-2026, Income Tax Withholding Instructions, Tables, and Charts', authority: 'Vermont Department of Taxes', url: 'https://tax.vermont.gov/sites/tax/files/documents/GB-1210-2026.pdf' },
    { title: 'Child Care Contribution', authority: 'Vermont Department of Taxes', url: 'https://tax.vermont.gov/business/child-care-contribution' },
    { title: 'Form W-4VT, Employee’s Withholding Allowance Certificate', authority: 'Vermont Department of Taxes', url: 'https://tax.vermont.gov/sites/tax/files/documents/W-4VT.pdf' },
  ],
};

export const vt2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Vermont uses the 2026 percentage table for the pay period and the W-4VT single or married schedule. Head-of-household defaults to the single schedule with one allowance.',
    'The estimate assumes the employer withholds the maximum permitted 0.11% employee share of the Child Care Contribution. Employers can cover the entire contribution.',
    'W-4VT allowances and extra withholding can be changed in Advanced options. The calculator does not infer a Vermont W-4VT from federal dependent credits.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.vtAllowances ?? (input.federal.filingStatus === 'head_of_household' ? 1 : 0);
    const extra = input.stateOptions?.vtExtraWithholding ?? 0;
    const cccRate = input.stateOptions?.vtCccEmployeeRate ?? .0011;
    const higherSingle = input.stateOptions?.vtSingleRate ?? false;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Vermont allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Vermont extra withholding must be nonnegative');
    if (typeof cccRate !== 'number' || !Number.isFinite(cccRate) || cccRate < 0 || cccRate > .0011) throw new Error('Vermont Child Care employee rate must be between zero and 0.11%');
    if (typeof higherSingle !== 'boolean') throw new Error('Vermont single-rate election must be a checkbox');
    const schedule = schedules[input.payFrequency];
    const rows = input.federal.filingStatus === 'married_joint' && !higherSingle ? schedule.married : schedule.single;
    const wage = Math.max(0, stateTaxableWages - allowances * schedule.allowance);
    let tax = 0;
    for (const [threshold, base, rate] of rows) {
      if (wage <= threshold) break;
      tax = base + (wage - threshold) * rate;
    }
    return {
      incomeTaxWithholding: roundMoney(tax + extra),
      payrollDeductions: [{ id: 'vt-child-care', label: 'Vermont Child Care Contribution', amount: roundMoney(stateTaxableWages * cccRate) }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
