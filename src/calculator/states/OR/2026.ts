import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'OR', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Oregon Withholding Tax Formulas, 150-206-436', authority: 'Oregon Department of Revenue', url: 'https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf' },
    { title: 'Statewide Transit Tax', authority: 'Oregon Department of Revenue', url: 'https://www.oregon.gov/dor/programs/businesses/Pages/statewide-transit-tax.aspx' },
    { title: 'Employees and Paid Leave Oregon', authority: 'Oregon Employment Department', url: 'https://paidleave.oregon.gov/employees/overview.html' },
    { title: 'Workers’ Benefit Fund assessment rates for 2026', authority: 'Oregon Department of Consumer and Business Services', url: 'https://www.oregon.gov/DCBS/reports/cost/Documents/3256-WCD-DO-rate-postcard-notice-2026.pdf' },
  ],
};

function federalSubtractionLimit(annualWages: number, marriedSchedule: boolean): number {
  const start = marriedSchedule ? 250000 : 125000;
  const width = marriedSchedule ? 10000 : 5000;
  if (annualWages < start) return 8750;
  return Math.max(0, 8750 - (Math.floor((annualWages - start) / width) + 1) * 1750);
}

export const or2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Oregon withholding follows its published 2026 computer formulas, including the federal income-tax subtraction limit and OR-W-4 allowance credit.',
    'The published 2026 guide contains conflicting numbers in Example 1 and at the $50,000 annual-wage formula transition. This estimate follows the printed formula tables and the worked arithmetic; exact transition paychecks need employer verification.',
    'Paid Leave assumes the full 0.6% employee share. The Workers’ Benefit Fund assumes an equal 0.9-cent hourly split. Salary hours are estimated at 40 per week unless changed in Advanced options.',
    'The statewide transit tax is included. Local transit and Metro payroll taxes are excluded.',
    'The optional 8% flat rate applies when a prior Oregon withholding exemption expired and a new certificate was not supplied by February 15.',
  ],
  calculate({ input, grossPay, stateTaxableWages, federalIncomeTaxWithholding, socialSecurityTaxableWages, ytdSocialSecurityWages, ytdGrossWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.orAllowances ?? 0;
    const extra = input.stateOptions?.orExtraWithholding ?? 0;
    const paidLeaveRate = input.stateOptions?.orPaidLeaveEmployeeRate ?? .006;
    const wbfRate = input.stateOptions?.orWbfEmployeeRate ?? .009;
    const expiredExemption = input.stateOptions?.orExpiredExemption ?? false;
    const hoursOverride = input.stateOptions?.orHoursPerPeriod;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Oregon allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Oregon extra withholding must be nonnegative');
    if (typeof paidLeaveRate !== 'number' || !Number.isFinite(paidLeaveRate) || paidLeaveRate < 0 || paidLeaveRate > .006) throw new Error('Oregon Paid Leave employee rate must be between zero and 0.6%');
    if (typeof wbfRate !== 'number' || !Number.isFinite(wbfRate) || wbfRate < 0 || wbfRate > .01) throw new Error('Oregon Workers’ Benefit Fund employee rate must be between zero and one cent per hour');
    if (typeof expiredExemption !== 'boolean') throw new Error('Oregon expired-exemption election must be a checkbox');
    if (hoursOverride !== undefined && (typeof hoursOverride !== 'number' || !Number.isFinite(hoursOverride) || hoursOverride < 0)) throw new Error('Oregon hours per period must be nonnegative');
    const frequency = periods[input.payFrequency];
    const annualWages = stateTaxableWages * frequency;
    const marriedSchedule = input.federal.filingStatus === 'married_joint' && !expiredExemption;
    const single = !marriedSchedule;
    const effectiveAllowances = annualWages > (single ? 100000 : 200000) ? 0 : allowances;
    const twoDeductions = marriedSchedule || (single && effectiveAllowances >= 3);
    const federalLimit = annualWages < 50000 ? 8750 : federalSubtractionLimit(annualWages, marriedSchedule);
    const federalSubtraction = Math.min((federalIncomeTaxWithholding ?? 0) * frequency, federalLimit);
    const baseWages = Math.max(0, annualWages - federalSubtraction - (twoDeductions ? 5820 : 2910));
    let annualTax = 0;
    if (annualWages < 50000) {
      if (twoDeductions) {
        annualTax = baseWages <= 9100 ? 263 + baseWages * .0475
          : baseWages <= 22800 ? 695 + (baseWages - 9100) * .0675
          : 1620 + (baseWages - 22800) * .0875;
      } else {
        annualTax = baseWages <= 4550 ? 263 + baseWages * .0475
          : baseWages <= 11400 ? 479 + (baseWages - 4550) * .0675
          : 941 + (baseWages - 11400) * .0875;
      }
    } else if (twoDeductions) {
      annualTax = baseWages <= 250000 ? 1357 + (baseWages - 22800) * .0875
        : 21237 + (baseWages - 250000) * .099;
    } else {
      annualTax = baseWages <= 125000 ? 678 + (baseWages - 11400) * .0875
        : 10618 + (baseWages - 125000) * .099;
    }
    annualTax = baseWages === 0 ? 0 : Math.max(0, annualTax - 263 * effectiveAllowances);
    const ficaWages = socialSecurityTaxableWages ?? grossPay;
    const paidLeaveWages = Math.min(ficaWages, Math.max(0, 184500 - (ytdSocialSecurityWages ?? ytdGrossWages)));
    const hours = grossPay === 0 ? 0 : hoursOverride ?? (input.compensation.type === 'hourly'
      ? input.compensation.regularHours + (input.compensation.overtimeHours ?? 0)
      : 2080 / frequency);
    return {
      incomeTaxWithholding: roundMoney((expiredExemption ? stateTaxableWages * .08 : annualTax / frequency) + extra),
      payrollDeductions: [
        { id: 'or-transit', label: 'Oregon Statewide Transit Tax', amount: roundMoney(stateTaxableWages * .001) },
        { id: 'or-paid-leave', label: 'Paid Leave Oregon', amount: roundMoney(paidLeaveWages * paidLeaveRate) },
        { id: 'or-wbf', label: 'Oregon Workers’ Benefit Fund', amount: roundMoney(Math.ceil(hours) * wbfRate) },
      ],
      localWithholding: 0, localSupported: false, assumptions: [],
    };
  },
};
