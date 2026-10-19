# Compilation du panneau Performance

Exécuter `npm ci`, puis `npm run build` dans ce dossier. Les versions sont fixées par le fichier de verrouillage.

`build.mjs` compile uniquement les composants utilisés et adapte l’énumération des systèmes Pixi pour ignorer les méthodes héritées des tableaux Hydra. Les méthodes Hydra restent inchangées. Le script refuse de compiler si le motif attendu a changé.

Les licences amont et celles des dépendances incluses sont conservées dans `assets/vendor/LICENSE-Pixi-Performance.txt`. Le code du panneau Pilami est sous AGPL-3.0-or-later.

Depuis 0.39.38, l’entrée expose aussi `ParticleContainer`, `Particle` et `Rectangle` pour les presets de particules. Le bundle `pilami-pixi-ui-8.14.3-2.3.2-particles.min.js` reste partagé avec le panneau Performance. Les sources et le verrouillage des dépendances sont conservés.
