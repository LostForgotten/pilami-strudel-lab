from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1];assets=root/'assets'
files={'window.PilamiInterface=':'pilami-interface-0.39.51.js','window.PilamiHydraSnapshots=':'pilami-snapshots-0.39.49.js','window.PilamiHydraWorkspace=':'pilami-hydra-workspace-0.39.51.js','window.PilamiDetachable=':'pilami-detachable-0.39.51.js'}
for name in files.values():
    source=(assets/name).read_text()
    if 'snapshots' in name:
        old=(assets/'offline/runtime-pilami-snapshots-0.39.32.js').read_text()
        icon=re.search(r'const midiLearnIconURL=.*?;\n',old)[0]
        source=re.sub(r'const midiLearnIconURL=.*?;\n',lambda m:icon,source,count=1)
    (assets/'offline'/('runtime-'+name)).write_text(source)
html=assets/'offline/pilami-hydra-vj.html';s=html.read_text();
s=re.sub(r'<script type="application/json" data-public-page-template>.*?</script>', '', s, flags=re.S)
s=re.sub(r'<script>\s*// Pilami standalone public-page export\..*?</script>', '', s, flags=re.S)
if '<script type="application/json" data-public-page-template>' not in s:
    extra='<script type="application/json" data-public-page-template>'+json.dumps((assets/'offline/pilami-hydra-public.html').read_text()).replace('<','\\u003c')+'</script><script>'+ (assets/'pilami-public-export-0.39.51.js').read_text()+'</script>'
    s=s.replace('<script type="application/json" data-offline-pack>',extra+'<script type="application/json" data-offline-pack>',1)
counts={name:0 for name in files.values()}
def replace(m):
    if len(m[2])<200000:
        for marker,name in files.items():
            if marker in m[2]:
                counts[name]+=1
                return m[1]+'\n'+(assets/'offline'/('runtime-'+name)).read_text()+'\n'+m[3]
    if 'data-offline-sources' in m[1]:
        sources=json.loads(m[2])
        for extra in ['assets/pilami-public-export-0.39.51.js','assets/offline/public-player-0.39.51.js','assets/offline/pilami-hydra-public.html']:sources[extra]=(root/extra).read_text()
        for name in files.values():
            for rel in ['assets/'+name,'assets/offline/runtime-'+name]:sources[rel]=(root/rel).read_text()
        return m[1]+json.dumps(sources,ensure_ascii=False).replace('<','\\u003c')+m[3]
    return m[0]
s=re.sub(r'(<script\b[^>]*>)(.*?)(</script>)',replace,s,flags=re.S)
assert all(n==1 for n in counts.values()),counts
s=s.replace('Hydra VJ 0.39.49','Hydra VJ 0.39.50').replace('Hydra VJ 0.39.48','Hydra VJ 0.39.50').replace('0.39.49 · hors ligne','0.39.50 · hors ligne').replace('0.39.48 · hors ligne','0.39.50 · hors ligne')
s=s.replace('Hydra VJ 0.39.50','Hydra VJ 0.39.51').replace('0.39.50 · hors ligne','0.39.51 · hors ligne')
html.write_text(s)
print('Offline sources and executable scripts synchronized.')
