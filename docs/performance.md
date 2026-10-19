# Résolution et fluidité des visuels

Un shader fluide dans un petit panneau peut devenir plus coûteux en plein écran si sa résolution de calcul augmente. La taille d’affichage et la taille du rendu peuvent être différentes : on peut calculer en 1280 × 720 tout en remplissant un écran 1920 × 1080.

## Choisir la résolution

Depuis la version 0.39.48, le sélecteur **Résolution Hydra** est disponible :

- dans les réglages visuels : déplier **▤**, puis ouvrir **⚙** ;
- en haut des fenêtres **Hydra · Code** et **Hydra · Contrôleurs** ;
- dans l’en-tête du **Pack VJ hors ligne** et ses fenêtres détachées.

| Choix | Utilisation |
|---|---|
| Selon le preset | Utilise la dernière résolution demandée par le script ; suit la fenêtre si aucune taille n’est définie |
| 640 × 360 | Rendu léger, utile pour tester un effet coûteux |
| 800 × 450 | Taille de départ de plusieurs presets volumétriques |
| 960 × 540 | Résolution intermédiaire |
| 1280 × 720 | Rendu HD |
| 1920 × 1080 | Rendu Full HD, plus coûteux |

Le changement s’applique immédiatement. Les différents sélecteurs se synchronisent et indiquent la résolution en cours. Le choix est conservé dans ce navigateur pour tous les presets, y compris après un rechargement. Il peut être préparé avant de lancer un visuel.

Une résolution manuelle est prioritaire sur les appels `setResolution` du script. Revenir à **Selon le preset** rétablit sa taille demandée. Le code, les contrôleurs, les liaisons MIDI et les snapshots restent inchangés ; cette préférence d’affichage n’est pas un paramètre de snapshot ou une modification du preset WordPress.

## Plein écran

Depuis la version 0.39.46, un preset qui définit par exemple `setResolution(800, 450)` conserve cette taille quand la fenêtre grandit. Le sélecteur permet de la remplacer sans éditer le code. Le rendu reste à la taille choisie en plein écran, au redimensionnement et au changement d’écran.

Passer de 800 × 450 à 1920 × 1080 représente 5,76 fois plus de pixels par image. Un effet volumétrique ou fractal répète son calcul pour chaque pixel ; une résolution inférieure peut donc permettre de conserver sa fluidité, avec une image moins fine.

Changer la taille réalloue les textures de rendu Hydra et peut réinitialiser les traces de feedback. Pour un passage important pendant une performance, essayer le changement à l’avance.

## Si le visuel ralentit

1. Comparer le même preset en 800 × 450, puis en 1280 × 720.
2. Si nécessaire, réduire les paramètres propres au preset : qualité, étapes de calcul, plis, nombre de particules ou définition interne.
3. Dans Firefox, ouvrir `about:support` et lire **Accélération graphique → Pilote WebGL → Rendu** pour identifier le GPU réellement utilisé. Sur une machine à plusieurs cartes, vérifier que c’est le GPU attendu.
4. Comparer la même résolution sur l’écran principal et l’écran de projection. Si le problème reste limité à un écran ou au plein écran, conserver ces informations pour le diagnostic.

Les presets utilisant un moteur de rendu supplémentaire peuvent avoir leur propre contrôleur **Définition**. Le sélecteur global règle le rendu Hydra ; il ne remplace pas automatiquement cette seconde résolution interne.

La fluidité dépend du shader, de la résolution, du navigateur et de la machine. Aucun réglage unique ne garantit le même nombre d’images par seconde sur tous les presets.
