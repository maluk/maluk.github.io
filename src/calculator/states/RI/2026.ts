import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [upper: number, base: number, rate: number, over: number];
const tables: Record<PayFrequency, Step[]> = {
  weekly: [[1578, 0, .0375, 0], [3586, 59.18, .0475, 1578], [Infinity, 154.56, .0599, 3586]],
  biweekly: [[3156, 0, .0375, 0], [7171, 118.35, .0475, 3156], [Infinity, 309.06, .0599, 7171]],
  semimonthly: [[3419, 0, .0375, 0], [7769, 128.21, .0475, 3419], [Infinity, 334.84, .0599, 7769]],
  monthly: [[6838, 0, .0375, 0], [15538, 256.43, .0475, 6838], [Infinity, 669.68, .0599, 15538]],
};
const allowance: Record<PayFrequency, number> = { weekly: 19.23, biweekly: 38.46, semimonthly: 41.67, monthly: 83.33 };
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'RI', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Rhode Island Withholding Tax Booklet', authority: 'Rhode Island Division of Taxation', url: 'https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-12/2026%20Withholding%20Tax%20Booklet.pdf' },
    { title: '2026 Temporary Disability and Caregiver Insurance taxable wage base and rate', authority: 'Rhode Island Department of Labor and Training', url: 'https://dlt.ri.gov/individuals/temporary-disability-caregiver-insurance/employers' },
    { title: 'Employer Tax Unit FAQ on TDI taxable wages', authority: 'Rhode Island Department of Labor and Training', url: 'https://dlt.ri.gov/employers/employer-tax-unit/frequently-asked-employer-tax-questions' },
  ],
};

export const ri2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Rhode Island uses its 2026 RI W-4 exemption amounts and percentage table for all filing statuses.',
    'The value of RI W-4 exemptions becomes zero when annualized wages exceed $290,800.',
    'TDI/TCI assumes a covered employee and uses the 1.1% worker rate through $100,000 of taxable wages.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdStateWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.riExemptions ?? 0;
    const extra = input.stateOptions?.riExtraWithholding ?? 0;
    const exempt = input.stateOptions?.riExempt ?? false;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Rhode Island exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Rhode Island extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('Rhode Island exempt setting must be a checkbox');
    const count = periods[input.payFrequency];
    const effectiveExemptions = stateTaxableWages * count > 290800 ? 0 : exemptions;
    const taxable = Math.max(0, roundMoney(stateTaxableWages - roundMoney(effectiveExemptions * allowance[input.payFrequency])));
    const step = tables[input.payFrequency].find(([upper]) => taxable <= upper)!;
    const tdiExclusion = input.deductions
      .filter(deduction => deduction.timing === 'pre_tax' && ['401k', 'hsa', 'fsa', 'health', 'dental', 'vision'].includes(deduction.kind))
      .reduce((sum, deduction) => sum + roundMoney(deduction.unit === 'percent' ? grossPay * deduction.amount / 100 : deduction.amount), 0);
    const tdiWages = Math.max(0, roundMoney(grossPay - tdiExclusion));
    const coveredWages = Math.min(tdiWages, Math.max(0, 100000 - ytdStateWages));
    return {
      incomeTaxWithholding: exempt ? 0 : Math.max(0, roundMoney(step[1] + (taxable - step[3]) * step[2] + extra)),
      payrollDeductions: [{ id: 'ri-tdi', label: 'Rhode Island TDI/TCI', amount: roundMoney(coveredWages * .011) }],
      localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
