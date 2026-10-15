import type { Metadata } from 'next';
import { PaycheckWidget } from '@/components/PaycheckWidget';
import './widget.css';

export const metadata: Metadata = {
  title: 'Paycheck calculator widget — TheTax.us',
  description: 'A compact estimated paycheck calculator powered by TheTax.us.',
  robots: { index: false, follow: true },
};

export default function EmbedPaycheckPage() { return <PaycheckWidget />; }
