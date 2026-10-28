"""Build the public player from its readable shell and the checked-in engines."""
from pathlib import Path
import json
import re
from export_assets import EXPORTER, PLAYER

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'


def safe_json(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c')


def inline_script(value):
    return re.sub(r'</script', r'<\\/script', value, flags=re.I)


def main():
    offline = (ASSETS / 'offline/pilami-hydra-vj.html').read_text()
    match = re.search(r'<script[^>]*data-offline-sources[^>]*>(.*?)</script>', offline, re.S)
    if not match:
        raise SystemExit('Missing source archive in the VJ template')
    archive = json.loads(match[1])
    licenses = {'assets/vendor/LICENSE-Hydra.txt',
                'sources/hydra-extensions/LICENSE-Metagrowing.txt',
                'sources/hydra-extensions/LICENSE-Hyper-Hydra.txt'}
    sources = {key: value for key, value in archive.items()
               if key.startswith('sources/hydra-synth/') or key in licenses}
    sources['Pilami-LICENSE.txt'] = (ASSETS / 'vendor/LICENSE-Hydra.txt').read_text()
    sources['pilami-public-export.js'] = (ASSETS / EXPORTER).read_text()
    sources['pilami-hydra-extensions.js'] = (ASSETS / 'pilami-hydra-extensions-0.28.0.js').read_text()
    replacements = {
        '__PILAMI_PUBLIC_SOURCES__': safe_json(sources),
        '__PILAMI_HYDRA_ENGINE__': inline_script((ASSETS / 'vendor/hydra-synth-1.3.29-pilami-0.11.4.js').read_text()),
        '__PILAMI_HYDRA_EXTENSIONS__': inline_script((ASSETS / 'pilami-hydra-extensions-0.28.0.js').read_text()),
        '__PILAMI_PUBLIC_PLAYER__': inline_script((ASSETS / 'offline' / PLAYER).read_text()),
    }
    html = (ROOT / 'templates/public-page.html').read_text()
    for marker, content in replacements.items():
        if html.count(marker) != 1:
            raise SystemExit('Missing or repeated template marker: ' + marker)
        html = html.replace(marker, content)
    target = ASSETS / 'offline/pilami-hydra-public.html'
    target.write_text(html)
    print('Public template:', len(html.encode()), 'bytes; player:', PLAYER)


if __name__ == '__main__':
    main()
