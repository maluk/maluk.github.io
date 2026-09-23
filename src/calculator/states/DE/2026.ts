import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const taxSteps = [
  [2000, 0, 0, 0], [5000, 0, .022, 2000], [10000, 66, .039, 5000],
  [20000, 261, .048, 10000], [25000, 741, .052, 20000],
  [60000, 1001, .0555, 25000], [Infinity, 2943.5, .066, 60000],
] as const;
const metadata: TaxRuleMetadata = {
  jurisdiction: 'DE', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Employer’s Guide: withholding regulations and approved annualized formula', authority: 'Delaware Division of Revenue', url: 'https://revenue.delaware.gov/employers-guide-withholding-regulations-employers-duties/' },
    { title: 'Delaware Paid Leave employer and TPA guide', authority: 'Delaware Department of Labor', url: 'https://laborfiles.delaware.gov/main/pfl/Employer_and_TPAs_Guide_to_DPL.pdf' },
    { title: 'Delaware Paid Leave program coverage', authority: 'Delaware Department of Labor', url: 'https://labor.delaware.gov/delaware-paid-leave/' },
  ],
};

export const de2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Delaware uses its Division of Revenue approved annualized withholding method with zero exemption credits until entered.',
    'Paid Leave assumes an employer with at least 25 workers, full public-plan coverage, and the maximum 50% employee share.',
    'Employers with 10–24 workers only require parental-leave coverage; smaller employers are generally exempt. The employer may pay some or all of the employee share.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdGrossWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.deExemptions ?? 0;
    const extra = input.stateOptions?.deExtraWithholding ?? 0;
    const size = input.stateOptions?.deEmployerSize ?? 25;
    const employeeShare = input.stateOptions?.deEmployeeShare ?? 0.5;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Delaware exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Delaware extra withholding must be nonnegative');
    if (typeof size !== 'number' || !Number.isFinite(size) || size < 0 || !Number.isInteger(size)) throw new Error('Delaware employer size must be a nonnegative whole number');
    if (typeof employeeShare !== 'number' || !Number.isFinite(employeeShare) || employeeShare < 0 || employeeShare > .5) throw new Error('Delaware employee Paid Leave share must be between zero and 50%');
    const annualGross = stateTaxableWages * periods[input.payFrequency];
    const taxable = Math.max(0, annualGross - (input.federal.filingStatus === 'married_joint' ? 6500 : 3250));
    const step = taxSteps.find(([upper]) => taxable <= upper)!;
    const annualTax = Math.max(0, step[1] + (taxable - step[3]) * step[2] - exemptions * 110);
    const premiumRate = size < 10 ? 0 : size < 25 ? .0032 : .008;
    const coveredWages = Math.min(grossPay, Math.max(0, 184500 - ytdGrossWages));
    return {
      incomeTaxWithholding: roundMoney(annualTax / periods[input.payFrequency] + extra),
      payrollDeductions: [{ id: 'de-paid-leave', label: 'Delaware Paid Leave', amount: roundMoney(coveredWages * premiumRate * employeeShare) }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
