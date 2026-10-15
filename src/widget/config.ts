import type { FilingStatus, PayFrequency, PaycheckInput } from '../calculator/types.ts';
import { calculatePaycheck } from '../calculator/index.ts';
import { defaultInput } from '../site/defaultInput.ts';
import { CURRENT_YEAR, verifiedStatePages } from '../site/states.ts';

export const DEFAULT_ACCENT = '006b60';
export const filingStatuses: Record<FilingStatus, string> = { single: 'Single', married_joint: 'Married filing jointly', married_separate: 'Married filing separately', head_of_household: 'Head of household' };
export const payFrequencies: Record<PayFrequency, string> = { weekly: 'Weekly', biweekly: 'Biweekly', semimonthly: 'Semi-monthly', monthly: 'Monthly' };
export const widgetStates = [...verifiedStatePages].sort((a, b) => a.name.localeCompare(b.name, 'en'));

export function parseConfig(params: URLSearchParams) {
  const state = params.get('state') ?? 'CA';
  const accent = params.get('accent') ?? DEFAULT_ACCENT;
  return { state: widgetStates.some(item => item.code === state) ? state : 'CA', accent: /^[\da-f]{6}$/i.test(accent) ? accent.toLowerCase() : DEFAULT_ACCENT };
}

export function makeWidgetInput(state: string, salary: string, filingStatus: FilingStatus, frequency: PayFrequency): PaycheckInput {
  if (!salary.trim() || !Number.isFinite(Number(salary)) || Number(salary) < 0) throw new Error('Enter an annual salary of zero or more.');
  const input = defaultInput(state);
  return { ...input, compensation: { type: 'salary', annualSalary: Number(salary) }, federal: { ...input.federal, filingStatus }, payFrequency: frequency };
}

export function fullCalculatorUrl(input: PaycheckInput) {
  const page = widgetStates.find(page => page.code === input.location.state);
  if (!page || input.compensation.type !== 'salary') throw new Error('Unsupported widget input');
  const fragment = new URLSearchParams({ widget: '1', year: String(input.taxYear), salary: String(input.compensation.annualSalary), status: input.federal.filingStatus, frequency: input.payFrequency });
  return `https://thetax.us/${page.slug}/#${fragment}`;
}

export function parseHandoff(hash: string): { salary: number; status: FilingStatus; frequency: PayFrequency } | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const salary = params.get('salary');
  const status = params.get('status') ?? '';
  const frequency = params.get('frequency') ?? '';
  if (params.get('widget') !== '1' || params.get('year') !== String(CURRENT_YEAR) || salary === null || !salary.trim() || !Number.isFinite(Number(salary)) || Number(salary) < 0 || !Object.hasOwn(filingStatuses, status) || !Object.hasOwn(payFrequencies, frequency)) return;
  return { salary: Number(salary), status: status as FilingStatus, frequency: frequency as PayFrequency };
}

export function applyHandoff(input: PaycheckInput, handoff: NonNullable<ReturnType<typeof parseHandoff>>) {
  if (input.taxYear !== CURRENT_YEAR) return;
  const next = makeWidgetInput(input.location.state, String(handoff.salary), handoff.status, handoff.frequency);
  try { calculatePaycheck(next); return next; } catch { return; }
}

// Keep all customized accents decorative; text and focus colors remain fixed.
export function embedPath(state: string, accent: string) {
  return `/embed/paycheck/?${new URLSearchParams(parseConfig(new URLSearchParams({ state, accent })))}`;
}

export function embedSnippets(state: string, accent: string) {
  const config = parseConfig(new URLSearchParams({ state, accent }));
  const fallback = '<p><a href="https://thetax.us/">Paycheck calculator powered by TheTax.us</a></p>';
  return {
    script: `<div data-thetax-widget data-state="${config.state}" data-accent="${config.accent}">\n  ${fallback}\n</div>\n<script async src="https://thetax.us/embed/v1.js"></script>`,
    iframe: `<iframe src="https://thetax.us${embedPath(config.state, config.accent).replaceAll('&', '&amp;')}" title="Estimated paycheck calculator — TheTax.us" width="100%" height="900" loading="lazy" referrerpolicy="origin" style="display:block;border:0;"></iframe>\n${fallback}`,
  };
}
