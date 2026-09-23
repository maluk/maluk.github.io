import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaycheck } from './index.ts';
import { defaultInput } from '../site/defaultInput.ts';
import { ca2026 } from './states/CA/2026.ts';
import { ca2025 } from './states/CA/2025.ts';
import { al2026 } from './states/AL/2026.ts';
import { nj2026 } from './states/NJ/2026.ts';
import { wi2026 } from './states/WI/2026.ts';

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

test('Michigan Form 446 direct percentage method applies MI-W4 exemptions', () => {
  const base = defaultInput('MI');
  const weekly = { ...base, payFrequency: 'weekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 25, regularHours: 40 } };
  assert.equal(calculatePaycheck(weekly).state.incomeTaxWithholding, 42.50);
  const exempted = calculatePaycheck({ ...weekly, stateOptions: { miExemptions: 2 } });
  assert.equal(exempted.state.incomeTaxWithholding, 32.86);
  assert.equal(exempted.local.supported, false);
});

test('Michigan MI-W4 exemptions require whole numbers', () => {
  const base = defaultInput('MI');
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { miExemptions: 1.5 } }), /whole number/);
});

test('North Carolina NC-30 official weekly percentage example with two allowances gives $4', () => {
  const base = defaultInput('NC');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 15, regularHours: 30 }, stateOptions: { ncAllowances: 2 } });
  assert.equal(result.state.incomeTaxWithholding, 4);
});

test('North Carolina head of household deduction and zero-pay boundary', () => {
  const base = defaultInput('NC');
  const single = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 50000 } });
  const head = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 50000 }, federal: { ...base.federal, filingStatus: 'head_of_household' } });
  assert.ok(head.state.incomeTaxWithholding < single.state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
});

test('Georgia 2026 guide example: $2,000 semimonthly, married, one child gives $27.03', () => {
  const base = defaultInput('GA');
  const result = calculatePaycheck({ ...base, payFrequency: 'semimonthly', compensation: { type: 'hourly', hourlyRate: 20, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { gaDependents: 1 } });
  assert.equal(result.state.incomeTaxWithholding, 27.03);
});

test('Georgia uses the prior withholding schedule before May 11, 2026', () => {
  const base = defaultInput('GA');
  const pay = { ...base, payFrequency: 'semimonthly' as const, compensation: { type: 'hourly' as const, hourlyRate: 20, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' as const }, stateOptions: { gaDependents: 1 } };
  const before = calculatePaycheck({ ...pay, payDate: '2026-05-10' });
  const after = calculatePaycheck({ ...pay, payDate: '2026-05-11' });
  assert.equal(before.state.incomeTaxWithholding, 43.25);
  assert.equal(after.state.incomeTaxWithholding, 27.03);
});

test('Arizona A-4 default and elected rates apply to taxable paycheck wages', () => {
  const base = defaultInput('AZ');
  const pay = { ...base, compensation: { type: 'hourly' as const, hourlyRate: 25, regularHours: 40 } };
  assert.equal(calculatePaycheck(pay).state.incomeTaxWithholding, 20);
  assert.equal(calculatePaycheck({ ...pay, stateOptions: { azWithholdingRate: .035, azExtraWithholding: 10 } }).state.incomeTaxWithholding, 45);
  assert.equal(calculatePaycheck({ ...pay, stateOptions: { azWithholdingRate: 0 } }).state.incomeTaxWithholding, 0);
});

test('Arizona rejects percentages outside Form A-4 elections', () => {
  const base = defaultInput('AZ');
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { azWithholdingRate: .04 } }), /Arizona A-4/);
});

test('Ohio 2026 August percentage table gives $101.07 at the biweekly $100,000 salary', () => {
  const result = calculatePaycheck(defaultInput('OH'));
  assert.equal(result.state.incomeTaxWithholding, 101.07);
  assert.equal(result.local.supported, false);
});

test('Ohio switches withholding formula at August 1 and applies exemption dollars', () => {
  const base = defaultInput('OH');
  const before = calculatePaycheck({ ...base, payDate: '2026-07-31' });
  const after = calculatePaycheck({ ...base, payDate: '2026-08-01' });
  assert.equal(before.state.incomeTaxWithholding, 102.83);
  assert.equal(after.state.incomeTaxWithholding, 101.07);
  const exempted = calculatePaycheck({ ...base, stateOptions: { ohExemptions: 1 } });
  assert.ok(exempted.state.incomeTaxWithholding < after.state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { ohExemptions: 1.5 } }), /whole number/);
});

test('Ohio computer formula stays nonnegative at zero wages', () => {
  const base = defaultInput('OH');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
});

test('Virginia employer table example with five VA-4 exemptions gives $109.50', () => {
  const base = defaultInput('VA');
  const result = calculatePaycheck({ ...base, payFrequency: 'semimonthly', compensation: { type: 'hourly', hourlyRate: 26.49, regularHours: 100 }, stateOptions: { vaPersonalExemptions: 5 } });
  assert.equal(result.state.incomeTaxWithholding, 109.50);
});

test('Virginia bracket thresholds and zero wage remain nonnegative', () => {
  const base = defaultInput('VA');
  const pay = (annualSalary: number) => calculatePaycheck({ ...base, compensation: { type: 'salary' as const, annualSalary } }).state.incomeTaxWithholding;
  assert.equal(pay(0), 0);
  assert.equal(pay(8750 + 3000), 2.31);
  assert.equal(pay(8750 + 5000), 4.62);
  assert.equal(pay(8750 + 17000), 27.69);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { vaPersonalExemptions: -1 } }), /whole numbers/);
});

test('Massachusetts Circular M percentage method deducts current FICA up to its $2,000 annual limit', () => {
  const base = defaultInput('MA');
  const weekly = { ...base, payFrequency: 'weekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 25, regularHours: 40 } };
  const first = calculatePaycheck({ ...weekly, payDate: '2026-01-02', ytd: { grossWages: 0, socialSecurityWages: 0, medicareWages: 0 } });
  assert.equal(first.state.incomeTaxWithholding, 46.18);
  const later = calculatePaycheck({ ...weekly, ytd: { grossWages: 30000, socialSecurityWages: 30000, medicareWages: 30000 } });
  assert.equal(later.state.incomeTaxWithholding, 50);
});

test('Massachusetts PFML stops at the 2026 Social Security wage cap', () => {
  const base = defaultInput('MA');
  const crossing = calculatePaycheck({ ...base, ytd: { grossWages: 184400 } });
  assert.equal(crossing.state.payrollDeductions[0].amount, .46);
  const capped = calculatePaycheck({ ...base, ytd: { grossWages: 184500 } });
  assert.equal(capped.state.payrollDeductions[0].amount, 0);
  assert.equal(calculatePaycheck({ ...base, stateOptions: { maPflNotCovered: true } }).state.payrollDeductions[0].amount, 0);
});

test('Massachusetts surtax and M-4 exemptions change withholding at their boundaries', () => {
  const base = defaultInput('MA');
  const annual = (salary: number) => calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'salary', annualSalary: salary }, ytd: { grossWages: 200000, socialSecurityWages: 200000, medicareWages: 200000 } }).state.incomeTaxWithholding;
  assert.equal(annual(1107750), 4615.63);
  assert.equal(annual(1108950), 4624.63);
  assert.ok(calculatePaycheck({ ...base, stateOptions: { maExemptions: 2 } }).state.incomeTaxWithholding < calculatePaycheck(base).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { maExemptions: 1.5 } }), /whole numbers/);
});

test('Colorado DR 1098 applies the 2026 allowance and 4.4% rate', () => {
  const base = defaultInput('CO');
  const result = calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'salary', annualSalary: 65000 }, ytd: { grossWages: 0 } });
  assert.equal(result.state.incomeTaxWithholding, 218.17);
  const joint = calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'salary', annualSalary: 65000 }, federal: { ...base.federal, filingStatus: 'married_joint' }, ytd: { grossWages: 0 } });
  assert.equal(joint.state.incomeTaxWithholding, 198);
  assert.equal(result.local.supported, false);
});

test('Colorado FAMLI stops at wage cap and DR 0004 allowance can zero withholding', () => {
  const base = defaultInput('CO');
  const crossing = calculatePaycheck({ ...base, ytd: { grossWages: 184400 } });
  assert.equal(crossing.state.payrollDeductions[0].amount, .44);
  const capped = calculatePaycheck({ ...base, ytd: { grossWages: 184500 } });
  assert.equal(capped.state.payrollDeductions[0].amount, 0);
  const exempt = calculatePaycheck({ ...base, stateOptions: { coAnnualAllowance: 100000 } });
  assert.equal(exempt.state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { coAnnualAllowance: -1 } }), /nonnegative/);
});

test('Kentucky 2026 official monthly computer-formula example gives $104.65', () => {
  const base = defaultInput('KY');
  const result = calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'hourly', hourlyRate: 32.70, regularHours: 100 } });
  assert.equal(result.state.incomeTaxWithholding, 104.65);
  assert.equal(result.local.supported, false);
});

test('Kentucky standard deduction boundary produces no negative withholding', () => {
  const base = defaultInput('KY');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 3360 } }).state.incomeTaxWithholding, 0);
  assert.ok(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 1000000 } }).state.incomeTaxWithholding > 0);
});

test('Utah Publication 14 weekly single example gives $12 withholding', () => {
  const base = defaultInput('UT');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 10, regularHours: 40 } });
  assert.equal(result.state.incomeTaxWithholding, 12);
});

test('Utah Publication 14 biweekly single and semimonthly married examples', () => {
  const base = defaultInput('UT');
  const biweekly = calculatePaycheck({ ...base, payFrequency: 'biweekly', compensation: { type: 'hourly', hourlyRate: 26, regularHours: 100 } });
  assert.equal(biweekly.state.incomeTaxWithholding, 116);
  const semimonthly = calculatePaycheck({ ...base, payFrequency: 'semimonthly', compensation: { type: 'hourly', hourlyRate: 12, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' } });
  assert.equal(semimonthly.state.incomeTaxWithholding, 18);
});

test('Utah has zero withholding at zero wages', () => {
  const base = defaultInput('UT');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
});

test('Missouri 2026 official annual formula example gives $59 monthly', () => {
  const base = defaultInput('MO');
  const result = calculatePaycheck({ ...base, payFrequency: 'monthly', compensation: { type: 'salary', annualSalary: 35000 }, federal: { ...base.federal, filingStatus: 'married_joint' } });
  assert.equal(result.state.incomeTaxWithholding, 59);
  assert.equal(result.local.supported, false);
});

test('Missouri MO W-4 spouse checkbox and deduction boundary change withholding', () => {
  const base = defaultInput('MO');
  const joint = { ...base, federal: { ...base.federal, filingStatus: 'married_joint' as const } };
  const working = calculatePaycheck(joint);
  const notWorking = calculatePaycheck({ ...joint, stateOptions: { moSpouseDoesNotWork: true } });
  assert.ok(notWorking.state.incomeTaxWithholding < working.state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 16100 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { moSpouseDoesNotWork: 1 } }), /checkbox/);
});

test('Iowa 2026 IA W-4 official examples match all three biweekly filing groups', () => {
  const base = defaultInput('IA');
  const pay = { ...base, payFrequency: 'biweekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 21, regularHours: 100 } };
  assert.equal(calculatePaycheck({ ...pay, stateOptions: { iaAnnualAllowance: 40 } }).state.incomeTaxWithholding, 59.26);
  assert.equal(calculatePaycheck({ ...pay, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { iaAnnualAllowance: 80 } }).state.incomeTaxWithholding, 38.72);
  assert.equal(calculatePaycheck({ ...pay, federal: { ...base.federal, filingStatus: 'head_of_household' }, stateOptions: { iaAnnualAllowance: 160 } }).state.incomeTaxWithholding, 45.15);
});

test('Iowa spouse income, zero pay, and invalid allowance boundaries', () => {
  const base = defaultInput('IA');
  const joint = { ...base, federal: { ...base.federal, filingStatus: 'married_joint' as const } };
  assert.ok(calculatePaycheck({ ...joint, stateOptions: { iaSpouseEarnedIncome: true } }).state.incomeTaxWithholding > calculatePaycheck(joint).state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { iaAnnualAllowance: -1 } }), /nonnegative/);
});

test('Mississippi 2026 computer flowchart gives $31 for a $1,000 weekly single paycheck with no certificate', () => {
  const base = defaultInput('MS');
  const pay = { ...base, payFrequency: 'weekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 25, regularHours: 40 } };
  assert.equal(calculatePaycheck(pay).state.incomeTaxWithholding, 31);
  assert.equal(calculatePaycheck({ ...pay, stateOptions: { msExemptionAmount: 6000 } }).state.incomeTaxWithholding, 26);
});

test('Mississippi zero-tax threshold and one-spouse-employed deduction', () => {
  const base = defaultInput('MS');
  const salary = (annualSalary: number) => calculatePaycheck({ ...base, compensation: { type: 'salary' as const, annualSalary } }).state.incomeTaxWithholding;
  assert.equal(salary(0), 0);
  assert.equal(salary(12300), 0);
  assert.equal(salary(12326), 0);
  assert.equal(salary(100000), 135);
  const joint = { ...base, federal: { ...base.federal, filingStatus: 'married_joint' as const } };
  assert.ok(calculatePaycheck({ ...joint, stateOptions: { msOneSpouseEmployed: true } }).state.incomeTaxWithholding < calculatePaycheck(joint).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { msExemptionAmount: -1 } }), /nonnegative/);
});

test('South Carolina WH-1603F official example gives $10.58 weekly with three allowances', () => {
  const base = defaultInput('SC');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 18.75, regularHours: 40 }, stateOptions: { scAllowances: 3 } });
  assert.equal(result.state.incomeTaxWithholding, 10.58);
});

test('South Carolina brackets and allowance deduction have distinct zero boundaries', () => {
  const base = defaultInput('SC');
  const salary = (annualSalary: number) => calculatePaycheck({ ...base, compensation: { type: 'salary' as const, annualSalary } }).state.incomeTaxWithholding;
  assert.equal(salary(0), 0);
  assert.equal(salary(3640), 0);
  assert.equal(salary(18230), 16.83);
  assert.ok(calculatePaycheck({ ...base, stateOptions: { scAllowances: 1 } }).state.incomeTaxWithholding < calculatePaycheck(base).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { scAllowances: 1.5 } }), /whole numbers/);
});

test('Alabama official A-4 M-2 example gives $29.59 with $35.19 federal withholding', () => {
  const base = defaultInput('AL');
  const result = al2026.calculate({
    input: { ...base, payFrequency: 'weekly', federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { alDependents: 2 } },
    grossPay: 850, stateTaxableWages: 850, localTaxableWages: 850, ytdGrossWages: 0, ytdStateWages: 0,
    ytdPayrollContributions: {}, federalIncomeTaxWithholding: 35.19,
  });
  assert.equal(result.incomeTaxWithholding, 29.59);
});

test('Alabama state withholding responds to federal withholding and dependent thresholds', () => {
  const base = defaultInput('AL');
  const ordinary = calculatePaycheck(base);
  const zero = calculatePaycheck({ ...base, stateOptions: { alZeroExemption: true } });
  assert.ok(zero.state.incomeTaxWithholding > ordinary.state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.equal(ordinary.local.supported, false);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { alDependents: 1.5 } }), /whole number/);
});

test('Kansas KW-100 official Esmeralda example gives $41.44 semimonthly', () => {
  const base = defaultInput('KS');
  const result = calculatePaycheck({ ...base, payFrequency: 'semimonthly', compensation: { type: 'hourly', hourlyRate: 20, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { ksDependents: 1 } });
  assert.equal(result.state.incomeTaxWithholding, 41.44);
});

test('Kansas no-certificate rule, W-4 exemption, and bracket boundaries', () => {
  const base = defaultInput('KS');
  const noK4 = calculatePaycheck({ ...base, stateOptions: { ksNoCertificate: true } });
  assert.ok(noK4.state.incomeTaxWithholding > calculatePaycheck(base).state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, federal: { ...base.federal, exempt: true } }).state.incomeTaxWithholding, 0);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { ksDependents: -1 } }), /whole number/);
});

test('West Virginia 2026 percentage tables use the standard two-earner schedule and optional one-earner schedule', () => {
  const base = defaultInput('WV');
  const pay = { ...base, payFrequency: 'weekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 25, regularHours: 40 }, stateOptions: { wvExemptions: 2 } };
  assert.equal(calculatePaycheck(pay).state.incomeTaxWithholding, 31);
  assert.equal(calculatePaycheck({ ...pay, stateOptions: { wvExemptions: 2, wvOneEarner: true } }).state.incomeTaxWithholding, 28);
});

test('West Virginia zero wages and IT-104 eligibility boundaries', () => {
  const base = defaultInput('WV');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { wvExemptions: 1.5 } }), /whole number/);
  assert.throws(() => calculatePaycheck({ ...base, federal: { ...base.federal, multipleJobs: true }, stateOptions: { wvOneEarner: true } }), /multiple jobs/);
  assert.throws(() => calculatePaycheck({ ...base, payDate: '2026-06-11' }), /unavailable before June 12/);
});

test('New Jersey percentage table A and B give the published weekly $1,000 amounts', () => {
  const base = defaultInput('NJ');
  const common = { grossPay: 1000, stateTaxableWages: 1000, localTaxableWages: 1000, ytdGrossWages: 0, ytdStateWages: 0, ytdPayrollContributions: {} };
  const single = nj2026.calculate({ ...common, input: { ...base, payFrequency: 'weekly' } });
  const joint = nj2026.calculate({ ...common, input: { ...base, payFrequency: 'weekly', federal: { ...base.federal, filingStatus: 'married_joint' } } });
  assert.equal(single.incomeTaxWithholding, 29.38);
  assert.equal(joint.incomeTaxWithholding, 18.34);
  assert.deepEqual(single.payrollDeductions.map(item => item.amount), [3.83, .43, 1.9, 2.3]);
});

test('New Jersey UI and workforce contributions stop at $44,800; TDI and FLI stop at $171,100', () => {
  const base = defaultInput('NJ');
  const nearFirst = calculatePaycheck({ ...base, ytd: { grossWages: 44700 } });
  assert.equal(nearFirst.state.payrollDeductions[0].amount, .38);
  assert.equal(nearFirst.state.payrollDeductions[1].amount, .04);
  const second = calculatePaycheck({ ...base, ytd: { grossWages: 171050 } });
  assert.deepEqual(second.state.payrollDeductions.map(item => item.amount), [0, 0, .10, .12]);
  const past = calculatePaycheck({ ...base, ytd: { grossWages: 171100 } });
  assert.ok(past.state.payrollDeductions.every(item => item.amount === 0));
});

test('New Jersey 401(k) reduces state wages but salary reduction benefits do not', () => {
  const base = defaultInput('NJ');
  const contribution = (kind: '401k' | 'fsa' | 'health') => calculatePaycheck({ ...base, deductions: [{ id: kind, label: kind, kind, amount: 100, unit: 'dollars', timing: 'pre_tax' }] });
  const ordinary = calculatePaycheck(base).state.incomeTaxWithholding;
  assert.ok(contribution('401k').state.incomeTaxWithholding < ordinary);
  assert.equal(contribution('fsa').state.incomeTaxWithholding, ordinary);
  assert.equal(contribution('health').state.incomeTaxWithholding, ordinary);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { njRate: 'C' } }), /not yet supported/);
});

test('Wisconsin approved alternate method matches W-166 examples', () => {
  const base = defaultInput('WI');
  const inputFor = (wage: number, frequency: 'weekly' | 'biweekly', filingStatus: 'single' | 'married_joint', wiExemptions: number) => ({
    input: { ...base, payFrequency: frequency, federal: { ...base.federal, filingStatus }, stateOptions: { wiExemptions } },
    grossPay: wage, stateTaxableWages: wage, localTaxableWages: wage, ytdGrossWages: 0, ytdStateWages: 0, ytdPayrollContributions: {},
  });
  assert.equal(wi2026.calculate(inputFor(350, 'weekly', 'single', 1)).incomeTaxWithholding, 7.59);
  assert.equal(wi2026.calculate(inputFor(500, 'weekly', 'single', 3)).incomeTaxWithholding, 14.34);
  assert.equal(wi2026.calculate(inputFor(1000, 'biweekly', 'married_joint', 3)).incomeTaxWithholding, 22.08);
});

test('Wisconsin withholding supports WT-4 options and boundary wages', () => {
  const base = defaultInput('WI');
  const ordinary = calculatePaycheck(base);
  assert.ok(ordinary.state.incomeTaxWithholding > 0);
  assert.equal(calculatePaycheck({ ...base, stateOptions: { wiExempt: true } }).state.incomeTaxWithholding, 0);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.ok(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 500000 } }).state.incomeTaxWithholding > ordinary.state.incomeTaxWithholding);
  assert.equal(calculatePaycheck({ ...base, stateOptions: { wiExtraWithholding: 10 } }).state.incomeTaxWithholding, ordinary.state.incomeTaxWithholding + 10);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { wiExemptions: 1.5 } }), /whole numbers/);
});

test('Oklahoma OW-2 official semimonthly example rounds $36.67 to $37', () => {
  const base = defaultInput('OK');
  const result = calculatePaycheck({ ...base, payFrequency: 'semimonthly', compensation: { type: 'hourly', hourlyRate: 18.25, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { okAllowances: 2 } });
  assert.equal(result.state.incomeTaxWithholding, 37);
});

test('Oklahoma tables cover four periods, zero pay, and single-rate election', () => {
  const base = defaultInput('OK');
  for (const payFrequency of ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const) {
    const result = calculatePaycheck({ ...base, payFrequency });
    assert.ok(result.state.incomeTaxWithholding > 0);
  }
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  const married = { ...base, federal: { ...base.federal, filingStatus: 'married_joint' as const } };
  assert.ok(calculatePaycheck({ ...married, stateOptions: { okSingleRate: true } }).state.incomeTaxWithholding > calculatePaycheck(married).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { okAllowances: -1 } }), /whole numbers/);
});

test('North Dakota 2026 percentage table rounds $1,800 weekly wages to $13', () => {
  const base = defaultInput('ND');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 18, regularHours: 100 } });
  // The booklet's worked example says $14, but its Single percentage table yields
  // ($93,600 - $57,625) × 1.95% ÷ 52 = $13.49, rounded to $13.
  assert.equal(result.state.incomeTaxWithholding, 13);
});

test('North Dakota current-W-4 schedules cover thresholds and high income', () => {
  const base = defaultInput('ND');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 57625 } }).state.incomeTaxWithholding, 0);
  assert.ok(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 258450 } }).state.incomeTaxWithholding > 0);
  assert.ok(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 500000 } }).state.incomeTaxWithholding > 0);
  const ordinary = calculatePaycheck(base).state.incomeTaxWithholding;
  assert.equal(calculatePaycheck({ ...base, stateOptions: { ndExtraWithholding: 10 } }).state.incomeTaxWithholding, ordinary + 10);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { ndExtraWithholding: -1 } }), /nonnegative/);
});

test('Idaho revised 2026 percentage method matches state examples', () => {
  const base = defaultInput('ID');
  const single = calculatePaycheck({ ...base, payFrequency: 'biweekly', compensation: { type: 'hourly', hourlyRate: 12.12, regularHours: 100 } });
  assert.equal(single.state.incomeTaxWithholding, 31);
  const married = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 10, regularHours: 100 }, federal: { ...base.federal, filingStatus: 'married_joint' } });
  assert.equal(married.state.incomeTaxWithholding, 20);
});

test('Idaho revised table enforces its date and zero allowance value', () => {
  const base = defaultInput('ID');
  assert.equal(calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 10, regularHours: 31 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, payDate: '2026-06-01' }), /unavailable before July 31/);
});

test('Delaware approved annualized method matches its single and joint examples', () => {
  const base = defaultInput('DE');
  const single = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 25000 }, payFrequency: 'weekly', stateOptions: { deExemptions: 1 } });
  assert.equal(single.state.incomeTaxWithholding, 13.88);
  const joint = calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 25000 }, payFrequency: 'weekly', federal: { ...base.federal, filingStatus: 'married_joint' }, stateOptions: { deExemptions: 3 } });
  assert.equal(joint.state.incomeTaxWithholding, 6.52);
});

test('Delaware Paid Leave reflects employer size, share, and FICA wage cap', () => {
  const base = defaultInput('DE');
  const full = calculatePaycheck({ ...base, compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 } });
  assert.equal(full.state.payrollDeductions[0].amount, 4);
  const parental = calculatePaycheck({ ...base, compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 }, stateOptions: { deEmployerSize: 15 } });
  assert.equal(parental.state.payrollDeductions[0].amount, 1.60);
  assert.equal(calculatePaycheck({ ...base, stateOptions: { deEmployerSize: 9 } }).state.payrollDeductions[0].amount, 0);
  assert.equal(calculatePaycheck({ ...base, ytd: { grossWages: 184500 } }).state.payrollDeductions[0].amount, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { deEmployeeShare: .6 } }), /between zero and 50%/);
});

test('Rhode Island percentage method matches the official weekly exemption example', () => {
  const base = defaultInput('RI');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 21.95, regularHours: 100 }, stateOptions: { riExemptions: 1 } });
  assert.equal(result.state.incomeTaxWithholding, 87.57);
});

test('Rhode Island TDI cap and RI W-4 phaseout are separate', () => {
  const base = defaultInput('RI');
  const nearCap = calculatePaycheck({ ...base, ytd: { stateWages: 99900 } });
  assert.equal(nearCap.state.payrollDeductions[0].amount, 1.10);
  const pastCap = calculatePaycheck({ ...base, ytd: { stateWages: 100000 } });
  assert.equal(pastCap.state.payrollDeductions[0].amount, 0);
  const high = { ...base, compensation: { type: 'salary' as const, annualSalary: 300000 } };
  assert.equal(calculatePaycheck({ ...high, stateOptions: { riExemptions: 2 } }).state.incomeTaxWithholding, calculatePaycheck(high).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { riExemptions: 1.5 } }), /whole numbers/);
});

test('Louisiana R-1210 applies the 2026 single and joint deduction formulas', () => {
  const base = defaultInput('LA');
  const single = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 } });
  assert.equal(single.state.incomeTaxWithholding, 23.25);
  const joint = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 }, federal: { ...base.federal, filingStatus: 'married_joint' } });
  assert.equal(joint.state.incomeTaxWithholding, 15.60);
  assert.equal(calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 }, stateOptions: { laNoStandardDeduction: true } }).state.incomeTaxWithholding, 30.90);
});

test('Louisiana withholding clamps low wages and validates L-4 inputs', () => {
  const base = defaultInput('LA');
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { laExtraWithholding: -1 } }), /nonnegative/);
});

test('Nebraska 2026 percentage table matches a $1,000 weekly single calculation', () => {
  const base = defaultInput('NE');
  const result = calculatePaycheck({ ...base, payFrequency: 'weekly', compensation: { type: 'hourly', hourlyRate: 25, regularHours: 40 } });
  assert.equal(result.state.incomeTaxWithholding, 36.06);
});

test('Nebraska allowances and special withholding floor cover boundaries', () => {
  const base = defaultInput('NE');
  const wage = { ...base, payFrequency: 'weekly' as const, compensation: { type: 'hourly' as const, hourlyRate: 2, regularHours: 40 } };
  assert.ok(calculatePaycheck(wage).state.incomeTaxWithholding >= 0);
  assert.equal(calculatePaycheck({ ...base, compensation: { type: 'salary', annualSalary: 0 } }).state.incomeTaxWithholding, 0);
  assert.ok(calculatePaycheck({ ...base, stateOptions: { neAllowances: 1 } }).state.incomeTaxWithholding < calculatePaycheck(base).state.incomeTaxWithholding);
  assert.throws(() => calculatePaycheck({ ...base, stateOptions: { neAllowances: 1.5 } }), /whole numbers/);
});
