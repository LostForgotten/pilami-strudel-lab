(function () {
  'use strict';
  const form = document.querySelector('[data-appearance-form]');
  const preview = document.querySelector('[data-appearance-preview]');
  if (!form || !preview) return;
  const field = key => form.querySelector('[name="pilami_strudel_appearance[' + key + ']"]');
  const value = key => field(key).value;
  const check = key => field(key).checked;
  const text = (selector, content) => { preview.querySelector(selector).textContent = content; };
  function refresh() {
    for (const [key,min,max] of [['width',320,1800],['editor_height',160,1000],['font_size',12,24],['spacing',4,36],['radius',0,28]]) {
      const raw = Number(value(key));
      const number = Math.max(min,Math.min(max,Number.isFinite(raw) ? raw : min));
      preview.style.setProperty('--pilami-' + (key === 'editor_height' ? 'editor-height' : key.replaceAll('_','-')),number+'px');
      if (key === 'editor_height') preview.style.setProperty('--pilami-editor-max',Math.max(560,number)+'px');
    }
    for (const key of ['editor_bg','editor_text','accent','panel_bg','panel_text']) preview.style.setProperty('--pilami-'+key.replaceAll('_','-'), value(key));
    preview.dataset.layout = value('layout'); preview.dataset.customPalette = check('custom_palette') ? '1' : '0';
    for (const [key,selector] of [['show_intro','[data-preview-intro]'],['show_help','[data-preview-help]'],['show_saves','[data-preview-saves]'],['show_recording','[data-preview-recording]']]) preview.querySelector(selector).hidden = !check(key);
    preview.querySelector('[data-preview-saves]').open = check('saves_open');
    let introduction = value('intro');
    const editor = window.tinymce && window.tinymce.get('pilami-intro');
    if (editor && !editor.isHidden()) introduction = editor.getContent();
    text('[data-preview-intro-text]', new DOMParser().parseFromString(introduction, 'text/html').body.textContent);
    text('[data-preview-subtitle]',value('subtitle')); text('[data-preview-help]','💡 À essayer : '+value('help')+' · Ctrl + Entrée');
    text('[data-preview-saves-title]',value('saves_title')); text('[data-preview-recording-title]',value('recording_title'));
    const enabled = Array.from(form.querySelectorAll('[name="pilami_strudel_appearance[presets][]"]:checked'),input=>input.value);
    const initial = field('initial_preset');
    form.querySelectorAll('[data-preset-editor]').forEach(slot => {
      const key = slot.dataset.presetEditor;
      const label = slot.querySelector('[data-preset-label]').value.trim() || 'Preset';
      const code = slot.querySelector('[data-preset-code]').value;
      const section = slot.closest('[data-section-editor]').dataset.sectionEditor;
      const available = enabled.includes(section) && code.trim() !== '';
      slot.querySelector('[data-preset-title]').textContent = label;
      slot.querySelector('[data-preset-code-field]').hidden = false;
      slot.querySelector('[data-preset-empty]').hidden = !!code.trim();
      const button = preview.querySelector('[data-preview-preset="'+key+'"]');
      button.textContent = label; button.parentElement.hidden = !available;
      const option = Array.from(initial.options).find(option => option.value === key);
      option.textContent = label; option.disabled = !available;
    });
    form.querySelectorAll('[data-section-editor]').forEach(section => {
      const key = section.dataset.sectionEditor;
      const label = section.querySelector('[data-section-label]').value.trim() || 'Section';
      section.querySelector('[data-section-title]').textContent = label;
      const group = preview.querySelector('[data-preset-section="'+key+'"]');
      group.querySelector('[data-section-name]').textContent = label;
      group.querySelector('[data-section-list]').setAttribute('aria-label','Presets — '+label);
      group.hidden = !Array.from(group.querySelectorAll('li')).some(li => !li.hidden);
      initial.querySelector('[data-initial-section="'+key+'"]').label = label;
      section.querySelector('[data-preset-add]').disabled = !section.querySelector('[data-preset-editor][hidden]');
    });
    if (initial.selectedOptions[0]?.disabled) {
      initial.value = Array.from(initial.options).find(option => !option.disabled)?.value || '';
    }
    preview.querySelectorAll('[data-preview-preset]').forEach(button => button.classList.toggle('is-active', button.dataset.previewPreset === initial.value));
    preview.querySelectorAll('[data-preset-section]').forEach(section => section.querySelector('[data-section-toggle]').classList.toggle('is-active', !!section.querySelector('[data-preview-preset].is-active')));
  }
  window.PilamiStrudelMenus.mount(preview);
  form.querySelectorAll('[data-preset-add]').forEach(button => button.addEventListener('click',()=> {
    const slot = button.closest('[data-section-editor]').querySelector('[data-preset-editor][hidden]');
    if (!slot) return; slot.hidden = false; slot.open = true; slot.querySelector('[data-preset-label]').focus(); refresh();
  }));
  form.querySelectorAll('[data-preset-remove]').forEach(button => button.addEventListener('click',()=> {
    const slot = button.closest('[data-preset-editor]');
    slot.querySelector('[data-preset-code]').value = '';
    slot.open = false; slot.hidden = true; refresh();
  }));
  form.addEventListener('input',refresh); form.addEventListener('change',refresh);
  form.querySelector('[data-appearance-reset]').addEventListener('click',event=> {
    if (!window.confirm('Rétablir tous les réglages d’apparence d’origine ? Tes presets personnalisés et tes essais seront conservés.')) event.preventDefault();
  });
  const attachedEditors = new WeakSet();
  let listening = false;
  function attachRichEditor() {
    if (!window.tinymce) return;
    const attach = editor => {
      if (editor.id === 'pilami-intro' && !attachedEditors.has(editor)) {
        attachedEditors.add(editor);
        editor.on('input change keyup SetContent',refresh); editor.on('init',refresh);
      }
    };
    window.tinymce.editors.forEach(attach);
    if (!listening) { window.tinymce.on('AddEditor',event=>attach(event.editor)); listening = true; }
    refresh();
  }
  attachRichEditor();
  window.addEventListener('load',attachRichEditor);
  refresh();
})();
