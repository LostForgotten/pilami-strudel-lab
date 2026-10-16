"""Package the checked-in plugin, sources and notices without rebuilding engines."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from check_package import check, ROOT


def main():
    version, _ = check()
    output = ROOT / 'dist'
    output.mkdir(exist_ok=True)
    archive = output / f'pilami-strudel-lab-v{version}.zip'
    directories = ('assets', 'includes', 'sources', 'tools')
    files = [ROOT / name for name in ('pilami-strudel-lab.php', 'README.txt',
                                      'LICENSE', 'THIRD_PARTY_NOTICES.md')]
    for directory in directories:
        files.extend(p for p in (ROOT / directory).rglob('*')
                     if p.is_file() and not any(part in {'node_modules', '__pycache__', '.git'}
                                               for part in p.relative_to(ROOT).parts)
                     and p.suffix not in {'.pyc', '.log'} and not p.name.startswith('.env'))
    with ZipFile(archive, 'w', compression=ZIP_DEFLATED, compresslevel=9) as target:
        for path in sorted(set(files)):
            info = ZipInfo('pilami-strudel-lab/' + path.relative_to(ROOT).as_posix(),
                           date_time=(2026, 1, 1, 0, 0, 0))
            info.external_attr = 0o100644 << 16
            info.compress_type = ZIP_DEFLATED
            target.writestr(info, path.read_bytes())
    digest = sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix('.zip.sha256').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
    print(f'{archive.name}: {archive.stat().st_size} bytes, SHA-256 {digest}')


if __name__ == '__main__':
    main()
