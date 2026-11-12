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

## Exporter et réimporter un preset

| Commande | Contenu du TXT |
|---|---|
| Exporter le preset | Code, contrôleurs, gammes et liaisons audio, dix emplacements de snapshots et réglages de morphing |
| Exporter le preset complet | Même contenu, plus associations MIDI (notes, CC, canaux et inversion), lissage, réglages de sortie MIDI et grille du séquenceur |

1. Prépare tes réglages et captures, puis choisis l’export souhaité. Aucun compte administrateur n’est nécessaire.
2. Sur l’autre navigateur, importe le `.hydra.txt` avec **Ctrl + I**.
3. Clique sur **Hydra / Update**. Pour un export complet, coche les éléments à restaurer : audio, snapshots, MIDI, séquenceur. **Annuler** interrompt la restauration. Pour un TXT standard avec snapshots, une confirmation propose de reprendre ses captures.
4. Vérifie les associations et sélectionne les périphériques MIDI et l’entrée audio disponibles. La grille restaurée reste arrêtée et la sortie MIDI n’est pas activée par la restauration.

Les éléments sélectionnés remplacent ceux de ce preset dans ce navigateur. La publication WordPress reste une action séparée ; l’import administrateur peut déjà avoir créé l’entrée du preset avant son lancement. Les anciens TXT sans données de restauration restent compatibles.

Les fichiers restent du code JavaScript : les données de restauration sont dans des commentaires structurés. Les commentaires JavaScript ordinaires sont retirés lors de l’export, tandis que les mentions de licence et données de restauration sont conservées. Le code de l’éditeur n’est pas modifié. Les chaînes de caractères, URL et textes GLSL intégrés restent inchangés : ce nettoyage ne remplace pas la vérification des ressources que tu souhaites partager.

Le TXT ne contient pas les médias référencés par une URL, les sons enregistrés, les autorisations du navigateur ni l’état physique instantané d’une simulation. Conserve les images nécessaires ou choisis le Pack VJ pour un usage hors ligne. Les anciens Packs VJ déjà exportés conservent leur version d’origine.

## Stockage local et rechargement

Les brouillons et essais Hydra, puis les banques de snapshots et leurs associations MIDI, utilisent **IndexedDB**. La migration conserve une copie de récupération et retire l’ancienne entrée localStorage uniquement après une écriture réussie. Cela évite que **Recharger le preset** échoue lorsque l’ancien quota est atteint.

**Recharger le preset** restaure le code, les snapshots et le MIDI enregistrés pour ce preset. Les captures locales non enregistrées de ce preset sont remplacées ; les banques des autres presets restent en place. Les données du navigateur restent propres à la machine et ne constituent pas une sauvegarde WordPress.

## Noter et retrouver ses presets

Un administrateur peut noter un preset de **1 à 5 étoiles**, ou retirer sa note. Les visiteurs voient les notes. Dans le tri, **0 étoile** sélectionne les presets sans note ; les autres filtres sélectionnent exactement la note choisie. Ces filtres se combinent avec la catégorie et la recherche. Le tri **Mieux notés** affiche les meilleures notes en premier.

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
