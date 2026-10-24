"""Rebuild the standalone bowl preset from its original source modules."""
from pathlib import Path
import json
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    npx = shutil.which('npx.cmd') or shutil.which('npx')
    if not npx:
        raise SystemExit('Node.js and npm/npx are required to rebuild this example.')
    source = ROOT / 'sources/glass-bowl'
    with tempfile.TemporaryDirectory(prefix='pilami-bowl-') as tmp:
        bundle = Path(tmp) / 'bundle.mjs'
        subprocess.run([npx, '--yes', 'esbuild@0.25.4', str(source / 'scene.mjs'),
                        '--bundle', '--format=esm', '--minify', '--target=es2020',
                        '--outfile=' + str(bundle)], cwd=ROOT, check=True)
        template = (source / 'preset.template.txt').read_text(encoding='utf-8')
        marker = '__PILAMI_BOWL_MODULE__'
        if template.count(marker) != 1:
            raise SystemExit('Expected exactly one embedded-module placeholder.')
        result = template.replace(marker, json.dumps(bundle.read_text(encoding='utf-8')))
    if len(result.encode('utf-8')) >= 65536:
        raise SystemExit('Preset exceeds the current 64 KiB import limit.')
    destination = ROOT / 'examples/Bol-de-verre-billes-audio.hydra.txt'
    destination.write_text(result, encoding='utf-8')
    print(f'{destination.name}: {len(result.encode("utf-8"))} bytes')


if __name__ == '__main__':
    main()
