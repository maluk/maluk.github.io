import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const metadata: TaxRuleMetadata = {
  jurisdiction: 'PA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Employer Withholding', authority: 'Pennsylvania Department of Revenue', url: 'https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/employer-withholding' },
    { title: '2026 Employee UC Contributions', authority: 'Pennsylvania Department of Labor and Industry', url: 'https://www.pa.gov/agencies/dli/resources/for-employers-and-educators/how-to-file/uc-tax/calculating-contributions--penalties-and-interest' },
    { title: 'Pennsylvania Gross Compensation', authority: 'Pennsylvania Department of Revenue', url: 'https://www.pa.gov/agencies/revenue/forms-and-publications/pa-personal-income-tax-guide/gross-compensation' },
  ],
};

export const pa2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Pennsylvania local earned income taxes and local services taxes are not included.'],
  calculate({ grossPay, stateTaxableWages }: StateInput): StateResult {
    return {
      incomeTaxWithholding: roundMoney(stateTaxableWages * .0307),
      payrollDeductions: [{ id: 'pa-uc', label: 'Pennsylvania unemployment contribution', amount: roundMoney(grossPay * .0007) }],
      localWithholding: 0,
      localSupported: false,
      assumptions: [],
    };
  },
};
