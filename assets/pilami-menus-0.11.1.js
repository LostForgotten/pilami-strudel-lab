(function () {
  'use strict';
  let serial = 0;
  window.PilamiStrudelMenus = {
    mount(root) {
      if (root.dataset.menusMounted) return;
      root.dataset.menusMounted = 'true';
      const sections = Array.from(root.querySelectorAll('[data-preset-section]'));
      const close = section => {
        section.querySelector('[data-section-list]').hidden = true;
        section.querySelector('[data-section-toggle]').setAttribute('aria-expanded','false');
      };
      const choices = section => Array.from(section.querySelectorAll('[data-preset], [data-preview-preset]')).filter(button => !button.hidden && !button.closest('li').hidden);
      const open = section => {
        sections.forEach(other => { if (other !== section) close(other); });
        const list = section.querySelector('[data-section-list]');
        list.hidden = false; list.style.left = '0'; list.style.top = '100%'; list.style.bottom = 'auto';
        const rect = list.getBoundingClientRect(), anchor = section.getBoundingClientRect();
        list.style.left = Math.min(0,innerWidth-12-rect.right)+'px';
        const below = innerHeight-anchor.bottom-12, above = anchor.top-12;
        if (below < 160 && above > below) { list.style.top='auto'; list.style.bottom='100%'; }
        list.style.maxHeight = Math.max(90, Math.min(340,below < 160 && above > below ? above : below))+'px';
        section.querySelector('[data-section-toggle]').setAttribute('aria-expanded','true');
      };
      sections.forEach(section => {
        const toggle = section.querySelector('[data-section-toggle]'), list = section.querySelector('[data-section-list]');
        list.id = 'pilami-preset-menu-'+(++serial); toggle.setAttribute('aria-controls',list.id);
        toggle.addEventListener('click',()=> { if (list.hidden) open(section); else close(section); });
        section.addEventListener('pointerenter',event=> { if (event.pointerType === 'mouse') open(section); });
        section.addEventListener('pointerleave',event=> { if (event.pointerType === 'mouse' && !list.contains(document.activeElement)) close(section); });
        section.addEventListener('focusout',event=> { if (!section.contains(event.relatedTarget)) close(section); });
        list.addEventListener('click',event=> { if (event.target.closest('[data-preset], [data-preview-preset]')) { close(section); const editor = event.target.closest('[data-preset]') && root.querySelector('[data-code]'); if (editor) editor.focus(); else toggle.focus(); } });
        section.addEventListener('keydown',event=> {
          if (event.key === 'Escape') { event.preventDefault(); close(section); toggle.focus(); }
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault(); open(section);
          const items = choices(section); if (!items.length) return;
          const current = items.indexOf(document.activeElement);
          const next = current < 0 ? (event.key === 'ArrowDown' ? 0 : items.length-1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[next].focus();
        });
      });
      document.addEventListener('pointerdown',event=> { sections.forEach(section=> { if (!section.contains(event.target)) close(section); }); });
      window.addEventListener('resize',()=>sections.forEach(close));
    }
  };
})();
