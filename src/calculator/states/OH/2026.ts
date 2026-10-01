import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const metadata: TaxRuleMetadata = {
  jurisdiction: 'OH', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.2', sources: [
    { title: 'Optional Computer Formula, effective October 1, 2025', authority: 'Ohio Department of Taxation', url: 'https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/employer_withholding/2025%20Withholding%20Tables/WHT_OptionalComputerFormula_2025.pdf' },
    { title: 'Optional Computer Formula, effective August 1, 2026', authority: 'Ohio Department of Taxation', url: 'https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/employer_withholding/2026%20Withholding%20Tables/WHT_OptionalComputerFormula_2026.pdf' },
    { title: 'Percentage Method, effective August 1, 2026', authority: 'Ohio Department of Taxation', url: 'https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/employer_withholding/2026%20Withholding%20Tables/WHT_PercentageMethod_2026.pdf' },
    { title: 'New Ohio withholding rates effective August 1, 2026', authority: 'Ohio Department of Taxation', url: 'https://content.govdelivery.com/accounts/OHTAX/bulletins/420a1ea' },
  ],
};

export const oh2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Ohio withholding uses the optional computer formula. The default is zero Ohio exemptions.', 'Municipal and school district income taxes are excluded.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const exemptions = input.stateOptions?.ohExemptions ?? 0;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('Ohio exemptions must be a nonnegative whole number');
    const periodCount = periods[input.payFrequency];
    const taxableAnnual = Math.max(0, stateTaxableWages * periodCount - 650 * exemptions);
    const revised = input.payDate >= '2026-08-01';
    const annual = revised
      ? taxableAnnual <= 26050 ? taxableAnnual * .016
        : taxableAnnual <= 100000 ? 416.80 + (taxableAnnual - 26050) * .0299
          : 2627.91 + (taxableAnnual - 100000) * .034
      : taxableAnnual <= 26050 ? taxableAnnual * .01775
        : taxableAnnual <= 100000 ? 462.39 + (taxableAnnual - 26050) * .0299
          : 2673.50 + (taxableAnnual - 100000) * .0364;
    return {
      incomeTaxWithholding: roundMoney(annual / periodCount),
      payrollDeductions: [], localWithholding: 0, localSupported: false,
      assumptions: [revised ? 'The August 1, 2026 Ohio withholding formula applies.' : 'The October 1, 2025 Ohio withholding formula applies to this 2026 paycheck.'],
    };
  },
};
