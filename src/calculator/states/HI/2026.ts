import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Step = [threshold: number, base: number, rate: number];
const single: Step[] = [[0, 0, .014], [9600, 134, .032], [14400, 288, .055], [19200, 552, .064], [24000, 859, .068], [36000, 1675, .072], [48000, 2539, .076], [125000, 8391, .079]];
const married: Step[] = [[0, 0, .014], [19200, 269, .032], [28800, 576, .055], [38400, 1104, .064], [48000, 1718, .068], [72000, 3350, .072], [96000, 5078, .076], [250000, 16782, .079]];
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'HI', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'Booklet A, Employer’s Tax Guide, withholding effective January 1, 2026', authority: 'Hawaii Department of Taxation', url: 'https://files.hawaii.gov/tax/news/pubs/25BkltA.pdf' },
    { title: '2026 Maximum Weekly Wage Base and Maximum Weekly Benefit Amount', authority: 'Hawaii Department of Labor and Industrial Relations', url: 'https://labor.hawaii.gov/dcd/files/2025/12/2026-Maximum-Weekly-Wage-Base.pdf' },
  ],
};

export const hi2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Hawaii uses Booklet A’s annualized 2026 withholding method with HW-4 allowances and the $4,350 extra withholding allowance amount.',
    'The default TDI employee contribution uses the maximum permitted 0.5% rate, subject to a $7.50 weekly limit. The actual employee share cannot exceed half the employer’s insurance premium and may be lower.',
    'Hawaii Prepaid Health Care premiums depend on the employer’s plan and are included only when entered as a health insurance deduction.',
  ],
  calculate({ input, grossPay, stateTaxableWages }: StateInput): StateResult {
    const allowances = input.stateOptions?.hiAllowances ?? 0;
    const extra = input.stateOptions?.hiExtraWithholding ?? 0;
    const tdiRate = input.stateOptions?.hiTdiEmployeeRate ?? .005;
    const tdiCovered = input.stateOptions?.hiTdiCovered ?? true;
    const noCertificate = input.stateOptions?.hiNoCertificate ?? false;
    if (typeof allowances !== 'number' || !Number.isInteger(allowances) || allowances < 0) throw new Error('Hawaii allowances must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Hawaii extra withholding must be nonnegative');
    if (typeof tdiRate !== 'number' || !Number.isFinite(tdiRate) || tdiRate < 0 || tdiRate > .005) throw new Error('Hawaii TDI employee rate must be between zero and 0.5%');
    if (typeof tdiCovered !== 'boolean' || typeof noCertificate !== 'boolean') throw new Error('Hawaii coverage elections must be checkboxes');
    const rows = input.federal.filingStatus === 'married_joint' && !noCertificate ? married : single;
    const taxable = Math.max(0, stateTaxableWages * periods[input.payFrequency] - (noCertificate ? 0 : allowances * 1144) - 4350);
    let annualTax = 0;
    for (const [threshold, base, rate] of rows) {
      if (taxable <= threshold && threshold !== 0) break;
      annualTax = base + (taxable - threshold) * rate;
    }
    const tdi = tdiCovered ? Math.min(grossPay * tdiRate, 7.50 * 52 / periods[input.payFrequency]) : 0;
    return {
      incomeTaxWithholding: roundMoney(annualTax / periods[input.payFrequency] + extra),
      payrollDeductions: [{ id: 'hi-tdi', label: 'Hawaii Temporary Disability Insurance', amount: roundMoney(tdi) }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
