import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFederal } from './federal/index.ts';
import { calculatePaycheck } from './index.ts';
import { defaultInput } from '../site/defaultInput.ts';
import type { PaycheckInput } from './types.ts';

function input(state = 'TX'): PaycheckInput { return defaultInput(state); }

test('2026 single biweekly withholding uses Publication 15-T Worksheet 1A', () => {
  const result = calculatePaycheck(input());
  assert.equal(result.federal.incomeTaxWithholding, 506.54);
  assert.equal(result.federal.socialSecurity, 238.46);
  assert.equal(result.federal.medicare, 55.77);
});

test('2026 multiple-jobs schedule increases withholding', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, federal: { ...base.federal, multipleJobs: true } });
  assert.ok(result.federal.incomeTaxWithholding > calculatePaycheck(base).federal.incomeTaxWithholding);
});

test('W-4 credits reduce period withholding', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, federal: { ...base.federal, dependentCredits: 2600 } });
  assert.equal(result.federal.incomeTaxWithholding, 406.54);
});

test('W-4 extra withholding adds to the paycheck', () => {
  const base = input();
  assert.equal(calculatePaycheck({ ...base, federal: { ...base.federal, extraWithholding: 50 } }).federal.incomeTaxWithholding, 556.54);
});

test('W-4 exemption affects income tax but not FICA', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, federal: { ...base.federal, exempt: true } });
  assert.equal(result.federal.incomeTaxWithholding, 0);
  assert.ok(result.federal.socialSecurity > 0);
});

test('zero wages produce zero withholding', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } });
  assert.equal(result.netPay, 0);
});

test('Social Security stops at the 2026 wage base', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, ytd: { socialSecurityWages: 184500, medicareWages: 184500 } });
  assert.equal(result.federal.socialSecurity, 0);
});

test('Social Security taxes only remaining wages at the cap', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, ytd: { socialSecurityWages: 184000, medicareWages: 184000 } });
  assert.equal(result.federal.socialSecurity, 31);
});

test('Additional Medicare begins on the paycheck crossing $200,000', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, ytd: { socialSecurityWages: 200000, medicareWages: 199000 } });
  assert.equal(result.federal.additionalMedicare, 25.62);
});

test('Additional Medicare applies to the full paycheck after threshold', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, ytd: { socialSecurityWages: 210000, medicareWages: 210000 } });
  assert.equal(result.federal.additionalMedicare, 34.62);
});

test('salary gross uses all four pay frequencies', () => {
  const base = input();
  for (const [frequency, gross] of Object.entries({ weekly: 1923.08, biweekly: 3846.15, semimonthly: 4166.67, monthly: 8333.33 })) {
    assert.equal(calculatePaycheck({ ...base, payFrequency: frequency as PaycheckInput['payFrequency'] }).grossPay, gross);
  }
});

test('hourly overtime is paid at its selected multiplier', () => {
  const base = input();
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'hourly', hourlyRate: 25, regularHours: 80, overtimeHours: 5, overtimeMultiplier: 1.5 } }).grossPay, 2187.5);
});

test('traditional 401(k) reduces income wages but not FICA wages', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, deductions: [{ id: 'k', label: '401(k)', kind: '401k', amount: 100, unit: 'dollars', timing: 'pre_tax' }] });
  assert.equal(result.federal.socialSecurity, calculatePaycheck(base).federal.socialSecurity);
  assert.ok(result.federal.incomeTaxWithholding < calculatePaycheck(base).federal.incomeTaxWithholding);
});

test('HSA payroll contribution reduces FICA wages', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, deductions: [{ id: 'h', label: 'HSA', kind: 'hsa', amount: 100, unit: 'dollars', timing: 'pre_tax' }] });
  assert.equal(result.federal.socialSecurity, 232.26);
});

test('percentage deductions use paycheck gross', () => {
  const base = input();
  const result = calculatePaycheck({ ...base, deductions: [{ id: 'k', label: '401(k)', kind: '401k', amount: 10, unit: 'percent', timing: 'pre_tax' }] });
  assert.equal(result.preTaxDeductions, 384.62);
});

test('custom deductions require tax treatment', () => {
  const base = input();
  assert.throws(() => calculatePaycheck({ ...base, deductions: [{ id: 'x', label: 'Custom', kind: 'custom', amount: 10, unit: 'dollars', timing: 'pre_tax' }] }));
});

test('2025 federal wage base is versioned', () => {
  const base = input();
  const federal = calculateFederal({ ...base, taxYear: 2025, payDate: '2025-09-22' }, { income: 1000, socialSecurity: 1000, medicare: 1000 }, { socialSecurity: 176000, medicare: 0 });
  assert.equal(federal.socialSecurity, 6.2);
});

test('unsupported tax years fail closed', () => {
  const base = input();
  assert.throws(() => calculatePaycheck({ ...base, taxYear: 2027, payDate: '2027-01-01' }));
});

test('pay date must match tax year', () => {
  const base = input();
  assert.throws(() => calculatePaycheck({ ...base, payDate: '2025-12-31' }));
});

test('gross-to-net result reconciles to the cent', () => {
  const result = calculatePaycheck(input('WA'));
  const payroll = result.state.payrollDeductions.reduce((sum, line) => sum + line.amount, 0);
  const deductions = result.federal.incomeTaxWithholding + result.federal.socialSecurity + result.federal.medicare + result.federal.additionalMedicare + result.state.incomeTaxWithholding + result.local.withholding + payroll + result.preTaxDeductions + result.postTaxDeductions;
  assert.equal(Math.round((result.grossPay - deductions) * 100) / 100, result.netPay);
});
