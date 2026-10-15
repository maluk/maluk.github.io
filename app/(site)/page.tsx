import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';
import { defaultInput } from '@/site/defaultInput.ts';
import { CURRENT_YEAR, verifiedStatePages } from '@/site/states.ts';
import { calculatePaycheck } from '@/calculator/index.ts';
import './home.css';

export const metadata: Metadata = { title: `Paycheck Calculator ${CURRENT_YEAR} — Take-Home Pay | TheTax.us`, alternates: { canonical: '/' } };

export default function Home() {
  const input = defaultInput('CA');
  const result = calculatePaycheck(input);
  return <main className="page">
    <div className="intro"><p className="eyebrow">{CURRENT_YEAR} paycheck calculator</p><h1>Know what actually lands in your bank account.</h1><p>Estimate your next paycheck with federal, state, and payroll deductions shown separately.</p></div>
    <aside className="widget-banner" aria-labelledby="widget-banner-title">
      <div className="widget-banner-art" aria-hidden="true"><div className="widget-banner-window"><span className="widget-banner-dots">● ● ●</span><svg width="42" height="32" viewBox="0 0 42 32" fill="none"><path d="m12 9-7 7 7 7m18-14 7 7-7 7M24 5l-6 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div><span className="widget-banner-plus">+</span></div>
      <div className="widget-banner-copy"><p className="widget-banner-label"><span>Free widget</span> Built for your website</p><h2 id="widget-banner-title">Your website. Our paycheck calculator.</h2><p>Give your readers a reason to stay. Add take-home pay estimates in your colors, in minutes.</p></div>
      <div className="widget-banner-action"><a href="/widgets/">Get the free widget <span aria-hidden="true">↗</span></a><span>No signup. Just copy &amp; embed.</span></div>
    </aside>
    <Calculator initialInput={input} initialResult={result} />
    <section className="content-section"><h2>Choose a state</h2><div className="state-links">{verifiedStatePages.map(page => <a key={page.code} href={`/${page.slug}/`}>{page.name} <span>↗</span></a>)}</div></section>
  </main>;
}
