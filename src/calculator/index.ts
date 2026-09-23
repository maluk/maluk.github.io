import type { PaycheckInput, PaycheckResult, StateCalculator } from './types.ts';
import { roundMoney } from './money.ts';
import { calculateDeductions } from './deductions.ts';
import { calculateFederal } from './federal/index.ts';
import { stateCalculators } from './states/index.ts';
import { validatePaycheckInput } from './validation.ts';

const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };

export function projectedYtd(grossPay: number, payDate: string, payFrequency: keyof typeof periods): number {
  const date = new Date(`${payDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid pay date');
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const elapsed = (date.getTime() - start) / 86400000;
  const yearDays = (Date.UTC(date.getUTCFullYear() + 1, 0, 1) - start) / 86400000;
  return roundMoney(grossPay * periods[payFrequency] * elapsed / yearDays);
}

export function calculatePaycheck(input: PaycheckInput, ruleSet?: StateCalculator): PaycheckResult {
  validatePaycheckInput(input);
  const count = periods[input.payFrequency];
  const grossPay = roundMoney(input.compensation.type === 'salary'
    ? input.compensation.annualSalary / count
    : input.compensation.hourlyRate * (input.compensation.regularHours + (input.compensation.overtimeHours || 0) * (input.compensation.overtimeMultiplier ?? 1.5)));
  if (!Number.isFinite(grossPay) || grossPay < 0) throw new Error('Gross pay must be nonnegative');
  const stateRule = ruleSet ?? stateCalculators[input.taxYear]?.[input.location.state];
  if (!stateRule || stateRule.metadata.status !== 'verified') throw new Error(`Verified state rules are unavailable for ${input.location.state} in ${input.taxYear}`);
  if (stateRule.metadata.taxYear !== input.taxYear || stateRule.metadata.jurisdiction !== input.location.state) throw new Error('Tax rule and paycheck jurisdiction do not match');
  const deductions = calculateDeductions(input, grossPay);
  const projected = projectedYtd(grossPay, input.payDate, input.payFrequency);
  const ytd = input.ytd || {};
  const federal = calculateFederal(input, { income: deductions.wages.income, socialSecurity: deductions.wages.socialSecurity, medicare: deductions.wages.medicare }, {
    socialSecurity: ytd.socialSecurityWages ?? projected * (grossPay ? deductions.wages.socialSecurity / grossPay : 0),
    medicare: ytd.medicareWages ?? projected * (grossPay ? deductions.wages.medicare / grossPay : 0),
  });
  const state = stateRule.calculate({
    input,
    grossPay,
    stateTaxableWages: deductions.wages.state,
    socialSecurityTaxableWages: deductions.wages.socialSecurity,
    localTaxableWages: deductions.wages.local,
    ytdGrossWages: ytd.grossWages ?? projected,
    ytdStateWages: ytd.stateWages ?? projected * (grossPay ? deductions.wages.state / grossPay : 0),
    ytdPayrollContributions: ytd.payrollContributions ?? {},
    federalPayrollTaxes: { socialSecurity: federal.socialSecurity, medicare: federal.medicare, additionalMedicare: federal.additionalMedicare },
    federalIncomeTaxWithholding: federal.incomeTaxWithholding,
    ytdSocialSecurityWages: ytd.socialSecurityWages ?? projected * (grossPay ? deductions.wages.socialSecurity / grossPay : 0),
    ytdMedicareWages: ytd.medicareWages ?? projected * (grossPay ? deductions.wages.medicare / grossPay : 0),
  });
  const withholding = federal.incomeTaxWithholding + federal.socialSecurity + federal.medicare + federal.additionalMedicare
    + state.incomeTaxWithholding + state.localWithholding + state.payrollDeductions.reduce((sum, row) => sum + row.amount, 0);
  const netPay = roundMoney(grossPay - withholding - deductions.preTaxDeductions - deductions.postTaxDeductions);
  if (netPay < 0) throw new Error('Withholding and deductions exceed gross pay');
  const assumptions = [
    'One employer; work and residence are in the selected state.',
    ...([ytd.grossWages, ytd.socialSecurityWages, ytd.medicareWages].some(value => value === undefined) ? ['Missing YTD wages are projected from the selected pay date and current pay pattern.'] : []),
    ...stateRule.getAssumptions(), ...state.assumptions,
  ];
  if (!state.localSupported) assumptions.push('Local income taxes are not included in this estimate.');
  return {
    grossPay,
    federal: { incomeTaxWithholding: federal.incomeTaxWithholding, socialSecurity: federal.socialSecurity, medicare: federal.medicare, additionalMedicare: federal.additionalMedicare },
    state: { incomeTaxWithholding: state.incomeTaxWithholding, payrollDeductions: state.payrollDeductions },
    local: { withholding: state.localWithholding, supported: state.localSupported },
    deductions: deductions.lines,
    preTaxDeductions: deductions.preTaxDeductions,
    postTaxDeductions: deductions.postTaxDeductions,
    netPay,
    assumptions,
    sources: [...federal.metadata.sources, ...stateRule.getSources()],
    rules: [federal.metadata, stateRule.metadata],
  };
}
