import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';
import { defaultInput } from '@/site/defaultInput.ts';
import { CURRENT_YEAR, verifiedStatePages } from '@/site/states.ts';
import { calculatePaycheck } from '@/calculator/index.ts';

export const metadata: Metadata = { title: `Paycheck Calculator ${CURRENT_YEAR} — Take-Home Pay | TheTax.us`, alternates: { canonical: '/' } };

export default function Home() {
  const input = defaultInput('CA');
  const result = calculatePaycheck(input);
  return <main className="page"><div className="intro"><p className="eyebrow">{CURRENT_YEAR} paycheck calculator</p><h1>Know what actually lands in your bank account.</h1><p>Estimate your next paycheck with federal, state, and payroll deductions shown separately.</p></div><Calculator initialInput={input} initialResult={result} /><section className="content-section"><h2>Choose a state</h2><div className="state-links">{verifiedStatePages.map(page => <a key={page.code} href={`/${page.slug}/`}>{page.name} <span>↗</span></a>)}</div></section></main>;
}
