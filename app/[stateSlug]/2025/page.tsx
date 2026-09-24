import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calculator } from '@/components/Calculator';
import { calculatePaycheck } from '@/calculator/index.ts';
import { stateCalculators } from '@/calculator/states/index.ts';
import { defaultInput } from '@/site/defaultInput.ts';
import { statePages } from '@/site/states.ts';
import { currency } from '@/site/format.ts';

const historicalPages = statePages.filter(page => stateCalculators[2025]?.[page.code]?.metadata.status === 'verified');

export function generateStaticParams() { return historicalPages.map(page => ({ stateSlug: page.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ stateSlug: string }> }): Promise<Metadata> {
  const { stateSlug } = await params;
  const page = historicalPages.find(item => item.slug === stateSlug);
  if (!page) return {};
  return {
    title: `${page.name} Paycheck Calculator 2025 — Historical Take-Home Pay`,
    description: `Estimate a 2025 ${page.name} paycheck with historical federal and state withholding rules.`,
    alternates: { canonical: `/${page.slug}/2025/` },
  };
}

export default async function HistoricalStatePage({ params }: { params: Promise<{ stateSlug: string }> }) {
  const { stateSlug } = await params;
  const page = historicalPages.find(item => item.slug === stateSlug);
  if (!page) notFound();
  const input = defaultInput(page.code, 2025);
  const result = calculatePaycheck(input);
  return <main className="page">
    <div className="intro"><p className="eyebrow">2025 · {page.name}</p><h1>{page.name} Paycheck Calculator 2025</h1><p>This historical calculator estimates paycheck withholding using 2025 federal and {page.name} rules. Select your pay details below to see a gross-to-net breakdown.</p></div>
    <Calculator initialInput={input} initialResult={result} />
    <section className="content-section"><h2>$100,000 salary in {page.name} in 2025</h2><p>A single filer paid biweekly with default withholding settings would receive an estimated {currency(result.netPay)} from {currency(result.grossPay)} gross per paycheck.</p><p>Actual results depend on your W-4, state withholding settings, benefits, and year-to-date wages.</p></section>
    <section className="content-section"><h2>Methodology and sources</h2><p>We use 2025 pay-period withholding methods. Missing year-to-date wages are projected from the selected pay date and current pay pattern.</p><ul>{result.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a> — {source.authority}</li>)}</ul><p className="verified">Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(-1)}</p></section>
    <section className="content-section"><a href={`/${page.slug}/`}>View the current {page.name} calculator →</a></section>
  </main>;
}
