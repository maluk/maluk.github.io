import type { PayFrequency, StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Amounts = { joint: number; other: number; dependent: number };
const beforeMay: Record<PayFrequency, Amounts> = {
  weekly: { joint: 461.54, other: 230.77, dependent: 76.92 },
  biweekly: { joint: 923.08, other: 461.54, dependent: 153.85 },
  semimonthly: { joint: 1000, other: 500, dependent: 166.67 },
  monthly: { joint: 2000, other: 1000, dependent: 333.33 },
};
const fromMay: Record<PayFrequency, Amounts> = {
  weekly: { joint: 576.92, other: 288.46, dependent: 96.15 },
  biweekly: { joint: 1153.85, other: 576.92, dependent: 192.31 },
  semimonthly: { joint: 1250, other: 625, dependent: 208.33 },
  monthly: { joint: 2500, other: 1250, dependent: 416.67 },
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'GA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.2', sources: [
    { title: '2026 Employer’s Withholding Tax Guide, revised June 2026', authority: 'Georgia Department of Revenue', url: 'https://dor.georgia.gov/document/document/2026-employers-tax-guide-updated-june-2026/download' },
    { title: '2025 Employer’s Withholding Tax Guide, percentage method used before May 11, 2026', authority: 'Georgia Department of Revenue', url: 'https://dor.georgia.gov/document/document-document/2025-employers-tax-guide-updated-june-2025/download' },
  ],
};

export const ga2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['Georgia uses the G-4 percentage method. Before May 11, 2026, withholding uses the prior 5.19% schedule; from May 11 the estimate uses the revised 4.99% schedule.'],
  calculate({ input, stateTaxableWages }: StateInput): StateResult {
    const dependents = Number(input.stateOptions?.gaDependents ?? 0);
    const bothWorking = input.stateOptions?.gaBothSpousesWorking ?? false;
    if (!Number.isInteger(dependents) || dependents < 0 || typeof bothWorking !== 'boolean') throw new Error('Invalid Georgia G-4 selections');
    const revised = input.payDate >= '2026-05-11';
    const amounts = (revised ? fromMay : beforeMay)[input.payFrequency];
    const joint = input.federal.filingStatus === 'married_joint' && !bothWorking;
    const taxable = Math.max(0, stateTaxableWages - (joint ? amounts.joint : amounts.other) - dependents * amounts.dependent);
    return {
      incomeTaxWithholding: roundMoney(taxable * (revised ? .0499 : .0519)),
      payrollDeductions: [], localWithholding: 0, localSupported: true,
      assumptions: [revised ? 'Georgia’s May 11, 2026 withholding change is applied.' : 'Georgia’s pre-May 11, 2026 withholding schedule is applied.'],
    };
  },
};
