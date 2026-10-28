"""Active export resources. Their module versions can differ from the plugin version."""
EXPORTER = 'pilami-public-export-0.39.55.js'
PLAYER = 'public-player-0.39.55.js'
RUNTIME_MARKERS = {
    'window.PilamiInterface=': 'pilami-interface-0.39.51.js',
    'window.PilamiHydraSnapshots=': 'pilami-snapshots-0.39.49.js',
    'window.PilamiHydraWorkspace=': 'pilami-hydra-workspace-0.39.56.js',
    'window.PilamiDetachable=': 'pilami-detachable-0.39.52.js',
    'window.PilamiStrudelHydra=': 'pilami-hydra-0.39.56.js',
    'window.PilamiHydraControls=': 'pilami-controllers-0.39.56.js',
    'window.PilamiMidiOutput=': 'pilami-midi-output-0.39.56.js',
}
