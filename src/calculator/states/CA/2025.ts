import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';
import { annualWithholding } from '../../federal/tables.ts';
import { periodRows } from './2025Tables.ts';

const lowSingle = { weekly: 353, biweekly: 706, semimonthly: 765, monthly: 1531 };
const lowOther = { weekly: 706, biweekly: 1413, semimonthly: 1531, monthly: 3061 };
const deductionSingle = { weekly: 107, biweekly: 213, semimonthly: 231, monthly: 462 };
const deductionOther = { weekly: 213, biweekly: 426, semimonthly: 462, monthly: 923 };
const allowanceCredit = {
  weekly: [0,3.15,6.30,9.46,12.61,15.76,18.91,22.06,25.22,28.37,31.52],
  biweekly: [0,6.30,12.61,18.91,25.22,31.52,37.82,44.13,50.43,56.73,63.04],
  semimonthly: [0,6.83,13.66,20.49,27.32,34.15,40.98,47.80,54.63,61.46,68.29],
  monthly: [0,13.66,27.32,40.98,54.63,68.29,81.95,95.61,109.27,122.93,136.58],
};
const estimatedAllowance = {
  weekly: [0,19,38,58,77,96,115,135,154,173,192],
  biweekly: [0,38,77,115,154,192,231,269,308,346,385],
  semimonthly: [0,42,83,125,167,208,250,292,333,375,417],
  monthly: [0,83,167,250,333,417,500,583,667,750,833],
};
const metadata: TaxRuleMetadata = {
  jurisdiction: 'CA', taxYear: 2025, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31',
  lastVerified: '2026-09-23', status: 'verified', version: '2025.2', sources: [
    { title: '2025 Withholding Schedules, Method B', authority: 'California EDD', url: 'https://edd.ca.gov/siteassets/files/pdf_pub_ctr/25methb.pdf' },
    { title: '2025 California Employer’s Guide', authority: 'California EDD', url: 'https://edd.ca.gov/siteassets/files/pdf_pub_ctr/de44-25.pdf' },
  ],
};
export const ca2025: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['California withholding uses EDD Method B and zero DE 4 allowances unless entered.', 'For married filers, the federal multiple-jobs checkbox selects California’s dual-income married schedule.'],
  calculate({ input, grossPay, stateTaxableWages }: StateInput): StateResult {
    const frequency = input.payFrequency;
    const allowances = Number(input.stateOptions?.caAllowances ?? 0);
    const deductionAllowances = Number(input.stateOptions?.caDeductionAllowances ?? 0);
    const extra = Number(input.stateOptions?.caExtraWithholding ?? 0);
    if (![allowances, deductionAllowances, extra].every(v => Number.isFinite(v) && v >= 0) || !Number.isInteger(allowances) || !Number.isInteger(deductionAllowances)) throw new Error('Invalid California withholding options');
    const status = input.federal.filingStatus;
    const isMarried = status === 'married_joint' && !input.federal.multipleJobs;
    const useOther = status === 'head_of_household' || (isMarried && allowances >= 2);
    const low = useOther ? lowOther[frequency] : lowSingle[frequency];
    const standard = useOther ? deductionOther[frequency] : deductionSingle[frequency];
    const deductionAllowanceAmount = deductionAllowances <= 10 ? estimatedAllowance[frequency][deductionAllowances] : deductionAllowances * estimatedAllowance[frequency][1];
    const credit = allowances <= 10 ? allowanceCredit[frequency][allowances] : allowances * allowanceCredit[frequency][1];
    const taxable = Math.max(0, stateTaxableWages - standard - deductionAllowanceAmount);
    const rows = periodRows[frequency][status === 'head_of_household' ? 'head' : isMarried ? 'married' : 'single'];
    const tax = roundMoney(annualWithholding(taxable, rows));
    const withholding = roundMoney((stateTaxableWages <= low ? 0 : Math.max(0, tax - credit)) + extra);
    return {
      incomeTaxWithholding: withholding,
      payrollDeductions: [{ id: 'ca-sdi', label: 'California SDI', amount: roundMoney(grossPay * .012) }],
      localWithholding: 0, localSupported: true, assumptions: [],
    };
  },
};
