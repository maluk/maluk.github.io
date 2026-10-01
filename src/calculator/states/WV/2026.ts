import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';

type Bracket = { top: number; base: number; rate: number; excess: number };
const rates: Record<'twoEarner' | 'oneEarner', Record<PayFrequency, { exemption: number; brackets: Bracket[] }>> = {
  twoEarner: {
    weekly: { exemption: 38.46, brackets: [{ top: 144, base: 0, rate: .0211, excess: 0 }, { top: 361, base: 3.04, rate: .0281, excess: 144 }, { top: 577, base: 9.13, rate: .0316, excess: 361 }, { top: 866, base: 15.95, rate: .0422, excess: 577 }, { top: Infinity, base: 28.14, rate: .0458, excess: 866 }] },
    biweekly: { exemption: 76.92, brackets: [{ top: 289, base: 0, rate: .0211, excess: 0 }, { top: 722, base: 6.09, rate: .0281, excess: 289 }, { top: 1154, base: 18.25, rate: .0316, excess: 722 }, { top: 1731, base: 31.90, rate: .0422, excess: 1154 }, { top: Infinity, base: 56.27, rate: .0458, excess: 1731 }] },
    semimonthly: { exemption: 83.33, brackets: [{ top: 313, base: 0, rate: .0211, excess: 0 }, { top: 782, base: 6.60, rate: .0281, excess: 313 }, { top: 1250, base: 19.77, rate: .0316, excess: 782 }, { top: 1875, base: 34.58, rate: .0422, excess: 1250 }, { top: Infinity, base: 60.95, rate: .0458, excess: 1875 }] },
    monthly: { exemption: 166.67, brackets: [{ top: 625, base: 0, rate: .0211, excess: 0 }, { top: 1562, base: 13.18, rate: .0281, excess: 625 }, { top: 2500, base: 39.53, rate: .0316, excess: 1562 }, { top: 3750, base: 69.15, rate: .0422, excess: 2500 }, { top: Infinity, base: 121.91, rate: .0458, excess: 3750 }] },
  },
  oneEarner: {
    weekly: { exemption: 38.46, brackets: [{ top: 192, base: 0, rate: .0211, excess: 0 }, { top: 481, base: 4.05, rate: .0281, excess: 192 }, { top: 769, base: 12.17, rate: .0316, excess: 481 }, { top: 1154, base: 21.27, rate: .0422, excess: 769 }, { top: Infinity, base: 37.52, rate: .0458, excess: 1154 }] },
    biweekly: { exemption: 76.92, brackets: [{ top: 385, base: 0, rate: .0211, excess: 0 }, { top: 962, base: 8.12, rate: .0281, excess: 385 }, { top: 1538, base: 24.34, rate: .0316, excess: 962 }, { top: 2308, base: 42.54, rate: .0422, excess: 1538 }, { top: Infinity, base: 75.03, rate: .0458, excess: 2308 }] },
    semimonthly: { exemption: 83.33, brackets: [{ top: 417, base: 0, rate: .0211, excess: 0 }, { top: 1042, base: 8.80, rate: .0281, excess: 417 }, { top: 1667, base: 26.36, rate: .0316, excess: 1042 }, { top: 2500, base: 46.11, rate: .0422, excess: 1667 }, { top: Infinity, base: 81.26, rate: .0458, excess: 2500 }] },
    monthly: { exemption: 166.67, brackets: [{ top: 833, base: 0, rate: .0211, excess: 0 }, { top: 2083, base: 17.58, rate: .0281, excess: 833 }, { top: 3333, base: 52.70, rate: .0316, excess: 2083 }, { top: 5000, base: 92.20, rate: .0422, excess: 3333 }, { top: Infinity, base: 162.55, rate: .0458, excess: 5000 }] },
  },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'WV', taxYear: 2026, effectiveFrom: '2026-06-12', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'IT-100.2A, 2026 percentage method of withholding', authority: 'West Virginia Tax Division', url: 'https://tax.wv.gov/Documents/Withholding/it100.2a.pdf' },
    { title: 'IT-104 Employee’s Withholding Exemption Certificate', authority: 'West Virginia Tax Division', url: 'https://tax.wv.gov/Documents/Withholding/it104.pdf' },
    { title: '2026 Income Tax Rate Cut and effective date', authority: 'West Virginia Tax Division', url: 'https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx' },
  ],
};

export const wv2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['West Virginia uses the two-earner/two-job schedule unless an eligible employee requests the lower one-earner schedule on IT-104.', 'IT-104 exemptions default to zero until entered, and withholding is rounded to whole dollars.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    if (input.payDate < metadata.effectiveFrom) throw new Error('Verified West Virginia withholding tables are unavailable before June 12, 2026');
    const exemptions = input.stateOptions?.wvExemptions ?? 0;
    const oneEarner = input.stateOptions?.wvOneEarner ?? false;
    const extra = input.stateOptions?.wvExtraWithholding ?? 0;
    if (typeof exemptions !== 'number' || !Number.isInteger(exemptions) || exemptions < 0) throw new Error('West Virginia exemptions must be a nonnegative whole number');
    if (typeof oneEarner !== 'boolean') throw new Error('West Virginia one-earner setting must be a checkbox');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('West Virginia extra withholding must be nonnegative');
    if (oneEarner && input.federal.multipleJobs) throw new Error('West Virginia one-earner schedule cannot be selected with multiple jobs');
    const table = rates[oneEarner ? 'oneEarner' : 'twoEarner'][input.payFrequency];
    const taxable = Math.max(0, stateTaxableWages - exemptions * table.exemption);
    const bracket = table.brackets.find(row => taxable <= row.top)!;
    const tax = bracket.base + bracket.rate * (taxable - bracket.excess);
    return { incomeTaxWithholding: Math.round(tax + extra), payrollDeductions: [], localWithholding: 0, localSupported: true, assumptions: [] };
  },
};
