'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Deduction, DeductionTaxTreatment, PaycheckInput, PaycheckResult } from '../calculator/types.ts';
import { calculatePaycheck } from '../calculator/index.ts';
import { currency, wholeCurrency } from '../site/format.ts';
import { verifiedStatePages } from '../site/states.ts';
import { stateCalculators } from '../calculator/states/index.ts';

function track(event: string, data?: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void; umami?: { track: (name: string, data?: Record<string, string>) => void } };
  w.gtag?.('event', event, data);
  w.umami?.track(event, data);
}

const periodCount = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const statusLabels = { single: 'Single', married_joint: 'Married filing jointly', married_separate: 'Married filing separately', head_of_household: 'Head of household' };
const deductionLabels: Record<Deduction['kind'], string> = { '401k': 'Traditional 401(k)', hsa: 'HSA', fsa: 'FSA', health: 'Health insurance', dental: 'Dental', vision: 'Vision', custom: 'Custom deduction' };
const noReduction: DeductionTaxTreatment = { federalIncomeTax: false, socialSecurity: false, medicare: false, stateIncomeTax: false, localIncomeTax: false };

function InputField({ label, value, onChange, prefix = '$', step = '0.01' }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; step?: string }) {
  return <label className="field"><span>{label}</span><span className="input-wrap">{prefix && <span>{prefix}</span>}<input type="number" min="0" step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></span></label>;
}

function OptionalInputField({ label, value, onChange }: { label: string; value?: number; onChange: (value?: number) => void }) {
  return <label className="field"><span>{label}</span><span className="input-wrap"><span>$</span><input type="number" min="0" step="0.01" value={value ?? ''} placeholder="Projected" onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></span></label>;
}

function ResultLine({ label, amount, gross = false }: { label: string; amount: number; gross?: boolean }) {
  return <div className="result-line"><span>{label}</span><strong>{gross ? currency(amount) : `−${currency(amount)}`}</strong></div>;
}

export function Calculator({ initialInput, initialResult }: { initialInput: PaycheckInput; initialResult: PaycheckResult }) {
  useEffect(() => { track('calculator_view'); }, []);
  const availableStates = verifiedStatePages.filter(page => stateCalculators[initialInput.taxYear]?.[page.code]?.metadata.status === 'verified');
  const [input, setInput] = useState(initialInput);
  const [advanced, setAdvanced] = useState(false);
  const [newDeduction, setNewDeduction] = useState<Deduction['kind']>('401k');
  const started = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const calculated = useMemo(() => {
    try { return { result: calculatePaycheck(input), error: '' }; }
    catch (error) { return { result: initialResult, error: error instanceof Error ? error.message : 'Calculation unavailable' }; }
  }, [input, initialResult]);
  const { result, error } = calculated;
  const update = (next: PaycheckInput) => {
    if (!started.current) { track('calculator_started'); started.current = true; }
    setInput(next);
  };
  const updateFederal = (key: keyof PaycheckInput['federal'], value: string | number | boolean) => update({ ...input, federal: { ...input.federal, [key]: value } });
  const updateStateOption = (key: string, value: number | boolean) => update({ ...input, stateOptions: { ...input.stateOptions, [key]: value } });
  const setCompensation = (key: string, value: number) => update({ ...input, compensation: { ...input.compensation, [key]: value } as PaycheckInput['compensation'] });
  const addDeduction = () => {
    const kind = newDeduction;
    const deduction: Deduction = { id: `${kind}-${Date.now()}`, label: deductionLabels[kind], kind, amount: 0, unit: 'dollars', timing: 'pre_tax', ...(kind === 'custom' ? { treatment: noReduction } : {}) };
    update({ ...input, deductions: [...input.deductions, deduction] });
  };
  const updateDeduction = (id: string, change: Partial<Deduction>) => update({ ...input, deductions: input.deductions.map(deduction => deduction.id === id ? { ...deduction, ...change } : deduction) });
  const submit = () => { if (!error) { track('calculator_completed', { state: input.location.state, frequency: input.payFrequency }); resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const percent = result.grossPay > 0 ? Math.round(result.netPay / result.grossPay * 100) : 0;
  const deductions = result.deductions.filter(item => item.amount > 0);
  const rows = [
    { label: 'Federal withholding', amount: result.federal.incomeTaxWithholding },
    { label: 'Social Security', amount: result.federal.socialSecurity },
    { label: 'Medicare', amount: result.federal.medicare },
    { label: 'Additional Medicare', amount: result.federal.additionalMedicare },
    { label: `${verifiedStatePages.find(page => page.code === input.location.state)?.name ?? 'State'} withholding`, amount: result.state.incomeTaxWithholding },
    { label: input.location.city ? `${input.location.city} withholding` : 'Local withholding', amount: result.local.withholding },
  ].filter(row => row.amount > 0);

  return <div className="calculator-grid">
    <section className="calculator-card inputs-card" aria-label="Your pay">
      <div className="card-heading"><span className="step">01</span><div><p className="eyebrow">Your pay</p><h2>Tell us about your paycheck</h2></div></div>
      <div className="segmented"><button type="button" className={input.compensation.type === 'salary' ? 'active' : ''} onClick={() => { track('salary_hourly_switch', { to: 'salary' }); update({ ...input, compensation: { type: 'salary', annualSalary: 100000 } }); }}>Salary</button><button type="button" className={input.compensation.type === 'hourly' ? 'active' : ''} onClick={() => { track('salary_hourly_switch', { to: 'hourly' }); update({ ...input, compensation: { type: 'hourly', hourlyRate: 30, regularHours: 80, overtimeHours: 0, overtimeMultiplier: 1.5 } }); }}>Hourly</button></div>
      {input.compensation.type === 'salary' ? <InputField label="Annual salary" value={input.compensation.annualSalary} onChange={value => setCompensation('annualSalary', value)} /> : <><InputField label="Hourly rate" value={input.compensation.hourlyRate} onChange={value => setCompensation('hourlyRate', value)} /><InputField label="Regular hours per pay period" prefix="" value={input.compensation.regularHours} onChange={value => setCompensation('regularHours', value)} /></>}
      <div className="field-row"><label className="field"><span>Location</span><select value={input.location.state} onChange={event => { const state = event.target.value; track('state_changed', { state }); update({ ...input, location: { state } }); }}>{availableStates.map(page => <option key={page.code} value={page.code}>{page.name}</option>)}</select></label><label className="field"><span>Filing status</span><select value={input.federal.filingStatus} onChange={event => updateFederal('filingStatus', event.target.value)}>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div>
      <label className="field"><span>Pay frequency</span><select value={input.payFrequency} onChange={event => { track('pay_frequency_changed', { frequency: event.target.value }); update({ ...input, payFrequency: event.target.value as PaycheckInput['payFrequency'] }); }}><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semimonthly">Semi-monthly</option><option value="monthly">Monthly</option></select></label>
      <button className="advanced-toggle" type="button" aria-expanded={advanced} onClick={() => { if (!advanced) track('advanced_opened'); setAdvanced(!advanced); }}>Advanced options <span>{advanced ? '−' : '+'}</span></button>
      {advanced && <div className="advanced-panel">
        <h3>Federal W-4</h3><label className="checkbox"><input type="checkbox" checked={input.federal.multipleJobs} onChange={event => updateFederal('multipleJobs', event.target.checked)} />Step 2 multiple jobs checkbox</label>
        <div className="field-row"><InputField label="Dependent credits, annual" value={input.federal.dependentCredits} onChange={value => updateFederal('dependentCredits', value)} /><InputField label="Other income, annual" value={input.federal.otherIncome} onChange={value => updateFederal('otherIncome', value)} /></div>
        <div className="field-row"><InputField label="Other deductions, annual" value={input.federal.deductions} onChange={value => updateFederal('deductions', value)} /><InputField label="Extra withholding per paycheck" value={input.federal.extraWithholding} onChange={value => updateFederal('extraWithholding', value)} /></div>
        <label className="checkbox"><input type="checkbox" checked={input.federal.exempt} onChange={event => updateFederal('exempt', event.target.checked)} />Exempt from federal income tax withholding</label>
        {input.compensation.type === 'hourly' && <><h3>Hourly earnings</h3><div className="field-row"><InputField label="Overtime hours" prefix="" value={input.compensation.overtimeHours ?? 0} onChange={value => setCompensation('overtimeHours', value)} /><InputField label="Overtime multiplier" prefix="×" value={input.compensation.overtimeMultiplier ?? 1.5} onChange={value => setCompensation('overtimeMultiplier', value)} /></div></>}
        <h3>Pay date and year-to-date</h3><label className="field"><span>Pay date</span><input type="date" min={`${input.taxYear}-01-01`} max={`${input.taxYear}-12-31`} value={input.payDate} onChange={event => update({ ...input, payDate: event.target.value })} /></label><p className="help">Leave YTD blank to use a pay-date projection.</p><div className="field-row"><OptionalInputField label="YTD gross wages" value={input.ytd?.grossWages} onChange={value => update({ ...input, ytd: { ...input.ytd, grossWages: value } })} /><OptionalInputField label="YTD Social Security wages" value={input.ytd?.socialSecurityWages} onChange={value => update({ ...input, ytd: { ...input.ytd, socialSecurityWages: value } })} /></div><OptionalInputField label="YTD Medicare wages" value={input.ytd?.medicareWages} onChange={value => update({ ...input, ytd: { ...input.ytd, medicareWages: value } })} />
        <h3>Paycheck deductions</h3><div className="add-row"><select value={newDeduction} onChange={event => setNewDeduction(event.target.value as Deduction['kind'])}>{Object.entries(deductionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button type="button" onClick={addDeduction}>Add deduction</button></div>
        {input.deductions.map(deduction => <div className="deduction-row" key={deduction.id}><strong>{deduction.label}</strong><div className="field-row"><InputField label="Amount" prefix="" value={deduction.amount} onChange={value => updateDeduction(deduction.id, { amount: value })} /><label className="field"><span>Unit</span><select value={deduction.unit} onChange={event => updateDeduction(deduction.id, { unit: event.target.value as Deduction['unit'] })}><option value="dollars">$/paycheck</option><option value="percent">% of gross</option></select></label></div><label className="field"><span>Timing</span><select value={deduction.timing} onChange={event => updateDeduction(deduction.id, { timing: event.target.value as Deduction['timing'] })}><option value="pre_tax">Pre-tax</option><option value="post_tax">Post-tax</option></select></label>{deduction.kind === 'custom' && <div className="custom-taxes"><span>Reduces taxable wages for:</span>{Object.entries({ federalIncomeTax: 'Federal income tax', socialSecurity: 'Social Security', medicare: 'Medicare', stateIncomeTax: 'State income tax', localIncomeTax: 'Local income tax' }).map(([key, label]) => <label className="checkbox" key={key}><input type="checkbox" checked={!!deduction.treatment?.[key as keyof DeductionTaxTreatment]} onChange={event => updateDeduction(deduction.id, { treatment: { ...deduction.treatment!, [key]: event.target.checked } })} />{label}</label>)}</div>}<button type="button" className="text-button" onClick={() => update({ ...input, deductions: input.deductions.filter(item => item.id !== deduction.id) })}>Remove</button></div>)}
        {input.location.state === 'CA' && <><h3>California DE 4</h3><div className="field-row"><InputField label="Regular allowances" prefix="" step="1" value={Number(input.stateOptions?.caAllowances ?? 0)} onChange={value => updateStateOption('caAllowances', value)} /><InputField label="Estimated deduction allowances" prefix="" step="1" value={Number(input.stateOptions?.caDeductionAllowances ?? 0)} onChange={value => updateStateOption('caDeductionAllowances', value)} /></div><InputField label="Extra CA withholding" value={Number(input.stateOptions?.caExtraWithholding ?? 0)} onChange={value => updateStateOption('caExtraWithholding', value)} /></>}
        {input.location.state === 'IL' && <><h3>Illinois IL-W-4</h3><div className="field-row"><InputField label="Line 1 allowances" prefix="" step="1" value={Number(input.stateOptions?.ilLine1Allowances ?? 0)} onChange={value => updateStateOption('ilLine1Allowances', value)} /><InputField label="Line 2 allowances" prefix="" step="1" value={Number(input.stateOptions?.ilLine2Allowances ?? 0)} onChange={value => updateStateOption('ilLine2Allowances', value)} /></div><InputField label="Extra Illinois withholding" value={Number(input.stateOptions?.ilExtraWithholding ?? 0)} onChange={value => updateStateOption('ilExtraWithholding', value)} /></>}
        {input.location.state === 'IN' && <><h3>Indiana WH-4</h3><div className="field-row"><InputField label="Personal exemptions" prefix="" step="1" value={Number(input.stateOptions?.inPersonalExemptions ?? 0)} onChange={value => updateStateOption('inPersonalExemptions', value)} /><InputField label="Dependent exemptions" prefix="" step="1" value={Number(input.stateOptions?.inDependentExemptions ?? 0)} onChange={value => updateStateOption('inDependentExemptions', value)} /></div><div className="field-row"><InputField label="First-time dependent exemptions" prefix="" step="1" value={Number(input.stateOptions?.inFirstTimeDependentExemptions ?? 0)} onChange={value => updateStateOption('inFirstTimeDependentExemptions', value)} /><InputField label="Adopted child exemptions" prefix="" step="1" value={Number(input.stateOptions?.inAdoptedExemptions ?? 0)} onChange={value => updateStateOption('inAdoptedExemptions', value)} /></div><p className="help">Indiana county income tax is not included.</p></>}
        {input.location.state === 'NY' && <><h3>New York IT-2104</h3><div className="field-row"><InputField label="Allowances" prefix="" step="1" value={Number(input.stateOptions?.nyAllowances ?? 0)} onChange={value => updateStateOption('nyAllowances', value)} /><InputField label="Extra NY withholding" value={Number(input.stateOptions?.nyExtraWithholding ?? 0)} onChange={value => updateStateOption('nyExtraWithholding', value)} /></div><label className="field"><span>City</span><select value={input.location.city ?? ''} onChange={event => update({ ...input, location: { ...input.location, city: event.target.value || undefined } })}><option value="">Outside NYC and Yonkers</option><option value="New York City">New York City</option><option value="Yonkers">Yonkers</option></select></label><label className="checkbox"><input type="checkbox" checked={!!input.stateOptions?.nyPflNotCovered} onChange={event => updateStateOption('nyPflNotCovered', event.target.checked)} />Paid Family Leave does not cover this job</label><InputField label="YTD Paid Family Leave contributions" value={input.ytd?.payrollContributions?.['ny-pfl'] ?? 0} onChange={value => update({ ...input, ytd: { ...input.ytd, payrollContributions: { ...input.ytd?.payrollContributions, 'ny-pfl': value } } })} /></>}
        {input.location.state === 'WA' && <><h3>Washington programs</h3><label className="checkbox"><input type="checkbox" checked={!!input.stateOptions?.waCaresExempt} onChange={event => updateStateOption('waCaresExempt', event.target.checked)} />I have an approved WA Cares exemption</label></>}
      </div>}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="calculate-button" onClick={submit} disabled={!!error}>Calculate my paycheck <span>→</span></button>
    </section>
    <section className="calculator-card result-card" ref={resultRef} aria-label="Estimated paycheck">
      <div className="card-heading"><span className="step">02</span><div><p className="eyebrow">Your estimated paycheck</p><h2>{wholeCurrency(result.netPay)} <small>take-home</small></h2></div></div>
      <div className="result-lines"><ResultLine label="Gross pay" amount={result.grossPay} gross /><p className="line-heading">Taxes &amp; payroll deductions</p>{rows.map(row => <ResultLine key={row.label} label={row.label} amount={row.amount} />)}{result.state.payrollDeductions.filter(row => row.amount > 0).map(row => <ResultLine key={row.id} label={row.label} amount={row.amount} />)}{deductions.map(row => <ResultLine key={row.id} label={row.label} amount={row.amount} />)}<div className="net-line"><span>Net pay</span><strong>{currency(result.netPay)}</strong></div></div>
      <div className="keep-callout">You keep approximately <strong>{percent}¢</strong> of every $1 of gross pay.</div>
      <div className="periods">{Object.entries({ Weekly: 52, Biweekly: 26, 'Semi-monthly': 24, Monthly: 12, Annual: 1 }).map(([label, count]) => <div key={label}><span>{label}</span><strong>{wholeCurrency(result.netPay * periodCount[input.payFrequency] / count)}</strong></div>)}</div><p className="help">Pay-period equivalents use this paycheck&apos;s rate. Actual future checks may differ near annual limits.</p>
      {!result.local.supported && <p className="local-notice">Local income taxes are not included in this estimate.</p>}
      <p className="verified">Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(-1)} · {result.sources.map((source, index) => <span key={source.url}>{index > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer">{source.authority}</a></span>)}</p>
      <details className="assumptions"><summary>Assumptions and sources</summary><ul>{result.assumptions.map(item => <li key={item}>{item}</li>)}</ul><p>Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(-1)}</p><ul>{result.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> — {source.authority}</li>)}</ul></details><p className="disclaimer">Estimated paycheck — not tax advice.</p>
    </section>
  </div>;
}
