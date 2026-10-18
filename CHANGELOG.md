# Journal des versions

## 0.39.37 — connexions et import au clavier

- Audio, MIDI et Link regroupés en tête du laboratoire, avec activation/désactivation et états visibles.
- Entrée audio activable avant le premier visuel, conservée entre presets ; désactivation qui libère l’entrée et remet les bandes à zéro.
- Titre et marges supérieurs Blocksy retirés sur les seules pages du laboratoire, navigation compactée.
- Ctrl + I / Cmd + I ouvre l’import d’un preset Hydra depuis la page ou les fenêtres Hydra ; indication au survol.
- Pack VJ hors ligne actualisé avec la barre de connexion et l’import au clavier.

## 0.39.36 — lecture du visuel au clavier

- P lance ou arrête le visuel ; touche personnalisable et ignorée pendant la saisie.
- Ctrl + Entrée applique le visuel ; Alt + . l’arrête, y compris dans les fenêtres Hydra.
- Raccourcis indiqués au survol et actualisés lorsque les touches changent.

## 0.39.35 — interface Studio

- Habillage commun des panneaux, contrôleurs, outils et fenêtres détachées.
- Correction de la lisibilité des options Performance sur fond sombre.
- Palettes personnalisées et modes clair/sombre conservés.

## 0.39.34 — panneau Performance Pixi

- Pad XY graphique avec choix des axes et quatre commandes réassignables.
- Snapshots graphiques avec rappel, capture et morphing, durée et arrêt de transition.
- Synchronisation avec les contrôleurs, le MIDI et les transitions ; bibliothèques embarquées et sources de compilation incluses.
- Exemple de nuage de particules Pixi, avec opacité individuelle animée, disponible dans `examples/`.

## 0.39.33 — contrôleurs en fenêtre

- Disposition fluide et largeur disponible utilisée en plein écran.
- Photos et réglages du preset regroupés dans un panneau replié par défaut.
- Une seule zone de défilement, avec commandes toujours accessibles.

## 0.39.32 — photos et photothèque locale

- Import, choix et conservation des photos dans le navigateur.
- Création d’un visuel Image vivante avec contrôleurs et réaction au son.
- Remplacement de l’image d’un preset et inclusion des photos locales dans le Pack VJ.
- Publication en médiathèque WordPress seulement sur demande explicite.

## 0.39.31 — version de départ du dépôt

- Panneaux Snapshots, séquenceur et MIDI accessibles dès l’ouverture d’Hydra, même sans contrôleur.
- Capture de snapshot désactivée si aucun paramètre ne peut être mémorisé.
- Raccourci V pour parcourir Panneau → Fenêtre séparée → Fond, configurable et ignoré pendant la saisie.
- Comportement partagé entre le raccourci, les fenêtres détachées et le bouton Visuels.

La préparation du dépôt ajoute une présentation, des guides, les notices de licence à la racine et des outils de vérification/fabrication du ZIP. Les fichiers de l’extension 0.39.31 sont conservés sans modification fonctionnelle.

## 0.39.30

- Clic gauche : case vide → Rappel ; Rappel → vide ; Morphing → Rappel.
- Clic droit : case vide → Morphing ; Morphing → vide ; Rappel → Morphing.

## 0.39.29

- Placement des rappels et morphings au clic.
- Remplissage Random avec densité de 0 à 100 %, conservée dans le navigateur.

## 0.39.28

- Aide Link et téléchargement du bridge accessibles dans la barre principale.

## 0.39.27

- Séquenceur piloté aussi par les messages de l’horloge Link en arrière-plan.
- Recalage après suspension sans rejouer en rafale les déclenchements dépassés.
- Meilleure tolérance des reconnexions courtes.

Les notes plus anciennes figurent dans [README.txt](README.txt) et l’historique intégré est défini dans `includes/version-history.php`. Ce dépôt commence par un import de la version actuelle : les anciennes versions ne possèdent pas encore chacune leur tag GitHub.
