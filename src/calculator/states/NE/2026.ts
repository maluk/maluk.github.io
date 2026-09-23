import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [upper: number, base: number, rate: number, over: number];
const tables: Record<PayFrequency, Record<'single' | 'married', Step[]>> = {
  weekly: {
    single: [[66, 0, 0, 0], [129, 0, .0226, 66], [419, 1.42, .0322, 129], [608, 10.76, .0421, 419], [772, 18.72, .0435, 608], [1449, 25.85, .0448, 772], [Infinity, 56.18, .046, 1449]],
    married: [[132, 0, 0, 0], [258, 0, .0226, 132], [839, 2.85, .0322, 258], [1216, 21.56, .0421, 839], [1543, 37.43, .0435, 1216], [2899, 51.65, .0448, 1543], [Infinity, 112.40, .046, 2899]],
  },
  biweekly: {
    single: [[158, 0, 0, 0], [250, 0, .0226, 158], [623, 2.08, .0322, 250], [969, 14.09, .0421, 623], [1203, 28.66, .0435, 969], [1595, 38.84, .0448, 1203], [Infinity, 56.40, .046, 1595]],
    married: [[315, 0, 0, 0], [500, 0, .0226, 315], [1246, 4.18, .0322, 500], [1938, 28.20, .0421, 1246], [2405, 57.33, .0435, 1938], [3189, 77.64, .0448, 2405], [Infinity, 112.76, .046, 3189]],
  },
  semimonthly: {
    single: [[143, 0, 0, 0], [280, 0, .0226, 143], [909, 3.10, .0322, 280], [1317, 23.35, .0421, 909], [1672, 40.53, .0435, 1317], [3140, 55.97, .0448, 1672], [Infinity, 121.74, .046, 3140]],
    married: [[341, 0, 0, 0], [542, 0, .0226, 341], [1350, 4.54, .0322, 542], [2100, 30.56, .0421, 1350], [2605, 62.14, .0435, 2100], [3455, 84.11, .0448, 2605], [Infinity, 122.19, .046, 3455]],
  },
  monthly: {
    single: [[286, 0, 0, 0], [559, 0, .0226, 286], [1818, 6.17, .0322, 559], [2634, 46.71, .0421, 1818], [3344, 81.06, .0435, 2634], [6281, 111.95, .0448, 3344], [Infinity, 243.53, .046, 6281]],
    married: [[683, 0, 0, 0], [1084, 0, .0226, 683], [2700, 9.06, .0322, 1084], [4200, 61.10, .0421, 2700], [5211, 124.25, .0435, 4200], [6910, 168.23, .0448, 5211], [Infinity, 244.35, .046, 6910]],
  },
};
const allowance: Record<PayFrequency, number> = { weekly: 46.92, biweekly: 93.85, semimonthly: 101.67, monthly: 203.33 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'NE', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Nebraska Circular EN, percentage method and special withholding procedure', authority: 'Nebraska Department of Revenue', url: 'https://revenue.nebraska.gov/sites/default/files/doc/business/Cir_En_2025/2026cir_en_whole.pdf' },
  ],
};

function tableTax(wages: number, steps: Step[]): number {
  const step = steps.find(([upper]) => wages <= upper)!;
  return Math.max(0, step[1] + (wages - step[3]) * step[2]);
}

export const ne2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Nebraska uses the 2026 Circular EN percentage method with W-4N allowances; head-of-household uses the single table.',
    'When calculated withholding is below 1.5% of taxable wages, the special procedure uses at least half the one-allowance single or two-allowance married reference amount.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.neAllowances ?? 0;
    const extra = input.stateOptions?.neExtraWithholding ?? 0;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Nebraska allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Nebraska extra withholding must be nonnegative');
    const married = input.federal.filingStatus === 'married_joint';
    const schedule = tables[input.payFrequency][married ? 'married' : 'single'];
    const amount = allowance[input.payFrequency];
    const ordinary = tableTax(Math.max(0, stateTaxableWages - allowances * amount), schedule);
    const reference = tableTax(Math.max(0, stateTaxableWages - (married ? 2 : 1) * amount), schedule);
    const adjusted = ordinary < stateTaxableWages * .015 ? Math.max(ordinary, reference * .5) : ordinary;
    return { incomeTaxWithholding: roundMoney(adjusted + extra), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
