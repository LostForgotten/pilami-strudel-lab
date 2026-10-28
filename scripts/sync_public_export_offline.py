"""Synchronize the public exporter and active VJ runtime modules, without downgrading them."""
from pathlib import Path
import json
import re
import base64
from export_assets import EXPORTER, PLAYER, RUNTIME_MARKERS

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'


def main():
    files = dict(RUNTIME_MARKERS)
    for name in files.values():
        source = (ASSETS / name).read_text()
        target = ASSETS / 'offline' / ('runtime-' + name)
        css = re.search(r"const cssURL=new URL\('([^']+\.css)',document\.currentScript\.src\)\.href;", source)
        if css:
            data = base64.b64encode((ASSETS / css[1]).read_bytes()).decode('ascii')
            source = source.replace(css[0], 'const cssURL="data:text/css;base64,' + data + '";')
        # The MIDI Learn icon must remain embedded for file:// use.
        if 'const midiLearnIconURL=' in source:
            data = base64.b64encode((ASSETS / 'images/midi-learn.png').read_bytes()).decode('ascii')
            icon = 'const midiLearnIconURL="data:image/png;base64,' + data + '";\n'
            source = re.sub(r'const midiLearnIconURL=.*?;\n', lambda _: icon, source, count=1)
        target.write_text(source)
    template = ASSETS / 'offline/pilami-hydra-vj.html'
    html = template.read_text()
    public = (ASSETS / 'offline/pilami-hydra-public.html').read_text()
    exporter = (ASSETS / EXPORTER).read_text()
    counts = {name: 0 for name in files.values()}
    seen = {'public': 0, 'exporter': 0, 'archive': 0}

    def replace(match):
        start, body, end = match.groups()
        if 'data-public-page-template' in start:
            seen['public'] += 1
            return start + json.dumps(public).replace('<', '\\u003c') + end
        if body.lstrip().startswith('// Pilami standalone public-page export.'):
            seen['exporter'] += 1
            return start + exporter + end
        if 'data-offline-sources' in start:
            seen['archive'] += 1
            sources = json.loads(body)
            current = ['assets/' + EXPORTER, 'assets/offline/' + PLAYER,
                       'assets/offline/pilami-hydra-public.html']
            for name in files.values():
                current.extend(['assets/' + name, 'assets/offline/runtime-' + name])
            for rel in current:
                sources[rel] = (ROOT / rel).read_text()
            return start + json.dumps(sources, ensure_ascii=False).replace('<', '\\u003c') + end
        if len(body) < 200000:
            for marker, name in files.items():
                if marker in body:
                    counts[name] += 1
                    return start + '\n' + (ASSETS / 'offline' / ('runtime-' + name)).read_text() + '\n' + end
        return match[0]

    html = re.sub(r'(<script\b[^>]*>)(.*?)(</script>)', replace, html, flags=re.S)
    if any(count != 1 for count in counts.values()) or any(count != 1 for count in seen.values()):
        raise SystemExit('Unexpected VJ template structure: ' + str((counts, seen)))
    template.write_text(html)
    print('VJ runtime and public export synchronized:', EXPORTER, PLAYER)


if __name__ == '__main__':
    main()
