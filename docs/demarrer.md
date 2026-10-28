# Ton premier visuel en dix minutes

Tu n’as pas besoin de savoir programmer. Commence avec un preset existant, puis ajuste ses contrôleurs. Ableton, le MIDI et le Designer peuvent attendre.

## 1. Ouvrir le laboratoire

Va sur [pilami.fr/strudel](https://pilami.fr/strudel/), ou sur la page du laboratoire de ton installation WordPress.

Deux espaces cohabitent : **Musique / Strudel** et **Visuels / Hydra**. Pour travailler uniquement l’image, clique sur **Masquer la musique**. Cela masque le panneau ; pour couper une musique déjà lancée, utilise **Arrêter la musique**.

Sur le site, la petite icône en haut à droite du labo ouvre la navigation et la recherche. Le voyant vert indique une connexion WordPress confirmée ; au survol, il précise les droits administrateur. Ce compte n’est pas nécessaire pour simplement essayer un visuel.

## 2. Choisir et lancer un visuel

1. Dans **Visuels / Hydra**, choisis une catégorie ou utilise **Rechercher**.
2. Clique sur un preset pour charger son code.
3. Clique sur **Lancer le visuel**.
4. Le bouton devient **Appliquer les modifications** pendant la lecture. Il correspond aussi à ce que les presets et anciens guides appellent « Hydra / Update ».

**Choisir un preset ne lance pas automatiquement sa lecture.** Le raccourci **Ctrl + Entrée** permet aussi de l’appliquer depuis Hydra.

Sur une nouvelle installation, le catalogue peut être différent de celui de pilami.fr. Tu peux télécharger un [exemple du dépôt](../examples/Nuage-Particules-Pixi.hydra.txt), puis utiliser **Importer un preset** ou **Ctrl + I** et lancer le visuel. Pour télécharger depuis GitHub, ouvre le fichier puis utilise son bouton de téléchargement, plutôt que d’enregistrer la page web qui l’entoure.

## 3. Faire varier le résultat

Si le preset contient des contrôleurs, ils apparaissent après son lancement. Bouge un curseur, saisis une valeur dans son champ ou déplace le point d’un pad XY.

- Un **clic droit** sur un contrôleur rappelle sa valeur au lancement du preset.
- Les bornes min/max et la saisie manuelle permettent d’affiner un réglage.
- Le bouton **Random** explore des variations ; commence avec une faible puissance après avoir capturé un snapshot.
- **Performance ✦** propose une autre présentation des mêmes valeurs : le pad et les grandes commandes ne constituent pas une seconde copie du preset.

Certains presets n’ont aucun contrôleur ; cela ne signifie pas qu’ils ont échoué.

## 4. Garder deux variations

1. Règle le visuel à ton goût.
2. Dans les snapshots, clique sur un emplacement vide : **Snapshot 1 · Capturer**.
3. Modifie quelques paramètres, puis capture **Snapshot 2**.
4. Clique sur un snapshot rempli pour retrouver instantanément ses réglages.
5. Règle **Durée (s)**, par exemple à 4 secondes, puis utilise la flèche **→** du snapshot cible pour faire évoluer les réglages actuels vers lui.

Le panneau **Lissage auto** permet un départ doux, une arrivée douce ou les deux. Les dix emplacements appartiennent au preset courant.

**Capturer n’enregistre pas automatiquement ta variation dans WordPress.** Pour la retrouver sur un autre ordinateur, suis le [guide des sauvegardes](presets-et-snapshots.md).

## 5. Ajouter le son, si tu le souhaites

Clique sur **Activer l’audio**, autorise l’entrée dans le navigateur et envoie du son dans la source choisie. Un preset préparé pour l’audio peut alors réagir aux basses, aux médiums ou aux aigus.

Ce bouton **reçoit** du son pour analyser le visuel. Il ne lance pas une musique et ne transforme pas tous les presets en effets audio réactifs. Le bouton de lecture de Strudel reste indépendant.

Si rien ne réagit, consulte [Audio et MIDI](midi.md) puis [Dépannage](depannage.md).

## 6. Passer sur un grand écran

Choisis d’abord une résolution modeste : **640 × 360** ou **800 × 450**. Augmente ensuite vers **1280 × 720** si la fluidité le permet.

Le raccourci **F** demande le visuel en plein écran ; **G** ouvre les contrôleurs Hydra et **H** le code Hydra dans leurs fenêtres en plein écran. Autorise les fenêtres pop-up du site si le navigateur les bloque. Les raccourcis peuvent être personnalisés ; ils sont protégés pendant la saisie dans les champs ordinaires.

Si la fenêtre séparée est ouverte mais pas en plein écran, clique dedans puis utilise le bouton plein écran ou **F11**. Voir le [guide de fluidité](performance.md).

## 7. Terminer l’essai

- **Arrêter le visuel** stoppe son animation. Le dernier rendu peut rester affiché.
- **Arrêter la musique** coupe Strudel séparément.
- **Désactiver l’audio** libère l’entrée utilisée pour les visuels.
- Pour partager un rendu précis, rappelle ton snapshot puis utilise **Exporter la page web**. Le [guide d’export](export-web.md) explique aussi la miniature pour les réseaux sociaux.
