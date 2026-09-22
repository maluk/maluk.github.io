import type { PaycheckInput } from './types.ts';

const frequencies = new Set(['weekly', 'biweekly', 'semimonthly', 'monthly']);
const statuses = new Set(['single', 'married_joint', 'married_separate', 'head_of_household']);

function nonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a nonnegative number`);
}

export function validatePaycheckInput(input: PaycheckInput): void {
  if (!Number.isInteger(input.taxYear) || !frequencies.has(input.payFrequency)) throw new Error('Invalid tax year or pay frequency');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.payDate)) throw new Error('Pay date must use YYYY-MM-DD');
  const date = new Date(`${input.payDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.payDate || date.getUTCFullYear() !== input.taxYear) throw new Error('Pay date and tax year must match');
  if (!statuses.has(input.federal.filingStatus)) throw new Error('Invalid filing status');
  if (typeof input.federal.multipleJobs !== 'boolean' || typeof input.federal.exempt !== 'boolean') throw new Error('Invalid W-4 selection');
  for (const [label, value] of Object.entries({ 'Dependent credits': input.federal.dependentCredits, 'Other income': input.federal.otherIncome, 'Other deductions': input.federal.deductions, 'Extra withholding': input.federal.extraWithholding })) nonnegative(value, label);
  if (input.compensation.type === 'salary') nonnegative(input.compensation.annualSalary, 'Annual salary');
  else if (input.compensation.type === 'hourly') {
    nonnegative(input.compensation.hourlyRate, 'Hourly rate');
    nonnegative(input.compensation.regularHours, 'Regular hours');
    nonnegative(input.compensation.overtimeHours ?? 0, 'Overtime hours');
    const multiplier = input.compensation.overtimeMultiplier ?? 1.5;
    if (!Number.isFinite(multiplier) || multiplier < 1) throw new Error('Overtime multiplier must be at least 1');
  } else throw new Error('Invalid compensation type');
  if (!/^[A-Z]{2}$/.test(input.location.state)) throw new Error('Invalid state');
  if (!Array.isArray(input.deductions)) throw new Error('Invalid deductions');
  for (const deduction of input.deductions) {
    nonnegative(deduction.amount, 'Deduction amount');
    if (!['401k', 'hsa', 'fsa', 'health', 'dental', 'vision', 'custom'].includes(deduction.kind) || !['dollars', 'percent'].includes(deduction.unit) || !['pre_tax', 'post_tax'].includes(deduction.timing)) throw new Error('Invalid deduction settings');
    if (deduction.unit === 'percent' && deduction.amount > 100) throw new Error('Deduction percentage cannot exceed 100%');
    if (deduction.treatment && !['federalIncomeTax', 'socialSecurity', 'medicare', 'stateIncomeTax', 'localIncomeTax'].every(key => typeof deduction.treatment?.[key as keyof typeof deduction.treatment] === 'boolean')) throw new Error('Deduction tax treatment must specify every wage base');
  }
  for (const value of [input.ytd?.grossWages, input.ytd?.socialSecurityWages, input.ytd?.medicareWages, input.ytd?.stateWages, ...Object.values(input.ytd?.payrollContributions ?? {})]) {
    if (value !== undefined) nonnegative(value, 'YTD value');
  }
}
