import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'ME', taxYear: 2026, effectiveFrom: '2026-09-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-23', status: 'verified', version: '2026.3', sources: [
    { title: '2026 Maine Income Tax Withholding Tables and Instructions, revised August 2026', authority: 'Maine Revenue Services', url: 'https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/26_wh_tab_instr_August2026.pdf' },
    { title: 'August 2026 Maine Tax Alert: revised tables effective immediately', authority: 'Maine Revenue Services', url: 'https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/ta_august2026_vol36_iss10.pdf' },
    { title: '2026 Paid Family and Medical Leave employer FAQ', authority: 'Maine Department of Labor', url: 'https://www.maine.gov/paidleave/docs/2026/employers/faq/employerFAQenglish.pdf' },
  ],
};

export const me2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Maine uses its August 2026 revised percentage method for pay dates from September 1 onward, including the phaseout of the withholding standard deduction and the high-income surcharge. Earlier 2026 pay dates need the prior method.',
    'The default Paid Family and Medical Leave employee contribution is the maximum 0.5% of covered wages through the Social Security wage base. Employers may pay some or all of the employee share.',
    'The Maine W-4ME allowance count begins at zero until entered in Advanced options. Federal W-4 deductions do not reduce Maine withholding wages.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdGrossWages }: StateInput): StateResult {
    if (input.payDate < metadata.effectiveFrom) throw new Error('Maine pay dates before September 1, 2026 require the earlier withholding schedule');
    const allowances = input.stateOptions?.meAllowances ?? 0;
    const extra = input.stateOptions?.meExtraWithholding ?? 0;
    const pfmlRate = input.stateOptions?.mePfmlEmployeeRate ?? .005;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Maine allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Maine extra withholding must be nonnegative');
    if (typeof pfmlRate !== 'number' || !Number.isFinite(pfmlRate) || pfmlRate < 0 || pfmlRate > .005) throw new Error('Maine Paid Leave employee rate must be between zero and 0.5%');
    const married = input.federal.filingStatus === 'married_joint';
    const annualWages = stateTaxableWages * periods[input.payFrequency];
    const phaseStart = married ? 204550 : 102250;
    const phaseEnd = married ? 354550 : 177250;
    const maxDeduction = married ? 28550 : 12850;
    const deduction = annualWages <= phaseStart ? maxDeduction
      : annualWages >= phaseEnd ? 0
      : Math.round(maxDeduction * (phaseEnd - annualWages) / (phaseEnd - phaseStart));
    const annualIncome = Math.max(0, annualWages - allowances * 5300 - deduction);
    let annualTax: number;
    if (married) {
      annualTax = annualIncome < 54850 ? annualIncome * .058
        : annualIncome < 129750 ? 3181 + (annualIncome - 54850) * .0675
        : 8237 + (annualIncome - 129750) * .0715;
    } else {
      annualTax = annualIncome < 27400 ? annualIncome * .058
        : annualIncome < 64850 ? 1589 + (annualIncome - 27400) * .0675
        : 4117 + (annualIncome - 64850) * .0715;
    }
    annualTax += Math.max(0, annualIncome - (married ? 1500000 : 1000000)) * .02;
    const coveredWages = Math.min(grossPay, Math.max(0, 184500 - ytdGrossWages));
    return {
      incomeTaxWithholding: roundMoney(Math.round(Math.round(annualTax) / periods[input.payFrequency]) + extra),
      payrollDeductions: [{ id: 'me-paid-leave', label: 'Maine Paid Family and Medical Leave', amount: roundMoney(coveredWages * pfmlRate) }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
