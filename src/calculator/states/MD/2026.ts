import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periodValues: Record<PayFrequency, { exemption: number; standard: number; minimumGross: number; single: number[]; joint: number[] }> = {
  weekly: { exemption: 61.54, standard: 65.38, minimumGross: 96, single: [1923, 2404, 2885, 4808, 9615, 19231], joint: [2885, 3365, 4327, 5769, 11538, 23077] },
  biweekly: { exemption: 123.08, standard: 130.76, minimumGross: 192, single: [3846, 4808, 5769, 9615, 19231, 38462], joint: [5769, 6731, 8654, 11538, 23077, 46154] },
  semimonthly: { exemption: 133.33, standard: 141.66, minimumGross: 208, single: [4167, 5208, 6250, 10417, 20833, 41667], joint: [6250, 7292, 9375, 12500, 25000, 50000] },
  monthly: { exemption: 266.67, standard: 283.33, minimumGross: 417, single: [8333, 10417, 12500, 20833, 41667, 83333], joint: [12500, 14583, 18750, 25000, 50000, 100000] },
};
const stateRates = [.0475, .05, .0525, .055, .0575, .0625, .065];
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MD', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Maryland Employer Withholding Guide', authority: 'Comptroller of Maryland', url: 'https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/withholding/2026/withholding-guide.pdf' },
    { title: 'Maryland FAMLI program contribution dates', authority: 'Maryland Department of Labor', url: 'https://paidleave.maryland.gov/about-the-program/' },
  ],
};

function stateTax(taxable: number, thresholds: number[]): number {
  let tax = 0;
  let lower = 0;
  for (let index = 0; index < stateRates.length; index += 1) {
    const upper = thresholds[index] ?? Infinity;
    const slice = Math.max(0, Math.min(taxable, upper) - lower);
    tax += slice * stateRates[index];
    if (taxable <= upper) break;
    lower = upper;
  }
  return tax;
}

export const md2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Maryland state withholding follows the state portion of the 2026 percentage method. The published employer tables combine state and county withholding; this estimate separates out only the state rates.',
    'Maryland county income tax applies to residents but is not included because a county has not been selected. Actual take-home pay will generally be lower than the displayed estimate.',
    'The MW507 exemption count defaults to zero. The special no-withholding rule for certain single employees and students is not assumed because it depends on the employee’s total annual income.',
    'Maryland FAMLI employee contributions begin in 2027, so no FAMLI premium is withheld from 2026 paychecks.',
  ],
  calculate({ input, grossPay, stateTaxableWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.mdExemptions ?? 0;
    const extra = input.stateOptions?.mdExtraWithholding ?? 0;
    const exempt = input.stateOptions?.mdExempt ?? false;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Maryland MW507 exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Maryland extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('Maryland exemption election must be a checkbox');
    const values = periodValues[input.payFrequency];
    const joint = input.federal.filingStatus === 'married_joint' || input.federal.filingStatus === 'head_of_household';
    const taxable = Math.max(0, stateTaxableWages - values.standard - exemptions * values.exemption);
    const amount = exempt || grossPay < values.minimumGross ? 0 : stateTax(taxable, joint ? values.joint : values.single) + extra;
    return { incomeTaxWithholding: roundMoney(amount), payrollDeductions: [], localWithholding: 0, localSupported: false, assumptions: [] };
  },
};
