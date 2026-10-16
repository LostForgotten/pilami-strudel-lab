(function () {
  'use strict';
  let root, section, frame, entries = [], serial = 0;
  function pause() { if (frame) cancelAnimationFrame(frame); frame = null; }
  function clear() { pause(); entries.forEach(e=>e.observer.disconnect()); entries=[]; serial=0; if (section) section.remove(); section=null; }
  function tick() {
    const time = window.strudel.getTime();
    for (const entry of entries) {
      const pattern = entry.punchcard ? window.strudel.getPattern() || entry.pattern : entry.pattern;
      const haps = pattern.queryArc(Math.max(0,time-entry.behind),time+entry.ahead).filter(h=>h.hasOnset() && (!entry.tag || h.hasTag(entry.tag)));
      entry.paint(haps,time,time+entry.ahead,entry.pattern);
    }
    frame=requestAnimationFrame(tick);
  }
  function visual(pattern, method, options) {
    if (!root) throw new Error('Visualisations non initialisées.');
    if (!section) {
      section=document.createElement('section'); section.dataset.inlineVisuals='';
      section.setAttribute('aria-label','Visualisations des pistes');
      root.querySelector('[data-code]').parentElement.after(section);
    }
    const card=document.createElement('figure'), label=document.createElement('figcaption'), canvas=document.createElement('canvas');
    card.style.cssText='margin:14px 0;border:1px solid #99a8b8;border-radius:10px;overflow:hidden';
    label.textContent=(method==='pianoroll' ? 'Piano roll' : method==='punchcard' ? 'Punchcard' : 'Oscilloscope')+' · '+(entries.length+1);
    label.style.cssText='padding:8px 12px;font-size:14px';
    canvas.style.cssText='display:block;width:100%;height:160px;background:#222';
    canvas.setAttribute('aria-hidden','true'); card.append(label,canvas);section.append(card);
    const resize=()=> { const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(canvas.clientWidth*ratio));canvas.height=Math.round(160*ratio); };
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    const entry={observer}, proto=window.strudel.Pattern.prototype;
    let result;
    if (method === 'punchcard') {
      // Native punchcard paints final events. Tag the track so subsequent transforms
      // and the final stack remain visible without mixing it with other tracks.
      const tag = 'pilami-punchcard-'+(++serial), original = proto.onPaint;
      const cycles = Number.isFinite(options.cycles) && options.cycles > 0 ? options.cycles : 4;
      const playhead = Number.isFinite(options.playhead) ? Math.max(0,Math.min(1,options.playhead)) : .5;
      const behind = cycles*playhead, ahead = cycles*(1-playhead);
      proto.onPaint = function(paint) {
        Object.assign(entry,{punchcard:true,tag,pattern:this,behind,ahead,
          paint:(haps,time)=>paint(canvas.getContext('2d'),time,haps,[-behind,ahead])});
        return this;
      };
      try { result = pattern.punchcard({...options,id:tag}).tag(tag); }
      catch(error) { observer.disconnect();card.remove();throw error; }
      finally { proto.onPaint = original; }
    } else {
      const original = proto.draw;
      proto.draw=function (paint,config) {
        Object.assign(entry,{paint,pattern:this,behind:Math.abs(config.lookbehind||0),ahead:config.lookahead||0});
        return this;
      };
      try { const config={...options,ctx:canvas.getContext('2d')};
        if(method==='scope') config.id='pilami-inline-'+(++serial);
        result=pattern[method](config); }
      catch (error) { observer.disconnect();card.remove();throw error; }
      finally { proto.draw=original; }
    }
    entries.push(entry);return result;
  }
  window.PilamiStrudelInline={
    register() {
      const proto=window.strudel.Pattern.prototype;
      proto._pianoroll=function(options={}) { return visual(this,'pianoroll',options); };
      proto._punchcard=function(options={}) { return visual(this,'punchcard',options); };
      proto._scope=function(options={}) { return visual(this,'scope',options); };
    },
    begin(target) { clear();root=target; },
    resume() { pause();if(entries.length) frame=requestAnimationFrame(tick); },
    pause,clear
  };
})();
