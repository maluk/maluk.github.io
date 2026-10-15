import { SiteRuntime } from '@/components/SiteRuntime';
import { CURRENT_YEAR } from '@/site/states.ts';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteRuntime><header className="site-header"><a className="brand" href="/">TheTax<span>.us</span></a><span>Know what lands in your bank account.</span></header>{children}<footer className="site-footer"><p>Estimated paycheck — not tax advice.</p><a href="/widgets/">Add our free calculator to your site</a><p>TheTax.us · {CURRENT_YEAR}</p></footer></SiteRuntime>;
}
