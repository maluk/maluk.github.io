import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';
import { annualWithholding } from '../../federal/tables.ts';
import { periodRows } from './2026Tables.ts';

const lowSingle = { weekly: 363, biweekly: 727, semimonthly: 787, monthly: 1575 };
const lowOther = { weekly: 727, biweekly: 1454, semimonthly: 1575, monthly: 3149 };
const deductionSingle = { weekly: 110, biweekly: 219, semimonthly: 238, monthly: 476 };
const deductionOther = { weekly: 219, biweekly: 439, semimonthly: 476, monthly: 951 };
const allowanceCredit = {
  weekly: [0,3.24,6.47,9.71,12.95,16.18,19.42,22.66,25.89,29.13,32.37],
  biweekly: [0,6.47,12.95,19.42,25.89,32.37,38.84,45.31,51.78,58.26,64.73],
  semimonthly: [0,7.01,14.03,21.04,28.05,35.06,42.08,49.09,56.10,63.11,70.13],
  monthly: [0,14.03,28.05,42.08,56.10,70.13,84.15,98.18,112.20,126.23,140.25],
};
const estimatedAllowance = {
  weekly: [0,19,38,58,77,96,115,135,154,173,192],
  biweekly: [0,38,77,115,154,192,231,269,308,346,385],
  semimonthly: [0,42,83,125,167,208,250,292,333,375,417],
  monthly: [0,83,167,250,333,417,500,583,667,750,833],
};

const metadata: TaxRuleMetadata = {
  jurisdiction: 'CA', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-23', status: 'verified', version: '2026.2', sources: [
    { title: '2026 Withholding Schedules, Method B', authority: 'California EDD', url: 'https://edd.ca.gov/siteassets/files/pdf_pub_ctr/26methb.pdf' },
    { title: 'Contribution Rates and Withholding', authority: 'California EDD', url: 'https://edd.ca.gov/en/Payroll_Taxes/Rates_and_Withholding' },
  ],
};

export const ca2026: StateCalculator = {
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
      payrollDeductions: [{ id: 'ca-sdi', label: 'California SDI', amount: roundMoney(grossPay * .013) }],
      localWithholding: 0,
      localSupported: true,
      assumptions: [],
    };
  },
};
