import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'CO', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Colorado Withholding Worksheet for Employers (DR 1098)', authority: 'Colorado Department of Revenue', url: 'https://tax.colorado.gov/sites/tax/files/documents/DR_1098_Colorado_Withholding_Worksheet_for_Employees.pdf' },
    { title: '2026 Colorado Employee Withholding Certificate (DR 0004)', authority: 'Colorado Department of Revenue', url: 'https://tax.colorado.gov/sites/tax/files/documents/DR_0004_2026.pdf' },
    { title: '2026 FAMLI Program Notice', authority: 'Colorado Department of Personnel & Administration', url: 'https://dhr.colorado.gov/sites/dhr/files/documents/FAMLI%20Program%20Notice%20English%20December%202025.pdf' },
    { title: 'FAMLI premium wage base and Social Security maximum', authority: 'Colorado General Assembly', url: 'https://content.leg.colorado.gov/sites/default/files/fy2024-25_labhrg_0.pdf' },
  ],
};

export const co2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Colorado DR 1098 uses a $5,500 default annual allowance, or $11,000 for married filing jointly, unless DR 0004 supplies a different amount.',
    'The estimate assumes the standard 0.44% employee FAMLI premium and state plan coverage.',
    'Local occupational privilege taxes are excluded.',
  ],
  calculate({ input, grossPay, stateTaxableWages, ytdGrossWages }: StateInput): StateResult {
    const allowance = input.stateOptions?.coAnnualAllowance ?? (input.federal.filingStatus === 'married_joint' ? 11000 : 5500);
    const extra = input.stateOptions?.coExtraWithholding ?? 0;
    const exempt = input.stateOptions?.coExempt ?? (input.federal.exempt && input.stateOptions?.coAnnualAllowance === undefined);
    if (typeof allowance !== 'number' || !Number.isFinite(allowance) || allowance < 0) throw new Error('Colorado DR 0004 allowance must be nonnegative');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Colorado extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('Colorado exemption must be a checkbox');
    const annualTaxable = Math.max(0, stateTaxableWages * periods[input.payFrequency] - allowance);
    const withholding = exempt ? 0 : roundMoney(annualTaxable * .044 / periods[input.payFrequency] + extra);
    const premiumWages = Math.min(grossPay, Math.max(0, 184500 - ytdGrossWages));
    return {
      incomeTaxWithholding: withholding,
      payrollDeductions: [{ id: 'co-famli', label: 'Colorado FAMLI', amount: roundMoney(premiumWages * .0044) }],
      localWithholding: 0, localSupported: false, assumptions: [],
    };
  },
};
