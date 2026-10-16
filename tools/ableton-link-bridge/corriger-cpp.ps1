$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'node_modules\@ktamas77\abletonlink\binding.gyp'
if (-not (Test-Path -LiteralPath $p)) { throw "binding.gyp introuvable : $p" }
$s = [System.IO.File]::ReadAllText($p)
if ($s.Contains('/std:c++14') -or $s.Contains('-std=c++14')) {
  $s = $s.Replace('/std:c++14','/std:c++20').Replace('-std=c++14','-std=c++20')
  [System.IO.File]::WriteAllText($p, $s)
  Write-Host 'Configuration C++20 appliquee au binding.gyp du module local.'
} elseif ($s.Contains('/std:c++20') -or $s.Contains('-std=c++20')) {
  Write-Host 'Configuration C++20 deja presente : aucune modification necessaire.'
} else {
  throw 'Option de version C++ inconnue : configuration du module a verifier.'
}

# The header may expand a macro into __DARWIN_OSSwapInt64 during compilation,
# so the literal symbol might NOT appear in the header on disk.
# Define a Windows-compatible alias before the first C++ include.
$source = Join-Path $PSScriptRoot 'node_modules\@ktamas77\abletonlink\src\abletonlink.cc'
if (-not (Test-Path -LiteralPath $source)) { throw "Source native introuvable : $source" }
$cpp = [System.IO.File]::ReadAllText($source)
$marker = 'PILAMI_WINDOWS_DARWIN_BYTESWAP_COMPAT'
if ($cpp.Contains($marker)) {
  Write-Host 'Correctif byte-swap Windows deja present.'
} else {
  $prefix = @'
// PILAMI_WINDOWS_DARWIN_BYTESWAP_COMPAT
#if defined(_WIN32)
#include <intrin.h>
#ifndef __DARWIN_OSSwapInt64
#define __DARWIN_OSSwapInt64(value) _byteswap_uint64(value)
#endif
#endif
'@
  [System.IO.File]::WriteAllText($source, $prefix + [Environment]::NewLine + $cpp)
  Write-Host 'Alias byte-swap Windows ajoute avant les includes C++.'
}
