import type { Metadata } from 'next';
import { WidgetBuilder } from '@/components/WidgetBuilder';
import { CURRENT_YEAR } from '@/site/states.ts';
import './widgets.css';

export const metadata: Metadata = {
  title: 'Free paycheck calculator widget for your website — TheTax.us',
  description: 'Add a free, customizable paycheck calculator to your website. Preview the widget, choose a state and accent color, and copy your embed code.',
  alternates: { canonical: '/widgets/' },
};

export default function WidgetsPage() {
  return <main className="page widgets-page"><div className="intro"><p className="eyebrow">Free calculator for your website</p><h1>Help your readers see their take-home pay.</h1><p>Add a compact paycheck calculator to your blog, job board, or financial resource page. Choose your color, copy the code, and you’re ready.</p></div>
    <div className="widget-benefits"><span>No signup or API key</span><span>50 states · {CURRENT_YEAR} rules</span><span>Updated by TheTax.us</span></div>
    <WidgetBuilder />
    <section className="content-section"><h2>Install in a few minutes</h2><ol><li>Choose a default state and accent color above.</li><li>Copy the code into a custom HTML block on your site. Use your platform’s embed or iframe block for the plain iframe option.</li><li>Publish your page and try the calculator on desktop and mobile.</li></ol><p>The widget uses your container’s width. Allow at least 320px for comfortable use. You can place multiple widgets on one page.</p><p>Sites with a Content Security Policy must allow frames from <code>https://thetax.us</code>. Automatic height also requires scripts from <code>https://thetax.us</code>. If your editor removes scripts, choose the plain iframe option.</p></section>
    <section className="content-section"><h2>Small widget. Same calculation engine.</h2><p>Visitors enter annual salary, state, filing status, and pay frequency. The estimate includes federal withholding, Social Security, Medicare, state withholding, and applicable statewide employee contributions. Local taxes are excluded and disclosed in the result.</p><p>This estimates paycheck withholding, rather than annual tax liability. It assumes one employer, work and residence in the selected state, default withholding settings, no benefits deductions, and projected year-to-date wages. The assumed pay date and detailed sources appear in the widget.</p><p>For hourly pay, benefits, W-4 adjustments, and other details, visitors can open the full calculator with their inputs preserved.</p></section>
    <section className="content-section"><h2>What comes with the free widget?</h2><p>Hosting, verified rule updates, and TheTax.us attribution are included. Calculations run in the visitor’s browser and do not share salary inputs or results with the publisher.</p><p>We use Umami to measure widget loads, first interactions, and clicks to the full calculator, along with the publisher hostname and embed version and method. We do not send calculator inputs, results, or publisher page paths to analytics. New plain iframe snippets send only the publisher’s origin as the referrer. Tracking respects Do Not Track.</p><p>To disable usage tracking, add <code>data-tracking="off"</code> to the automatic-height widget container, or <code>&amp;tracking=off</code> to a plain iframe’s URL.</p><p>If an embed cannot load, the code includes a link to the calculator on TheTax.us. No account, key, or server integration is needed.</p></section>
  </main>;
}
