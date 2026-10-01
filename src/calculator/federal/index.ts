import type { PaycheckInput } from '../types.ts';
import { capRemaining, roundMoney } from '../money.ts';
import { annualWithholding, federalTables } from './tables.ts';

export function calculateFederal(input: PaycheckInput, wages: { income: number; socialSecurity: number; medicare: number }, ytd: { socialSecurity: number; medicare: number }) {
  const rules = federalTables[input.taxYear];
  if (!rules) throw new Error(`Federal rules are unavailable for ${input.taxYear}`);
  const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }[input.payFrequency];
  const w4 = input.federal;
  const adjustment = w4.multipleJobs ? 0 : w4.filingStatus === 'married_joint' ? rules.adjustment.married : rules.adjustment.other;
  const adjustedAnnualWage = Math.max(0, wages.income * periods + w4.otherIncome - w4.deductions - adjustment);
  const schedule = w4.multipleJobs ? rules.multipleJobs[w4.filingStatus] : rules.standard[w4.filingStatus];
  const tentative = annualWithholding(adjustedAnnualWage, schedule) / periods;
  const incomeTaxWithholding = w4.exempt ? 0 : roundMoney(Math.max(0, tentative - w4.dependentCredits / periods) + w4.extraWithholding);
  const socialSecurity = roundMoney(capRemaining(wages.socialSecurity, ytd.socialSecurity, rules.socialSecurityWageBase) * .062);
  const medicare = roundMoney(wages.medicare * .0145);
  const additionalMedicare = roundMoney(Math.max(0, ytd.medicare + wages.medicare - 200000) - Math.max(0, ytd.medicare - 200000));
  return {
    incomeTaxWithholding,
    socialSecurity,
    medicare,
    additionalMedicare: roundMoney(additionalMedicare * .009),
    metadata: rules.metadata,
  };
}
