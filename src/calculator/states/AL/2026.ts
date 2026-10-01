import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
type AlabamaStatus = 'zero' | 'single' | 'separate' | 'joint' | 'head';
const metadata: TaxRuleMetadata = {
  jurisdiction: 'AL', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Alabama Withholding Tax Tables and Instructions, pages 7–8', authority: 'Alabama Department of Revenue', url: 'https://www.revenue.alabama.gov/wp-content/uploads/2026/01/whbooklet_0126.pdf' },
  ],
};

function standardDeduction(gross: number, status: AlabamaStatus): number {
  if (status === 'separate') {
    if (gross <= 12999) return 4250;
    if (gross >= 17750) return 2500;
    return Math.max(2500, 4250 - 88 * Math.ceil((gross - 12999) / 250));
  }
  const [start, step, minimum] = status === 'joint' ? [8500, 175, 5000]
    : status === 'head' ? [5200, 135, 2500] : [3000, 25, 2500];
  if (gross <= 25999) return start;
  if (gross >= 35500) return minimum;
  return Math.max(minimum, start - step * Math.ceil((gross - 25999) / 500));
}

export const al2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Alabama Form A-4 follows the selected filing status and assumes zero dependents until entered.',
    'The Alabama deduction for federal income tax uses this paycheck’s calculated federal withholding.',
    'Alabama local occupational taxes are excluded.',
  ],
  calculate({ input, stateTaxableWages, federalIncomeTaxWithholding = 0 }: StateInput): StateResult {
    const dependents = input.stateOptions?.alDependents ?? 0;
    const zeroExemption = input.stateOptions?.alZeroExemption ?? false;
    if (typeof dependents !== 'number' || !Number.isInteger(dependents) || dependents < 0) throw new Error('Alabama dependents must be a nonnegative whole number');
    if (typeof zeroExemption !== 'boolean') throw new Error('Alabama zero-exemption setting must be a checkbox');
    const filingStatus = input.federal.filingStatus;
    const status: AlabamaStatus = zeroExemption ? 'zero' : filingStatus === 'married_joint' ? 'joint'
      : filingStatus === 'married_separate' ? 'separate' : filingStatus === 'head_of_household' ? 'head' : 'single';
    const count = periods[input.payFrequency];
    const annualGross = stateTaxableWages * count;
    const dependentDeduction = annualGross <= 50000 ? 1000 : annualGross <= 100000 ? 500 : 300;
    const personalExemption = status === 'zero' ? 0 : status === 'joint' || status === 'head' ? 3000 : 1500;
    const annualTaxable = Math.max(0, annualGross - standardDeduction(annualGross, status)
      - federalIncomeTaxWithholding * count - personalExemption - dependents * dependentDeduction);
    const joint = status === 'joint';
    const first = joint ? 1000 : 500;
    const second = joint ? 5000 : 2500;
    const annualTax = Math.min(annualTaxable, first) * .02
      + Math.min(Math.max(0, annualTaxable - first), second) * .04
      + Math.max(0, annualTaxable - first - second) * .05;
    return { incomeTaxWithholding: roundMoney(annualTax / count), payrollDeductions: [], localWithholding: 0, localSupported: false, assumptions: [] };
  },
};
