"""Update the existing standalone UI and source appendix without rebuilding engines."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
page=ROOT/'assets/offline/pilami-hydra-vj.html'
html=page.read_text()
modules={
 'performance':'// Pilami Performance —',
 'interface':'// Progressive presentation of the existing workspaces.',
 'detachable':'// The page owns the engines and canonical fields.',
}
added=[]
for module,marker in modules.items():
 name=f'assets/pilami-{module}-0.39.44.js'
 runtime=f'assets/offline/runtime-pilami-{module}-0.39.44.js'
 code=(ROOT/name).read_text();(ROOT/runtime).write_text(code);added.extend([name,runtime])
 count=[0]
 def replace(match):
  if marker not in match[2] or 'data-offline-sources' in match[1]:return match[0]
  count[0]+=1
  return match[1]+'\n'+code+'\n'+match[3]
 html=re.sub(r'(<script[^>]*>)(.*?)(</script>)',replace,html,flags=re.S)
 assert count[0]==1,(module,count)
html=html.replace('<small>0.39.43 · hors ligne</small>','<small>0.39.44 · hors ligne</small>')
match=re.search(r'(<script type="application/json" data-offline-sources>)(.*?)(</script>)',html,re.S)
assert match
sources=json.loads(match[2])
for name in added+['pilami-strudel-lab.php','includes/version-history.php','README.txt']:
 sources[name]=(ROOT/name).read_text()
encoded=json.dumps(sources,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
page.write_text(html[:match.start(2)]+encoded+html[match.end(2):])
print('Standalone Performance / Interface / Detachable updated to 0.39.44')
