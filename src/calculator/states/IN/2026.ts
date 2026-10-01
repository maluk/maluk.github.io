import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const allowanceTables = {
  personal: { weekly: [0,19.23,38.46,57.69,76.92,96.15,115.38], biweekly: [0,38.46,76.92,115.38,153.85,192.31,230.77], semimonthly: [0,41.67,83.33,125,166.67,208.33,250], monthly: [0,83.33,166.67,250,333.33,416.67,500] },
  dependent: { weekly: [0,28.85,57.69,86.54,115.38,144.23], biweekly: [0,57.69,115.38,173.08,230.77,288.46], semimonthly: [0,62.50,125,187.50,250,312.50], monthly: [0,125,250,375,500,625] },
  adopted: { weekly: [0,57.69,115.38,173.08,230.77,288.46], biweekly: [0,115.38,230.77,346.15,461.54,576.92], semimonthly: [0,125,250,375,500,625], monthly: [0,250,500,750,1000,1250] },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'IN', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Departmental Notice #1, effective January 1, 2026', authority: 'Indiana Department of Revenue', url: 'https://www.in.gov/dor/files/dn01.pdf' },
  ],
};

function allowance(kind: keyof typeof allowanceTables, frequency: keyof typeof periods, count: number): number {
  const table = allowanceTables[kind][frequency];
  if (count < table.length) return table[count];
  return roundMoney(count * ({ personal: 1000, dependent: 1500, adopted: 3000 }[kind]) / periods[frequency]);
}

export const in2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Indiana county income tax is not included. County withholding depends on residence or workplace as of January 1.', 'WH-4 exemptions default to zero unless entered.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const personal = Number(input.stateOptions?.inPersonalExemptions ?? 0);
    const dependent = Number(input.stateOptions?.inDependentExemptions ?? 0);
    const firstTime = Number(input.stateOptions?.inFirstTimeDependentExemptions ?? 0);
    const adopted = Number(input.stateOptions?.inAdoptedExemptions ?? 0);
    if (![personal, dependent, firstTime, adopted].every(v => Number.isInteger(v) && v >= 0)) throw new Error('Invalid Indiana WH-4 exemptions');
    const frequency = input.payFrequency;
    const deduction = allowance('personal', frequency, personal) + allowance('dependent', frequency, dependent) + allowance('dependent', frequency, firstTime) + allowance('adopted', frequency, adopted);
    const incomeTaxWithholding = roundMoney(Math.max(0, stateTaxableWages - deduction) * .0295);
    return { incomeTaxWithholding, payrollDeductions: [], localWithholding: 0, localSupported: false, assumptions: [] };
  },
};
