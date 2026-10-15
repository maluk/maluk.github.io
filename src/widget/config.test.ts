import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePaycheck } from '../calculator/index.ts';
import { defaultInput } from '../site/defaultInput.ts';
import { CURRENT_YEAR } from '../site/states.ts';
import { applyHandoff, DEFAULT_ACCENT, embedSnippets, filingStatuses, fullCalculatorUrl, makeWidgetInput, parseConfig, parseHandoff, payFrequencies, widgetStates } from './config.ts';
import type { FilingStatus, PayFrequency } from '../calculator/types.ts';

test('publisher configuration only permits verified states and hex accents', () => {
  assert.deepEqual(parseConfig(new URLSearchParams()), { state: 'CA', accent: DEFAULT_ACCENT });
  assert.deepEqual(parseConfig(new URLSearchParams({ state: 'TX', accent: 'AABB00' })), { state: 'TX', accent: 'aabb00' });
  for (const state of ['DC', 'ZZ', 'ca', '<script>']) assert.equal(parseConfig(new URLSearchParams({ state })).state, 'CA');
  for (const accent of ['#ffffff', 'red', 'abc', 'ffffff;background:red', '"><script>']) assert.equal(parseConfig(new URLSearchParams({ accent })).accent, DEFAULT_ACCENT);
});

test('widget inputs and results match main defaults across all verified states and settings', () => {
  for (const { code } of widgetStates) {
    for (const salary of ['50000', '100000', '250000']) {
      for (const status of Object.keys(filingStatuses) as FilingStatus[]) {
        for (const frequency of Object.keys(payFrequencies) as PayFrequency[]) {
          const main = defaultInput(code);
          main.compensation = { type: 'salary', annualSalary: Number(salary) };
          main.federal.filingStatus = status;
          main.payFrequency = frequency;
          const widget = makeWidgetInput(code, salary, status, frequency);
          assert.deepEqual(widget, main);
          assert.deepEqual(calculatePaycheck(widget), calculatePaycheck(main));
        }
      }
    }
  }
});

test('invalid salaries fail closed, with zero and decimal salaries allowed', () => {
  for (const salary of ['', ' ', '-1', 'NaN', 'Infinity', 'abc', '1e999']) assert.throws(() => makeWidgetInput('CA', salary, 'single', 'biweekly'));
  assert.equal(calculatePaycheck(makeWidgetInput('CA', '0', 'single', 'biweekly')).netPay, 0);
  assert.equal(makeWidgetInput('TX', '72000.50', 'single', 'monthly').compensation.type, 'salary');
});

test('handoff round trip preserves inputs and keeps salary out of URL query', () => {
  const input = makeWidgetInput('NY', '123456.78', 'married_joint', 'monthly');
  const url = new URL(fullCalculatorUrl(input));
  assert.equal(url.pathname, '/new-york/');
  assert.equal(url.search, '');
  const handoff = parseHandoff(url.hash)!;
  assert.deepEqual(applyHandoff(defaultInput('NY'), handoff), input);
  assert.equal(applyHandoff(defaultInput('NY', 2025), handoff), undefined);
});

test('malformed and unsupported handoffs are ignored', () => {
  const valid = new URL(fullCalculatorUrl(defaultInput('CA'))).hash;
  for (const hash of ['', '#section', valid.replace('widget=1', 'widget=2'), valid.replace(`year=${CURRENT_YEAR}`, 'year=1900'), valid.replace('salary=100000', 'salary='), valid.replace('salary=100000', 'salary=-2'), valid.replace('salary=100000', 'salary=Infinity'), valid.replace('status=single', 'status=__proto__'), valid.replace('frequency=biweekly', 'frequency=daily')]) assert.equal(parseHandoff(hash), undefined);
});

test('both snippets include attribution and escape configuration', () => {
  const snippets = embedSnippets('NY', 'abcdef');
  assert.ok(snippets.script.includes('data-state="NY" data-accent="abcdef"'));
  assert.ok(snippets.iframe.includes('state=NY&amp;accent=abcdef'));
  assert.ok(snippets.iframe.includes('height="900"'));
  assert.ok(snippets.iframe.includes('referrerpolicy="origin"'));
  for (const code of Object.values(snippets)) assert.ok(code.includes('Paycheck calculator powered by TheTax.us'));
  for (const code of Object.values(embedSnippets('"><script>', '"><script>'))) assert.ok(!code.includes('"><script>'));
});
