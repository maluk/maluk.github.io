import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata, TaxSource } from '../types.ts';
import { capRemaining, roundMoney } from '../money.ts';

const source = (title: string, authority: string, url: string): TaxSource => ({ title, authority, url });
type NoIncomeTaxState = 'TX' | 'FL' | 'WA' | 'NV' | 'SD' | 'TN' | 'NH' | 'WY' | 'AK';
const noTaxSources: Record<NoIncomeTaxState, TaxSource> = {
  TX: source('Texas individual income tax information', 'Texas Comptroller', 'https://comptroller.texas.gov/taxes/'),
  FL: source('Florida tax information', 'Florida Department of Revenue', 'https://floridarevenue.com/taxes/taxesfees/Pages/default.aspx'),
  WA: source('Washington taxes', 'Washington Department of Revenue', 'https://dor.wa.gov/taxes-rates/income-tax'),
  NV: source('Income Tax in Nevada', 'Nevada Department of Taxation', 'https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada/'),
  SD: source('Taxes for individuals', 'South Dakota Department of Revenue', 'https://dor.sd.gov/individuals/taxes/'),
  TN: source('Income Tax Withholding', 'Tennessee Department of Revenue', 'https://revenue.support.tn.gov/hc/en-us/articles/360057595051-GEN-34-Income-Tax-Withholding'),
  NH: source('Interest and Dividends Tax', 'New Hampshire Department of Revenue Administration', 'https://www.revenue.nh.gov/taxes-glance/interest-dividends-tax'),
  WY: source('Business Resources', 'Wyoming Business Council', 'https://wyomingbusiness.org/why-wyoming/business-resources/'),
  AK: source('2026 Unemployment Insurance Tax Rates', 'Alaska Department of Labor and Workforce Development', 'https://labor.alaska.gov/estax/2026-experience-rates.html'),
};
const waSources = [
  source('2026 Paid Family and Medical Leave premiums', 'Washington Employment Security Department', 'https://paidleave.wa.gov/updates/'),
  source('WA Cares premiums', 'WA Cares Fund', 'https://wacaresfund.wa.gov/help-support/frequently-asked-questions'),
];

export function noIncomeTaxCalculator(state: NoIncomeTaxState, taxYear: 2025 | 2026): StateCalculator {
  if (taxYear === 2025 && !['TX', 'FL', 'WA'].includes(state)) throw new Error(`No 2025 rule for ${state}`);
  const waPremium = taxYear === 2025 ? .0092 : .0113;
  const waEmployeeShare = taxYear === 2025 ? .7152 : .7143;
  const waWageBase = taxYear === 2025 ? 176100 : 184500;
  const metadata: TaxRuleMetadata = {
    jurisdiction: state, taxYear, effectiveFrom: `${taxYear}-01-01`, effectiveTo: `${taxYear}-12-31`,
    lastVerified: '2026-09-22', status: 'verified', version: `${taxYear}.1`,
    sources: state === 'WA' ? [noTaxSources.WA, taxYear === 2025 ? source('2025 Paid Leave premium rates', 'Washington Employment Security Department', 'https://paidleave.wa.gov/app/uploads/2024/10/2025-Premium-Rates-Employer-Mailer.pdf') : waSources[0], waSources[1]] : state === 'AK' ? [source('Alaska individual income tax', 'Alaska Court System', 'https://courts.alaska.gov/shc/probate/tax-matters.htm'), noTaxSources.AK] : [noTaxSources[state]],
  };
  return {
    metadata,
    getSources: () => metadata.sources,
    getAssumptions: () => state === 'WA' ? ['Washington Paid Leave uses the maximum permitted employee share; an employer may cover some or all of it.', 'WA Cares applies unless you have an approved exemption.'] : [],
    calculate({ input, grossPay, ytdGrossWages }: StateInput): StateResult {
      const deductions = state === 'WA' ? [
        { id: 'wa-paid-leave', label: 'WA Paid Family & Medical Leave', amount: roundMoney(capRemaining(grossPay, ytdGrossWages, waWageBase) * waPremium * waEmployeeShare) },
        { id: 'wa-cares', label: 'WA Cares', amount: input.stateOptions?.waCaresExempt ? 0 : roundMoney(grossPay * .0058) },
      ] : state === 'AK' ? [
        { id: 'ak-ui', label: 'Alaska unemployment insurance', amount: roundMoney(capRemaining(grossPay, ytdGrossWages, 54200) * .005) },
      ] : [];
      return { incomeTaxWithholding: 0, payrollDeductions: deductions, localWithholding: 0, localSupported: true, assumptions: [] };
    },
  };
}
