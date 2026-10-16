# Premiers pas

Choisis un preset puis clique sur **Lecture / Update** ou utilise **Ctrl + Entrée**. Le choix d’un preset ne lance pas automatiquement la lecture. Dans Strudel, **Stop** arrête le son ; dans Hydra, applique les modifications avec Update.

## Faire évoluer un visuel

Ouvre l’espace Hydra, choisis un preset puis lance-le. S’il expose des paramètres, les contrôleurs permettent de modifier le rendu en direct : sliders, potentiomètres et pads XY. Active l’entrée audio pour les presets qui utilisent le son et vérifie que la bonne source est reçue.

Le Designer permet d’explorer visuellement des chaînes Hydra. **Importer le code**, puis **Update**, importe les constructions reconnues ; un script JavaScript arbitraire ou un effet personnalisé peut dépasser les possibilités de conversion. Les contrôleurs du Designer et d’Hydra utilisent les mêmes paramètres quand le script est pris en charge.

## Snapshots et séquenceur

Les panneaux Snapshots, séquenceur et MIDI sont accessibles dès l’ouverture d’Hydra en 0.39.31. Il faut un visuel avec au moins un contrôleur pour capturer une variation utile.

1. Règle les paramètres et capture un snapshot.
2. Modifie les paramètres puis capture une autre variation.
3. Utilise un rappel pour retrouver directement les valeurs, ou un morphing pour les faire évoluer progressivement.
4. Ouvre le séquenceur pour placer les déclenchements dans la grille.

| Case de la grille | Clic gauche | Clic droit |
|---|---|---|
| Vide | Rappel | Morphing |
| Rappel | Retirer | Passer en Morphing |
| Morphing | Passer en Rappel | Retirer |

Seuls les snapshots déjà capturés peuvent être séquencés. Le bouton Random remplit la grille selon la densité choisie. Sans Link, le séquenceur utilise son BPM interne ; avec le bridge, il peut suivre l’horloge Link.

## Utiliser un contrôleur MIDI

Dans **Contrôler avec un appareil MIDI**, active le MIDI puis choisis l’entrée et le canal. Clique sur le logo MIDI Learn du paramètre voulu et manipule ton contrôleur. Le logo clignote pendant l’apprentissage.

Pour un pad XY qui envoie deux CC ensemble, attribue les CC manuellement à X et Y. Le menu **Associations → Modifier** permet de corriger une liaison. Le lissage rend plus continus les mouvements des pads, faders et potentiomètres ; il ne transforme pas les boutons en commandes progressives.

## Organiser les fenêtres

Les raccourcis ci-dessous sont les valeurs initiales ; le panneau **Raccourcis et écrans** permet de les changer. Ils sont ignorés pendant la saisie dans les champs.

| Touche | Action |
|---|---|
| F | Afficher le visuel en plein écran, avec écran cible configurable |
| G | Afficher les contrôleurs Hydra en plein écran |
| H | Afficher le code Hydra en plein écran |
| J | Afficher ou masquer le séquenceur |
| K | Lancer ou arrêter le séquenceur |
| V | Passer de Panneau à Fenêtre séparée puis Fond |

L’affectation automatique aux écrans dépend des capacités du navigateur et des permissions accordées. Utilise le bouton de plein écran proposé dans la fenêtre ou F11 si nécessaire. Le dock visuel démarre réduit ; déplie-le pour accéder aux commandes, au clavier et aux réglages.

Pour jouer sans réseau, exporte un nouveau **Pack VJ hors ligne** depuis Hydra. Les images et scripts distants personnalisés peuvent nécessiter une préparation supplémentaire ; teste le pack sans connexion avant une performance.
