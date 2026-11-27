# Journal des versions

## 0.39.99 — Barre d’administration masquée sur Tempera

- Même comportement que `/strudel` : la barre WordPress est masquée sur la page Tempera, sans affecter les autres pages ni ses commandes MIDI.


## 0.39.98 — Correctif de chargement Tempera Feedback

- Chargement conditionnel des ressources CSS et JavaScript avant l’affichage de la page Tempera.
- Correction du chemin des ressources et masquage du titre de page ajouté par le thème.


## 0.39.97 — Interface Tempera Feedback

- Ajout d’une page dédiée `/tempera` avec matrice MIDI 8 × 8 et canvas particulaire sans quadrillage.
- Réception MIDI Web depuis LoopMIDI ; cellules, quatre émetteurs et particules réagissent en direct.
- La page est créée à la première visite de l’administration si le slug `/tempera` est libre.


## 0.39.96 — Lecteur Max for Live versionné

- Ressources et fichier du lecteur nommés par version ; vérification de version avant création du ZIP pour refuser une copie périmée.
- Nouvel export de Tourbillons fluides testé dans Live : les mouvements des potentiomètres ne bloquent plus le visuel, confirmation de l’utilisateur.
- Conservation du correctif du plein écran de la v0.39.94.

## 0.39.95 — Potards Max for Live sans perte du contexte WebGL

- Notification des changements de valeur distincte du remplacement du modèle de contrôleurs.
- Annonce du modèle une seule fois après initialisation ; les getters et les ressources WebGL restent actifs lors des réglages.
- Le correctif du ZIP existant fonctionne, mais la récupération d’un lecteur ancien lors d’un nouvel export nécessite la v0.39.96.

## 0.39.94 — Plein écran Max for Live dans Live 12

- Contexte graphique Jitter implicite et fenêtre non flottante pour la cible WebGL embarquée, afin de stabiliser le plein écran dans Ableton.
- Le preset Gyroïde tranchée exporté a été essayé dans Live 12 : contrôles et plein écran confirmés par l’utilisateur après redémarrage d’Ableton. Les autres presets et configurations restent à vérifier séparément.

## 0.39.93 — Lecteur WebGL embarqué pour Live 12 / Max 9.2

- Nouvelle cible d’export avec `jit.gl.web`, page et bibliothèques locales, moteurs WebGL / WebGL 2 personnalisés et buffers du preset.
- Choix de la cible et des contrôleurs Live ; effet audio avec analyse de la piste ou effet MIDI avec notes natives. La cible Jitter native Live 11 / Max 8 reste disponible.
- Diagnostic des ressources non prises en charge avant téléchargement, notamment caméra, vidéo, réseau et lecture directe d’échantillons WebAudio.

## 0.39.92 — Julia et zoom exponentiel dans Max for Live

- Conversion du preset Julia-curseurs : zoom exponentiel audio réactif et horloges indépendantes pour la forme et les couleurs.
- Adaptation des qualificateurs WebGL au GLSL de bureau de Jitter ; conservation des variables de résolution.

## 0.39.91 — Plis lumineux dans Max for Live

- Conversion de son horloge intégrée et des fonctions numériques auxiliaires avec arguments, y compris les liaisons audio.
- Conservation du gel, de l’inversion et de la phase ; les contrôleurs non exposés gardent leur valeur capturée.

## 0.39.90 — Horloges du feu et des étincelles

- Reproduction des deux compteurs bornés du preset Feu et étincelles dans le runtime Max, une fois par image.
- Vitesses et phases indépendantes, avec arrêt et inversion de l’animation.

## 0.39.89 — Diagnostic des moteurs WebGL personnalisés

- Distinction entre chaîne Hydra native et moteur WebGL indépendant avant conversion.
- Diagnostic explicite pour Blob translucide, dont les trois passes demandent une conversion Jitter dédiée.

## 0.39.88 — Export plus accessible

- Bouton et état de compatibilité Max for Live regroupés dans Preset sélectionné.
- Flèche fixe de retour en haut avec prise en compte du clavier et des préférences d’animation.

## 0.39.87 — Résolution transmise à Jitter

- Variable GLSL `resolution` reliée aux dimensions du rendu, notamment pour Art déco génératif audio.
- Notices de copyright du preset conservées dans le pack exporté.

## 0.39.86 — Formules audio et feedback

- Conversion de replis numériques, conditions et variables locales des callbacks compatibles ; constantes et contrôleurs identifiés explicitement.
- Détection de la vraie cible du feedback et distinction des sources externes ou autres buffers non pris en charge.

## 0.39.85 — Choix des contrôleurs Live

- Choix de 0 à 16 contrôleurs à exposer et compteur de sélection ; les autres conservent leur valeur de base et leur modulation audio compatible.
- Sélection disponible dans la fenêtre principale comme dans les fenêtres détachées.

## 0.39.84 — Compatibilité visible avant l’export

- Indicateur Exportable / Non exportable et raison, avec vérification complète après lancement du visuel.
- Progression et erreurs visibles près du bouton ; téléchargement disponible uniquement après validation.

## 0.39.83 — Premier export Max for Live

- Pack comprenant un périphérique AMXD, son script JavaScript et son shader JXS pour une chaîne Hydra compatible.
- Feedback de la même sortie, contrôleurs automatisables et trois enveloppes audio adaptées depuis la piste Live.
- Refus des constructions non prises en charge avec un diagnostic ; snapshots, séquenceur, MIDI et Link restent à configurer dans Live.

## 0.39.82 — Commentaires des exports TXT

- Retrait des commentaires JavaScript ordinaires des exports TXT standard et complet, sans modifier le code de l’éditeur.
- Mentions de licence et données de restauration conservées ; chaînes, URL et textes GLSL intégrés inchangés.

## 0.39.81 — Export complet et restauration sélective

- Export complet du preset : code, gammes, sources et liaisons audio, snapshots, morphing, associations MIDI, lissage, réglages de sortie et séquenceur.
- Choix des éléments à restaurer au lancement du fichier importé ; restauration locale sans démarrage du séquenceur ni activation de la sortie MIDI.

## 0.39.80 — Snapshots dans les exports TXT

- Le TXT emporte les dix emplacements de snapshots et les réglages de morphing.
- Restauration proposée à Hydra / Update, avec conservation possible des captures locales ; anciens TXT compatibles.

## 0.39.79 — Menu synchronisé avec la gamme actuelle

- Le menu retrouve la gamme et le diapason selon les fréquences des sources présentes.
- Sources personnalisées si aucune gamme ne correspond ; distinction entre la gamme actuelle et le choix à appliquer.

## 0.39.78 — Remplacer les sources par gamme

- Appliquer la gamme remplace les anciennes sources au lieu de les accumuler.
- Notes communes : réglages et liaisons conservés ; notes retirées : nettoyage des liaisons aux contrôleurs, déclenchements et snapshots.

## 0.39.77 — Séparateurs de notes

- Tirets simples et typographiques acceptés entre les notes, avec ou sans espaces ; dièses et bémols conservés.

## 0.39.76 — Gammes personnalisées et diapasons

- Création, modification et suppression de gammes dans Mes gammes, sans compte administrateur pour l’usage local.
- Calcul automatique des fréquences au diapason 440 ou 432 Hz ; affichage entier et précision complète pour la détection.
- Choix de note dans Source personnalisée et boutons de transposition par demi-ton ; gammes incluses dans le code et mémorisées dans le navigateur.

## 0.39.75 — Snapshots et rechargement sans quota localStorage

- Snapshots et associations MIDI déplacés vers IndexedDB ; migration automatique avec copie de récupération avant retrait de l’ancien stockage.
- Recharger le preset attend la restauration des banques enregistrées avant de relancer le visuel.
- Presets voisins, brouillons et modifications locales des Packs VJ conservés ; message explicite si la sauvegarde locale échoue.

## 0.39.74 — Étoiles sans fond de bouton

- Suppression du fond bleu résiduel de la note sélectionnée : les règles des boutons colorés ne prennent plus le dessus sur la transparence des étoiles.
- Fond, bordure et ombre neutralisés sur les étoiles au repos, au survol et au focus, avec ou sans palette personnalisée.

## 0.39.73 — Filtrer les presets par note

- Dans Trier par, sélectionner exactement 0, 1, 2, 3, 4 ou 5 étoiles ; 0 étoile affiche les presets sans note.
- Filtre combinable avec la catégorie et la recherche ; les presets retenus sont affichés du plus récent au plus ancien.
- Choix mémorisé dans le navigateur et disponible aussi dans les nouveaux Packs VJ hors ligne.

## 0.39.72 — Étoiles sans cadre de sélection

- Suppression du cadre hérité des boutons sélectionnés sur la note actuelle, y compris avec les couleurs personnalisées.
- Repère clavier sous forme de soulignement discret ; aucun focus forcé sur une étoile après un clic de souris.

## 0.39.71 — Notation depuis la droite

- La première étoile se trouve à droite ; les notes plus élevées ajoutent leurs étoiles vers la gauche.
- Les étoiles attribuées gardent leur position quand les cinq emplacements apparaissent au survol ou au clavier.

## 0.39.70 — Étoiles discrètes et transparentes

- Seules les étoiles attribuées restent visibles ; aucune étoile au repos pour un preset sans note.
- Petites icônes PNG transparentes, sans bandeau ni fond ; vignettes plus compactes.
- Administrateur : les cinq emplacements apparaissent au survol ou au clavier pour noter ou modifier la note. Sur écran tactile, sélectionner la vignette.

## 0.39.69 — Notation des presets par étoiles

- Cinq étoiles en haut à droite de chaque vignette : cliquer pour noter de 1 à 5, cliquer de nouveau sur la note actuelle pour la retirer.
- Notes enregistrées dans WordPress par l’administrateur, visibles en lecture seule pour les visiteurs.
- Tri Mieux notés, combinable avec la recherche et les catégories ; choix du tri mémorisé.
- Les nouveaux Packs VJ conservent les notes en lecture seule.

## 0.39.68 — Administration WordPress depuis le voyant vert

- Un clic sur le voyant vert ouvre le tableau de bord WordPress dans le même onglet.
- Infobulle et libellé accessible adaptés ; le voyant gris conserve son accès à la connexion.

## 0.39.67 — Gros brouillons Hydra et sauvegarde locale

- Brouillons et essais Hydra déplacés vers IndexedDB pour dépasser le petit quota de localStorage, notamment avec les banques audio intégrées.
- Migration automatique : ancienne copie retirée uniquement après confirmation de l’écriture ; copie de récupération conservée dans la base locale.
- Confirmation de sauvegarde des essais après l’écriture, état du brouillon visible et message français si le navigateur ne peut pas conserver les données.
- Packs VJ : chargement des gros brouillons sans passage par localStorage ; presets WordPress et banques de snapshots conservés.

## 0.39.66 — Presets Hydra avec banques audio intégrées

- Import, exécution, mise à jour et contrôleurs Hydra acceptent jusqu’à 16 Mo de code UTF-8, pour les instruments contenant leurs propres sons.
- Les signatures des snapshots conservent une empreinte compacte des gros blocs intégrés, pour ne pas recopier leurs échantillons dans chaque sauvegarde.
- Même limite dans les nouveaux Packs VJ ; les limites du graphe Designer et des morceaux Strudel restent distinctes.
- Pour les gros presets, conserver le fichier exporté ou enregistrer dans WordPress : le quota local du navigateur peut empêcher le brouillon et les essais locaux.

## 0.39.65 — Entrée audio facultative et visuel sans interface

- Entrée audio activable dans le menu des pages exportées, avec autorisation du navigateur, choix de source et indicateur de niveau.
- Analyse Hydra locale, réglages FFT du code et modulations audio conservés ; aucune écoute automatique.
- Le bouton du menu disparaît après trois secondes d’inactivité et revient au mouvement, au toucher ou au clavier.
- Le menu ouvert reste accessible pendant les réglages ; fermer le menu pour retrouver le visuel seul.

## 0.39.64 — Exporter la page web depuis la fiche du preset

- Bouton Exporter la page web placé à côté de Partager ce preset, Importer un preset, Mettre à jour le code et Exporter le preset.
- Le bouton est retrouvé même après le déplacement des actions vers Sauvegarder et partager.

## 0.39.63 — Réaffecter les contrôleurs des pages exportées

- Choix du paramètre de chacun des deux contrôleurs directement dans les réglages de la page HTML publiée.
- Bornes, pas et interrupteurs adaptés au paramètre choisi ; les valeurs restent conservées lors du changement de sélection.
- Option dans la fenêtre d’export pour autoriser la réaffectation, dans le HTML comme dans le ZIP de partage.
- Les pages déjà publiées doivent être exportées à nouveau.

## 0.39.62 — Voir les destinations audio calculées dans le code

- Récapitulatif des paramètres et des formules pour chaque source audio dans le script.
- Indications directement sous les bandes FFT et sur les contrôleurs concernés.
- Ouvrir ou refermer en un clic les réglages de tous les contrôleurs liés, globalement ou par source.
- Repérage sans exécuter le code, avec extraits lorsque la destination reste inconnue ; mêmes indications dans les contrôleurs détachés et le Pack VJ.

## 0.39.61 — Connexion WordPress depuis le voyant gris

- Voyant gris visible pour les visiteurs déconnectés ; un clic ouvre la connexion WordPress avec retour au laboratoire.
- Voyant vert pour la session connectée ; son clic conserve la vérification de connexion.

## 0.39.60 — Recherche intégrée au menu du site

- Champ de recherche et suggestions directement dans le menu, sans seconde fenêtre.
- Formulaire et liens du thème conservés ; fermeture du menu au clic extérieur ou avec Échap.

## 0.39.59 — Recherche du site dans une fenêtre lisible

- Le formulaire de recherche Blocksy est présenté dans une carte compacte avec le titre Rechercher sur le site.
- La croix native est déplacée dans la carte et rendue visible malgré le réglage transparent du thème.
- Champ et résultats harmonisés avec la palette du laboratoire ; fond moins opaque, dimensions adaptées au mobile.
- Formulaire, destination, suggestions et clavier natifs conservés ; l’apparence des autres pages du site reste inchangée.

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

