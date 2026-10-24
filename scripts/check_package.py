"""Check the distributable's version and direct WordPress asset references."""
from pathlib import Path
import re

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
                'assets/offline/public-player-0.39.51.js',
                'tools/ableton-link-bridge/LICENSE.md',
                'tools/ableton-link-bridge/COPYING.GPLv2.md'}
    missing = sorted(p for p in paths | required if not (ROOT / p).is_file())
    if missing:
        raise SystemExit('Missing files: ' + ', '.join(missing))
    print(f'Plugin {header[1]}: {len(paths)} direct assets and required files present')
    return header[1], paths


if __name__ == '__main__':
    check()
