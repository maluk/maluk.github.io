import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calculator } from '@/components/Calculator';
import { calculatePaycheck } from '@/calculator/index.ts';
import { comparePayFrequencies } from '@/calculator/periods.ts';
import { defaultInput } from '@/site/defaultInput.ts';
import { CURRENT_YEAR, stateBySlug, verifiedStatePages } from '@/site/states.ts';
import { currency } from '@/site/format.ts';

export function generateStaticParams() { return verifiedStatePages.map(page => ({ stateSlug: page.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ stateSlug: string }> }): Promise<Metadata> {
  const { stateSlug } = await params;
  const page = stateBySlug[stateSlug];
  if (!page) return {};
  return {
    title: `${page.name} Paycheck Calculator ${CURRENT_YEAR} — Take-Home Pay After Taxes`,
    description: `Estimate ${CURRENT_YEAR} take-home pay in ${page.name}. See paycheck withholding, FICA, state payroll deductions, assumptions, and official sources.`,
    alternates: { canonical: `/${page.slug}/` },
  };
}

export default async function StatePage({ params }: { params: Promise<{ stateSlug: string }> }) {
  const { stateSlug } = await params;
  const page = verifiedStatePages.find(item => item.slug === stateSlug);
  if (!page) notFound();
  const input = defaultInput(page.code);
  const result = calculatePaycheck(input);
  const periodResults = comparePayFrequencies(input);
  const periods = [
    ['Weekly', 'weekly'], ['Biweekly', 'biweekly'], ['Semi-monthly', 'semimonthly'], ['Monthly', 'monthly'],
  ] as const;
  return <main className="page"><div className="intro"><p className="eyebrow">{CURRENT_YEAR} · {page.name}</p><h1>{page.name} Paycheck Calculator</h1><p>{page.intro}</p></div><Calculator initialInput={input} initialResult={result} /><section className="content-section"><h2>$100,000 salary in {page.name}</h2><p>For a single filer paid biweekly with the default W-4 settings, an estimated paycheck is <strong>{currency(result.netPay)}</strong> from {currency(result.grossPay)} gross. Your actual withholding depends on your W-4, employer, benefits, and year-to-date wages.</p><div className="period-grid">{periods.map(([label, frequency]) => <div key={label}><span>{label}</span><strong>{currency(periodResults[frequency]!.netPay)}</strong></div>)}<div><span>Annualized</span><strong>{currency(result.netPay * 26)}</strong></div></div><p className="muted">Each pay frequency uses its own withholding calculation. Annualized pay repeats the displayed biweekly paycheck; actual yearly totals can differ near annual limits.</p></section><section className="content-section"><h2>What is deducted?</h2><p>{page.note} Federal income tax withholding follows IRS Publication 15-T. Social Security and Medicare follow federal payroll rules. Any selected employee benefit deductions appear as separate lines in your result.</p><h3>Common salaries</h3><p>Try $50,000, $75,000, $100,000, $125,000, $150,000, or $200,000 in the calculator above.</p></section><section className="content-section"><h2>Methodology and sources</h2><p>We calculate a pay-period estimate using the selected pay frequency and withholding inputs. Missing YTD wages are projected from the pay date and current pay pattern.</p><ul>{result.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a> — {source.authority}</li>)}</ul><p className="verified">Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(-1)} · Rules {result.rules.map(rule => rule.version).join(' / ')}</p></section><section className="content-section"><h2>Other state calculators</h2><div className="state-links">{verifiedStatePages.filter(item => item.code !== page.code).map(item => <a key={item.code} href={`/${item.slug}/`}>{item.name} <span>↗</span></a>)}</div></section></main>;
}
