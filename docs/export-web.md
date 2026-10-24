# Exporter un visuel en page web autonome

Depuis la version 0.39.51, un preset Hydra lancé peut être exporté dans un seul fichier HTML. Le navigateur du visiteur calcule l’animation : aucun WordPress ni serveur de rendu n’est nécessaire pour lire cette page.

## Choisir le rendu

1. Charge et lance ton preset avec **Hydra / Update**.
2. Rappelle le snapshot voulu, attends la fin du morphing si tu veux son état final, puis affine les contrôleurs.
3. Choisis la résolution dans le sélecteur Hydra.
4. Clique sur **Exporter la page web**, dans la fiche du preset ou la fenêtre Hydra · Code / Contrôleurs.
5. Ouvre le fichier HTML téléchargé pour vérifier son rendu.

L’export capture les valeurs de base des contrôleurs au moment du clic. La résolution de calcul reste fixe, même si le visiteur agrandit la fenêtre ou passe en plein écran. La page adapte l’affichage en conservant ses proportions.

## Mettre la page en ligne

Renomme le fichier en `index.html`, puis place-le dans un dossier public de ton hébergement, par exemple `visuels/ma-scene/index.html`. La page sera accessible à l’adresse `https://ton-domaine.example/visuels/ma-scene/`.

Avec WordPress, utilise les fichiers du serveur ou le gestionnaire de fichiers de l’hébergeur. Place le dossier `visuels` dans la racine web réellement servie pour ce domaine, généralement à côté de `wp-admin`, `wp-content` et `wp-includes`. Coller le HTML dans un bloc WordPress ne publie pas cette page autonome. Un téléversement en médiathèque ne crée pas cette arborescence.

Si WordPress affiche sa page « introuvable », vérifie que `visuels/ma-scene/index.html` existe bien dans cette racine, que le serveur peut le lire et que l’URL `/visuels/ma-scene/index.html` fonctionne. Avec la configuration Apache habituelle de WordPress, les fichiers et dossiers existants ne sont pas réécrits vers `index.php`. Une configuration de proxy ou de serveur personnalisée peut demander un réglage supplémentaire.

Avec Docker, utilise le dossier ou volume persistant monté dans le serveur web. Un ancien dossier de site statique peut ne plus être servi depuis une migration vers WordPress. Le montage conservé dans la configuration Docker permet de garder le fichier lors des recréations du conteneur.

Pour publier une nouvelle variation à la même adresse, réexporte le visuel puis remplace ce seul `index.html`. Recharge sans cache ou purge le cache de cette URL si l’ancien rendu reste affiché.

## Lecture et son

- **Espace** met en pause ou reprend le visuel ; **F** demande le plein écran.
- Les commandes s’effacent après quelques secondes et reviennent au mouvement ou au clavier.
- Les entrées FFT restent à zéro. La page ne demande ni micro ni appareil MIDI ; une modulation audio extérieure n’est donc pas reproduite.
- Pour le bol de billes, les sons de collision exportés nécessitent un clic du visiteur sur **Activer le son**. Le bouton apparaît si `Son_Collisions` était activé lors de l’export.
- Un snapshot mémorise des réglages. Les positions physiques des billes et l’état exact d’une simulation ne sont pas figés : ils se recalculent à l’ouverture.

## Contenu et limites

Le fichier contient le code du preset choisi, ses réglages, les images qu’il référence et le moteur nécessaire. Les autres presets, catégories, banques de snapshots, associations MIDI et identifiants WordPress ne sont pas inclus. Le code et les images de la scène exportée sont publics, comme tout contenu servi dans une page web.

Les images locales référencées sont embarquées. Une image distante doit pouvoir être téléchargée par le navigateur ; un blocage CORS peut empêcher l’export. Les extensions Hydra locales color/noise/fractals/blend sont prises en charge. Les imports distants, captures caméra/écran et sources vidéo sont refusés avec un message explicite. Tous les presets et moteurs externes ne sont donc pas compatibles.

Le bouton **Infos** permet de télécharger les sources et licences incluses. Conserve les crédits et vérifie les conditions propres aux œuvres que tu publies.

Voir aussi le [bol de billes](bol-de-verre.md) et le [guide de fluidité](performance.md).
