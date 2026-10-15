'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_ACCENT, embedPath, embedSnippets, widgetStates } from '../widget/config.ts';

export function WidgetBuilder() {
  const [state, setState] = useState('CA');
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [mode, setMode] = useState<'script' | 'iframe'>('script');
  const [copyStatus, setCopyStatus] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const code = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState(900);
  const snippet = embedSnippets(state, accent)[mode];
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== 'thetax:resize:v1') return;
      if (typeof event.data.height === 'number' && Number.isFinite(event.data.height) && event.data.height >= 200 && event.data.height <= 20000) setHeight(Math.ceil(event.data.height));
    };
    window.addEventListener('message', receive);
    // Handles hydration finishing after load, and state/color preview reloads.
    const interval = window.setInterval(() => frame.current?.contentWindow?.postMessage({ type: 'thetax:init:v1' }, window.location.origin), 500);
    return () => { window.removeEventListener('message', receive); window.clearInterval(interval); };
  }, []);
  useEffect(() => { setCopyStatus(''); }, [snippet]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopyStatus('Embed code copied.'); }
    catch { code.current?.focus(); code.current?.select(); setCopyStatus('Select and copy the code below.'); }
  };

  return <div className="widget-builder">
    <section className="calculator-card widget-setup" aria-labelledby="setup-heading">
      <p className="eyebrow">Make it yours</p><h2 id="setup-heading">Set up your widget</h2><p className="muted">Choose a starting state and a color. Your visitors can change the calculator inputs.</p>
      <label className="field"><span>Default state</span><select value={state} onChange={event => setState(event.target.value)}>{widgetStates.map(page => <option key={page.code} value={page.code}>{page.name}</option>)}</select></label>
      <label className="field"><span>Accent color</span><span className="builder-color"><input type="color" value={`#${accent}`} onChange={event => setAccent(event.target.value.slice(1))} /><span>#{accent.toUpperCase()}</span></span></label>
      <label className="field"><span>Installation method</span><select value={mode} onChange={event => setMode(event.target.value as 'script' | 'iframe')}><option value="script">Automatic height · recommended</option><option value="iframe">Plain iframe · no publisher script</option></select></label>
      <p className="help">{mode === 'script' ? 'Paste this into a custom HTML block. The widget adjusts its height as visitors use it.' : 'Use this if your site blocks custom scripts. The frame scrolls when its contents exceed 900px.'}</p>
      <label className="field"><span>Embed code</span><textarea ref={code} className="embed-code" readOnly rows={9} value={snippet} spellCheck={false} /></label>
      <button type="button" className="calculate-button" onClick={copy}>Copy embed code <span aria-hidden="true">↗</span></button><p className="help" role="status">{copyStatus}</p>
      <p className="help">Free to embed. Keep the TheTax.us attribution and fallback link visible.</p>
    </section>
    <section className="widget-preview" aria-labelledby="preview-heading"><div className="preview-heading"><h2 id="preview-heading">Live preview</h2><span>Try it below</span></div><iframe key={`${state}-${accent}`} ref={frame} src={embedPath(state, accent)} title="Live paycheck widget preview" style={{ height }} /></section>
  </div>;
}
