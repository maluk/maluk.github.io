'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { FilingStatus, PayFrequency } from '../calculator/types.ts';
import { calculatePaycheck } from '../calculator/index.ts';
import { currency } from '../site/format.ts';
import { CURRENT_YEAR } from '../site/states.ts';
import { DEFAULT_ACCENT, filingStatuses, fullCalculatorUrl, makeWidgetInput, parseConfig, payFrequencies, widgetStates } from '../widget/config.ts';
import { createWidgetAnalytics, parentInitOrigin, sendWidgetEvent } from '../widget/analytics.ts';

export function PaycheckWidget() {
  const [state, setState] = useState('CA');
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [salary, setSalary] = useState('100000');
  const [status, setStatus] = useState<FilingStatus>('single');
  const [frequency, setFrequency] = useState<PayFrequency>('biweekly');
  const root = useRef<HTMLElement>(null);
  const analyticsRef = useRef<ReturnType<typeof createWidgetAnalytics> | null>(null);
  const salaryId = useId();
  useEffect(() => {
    const config = parseConfig(new URLSearchParams(window.location.search));
    setState(config.state);
    setAccent(config.accent);
  }, []);

  useEffect(() => {
    if (window.parent === window) return;
    const websiteId = process.env.NEXT_PUBLIC_WIDGET_UMAMI_WEBSITE_ID;
    const analytics = createWidgetAnalytics({ websiteId, production: process.env.NODE_ENV === 'production', embedded: true, pageUrl: window.location.href, referrer: document.referrer, doNotTrack: navigator.doNotTrack, send: (event, attribution) => sendWidgetEvent(websiteId ?? '', event, attribution) });
    analyticsRef.current = analytics;
    let parentOrigin: string | undefined;
    let lastHeight = 0;
    const report = () => {
      if (!parentOrigin || !root.current) return;
      const height = Math.ceil(root.current.getBoundingClientRect().height);
      if (height === lastHeight) return;
      lastHeight = height;
      window.parent.postMessage({ type: 'thetax:resize:v1', height }, parentOrigin);
    };
    const initialize = (event: MessageEvent) => {
      const origin = parentInitOrigin(event, window.parent);
      if (!origin) return;
      parentOrigin = origin;
      analytics.parentOrigin(origin);
      lastHeight = 0;
      report();
    };
    window.addEventListener('message', initialize);
    const observer = new ResizeObserver(report);
    if (root.current) observer.observe(root.current);
    return () => { analytics.dispose(); analyticsRef.current = null; window.removeEventListener('message', initialize); observer.disconnect(); };
  }, []);

  const calculated = useMemo(() => {
    try {
      const input = makeWidgetInput(state, salary, status, frequency);
      return { input, result: calculatePaycheck(input), error: '' };
    } catch (error) { return { error: error instanceof Error ? error.message : 'Calculation unavailable.' }; }
  }, [state, salary, status, frequency]);
  const { input, result, error } = calculated;
  const stateName = widgetStates.find(page => page.code === state)?.name ?? state;
  const rows = result ? [
    { label: 'Gross pay', amount: result.grossPay },
    { label: 'Federal withholding', amount: -result.federal.incomeTaxWithholding },
    { label: 'Social Security & Medicare', amount: -(result.federal.socialSecurity + result.federal.medicare + result.federal.additionalMedicare) },
    { label: `${stateName} withholding`, amount: -result.state.incomeTaxWithholding },
    ...result.state.payrollDeductions.map(item => ({ label: item.label, amount: -item.amount })),
  ] : [];

  return <main ref={root} className="paycheck-widget" style={{ '--widget-accent': `#${accent}` } as CSSProperties}>
    <div className="widget-heading"><p className="eyebrow">{CURRENT_YEAR} paycheck estimate</p><h1>What’s your take-home pay?</h1><p>A quick look at what lands in your bank account.</p></div>
    <div className="widget-fields" onChangeCapture={() => analyticsRef.current?.interact()}>
      <label className="field" htmlFor={salaryId}><span>Annual salary</span><span className="input-wrap"><span>$</span><input id={salaryId} type="number" min="0" step="0.01" inputMode="decimal" value={salary} aria-invalid={!!error} aria-describedby={error ? `${salaryId}-error` : undefined} onChange={event => setSalary(event.target.value)} /></span></label>
      <label className="field"><span>State</span><select value={state} onChange={event => setState(event.target.value)}>{widgetStates.map(page => <option key={page.code} value={page.code}>{page.name}</option>)}</select></label>
      <label className="field"><span>Filing status</span><select value={status} onChange={event => setStatus(event.target.value as FilingStatus)}>{Object.entries(filingStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="field"><span>Pay frequency</span><select value={frequency} onChange={event => setFrequency(event.target.value as PayFrequency)}>{Object.entries(payFrequencies).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {error && <p id={`${salaryId}-error`} className="error" role="alert">{error}</p>}
    <section className="widget-result" aria-label="Estimated paycheck">
      <div role="status" aria-live="polite" aria-atomic="true"><p>Estimated take-home · {payFrequencies[frequency].toLowerCase()}</p><strong className="widget-net">{result ? currency(result.netPay) : '—'}</strong></div>
      {result && input && <>
        <dl className="widget-breakdown">{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{currency(row.amount || 0)}</dd></div>)}</dl>
        {!result.local.supported && <p className="local-notice">Local income taxes are not included in this estimate.</p>}
        <p className="widget-assumption">One job, default withholding settings, no benefits deductions. Pay date: {input.payDate}; YTD wages are projected.</p>
        <details className="assumptions"><summary>Assumptions and sources</summary><ul>{result.assumptions.map(item => <li key={item}>{item}</li>)}</ul><p>Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(0)}</p><ul>{result.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> — {source.authority}</li>)}</ul></details>
        <a className="widget-cta" href={fullCalculatorUrl(input)} target="_blank" rel="noopener noreferrer" onClick={() => analyticsRef.current?.click()}>Customize in the full calculator <span aria-hidden="true">↗</span></a>
      </>}
    </section>
    <footer className="widget-footer"><a href="https://thetax.us/" target="_blank" rel="noopener noreferrer">Powered by <strong>TheTax.us</strong></a><p>Estimated paycheck — not tax advice.</p></footer>
  </main>;
}
