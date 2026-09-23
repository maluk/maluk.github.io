import type { Deduction, DeductionTaxTreatment, PaycheckInput, PayrollDeduction } from './types.ts';
import { roundMoney } from './money.ts';

const all = { federalIncomeTax: true, socialSecurity: true, medicare: true, stateIncomeTax: true, localIncomeTax: true };
const incomeOnly = { federalIncomeTax: true, socialSecurity: false, medicare: false, stateIncomeTax: true, localIncomeTax: true };
const none = { federalIncomeTax: false, socialSecurity: false, medicare: false, stateIncomeTax: false, localIncomeTax: false };

export function treatmentFor(deduction: Deduction, state: string): DeductionTaxTreatment {
  if (deduction.timing === 'post_tax') return none;
  if (deduction.treatment) return deduction.treatment;
  if (deduction.kind === 'custom') throw new Error('Custom deductions require an explicit tax treatment');
  if (deduction.kind === '401k') return state === 'PA' ? { ...incomeOnly, stateIncomeTax: false, localIncomeTax: false } : incomeOnly;
  if (deduction.kind === 'hsa' && state === 'CA') return { ...all, stateIncomeTax: false };
  if (state === 'NJ') return { ...all, stateIncomeTax: false };
  return all;
}

export function calculateDeductions(input: PaycheckInput, grossPay: number) {
  const wages = { income: grossPay, socialSecurity: grossPay, medicare: grossPay, state: grossPay, local: grossPay };
  let preTaxDeductions = 0;
  let postTaxDeductions = 0;
  const lines: PayrollDeduction[] = [];
  for (const deduction of input.deductions) {
    if (!Number.isFinite(deduction.amount) || deduction.amount < 0) throw new Error('Deduction amounts must be nonnegative');
    const amount = roundMoney(deduction.unit === 'percent' ? grossPay * deduction.amount / 100 : deduction.amount);
    if (amount === 0) continue;
    lines.push({ id: deduction.id, label: deduction.label, amount });
    if (deduction.timing === 'pre_tax') preTaxDeductions += amount;
    else postTaxDeductions += amount;
    const treatment = treatmentFor(deduction, input.location.state);
    if (treatment.federalIncomeTax) wages.income -= amount;
    if (treatment.socialSecurity) wages.socialSecurity -= amount;
    if (treatment.medicare) wages.medicare -= amount;
    if (treatment.stateIncomeTax) wages.state -= amount;
    if (treatment.localIncomeTax) wages.local -= amount;
  }
  if (preTaxDeductions + postTaxDeductions > grossPay) throw new Error('Deductions exceed gross pay');
  for (const key of Object.keys(wages) as (keyof typeof wages)[]) wages[key] = Math.max(0, roundMoney(wages[key]));
  return { wages, lines, preTaxDeductions: roundMoney(preTaxDeductions), postTaxDeductions: roundMoney(postTaxDeductions) };
}
