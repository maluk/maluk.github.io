'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { parseHandoff } from '../widget/config.ts';
import { trackSiteEvent } from '../site/tracking.ts';

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
      script.dataset.excludeHash = 'true';
      script.dataset.excludeSearch = 'true';
      script.dataset.doNotTrack = 'true';
      script.onload = () => window.dispatchEvent(new Event('thetax:analytics-ready'));
      document.head.append(script);
    }
  }, []);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-widget-banner]')) trackSiteEvent('widget_banner_clicked');
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, []);
  return <HandoffContext.Provider value={handoff}>{children}</HandoffContext.Provider>;
}
