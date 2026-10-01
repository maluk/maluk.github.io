import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'MS', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Computer Payroll Accounting — For Periods In 2026', authority: 'Mississippi Department of Revenue', url: 'https://www.dor.ms.gov/sites/default/files/business/Computer%20Payroll%20Flowchart%20-%20updated%208-13-25.pdf' },
    { title: 'Withholding Income Tax Tables and Employer Instructions', authority: 'Mississippi Department of Revenue', url: 'https://www.dor.ms.gov/sites/default/files/tax-forms/business/89700251revised1.13.2026.pdf' },
  ],
};

export const ms2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Mississippi Form 89-350 exemption amount defaults to zero, as required when no certificate is supplied.',
    'Married filing jointly defaults to the both-spouses-employed deduction unless the one-spouse-employed option is selected.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const exemption = input.stateOptions?.msExemptionAmount ?? 0;
    const extra = input.stateOptions?.msExtraWithholding ?? 0;
    const oneSpouseEmployed = input.stateOptions?.msOneSpouseEmployed ?? false;
    if (typeof exemption !== 'number' || !Number.isFinite(exemption) || exemption < 0 ||
      typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) {
      throw new Error('Mississippi Form 89-350 amounts must be nonnegative');
    }
    if (typeof oneSpouseEmployed !== 'boolean') throw new Error('Mississippi spouse employment setting must be a checkbox');
    const status = input.federal.filingStatus;
    const standardDeduction = status === 'head_of_household' ? 3400
      : status === 'married_joint' && oneSpouseEmployed ? 4600 : 2300;
    const periodCount = periods[input.payFrequency];
    const annualTaxable = Math.max(0, stateTaxableWages * periodCount - exemption - standardDeduction);
    const annualTax = Math.max(0, annualTaxable - 10000) * .04;
    return {
      incomeTaxWithholding: Math.round(annualTax / periodCount + extra),
      payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
