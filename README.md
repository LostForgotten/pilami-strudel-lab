# Pilami Strudel Lab

Un laboratoire de création musicale et visuelle dans le navigateur, intégré à WordPress : **Strudel pour le son, Hydra pour l’image**, avec un Designer visuel, des contrôleurs MIDI et un séquenceur de variations.

Développé pour [pilami.fr/strudel](https://pilami.fr/strudel/), au fil d’essais musicaux et de sessions de VJing.

**Version actuelle : 0.39.92 — projet en développement.**

**Tu découvres l’application ?** Commence par [ton premier visuel en dix minutes](docs/demarrer.md). Aucun code, appareil MIDI ni Ableton n’est nécessaire pour ce premier essai. Le [sommaire de la documentation](docs/README.md) propose ensuite un parcours pas à pas.

## Ce que l’on peut faire

- Écrire et jouer des patterns Strudel, charger des presets et conserver ses essais.
- Créer des visuels Hydra, les rendre réactifs au son et explorer des presets.
- Manipuler les visuels avec des sliders, potentiomètres et pads XY, ouvrir le panneau Performance basé sur PixiJS / PixiUI, et retrouver les valeurs initiales au clic droit.
- Choisir la résolution de rendu, du 640 × 360 au Full HD, sans éditer le code et en conservant la taille choisie en plein écran.
- Importer et conserver ses photos dans le navigateur pour créer des visuels et alimenter les presets image.
- Construire et importer des chaînes Hydra dans le Designer visuel, dans les limites des fonctions prises en charge.
- Associer un appareil MIDI aux paramètres, corriger les associations et lisser les mouvements.
- Créer ses gammes et sources par note au diapason 440 ou 432 Hz.
- Exporter un preset complet avec ses liaisons audio/MIDI et son séquenceur.
- Préparer un périphérique Max for Live pour certains visuels Hydra compatibles, avec contrôleurs automatisables et réaction au son de la piste.
- Capturer jusqu’à dix snapshots, rappeler une variation ou réaliser un morphing entre réglages.
- Séquencer ces variations sur une grille de 16 ou 32 pas, avec remplissage aléatoire et synchronisation Ableton Link facultative.
- Détacher le visuel, le code et les contrôleurs dans des fenêtres, et configurer des raccourcis pour plusieurs écrans.
- Exporter un Pack VJ hors ligne depuis l’interface Hydra.
- Exporter le visuel courant en une page HTML autonome, avec ses réglages et sa résolution.
- Préparer sa miniature de partage, proposer jusqu’à deux contrôleurs au visiteur et choisir la résolution depuis le menu de la page exportée.
- Mettre à jour le code d’un preset en conservant les snapshots compatibles.
- Gérer les presets Hydra, leur apparence et les banques de snapshots dans WordPress, selon les droits de l’utilisateur.

## Nouveautés depuis la version GitHub 0.39.82

- **Exporter pour Max for Live** : génération d’un pack AMXD, JavaScript et JXS pour une chaîne Hydra compatible, avec feedback, audio de la piste et jusqu’à 16 contrôleurs à exposer dans Live.
- **Connaître la compatibilité avant le téléchargement** : indicateur et diagnostic à côté du bouton, choix des contrôleurs, progression et erreurs visibles aussi dans les fenêtres détachées.
- **Convertir davantage de presets** : formules audio, variables de résolution et horloges reconnues pour Art déco, Feu et étincelles, Plis lumineux et Julia-curseurs. Les moteurs WebGL personnalisés à plusieurs passes restent signalés comme non compatibles.
- **Naviguer dans une longue page** : bouton fixe de retour en haut, accessible au clavier.

Voir le [journal des versions](CHANGELOG.md) et le [guide de l’export Max for Live](docs/max-for-live.md).

## Essayer

Ouvre **[l’application sur pilami.fr](https://pilami.fr/strudel/)**. Choisis un preset puis lance **Lecture / Update** ou **Ctrl + Entrée**. Choisir un preset charge son code sans lancer automatiquement sa lecture.

En haut du laboratoire, active **Audio**, **MIDI** ou **Link** selon tes besoins. L’audio sert d’entrée aux visuels réactifs et peut être activé avant le premier visuel. **P** lance ou arrête le visuel ; **Ctrl + I** ouvre l’import d’un preset Hydra. Les boutons indiquent leurs raccourcis au survol.

Le site fonctionne sans passerelle Ableton. L’audio, le MIDI et certaines fonctions d’affichage nécessitent les autorisations du navigateur.

## Installer dans WordPress

1. Récupère le ZIP installable `pilami-strudel-lab-v0.39.92.zip` lorsqu’il est fourni avec une version. Le ZIP des sources GitHub doit d’abord être transformé en ZIP WordPress ; voir le [guide d’installation](docs/installation.md).
2. Dans WordPress : **Extensions → Ajouter une extension → Téléverser une extension**.
3. Installe et active **Pilami Strudel Lab** ; pour une mise à jour, accepte le remplacement de l’extension existante.
4. Ajoute un bloc **Code court** à une page avec `[pilami_strudel]`.
5. Publie la page et ouvre-la dans un navigateur récent avec Web Audio et WebGL.

Pour fabriquer le ZIP à partir des sources, lance `python3 scripts/build_plugin.py` à la racine du dépôt. Le résultat se trouve dans `dist/`.

Le dépôt contient le code de l’extension. Les presets, images et réglages enregistrés dans la base de données de pilami.fr ne constituent pas une sauvegarde incluse dans ce dépôt. Certaines ressources personnalisées pointent encore vers la médiathèque de pilami.fr ; consulte le [guide d’installation](docs/installation.md).

## Exemples de presets

Le [bol de verre et ses billes](examples/Bol-de-verre-billes-audio.hydra.txt) ajoute une simulation originale WebGL 2, avec mélangeur, matières, collisions sonores et lueurs locales. Le [guide du bol](docs/bol-de-verre.md) présente ses réglages ; ses sources séparées et leur script de compilation sont inclus. Une [scène publique](https://pilami.fr/visuels/billes/) illustre l’export HTML autonome.

### Nuage Pixi

Le [nuage de particules réactives](examples/Nuage-Particules-Pixi.hydra.txt) combine Pixi et Hydra : mouvement, couleurs, réaction au son et opacité aléatoire évoluant indépendamment pour chaque particule. Télécharge le fichier texte puis importe-le dans Hydra avec **Ctrl + I**. Il utilise la bibliothèque Pixi embarquée, sans chargement depuis un CDN.

## Ableton Link : le projet compagnon

**[Pilami Link Bridge](https://github.com/LostForgotten/pilami-link-bridge)** relie l’horloge Ableton Link à l’interface du navigateur. Il possède son propre dépôt et sa version portable Windows.

Il transmet tempo, phase et état de transport au navigateur. Les commandes du séquenceur visuel ne pilotent pas le transport de Live. La synchronisation visuelle dépend du navigateur ; elle n’est pas précise à l’échantillon audio près.

Voir [la connexion Ableton Link](docs/ableton-link.md). La copie présente dans `tools/ableton-link-bridge/` est conservée avec cette version de l’extension ; le dépôt compagnon est le point d’entrée pour installer le bridge et suivre ses versions.

## Documentation

- [Commencer : ton premier visuel en dix minutes](docs/demarrer.md)
- [Sommaire et parcours conseillé](docs/README.md)
- [Installation et mises à jour](docs/installation.md)
- [Premiers pas et raccourcis](docs/premiers-pas.md)
- [Presets, sauvegardes, snapshots et morphing](docs/presets-et-snapshots.md)
- [Gammes personnalisées et fréquences](docs/gammes.md)
- [Exporter un visuel pour Max for Live](docs/max-for-live.md)
- [Audio, MIDI Learn et notes envoyées à Ableton](docs/midi.md)
- [Dépannage des premiers essais](docs/depannage.md)
- [Connexion Ableton Link](docs/ableton-link.md)
- [Résolution, fluidité et plein écran](docs/performance.md)
- [Exporter une page web autonome](docs/export-web.md)
- [Bol de verre, collisions et lueurs](docs/bol-de-verre.md)
- [Organisation du code](docs/developpement.md)
- [Contribuer ou signaler un problème](CONTRIBUTING.md)
- [Derniers changements](CHANGELOG.md)
- [Historique détaillé livré avec l’extension](README.txt)
- [Guide rapide PDF](https://pilami.fr/wp-content/uploads/2026/10/Pilami-Strudel-Hydra-guide-rapide.pdf) — rédigé pour la version 0.39.3 ; les changements récents sont détaillés ici.

## Crédits et licence

L’extension annonce la licence **AGPL-3.0-or-later**. Le texte figure dans [LICENSE](LICENSE). Elle s’appuie notamment sur Strudel, Hydra, PixiJS / PixiUI, Acorn, hydra-midi et des extensions Hydra ; leurs auteurs, sources et licences sont conservés dans le dépôt et récapitulés dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Le Designer Pilami a été développé au cours de l’exploration d’ONDA ; les fonctions de conversion de code ont leurs limites décrites dans l’historique. Les composants tiers et les exemples portant une notice particulière conservent leurs propres conditions.
