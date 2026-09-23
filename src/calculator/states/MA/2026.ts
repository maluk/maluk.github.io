import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const exemptions = {
  weekly: { one: 85, each: 19, base: 66, head: 2.31, blind: 2.12, minimum: 154 },
  biweekly: { one: 169, each: 38, base: 131, head: 4.62, blind: 4.23, minimum: 308 },
  semimonthly: { one: 183, each: 42, base: 141, head: 5, blind: 4.58, minimum: 333 },
  monthly: { one: 367, each: 83, base: 284, head: 10, blind: 9.17, minimum: 667 },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Circular M: Income Tax Withholding Tables at 5.0%, effective January 1, 2026', authority: 'Massachusetts Department of Revenue', url: 'https://www.mass.gov/doc/massachusetts-circular-m-income-tax-withholding-tables-at-50-effective-january-1-2026/download' },
    { title: '2025 and 2026 Paid Family and Medical Leave contribution rates', authority: 'Massachusetts Department of Family and Medical Leave', url: 'https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator' },
    { title: 'PFML wage contributions and annual cap', authority: 'Massachusetts Department of Family and Medical Leave', url: 'https://www.mass.gov/info-details/wage-contributions-reporting-for-paid-family-and-medical-leave' },
  ],
};

export const ma2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Massachusetts uses the 2026 Circular M percentage method, with zero M-4 exemptions unless entered.',
    'The paycheck uses the maximum 0.46% employee PFML share; an employer may pay some or all of it.',
    'YTD Social Security and Medicare wages estimate prior payroll tax deductions toward the $2,000 Massachusetts withholding limit.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdGrossWages, federalPayrollTaxes, ytdSocialSecurityWages = 0, ytdMedicareWages = 0 }: StateInput): StateResult {
    const count = input.stateOptions?.maExemptions ?? 0;
    const blind = input.stateOptions?.maBlindPeople ?? 0;
    const extra = input.stateOptions?.maExtraWithholding ?? 0;
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || typeof blind !== 'number' || !Number.isInteger(blind) || blind < 0) throw new Error('Massachusetts M-4 exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Massachusetts extra withholding must be nonnegative');
    if (input.stateOptions?.maPflNotCovered !== undefined && typeof input.stateOptions.maPflNotCovered !== 'boolean') throw new Error('Massachusetts PFML coverage must be a checkbox');
    const period = exemptions[input.payFrequency];
    const yearPeriods = periods[input.payFrequency];
    const priorPayrollTaxes = Math.min(ytdSocialSecurityWages, 184500) * .062 + ytdMedicareWages * .0145;
    const currentPayrollTaxes = (federalPayrollTaxes?.socialSecurity ?? grossPay * .062) + (federalPayrollTaxes?.medicare ?? grossPay * .0145) + (federalPayrollTaxes?.additionalMedicare ?? 0);
    const ficaDeduction = Math.min(currentPayrollTaxes, Math.max(0, 2000 - priorPayrollTaxes));
    const exemptionAmount = count === 0 ? 0 : count === 1 ? period.one : period.base + period.each * count;
    const taxablePeriod = Math.max(0, stateTaxableWages - ficaDeduction - exemptionAmount);
    const annualized = taxablePeriod * yearPeriods;
    const annualTax = Math.min(annualized, 1107750) * .05 + Math.max(0, annualized - 1107750) * .09;
    const belowMinimum = count > 0 && stateTaxableWages < period.minimum;
    const regularWithholding = belowMinimum ? 0 : Math.max(0, annualTax / yearPeriods - (input.federal.filingStatus === 'head_of_household' ? period.head : 0) - blind * period.blind);
    const pflWages = input.stateOptions?.maPflNotCovered ? 0 : Math.min(grossPay, Math.max(0, 184500 - ytdGrossWages));
    return {
      incomeTaxWithholding: roundMoney(regularWithholding + extra),
      payrollDeductions: [{ id: 'ma-pfml', label: 'Massachusetts Paid Family & Medical Leave', amount: roundMoney(pflWages * .0046) }],
      localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
