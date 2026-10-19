"""Refresh the preset browser in the existing standalone bundle and its sources."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.39.43'
module = f'assets/pilami-hydra-workspace-{VERSION}.js'
runtime = f'assets/offline/runtime-pilami-hydra-workspace-{VERSION}.js'
code = (ROOT / module).read_text()
(ROOT / runtime).write_text(code)
page = ROOT / 'assets/offline/pilami-hydra-vj.html'
html = page.read_text()
pattern = re.compile(r'(<script[^>]*>)(.*?)(</script>)', re.S)
replaced = 0

def replace_script(match):
    global replaced
    if "const DEFAULT_KEY = 'pilami-hydra-essais-v1';" not in match[2]:
        return match[0]
    if 'data-offline-sources' in match[1]:
        return match[0]
    replaced += 1
    return match[1] + '\n' + code + '\n' + match[3]

html = pattern.sub(replace_script, html)
assert replaced == 1, replaced
if 'data-hydra-sort' not in html[:html.index('<script type="application/json" data-offline-sources>')]:
    marker = '<label>Rechercher <input data-hydra-search type="search" placeholder="Julia, mandala, audio…"></label>'
    assert marker in html
    html = html.replace(marker, marker + '\n            <label>Trier par <select data-hydra-sort><option value="recent">Plus récents</option><option value="oldest">Plus anciens</option><option value="name">Nom : A → Z</option></select></label>', 1)
html = html.replace('<small>0.39.42 · hors ligne</small>', f'<small>{VERSION} · hors ligne</small>')
manifest_pattern = re.compile(r'(<script type="application/json" data-offline-sources>)(.*?)(</script>)', re.S)
match = manifest_pattern.search(html)
assert match
sources = json.loads(match[2])
for name in [module, runtime, 'pilami-strudel-lab.php', 'includes/hydra-catalog.php',
             'includes/hydra-editor.php', 'includes/version-history.php', 'README.txt']:
    sources[name] = (ROOT / name).read_text()
encoded = json.dumps(sources, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
html = html[:match.start(2)] + encoded + html[match.end(2):]
page.write_text(html)
print('Standalone preset browser and sources updated to', VERSION)
