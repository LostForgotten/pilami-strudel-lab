# Sources du bol de billes

Scène originale Pilami, sous AGPL-3.0-or-later comme le code de l’extension. Voir [LICENSE](../../LICENSE). Le preset compilé est dans [examples/](../../examples/Bol-de-verre-billes-audio.hydra.txt).

| Fichier | Rôle |
|---|---|
| `scene.mjs` | Simulation de sphères, rotations, caméra et rendu WebGL 2 |
| `collisions.mjs` | Détection des nouveaux impacts et synthèse Web Audio |
| `glow.mjs` | Lueurs locales et enveloppes temporelles |
| `diffusion.mjs` | Sélection spatiale des émetteurs voisins |
| `occlusion.mjs` | Voisins sphériques pour l’occlusion ambiante |
| `preset.template.txt` | Contrôleurs Hydra et chargement du module embarqué |

Pour reconstruire depuis la racine du dépôt, avec Python 3, Node.js et npm :

```sh
python3 scripts/build_glass_bowl.py
```

Le script utilise esbuild 0.25.4 via npx ; le premier lancement peut nécessiter Internet pour l’outil de compilation. Le preset produit est autonome et ne demande pas cette connexion lors de sa lecture. Le script refuse une sortie atteignant la limite actuelle de 64 Kio de l’import de code.

Vérifications unitaires, depuis la racine du dépôt :

```sh
node sources/glass-bowl/test-glow.mjs
node sources/glass-bowl/test-sizes.mjs
node sources/glass-bowl/test-diffusion.mjs
node sources/glass-bowl/test-ao.mjs
```

Ces tests vérifient les calculs, enveloppes et associations spatiales. Ils ne remplacent pas les essais du rendu WebGL, du son, des snapshots et de l’export dans un navigateur. Voir le [guide du preset](../../docs/bol-de-verre.md).
