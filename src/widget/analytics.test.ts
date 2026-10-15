import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWidgetAnalytics, excludedPublisher, parentInitOrigin, publisherHostname, sendWidgetEvent, UMAMI_COLLECT_URL, widgetPayload, type WidgetAttribution, type WidgetEvent } from './analytics.ts';
import { copyWidgetCode } from '../site/tracking.ts';

const websiteId = '03bf5d23-1333-4402-bb47-5791c5df95ff';
const attribution: WidgetAttribution = { publisher_hostname: 'publisher.example', attribution_source: 'postmessage', embed_method: 'script', embed_version: 'v1' };

function fixture(overrides: Partial<Parameters<typeof createWidgetAnalytics>[0]> = {}) {
  const recorded: { name: WidgetEvent; data: WidgetAttribution }[] = [];
  let timeout: (() => void) | undefined;
  let cancelled = false;
  const analytics = createWidgetAnalytics({ websiteId, production: true, embedded: true, pageUrl: 'https://thetax.us/embed/paycheck/?embed=script', referrer: '', send: (name, data) => recorded.push({ name, data }), schedule(callback, delay) { assert.equal(delay, 5000); timeout = callback; return () => { cancelled = true; }; }, ...overrides });
  return { analytics, recorded, expire() { if (!cancelled) timeout?.(); } };
}

test('script attribution waits for the parent and deduplicates handshake and interaction events', () => {
  const f = fixture();
  f.analytics.interact(); f.analytics.interact();
  assert.equal(f.recorded.length, 0);
  f.analytics.parentOrigin('https://PUBLISHER.example.:443');
  f.analytics.parentOrigin('https://publisher.example');
  f.analytics.interact(); f.expire();
  assert.deepEqual(f.recorded, [{ name: 'widget_loaded', data: attribution }, { name: 'widget_interacted', data: attribution }]);
  f.analytics.click(); f.analytics.click();
  assert.deepEqual(f.recorded.slice(2).map(event => event.name), ['widget_full_calculator_clicked', 'widget_full_calculator_clicked']);
});

test('legacy iframe loads use referrer hostname only, or unknown attribution', () => {
  const f = fixture({ pageUrl: 'https://thetax.us/embed/paycheck/', referrer: 'https://blog.publisher.example/private/salary?salary=987654#secret' });
  assert.deepEqual(f.recorded, [{ name: 'widget_loaded', data: { ...attribution, publisher_hostname: 'blog.publisher.example', embed_method: 'iframe', attribution_source: 'referrer' } }]);
  const unknown = fixture({ pageUrl: 'https://thetax.us/embed/paycheck/' });
  assert.equal(unknown.recorded[0].data.publisher_hostname, 'unknown');
  assert.equal(unknown.recorded[0].data.attribution_source, 'unknown');
});

test('missing script handshake falls back once and flushes early interactions and clicks', () => {
  const f = fixture();
  f.analytics.interact(); f.analytics.click(); f.expire(); f.expire();
  f.analytics.parentOrigin('https://late.example');
  assert.deepEqual(f.recorded.map(event => event.name), ['widget_loaded', 'widget_interacted', 'widget_full_calculator_clicked']);
  assert.ok(f.recorded.every(event => event.data.publisher_hostname === 'unknown'));
});

test('previews, development, standalone pages, disabled tracking and missing IDs send nothing', () => {
  const cases = [
    { websiteId: undefined }, { websiteId: 'not-a-website-id' }, { production: false }, { embedded: false },
    { pageUrl: 'http://localhost:3000/embed/paycheck/?embed=script' },
    { pageUrl: 'https://thetax.us/embed/paycheck/?embed=script&preview=1' },
    { pageUrl: 'https://thetax.us/embed/paycheck/?tracking=off' },
    { doNotTrack: '1' }, { doNotTrack: 'yes' },
    { referrer: 'https://thetax.us/widgets/' }, { referrer: 'https://www.thetax.us/' },
    { referrer: 'http://127.0.0.1:8766/' }, { referrer: 'http://[::1]:8766/' },
  ];
  for (const options of cases) {
    const f = fixture(options);
    f.analytics.interact(); f.analytics.click(); f.analytics.parentOrigin('https://publisher.example'); f.expire();
    assert.equal(f.recorded.length, 0, JSON.stringify(options));
  }
});

test('self-hosted and loopback parent handshakes suppress events', () => {
  for (const origin of ['https://thetax.us', 'https://www.thetax.us', 'http://localhost:8766', 'http://127.0.0.2:8766']) {
    const f = fixture(); f.analytics.parentOrigin(origin); f.analytics.interact(); f.expire();
    assert.equal(f.recorded.length, 0);
  }
  const f = fixture();
  for (const value of ['null', '', 'file:///tmp/index.html', 'https://user:secret@publisher.example']) f.analytics.parentOrigin(value);
  assert.equal(f.recorded.length, 0);
});

test('parent initialization only accepts the actual parent, the v1 message and a valid HTTP origin', () => {
  const parent = {};
  const valid = { source: parent, origin: 'https://publisher.example', data: { type: 'thetax:init:v1' } };
  assert.equal(parentInitOrigin(valid, parent), valid.origin);
  for (const data of [null, '', 'thetax:init:v1', {}, { type: 'resize' }]) assert.equal(parentInitOrigin({ ...valid, data }, parent), undefined);
  assert.equal(parentInitOrigin({ ...valid, source: {} }, parent), undefined);
  for (const origin of ['null', 'file:///tmp', 'https://publisher.example/private?salary=123', 'https://user:secret@publisher.example']) assert.equal(parentInitOrigin({ ...valid, origin }, parent), undefined);
});

test('hostnames are normalized without merging distinct subdomains', () => {
  assert.equal(publisherHostname('https://WWW.Publisher.example.:8443/path?secret=true'), 'www.publisher.example');
  assert.equal(publisherHostname('https://blog.publisher.example'), 'blog.publisher.example');
  assert.equal(excludedPublisher('thetax.us.evil.example'), false);
  assert.equal(excludedPublisher('preview.thetax.us'), true);
});

test('cleanup cancels pending loads; independent widget instances each record a load', () => {
  const disposed = fixture(); disposed.analytics.dispose(); disposed.expire(); disposed.analytics.parentOrigin('https://publisher.example'); disposed.analytics.click();
  assert.equal(disposed.recorded.length, 0);
  const widgets = [fixture(), fixture()];
  widgets.forEach(widget => widget.analytics.parentOrigin('https://publisher.example'));
  assert.equal(widgets.flatMap(widget => widget.recorded).length, 2);
});

test('collector payload only includes allowlisted fields, never inputs, URLs or injected properties', () => {
  const payload = widgetPayload(websiteId, 'widget_loaded', { ...attribution, salary: '987654', status: 'married_joint', result: 1234, url: 'https://publisher.example/private?token=secret#hash' } as WidgetAttribution);
  assert.deepEqual(payload, { type: 'event', payload: { website: websiteId, hostname: 'thetax.us', url: '/embed/paycheck/', referrer: '', title: 'TheTax.us paycheck widget', name: 'widget_loaded', data: attribution } });
  for (const marker of ['987654', 'married_joint', '1234', 'token', '#hash', '/private']) assert.ok(!JSON.stringify(payload).includes(marker));
  for (const publisher_hostname of ['publisher.example/private', 'publisher.example?salary=987654', 'localhost', 'thetax.us', '']) assert.equal(widgetPayload(websiteId, 'widget_loaded', { ...attribution, publisher_hostname }), undefined);
  assert.equal(widgetPayload('invalid', 'widget_loaded', attribution), undefined);
  assert.equal(widgetPayload(websiteId, 'salary_changed' as WidgetEvent, attribution), undefined);
});

test('collector uses credential-free, referrer-free keepalive requests and ignores failures', async () => {
  let called = false;
  sendWidgetEvent(websiteId, 'widget_loaded', attribution, (async (url, init) => {
    called = true;
    assert.equal(url, UMAMI_COLLECT_URL);
    assert.equal(init?.credentials, 'omit'); assert.equal(init?.referrerPolicy, 'no-referrer'); assert.equal(init?.keepalive, true);
    assert.deepEqual(JSON.parse(String(init?.body)), widgetPayload(websiteId, 'widget_loaded', attribution));
    return new Response(null, { status: 200 });
  }) as typeof fetch);
  assert.equal(called, true);
  assert.doesNotThrow(() => sendWidgetEvent(websiteId, 'widget_loaded', attribution, (() => { throw new Error('blocked'); }) as typeof fetch));
  sendWidgetEvent(websiteId, 'widget_loaded', attribution, (() => Promise.reject(new Error('network offline'))) as typeof fetch);
  await new Promise(resolve => setTimeout(resolve, 0));
  const f = fixture({ send() { throw new Error('collector blocked'); } });
  assert.doesNotThrow(() => { f.analytics.parentOrigin('https://publisher.example'); f.analytics.interact(); f.analytics.click(); });
});

test('code-copy events require clipboard success and cannot turn telemetry failure into copy failure', async () => {
  let events = 0;
  assert.equal(await copyWidgetCode('embed', async () => { throw new Error('denied'); }, () => events++), false);
  assert.equal(events, 0);
  assert.equal(await copyWidgetCode('embed', async () => {}, () => events++), true);
  assert.equal(events, 1);
  assert.equal(await copyWidgetCode('embed', async () => {}, () => { throw new Error('offline'); }), true);
});
