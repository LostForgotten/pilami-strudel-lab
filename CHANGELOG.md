# Journal des versions

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
