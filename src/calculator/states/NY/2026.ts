import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { capRemaining, roundMoney } from '../../money.ts';
import { annualWithholding } from '../../federal/tables.ts';

type Row = readonly [number, number, number];
// Method II printed pay-period schedules. Each row is [net wage floor, tax on the floor, marginal rate].
const periodRows: Record<keyof typeof periods, { single: Row[]; married: Row[] }> = {
  weekly: {
    single: [[0,0,.039],[163,6.38,.044],[225,9.08,.0515],[267,11.27,.054],[1551,80.58,.059],[1862,98.90,.0703],[2070,113.58,.0753],[3032,186.02,.064],[4142,257.10,.1144],[5104,367.13,.0735]],
    married: [[0,0,.039],[163,6.38,.044],[225,9.08,.0515],[267,11.27,.054],[1551,80.58,.059],[1862,98.90,.0657],[2070,112.60,.0707],[3032,180.54,.0801],[4068,263.62,.064],[6215,401.04,.1349],[7177,530.77,.0735],[20722,1526.33,.0765]],
  },
  biweekly: {
    single: [[0,0,.039],[327,12.77,.044],[450,18.15,.0515],[535,22.54,.054],[3102,161.15,.059],[3723,197.81,.0703],[4140,227.15,.0753],[6063,372.04,.064],[8285,514.19,.1144],[10208,734.27,.0735]],
    married: [[0,0,.039],[327,12.77,.044],[450,18.15,.0515],[535,22.54,.054],[3102,161.15,.059],[3723,197.81,.0657],[4140,225.19,.0707],[6063,361.08,.0801],[8137,527.23,.064],[12431,802.08,.1349],[14354,1061.54,.0735],[41444,3052.65,.0765]],
  },
  semimonthly: {
    single: [[0,0,.039],[354,13.83,.044],[488,19.67,.0515],[579,24.42,.054],[3360,174.58,.059],[4033,214.29,.0703],[4485,246.08,.0753],[6569,403.04,.064],[8975,557.04,.1144],[11058,795.46,.0735]],
    married: [[0,0,.039],[354,13.83,.044],[488,19.67,.0515],[579,24.42,.054],[3360,174.58,.059],[4033,214.29,.0657],[4485,243.96,.0707],[6569,391.17,.0801],[8815,571.17,.064],[13467,868.92,.1349],[15550,1150,.0735],[44898,3307.04,.0765]],
  },
  monthly: {
    single: [[0,0,.039],[708,27.67,.044],[975,39.33,.0515],[1158,48.83,.054],[6721,349.17,.059],[8067,428.58,.0703],[8971,492.17,.0753],[13138,806.08,.064],[17950,1114.08,.1144],[22117,1590.92,.0735]],
    married: [[0,0,.039],[708,27.67,.044],[975,39.33,.0515],[1158,48.83,.054],[6721,349.17,.059],[8067,428.58,.0657],[8971,487.92,.0707],[13138,782.33,.0801],[17629,1142.33,.064],[26933,1737.83,.1349],[31100,2300,.0735],[89796,6614.08,.0765]],
  },
};
const city: Row[] = [[0,0,.0205],[8000,164,.028],[8700,184,.0325],[15000,388,.0395],[25000,783,.0415],[60000,2236,.0425]];
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const nyDeduction = {
  weekly: { single: 142.30, married: 152.90, allowance: 19.25 },
  biweekly: { single: 284.60, married: 305.80, allowance: 38.50 },
  semimonthly: { single: 308.35, married: 331.25, allowance: 41.65 },
  monthly: { single: 616.70, married: 662.50, allowance: 83.30 },
};
const cityDeduction = {
  weekly: { single: 96.15, married: 105.75, allowance: 19.25 },
  biweekly: { single: 192.30, married: 211.50, allowance: 38.50 },
  semimonthly: { single: 208.35, married: 229.15, allowance: 41.65 },
  monthly: { single: 416.70, married: 458.30, allowance: 83.30 },
};
const source = (title: string, url: string) => ({ title, authority: 'New York State', url });
const metadata: TaxRuleMetadata = {
  jurisdiction: 'NY', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    source('NYS-50-T-NYS (1/26)', 'https://www.tax.ny.gov/pdf/publications/withholding/nys50_t_nys.pdf'),
    source('NYS-50-T-NYC (1/26)', 'https://www.tax.ny.gov/pdf/publications/withholding/nys50_t_nyc.pdf'),
    source('NYS-50-T-Y (1/26)', 'https://www.tax.ny.gov/pdf/publications/withholding/nys50_t_y.pdf'),
    source('2026 Paid Family Leave updates', 'https://paidfamilyleave.ny.gov/paid-family-leave-frequently-asked-questions'),
  ],
};

function nyTax(wages: number, frequency: keyof typeof periods, isMarried: boolean, allowances: number): number {
  const deductions = nyDeduction[frequency];
  const net = Math.max(0, wages - (isMarried ? deductions.married : deductions.single) - allowances * deductions.allowance);
  const annualized = net * periods[frequency];
  if (annualized >= (isMarried ? 2155350 : 1077550)) return roundMoney(annualized * (annualized < 5000000 ? .1045 : annualized < 25000000 ? .111 : .117) / periods[frequency]);
  return roundMoney(annualWithholding(net, periodRows[frequency][isMarried ? 'married' : 'single']));
}

function cityTax(wages: number, frequency: keyof typeof periods, isMarried: boolean, allowances: number): number {
  const deductions = cityDeduction[frequency];
  const net = Math.max(0, wages - (isMarried ? deductions.married : deductions.single) - allowances * deductions.allowance);
  return roundMoney(annualWithholding(net * periods[frequency], city) / periods[frequency]);
}

export const ny2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => ['New York withholding uses IT-2104 allowances; the default is zero.', 'Employer-optional disability benefit withholding is excluded.'],
  calculate({ input, grossPay, stateTaxableWages, localTaxableWages, ytdGrossWages, ytdPayrollContributions }: StateInput): StateResult {
    const frequency = input.payFrequency;
    const isMarried = input.federal.filingStatus === 'married_joint';
    const allowances = Number(input.stateOptions?.nyAllowances ?? 0);
    const extra = Number(input.stateOptions?.nyExtraWithholding ?? 0);
    if (![allowances, extra].every(v => Number.isFinite(v) && v >= 0)) throw new Error('Invalid New York withholding options');
    const incomeTaxWithholding = roundMoney(nyTax(stateTaxableWages, frequency, isMarried, allowances) + extra);
    const priorPfl = ytdPayrollContributions['ny-pfl'] ?? Math.min(411.91, roundMoney(ytdGrossWages * .00432));
    const pfl = input.stateOptions?.nyPflNotCovered ? 0 : roundMoney(Math.min(grossPay * .00432, Math.max(0, 411.91 - priorPfl)));
    let localWithholding = 0;
    let localSupported = !input.location.city;
    if (input.location.city === 'New York City') {
      localWithholding = cityTax(localTaxableWages, frequency, isMarried, allowances);
      localSupported = true;
    } else if (input.location.city === 'Yonkers') {
      localWithholding = roundMoney(nyTax(localTaxableWages, frequency, isMarried, allowances) * .1675);
      localSupported = true;
    }
    return {
      incomeTaxWithholding,
      payrollDeductions: [{ id: 'ny-pfl', label: 'New York Paid Family Leave', amount: pfl }],
      localWithholding,
      localSupported,
      assumptions: [...(input.stateOptions?.nyPflNotCovered ? ['New York Paid Family Leave does not apply to this employment.'] : ['New York Paid Family Leave applies to this employment.']), ...(input.location.city ? [] : ['No New York locality selected.'])],
    };
  },
};
