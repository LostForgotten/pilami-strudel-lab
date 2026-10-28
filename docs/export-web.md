# Partager un visuel en page web

L’export fabrique une scène autonome. Le navigateur du visiteur calcule son animation : il n’a pas besoin de WordPress, du laboratoire complet ni de ton compte. Tu peux proposer jusqu’à deux contrôleurs pour qu’il joue avec le rendu.

## 1. Préparer la scène

1. Charge et lance le preset dans Hydra.
2. Rappelle le snapshot voulu et attends la fin du morphing, puis affine les paramètres si nécessaire.
3. Choisis une résolution adaptée, par exemple **1280 × 720**. Sur une machine moins puissante, commence plus bas.
4. Dans la fiche du preset ou une fenêtre Hydra Code / Contrôleurs, clique sur **Exporter la page web**.

Le formulaire capture les valeurs de base des contrôleurs et la résolution. Une simulation vivante recommence son calcul à l’ouverture : la position exacte des billes, d’un fluide ou du feedback n’est pas une image figée dans le fichier.

## 2. Choisir ce que le visiteur verra

Renseigne le **Titre** et la **Description**. Dans **Contrôleur 1** et **Contrôleur 2**, laisse **Aucun** pour une scène sans réglages, ou choisis un ou deux paramètres distincts.

Le visiteur retrouvera leurs valeurs de départ, leurs bornes et leur pas dans le menu **Réglages**. Ses changements restent propres à sa visite : ils ne réécrivent ni ton preset ni WordPress. Recharger la page restaure les valeurs exportées.

## 3. Télécharger un HTML ou un ZIP de partage

| Besoin | Choix dans le formulaire | Fichiers obtenus |
|---|---|---|
| Lire ou publier simplement la scène | Télécharger le HTML | Un fichier `.html` autonome |
| Préparer une miniature pour Facebook ou un autre réseau | Cocher **Préparer une miniature pour Facebook et les réseaux sociaux** et indiquer l’adresse publique finale | Un ZIP avec le HTML, un JPEG et `LISEZ-MOI.txt` |

L’adresse publique est l’endroit où tu vas déposer la page, par exemple `https://ton-domaine.example/visuels/ma-scene/`. L’export prépare les fichiers ; il ne les téléverse pas sur ton hébergement.

La capture produit une miniature de **1200 × 630**, avec les proportions conservées. **Capturer maintenant** permet d’actualiser son aperçu ; la miniature finale est capturée au téléchargement. Le JPEG reçoit un nom comme `apercu-1234abcd.jpg`.

Les balises de titre, description et image sont présentes dans le HTML dès son chargement. Le réseau social n’a pas besoin de lancer l’animation pour lire ces informations.

## 4. Mettre les fichiers en ligne

Pour un HTML seul, renomme-le en `index.html`. Dépose-le dans un dossier public, par exemple :

```text
visuels/ma-scene/index.html
```

Avec le ZIP de partage, décompresse-le et dépose **le HTML et son JPEG ensemble**, aux noms fournis, dans le dossier correspondant à l’adresse renseignée. N’envoie pas seulement le ZIP à la médiathèque WordPress et ne renomme pas le JPEG sans adapter le HTML.

Utilise le gestionnaire de fichiers de l’hébergement ou les fichiers du serveur. Pour un WordPress classique, la racine web est généralement le dossier contenant `wp-admin`, `wp-content` et `wp-includes`. Un ancien dossier de site statique peut ne plus être servi après une migration.

Teste ensuite l’adresse publique dans un autre onglet. Si WordPress répond « page introuvable », essaie directement `/visuels/ma-scene/index.html` et vérifie le dossier réellement servi. Le serveur peut avoir une configuration de réécriture particulière.

Sur un hébergement en conteneurs, dépose les fichiers dans le stockage persistant réellement monté dans le serveur web. Le guide de ton hébergeur ou de ton installation indique ce dossier ; ce dépôt ne contient pas de configuration privée d’hébergement.

## 5. Utiliser la page exportée

Au départ, seule l’icône de menu est visible en bas à droite. Elle donne accès à :

- la pause / reprise et au plein écran ;
- **Résolution du rendu** : origine, 640 × 360, 800 × 450, 1280 × 720 ou 1920 × 1080 ;
- **Réglages**, si tu as proposé des contrôleurs ;
- **Infos**, avec les liens du laboratoire, du dépôt et le téléchargement des sources et licences.

Un clic extérieur ou **Échap** referme le menu. **Espace** met en pause ou reprend ; **F** demande le plein écran. Le choix de résolution reste fixe pendant le plein écran et les redimensionnements. Recharger la page rétablit la résolution d’origine.

Une taille inférieure allège le calcul. Changer de résolution peut réinitialiser le feedback Hydra ; certaines simulations conservent leur propre état.

## Son, images et sources

Les entrées FFT restent à zéro : l’export ne demande ni micro ni MIDI. Le son extérieur utilisé pendant ta préparation n’est donc pas enregistré ni reproduit.

Un preset qui génère lui-même du son peut demander un clic du visiteur. Pour le bol de billes, **Activer le son** est proposé si `Son_Collisions` était activé lors de l’export. Ce comportement ne garantit pas que tous les moteurs sonores personnalisés soient compatibles.

Les photos locales référencées par le preset sont embarquées. Pour une image distante, le navigateur doit pouvoir la télécharger ; un blocage d’accès intersites (CORS) peut empêcher l’export. Les imports distants et les sources caméra, écran ou vidéo non pris en charge sont refusés avec un message.

Le fichier contient le preset sélectionné et les ressources nécessaires ; il n’embarque pas toute la bibliothèque, les dix snapshots, les associations MIDI ou les identifiants WordPress. Son code et ses images sont publics comme le reste d’une page web.

**Télécharger les sources et licences (.json)** fournit une archive de textes et de crédits destinée à consulter le code et ses conditions de réutilisation. Ce JSON n’est ni un second fichier à mettre en ligne pour faire jouer la scène, ni un preset à importer directement dans Hydra. Conserve les crédits des auteurs.

## Actualiser une scène déjà publiée

Réexporte, puis remplace le HTML et le nouveau JPEG si tu utilises l’aperçu social. Teste la page avec **Ctrl + F5**. Le cache du site et celui du réseau social sont indépendants : Facebook peut encore montrer une ancienne miniature après la mise à jour du navigateur.

Les anciens exports ne reçoivent pas les nouveautés du plugin automatiquement. Il faut les réexporter et remplacer leurs fichiers.

Voir aussi le [bol de billes](bol-de-verre.md), les [sauvegardes](presets-et-snapshots.md) et le [guide de fluidité](performance.md).
