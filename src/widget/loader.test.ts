import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const loader = readFileSync(new URL('../../public/embed/v1.js', import.meta.url), 'utf8');

function environment(count = 1, tracking?: string) {
  const listeners: ((event: { origin: string; source: unknown; data: unknown }) => void)[] = [];
  const messages: unknown[] = [];
  const loads: (() => void)[] = [];
  const frames: { style: { cssText: string; height?: string }; contentWindow: { postMessage: (...args: unknown[]) => void }; src?: string; isConnected: boolean }[] = [];
  const containers = Array.from({ length: count }, () => ({
    initialized: false,
    setAttribute() { this.initialized = true; },
    getAttribute(name: string) { return name === 'data-state' ? 'TX' : name === 'data-accent' ? 'aabbcc' : name === 'data-tracking' ? tracking : null; },
    prepend(frame: typeof frames[number]) { frames.push(frame); },
  }));
  const context = {
    URL, Number, setTimeout() {},
    window: { addEventListener(_type: string, listener: typeof listeners[number]) { listeners.push(listener); } },
    document: {
      currentScript: { src: 'https://thetax.us/embed/v1.js' },
      querySelectorAll() { return containers.filter(container => !container.initialized); },
      createElement() { return { style: { cssText: '' }, isConnected: true, contentWindow: { postMessage(...args: unknown[]) { messages.push(args); } }, addEventListener(_type: string, listener: () => void) { loads.push(listener); } }; },
    },
  };
  return { context, frames, listeners, messages, loads, run() { runInNewContext(loader, context); } };
}

test('loader initializes multiple widgets once, including repeated script inclusion', () => {
  const env = environment(2);
  env.run(); env.run();
  assert.equal(env.frames.length, 2);
  assert.equal(env.listeners.length, 2);
  assert.equal(env.frames[0].src, 'https://thetax.us/embed/paycheck/?state=TX&accent=aabbcc&embed=script');
  env.loads[0]();
  assert.equal(JSON.stringify(env.messages[0]), JSON.stringify([{ type: 'thetax:init:v1' }, 'https://thetax.us']));
});

test('loader forwards publisher tracking opt-out without changing the resize contract', () => {
  const env = environment(1, 'off'); env.run();
  assert.equal(new URL(env.frames[0].src!).searchParams.get('tracking'), 'off');
  env.loads[0]();
  assert.equal(JSON.stringify(env.messages[0]), JSON.stringify([{ type: 'thetax:init:v1' }, 'https://thetax.us']));
});

test('loader resizes only for finite, bounded heights from its own frame and origin', () => {
  const env = environment(2);
  env.run();
  const frame = env.frames[0];
  const send = (origin: string, source: unknown, data: unknown) => env.listeners.forEach(listener => listener({ origin, source, data }));
  const resize = { type: 'thetax:resize:v1', height: 777.2 };
  send('https://evil.example', frame.contentWindow, resize);
  send('https://thetax.us', {}, resize);
  for (const height of [null, '777', Infinity, NaN, -1, 199, 20001]) send('https://thetax.us', frame.contentWindow, { ...resize, height });
  send('https://thetax.us', frame.contentWindow, { ...resize, type: 'other' });
  assert.equal(frame.style.height, undefined);
  send('https://thetax.us', frame.contentWindow, resize);
  assert.equal(frame.style.height, '778px');
  assert.equal(env.frames[1].style.height, undefined);
});
