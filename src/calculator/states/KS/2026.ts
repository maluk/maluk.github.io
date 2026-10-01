import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Row = { zero: number; top: number; base: number };
const tables: Record<PayFrequency, { single: Row; married: Row; allowanceSingle: number; allowanceMarried: number; allowanceDependent: number }> = {
  weekly: { single: { zero: 69, top: 512, base: 23 }, married: { zero: 158, top: 1043, base: 46 }, allowanceSingle: 176.15, allowanceMarried: 352.31, allowanceDependent: 44.62 },
  biweekly: { single: { zero: 139, top: 1023, base: 46 }, married: { zero: 317, top: 2086, base: 92 }, allowanceSingle: 352.31, allowanceMarried: 704.62, allowanceDependent: 89.23 },
  semimonthly: { single: { zero: 150, top: 1109, base: 49.83 }, married: { zero: 343, top: 2260, base: 99.67 }, allowanceSingle: 381.67, allowanceMarried: 763.33, allowanceDependent: 96.67 },
  monthly: { single: { zero: 300, top: 2217, base: 99.67 }, married: { zero: 687, top: 4520, base: 199.33 }, allowanceSingle: 763.33, allowanceMarried: 1526.67, allowanceDependent: 193.33 },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'KS', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'KW-100 Kansas Withholding Tax Guide, percentage method and K-4 allowances', authority: 'Kansas Department of Revenue', url: 'https://www.ksrevenue.gov/kw100.html' },
  ],
};

export const ks2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Kansas assumes a completed K-4 matching the selected filing status, with no dependents unless entered. Select no K-4 in Advanced options for the single rate with zero allowances.', 'The percentage method retains cents; Kansas permits rounding the result to whole dollars.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const dependents = input.stateOptions?.ksDependents ?? 0;
    const noCertificate = input.stateOptions?.ksNoCertificate ?? false;
    const extra = input.stateOptions?.ksExtraWithholding ?? 0;
    if (typeof dependents !== 'number' || !Number.isInteger(dependents) || dependents < 0) throw new Error('Kansas dependents must be a nonnegative whole number');
    if (typeof noCertificate !== 'boolean') throw new Error('Kansas no-certificate setting must be a checkbox');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Kansas extra withholding must be nonnegative');
    if (input.federal.exempt) return { incomeTaxWithholding: 0, payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: ['Federal withholding exemption also exempts Kansas withholding under KW-100.'] };
    const table = tables[input.payFrequency];
    const married = !noCertificate && input.federal.filingStatus === 'married_joint';
    const head = !noCertificate && input.federal.filingStatus === 'head_of_household';
    const allowance = noCertificate ? 0 : (married ? table.allowanceMarried : table.allowanceSingle)
      + (dependents + (head ? 1 : 0)) * table.allowanceDependent;
    const wages = Math.max(0, roundMoney(stateTaxableWages - allowance));
    const row = married ? table.married : table.single;
    const base = wages <= row.zero ? 0 : wages <= row.top ? (wages - row.zero) * .052 : row.base + (wages - row.top) * .0558;
    return { incomeTaxWithholding: roundMoney(base + extra), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
