"""Check the distributable's version and direct WordPress asset references."""
from pathlib import Path
import re
import json
from export_assets import EXPORTER, PLAYER

ROOT = Path(__file__).resolve().parents[1]


def check():
    main = (ROOT / 'pilami-strudel-lab.php').read_text(encoding='utf-8')
    header = re.search(r'^ \* Version: ([0-9.]+)$', main, re.M)
    constant = re.search(r"define\('PILAMI_STRUDEL_LAB_VERSION', '([0-9.]+)'\)", main)
    if not header or not constant or header[1] != constant[1]:
        raise SystemExit('Plugin version mismatch')
    paths = set(re.findall(r"['\"](assets/[^'\"]+\.(?:js|css))['\"]", main))
    required = {'LICENSE', 'README.txt', 'includes/version-history.php',
                'assets/offline/pilami-hydra-vj.html',
                'assets/offline/pilami-hydra-public.html',
                'assets/offline/' + PLAYER, 'assets/' + EXPORTER,
                'templates/public-page.html',
                'tools/ableton-link-bridge/LICENSE.md',
                'tools/ableton-link-bridge/COPYING.GPLv2.md'}
    missing = sorted(p for p in paths | required if not (ROOT / p).is_file())
    if missing:
        raise SystemExit('Missing files: ' + ', '.join(missing))
    public = (ROOT / 'assets/offline/pilami-hydra-public.html').read_text()
    runtime = re.search(r'<script data-public-runtime>(.*?)</script>', public, re.S)
    if not runtime or runtime[1] != (ROOT / 'assets/offline' / PLAYER).read_text():
        raise SystemExit('Public player template is out of sync')
    vj = (ROOT / 'assets/offline/pilami-hydra-vj.html').read_text()
    embedded = re.search(r'<script[^>]*data-public-page-template[^>]*>(.*?)</script>', vj, re.S)
    if not embedded or json.loads(embedded[1]) != public:
        raise SystemExit('Public page embedded in the VJ pack is out of sync')
    archive = re.search(r'<script[^>]*data-offline-sources[^>]*>(.*?)</script>', vj, re.S)
    sources = json.loads(archive[1]) if archive else {}
    for name in ('assets/' + EXPORTER, 'assets/offline/' + PLAYER):
        if sources.get(name) != (ROOT / name).read_text():
            raise SystemExit('VJ source archive is out of sync: ' + name)
    print(f'Plugin {header[1]}: {len(paths)} direct assets and required files present')
    return header[1], paths


if __name__ == '__main__':
    check()
