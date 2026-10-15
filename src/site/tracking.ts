export function trackSiteEvent(event: string, data?: Record<string, string>): void {
  if (typeof window === 'undefined' || ['1', 'yes'].includes(navigator.doNotTrack ?? '')) return;
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void; umami?: { track: (name: string, data?: Record<string, string>) => void } };
  try {
    w.gtag?.('event', event, data);
    if (w.umami) w.umami.track(event, data);
    else window.addEventListener('thetax:analytics-ready', () => { try { w.umami?.track(event, data); } catch { /* Tracking is optional. */ } }, { once: true });
  } catch { /* Never interrupt the user's action. */ }
}

export async function copyWidgetCode(code: string, write: (code: string) => Promise<void>, track: () => void): Promise<boolean> {
  try { await write(code); } catch { return false; }
  try { track(); } catch { /* A successful copy stays successful if analytics fails. */ }
  return true;
}
