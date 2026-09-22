import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaycheck } from './index.ts';
import { defaultInput } from '../site/defaultInput.ts';
import { ca2026 } from './states/CA/2026.ts';
import { ca2025 } from './states/CA/2025.ts';

test('California 2025 Method B matches EDD Example B', () => {
  const base = defaultInput('CA', 2025);
  const result = ca2025.calculate({ input: { ...base, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { caAllowances: 2, caDeductionAllowances: 1 } }, grossPay: 1600, stateTaxableWages: 1600, localTaxableWages: 1600, ytdGrossWages: 0, ytdStateWages: 0, ytdPayrollContributions: {} });
  assert.equal(result.incomeTaxWithholding, 3.28);
});

test('Washington 2025 Paid Leave premium has the historical rate and cap', () => {
  const base = defaultInput('WA', 2025);
  const result = calculatePaycheck({ ...base, ytd: { grossWages: 176000 } });
  assert.equal(result.state.payrollDeductions[0].amount, 0.66);
  assert.ok(result.state.payrollDeductions[1].amount > 0);
});

test('California Method B matches EDD Example B', () => {
  const base = defaultInput('CA');
  const result = ca2026.calculate({ input: { ...base, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { caAllowances: 2, caDeductionAllowances: 1 }, compensation: { type: 'hourly', hourlyRate: 20, regularHours: 80 } }, grossPay: 1600, stateTaxableWages: 1600, localTaxableWages: 1600, ytdGrossWages: 0, ytdStateWages: 0, ytdPayrollContributions: {} });
  assert.equal(result.incomeTaxWithholding, 2.38);
});

test('California 2026 SDI is 1.3% without a wage cap', () => {
  const base = defaultInput('CA');
  const result = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 500000 } });
  assert.equal(result.state.payrollDeductions[0].amount, Math.round(result.grossPay * .013 * 100) / 100);
});

test('Texas and Florida have zero state withholding', () => {
  for (const state of ['TX', 'FL']) assert.equal(calculatePaycheck(defaultInput(state)).state.incomeTaxWithholding, 0);
});

test('Washington shows both statewide contributions', () => {
  const result = calculatePaycheck(defaultInput('WA'));
  assert.deepEqual(result.state.payrollDeductions.map(line => line.id), ['wa-paid-leave', 'wa-cares']);
});

test('Washington Paid Leave stops at the annual wage base', () => {
  const base = defaultInput('WA');
  const result = calculatePaycheck({ ...base, ytd: { grossWages: 184500 } });
  assert.equal(result.state.payrollDeductions[0].amount, 0);
  assert.ok(result.state.payrollDeductions[1].amount > 0);
});

test('WA Cares exemption suppresses the contribution', () => {
  const base = defaultInput('WA');
  const result = calculatePaycheck({ ...base, stateOptions: { waCaresExempt: true } });
  assert.equal(result.state.payrollDeductions[1].amount, 0);
});

test('New York PFL has a $411.91 annual cap', () => {
  const base = defaultInput('NY');
  const result = calculatePaycheck({ ...base, ytd: { grossWages: 95000, payrollContributions: { 'ny-pfl': 410 } } });
  assert.equal(result.state.payrollDeductions[0].amount, 1.91);
});

test('New York PFL can be excluded for employment that is not covered', () => {
  const base = defaultInput('NY');
  const result = calculatePaycheck({ ...base, stateOptions: { nyPflNotCovered: true } });
  assert.equal(result.state.payrollDeductions[0].amount, 0);
});

test('New York 2026 monthly Method II matches NYS-50-T-NYS Example 3', () => {
  const base = defaultInput('NY');
  const result = calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'hourly', hourlyRate: 500, regularHours: 100 }, stateOptions: { nyAllowances: 3 } });
  assert.equal(result.state.incomeTaxWithholding, 3576.63);
});

test('New York City adds local withholding', () => {
  const base = defaultInput('NY');
  const result = calculatePaycheck({ ...base, location: { state: 'NY', city: 'New York City' } });
  assert.ok(result.local.withholding > 0);
  assert.equal(result.local.supported, true);
});

test('Yonkers adds local withholding', () => {
  const base = defaultInput('NY');
  assert.ok(calculatePaycheck({ ...base, location: { state: 'NY', city: 'Yonkers' } }).local.withholding > 0);
});

test('unsupported New York locality is disclosed', () => {
  const base = defaultInput('NY');
  const result = calculatePaycheck({ ...base, location: { state: 'NY', city: 'Other' } });
  assert.equal(result.local.supported, false);
  assert.ok(result.assumptions.some(item => item.includes('Local income taxes')));
});

test('Alaska employee unemployment contribution stops at $54,200', () => {
  const base = defaultInput('AK');
  const result = calculatePaycheck({ ...base, ytd: { grossWages: 54000 } });
  assert.equal(result.state.payrollDeductions[0].amount, 1);
});

test('verified no-income-tax states still include federal withholding', () => {
  for (const state of ['NV', 'SD', 'TN', 'NH', 'WY']) {
    const result = calculatePaycheck(defaultInput(state));
    assert.equal(result.state.incomeTaxWithholding, 0);
    assert.ok(result.federal.incomeTaxWithholding > 0);
  }
});

test('Pennsylvania withholds 3.07% income tax and 0.07% employee UC', () => {
  const base = defaultInput('PA');
  const result = calculatePaycheck({ ...base, compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 }, ytd: { grossWages: 0 } });
  assert.equal(result.state.incomeTaxWithholding, 30.70);
  assert.equal(result.state.payrollDeductions[0].amount, .70);
  assert.equal(result.local.supported, false);
});

test('Pennsylvania 401(k) deferrals remain subject to state withholding', () => {
  const base = defaultInput('PA');
  const result = calculatePaycheck({ ...base, compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 }, deductions: [{ id: 'k', label: '401(k)', kind: '401k', timing: 'pre_tax', unit: 'dollars', amount: 100 }] });
  assert.equal(result.state.incomeTaxWithholding, 30.70);
  assert.equal(result.federal.socialSecurity, 62);
});

test('Illinois 2026 IL-700-T formula applies both IL-W-4 allowance lines', () => {
  const base = defaultInput('IL');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 10, regularHours: 30 }, stateOptions: { ilLine1Allowances: 2, ilLine2Allowances: 1 } });
  assert.equal(result.state.incomeTaxWithholding, 8.33);
});

test('Illinois withholding cannot fall below zero after allowances', () => {
  const base = defaultInput('IL');
  const result = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 1000 }, stateOptions: { ilLine1Allowances: 1 } });
  assert.equal(result.state.incomeTaxWithholding, 0);
});

test('Indiana 2026 Departmental Notice #1 example gives $13.96 state withholding', () => {
  const base = defaultInput('IN');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 20, regularHours: 40 }, stateOptions: { inPersonalExemptions: 5, inDependentExemptions: 3, inFirstTimeDependentExemptions: 1, inAdoptedExemptions: 2 } });
  assert.equal(result.state.incomeTaxWithholding, 13.96);
  assert.equal(result.local.supported, false);
});
