# Premiers pas

Pour un premier essai guidé sans code, commence par [Ton premier visuel en dix minutes](demarrer.md). Cette page décrit ensuite les outils et les raccourcis.

Choisis un preset puis clique sur **Lecture / Update** ou utilise **Ctrl + Entrée**. Le choix d’un preset ne lance pas automatiquement la lecture. Dans Strudel, **Stop** arrête le son ; dans Hydra, applique les modifications avec Update.

Dans l’interface actuelle, le bouton Hydra se nomme **Lancer le visuel**, puis **Appliquer les modifications** pendant la lecture. « Hydra / Update » désigne cette même commande. **Mettre à jour le preset** est une sauvegarde WordPress distincte. Voir [presets et snapshots](presets-et-snapshots.md).

## Connexions en haut de page

- **Activer l’audio** ouvre l’entrée microphone/interface utilisée par les visuels réactifs. Tu peux le faire avant de lancer un visuel. La connexion reste active entre presets ; **Désactiver l’audio** libère l’entrée et ramène les bandes à zéro sans arrêter le visuel.
- **Activer le MIDI** autorise les contrôleurs et partage le même état que le panneau MIDI Learn. Les associations existantes sont conservées à la désactivation.
- **Connecter Link** rejoint le bridge local facultatif ; le bouton **Aide Link** explique son installation. Les états et le tempo restent visibles.

Les autorisations audio et MIDI sont demandées lorsque tu actives la fonction, pas à l’ouverture de la page. L’audio de cette barre est une entrée pour les visuels ; le volume de Strudel reste indépendant.

## Faire évoluer un visuel

Ouvre l’espace Hydra, choisis un preset puis lance-le. S’il expose des paramètres, les contrôleurs permettent de modifier le rendu en direct : sliders, potentiomètres et pads XY. Active l’entrée audio pour les presets qui utilisent le son et vérifie que la bonne source est reçue.

Le Designer permet d’explorer visuellement des chaînes Hydra. **Importer le code**, puis **Update**, importe les constructions reconnues ; un script JavaScript arbitraire ou un effet personnalisé peut dépasser les possibilités de conversion. Les contrôleurs du Designer et d’Hydra utilisent les mêmes paramètres quand le script est pris en charge.

## Retrouver une valeur et régler la résolution

Un **clic droit** sur un curseur, potentiomètre, fader, interrupteur ou sa valeur manuelle rappelle sa valeur au lancement du preset. Sur un pad XY, il rappelle les deux axes ensemble. Les bornes et pas actuels sont respectés, et les liaisons audio/MIDI restent actives. Relancer ou appliquer le code définit de nouvelles valeurs initiales à partir de ce code.

Le sélecteur **Résolution Hydra**, dans les réglages visuels et les fenêtres Code / Contrôleurs, change la taille du rendu sans modifier le script. Il reste fixe en plein écran et mémorise le choix sur ce navigateur. **Selon le preset** retrouve la taille prévue par le script. Voir [résolution et fluidité](performance.md).

## Bibliothèque de presets

La liste et la fiche **Preset sélectionné** sont réunies. Le menu **Trier par** propose les plus récents, les plus anciens et le nom ; le choix reste mémorisé. Le tri porte sur la date d’ajout du preset.

La fiche rassemble l’import, le partage et l’export du preset. Selon les droits WordPress, elle permet aussi de créer, mettre à jour ou supprimer un preset et de gérer ses catégories. L’import est également accessible en haut des fenêtres Hydra Code / Contrôleurs. Pour l’administrateur connecté, il utilise la sauvegarde WordPress habituelle, sans lancer automatiquement le visuel.

## Photos et Performance

Dans **Photos · importer et choisir une image**, importe tes photos et utilise-les dans un preset image, ou prépare un nouveau visuel **Image vivante**. Les photos restent dans ce navigateur ; leur publication dans la médiathèque WordPress demande une action explicite.

Le bouton **Performance ✦** ouvre le pad XY Pixi, quatre commandes réassignables et les snapshots graphiques. Choisis les axes du pad et les paramètres des grandes commandes. Sélectionne **Rappeler**, **Morpher** ou **Capturer**, puis un snapshot. Régler une durée et arrêter une transition reste possible. Les valeurs sont communes aux contrôleurs habituels, au MIDI et aux morphings. Le panneau s’ouvre dans la fenêtre de son bouton, reste visible en plein écran et son pad suit le glisser jusqu’au relâchement. Le clic droit réinitialise aussi ses curseurs et son pad.

Le [nuage de particules](../examples/Nuage-Particules-Pixi.hydra.txt) constitue un exemple à importer : ses contrôleurs règlent notamment l’opacité globale, la plage d’opacité aléatoire et sa vitesse d’évolution. Chaque particule évolue indépendamment.

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
| P | Lancer ou arrêter le visuel courant |

Les commandes fixes sont affichées au survol et dans **Raccourcis et écrans** :

| Raccourci | Action |
|---|---|
| Ctrl + Entrée / Cmd + Entrée | Appliquer le visuel ; dans l’éditeur Strudel, lancer la musique |
| Alt + . | Arrêter le visuel ; dans l’éditeur Strudel, arrêter la musique |
| Ctrl + I / Cmd + I | Importer un preset Hydra, depuis la page ou une fenêtre Hydra |

Les commandes Hydra restent disponibles dans le code Hydra. Les champs de nom et autres champs de saisie ordinaires restent protégés.

Dans la fenêtre **Hydra · Code**, l’éditeur reste visible sans plein écran. Le volet sous le code rassemble nom, photos, partage et catégories.

L’affectation automatique aux écrans dépend des capacités du navigateur et des permissions accordées. Utilise le bouton de plein écran proposé dans la fenêtre ou F11 si nécessaire. Le dock visuel démarre réduit ; déplie-le pour accéder aux commandes, au clavier et aux réglages.

Pour jouer sans réseau, exporte un nouveau **Pack VJ hors ligne** depuis Hydra. Les images et scripts distants personnalisés peuvent nécessiter une préparation supplémentaire ; teste le pack sans connexion avant une performance.
