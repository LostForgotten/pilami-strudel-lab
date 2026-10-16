/* Pilami Link help disclosure in the main toolbar — v0.39.28. */
(() => {
  'use strict';
  const root = document.querySelector('[data-pilami-strudel]');
  if (!root) return;
  const trigger = root.querySelector('[data-link-help-toggle]');
  const panel = root.querySelector('[data-link-help-panel]');
  const close = root.querySelector('[data-link-help-close]');
  if (!trigger || !panel) return;
  const show = visible => {
    panel.hidden = !visible;
    trigger.setAttribute('aria-expanded', String(visible));
  };
  trigger.addEventListener('click', () => show(panel.hidden));
  if (close) close.addEventListener('click', () => { show(false); trigger.focus(); });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { show(false); trigger.focus(); }
  });
})();
