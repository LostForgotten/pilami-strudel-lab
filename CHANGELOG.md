# Journal des versions

## 0.39.58 — menu du site compact et documentation (28 octobre 2026)

- Menu et recherche Blocksy réunis derrière une icône en haut à droite du labo, fermée par défaut ; liens et recherche natifs conservés.
- Fermeture au clic extérieur et au clavier, avec priorité à la fenêtre de recherche ; accès direct sur mobile, sans repli supplémentaire « Plus ».
- README actualisé, nouveau parcours de démarrage sans code, guides de sauvegarde et de MIDI, dépannage et export web réécrits pour les débutants.
- Scripts de fabrication et de synchronisation alignés sur les ressources d’export et du Pack VJ actuellement livrées.

## 0.39.57 — voyant de connexion WordPress (28 octobre 2026)

- Barre d’administration masquée seulement sur les pages hébergeant le laboratoire.
- Voyant vert après confirmation de connexion, mention Administrateur selon les droits, gris après déconnexion et orange si le contrôle échoue.
- Vérification sans cache au chargement, au retour et périodiquement ; aucune identité dans le HTML public mis en cache.

## 0.39.56 — balle et sortie MIDI (25 octobre 2026)

- Preset Balle — Rebond MIDI avec collision au sol, lueur et note MIDI.
- Port choisi explicitement, autorisation, note de test, canal, note, durée et vélocité réglables.
- Arrêt et changements de preset ou de port libèrent la note ; envoi également disponible dans les nouveaux Packs VJ, absent des pages publiques.

## 0.39.55 — menu et résolution des exports

- Une icône regroupe lecture, son éventuel, plein écran, réglages et informations sur les nouvelles pages HTML.
- Résolution de la visite : origine, 640 × 360, 800 × 450, HD et Full HD ; choix conservé en plein écran, réinitialisé au rechargement.
- Réexport nécessaire pour mettre à jour les pages déjà publiées.

## 0.39.54 — import pendant le changement d’heure

- Dates locale et UTC calculées depuis le même instant pour éviter une publication programmée involontaire pendant l’heure répétée.
- Refus de publication expliqué sans exposer de requête interne ; brouillon conservé.

## 0.39.53 — réglages du visiteur

- Choix de zéro, un ou deux contrôleurs dans l’export ; bornes, pas et valeur initiale conservés.
- Modifications limitées à la visite, sans écriture WordPress ; retour aux valeurs exportées et liens vers le laboratoire et GitHub.

## 0.39.52 — aperçu pour les réseaux sociaux

- Formulaire de titre, description et adresse publique ; capture du dernier rendu en JPEG 1200 × 630 sans avancer la simulation.
- ZIP HTML + miniature + instructions, avec métadonnées Open Graph et Twitter présentes dans le HTML.
- Formulaire accessible dans les fenêtres détachées, y compris en plein écran.

## 0.39.51 — pages web autonomes et bol de billes (24 octobre 2026)

- Export du visuel lancé vers un HTML autonome, depuis la fiche du preset et les fenêtres Code / Contrôleurs.
- Valeurs des contrôleurs capturées au clic, résolution fixe, images référencées embarquées et outils de lecture discrets.
- Pause, plein écran, sources et licences incluses ; lecture du fichier local ou depuis un hébergement statique.
- Aucun micro ni MIDI demandé ; FFT à zéro. Les sons de collision sont soumis au clic du visiteur.
- Aucun autre preset, banque de snapshots, association MIDI ou identifiant WordPress inclus.
- Imports distants et sources caméra/écran/vidéo refusés explicitement ; extensions locales color/noise/fractals/blend prises en charge.
- Exemple original Bol de verre v1.13 : sphères avec collisions, matières indépendantes, tailles aléatoires, mélangeur autonome/audio, sons d’impacts, lueurs propres, éclairage voisin, occlusion ambiante et caméra X/Y.
- Sources du bol et scripts de reconstruction ajoutés au dépôt, avec guides d’utilisation et d’hébergement de l’export.

## 0.39.50 — enregistrement vérifié des presets

- Mettre à jour le preset applique le nouveau fichier chargé si nécessaire, puis enregistre le code et le nom sur le même preset.
- Renommage seul sans relancer le visuel ; champs des fenêtres détachées synchronisés et validés avant sauvegarde.
- Relire le nom et le code sans cache après l’enregistrement avant d’annoncer la réussite ; conserver le brouillon si la vérification échoue.
- Un changement MIDI pendant le chargement d’un fichier n’annule plus son import.

## 0.39.49 — mise à jour du code avec conservation des snapshots

- Mettre à jour le code permet de remplacer le script du preset sélectionné sans créer un doublon.
- Migration par noms uniques des contrôleurs compatibles : valeurs précises, plages, audio, MIDI et snapshots.
- Nouveaux contrôleurs initialisés aux valeurs du nouveau script ; anciennes banques conservées et banque cible existante protégée.
- Commande disponible dans la page principale, les fenêtres détachées et les nouveaux Packs VJ hors ligne.


## 0.39.48 — résolution du rendu et confort de jeu (19 octobre 2026)

- Sélecteur de résolution dans les réglages visuels, les fenêtres Code / Contrôleurs et le Pack VJ : de 640 × 360 au Full HD, dont 1280 × 720.
- Application immédiate et préférence conservée sur ce navigateur pour tous les presets, sans modifier leur code ni les snapshots.
- Selon le preset reprend la dernière résolution demandée par le script, ou suit la fenêtre si aucune taille n’est définie.
- Sélecteurs synchronisés et résolution conservée au redimensionnement et en plein écran.

## 0.39.47 — éditeur visible dans sa fenêtre

- Code placé avant les outils du preset et hauteur minimale utilisable dès l’ouverture.
- Nom, photos, partage et catégories regroupés dans un volet sous l’éditeur ; petites fenêtres défilantes.

## 0.39.46 — résolution du preset conservée

- Les dimensions définies par setResolution survivent au passage en plein écran et aux changements de fenêtre ou d’écran.
- Le preset suivant retrouve le dimensionnement automatique s’il ne définit pas sa propre résolution.

## 0.39.45 — pad Performance et clic droit

- Glisser continu sur le pad Performance avec capture du pointeur jusqu’au relâchement.
- Clic droit sur les contrôleurs et leurs valeurs pour rappeler les valeurs au lancement du preset ; réinitialisation des deux axes sur un pad XY.
- Bornes et pas actuels respectés, liaisons audio et MIDI conservées.

## 0.39.44 — Performance et import dans les fenêtres Hydra

- Performance s’ouvre dans la fenêtre où son bouton est utilisé, avec son habillage et sa visibilité en plein écran.
- Import accessible dans la fiche du preset et les barres des fenêtres Code / Contrôleurs, avec la même validation et sauvegarde WordPress administrateur.

## 0.39.43 — tri des presets

- Tri du plus récent au plus ancien, du plus ancien au plus récent ou par nom ; préférence mémorisée.
- Dates d’ajout conservées dans les nouveaux Packs VJ, sans perdre les filtres ou le visuel en cours.

## 0.39.42 — bibliothèque compacte

- Liste sur toute la largeur, puis fiche du preset immédiatement dessous.
- Commandes et classement regroupés, disposition adaptée à la largeur disponible.

## 0.39.41 — partager depuis la fiche du preset

- Partage et export accessibles près du nom du preset ; lien court et résultat de copie dans cette fiche.
- Synchronisation des commandes dans les fenêtres détachées ; ouverture du lien sans lecture automatique.

## 0.39.40 — gestion et couleurs des catégories

- Fiche du preset réunissant nom, classement, mise à jour et suppression.
- Suppression des catégories avec confirmation, en conservant les presets et leurs autres catégories.
- Couleurs corrigées dans Toutes les catégories et actualisées au retour des réglages WordPress.

## 0.39.39 — créer une catégorie

- Création de catégorie depuis le laboratoire pour les administrateurs WordPress.
- Nouvelle catégorie cochée pour le preset courant ; classement validé séparément.

## 0.39.38 — particules Pixi

- ParticleContainer et Particle exposés dans le moteur embarqué.
- Ressource locale actualisée et compatibilité du panneau Performance / Pack VJ.

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
