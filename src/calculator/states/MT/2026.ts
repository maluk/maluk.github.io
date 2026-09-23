import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [threshold: number, base: number, rate: number];
const schedules: Record<string, { single: Step[]; married: Step[]; head: Step[] }> = {
  weekly: {
    single: [[310, 0, .047], [1223, 43, .0565]],
    married: [[619, 0, .047], [2446, 86, .0565]],
    head: [[464, 0, .047], [1835, 65, .0565]],
  },
  biweekly: {
    single: [[619, 0, .047], [2446, 86, .0565]],
    married: [[1238, 0, .047], [4892, 172, .0565]],
    head: [[929, 0, .047], [3669, 129, .0565]],
  },
  semimonthly: {
    single: [[671, 0, .047], [2650, 94, .0565]],
    married: [[1342, 0, .047], [5300, 187, .0565]],
    head: [[1006, 0, .047], [3975, 140, .0565]],
  },
  monthly: {
    single: [[1342, 0, .047], [5300, 187, .0565]],
    married: [[2683, 0, .047], [10600, 372, .0565]],
    head: [[2013, 0, .047], [7950, 280, .0565]],
  },
};

const metadata: TaxRuleMetadata = {
  jurisdiction: 'MT', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Montana Employer and Information Agent Guide with 2026 Tax Tables', authority: 'Montana Department of Revenue', url: 'https://revenuefiles.mt.gov/files/Forms/Montana_Employer_and_Information_Agent_Guide_with_Tax_Tables.pdf' },
    { title: 'Updated Montana Wage Withholding Tables and MW-4 Now Available', authority: 'Montana Department of Revenue', url: 'https://revenue.mt.gov/news/recent-news/2026-withholding-updates' },
  ],
};

export const mt2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Montana uses its 2026 pay-period withholding formula and Form MW-4 filing selection. Joint filers with both spouses working may elect the higher single schedule.',
    'The guide’s worked examples round to the nearest whole dollar, although its formula introduction says to round up. This calculator follows the worked examples.',
    'Montana no longer uses withholding allowances in 2026. Additional or fixed MW-4 withholding can be entered in Advanced options.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const bothWorking = input.stateOptions?.mtBothSpousesWorking ?? false;
    const extra = input.stateOptions?.mtExtraWithholding ?? 0;
    const fixed = input.stateOptions?.mtFixedWithholding;
    const exempt = input.stateOptions?.mtExempt ?? false;
    if (typeof bothWorking !== 'boolean' || typeof exempt !== 'boolean') throw new Error('Montana elections must be checkboxes');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Montana extra withholding must be nonnegative');
    if (fixed !== undefined && (typeof fixed !== 'number' || !Number.isFinite(fixed) || fixed < 0)) throw new Error('Montana fixed withholding must be nonnegative');
    const filing = input.federal.filingStatus === 'married_joint' && !bothWorking ? 'married'
      : input.federal.filingStatus === 'head_of_household' ? 'head' : 'single';
    let tax = 0;
    if (!exempt) {
      for (const [threshold, base, rate] of schedules[input.payFrequency][filing]) {
        if (stateTaxableWages <= threshold) break;
        tax = base + (stateTaxableWages - threshold) * rate;
      }
      tax = fixed === undefined ? Math.round(tax) : fixed;
      tax += extra;
    }
    return { incomeTaxWithholding: roundMoney(tax), payrollDeductions: [], localWithholding: 0, localSupported: !input.location.city, assumptions: [] };
  },
};
