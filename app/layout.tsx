import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://thetax.us'),
  title: 'Paycheck Calculator 2026 — TheTax.us',
  description: 'Estimate the pay that lands in your bank account with an itemized 2026 paycheck withholding calculation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><header className="site-header"><a className="brand" href="/">TheTax<span>.us</span></a><span>Know what lands in your bank account.</span></header>{children}<footer className="site-footer"><p>Estimated paycheck — not tax advice.</p><p>TheTax.us · 2026</p></footer></body></html>;
}
