export const UMAMI_COLLECT_URL = 'https://gateway.umami.is/api/send';
export type WidgetEvent = 'widget_loaded' | 'widget_interacted' | 'widget_full_calculator_clicked';
export type EmbedMethod = 'script' | 'iframe';
export type AttributionSource = 'postmessage' | 'referrer' | 'unknown';
export interface WidgetAttribution {
  publisher_hostname: string;
  attribution_source: AttributionSource;
  embed_method: EmbedMethod;
  embed_version: 'v1';
}

const events = new Set<WidgetEvent>(['widget_loaded', 'widget_interacted', 'widget_full_calculator_clicked']);
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function publisherHostname(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
    return url.hostname.toLowerCase().replace(/\.+$/, '') || undefined;
  } catch { return; }
}

export function excludedPublisher(hostname: string): boolean {
  return hostname === 'thetax.us' || hostname.endsWith('.thetax.us') || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || hostname === '[::1]' || /^127\./.test(hostname) || hostname === '0.0.0.0';
}

export function parentInitOrigin(event: { source: unknown; origin: string; data: unknown }, parent: unknown): string | undefined {
  if (event.source !== parent || !event.data || typeof event.data !== 'object' || !('type' in event.data) || event.data.type !== 'thetax:init:v1') return;
  try {
    const url = new URL(event.origin);
    if (['https:', 'http:'].includes(url.protocol) && url.origin === event.origin) return event.origin;
  } catch { /* Untrusted messages are ignored. */ }
}

// Build every field explicitly. Never pass a DOM event, page URL, calculator input,
// link destination, or arbitrary caller properties through to the collector.
export function widgetPayload(websiteId: string, name: WidgetEvent, attribution: WidgetAttribution) {
  if (!uuid.test(websiteId) || !events.has(name) || !['script', 'iframe'].includes(attribution.embed_method) || !['postmessage', 'referrer', 'unknown'].includes(attribution.attribution_source)) return;
  const hostname = attribution.publisher_hostname === 'unknown' ? 'unknown' : publisherHostname(`https://${attribution.publisher_hostname}`);
  if (!hostname || hostname !== attribution.publisher_hostname || (hostname !== 'unknown' && excludedPublisher(hostname))) return;
  return {
    type: 'event',
    payload: {
      website: websiteId,
      hostname: 'thetax.us',
      url: '/embed/paycheck/',
      referrer: '',
      title: 'TheTax.us paycheck widget',
      name,
      data: {
        publisher_hostname: hostname,
        embed_method: attribution.embed_method,
        embed_version: 'v1',
        attribution_source: attribution.attribution_source,
      },
    },
  };
}

export function sendWidgetEvent(websiteId: string, name: WidgetEvent, attribution: WidgetAttribution, transport: typeof fetch = fetch): void {
  const body = widgetPayload(websiteId, name, attribution);
  if (!body) return;
  try {
    void transport(UMAMI_COLLECT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true }).catch(() => {});
  } catch { /* Analytics must never interfere with the widget. */ }
}

interface AnalyticsOptions {
  websiteId?: string;
  production: boolean;
  embedded: boolean;
  pageUrl: string;
  referrer: string;
  doNotTrack?: string | null;
  send: (name: WidgetEvent, attribution: WidgetAttribution) => void;
  schedule?: (callback: () => void, delay: number) => () => void;
}

export function createWidgetAnalytics(options: AnalyticsOptions) {
  const page = new URL(options.pageUrl);
  const method: EmbedMethod = page.searchParams.get('embed') === 'script' ? 'script' : 'iframe';
  const referrer = publisherHostname(options.referrer);
  let disabled = !options.websiteId || !uuid.test(options.websiteId) || !options.production || !options.embedded || !['thetax.us', 'www.thetax.us'].includes(page.hostname) || page.searchParams.get('preview') === '1' || page.searchParams.get('tracking') === 'off' || ['1', 'yes'].includes(options.doNotTrack ?? '') || (!!referrer && excludedPublisher(referrer));
  let disposed = false;
  let attribution: WidgetAttribution | undefined;
  let interaction = false;
  let interactionSent = false;
  let clicks = 0;
  let cancel: (() => void) | undefined;
  const send = (name: WidgetEvent) => {
    if (disabled || disposed || !attribution) return;
    try { options.send(name, { ...attribution }); } catch { /* Fail open for calculation and navigation. */ }
  };
  const flush = () => {
    if (interaction && !interactionSent) { interactionSent = true; send('widget_interacted'); }
    while (clicks > 0) { clicks--; send('widget_full_calculator_clicked'); }
  };
  const resolve = (hostname: string | undefined, source: AttributionSource) => {
    if (attribution || disabled || disposed) return;
    if (hostname && excludedPublisher(hostname)) { disabled = true; cancel?.(); return; }
    attribution = { publisher_hostname: hostname ?? 'unknown', attribution_source: hostname ? source : 'unknown', embed_method: method, embed_version: 'v1' };
    cancel?.();
    send('widget_loaded');
    flush();
  };
  if (!disabled) {
    if (method === 'iframe') resolve(referrer, 'referrer');
    else {
      const schedule = options.schedule ?? ((callback, delay) => { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); });
      cancel = schedule(() => resolve(undefined, 'unknown'), 5000);
    }
  }
  return {
    parentOrigin(origin: string) {
      const hostname = publisherHostname(origin);
      if (hostname && excludedPublisher(hostname)) { disabled = true; cancel?.(); }
      else if (hostname) resolve(hostname, 'postmessage');
    },
    interact() { if (!disabled && !disposed) { interaction = true; if (attribution) flush(); } },
    click() { if (!disabled && !disposed) { clicks++; if (attribution) flush(); } },
    dispose() { disposed = true; cancel?.(); },
  };
}
