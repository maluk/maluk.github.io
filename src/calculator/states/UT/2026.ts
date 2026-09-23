import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';

const schedules = {
  weekly: { single: { allowance: 9, offset: 180 }, married: { allowance: 19, offset: 360 } },
  biweekly: { single: { allowance: 19, offset: 360 }, married: { allowance: 37, offset: 719 } },
  semimonthly: { single: { allowance: 20, offset: 390 }, married: { allowance: 40, offset: 779 } },
  monthly: { single: { allowance: 40, offset: 779 }, married: { allowance: 81, offset: 1558 } },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'UT', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Publication 14: Utah Withholding Tax Guide, 2026', authority: 'Utah State Tax Commission', url: 'https://files.tax.utah.gov/tax/forms/pubs/pub-14-eff-010626.pdf' },
  ],
};

export const ut2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Utah withholding uses the applicable Publication 14 pay-period schedule. Head of household uses the single schedule, as the state directs.', 'The schedule rounds each calculation line to whole dollars.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const marital = input.federal.filingStatus === 'married_joint' ? 'married' : 'single';
    const schedule = schedules[input.payFrequency][marital];
    const tax = Math.round(stateTaxableWages * .0445);
    const allowanceReduction = Math.max(0, schedule.allowance - Math.round(Math.max(0, stateTaxableWages - schedule.offset) * .013));
    return {
      incomeTaxWithholding: Math.max(0, tax - allowanceReduction),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
