(function () {
  'use strict';
  const KEY = 'pilami-workspaces-v1:';
  function mount(root, index) {
    if (root.dataset.workspacesMounted) return;
    const grid = root.querySelector('.pilami-dual-grid');
    const notice = root.querySelector('[data-workspaces-empty]');
    const entries = ['strudel', 'hydra'].map(key => ({
      key, title: key === 'strudel' ? 'Strudel' : 'Hydra',
      panel: root.querySelector('[data-' + key + '-space]'),
      button: root.querySelector('[data-toggle-workspace="' + key + '"]')
    }));
    if (!grid || !notice || entries.some(entry => !entry.panel || !entry.button)) return;
    root.dataset.workspacesMounted = '1';
    const storageKey = KEY + location.pathname + ':' + index;
    const visible = {strudel: true, hydra: true};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      for (const entry of entries) if (typeof saved?.[entry.key] === 'boolean') visible[entry.key] = saved[entry.key];
    } catch (_) {}
    function apply() {
      for (const entry of entries) {
        const show = visible[entry.key];
        // Hiding only changes presentation. The canonical editors, engines and
        // detached windows remain in place and retain their current state.
        if (!show && entry.panel.contains(document.activeElement)) entry.button.focus();
        entry.panel.hidden = !show;
        entry.button.textContent = (show ? 'Masquer ' : 'Afficher ') + entry.title;
        entry.button.setAttribute('aria-expanded', String(show));
      }
      const count = entries.filter(entry => visible[entry.key]).length;
      grid.dataset.visiblePanels = String(count);
      grid.hidden = count === 0;
      notice.hidden = count !== 0;
      root.dispatchEvent(new CustomEvent('pilami-workspace-visibility-change', {detail: {...visible}}));
      window.dispatchEvent(new Event('resize'));
    }
    for (const entry of entries) {
      if (!entry.panel.id) entry.panel.id = 'pilami-' + entry.key + '-space-' + (index + 1);
      entry.button.setAttribute('aria-controls', entry.panel.id);
      entry.button.addEventListener('click', () => {
        visible[entry.key] = !visible[entry.key];
        apply();
        try { localStorage.setItem(storageKey, JSON.stringify(visible)); } catch (_) {}
      });
    }
    apply();
  }
  const boot = () => document.querySelectorAll('[data-pilami-strudel]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
