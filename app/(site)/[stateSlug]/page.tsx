import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calculator } from '@/components/Calculator';
import { calculatePaycheck } from '@/calculator/index.ts';
import { comparePayFrequencies } from '@/calculator/periods.ts';
import { defaultInput } from '@/site/defaultInput.ts';
import { CURRENT_YEAR, stateBySlug, verifiedStatePages } from '@/site/states.ts';
import { currency } from '@/site/format.ts';

const commonSalaries = [50000, 75000, 100000, 125000, 150000, 200000];
const frequencies = [
  ['Weekly', 'weekly'], ['Biweekly', 'biweekly'], ['Semi-monthly', 'semimonthly'], ['Monthly', 'monthly'],
] as const;

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
  const salaryExamples = commonSalaries.map(annualSalary => ({
    annualSalary,
    result: calculatePaycheck({ ...input, compensation: { type: 'salary', annualSalary } }),
  }));
  const statePayroll = result.state.payrollDeductions.filter(item => item.amount > 0);

  return <main className="page">
    <div className="intro"><p className="eyebrow">{CURRENT_YEAR} · {page.name}</p><h1>{page.name} Paycheck Calculator</h1><p>{page.intro}</p></div>
    <Calculator initialInput={input} initialResult={result} />
    <section className="content-section">
      <h2>$100,000 salary in {page.name}</h2>
      <p>For a single filer paid biweekly with default W-4 settings, an estimated paycheck is <strong>{currency(result.netPay)}</strong> from {currency(result.grossPay)} gross. Your actual withholding depends on your W-4, employer, benefits, and year-to-date wages.</p>
      <div className="period-grid">{frequencies.map(([label, frequency]) => <div key={label}><span>{label}</span><strong>{currency(periodResults[frequency]!.netPay)}</strong></div>)}<div><span>Annualized</span><strong>{currency(result.netPay * 26)}</strong></div></div>
      <p className="muted">Each pay frequency uses its own withholding calculation. Annualized pay repeats the displayed biweekly paycheck; actual yearly totals can differ near annual limits.</p>
    </section>
    <section className="content-section">
      <h2>Common {page.name} salaries</h2>
      <p>These examples use the same single filer, biweekly pay, and default W-4 settings as the calculator above.</p>
      <div className="salary-table-wrap"><table className="salary-table"><thead><tr><th>Annual salary</th><th>Gross per paycheck</th><th>Estimated take-home</th></tr></thead><tbody>{salaryExamples.map(({ annualSalary, result: example }) => <tr key={annualSalary}><th>{currency(annualSalary)}</th><td>{currency(example.grossPay)}</td><td>{currency(example.netPay)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="content-section">
      <h2>How {page.name} payroll deductions work</h2>
      <p>{page.note} Federal income tax withholding follows IRS Publication 15-T. Social Security and Medicare follow federal payroll rules.</p>
      {statePayroll.length > 0 && <p>This example also includes {statePayroll.map(item => item.label).join(', ')}. The result lists each amount separately.</p>}
      {!result.local.supported && <p><strong>Local income taxes are not included in this estimate.</strong></p>}
    </section>
    <section className="content-section">
      <h2>Methodology and sources</h2>
      <p>We calculate a pay-period estimate using the selected pay frequency and withholding inputs. Missing YTD wages are projected from the pay date and current pay pattern.</p>
      <ul>{result.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a> — {source.authority}</li>)}</ul>
      <p className="verified">Tax rules verified: {result.rules.map(rule => rule.lastVerified).sort().at(0)} · Rules {result.rules.map(rule => rule.version).join(' / ')}</p>
    </section>
    <section className="content-section"><h2>Other state calculators</h2><div className="state-links">{verifiedStatePages.filter(item => item.code !== page.code).map(item => <a key={item.code} href={`/${item.slug}/`}>{item.name} <span>↗</span></a>)}</div></section>
  </main>;
}
