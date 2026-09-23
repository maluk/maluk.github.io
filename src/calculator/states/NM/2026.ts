import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Row = [threshold: number, base: number, rate: number];
type Filing = 'single' | 'married' | 'head';
type Frequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

// FYI-104, pages 5–6. Each row is the lower wage bound, fixed tax, and marginal rate.
// The final row of each schedule has no upper wage limit.
const tables: Record<Frequency, Record<Filing, Row[]>> = {
  weekly: {
    single: [[155, 0, .015], [261, 1.59, .032], [395, 5.89, .032], [472, 8.36, .043], [645, 15.80, .043], [799, 22.41, .047], [1126, 37.78, .047], [1434, 52.24, .049], [4193, 187.46, .059]],
    married: [[310, 0, .015], [463, 2.31, .032], [617, 7.23, .032], [790, 12.77, .043], [1098, 26, .043], [1271, 33.44, .047], [1963, 65.98, .047], [2233, 78.63, .049], [6367, 281.23, .059]],
    head: [[232, 0, .015], [386, 2.31, .032], [540, 7.23, .032], [713, 12.77, .043], [1021, 26, .043], [1194, 33.44, .047], [1886, 65.98, .047], [2155, 78.63, .049], [6290, 281.23, .059]],
  },
  biweekly: {
    single: [[310, 0, .015], [521, 3.17, .032], [790, 11.79, .032], [944, 16.71, .043], [1290, 31.60, .043], [1598, 44.83, .047], [2252, 75.56, .047], [2867, 104.48, .049], [8387, 374.92, .059]],
    married: [[619, 0, .015], [927, 4.62, .032], [1235, 14.46, .032], [1581, 25.54, .043], [2196, 52, .043], [2542, 66.88, .047], [3927, 131.96, .047], [4465, 157.27, .049], [12735, 562.46, .059]],
    head: [[464, 0, .015], [772, 4.62, .032], [1080, 14.46, .032], [1426, 25.54, .043], [2041, 52, .043], [2388, 66.88, .047], [3772, 131.96, .047], [4311, 157.27, .049], [12580, 562.46, .059]],
  },
  semimonthly: {
    single: [[335, 0, .015], [565, 3.44, .032], [856, 12.77, .032], [1023, 18.10, .043], [1398, 34.23, .043], [1731, 48.56, .047], [2440, 81.85, .047], [3106, 113.19, .049], [9085, 406.17, .059]],
    married: [[671, 0, .015], [1004, 5, .032], [1338, 15.67, .032], [1713, 27.67, .043], [2379, 56.33, .043], [2754, 72.46, .047], [4254, 142.96, .047], [4838, 170.38, .049], [13796, 609.33, .059]],
    head: [[503, 0, .015], [836, 5, .032], [1170, 15.67, .032], [1545, 27.67, .043], [2211, 56.33, .043], [2586, 72.46, .047], [4086, 142.96, .047], [4670, 170.38, .049], [13628, 609.33, .059]],
  },
  monthly: {
    single: [[671, 0, .015], [1129, 6.88, .032], [1713, 25.54, .032], [2046, 36.21, .043], [2796, 68.46, .043], [3463, 97.13, .047], [4879, 163.71, .047], [6213, 226.38, .049], [18171, 812.33, .059]],
    married: [[1342, 0, .015], [2008, 10, .032], [2675, 31.33, .032], [3425, 55.33, .043], [4758, 112.67, .043], [5508, 144.92, .047], [8508, 285.92, .047], [9675, 340.75, .049], [27592, 1218.67, .059]],
    head: [[1006, 0, .015], [1673, 10, .032], [2340, 31.33, .032], [3090, 55.33, .043], [4423, 112.67, .043], [5173, 144.92, .047], [8173, 285.92, .047], [9340, 340.75, .049], [27256, 1218.67, .059]],
  },
};

const periods: Record<Frequency, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'NM', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'FYI-104, New Mexico Withholding Tax, effective January 1, 2026', authority: 'New Mexico Taxation and Revenue Department', url: 'https://realfile.tax.newmexico.gov/FYI-104.pdf' },
  ],
};

export const nm2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'New Mexico withholding uses the 2026 FYI-104 percentage table for this pay frequency and filing status.',
    'The semimonthly table prints different zero-withholding and first-row thresholds. This estimate uses the first percentage-row threshold, which is consistent with the table’s subsequent row amounts.',
    'State-specific W-4 deductions and extra withholding apply only when entered in Advanced options. Federal W-4 changes are not automatically copied to New Mexico.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const extra = input.stateOptions?.nmExtraWithholding ?? 0;
    const annualDeductions = input.stateOptions?.nmAnnualDeductions ?? 0;
    const higherSingle = input.stateOptions?.nmSingleRate ?? false;
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('New Mexico extra withholding must be nonnegative');
    if (typeof annualDeductions !== 'number' || !Number.isFinite(annualDeductions) || annualDeductions < 0) throw new Error('New Mexico annual deductions must be nonnegative');
    if (typeof higherSingle !== 'boolean') throw new Error('New Mexico single-rate election must be a checkbox');
    const filing: Filing = higherSingle || input.federal.filingStatus === 'single' || input.federal.filingStatus === 'married_separate'
      ? 'single' : input.federal.filingStatus === 'head_of_household' ? 'head' : 'married';
    const wage = Math.max(0, stateTaxableWages - annualDeductions / periods[input.payFrequency]);
    const rows = tables[input.payFrequency][filing];
    let tax = 0;
    for (const [threshold, base, rate] of rows) {
      if (wage <= threshold) break;
      tax = base + (wage - threshold) * rate;
    }
    return { incomeTaxWithholding: roundMoney(tax + extra), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
