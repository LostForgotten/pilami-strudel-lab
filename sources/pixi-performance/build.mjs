import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
// Hydra adds enumerable helpers to Array.prototype. The Pixi system registry
// must enumerate its own entries so those helpers are never treated as systems.
await build({
  entryPoints: ['entry.mjs'], bundle: true, format: 'iife', minify: true,
  legalComments: 'linked', outfile: '../../assets/vendor/pilami-pixi-ui-8.14.3-2.3.2.min.js',
  plugins: [{ name: 'hydra-array-compatibility', setup(builder) {
    builder.onLoad({ filter: /AbstractRenderer\.mjs$/ }, async ({ path }) => {
      let contents = await readFile(path, 'utf8');
      const original = 'for (i in systems) {\n      const val = systems[i];';
      if (!contents.includes(original)) throw Error('Review the Pixi renderer compatibility patch before updating dependencies.');
      contents = contents.replace(original, 'for (const val of Object.values(systems)) {');
      return { contents, loader: 'js' };
    });
  }}],
});
