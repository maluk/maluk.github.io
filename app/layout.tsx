import type { Metadata } from 'next';
import './styles.css';
import { CURRENT_YEAR } from '@/site/states.ts';

export const metadata: Metadata = {
  metadataBase: new URL('https://thetax.us'),
  title: `Paycheck Calculator ${CURRENT_YEAR} — TheTax.us`,
  description: `Estimate the pay that lands in your bank account with an itemized ${CURRENT_YEAR} paycheck withholding calculation.`,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
