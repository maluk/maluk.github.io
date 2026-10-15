'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { parseHandoff } from '../widget/config.ts';

const HandoffContext = createContext<ReturnType<typeof parseHandoff>>(undefined);
export const useWidgetHandoff = () => useContext(HandoffContext);

export function SiteRuntime({ children }: { children: React.ReactNode }) {
  const [handoff, setHandoff] = useState<ReturnType<typeof parseHandoff>>();
  useEffect(() => {
    const hash = window.location.hash;
    if (new URLSearchParams(hash.slice(1)).has('widget')) {
      setHandoff(parseHandoff(hash));
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Load analytics only after removing any widget handoff, including malformed data.
    if (!document.querySelector('script[data-thetax-analytics]')) {
      const script = document.createElement('script');
      script.src = 'https://cloud.umami.is/script.js';
      script.defer = true;
      script.dataset.websiteId = '03bf5d23-1333-4402-bb47-5791c5df95ff';
      script.dataset.thetaxAnalytics = '';
      script.onload = () => window.dispatchEvent(new Event('thetax:analytics-ready'));
      document.head.append(script);
    }
  }, []);
  return <HandoffContext.Provider value={handoff}>{children}</HandoffContext.Provider>;
}
