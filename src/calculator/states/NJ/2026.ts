import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [upperWage: number, baseTax: number, rate: number, excessOver: number];
const tables: Record<'A' | 'B', Record<PayFrequency, Step[]>> = {
  A: {
    weekly: [[385, 0, .015, 0], [673, 5.77, .02, 385], [769, 11.54, .039, 673], [1442, 15.29, .061, 769], [9615, 56.35, .07, 1442], [19231, 628.46, .099, 9615], [Infinity, 1580.38, .118, 19231]],
    biweekly: [[769, 0, .015, 0], [1346, 12, .02, 769], [1538, 23, .039, 1346], [2885, 31, .061, 1538], [19231, 113, .07, 2885], [38462, 1257, .099, 19231], [Infinity, 3161, .118, 38462]],
    semimonthly: [[833, 0, .015, 0], [1458, 13, .02, 833], [1667, 25, .039, 1458], [3125, 33, .061, 1667], [20833, 122, .07, 3125], [41667, 1362, .099, 20833], [Infinity, 3424, .118, 41667]],
    monthly: [[1667, 0, .015, 0], [2917, 25, .02, 1667], [3333, 50, .039, 2917], [6250, 66, .061, 3333], [41667, 244, .07, 6250], [83333, 2723, .099, 41667], [Infinity, 6848, .118, 83333]],
  },
  B: {
    weekly: [[385, 0, .015, 0], [962, 5.77, .02, 385], [1346, 17.31, .027, 962], [1538, 27.69, .039, 1346], [2885, 35.19, .061, 1538], [9615, 117.31, .07, 2885], [19231, 588.46, .099, 9615], [Infinity, 1540.38, .118, 19231]],
    biweekly: [[769, 0, .015, 0], [1923, 12, .02, 769], [2692, 35, .027, 1923], [3077, 55, .039, 2692], [5769, 70, .061, 3077], [19231, 235, .07, 5769], [38462, 1177, .099, 19231], [Infinity, 3081, .118, 38462]],
    semimonthly: [[833, 0, .015, 0], [2083, 12.5, .02, 833], [2917, 37.5, .027, 2083], [3333, 59.99, .039, 2917], [6250, 76.25, .061, 3333], [20833, 254.19, .07, 6250], [41667, 1275, .099, 20833], [Infinity, 3338, .118, 41667]],
    monthly: [[1667, 0, .015, 0], [4167, 25, .02, 1667], [5833, 75, .027, 4167], [6667, 120, .039, 5833], [12500, 153, .061, 6667], [41667, 508, .07, 12500], [83333, 2550, .099, 41667], [Infinity, 6675, .118, 83333]],
  },
};
const allowance: Record<PayFrequency, number> = { weekly: 19.2, biweekly: 38.4, semimonthly: 41.6, monthly: 83.3 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'NJ', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'NJ-WT employer withholding instructions', authority: 'New Jersey Division of Taxation', url: 'https://nj.gov/treasury/taxation/pdf/current/njwt.pdf' },
    { title: 'Percentage method withholding tables, Rates A and B', authority: 'New Jersey Division of Taxation', url: 'https://nj.gov/treasury/taxation/pdf/NJWithholdingRateTablesPercentageMethod.pdf' },
    { title: '2026 worker contribution rates and wage bases', authority: 'New Jersey Department of Labor and Workforce Development', url: 'https://www.nj.gov/labor/ea/employer-services/rate-info/' },
    { title: 'Cafeteria Plans, Technical Bulletin TB-39(R)', authority: 'New Jersey Division of Taxation', url: 'https://nj.gov/treasury/taxation/pdf/pubs/tb/tb39r.pdf' },
  ],
};

function capped(grossPay: number, ytdGross: number, limit: number, rate: number): number {
  return roundMoney(Math.min(grossPay, Math.max(0, limit - ytdGross)) * rate);
}

export const nj2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'New Jersey uses NJ-W4 Rate A for single or married filing separately and Rate B for joint or head-of-household filing unless a different rate was elected.',
    'This calculator supports NJ-W4 Rates A and B. Employees who elected Rate C, D, or E should use their employer’s payroll figure.',
    'New Jersey employee UI, WF/SWF, TDI, and FLI contributions assume a covered private employer and use projected gross wages when YTD is missing.',
    'Salary reduction health, dental, vision, HSA, and FSA deductions generally remain subject to New Jersey income tax withholding.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdGrossWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.njExemptions ?? 0;
    const extra = input.stateOptions?.njExtraWithholding ?? 0;
    const exempt = input.stateOptions?.njExempt ?? false;
    const electedRate = input.stateOptions?.njRate;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('New Jersey exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('New Jersey extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('New Jersey exempt setting must be a checkbox');
    if (electedRate !== undefined && electedRate !== 'A' && electedRate !== 'B') throw new Error('New Jersey NJ-W4 Rates C, D, and E are not yet supported');
    const rate = (electedRate ?? (input.federal.filingStatus === 'single' || input.federal.filingStatus === 'married_separate' ? 'A' : 'B')) as 'A' | 'B';
    const wages = Math.max(0, roundMoney(stateTaxableWages - exemptions * allowance[input.payFrequency]));
    const step = tables[rate][input.payFrequency].find(([upperWage]) => wages <= upperWage)!;
    const incomeTaxWithholding = exempt ? 0 : roundMoney(step[1] + (wages - step[3]) * step[2] + extra);
    return {
      incomeTaxWithholding,
      payrollDeductions: [
        { id: 'nj-ui', label: 'New Jersey unemployment insurance', amount: capped(grossPay, ytdGrossWages, 44800, .003825) },
        { id: 'nj-wf', label: 'New Jersey workforce funds', amount: capped(grossPay, ytdGrossWages, 44800, .000425) },
        { id: 'nj-tdi', label: 'New Jersey temporary disability', amount: capped(grossPay, ytdGrossWages, 171100, .0019) },
        { id: 'nj-fli', label: 'New Jersey family leave', amount: capped(grossPay, ytdGrossWages, 171100, .0023) },
      ],
      localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
