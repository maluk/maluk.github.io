import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [threshold: number, base: number, rate: number];
const schedules: Record<'single' | 'married', Step[]> = {
  single: [[4700, 0, .0535], [38010, 1782.09, .068], [114130, 6958.25, .0785], [207850, 14315.27, .0985]],
  married: [[14700, 0, .0535], [63400, 2605.45, .068], [208180, 12450.49, .0785], [352630, 23789.82, .0985]],
};
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MN', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Minnesota Withholding Tax Instructions and Tables, computer formula', authority: 'Minnesota Department of Revenue', url: 'https://www.revenue.state.mn.us/sites/default/files/2025-12/wh-inst-26.pdf' },
    { title: '2026 Minnesota Paid Leave premium rate', authority: 'Minnesota Department of Employment and Economic Development', url: 'https://mn.gov/deed/newscenter/press-releases/?id=1045-670064' },
    { title: 'Small employer Paid Leave premium rate designation', authority: 'Minnesota Department of Employment and Economic Development', url: 'https://mn.gov/deed/assets/paid-leave-small-employer-premium-rate-designation-acc_tcm1045-716947.pdf' },
  ],
};

export const mn2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Minnesota uses the 2026 computer formula with Form W-4MN allowances. The estimate follows the filing status selected unless no W-4MN is on file, which requires single with zero allowances.',
    'The default Paid Leave employee contribution is the maximum 0.44% of covered FICA wages up to the 2026 $185,000 program wage limit. An employer can pay some or all of the employee share.',
  ],
  calculate({ input, grossPay, socialSecurityTaxableWages, stateTaxableWages, ytdSocialSecurityWages, ytdGrossWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.mnAllowances ?? 0;
    const extra = input.stateOptions?.mnExtraWithholding ?? 0;
    const rate = input.stateOptions?.mnPaidLeaveEmployeeRate ?? .0044;
    const noCertificate = input.stateOptions?.mnNoCertificate ?? false;
    const exempt = input.stateOptions?.mnExempt ?? false;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Minnesota allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Minnesota extra withholding must be nonnegative');
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > .0044) throw new Error('Minnesota Paid Leave employee rate must be between zero and 0.44%');
    if (typeof noCertificate !== 'boolean' || typeof exempt !== 'boolean') throw new Error('Minnesota withholding elections must be checkboxes');
    const filing = input.federal.filingStatus === 'married_joint' && !noCertificate ? 'married' : 'single';
    const annualWages = stateTaxableWages * periods[input.payFrequency] - (noCertificate ? 0 : allowances * 5300);
    let annualTax = 0;
    for (const [threshold, base, marginal] of schedules[filing]) {
      if (annualWages <= threshold) break;
      annualTax = base + (annualWages - threshold) * marginal;
    }
    const ficaWages = socialSecurityTaxableWages ?? grossPay;
    const coveredWages = Math.min(ficaWages, Math.max(0, 185000 - (ytdSocialSecurityWages ?? ytdGrossWages)));
    return {
      incomeTaxWithholding: exempt ? 0 : roundMoney(Math.round(annualTax / periods[input.payFrequency]) + extra),
      payrollDeductions: [{ id: 'mn-paid-leave', label: 'Minnesota Paid Leave', amount: roundMoney(coveredWages * rate) }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
