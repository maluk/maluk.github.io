import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';
import { annualWithholding } from '../../federal/tables.ts';

type Row = readonly [number, number, number];
const single: Row[] = [[0,0,.011],[11079,121.87,.022],[26264,455.94,.044],[41452,1124.21,.066],[57542,2186.15,.088],[72724,3522.17,.1023],[371479,34084.81,.1133],[445771,42502.09,.1243],[742953,79441.81,.1353],[1000000,114220.27,.1463]];
const married: Row[] = [[0,0,.011],[22158,243.74,.022],[52528,911.88,.044],[82904,2248.42,.066],[115084,4372.30,.088],[145448,7044.33,.1023],[742958,68169.60,.1133],[891542,85004.17,.1243],[1000000,98485.50,.1353],[1485906,164228.58,.1463]];
const head: Row[] = [[0,0,.011],[22173,243.90,.022],[52530,911.75,.044],[67716,1579.93,.066],[83805,2641.80,.088],[98990,3978.08,.1023],[505208,45534.18,.1133],[606251,56982.35,.1243],[1000000,105925.35,.1353],[1010417,107334.77,.1463]];
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
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
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: '2026 Withholding Schedules, Method B', authority: 'California EDD', url: 'https://edd.ca.gov/siteassets/files/pdf_pub_ctr/26methb.pdf' },
    { title: 'Contribution Rates and Withholding', authority: 'California EDD', url: 'https://edd.ca.gov/en/Payroll_Taxes/Rates_and_Withholding' },
  ],
};

export const ca2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['California withholding uses EDD Method B and zero DE 4 allowances unless entered.'],
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
    const rows = status === 'head_of_household' ? head : isMarried ? married : single;
    const annual = annualWithholding(taxable * periods[frequency], rows);
    const withholding = stateTaxableWages <= low ? 0 : roundMoney(Math.max(0, annual / periods[frequency] - credit) + extra);
    return {
      incomeTaxWithholding: withholding,
      payrollDeductions: [{ id: 'ca-sdi', label: 'California SDI', amount: roundMoney(grossPay * .013) }],
      localWithholding: 0,
      localSupported: true,
      assumptions: [],
    };
  },
};
