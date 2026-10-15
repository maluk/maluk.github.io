(function () {
  'use strict';
  var script = document.currentScript;
  if (!script) return;
  var origin = new URL(script.src).origin;
  document.querySelectorAll('[data-thetax-widget]:not([data-thetax-initialized])').forEach(function (container) {
    container.setAttribute('data-thetax-initialized', '');
    var url = new URL('/embed/paycheck/', origin);
    url.searchParams.set('state', container.getAttribute('data-state') || 'CA');
    url.searchParams.set('accent', container.getAttribute('data-accent') || '006b60');
    var frame = document.createElement('iframe');
    frame.title = 'Estimated paycheck calculator - TheTax.us';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer';
    frame.style.cssText = 'display:block;width:100%;height:900px;border:0;';
    var connected = false;
    window.addEventListener('message', function (event) {
      if (event.origin !== origin || event.source !== frame.contentWindow || !event.data || event.data.type !== 'thetax:resize:v1') return;
      var height = event.data.height;
      if (typeof height !== 'number' || !Number.isFinite(height) || height < 200 || height > 20000) return;
      connected = true;
      frame.style.height = Math.ceil(height) + 'px';
    });
    frame.addEventListener('load', function () {
      connected = false;
      // Next.js hydration may finish after iframe load. Retry until the widget replies.
      var attempts = 0;
      function initialize() {
        if (!frame.isConnected || connected) return;
        frame.contentWindow.postMessage({ type: 'thetax:init:v1' }, origin);
        if (++attempts < 20) setTimeout(initialize, 250);
      }
      initialize();
    });
    frame.src = url.href;
    container.prepend(frame);
  });
})();
