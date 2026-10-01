import type { Metadata } from 'next';
import './styles.css';
import { CURRENT_YEAR } from '@/site/states.ts';

export const metadata: Metadata = {
  metadataBase: new URL('https://thetax.us'),
  title: `Paycheck Calculator ${CURRENT_YEAR} — TheTax.us`,
  description: `Estimate the pay that lands in your bank account with an itemized ${CURRENT_YEAR} paycheck withholding calculation.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><script defer src="https://cloud.umami.is/script.js" data-website-id="03bf5d23-1333-4402-bb47-5791c5df95ff"></script></head><body><header className="site-header"><a className="brand" href="/">TheTax<span>.us</span></a><span>Know what lands in your bank account.</span></header>{children}<footer className="site-footer"><p>Estimated paycheck — not tax advice.</p><p>TheTax.us · {CURRENT_YEAR}</p></footer></body></html>;
}
