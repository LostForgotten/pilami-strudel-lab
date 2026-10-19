# Pilami Strudel Lab

Un laboratoire de création musicale et visuelle dans le navigateur, intégré à WordPress : **Strudel pour le son, Hydra pour l’image**, avec un Designer visuel, des contrôleurs MIDI et un séquenceur de variations.

Développé pour [pilami.fr/strudel](https://pilami.fr/strudel/), au fil d’essais musicaux et de sessions de VJing.

**Version actuelle : 0.39.48 — projet en développement.**

## Ce que l’on peut faire

- Écrire et jouer des patterns Strudel, charger des presets et conserver ses essais.
- Créer des visuels Hydra, les rendre réactifs au son et explorer des presets.
- Manipuler les visuels avec des sliders, potentiomètres et pads XY, ouvrir le panneau Performance basé sur PixiJS / PixiUI, et retrouver les valeurs initiales au clic droit.
- Choisir la résolution de rendu, du 640 × 360 au Full HD, sans éditer le code et en conservant la taille choisie en plein écran.
- Importer et conserver ses photos dans le navigateur pour créer des visuels et alimenter les presets image.
- Construire et importer des chaînes Hydra dans le Designer visuel, dans les limites des fonctions prises en charge.
- Associer un appareil MIDI aux paramètres, corriger les associations et lisser les mouvements.
- Capturer jusqu’à dix snapshots, rappeler une variation ou réaliser un morphing entre réglages.
- Séquencer ces variations sur une grille de 16 ou 32 pas, avec remplissage aléatoire et synchronisation Ableton Link facultative.
- Détacher le visuel, le code et les contrôleurs dans des fenêtres, et configurer des raccourcis pour plusieurs écrans.
- Exporter un Pack VJ hors ligne depuis l’interface Hydra.
- Gérer les presets Hydra, leur apparence et les banques de snapshots dans WordPress, selon les droits de l’utilisateur.

## Nouveautés de la version 0.39.48

- **Finesse et fluidité** : sélecteur Résolution Hydra dans les réglages visuels et les fenêtres Code / Contrôleurs. Choix immédiat, conservé sur ce navigateur pour tous les presets ; Selon le preset retrouve la résolution du script.
- **Clic droit** : retour à la valeur du contrôleur au lancement du preset, ou aux deux valeurs initiales d’un pad XY, en conservant les liaisons audio et MIDI.
- **Fenêtres** : code visible dès l’ouverture, Performance dans la fenêtre de son bouton et glisser continu sur son pad, y compris en plein écran.
- **Bibliothèque** : fiche de preset compacte, partage et import à proximité, création/suppression des catégories et tri du plus récent au plus ancien.
- **Hors ligne** : mêmes améliorations dans les nouveaux Packs VJ exportés.

Voir le [guide de résolution et de fluidité](docs/performance.md) et le [journal des versions](CHANGELOG.md).

## Essayer

Ouvre **[l’application sur pilami.fr](https://pilami.fr/strudel/)**. Choisis un preset puis lance **Lecture / Update** ou **Ctrl + Entrée**. Choisir un preset charge son code sans lancer automatiquement sa lecture.

En haut du laboratoire, active **Audio**, **MIDI** ou **Link** selon tes besoins. L’audio sert d’entrée aux visuels réactifs et peut être activé avant le premier visuel. **P** lance ou arrête le visuel ; **Ctrl + I** ouvre l’import d’un preset Hydra. Les boutons indiquent leurs raccourcis au survol.

Le site fonctionne sans passerelle Ableton. L’audio, le MIDI et certaines fonctions d’affichage nécessitent les autorisations du navigateur.

## Installer dans WordPress

1. Récupère le ZIP installable `pilami-strudel-lab-v0.39.48.zip` lorsqu’il est fourni avec une version.
2. Dans WordPress : **Extensions → Ajouter une extension → Téléverser une extension**.
3. Installe et active **Pilami Strudel Lab** ; pour une mise à jour, accepte le remplacement de l’extension existante.
4. Ajoute un bloc **Code court** à une page avec `[pilami_strudel]`.
5. Publie la page et ouvre-la dans un navigateur récent avec Web Audio et WebGL.

Pour fabriquer le ZIP à partir des sources, lance `python3 scripts/build_plugin.py` à la racine du dépôt. Le résultat se trouve dans `dist/`.

Le dépôt contient le code de l’extension. Les presets, images et réglages enregistrés dans la base de données de pilami.fr ne constituent pas une sauvegarde incluse dans ce dépôt. Certaines ressources personnalisées pointent encore vers la médiathèque de pilami.fr ; consulte le [guide d’installation](docs/installation.md).

## Exemple de preset Pixi

Le [nuage de particules réactives](examples/Nuage-Particules-Pixi.hydra.txt) combine Pixi et Hydra : mouvement, couleurs, réaction au son et opacité aléatoire évoluant indépendamment pour chaque particule. Télécharge le fichier texte puis importe-le dans Hydra avec **Ctrl + I**. Il utilise la bibliothèque Pixi embarquée, sans chargement depuis un CDN.

## Ableton Link : le projet compagnon

**[Pilami Link Bridge](https://github.com/LostForgotten/pilami-link-bridge)** relie l’horloge Ableton Link à l’interface du navigateur. Il possède son propre dépôt et sa version portable Windows.

Il transmet tempo, phase et état de transport au navigateur. Les commandes du séquenceur visuel ne pilotent pas le transport de Live. La synchronisation visuelle dépend du navigateur ; elle n’est pas précise à l’échantillon audio près.

Voir [la connexion Ableton Link](docs/ableton-link.md). La copie présente dans `tools/ableton-link-bridge/` est conservée avec cette version de l’extension ; le dépôt compagnon est le point d’entrée pour installer le bridge et suivre ses versions.

## Documentation

- [Installation et mises à jour](docs/installation.md)
- [Premiers pas et raccourcis](docs/premiers-pas.md)
- [Connexion Ableton Link](docs/ableton-link.md)
- [Résolution, fluidité et plein écran](docs/performance.md)
- [Organisation du code](docs/developpement.md)
- [Contribuer ou signaler un problème](CONTRIBUTING.md)
- [Derniers changements](CHANGELOG.md)
- [Historique détaillé livré avec l’extension](README.txt)
- [Guide rapide PDF](https://pilami.fr/wp-content/uploads/2026/10/Pilami-Strudel-Hydra-guide-rapide.pdf) — rédigé pour la version 0.39.3 ; les changements récents sont détaillés ici.

## Crédits et licence

L’extension annonce la licence **AGPL-3.0-or-later**. Le texte figure dans [LICENSE](LICENSE). Elle s’appuie notamment sur Strudel, Hydra, PixiJS / PixiUI, Acorn, hydra-midi et des extensions Hydra ; leurs auteurs, sources et licences sont conservés dans le dépôt et récapitulés dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Le Designer Pilami a été développé au cours de l’exploration d’ONDA ; les fonctions de conversion de code ont leurs limites décrites dans l’historique. Les composants tiers et les exemples portant une notice particulière conservent leurs propres conditions.
