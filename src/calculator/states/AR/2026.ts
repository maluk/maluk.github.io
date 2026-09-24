import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'AR', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Arkansas Withholding Tax Formula Method', authority: 'Arkansas Department of Finance and Administration', url: 'https://www.dfa.arkansas.gov/wp-content/uploads/whformula_2026.pdf' },
    { title: '2026 Arkansas Withholding Tax Instructions', authority: 'Arkansas Department of Finance and Administration', url: 'https://www.dfa.arkansas.gov/wp-content/uploads/withholdInstructions_2026.pdf' },
  ],
};

function annualGrossTax(income: number): number {
  if (income < 5600) return 0;
  if (income < 11200) return income * .02 - 111.98;
  if (income < 16000) return income * .03 - 223.97;
  if (income < 26400) return income * .034 - 287.97;
  if (income <= 94700) return income * .039 - 419.96;
  if (income <= 97800) {
    const band = Math.floor((income - 94701) / 100);
    return income * .039 - (399.30 - band * 10);
  }
  return income * .039 - 89.30;
}

export const ar2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Arkansas follows its 2026 electronic-system formula: annualize wages, subtract $2,470, use the $50 midrange for taxable incomes below $100,001, and apply AR4EC exemption credits.',
    'The formula’s worked example has conflicting prose in one bracket-adjustment sentence. The numeric bracket table and worked arithmetic control the calculation.',
    'Withholding exemptions default to zero until entered in Advanced options. An AR4ECSP exemption is applied only when selected.',
  ],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.arExemptions ?? 0;
    const extra = input.stateOptions?.arExtraWithholding ?? 0;
    const exempt = input.stateOptions?.arExempt ?? false;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Arkansas exemptions must be nonnegative whole numbers');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Arkansas extra withholding must be nonnegative');
    if (typeof exempt !== 'boolean') throw new Error('Arkansas exemption election must be a checkbox');
    if (exempt) return { incomeTaxWithholding: 0, payrollDeductions: [], localWithholding: 0, localSupported: !input.location.city, assumptions: [] };
    const taxable = Math.max(0, stateTaxableWages * periods[input.payFrequency] - 2470);
    const tableIncome = taxable < 100001 ? Math.floor(taxable / 100) * 100 + 50 : taxable;
    const grossTax = Math.max(0, Math.round(annualGrossTax(tableIncome)));
    const annualNet = Math.max(0, grossTax - exemptions * 29);
    return { incomeTaxWithholding: roundMoney(annualNet / periods[input.payFrequency] + extra), payrollDeductions: [], localWithholding: 0, localSupported: !input.location.city, assumptions: [] };
  },
};
