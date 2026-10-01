import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const thresholds: Record<PayFrequency, { single: number; married: number }> = {
  weekly: { single: 310, married: 619 },
  biweekly: { single: 619, married: 1238 },
  semimonthly: { single: 671, married: 1342 },
  monthly: { single: 1342, married: 2683 },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'ID', taxYear: 2026, effectiveFrom: '2026-07-31', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.2', sources: [
    { title: '2026 revised percentage computation method, EPB00744', authority: 'Idaho State Tax Commission', url: 'https://tax.idaho.gov/document-mngr/pubs_EPB00744' },
    { title: 'Withholding tables updated for 2026, July 31', authority: 'Idaho State Tax Commission', url: 'https://tax.idaho.gov/pressrelease/withholding-tables-updated-for-2026/' },
    { title: 'Computing Withholding', authority: 'Idaho State Tax Commission', url: 'https://tax.idaho.gov/taxes/income-tax/withholding/computing/' },
  ],
};

export const id2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Idaho uses the revised 2026 percentage method issued in July and rounds state withholding to whole dollars.',
    'Idaho Child Tax Credit withholding allowances are zero after the credit sunset, so the allowance count does not change this schedule.',
    'The earlier 2026 Idaho schedule is not implemented; pay dates before July 31 are unavailable.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    if (input.payDate < '2026-07-31') throw new Error('Idaho withholding is unavailable before July 31, 2026 until the earlier schedule is verified');
    const threshold = thresholds[input.payFrequency][input.federal.filingStatus === 'married_joint' ? 'married' : 'single'];
    const tax = Math.floor(Math.max(0, stateTaxableWages - threshold) * .053 + .5);
    return { incomeTaxWithholding: roundMoney(tax), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
