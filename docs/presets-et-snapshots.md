# Garder ses presets, photos et variations

Un preset contient du code. Ses contrôleurs font varier le rendu ; ses snapshots retiennent plusieurs jeux de réglages. Une capture de snapshot n’est pas une photographie de l’animation.

## Trois boutons à distinguer

| Commande | Ce qu’elle fait |
|---|---|
| Lancer le visuel / Appliquer les modifications | Exécute le code dans le navigateur ; c’est « Hydra / Update » |
| Mettre à jour le code | Charge un nouveau fichier sur le preset sélectionné et prépare le transfert des réglages et snapshots compatibles |
| Mettre à jour le preset | Enregistre le code et le nom dans WordPress, avec la sauvegarde des réglages compatibles prévue par l’application |

Tester un code et l’enregistrer sur le site sont donc deux actions distinctes. Un message de réussite confirme la sauvegarde ; ne ferme pas la page si un message signale un échec ou des modifications en attente.

## Où sont les données ?

| Action | Emplacement / portée |
|---|---|
| Modifier les paramètres | Brouillon de ce navigateur |
| Sauvegarder sur ce navigateur | Essai local, propre à ce navigateur et à ce site |
| Capturer un snapshot | Banque locale du preset, tant qu’elle n’est pas sauvegardée dans WordPress |
| Enregistrer dans WordPress, dans les snapshots | Banque du preset WordPress, selon les droits et l’état de la session |
| Créer / Mettre à jour le preset | Preset enregistré sur le site, avec vérification après écriture |
| Exporter le preset | Fichier à garder ou à transférer ; ne remplace pas une sauvegarde complète du site |
| Importer une photo | Photothèque locale de ce navigateur |
| Enregistrer l’image dans WordPress | Image publiée dans la médiathèque, pour pouvoir partager le preset qui la référence |
| Exporter la page web | Une scène autonome ; ce n’est pas une sauvegarde de la bibliothèque et des dix snapshots |

Effacer les données du navigateur peut supprimer les essais et photos locaux. Pour changer d’ordinateur, conserve tes exports et sauvegarde les éléments nécessaires dans WordPress.

## Créer ou modifier un preset WordPress

Il faut un compte autorisé : le voyant vert confirme une connexion, pas à lui seul le droit de modifier le catalogue. Son survol précise les droits administrateur.

Pour un nouveau preset, indique son nom puis clique sur **Créer un preset WordPress**. L’import d’un fichier, en administrateur connecté, peut créer directement son entrée dans le catalogue. Consulte le message affiché avant de lancer le visuel.

Pour modifier un preset existant : sélectionne-le, ajuste le code ou le nom, puis clique sur **Mettre à jour le preset**. Le changement est enregistré sur ce même preset. Les catégories se règlent dans sa fiche ; valide leur modification avec leur commande dédiée.

## Remplacer le code sans refaire tous ses snapshots

1. Sélectionne le preset qui possède les variations à conserver.
2. Clique sur **Mettre à jour le code**, puis choisis la nouvelle version du fichier.
3. Clique sur **Mettre à jour le preset** pour appliquer le code et l’enregistrer dans WordPress. Pour un essai local, **Appliquer les modifications** permet aussi de tester la migration avant la sauvegarde.
4. Vérifie tes snapshots, les nouveaux contrôleurs et le message de sauvegarde.

Le transfert s’appuie sur les noms des contrôleurs compatibles. Renommer un contrôleur ou introduire plusieurs contrôleurs de même nom peut empêcher sa reprise. Les nouveaux paramètres utilisent les valeurs prévues par le nouveau code ; les paramètres supprimés ne sont pas recréés.

## Capturer et rappeler un snapshot

Un emplacement vide capture les réglages actuels. Un emplacement rempli les rappelle. Le bouton **Remplacer** réécrit une capture existante ; utilise un autre emplacement si tu veux la conserver.

La flèche **→** d’un snapshot fait un morphing depuis les réglages courants vers cette cible. **Durée (s)** fixe son temps et **Lissage auto** sa progression. La position d’une simulation de billes, les tourbillons d’un fluide ou les traces de feedback ne sont généralement pas capturés : seuls leurs paramètres le sont.

Pour conserver la banque sur le site, utilise **Enregistrer dans WordPress** dans le panneau des snapshots. Ce bouton nécessite un preset WordPress reconnu et les droits nécessaires. **Charger la version WordPress** remplace la copie locale par la banque enregistrée ; lis la confirmation avant de remplacer des captures locales.

## Utiliser sa propre photo

1. Charge un preset qui accepte une image.
2. Dans **Photos · importer et choisir une image**, clique sur **Importer des photos…**.
3. Clique sur **Utiliser** sous la photo.
4. Clique sur **Appliquer les modifications / Hydra Update** : « Utiliser » modifie le code, mais ne recharge pas à lui seul le visuel. Les contrôleurs peuvent disparaître jusqu’à cette réapplication.
5. Pour partager ce preset, clique sur **Enregistrer l’image dans WordPress**, applique à nouveau le code, puis enregistre le preset.

Si **Utiliser** n’est pas proposé, le script n’expose peut-être pas d’image compatible. **Nouveau visuel** permet alors de démarrer une scène Image vivante avec cette photo. Les paramètres de fond, de reflet ou d’exposition dépendent ensuite du preset choisi.
