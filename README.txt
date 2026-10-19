Pilami Strudel Lab 0.39.48 — Choisir la résolution sans éditer le code

- Dans les réglages visuels (bouton ▤ puis ⚙), le sélecteur Résolution Hydra propose Selon le preset, 640 × 360, 800 × 450, 960 × 540, 1280 × 720 et 1920 × 1080.
- Le même sélecteur est accessible en haut des fenêtres Hydra · Code et Hydra · Contrôleurs. Les sélecteurs restent synchronisés et affichent la résolution en cours.
- Le changement s’applique immédiatement au rendu et aux textures de feedback, sans modifier le code, les contrôleurs ou les snapshots. La résolution choisie reste fixe en plein écran.
- Le choix est mémorisé sur ce navigateur pour tous les presets. Une résolution manuelle est prioritaire sur setResolution ; Selon le preset reprend la dernière taille demandée par le script, ou suit la fenêtre si le script n’en définit pas.
- Le sélecteur peut aussi être réglé avant de lancer un visuel. Le Pack VJ hors ligne possède le même choix dans son en-tête et ses fenêtres détachées.
- Certains presets utilisent leur propre moteur et une définition interne supplémentaire : celle-ci reste pilotée par leurs contrôleurs. Un changement de taille peut réinitialiser les traces du feedback Hydra.
- Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.47 — Code visible dès l’ouverture de sa fenêtre

- La fenêtre Hydra · Code donne la priorité à l’éditeur, visible et utilisable sans passer en plein écran.
- Nom, photos, partage et catégories du preset sont regroupés dans un volet sous le code, replié au premier accès. Ils ne prennent plus toute la hauteur avant l’éditeur.
- L’éditeur garde une hauteur minimale ; les petites fenêtres peuvent défiler. Les commandes, la saisie, l’application et la synchronisation avec la page principale sont conservées.
- La même protection de hauteur s’applique à la fenêtre de code Strudel. Les réglages repliables des fenêtres Code et Contrôleurs sont indépendants.
- Pack VJ hors ligne actualisé. Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.46 — Résolution du preset conservée en plein écran

- Un appel setResolution(800, 450), ou toute autre résolution du preset, verrouille sa taille de calcul. Agrandir la fenêtre ou passer en plein écran agrandit l’affichage sans augmenter le nombre de pixels calculés par Hydra.
- La résolution reste conservée lors des changements Panneau / Fenêtre séparée / Fond et du déplacement entre écrans. Aucune modification des presets existants n’est nécessaire.
- Le dernier appel setResolution du preset reste prioritaire. Les appels sur le moteur renvoyé par initHydra fonctionnent aussi.
- Chaque lancement / application de preset repart en mode automatique : si le nouveau script ne fixe pas de résolution, le rendu suit la taille de l’affichage. Le verrouillage ne se transmet pas d’un preset à l’autre.
- Pack VJ hors ligne actualisé. Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.45 — Glisser sur le pad et valeurs par défaut

- Le pad Performance suit le glisser en continu dans la page, les fenêtres détachées et le plein écran. Le déplacement continue au-delà du pad tant que le bouton reste appuyé.
- Clic droit sur un curseur, fader vertical, potentiomètre, interrupteur ou sa valeur manuelle : rappeler la valeur au lancement du preset, avec les bornes et le pas actuels.
- Clic droit sur un pad XY : rappeler les valeurs initiales des deux axes ensemble. Dans Performance, le clic droit fonctionne aussi sur les curseurs des axes, les commandes et leurs valeurs affichées.
- Les valeurs initiales restent stables pendant les réglages, le Random et les rappels de snapshots. Relancer / appliquer le code définit de nouvelles valeurs initiales à partir de ce code.
- Les liaisons audio et MIDI restent actives. Pour un contrôleur audio, seule sa valeur manuelle revient à l’initiale : le son continue à la moduler. Le clic droit sur une source audio conserve son menu.
- Pack VJ actualisé. Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.44 — Performance et import dans les fenêtres Hydra

- Performance s’ouvre dans la fenêtre de ses contrôleurs et reste visible en plein écran, avec son habillage complet.
- Fermer le panneau ramène aux contrôleurs sans changer de fenêtre ni quitter le plein écran.
- Importer un preset se trouve dans la fiche Preset sélectionné, près de Partager et Exporter.
- Le bouton est aussi accessible en haut des fenêtres Hydra · Contrôleurs et Code ; la sélection du fichier s’ouvre dans cette fenêtre.
- Même validation, même import et même sauvegarde automatique WordPress pour l’administrateur ; le visuel ne démarre pas automatiquement.
- Pack VJ actualisé. Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.43 — Trier les presets par date d’ajout

- Dans la bibliothèque Hydra, le menu Trier par se trouve à côté du filtre de catégorie et de la recherche.
- Plus récents est le tri initial ; Plus anciens et Nom : A → Z restent disponibles. Le choix est mémorisé sur ce navigateur.
- La date correspond à l’ajout du preset dans la bibliothèque. Une modification du nom, du code ou des catégories ne change pas cette date. Elle est visible au survol du bouton du preset.
- Le tri conserve le filtre, la recherche, la sélection, le brouillon et le visuel en lecture. Les nouveaux imports se placent directement au bon endroit.
- Les nouveaux Packs VJ conservent ces dates. Les presets d’un ancien export sans date sont classés par nom après les presets datés.
- Installer le ZIP en remplaçant le plugin, puis recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.42 — Bibliothèque de presets plus compacte

- La liste des presets utilise toute la largeur disponible ; la fiche du preset sélectionné se place immédiatement dessous.
- Dans la fiche, nom, état et commandes sont regroupés à gauche, classement et gestion des catégories à droite. La fiche s’adapte à la largeur réelle du panneau et s’empile sur téléphone.
- Suppression du grand vide sous la liste et du nom répété dans l’aide au classement. La liste reste défilante pour les grandes bibliothèques.
- Partager, exporter, créer, mettre à jour et supprimer restent accessibles depuis la fiche. Les fenêtres détachées et le Pack VJ conservent les mêmes commandes.
- Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.41 — Partager depuis la fiche du preset

- « Partager ce preset » se trouve dans la fiche Preset sélectionné, sous son nom, à côté des commandes du preset. « Exporter le preset » permet aussi de transmettre le fichier .hydra.txt.
- Le partage crée un lien court vers le code et le nom actuellement affichés, y compris les réglages inscrits dans le script. Le lien et le résultat de sa copie s’affichent directement dans la fiche.
- Si le navigateur refuse le presse-papiers, le lien est sélectionné pour une copie manuelle avec Ctrl + C. Les erreurs restent visibles près du bouton et un nouvel essai est possible.
- Le destinataire retrouve le visuel dans Hydra et choisit quand le lancer. L’ouverture du lien ne déclenche pas le visuel automatiquement.
- La commande et le lien sont également accessibles dans les fenêtres Code et Contrôleurs. Le partage par lien reste disponible aux visiteurs du site, sans session administrateur.
- Les partages Strudel et musique + visuels conservent leurs commandes existantes. Dans le Pack VJ hors ligne, Exporter le preset reste accessible ; le partage par lien nécessite le site WordPress.
- Installer le ZIP en remplaçant le plugin, puis recharger la page et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.40 — Presets et catégories réunis

- Dans Hydra, la liste des presets et la fiche du preset sélectionné sont regroupées en haut. Le nom, le classement, la mise à jour et la suppression du preset sont accessibles dans cette fiche.
- « Filtrer par catégorie » sert à parcourir la bibliothèque. « Classer ce preset » affiche ses catégories, sans passer par Sauvegarder et partager.
- « Gérer les catégories » regroupe leur création et leur suppression. La suppression demande confirmation et retire uniquement la catégorie ; les presets, les autres catégories et les sous-catégories sont conservés. Un preset sans autre classement apparaît dans Sans catégorie.
- Création, classement et suppression des catégories restent réservés aux administrateurs connectés à WordPress. Les fenêtres Code et Contrôleurs partagent les mêmes commandes.
- Dans Toutes les catégories, la couleur suit la première catégorie alphabétique hors Imports. Imports fournit la couleur de repli. Avec un filtre actif, la catégorie filtrée garde la priorité.
- Les couleurs enregistrées dans WordPress sont relues au retour sur le laboratoire ; brouillon, choix de classement et contrôleurs restent en place. Les cases de classement affichent aussi une pastille de couleur.
- Choisir un preset ne lance pas le visuel et ne déplace plus le focus vers l’éditeur de code.
- Pack VJ actualisé ; les opérations WordPress y restent indisponibles.
- Installer le ZIP en remplaçant le plugin, recharger la page principale et rouvrir les fenêtres détachées. Le preset Nuage v5 déjà importé reste utilisable.

Pilami Strudel Lab 0.39.39 — Créer des catégories dans l’application

- Connecté comme administrateur WordPress : dans Hydra, ouvrir Catégories du preset, saisir Nouvelle catégorie puis cliquer Créer la catégorie (ou Entrée).
- Le nom existant est réutilisé. La catégorie créée est cochée pour le preset courant ; Enregistrer les catégories valide le classement. Les autres cases cochées et les modifications de code sont conservées.
- Même fonctionnement dans les fenêtres Code et Contrôleurs. Une création sans preset sélectionné reste disponible pour les classements suivants.
- Le classement concerne les presets de la bibliothèque WordPress. Les essais locaux du navigateur ne deviennent pas automatiquement des presets WordPress.
- Création et classement protégés par la session administrateur et le nonce REST WordPress ; indisponibles pour les visiteurs et dans le Pack VJ hors ligne.
- Preset séparé Nuage-Particules-Pixi-Pilami-v5-trainees.hydra.txt : Longueur_Trainee (0–2 secondes), Intensite_Trainee (0–1), Detail_Trainee (0–12 segments par particule). Détail, intensité ou longueur à 0 désactivent les traces.
- Profondeur de champ, résolution, opacités individuelles, audio, MIDI et snapshots conservés. Les traces suivent chaque particule, s’atténuent avec l’âge et s’arrêtent avec le visuel.
- Pour commencer sur GTX 770 : 500–700 particules, détail 2–4, résolution 0.5–0.75. Le détail ajoute des segments à chaque particule ; mesurer le débit sur la machine cible.
- Installer le ZIP dans WordPress en remplaçant la version actuelle, recharger la page et rouvrir les fenêtres détachées. Importer ensuite le preset v5 avec Ctrl + I.

Pilami Strudel Lab 0.39.38 — Nuage Pixi avec ParticleContainer

- Nouveau moteur Pixi local exposant ParticleContainer, Particle et Rectangle ; bibliothèque toujours embarquée, sans CDN.
- Le preset Nuage-Particules-Pixi-Pilami-v3-ParticleContainer.hydra.txt utilise une texture lumineuse partagée et un seul conteneur au lieu d’un Graphics par particule.
- Les 19 contrôleurs et leurs plages sont conservés : position, mouvement, taille, couleur, audio et opacité indépendante. 1100 particules par défaut pour comparer avec la v2 ; 100 à 2400 réglables.
- Le conteneur ne transmet que les particules actives au rendu. La texture et le conteneur sont libérés au changement de preset.
- Panneau Performance et Pack VJ actualisés. Réinstaller le plugin, recharger la page puis importer le preset v3 avec Ctrl + I.
- Le gain réel dépend du navigateur, du GPU et de la résolution ; à comparer sur la machine cible, à réglages égaux.

Pilami Strudel Lab 0.39.37 — Connexions et import au clavier

- En haut du laboratoire : Activer l’audio, Activer le MIDI et Connecter Link, avec voyants et état visible.
- Audio = entrée microphone/interface pour les visuels réactifs. Activable avant le premier preset, sans lancer de visuel. La connexion reste active entre presets ; Désactiver l’audio libère l’entrée et remet les bandes à zéro.
- Le MIDI utilise les mêmes associations et réglages que le panneau MIDI. Link conserve son bridge local et son aide.
- Le haut de la page Blocksy est compacté uniquement sur les pages contenant [pilami_strudel] : titre de page masqué, marges réduites et navigation conservée en format compact.
- Ctrl + I (Cmd + I sur Mac) ouvre l’import d’un preset Hydra ; disponible aussi dans les fenêtres Hydra, avec indication au survol. Les champs de saisie ordinaires restent protégés.
- Pack VJ actualisé. Remplacer le plugin par ce ZIP, recharger la page et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.36 — Visuel au clavier

- P : lancer / arrêter le visuel courant, hors saisie. Personnalisable dans Raccourcis et écrans.
- Ctrl + Entrée : lancer / appliquer ; Alt + . : arrêter. Fonctionne sur la page et dans les fenêtres Hydra ; les raccourcis musicaux existants sont conservés.
- Les commandes affichent leurs raccourcis au survol et aux technologies d’assistance ; les indications suivent les touches personnalisées.
- Les fenêtres de code, contrôleurs, Designer et projection partagent le routage. Les réglages déjà mémorisés sont conservés.
- Installe le ZIP, recharge la page principale et rouvre les fenêtres détachées.

Pilami Strudel Lab 0.39.35 — Habillage Studio unifié

- Correction des options noires sur fond sombre dans Performance, avec protections contre les styles du thème WordPress.
- Habillage commun inspiré de Performance sur Strudel, Hydra, les contrôleurs, snapshots, MIDI, audio, presets et outils.
- Fenêtres de code, contrôleurs et Designer harmonisées ; palettes personnalisées et modes clair/sombre conservés.
- Les éditeurs et champs conservent leurs commandes au clavier. Le panneau Performance continue d’utiliser Pixi pour le pad et les snapshots graphiques.
- Pack VJ actualisé. Installe le ZIP, recharge la page principale et rouvre les fenêtres séparées.

Pilami Strudel Lab 0.39.34 — Performance · essai PixiUI

- Lance un visuel avec des contrôleurs, puis clique Performance ✦ dans les paramètres du visuel.
- Choisis les paramètres X et Y ; glisse dans le pad. Quatre commandes réassignables complètent le panneau.
- Choisis Rappeler, Morpher ou Capturer, puis un numéro de snapshot. Une capture existante demande confirmation avant remplacement.
- Les valeurs suivent le MIDI et le morphing. Les associations MIDI restent réglables dans le panneau MIDI habituel.
- Durée de transition en secondes et Arrêter la transition. Fermer ou Échap pour revenir aux contrôleurs.
- Fonctionne aussi dans le Pack VJ exporté après cette mise à jour ; aucune ressource distante nécessaire pour Performance.
- Installer le ZIP dans WordPress, remplacer la version actuelle, puis recharger la page et rouvrir les fenêtres détachées.

Pilami Strudel Lab 0.39.33 — Fenêtre Hydra · Contrôleurs alignée

- Les contrôleurs utilisent la largeur disponible en plein écran et en fenêtre normale.
- « Photos et réglages du preset » regroupe la photothèque, le nom et les catégories. Ce panneau est replié par défaut dans la fenêtre des contrôleurs.
- Tous les panneaux utilisent une seule zone de défilement ; les commandes restent en haut et s’adaptent aux petites fenêtres.
- Suppression des messages d’attente en double, sans masquer les outils Snapshots, MIDI et audio disponibles sans contrôleur.
- Photothèque 0.39.32, modification des valeurs en direct, snapshots et fenêtre du code conservés.
- Installer ce ZIP depuis Extensions → Ajouter une extension → Téléverser, puis remplacer la version actuelle et recharger la page principale.

Pilami Strudel Lab 0.39.32 — Photos personnelles dans Hydra

- Dans Hydra, ouvre « Photos · importer et choisir une image », puis « Importer des photos… ».
- « Nouveau visuel » prépare Image vivante (9 contrôleurs, audio, feedback). Le brouillon précédent est conservé dans les essais locaux si nécessaire. Lance avec Hydra / Update.
- « Utiliser » remplace la photo d’un preset image ; les effets et les banques de snapshots compatibles sont conservés.
- Photos stockées dans ce navigateur ; JPG, PNG, WebP, GIF, 10 Mo maximum par fichier. Aucun téléversement automatique.
- Le Pack VJ emporte les photos locales utilisées. Un simple export du code ne contient pas les fichiers photo.
- Pour un preset WordPress partagé, enregistre explicitement sa photo dans WordPress depuis Photos, applique le code, puis enregistre le preset.
- Installer ce ZIP depuis Extensions → Ajouter une extension → Téléverser, puis remplacer la version actuelle.

Pilami Strudel Lab 0.39.31 — Panneaux accessibles et mode visuel au clavier

- Snapshots, séquenceur et MIDI accessibles dès l’ouverture d’Hydra, sans contrôleur requis pour afficher les panneaux.
- Pour capturer une variation, lancer un visuel avec au moins un contrôleur : les captures vides sont désactivées.
- V fait défiler Panneau → Fenêtre séparée → Fond. Touche modifiable dans « Raccourcis et écrans ».
- Le raccourci est ignoré pendant la saisie et fonctionne dans les fenêtres séparées.
- Installer ce ZIP depuis Extensions → Ajouter une extension → Téléverser, puis remplacer la version actuelle.

Pilami Strudel Lab 0.39.30 — Clics Rappel/Morphing réversibles

Clic gauche : case vide → Rappel, Rappel → vide, Morphing → Rappel.
Clic droit : case vide → Morphing, Morphing → vide, Rappel → Morphing.
Le Random, les grilles enregistrées et la synchronisation Link sont inchangés.

Pilami Strudel Lab 0.39.29 — Grille Rappel/Morphing au clic et remplissage Random

Nouveautés : clic gauche Rappel / désactivation, clic droit Morphing en un geste, densité de Random réglable de 0 à 100 %, valeurs enregistrées localement, conservation des correctifs Link et de la v0.39.28.

Pilami Strudel Lab 0.39.27 — Link et séquenceur dans un onglet Firefox non focalisé

- Le panneau ⓘ Aide Link fournit maintenant le téléchargement de Pilami Link Bridge bêta Windows et la documentation GitHub.
- Les changements Stop → Play de Live peuvent lancer la grille même lorsque Firefox ralentit les minuteries en arrière-plan : l’horloge WebSocket Link pilote aussi le séquenceur.
- Après une pause ou une fenêtre masquée, les déclenchements dépassés sont ignorés, la grille se replace sur le pas actuel et la lecture continue.
- Une connexion Link temporairement ralentie ne coupe plus immédiatement la séquence ; l’état Play/Stop connu est conservé durant une reconnexion courte.
- Limitation de Firefox : les animations Hydra d’un onglet complètement suspendu ne sont pas garanties tant que la fenêtre n’est pas visible. Utiliser la fenêtre visuelle détachée si besoin.
- Aucun changement du bridge Windows, des patterns stockés, du MIDI ou des raccourcis.

Pilami Strudel Lab 0.39.26 — téléchargement public du bridge Ableton Link

- Dans Hydra > Contrôleurs > Snapshots & Morphing > Séquenceur visuel, ouvre « ⓘ Aide Link ».
- Télécharge Pilami Link Bridge Windows 64 bits (v0.1.0-beta.1) directement depuis GitHub Releases.
- Décompresse et lance Pilami-Link.exe : aucun Node.js, Python ou Visual Studio nécessaire pour les utilisateurs.
- Un lien vers toutes les versions et les sources GitHub reste accessible dans l'aide.
- Instructions Link et Start/Stop Sync disponibles, y compris l'option « Synchro de démarrage arrêt » dans Ableton Live.
- Le bridge est facultatif et les autres visiteurs utilisent toujours le site sans installation.
- Aucun changement du séquenceur ni du bridge Windows local existant.

Pilami Strudel Lab 0.39.25 — acces aux raccourcis dans la barre flottante

- Deplie le menu flottant « Visuels » en bas a droite, puis clique sur le bouton clavier « ⌨ » juste avant l'engrenage.
- Le panneau Raccourcis et ecrans existant s'ouvre et defile a sa position.
- Corrige la precedente tentative de detection du bouton de theme WordPress qui ne fonctionnait pas sur pilami.fr.
- Bridge Link Windows inchange.

Pilami Strudel Lab 0.39.24 — snapshots indisponibles, aide Link et accès raccourcis

- Les lignes sans snapshot capturé sont visuellement désactivées ; impossible d'y créer un déclenchement.
- Une ancienne case devenue invalide peut être retirée, et n'interrompt plus une grille avec d'autres snapshots disponibles.
- Aide Link visible dans la barre du séquenceur : si le BPM suit mais pas Play/Stop,
  activer « Synchro de démarrage arrêt » dans les paramètres Link d'Ableton Live.
- Un accès « ⌨ Raccourcis » est injecté à côté du bouton « Mode clair/sombre »
  dans le menu flottant du site quand ce bouton est visible. Selon le thème,
  l'emplacement peut demander une adaptation sur la page réelle.
- Aucun changement du bridge Windows : conserver le server.cjs v0.39.24 opérationnel.

Pilami Strudel Lab 0.39.23 — correctif visuel et diagnostic Link

- Cases actives : rognage de l'extérieur des PNG pour atténuer les bordures
  lumineuses incrustées dans l'image. Les URLs WordPress ne changent pas.
- Dans le séquenceur, un statut du transport indique LIVE PLAY / LIVE STOP,
  LINK 0 pair, ou transport inconnu.
- Bridge Link server.cjs mis à jour avec des logs et un callback de transport.
- Installer le ZIP complet dans WordPress puis remplacer seulement server.cjs
  sous Windows, sans relancer npm install ni recompiler.
- Stopper toutes les anciennes fenêtres du bridge avant son redémarrage.
- Dans Ableton Live, activer LINK ET Start/Stop Sync (clic droit sur LINK).

VERSION 0.39.20 — ÉDITION LIVE + HABILLAGE PNG DU SÉQUENCEUR

- Les cases peuvent être ajoutées, retirées ou déplacées pendant la lecture, sans stopper l'horloge Link.
- Clic droit sur une case active : bascule Rappel / Morphing, y compris pendant la lecture.
- Seul le contenu de la grille est éditable en lecture (longueur, quantification, boucle et BPM restent verrouillés pour conserver l'alignement).
- Une modification d'une case déjà jouée prend effet au passage suivant ; une modification avant son prochain passage s'y applique.
- Les PNG des cases sont directement chargés depuis les URL de WordPress : empty.png, recall.png, morph.png, active.png.
- La tête de lecture est dessinée en CSS (ligne et colonne lumineuses), sans PNG playhead.
- Pour modifier librement les quatre images : WordPress > Réglages > Strudel — Apparence > Images du séquenceur à grille.
- Conserver l'URL et remplacer l'image avec une extension de remplacement des médias fonctionne aussi (vider les caches si nécessaire).
- Les PNG et la grille sont aussi chargés dans la fenêtre détachée des contrôleurs Hydra.
- Aucune mise à jour ni recompilation du bridge Link. Les patterns v0.39.19 existants sont conservés.
- Limitations : un morphing déjà commencé conserve sa durée initialement calculée ; une nouvelle case peut interrompre ce morphing au pas choisi.

VERSION 0.39.19 — SÉQUENCEUR À GRILLE (OPTION A)

- Une seule action de snapshot par colonne : cases cliquables sur 10 lignes, 16/32 pas.
- Dessin en mode Rappel ou Morphing ; clic droit sur une case active pour inverser son type.
- Quantification au pas 1/16, 1/8, 1/4 ou 1 mesure ; curseur de lecture fluide.
- Avec Ableton Link : départ à la prochaine mesure, horloge Link, changements de BPM suivis.
- Sans Ableton Link : BPM interne, pas besoin de bridge.
- Morphings exprimés en durée jusqu’au prochain déclenchement, ou jusqu’à la fin.
- Anciennes séquences 0.39.17–0.39.18 importées localement sans effacer l’ancien stockage.
- Les patterns sont sauvegardés sur le navigateur de l’utilisateur, pas sur WordPress.
- Le bridge déjà installé (0.39.16) reste inchangé.

VERSION 0.39.18 — MENUS STABLES DU SÉQUENCEUR VISUEL

Correction ciblée : choix des snapshots, actions et durées sans reconstruire la ligne.
Réorganisation/ajout/suppression et changement de banque restent actualisés.
Les options disponibles ne sont pas réécrites pendant un menu ouvert ; progression animée via transform CSS.
Pas de changement pour Ableton Link, MIDI, WordPress ou les données sauvegardées.
Bridge Windows v0.39.16 inchangé.


VERSION 0.39.17 — SÉQUENCEUR VISUEL DE SNAPSHOTS

Dans Hydra > Contrôleurs > Snapshots & Morphing, ouvrir « Séquenceur visuel ».
Définir jusqu'à 8 étapes, chacune avec snapshot, rappel/morphing et durée
de 1, 2, 4 ou 8 mesures. Boucle activable, ordre modifiable, boutons + et ×.
Les étapes sont stockées dans le navigateur, par banque de snapshots/preset.
Elles ne sont pas enregistrées dans les banques de WordPress.

En présence du bridge Ableton Link v0.39.16, démarrage à la prochaine mesure
et maintien de l'alignement lorsque le BPM change. Le morphing occupe
la durée en mesures de son étape. Sans bridge, horloge interne BPM 40 à 240 ;
démarrage immédiat. Perte de Link pendant la lecture : arrêt de sécurité.
Pas de commande de tempo ou de transport envoyée à Live.
La précision dépend du navigateur et du bridge ; ce n'est pas du sample-accurate.

Pilami Strudel Lab v0.39.16 — test de déclenchement quantifié Ableton Link

INSTALLATION
- Mettre à jour le plugin WordPress comme d'habitude (ZIP complet).
- Bridge déjà compilé et fonctionnel : ne PAS relancer 01-installer-windows.cmd.
- Remplacer UNIQUEMENT tools/ableton-link-bridge/server.cjs sur le PC par le nouveau server.cjs fourni dans le ZIP.
- Redémarrer 02-demarrer-windows.cmd pour prendre en compte phase16 / phase32.
- Ouvrir pilami.fr/strudel/, connecter Link, ouvrir Snapshots & Morphing.
- Choisir Déclenchement : Immédiat, Prochain temps, Prochaine mesure, Prochain cycle de 4 mesures ou de 8 mesures.
- Tester clic sur le rappel et sur la flèche de morphing, puis un contrôleur MIDI ou un déclencheur audio.
- Un nouveau déclenchement remplace le précédent en attente ; Pause ou Annuler l’attente annule le déclenchement.
- Sans Link, toutes les actions restent immédiates ; la préférence est locale au navigateur (pas WordPress).
- IMPORTANT : les transitions visuelles sont calées approximativement aux frontières Link via WebSocket.
  La précision n'est ni audio-sample-accurate ni garantie sous forte charge du navigateur.

Pilami Strudel Lab 0.39.15

COMMANDES VISUELLES REPLIABLES ET TITRES CENTRÉS
Le panneau flottant de la page démarre réduit en bas à droite.
Le bouton ▤ affiche les commandes ; le bouton − les replie.
Échap ferme les réglages ouverts, ou replie le panneau si les réglages sont fermés.
Le panneau réduit ne montre ni commandes ni messages et ne change pas le visuel.
Les titres des paramètres sont recentrés dans leur bouton, à côté du logo MIDI.

Pilami Strudel Lab 0.39.13

MIDI LEARN COMPACT SUR LES PARAMÈTRES
Le logo MIDI Learn se trouve en haut à droite de chaque bloc de paramètre.
Clique-le puis bouge un contrôleur ou joue une note compatible.
Il clignote pendant l’attente ; un second clic annule.
Le survol indique la liaison actuelle. Délier MIDI et inverser la plage
restent accessibles en bas du bloc associé. Sans liaison, cette ligne disparaît.
Inclus dans les fenêtres détachées et les nouveaux packs VJ hors ligne.

Pilami Strudel Lab 0.39.12

LOGO MIDI LEARN DANS LES ASSOCIATIONS
Dans Contrôler avec un appareil MIDI → Associations → Modifier,
le logo remplace le bouton Apprendre. Il clignote en attendant un message MIDI.
Le survol indique Apprendre ou Annuler l’apprentissage MIDI.
Un nouveau clic arrête l’attente. Enregistrer valide les champs détectés.
Disponible aussi dans les contrôleurs détachés et les nouveaux packs VJ.

Pilami Strudel Lab 0.39.11

MIDI LEARN SUR LES SNAPSHOTS
Capture une variation, puis clique le logo MIDI juste à gauche de la flèche.
Choisis Apprendre le rappel pour un changement immédiat, ou Apprendre le morphing
pour une transition depuis les réglages actuels. Joue une note ou envoie un CC.
Le logo clignote en attente, puis redevient fixe. Reclique-le pour annuler.
Le survol indique les associations ; le menu permet de les délier séparément.
Enregistre le preset ou les snapshots dans WordPress pour conserver les liens.
Logo inclus dans les contrôleurs détachés et les nouveaux packs VJ hors ligne.

Pilami Strudel Lab 0.39.10

RÉAPPRENDRE DEPUIS MODIFIER
Dans MIDI → Associations, clique Modifier puis Apprendre.
Bouge le potard ou joue une note : Message, Numéro, Canal et Entrée se remplissent.
La destination du formulaire reste choisie. Enregistrer valide la modification.
Annuler ou Échap ferme sans remplacer l’association précédente.
Apprendre peut être arrêté ou relancé avant l’enregistrement.
Les filtres Entrée et Canal MIDI s’appliquent comme pour le MIDI Learn habituel.

Pilami Strudel Lab 0.39.9

RECHARGEMENT SANS BANQUE ENREGISTRÉE
Corrige la liste vide renvoyée par WordPress quand aucun snapshot ou MIDI
n’a été enregistré : le rechargement ne bloque plus et retire les liaisons
locales non enregistrées. Les associations effectivement enregistrées sont
toujours restaurées avec le preset.

Pilami Strudel Lab 0.39.8

RECHARGER LA VERSION ENREGISTRÉE COMPLÈTE
Recharger le preset restaure le code, les snapshots et les associations MIDI
depuis la version WordPress actuelle. Les modifications non enregistrées du
preset sont retirées ; si aucun MIDI n’a été enregistré, aucune liaison ne reste.
Les banques d’autres presets ne sont pas touchées.
Si la lecture WordPress échoue, le brouillon reste conservé.
En hors ligne, le rechargement restaure la version incluse dans le pack VJ.

Pilami Strudel Lab 0.39.7

INVERSER LA PLAGE MIDI
Le bouton + / − apparaît à droite de MIDI Learn et Délier MIDI pour un CC lié.
+ : MIDI 0 → Min, MIDI 127 → Max.
− : MIDI 0 → Max, MIDI 127 → Min.
Le survol indique Inverser plage MIDI et le sens actuel.
Garde les bornes dans l’ordre Min < Max : pour +3 → −3 en MIDI, règle Min −3,
Max 3 puis clique sur le bouton pour afficher −.
Chaque paramètre garde son propre sens, même avec un CC partagé.
Le choix est enregistré avec les associations et le lissage MIDI reste actif.
La réponse du contrôleur à la souris et les liaisons audio ne changent pas.

Pilami Strudel Lab 0.39.6

CC PARTAGÉS ET COMMANDES DIRECTES
Un même CC peut piloter plusieurs paramètres. Apprends ou attribue le même CC
à chaque paramètre ; les associations précédentes restent en place.
Chaque destination garde ses propres Min/Max et le lissage MIDI habituel.
Notes et commandes de snapshots/morphing gardent une destination par source.
Sous chaque paramètre, Délier MIDI retire uniquement sa liaison, sans chercher
dans Associations. Le bouton reste accessible avec les réglages repliés.
Dans la fenêtre Hydra · Contrôleurs, Recharger le preset revient au code enregistré
du preset sélectionné et relance le visuel. Cela remplace le code non enregistré ;
les banques de snapshots et associations restent conservées.
La sauvegarde WordPress et les nouveaux packs VJ acceptent les CC partagés.

Pilami Strudel Lab 0.39.5

UNE SOURCE AUDIO, PLUSIEURS PARAMÈTRES
Dans Contrôleurs → Réagir au son, clique une source audio, puis les titres
des paramètres à lier. La source reste sélectionnée pour ajouter d’autres cibles.
X, Y et le pad entier restent des destinations possibles.
Le bandeau rappelle la source et ses destinations. Clique Terminer les liaisons,
reclique la source, ou appuie sur Échap hors d’un champ pour terminer.
Chaque paramètre garde sa propre profondeur ; terminer ne retire aucune liaison.
Les confirmations de liaison restent dans le panneau Sources audio, sans occuper
le statut général de lecture Hydra. Même comportement dans les fenêtres détachées
et les nouveaux packs VJ hors ligne.

Pilami Strudel Lab 0.39.4

HAUTEUR STABLE DES VALEURS AUDIO
Valeur avec audio apparaît sur deux lignes fixes : libellé, puis valeur et liaison.
La hauteur ne change plus quand les valeurs audio varient rapidement.
Les détails longs sont abrégés à l’écran ; survole la zone pour le texte complet.
Même correction dans les fenêtres détachées et les nouveaux packs VJ hors ligne.

Pilami Strudel Lab 0.39.3

LISSAGE MIDI
Dans Contrôleurs → MIDI, règle Lissage MIDI entre 0 et 300 ms.
60 ms par défaut ; 0 ms pour la réponse immédiate ; 150–300 ms pour plus d’inertie.
Les deux axes du pad XY, les potards, sliders et faders suivent chaque cible
progressivement, avec des valeurs intermédiaires à chaque image.
Le choix reste mémorisé dans ce navigateur et commun aux fenêtres détachées.
Les boutons, snapshots, notes et paramètres à pas entier restent discrets.
Le mouvement s’interrompt quand tu reprends le contrôle à la souris ou rappelles
un snapshot. Les associations MIDI et les liaisons audio restent compatibles.
Disponible aussi dans les nouveaux packs VJ hors ligne.

Pilami Strudel Lab 0.39.2

MODIFIER UNE ASSOCIATION MIDI
Dans Contrôleurs → MIDI → Associations, clique Modifier sur la ligne.
Le formulaire reprend la destination, le type Note/CC, le numéro, le canal
et l’entrée MIDI. Exemple : remplacer Rappeler le snapshot 2 par Morpher
vers le snapshot 2 en conservant la note 57 et le canal 16.
Enregistrer applique ; Annuler ou Échap ferme sans modifier.
Un conflit ne supprime aucune association : corrige le champ indiqué.
Enregistre ensuite le preset dans WordPress pour conserver les changements.
Disponible aussi dans les contrôleurs détachés et les nouveaux packs VJ.

Pilami Strudel Lab 0.39.1

ATTRIBUTION MANUELLE DES CC MIDI
Dans Contrôleurs → MIDI, choisis la destination (par exemple Centre Y).
Sélectionne l’entrée MIDI (PILAMI-HYDRA si tu passes par Ableton) et le canal.
Ouvre Attribuer un CC manuellement, saisis CC2 et le canal transmis (16 dans
notre routage Ableton), puis clique Attribuer le CC. Fais de même pour X / CC1.
Cette attribution ne demande aucun mouvement sur le pad et conserve l’autre axe.
Le MIDI Learn refuse désormais de voler un CC déjà lié à une autre destination.
Pour réaffecter volontairement ce CC, délie d’abord l’ancienne association.
Enregistre le preset dans WordPress pour garder les associations.
Correctif inclus dans les contrôleurs détachés et les nouveaux packs VJ.

Pilami Strudel Lab 0.39.0

PREMIÈRE PASSE DE LISIBILITÉ
Choisis un preset, puis Lancer la musique ou Lancer le visuel.
La sélection d’un preset ne lance pas la lecture.
Les paramètres du visuel apparaissent en premier dans les Contrôleurs.
Snapshots, sources audio et MIDI se déplient ensuite, au besoin.
Réglages du contrôleur : présentation, Min/Max et MIDI Learn.
Le code est sous Modifier le code ; Ctrl + Entrée applique les changements
depuis l’éditeur. Le bouton de lecture devient Appliquer les modifications.
Sauvegarder et partager regroupe le nom et les commandes d’enregistrement.
Fenêtres et outils avancés regroupe les fenêtres séparées, le Designer et
Raccourcis et écrans. F/G/H gardent leur fonctionnement et leurs réglages.
L’entrée audio principale est sous Entrée audio · connexion et réglages.
Toutes les commandes existantes restent accessibles, y compris en hors ligne.
Les données, presets, snapshots et associations existants restent compatibles.

Pilami Strudel Lab 0.38.0

VERSION 0.38.0 — RACCOURCIS CLAVIER ET ÉCRANS

Hydra → barre Détacher → Raccourcis et écrans.
F : visuel sur écran 2, sinon écran principal.
G : contrôleurs Hydra sur écran 3, sinon écran principal.
H : code Hydra sur écran principal.

Chrome/Edge : clique sur Détecter les écrans et accorde l’autorisation du
navigateur. Choisis les moniteurs par leur nom, puis Enregistrer. La numérotation
applicative place le principal en premier ; elle peut différer de celle de Windows.
Firefox : déplace les fenêtres manuellement sur les écrans souhaités.
Les touches, destinations et activation sont mémorisées dans le navigateur.
Chaque bouton Tester enregistre aussi les réglages affichés avant de lancer l’action.
Un champ Touche vide désactive cette action. Une touche doit être unique.

Les fenêtres déjà ouvertes sont réutilisées. Si un écran détecté est absent,
la destination revient sur le principal. Aucun raccourci ne s’active pendant
la saisie dans un champ ou dans le code, ni avec Ctrl/Alt/Meta ou par répétition.
L’appli doit avoir le focus. Clique sur un titre ou un bouton pour quitter le
focus du code avant d’utiliser une lettre comme raccourci.

Dans la fenêtre cible déjà en plein écran, sa touche revient en mode fenêtre.
Échap quitte le plein écran. Le navigateur peut demander un clic dans la
fenêtre cible : un bouton Plein écran est alors proposé, avec F11 en secours.
Le mode visuel épinglé Au-dessus repasse en fenêtre classique pour le plein écran.
Garde la page principale ouverte. Les nouveaux packs VJ incluent ces commandes.
Les liaisons audio et snapshots conservent les correctifs 0.37.7.

Pilami Strudel Lab 0.37.7

VERSION 0.37.7 — LIAISONS AUDIO CONSERVÉES PENDANT LE MORPHING

Les morphings font évoluer les réglages visuels et conservent les liaisons
audio en cours (source et profondeur), pendant la transition et à l’arrivée.
Par exemple, C5 peut continuer à moduler la saturation tandis que les autres
notes déclenchent des morphings vers des snapshots plus anciens.

Compatible avec morphing vers un snapshot, MIDI, triggers audio, transitions
A/B aller/retour et curseur manuel. Il n’est pas nécessaire de recapturer tous
les snapshots. Les captures existantes restent conservées.

Le rappel instantané d’un snapshot conserve son comportement de restauration
complète des réglages et liaisons enregistrés. Le changement concerne les
morphings. Un réglage MIDI pris en main pendant une transition garde sa priorité.

Pilami Strudel Lab 0.37.6

VERSION 0.37.6 — TROIS ÉTATS DE LIAISON

Gris : aucune liaison.
Mauve : liaison créée dans les contrôleurs (paramètre ou snapshot).
Ambre : lecture directe FFT dans le code du script.
Si les deux types existent, la source est mauve et affiche les deux destinations.

Les lectures a.fft présentes dans le code sont détectées sans exécuter ce code :
indices explicites, variables simples et appels à des fonctions de lecture
comme niveauAudio(0). Une lecture dynamique non résolue indique les bandes
possibles ; le détail porte alors sur la présence dans le code, pas une détection
instantanée du son. Le comportement audio initial des scripts est conservé.

Cliquer sur une source pour voir ses liaisons. Clic droit pour Désactiver la
liaison du code, Réactiver la liaison du code, ou Délier cette source (toutes
ses liaisons). Délier est masqué si la source n’a aucune liaison.
Une liaison manuelle n’annule pas une désactivation volontaire de la liaison
du code. Les lectures explicites window.a.fft d’un script externe restent
hors de ce réglage. Mettre à jour le preset pour enregistrer ces choix.

Fréquences : partie entière affichée (130,813 Hz devient 130 Hz).
La fréquence exacte du filtre est conservée en interne, y compris si les
 autres réglages sont modifiés sans toucher au champ Fréquence.

Pilami Strudel Lab 0.37.5

VERSION 0.37.5 — AFFICHER LES DESTINATIONS D’UNE SOURCE

Cliquer sur une source liée affiche sous les sources ses destinations :
paramètres, axes X/Y, rappel de snapshot ou morphing avec le numéro.
Exemple : A#3 → Vitesse_Zoom · Morpher vers le snapshot 3.
Clic droit pour modifier ou délier. Pour une source sans liaison, le message
reste Aucune liaison : clique une destination. Les infobulles indiquent
également les destinations précises.

Pilami Strudel Lab 0.37.4

VERSION 0.37.4 — SOURCES NON LIÉES GRISÉES

Gris : aucune liaison aux paramètres ou aux snapshots.
Mauve : une ou plusieurs liaisons existent.
La disponibilité de l’entrée audio ou d’une bande FFT ne change pas ce code couleur.
Les vumètres restent visibles. Délier cette source la rend grise à nouveau.
Le contour gris pointillé indique une source non liée sélectionnée pour une liaison.

Pilami Strudel Lab 0.37.3

VERSION 0.37.3 — AUCUNE DESTINATION PAR DÉFAUT

Clic droit sur une source : la destination est initialement vide.
Choisir explicitement un paramètre, pad ou snapshot pour activer Lier.
Délier cette source fonctionne sans choisir de destination.
Les liaisons déjà enregistrées sont indiquées dans le menu.

Inclut le correctif 0.37.2 : délier une FFT neutralise aussi ses lectures
directes a.fft dans le script actif (comme l’accélération du zoom Julia).
Pour les réactiver : créer une nouvelle liaison ou choisir Réactiver
l’audio du script dans le menu du clic droit.

Pilami Strudel Lab 0.37.2

VERSION 0.37.2 — DÉLIAISON DES FFT INTÉGRÉES AU SCRIPT

Clic droit sur une FFT > Délier cette source : retire ses liaisons et
neutralise ses lectures directes a.fft dans le script actif. Dans Julia,
FFT 0 peut accélérer le zoom via niveauAudio(bandeZoom), indépendamment
d’un audioMod sur Vitesse_Zoom. Cette accélération est désormais neutralisée.
Le niveau brut reste visible dans le vumètre et les autres FFT continuent.
Les lectures explicites window.a.fft par un script externe ne sont pas modifiées.

Nouvelle liaison à cette FFT, ou clic droit > Réactiver l’audio du script,
pour revenir aux lectures audio normales. La neutralisation est conservée
dans le code du preset : Mettre à jour le preset pour la sauvegarder.
Les snapshots conservés peuvent rétablir leurs modulations audioMod ; la
neutralisation des lectures directes du script reste celle du preset.

Pilami Strudel Lab 0.37.1

VERSION 0.37.1 — DÉLIER PAR CLIC DROIT

Clic droit sur une source audio > Délier cette source.
Retire toutes ses liaisons aux paramètres, X/Y des pads, et son éventuel
rappel de snapshot ou morphing. La source et ses réglages restent disponibles.
Les sources liées sont colorées en mauve ; leur infobulle indique les destinations.
La couleur revient à son aspect normal après déliaison.
Le menu affiche les paramètres actuellement liés. Le bouton est grisé
si la source n’a aucune liaison active.

Mettre à jour le preset pour enregistrer ce changement dans WordPress.
Les captures déjà enregistrées gardent leurs liaisons : rappeler une capture
peut donc rétablir une modulation capturée, comme les autres réglages du snapshot.
Pour modifier cette capture, la remplacer après avoir délié la source.

Pilami Strudel Lab 0.37.0

VERSION 0.37.0 — SOURCES AUDIO PAR NOTE / FRÉQUENCE

1. Charge un visuel et applique-le avec Hydra / Update.
2. Contrôleurs > Sources audio > Sources par note / fréquence.
3. Clique + C Mixophonic · 11 notes (A4 = 440 Hz par défaut), ou crée
   une source personnalisée. G3 = 195,998 Hz ; largeur par défaut ± 5 Hz.
4. Clique Activer l’entrée audio. Utilise le vumètre pour régler
   sensibilité et seuil. Le micro reste l’entrée audio choisie du navigateur.
5. Clic droit sur une source, puis choisis un paramètre, X/Y du pad,
   Rappeler un snapshot ou Morpher vers un snapshot. Le bouton Lier… dans
   les réglages ouvre le même menu. Glisser-déposer et liaison en deux clics
   restent disponibles. Les snapshots vides sont désactivés dans la liste.
6. Mettre à jour le preset enregistre sources, réglages et déclenchements
   dans WordPress. Sauvegarder un essai conserve également ces réglages.

Niveau continu : enveloppe du signal filtré, entre 0 et 1, pour moduler
les contrôleurs avec leur profondeur habituelle. Fréquence, largeur,
sensibilité, attaque et relâchement sont réglables par source.

Nouvelle frappe : déclenchement au-dessus du seuil, réarmement sous 55 %
du seuil, ou nouvelle montée au-dessus du facteur choisi. Délai minimum
300 ms par défaut. Une source a une action de snapshot, indépendante
 de ses modulations continues. Les événements pendant une transition
sont ignorés. Pas de lecture au simple chargement d’un preset.

La demi-largeur est approximative à −3 dB : le filtre est progressif,
pas un découpage absolu à ± 5 Hz. Une source mesure l’énergie autour de
la fréquence, sans garantir une identification polyphonique. La protection
des harmoniques réduit certaines frappes simultanées liées à une note plus
grave connue ; elle peut aussi masquer une vraie octave jouée simultanément.
Désactive-la pour cette source si nécessaire. Les réglages devront être
validés avec le tonguedrum, le micro et le niveau d’entrée réels.

Les 32 sources personnalisées occupent les identifiants 16–47 dans audioMod ;
les bandes a.fft[0–15] restent indépendantes. Les identifiants personnalisés
ne sont pas des indices supplémentaires du tableau a.fft. Leur configuration
est conservée dans le commentaire PILAMI_NOTE_SOURCES_V1 du script.
Une source liée à un contrôleur ou à un snapshot ne peut pas être supprimée
avant d’en retirer ces liaisons, pour éviter des références silencieuses.

Pilami Strudel Lab 0.36.0

VERSION 0.36.0 — RANDOM À PUISSANCE RÉGLABLE

Dans les contrôleurs, Random fait varier les valeurs du preset courant.
Puissance : 0 % ne change rien ; une faible puissance apporte de petits écarts ;
100 % permet un tirage sur toute la plage Min–Max. Le curseur et le champ
numérique sont synchronisés avec la fenêtre détachée. La puissance est
mémorisée dans ce navigateur.

Les bornes, pas, présentations, pads XY et liaisons audio sont conservés.
Les interrupteurs restent binaires : la puissance règle leur probabilité de
participer au tirage. Random ne relance pas Hydra.

Annuler Random restaure les valeurs d'avant le dernier tirage. L'annulation
reste possible tant qu'aucune autre édition des contrôleurs ou transition
n'a changé les paramètres. À chaque nouveau tirage, une nouvelle annulation
remplace la précédente.

Random est indisponible pendant une transition ou sa préparation. Une capture
de snapshot peut mémoriser la variation ; les captures existantes restent
intactes. Mettre à jour le preset conserve les valeurs dans WordPress.

Installation : remplace l'extension WordPress avec ce ZIP puis Ctrl+F5.
Télécharge un nouveau Pack VJ hors ligne pour disposer aussi de Random.

Pilami Strudel Lab 0.35.1

VERSION 0.35.1 — FLÈCHE MORPHER VERS UN SNAPSHOT

Chaque snapshot possède désormais deux boutons accolés : le bouton principal
capture un emplacement vide ou rappelle instantanément une capture existante ;
la petite flèche à droite lance une transition depuis les réglages actuels vers
ce snapshot. Elle reprend la durée et le lissage sélectionnés, comme la
destination MIDI Learn « Morpher vers », sans devoir choisir De / Vers.
La flèche est désactivée pour un emplacement vide et pendant une transition.
Les fenêtres détachées et les nouveaux exports VJ disposent du même bouton.



VERSION 0.35.0 — DIX SNAPSHOTS
Dix variations par preset, disponibles dans les contrôleurs intégrés, détachés
et plein écran. Capture, rappel et morphing fonctionnent avec les dix emplacements.
Les banques existantes gardent leurs captures 1 à 4 ; les emplacements 5 à 10
sont vides au départ. Les réglages de durée, lissage et associations MIDI restent
conservés. Les anciennes sauvegardes locales, WordPress et exports restent lisibles.
MIDI Learn propose le rappel et « Morpher vers » pour chaque snapshot 1 à 10.
La durée et le lissage s'appliquent à toutes les destinations ; une note pendant
une transition reste ignorée. Un CC de paramètre conserve sa prise en main locale.
Clique sur Enregistrer dans WordPress pour sauvegarder les nouvelles captures
et associations. L'export VJ embarque les dix snapshots ; il faut réexporter son
pack pour profiter de cette version hors ligne. Le guide PDF reste accessible.
Deux rangées de cinq sur grand écran, deux colonnes sur mobile ; le panneau
cesse d'être fixe sur les fenêtres basses afin de laisser les paramètres accessibles.
Après une édition manuelle compatible du code (par exemple un commentaire),
Mettre à jour le preset sauvegarde aussi les snapshots même si les contrôleurs
ne sont plus affichés. Le message confirme leur nombre ; un conflit ou échec
est signalé explicitement, sans supprimer les captures locales.
La limite d'une banque WordPress passe à 1 Mo pour les presets riches en contrôleurs.

VERSION 0.34.3 — GUIDE RAPIDE PDF

Un lien « 📖 Guide rapide (PDF) » est disponible sous l’introduction du
laboratoire, pour tous les visiteurs. Il ouvre le PDF hébergé dans la
médiathèque de pilami.fr dans un nouvel onglet et garde l’application ouverte.

VERSION 0.34.2 — TRANSITIONS PLUS LÉGÈRES

Pendant les changements en direct, les écritures du brouillon local sont
regroupées (au plus une toutes les 500 ms) et le dernier état est conservé lors
de la sortie de page. Le code courant reste immédiatement disponible pour
enregistrer dans WordPress ou exporter. Le calcul des paramètres continue à
chaque image, avec la durée et le lissage choisis.
Le Designer masqué ne redessine plus à chaque image ; ouvert, il suit le code
à sa cadence habituelle. Les contrôleurs s’affichent à 20 Hz pendant les
transitions et les fenêtres de code se synchronisent toutes les 200 ms.
Le Designer suspend aussi son horloge et ses vumètres quand il est masqué,
minimisé ou que sa fenêtre n’a plus le focus, puis reprend automatiquement.
Ces optimisations réduisent le travail de l’interface ; un shader trop lourd
pour le GPU peut toujours provoquer des ralentissements.

VERSION 0.34.1 — CONTRÔLE MIDI PENDANT LE MORPHING

Un paramètre modifié par MIDI pendant le morphing prend la main sur ce seul
contrôleur ; les autres poursuivent leur transition. Les dernières valeurs MIDI
restent appliquées à l’arrivée. Les bornes et liaisons audio du contrôleur touché
restent celles qu’il avait lors de la prise en main. Le son continue à moduler
sa valeur de base. Aucun snapshot enregistré n’est modifié.
À la transition suivante, tous les contrôleurs participent à nouveau.
Ce comportement vaut aussi pour A → B / B → A et les interrupteurs MIDI.
Pause, la position MIDI et les modifications à la souris conservent leur
prise en main globale, qui interrompt le morphing.

VERSION 0.34.0 — MORPHING MIDI VERS UN SNAPSHOT

Dans MIDI Learn → Destination, choisis « Morpher vers le snapshot 1 »
(ou 2, 3, 4), clique Apprendre puis joue la note souhaitée.
La première note apprend l’association ; les suivantes lancent la transition.
Capture les snapshots auparavant et règle la durée et le lissage dans le panneau.
Pas besoin de choisir De / Vers : le départ est l’état actuel des contrôleurs,
même après des réglages libres ou une transition mise en pause.
Les nouvelles notes de ces destinations sont ignorées pendant une transition
ou sa préparation audio, sans mise en attente. Si la cible est déjà atteinte,
aucune transition n’est lancée. Les emplacements vides ne sont pas capturés.
Les valeurs, bornes, présentations et liaisons audio suivent le morphing.
Les boutons « Rappeler » gardent leur changement immédiat ; Pause ou une
modification manuelle permet d’interrompre une transition.
Enregistre dans WordPress pour conserver les nouvelles associations MIDI.

VERSION 0.33.0 — MIDI LEARN

1. Lance ton preset avec Hydra / Update, puis ouvre les Contrôleurs.
2. Clique sur Activer le MIDI et autorise son accès dans le navigateur.
3. Choisis l'entrée et le canal (ou laisse toutes les entrées / tous les canaux).
4. Sur un paramètre, clique MIDI Learn puis bouge ton contrôleur CC.
   Dans le panneau MIDI Learn, la liste Destination permet aussi d'apprendre
   les snapshots, les transitions, la position et la durée du morphing.
5. Enregistre dans WordPress (panneau Snapshots) pour conserver les associations
   avec le preset. Mettre à jour le preset les sauvegarde également.

Les associations sont aussi conservées localement et dans le pack VJ exporté.
Aucune capture de snapshot n'est nécessaire pour enregistrer des liaisons MIDI.
La connexion MIDI s'active manuellement à chaque ouverture du navigateur.
Les entrées et canaux mémorisés dans chaque association filtrent les messages.
Un message déjà associé est réaffecté à la nouvelle destination, sans doublon.

Paramètres : CC 0–127 sur les bornes Min/Max actuelles, avec le pas du contrôle.
Interrupteurs : CC (seuil 64) ou note qui inverse l'état à chaque Note On.
Snapshots : rappel uniquement ; capture une variation au préalable à la souris.
Transitions : note ou montée CC au seuil 64 ; relâcher remet le bouton MIDI à zéro.
Position : CC, de 0 à 100 %. Durée : CC, de 0,1 à 30 secondes.
Le contrôle MIDI conserve les liaisons audio ; le son s'ajoute à la valeur de base.
Les notes relâchées et Note On de vélocité 0 ne déclenchent pas les actions.

Ableton sur le même ordinateur Windows : crée un port dans loopMIDI, active
Track / Piste sur ce port de sortie dans Live, puis choisis-le dans MIDI To
sur ta piste de clips MIDI. Sélectionne ce port dans l'application.
Pour ce trajet Ableton → application, désactive l’entrée du même port dans Live
et laisse Sync / Télécommande désactivés sur ce port pour éviter les retours.
Entre deux ordinateurs : utilise une liaison MIDI matérielle ou un port MIDI réseau.

Le MIDI requiert un navigateur compatible Web MIDI et un contexte autorisé
(HTTPS, localhost ; fichier local selon le navigateur). Aucun serveur externe
n'est utilisé pour le MIDI. Si ton navigateur refuse l'accès, autorise le MIDI
pour cette page. Firefox peut demander son mécanisme d'autorisation spécifique.

hydra-midi 0.4.6 est embarqué :
  await initHydra()
  await loadHydraExtension('midi')
  await midi.start({input:'*',channel:'*'})
  osc(cc(74).range(2,40),0.1,0.7).out(o0)
Les URL jsDelivr/unpkg de hydra-midi sont également reconnues et chargées localement.
Dans le code Hydra, note()/cc() sont isolés des fonctions Strudel.
Désactiver le MIDI met aussi en pause la bibliothèque utilisée par les scripts ;
pour reprendre ces scripts, réexécute midi.start() (ou Hydra / Update).

Installation : remplace le plugin WordPress avec ce ZIP, puis Ctrl+F5.

Pilami Strudel Lab 0.32.0

VERSION 0.32.0 — SNAPSHOTS DANS WORDPRESS

Administrateur connecté : lance ton preset avec Hydra / Update, puis utilise
Enregistrer dans WordPress dans les contrôleurs pour sauvegarder les quatre
captures, la durée et le lissage. La fenêtre détachée dispose du même bouton.
Mettre à jour le preset enregistre le code actuel et sa banque de snapshots.
La sauvegarde des snapshots seule ne modifie pas le code et ne relance pas Hydra.

Depuis un autre ordinateur ou navigateur, connecte-toi à WordPress, charge le
preset puis Hydra / Update : les snapshots sont récupérés automatiquement.
Tes anciennes captures locales restent disponibles. Enregistre-les une fois
avec le nouveau bouton pour les transférer dans WordPress.

Si des versions locales et WordPress différentes existent, tu peux charger
la version WordPress ou enregistrer ta version locale après confirmation.
Une modification concurrente, une erreur réseau ou une session expirée ne
supprime pas les captures locales. La sauvegarde WordPress est explicite ;
les changements de contrôleurs et le morphing ne déclenchent pas de requêtes.
Les visiteurs ne disposent pas de la sauvegarde WordPress ni des captures admin.

Les nouveaux packs VJ hors ligne emportent aussi les banques WordPress.
Les modifications effectuées hors ligne restent locales au fichier HTML.

Installation : remplace le plugin WordPress avec ce ZIP puis Ctrl+F5.

Pilami Strudel Lab 0.31.0

VERSION 0.31.0 — LISSAGE DU MORPHING

Active Lissage auto dans les contrôleurs. Choisis un Profil : Départ doux,
Arrivée douce ou Départ et arrivée doux. Choisis la Courbe : Sinusoïdale,
Quadratique ou Cubique. L’aperçu montre la progression de la transition.
Sans lissage, le fondu reste linéaire. Le curseur manuel garde son contrôle
 direct et la Durée en secondes reste identique avec ou sans lissage.
Le profil suit le sens de lecture : Départ doux ralentit le début du trajet,
y compris en sens inverse. Le son continue de moduler les paramètres.
Modifier le lissage pendant un fondu met en pause la transition en gardant
les valeurs actuelles ; les nouvelles flèches repartent de leur snapshot.
Les réglages de lissage sont conservés avec la banque du preset dans ce
navigateur et inclus dans les nouveaux packs VJ hors ligne.
Les anciens snapshots restent disponibles ; le lissage est désactivé par défaut.

Installation : remplace le plugin WordPress avec ce ZIP puis Ctrl+F5.
Pour les performances hors connexion, télécharge un nouveau Pack VJ hors ligne.

Pilami Strudel Lab 0.30.1

VERSION 0.30.1 — SÉLECTION STABLE DES SNAPSHOTS

Correction du clignotement des menus De / Vers pendant la sélection d’un
snapshot. Les rafraîchissements des contrôleurs ne réécrivent plus les options
inchangées et préservent la sélection au clavier. Correction également présente
dans les fenêtres détachées et les nouveaux packs VJ hors ligne.
Les snapshots existants restent conservés.

Installation : remplace le plugin WordPress avec ce ZIP puis Ctrl+F5.
Pour les performances hors connexion, télécharge un nouveau Pack VJ hors ligne.

Pilami Strudel Lab 0.30.0

VERSION 0.30.0 — SNAPSHOTS ET MORPHING

Dans les contrôleurs Hydra (y compris la fenêtre détachée plein écran), clique
sur un snapshot vide pour capturer les réglages. Un emplacement rempli rappelle
sa variation ; Remplacer capture à nouveau les réglages dans cet emplacement.
Quatre variations sont disponibles par preset.

Choisis De et Vers, puis déplace le curseur de morphing, ou indique une Durée
en secondes et clique sur 1 → 2 / 2 → 1 (les numéros suivent ta sélection).
Une transition automatique repart du snapshot indiqué par la flèche. Pause
la fige ; un mouvement du curseur ou une modification de contrôleur reprend
la main et interrompt la transition. La durée peut être ajustée pendant le fondu.

Les valeurs, bornes, présentations et liaisons audio sont capturées. Les
paramètres continus sont interpolés ; les contrôleurs entiers restent entiers.
Les interrupteurs basculent au milieu et doivent être des interrupteurs dans
les deux variations. Les nouvelles liaisons audio sont préparées avant le rappel.
Les profondeurs sont interpolées, ou passent par zéro lors du changement de bande.
Le son continue à moduler les valeurs pendant le morphing.

Les snapshots sont des réglages de contrôleurs, liés au preset et à la structure
du script. Une modification des shaders ou de la chaîne Hydra ouvre une autre
banque. Les variations restent conservées sur ce navigateur ; elles ne sont
pas enregistrées dans WordPress. Le bouton Mettre à jour le preset enregistre
la variation actuelle sous forme de code, comme auparavant.
Le Pack VJ hors ligne emporte les banques de snapshots et la durée choisie.

Installation : remplace le plugin WordPress avec ce ZIP puis Ctrl+F5.
Pour les performances hors connexion, télécharge un nouveau Pack VJ hors ligne.

Pilami Strudel Lab 0.29.1

VERSION 0.29.1 — SAISIE DIRECTE DES VALEURS HYDRA

La valeur affichée à droite du curseur, du potentiomètre ou du fader devient
un champ éditable. Entre la valeur puis appuie sur Entrée, ou clique ailleurs.
Échap annule la saisie. Les nombres négatifs, les décimales avec point ou
virgule et la notation scientifique sont acceptés.

Le réglage respecte Min, Max et le pas du contrôleur. La saisie reste stable
pendant que le visuel et la modulation audio continuent. Ce champ règle la
valeur manuelle ; la valeur effective avec audio reste indiquée en dessous.
Le code, les contrôleurs, les pads XY et les fenêtres détachées sont synchronisés.

Installation : remplace l'extension WordPress avec ce ZIP puis Ctrl+F5.
« Mettre à jour le preset » conserve le réglage dans WordPress.
Télécharge un nouveau Pack VJ hors ligne pour disposer aussi de cette saisie.

Pilami Strudel Lab 0.29.0

VERSION 0.29.0 — MIN / MAX SUR LES CONTRÔLEURS HYDRA

Chaque curseur, potentiomètre et fader propose maintenant deux champs Min et
Max. Saisis les deux bornes, puis clique sur Appliquer (ou appuie sur Entrée).
Échap annule la saisie en cours. Les interrupteurs gardent leurs bornes 0 et 1.

Le changement s'applique en direct, sans relancer Hydra, et met à jour le code.
La valeur manuelle est ramenée dans la plage si nécessaire ; le pas et les
liaisons audio sont conservés. Les pads XY utilisent les bornes de leurs axes.
La fenêtre détachée des contrôleurs partage les mêmes réglages.

Pour enregistrer les nouvelles bornes dans WordPress, utilise le bouton
« Mettre à jour le preset », comme pour les autres modifications du code.
Les sauvegardes locales, exports et partages utilisent aussi le code actualisé.

Installation : remplace l'extension WordPress avec ce ZIP, puis Ctrl+F5.
Télécharge un nouveau Pack VJ hors ligne pour y retrouver cette amélioration.

Pilami Strudel Lab 0.28.0

VERSION 0.28.0 — HYPER-HYDRA BLEND LOCAL

La bibliothèque hydra-blend de GEIKHA est intégrée au plugin, en plus de
lib-color, lib-noise et hydra-fractals. Elle propose 25 modes de fusion et ses
fonctions de transparence (32 noms avec pm / negate). Sources et licence GPL v3
conservées dans sources/hydra-extensions/.

Les scripts existants fonctionnent sans réécriture :
await loadScript('https://cdn.jsdelivr.net/gh/geikha/hyper-hydra@latest/hydra-blend.js')
charge la copie locale. On peut aussi utiliser await loadHydraExtension('blend').
Appeler initHydra avant de charger une extension.

Hydra-blend remplace luma, mask et layer pendant le preset qui le charge.
Les fonctions natives sont restaurées au prochain initHydra de l'éditeur.
Les alias pm / negate sont enregistrés sur le moteur actif. Le mode phoenix
utilise 1.0 plutôt que vec3(1.0) dans les affectations scalaires pour compiler.
Les autres formules de fusion sont celles de la bibliothèque originale.

Installation : remplace l'extension WordPress avec ce ZIP, puis Ctrl+F5.
Pour une performance sans connexion, télécharge de nouveau le Pack VJ hors ligne
après la mise à jour. Un ancien pack 0.27.0 n'inclut pas hydra-blend.

Pilami Strudel Lab 0.27.0

VERSION 0.27.0 — SHADERS LOCAUX ET VJ HORS LIGNE

Lib-color (11 fonctions), lib-noise (8) et hydra-fractals (6) sont intégrés au
plugin. Les anciens await loadScript avec leurs URL d’origine sont redirigés
vers ces copies locales ; aucun changement dans les presets n’est nécessaire.
On peut aussi écrire await loadHydraExtension('color'), 'noise' ou 'fractals'.
Les fonctions sont réenregistrées sur le moteur actif à chaque lancement.

Pour préparer une performance sans accès à Internet :
1. Installe ce ZIP en remplaçant l’extension, puis recharge avec Ctrl+F5.
2. Connecté comme administrateur, clique sur « Pack VJ hors ligne » dans Hydra.
3. Conserve le fichier Pilami-Hydra-VJ-….html et ouvre-le dans Chrome ou Firefox.
4. Choisis un preset et clique sur Hydra / Update ; autorise l’entrée audio.
5. Teste ce fichier sur l’ordinateur de performance en coupant la connexion.

Le fichier embarque le moteur Hydra, les trois bibliothèques, le catalogue
WordPress présent dans l’application au moment de l’export, le brouillon et
les essais locaux. Il inclut le Designer, les contrôleurs, les fenêtres de code
et de contrôleurs, la projection séparée et le plein écran. Aucune écriture
WordPress depuis ce fichier : les sauvegardes restent sur ce navigateur.
Les nouveaux presets seront inclus en téléchargeant un nouveau pack.

Hydra est autonome dans ce pack ; le moteur musical Strudel n’est pas inclus.
Les images distantes, BL4ST et toute autre dépendance externe ne sont pas
téléchargés. Pour les presets imageSource, choisis ton image sur le disque.
Les appels loadScript inconnus affichent une erreur explicite hors ligne.
Les formules Mandelbulb, Quaternion et Menger écrites dans les presets sont
déjà autonomes et ne nécessitent pas de bibliothèque externe.

La page pilami.fr reste un site WordPress : les shaders locaux retirent sa
dépendance aux CDN, mais l’ouverture du site exige encore l’accès au serveur.
Le fichier HTML autonome sert précisément à la performance sans serveur.
Sources et licences : sources/hydra-extensions/, sources/hydra-synth/,
assets/vendor/LICENSE-*.txt. Le pack propose aussi leur téléchargement.

VERSION 0.26.0 — SUPPRIMER UN PRESET HYDRA DEPUIS L’APPLICATION

Administrateur connecté : sélectionner un preset de la bibliothèque puis cliquer
sur « Supprimer le preset », à côté de « Mettre à jour le preset ». Confirmer son
nom pour le retirer du catalogue. Même commande dans les fenêtres détachées Code
et Contrôleurs. Le preset passe dans la corbeille WordPress, où il peut être
restauré tant que WordPress ne l’a pas purgée. La suppression définitive reste
dans WordPress ; si la corbeille est désactivée, cette commande refuse de supprimer.

Le code affiché, son nom, les contrôleurs et le rendu en cours sont conservés.
Le brouillon ne référence plus le preset retiré et peut être exporté, sauvegardé
localement ou recréé comme un nouveau preset WordPress. Un changement de preset
ou une saisie pendant la suppression ne sont pas écrasés par la réponse.

Les visiteurs n’ont pas le bouton. L’API DELETE exige la session administrateur,
le droit de suppression, le nonce REST et les révisions du contenu et des catégories.
Une erreur, une session expirée ou un conflit laisse le code et le catalogue intacts.
Les essais locaux ne sont pas supprimés. Après installation : Ctrl + F5 ; purger
le cache de la page si nécessaire. Le Designer 0.25.1 est conservé.

Vérifications : PHP 8.3 (syntaxe et API avec couche WordPress de test), navigateur
réel avec Hydra/WebGL, confirmation/annulation, fenêtres détachées, permissions,
révisions, erreurs réseau et serveur, conservation du brouillon et du rendu,
recréation du preset, course avec changement de sélection et essais locaux.
La suppression sur le WordPress de production est à vérifier après installation.


VERSION 0.25.1 — CONTRÔLEURS VISUELS DU DESIGNER

Les nœuds Bouton rotatif et Slider ont maintenant leur représentation visuelle interactive, dans le panneau et la fenêtre détachée. Les boutons de la liste à gauche servent toujours à ajouter un nœud.

Bouton rotatif : glisser vers le haut pour augmenter, vers le bas pour diminuer. Au clavier : flèches, Maj + flèches pour dix pas, Début/Fin pour les limites. Slider : glisser la poignée ou utiliser les flèches. La valeur, les bornes et le pas restent réglables dans les champs du nœud. Un geste forme une étape d’annulation ; les sauvegardes gardent la valeur. Update applique les changements au visuel.

Mise à jour : téléverser ce ZIP dans Extensions > Ajouter > Téléverser et remplacer l’extension existante, puis recharger avec Ctrl+F5.

VERSION 0.25.0 — IMPORT DES ANCIENS PRESETS HYDRA

1. Charge ton ancien preset dans le panneau Hydra.
2. Ouvre Designer, puis clique sur Importer le code.
3. Vérifie les nœuds ; le script affiché et la lecture en cours restent inchangés.
4. Clique sur Update pour envoyer et jouer le patch. Le remplacement du code demande confirmation.
5. Enregistre un nouveau preset WordPress pour garder une copie, ou mets à jour le preset sélectionné pour conserver la version nodale.

Les fonctions Hydra classiques deviennent des nœuds. Les paramètres FFT, fonctions fléchées, tableaux smooth/fast et références de variables restent des nœuds Expression. Leur valeur est exactement l’expression d’origine, sans ajout de normalisation ou changement de gain. Les générateurs personnalisés, notamment setFunction/fractales, sont conservés dans un nœud Source / bloc de code ; leur shader et initialisation restent dans Code conservé. Ce bloc n’éclate pas encore les paramètres internes du générateur en ports individuels.

Le code avant, entre et après les sorties reste dans son ordre d’origine : initHydra, définitions, contrôleurs, images, vitesse, render, nettoyage et commentaires. Les sections conservées sont visibles sous le canvas. Les changements de contrôleurs dans ces sections sont repris lors de la lecture du graphe. L’import lui-même analyse le JavaScript sans l’exécuter.

Prise en charge : chaînes Hydra classiques, feedback o0–o3, plusieurs sorties distinctes, sorties simples dans try/catch, variables et générateurs personnalisés déclarés dans le script. Les sorties conditionnelles, les boucles, fonctions avec sortie interne, affectations de .out(), sorties dynamiques et plusieurs chaînes vers le même buffer sont refusées sans toucher au code ni au graphe. Le message indique la cause et, si possible, la ligne. Limitations inchangées : 100 nœuds, script avec graphe de 64 Ko maximum.

Vérifications automatisées : scripts audio, branches, tableaux, buffers, ordre des sorties, sauvegarde/restauration, commandes de l’interface, et conversion des fichiers Julia, Mandelbulb, Quaternion et BL4ST. Le rendu WebGL et l’audio sur le navigateur de l’utilisateur restent à vérifier.

Mise à jour : téléverser le ZIP dans Extensions > Ajouter > Téléverser et remplacer l’extension existante, puis recharger la page avec Ctrl+F5.

Historique : les instructions ci-dessous décrivent la première version du Designer ; la restriction ancienne concernant l’import des scripts est levée dans les limites indiquées ci-dessus.

VERSION 0.24.0 — HYDRA DESIGNER (expérimental)

Ouvre Hydra > Designer. Le patch de démonstration contient osc + noise + modulate + color + out, une bande FFT et un knob. Update envoie le code au moteur Hydra et lance le visuel. Charger une démo ou éditer un nœud ne lance pas automatiquement le visuel.

Relie les ports bleus pour les images et les ports mauves pour les valeurs. Glisse une sortie sur une entrée, ou clique la sortie puis la destination. Une entrée prend un câble ; un nouveau câble le remplace. Clique un câble ou une entrée reliée pour débrancher. La molette zoome, le fond se déplace ; Cadrer affiche le patch. Annuler/rétablir et import/export JSON disponibles.

En fenêtre ouvre le Designer dans une fenêtre indépendante. Le moteur et les sauvegardes restent dans la page principale, qui doit rester ouverte. Rattacher revient au panneau. F11 ou Plein écran agrandit la fenêtre.

Nom du patch puis Créer un preset WordPress / Mettre à jour le preset enregistrent le code ET le graphe pour les administrateurs. Sauvegarder l’essai local conserve les deux dans le navigateur. Le graphe JSON est stocké dans un commentaire @pilami-designer-v1 du script, compatible avec le système existant de sauvegarde, partage et export texte. Conserver ce commentaire pour rouvrir les nœuds. Les scripts classiques ne sont pas convertis automatiquement. Un changement manuel de code nécessite confirmation avant remplacement par le graphe.

Le nœud Image utilise une URL HTTP(S) et s0. Pour une image personnelle, utilise le panneau Image source existant après Update ; enregistre l’image dans WordPress puis le preset. Les URL réécrites par ce panneau sont détectées comme modifications manuelles dans cette première version.

Les paramètres câblés utilisent directement la valeur de la source (FFT : offset + gain × niveau ; LFO : offset + gain × sinus). Les contrôleurs de la fenêtre Contrôleurs restent utilisables et leurs valeurs slider/knob/XY sont relues dans le graphe. Les liaisons audio ajoutées depuis cette autre fenêtre peuvent nécessiter confirmation avant une nouvelle génération du graphe. LFO au BPM utilise un tempo MANUEL, sans liaison Ableton Link dans cette version WordPress. Les effets personnalisés setFunction et l’import de scripts JavaScript en graphe ne sont pas pris en charge. Limites : 100 nœuds, code+graphe 64 Ko, une image s0, FFT 0 à 5.

Mise à jour : téléverser ce ZIP dans Extensions > Ajouter > Téléverser, puis remplacer la version installée. Recharger pilami.fr/strudel/ avec Ctrl+F5. Les presets WordPress existants sont conservés.

Pilami Strudel Lab — 0.23.0

INSTALLATION
WordPress → Extensions → Ajouter → Téléverser cette archive.
Si WordPress propose de remplacer l’extension actuelle, accepter le remplacement.
Le shortcode de la page ne change pas : [pilami_strudel]
Recharger la page avec Ctrl + F5. Purger le cache WordPress si l’ancien contenu reste affiché.

UTILISATION
Choisir un exemple puis Lecture / Update. Les changements de code sont appliqués
avec ce bouton ou Ctrl + Entrée (Cmd + Entrée sur Mac).
Stop arrête la lecture ; Alt + point fait la même chose.
Reset restaure le preset sélectionné. Tous les presets chargent uniquement leur code.
Le volume maître va de 0 à 100 %, sans remplacer le code ni relancer le morceau.
Un changement de preset charge le code dans l’éditeur ; le morceau en cours continue.

Cette version contient le moteur @strudel/web 1.3.0, son worker et sept sons
synthétiques originaux. Les exemples intégrés n’ont besoin d’aucun service externe.
Les banques générales du site strudel.cc ne sont pas toutes incluses.
Le navigateur doit prendre en charge Web Audio ; la lecture nécessite un geste utilisateur.
Un code utilisateur qui demande ses propres samples distants nécessite leur accès réseau.

VALIDATION
Test dans Chromium sur le HTML du shortcode : six presets, lecture/update,
stop, reset, raccourci clavier, erreur de syntaxe, récupération après erreur,
volume maître mesuré sur le signal audio, code préservé, responsive mobile.
Aucune requête distante pour les exemples. Syntaxe PHP analysée avec php-parser.

SOURCES ET LICENCES
Plugin : AGPL-3.0-or-later. Sources PHP, JS et CSS incluses dans cette archive.
Strudel : AGPL-3.0-or-later, copyright ses auteurs (voir assets/vendor/LICENSE-Strudel.txt).
Paquet original : https://registry.npmjs.org/@strudel/web/-/web-1.3.0.tgz
Source du bundle : sources/strudel-web/web.mjs et vite.config.js.
Dépôt : https://codeberg.org/uzu/strudel
Sources des dépendances de cette version :
https://registry.npmjs.org/@strudel/core/-/core-1.2.6.tgz
https://registry.npmjs.org/@strudel/mini/-/mini-1.2.6.tgz
https://registry.npmjs.org/@strudel/tonal/-/tonal-1.2.6.tgz
https://registry.npmjs.org/@strudel/webaudio/-/webaudio-1.3.0.tgz
https://registry.npmjs.org/@strudel/transpiler/-/transpiler-1.2.6.tgz
Sons : générés pour ce plugin (synthèse de sinusoïdes et de bruit), CC0.

CORRECTION 0.3.1
Noms de fichiers JS et CSS versionnés pour éviter les versions mélangées
quand les paramètres ?ver sont supprimés ou ignorés par le cache.

CORRECTION 0.3.2
Éditeur clair, texte et curseur bleu foncé, caractères de 16 px,
sélection contrastée et contour bleu lors de la saisie.

VERSION 0.4.0 — SAUVEGARDES ET WAV
Mes essais : donner un nom puis Sauvegarder. Choisir un essai puis Charger.
Les sauvegardes et le dernier brouillon restent dans ce navigateur (localStorage).
Ils ne sont pas synchronisés entre ordinateurs ou navigateurs. Effacer les données
du site supprime ces sauvegardes. En navigation privée, elles sont temporaires.
Exporter le code télécharge un fichier texte .strudel.js ; Importer du code accepte
.js et .txt (1 Mo maximum), sans démarrer la musique automatiquement.
Un nom déjà utilisé demande confirmation avant remplacement.

Enregistrer lance le code affiché et capture le son, avec les changements Update
et le volume maître. Terminer l’enregistrement prépare le WAV et laisse la musique
jouer ; Stop arrête la musique et termine aussi l’enregistrement.
Le WAV est stéréo PCM 16 bits à la fréquence audio du navigateur (souvent 44,1 ou
48 kHz), en temps réel et sans microphone. Limite de 5 minutes par prise.
Après la prise : écouter le résultat puis Télécharger le WAV. Le WAV reste seulement
sur la page jusqu’au téléchargement ; télécharger avant de fermer ou recharger.
L’enregistreur utilise AudioWorklet sur HTTPS. Aucun envoi sur WordPress.

Vérifications 0.4.0 dans Chromium : sauvegarde/chargement, restauration après
rechargement, export/import UTF-8, enregistrement WAV stéréo relu par le décodeur
Web Audio, signal présent avant/après Update, silence à volume zéro, finalisation
par Stop, récupération après code invalide, mise en page mobile, six presets et
commandes précédentes. Aucun service externe pour les exemples et l’enregistrement.
Validation dans Firefox/WordPress à faire après installation.

VERSION 0.5.0 — CURSEURS ET GENERAL MIDI
Les appels slider(valeur, min, max, pas facultatif) créent des curseurs sous
l’éditeur après Lecture / Update. Les changements agissent sur les prochains
événements audio sans relancer le morceau. Leur valeur est inscrite dans le code
et conservée dans le brouillon, les essais sauvegardés et les exports de code.
Un changement manuel du code masque les curseurs jusqu’au prochain Update.
Les sliders placés dans les commentaires sont ignorés.

Les instruments du registre officiel @strudel/soundfonts 1.2.0 sont disponibles,
notamment gm_piano, gm_clarinet et gm_rock_organ. Exemple :
setcpm(70)
note("c4 e4 g4 c5").s("gm_piano").gain(slider(.6,0,1))

Les banques audio sont téléchargées à la demande depuis :
https://felixroos.github.io/webaudiofontdata/sound/
Une connexion Internet et l’accès à ce domaine sont nécessaires. Le premier
chargement peut prendre quelques secondes. Les banques utilisées restent en
mémoire jusqu’au rechargement de la page. Un échec de chargement affiche une
explication et permet de réessayer. Les exemples synthétiques et la batterie
intégrée restent autonomes. L’enregistrement charge les instruments avant de
commencer la prise, pour éviter le silence de téléchargement en début de WAV.

Les fichiers JS/CSS modifiés portent le numéro 0.5.0 dans leur nom pour éviter
le mélange de versions en cache. Outils de sauvegarde et worklet inchangés : 0.4.0.

Adaptation AGPL du registre et du chargeur officiels, utilisant le même moteur :
https://registry.npmjs.org/@strudel/soundfonts/-/soundfonts-1.2.0.tgz
Voir assets/vendor/LICENSE-Soundfonts.txt. Le code de l’adaptation est fourni
sans minification dans assets/pilami-compat-0.8.2.js. Les banques externes ne sont
pas redistribuées dans ce ZIP. Leur script est lu comme des données, sans exécution.
Corrections du chargeur : décodage par zone en cache, erreurs de décodage propagées,
reprise après échec réseau et arrêt explicite des sources.

Validation 0.5.0 dans Chromium : exemple fourni avec arrange, $play, scale et lp
sans modification ; huit curseurs actifs ; commentaires ignorés ; effet réel
d’un curseur sur le signal audio ; Update et brouillon restaurent les valeurs ;
son mesuré pour piano, clarinette et orgue à partir des véritables banques officielles ;
échec réseau puis nouvelle tentative ; interface à 390 px ; sauvegarde, import/export,
WAV stéréo avec Update, volume zéro et Stop ; six presets existants et erreurs de syntaxe.
Les tests GM chargent des copies de test des banques officielles ; leur téléchargement
sur la page WordPress et Firefox doit être vérifié après installation.

VERSION 0.6.0 — APPARENCE DANS WORDPRESS
Après remplacement de l’extension : Réglages → Strudel — Apparence.
Un lien « Apparence » est également disponible dans la liste des extensions.
Les réglages sont réservés aux administrateurs (capacité manage_options).
Le formulaire utilise l’API native WordPress, ses contrôles d’accès et son nonce.

Réglages proposés : largeur maximale, hauteur de l’éditeur, taille du code,
espacement et arrondi des panneaux ; couleurs de l’éditeur, des curseurs et,
facultativement, des panneaux/boutons ; disposition sur une ou deux colonnes ;
introduction avec éditeur riche, sous-titre, conseil, titres ; visibilité des
panneaux, ouverture des essais ; exemples affichés et exemple de départ.

L’aperçu est une simulation sans audio. Les changements ne sont appliqués au
site qu’après « Enregistrer les modifications ». Les boutons dans l’aperçu
servent uniquement à illustrer l’apparence. Le bouton de réinitialisation
rétablit les réglages d’apparence après confirmation. Il ne touche pas aux essais.

Les réglages s’appliquent à tous les laboratoires utilisant [pilami_strudel].
Le titre général et le contenu autour restent modifiables dans Gutenberg.
La largeur est plafonnée par le conteneur de la page Blocksy. Les deux colonnes
s’affichent lorsque le laboratoire dispose d’au moins 850 px, puis repassent
sur une colonne sur mobile. Les couleurs des panneaux suivent le thème et le
mode sombre par défaut. Cocher la palette personnalisée les rend fixes ;
les couleurs de l’éditeur restent indépendantes du thème.

Les réglages sont conservés dans WordPress lors des mises à jour. Un brouillon
local reste prioritaire sur l’exemple de départ. Masquer les sauvegardes ou
l’enregistrement ne supprime aucune donnée. Surprise choisit uniquement parmi
les autres exemples affichés ; sans autre choix, un message l’explique.
Après enregistrement des réglages, recharger la page publique. Si nécessaire,
purger le cache WordPress/Cloudflare pour voir les changements.

Vérifications 0.6.0 : PHP exécuté et linté avec PHP.wasm ; valeurs bornées,
couleurs validées, exemples autorisés, reset et double passage du validateur ;
HTML du shortcode et de l’administration rendu avec des doubles des fonctions WP ;
aperçu interactif dans Chromium (textes, couleurs, taille, masquage, exemples,
connexion à un éditeur riche chargé tardivement) ; réglages personnalisés et
panneaux masqués, disposition responsive, lecture, priorité du brouillon ;
six presets, commandes, volume zéro, sauvegardes/import-export et export WAV.
Validation sur WordPress/Blocksy et Firefox à confirmer après installation.

VERSION 0.7.0 — VISUELS EN FOND OU EN PANNEAU
Sur la page Strudel, le bouton « Visuels : Fond / Panneau » est placé juste
au-dessus du bouton clair/sombre du plugin Pilami Dark Mode. Un clic alterne
entre le fond de page et un panneau sous l’éditeur. Sans bouton de thème,
les commandes restent disponibles en bas à droite.

Le bouton ⚙ ouvre les réglages en direct : opacité (0–100 %), teinte (0–360°),
intensité des couleurs (0–200 %) et hauteur du panneau (180–600 px, en mode panneau).
« Réglages d’origine » remet le fond de page et les valeurs initiales.
Le mode et les réglages sont mémorisés dans ce navigateur, indépendamment du
code et des réglages WordPress. Échap ferme les réglages ; un clic à l’extérieur
aussi. Le changement de mode ne relance ni la musique ni l’enregistrement.

Pour afficher des visuels, le code doit utiliser une fonction de visualisation :
setcpm(70)
note("c3 e3 g3 c4").s("sine").gain(.3).pianoroll()
Le contrôleur utilise le canevas par défaut de Strudel, test-canvas. Les codes
qui fournissent leur propre contexte de dessin personnalisé continuent à gérer
leur propre affichage. L’image reste sur la page ; l’export WAV contient le son.

Moteur, sons et réglages d’apparence 0.6.0 conservés. Contrôleur visuel et script
principal portent 0.7.0 dans leur nom ; les autres fichiers gardent leur version.
Vérifications dans Chromium : véritable piano roll dessiné, même canevas/contexte
entre les modes, musique et code conservés, réglages live, restauration après
rechargement, reset, thème sombre, placement au-dessus du bouton du thème à
1250 et 390 px, dimensions du panneau, fermeture clavier et absence de débordement ;
sauvegardes/import-export, WAV avec Update, volume zéro et Stop. PHP linté et
shortcode exécuté avec le banc de test existant. Validation Firefox/WordPress
à confirmer après remplacement de l’extension et purge du cache si nécessaire.

VERSION 0.8.0 — HYDRA
Hydra est disponible dans le code du laboratoire :
await initHydra({detectAudio:false})
osc(8,.15,1).rotate(.2).color(1,.4,.8).out()
setcpm(70)
note("c3 e3 g3").s("sine").gain(.3)

La bibliothèque hydra-synth 1.3.29 est incluse localement et chargée seulement
au premier appel à initHydra. Les visuels générés n’ont besoin d’aucun CDN.
Les images, vidéos et samples externes référencés dans ton code nécessitent
leur accès réseau et des autorisations CORS compatibles.
Utiliser des apostrophes simples autour des URL, comme dans les exemples Strudel.

Le même bouton « Visuels : Fond / Panneau » gère Hydra et le piano roll.
Les réglages d’opacité, teinte, intensité et hauteur s’appliquent aux deux.
Stop suspend l’animation Hydra sans effacer la dernière image. Lecture / Update
la relance. Un exemple ou un code sans initHydra retire Hydra et restaure les
fonctions Strudel qu’Hydra partage (shape, speed, noise, etc.). Un code erroné
suspend Hydra. Un Stop pendant le premier chargement annule son initialisation.
clearHydra() est également disponible dans le code pour retirer Hydra.
Le code et le niveau sonore restent indépendants des réglages visuels.

H permet de transmettre un pattern comme paramètre d’Hydra :
await initHydra()
osc(H("4 8 12"),.1,1).out()
note("c4").s("sine").gain(.2)

feedStrudel transmet le canevas Strudel à la source Hydra s0 et masque le dessin
original pour afficher le résultat transformé :
await initHydra({feedStrudel:1,detectAudio:false})
src(s0).kaleid(4).out()
note("c3 e3 g3 c4").s("sine").gain(.3).color("red blue yellow").pianoroll()
Les sources s1/s2/s3 restent utilisables pour charger des images ou des vidéos.

detectAudio est désactivé par défaut. L’activer utilise la capture audio native
d’Hydra et peut demander l’accès au microphone dans le navigateur.
Le contrôleur gère le canevas, sa résolution, sa boucle d’animation et la bibliothèque
locale ; les options src, canvas, autoLoop et makeGlobal restent sous son contrôle.
Le WAV enregistre le son de Strudel, sans la vidéo. La bibliothèque est préparée
avant de commencer la prise pour éviter le téléchargement en début d’enregistrement.

Sources et licences : Hydra, Olivia Jack et contributeurs, AGPL-3.0 (voir
assets/vendor/LICENSE-Hydra.txt). Bundle original non modifié :
https://registry.npmjs.org/hydra-synth/-/hydra-synth-1.3.29.tgz
Sources et configuration de compilation incluses dans sources/hydra-synth/.
Adaptateur non minifié dans assets/pilami-hydra-0.8.0.js. Fonctions d’intégration
inspirées de @strudel/hydra 1.2.0 (Felix Roos et contributeurs, AGPL-3.0-or-later).
https://registry.npmjs.org/@strudel/hydra/-/hydra-1.2.0.tgz

Tests 0.8.0 dans Chromium avec rendu WebGL réel : chargement local à la demande,
osc/noise et transformations, image via s1, H, feedStrudel et piano roll,
Hydra seul ou avec audio et curseurs, fond/panneau et résolution live,
Stop/reprise, retour aux exemples, code erroné et récupération, annulation pendant
un chargement retardé ; sauvegardes/import-export et WAV avec Update, volume zéro,
Stop et absence de requêtes externes pour les visuels générés. PHP linté.
À vérifier après installation sur WordPress/Firefox avec les ressources externes
utilisées par tes propres morceaux.


VERSION 0.8.1 — VISUALISATIONS PAR PISTE
._pianoroll() et ._scope() sont pris en charge : chaque appel ajoute un visuel
indépendant sous le code. Les options natives (cycles, couleurs, etc.) sont
transmises au moteur Strudel. Le commutateur Fond / Panneau continue de gérer
les visualisations globales et Hydra. Stop fige les visuels par piste ; Update
les remplace et une erreur nettoie les panneaux incomplets.
Le sample cp (clap synthétique original local) est maintenant disponible.
Le sample unique est réutilisé pour les indices cp:0, cp:1, etc. ; ce n'est pas
la banque de claps de strudel.cc.
Adaptateur : assets/pilami-inline-0.8.1.js. Il utilise les renderers natifs
pianoroll et scope, capture synchroniquement leur fonction draw, restaure le
prototype immédiatement et gère sa propre boucle RAF annulable.
Validation Chromium : code Circuitboard Psycho inchangé, trois canvas
indépendants, signal audio du scope mesuré, Stop/Update, récupération après
erreur, affichage mobile ; régression Hydra et sauvegarde/export audio.


VERSION 0.8.2 — BANQUES GENERAL MIDI
Le lecteur de banques accepte les expressions arithmétiques simples dans les
valeurs numériques, notamment originalPitch:4200-140 dans la guitare acoustique.
Les données téléchargées ne sont pas exécutées. Les chaînes et commentaires
sont préservés ; les opérateurs +, -, *, / respectent leur priorité.
Un format de banque invalide est maintenant distingué d'une erreur de téléchargement.
Le préchargement respecte les indices explicites comme gm_acoustic_guitar_steel:1
et gm_pizzicato_strings:1 au lieu de charger systématiquement la variante zéro.
Les indices dynamiques restent chargés à la demande par le moteur audio.
Le morceau Bug From Heaven utilise des percussions BossDR110. Pour les charger,
ajouter au début du code :
await samples('https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json');
Cette ligne nécessite une connexion Internet et n'est pas ajoutée automatiquement
aux autres morceaux. La banque reste chargée jusqu'au rechargement de la page.
Validation : fichier réel 0253_Acoustic_Guitar_sf2_file décodé et joué ; calculs
avec priorité et signes ; données exécutables rejetées ; morceau complet avec
les vraies banques GM et samples BossDR110, signal audio mesuré dans Chromium.


VERSION 0.9.0 — PRESETS PERSONNALISABLES
Réglages → Strudel — Apparence → Boutons et presets — jusqu’à 10.
Chaque emplacement propose : visibilité, nom du bouton, code Strudel/Hydra
ou action aléatoire. Les six boutons existants sont conservés, quatre
emplacements vides sont disponibles. Le code est conservé à l’identique.
Les presets sans code sont masqués ; les presets aléatoires choisissent
parmi les autres boutons actifs contenant du code.
Un bouton charge le code sans le lancer : cliquer ensuite Lecture / Update.
Pour Hydra, commencer par await initHydra({ detectAudio: false }).
Le preset de départ peut être choisi ; un brouillon local reste prioritaire.
Le retour à l’apparence d’origine conserve les presets enregistrés.
Validation PHP : migration, dix emplacements, sauvegarde et relecture sans
altération, double validation, valeurs invalides, échappement JSON et HTML.
Validation Chromium : aperçu, dix boutons, chargement du code, Hydra, audio,
brouillon local et mobile ; sauvegardes et enregistrement WAV.


VERSION 0.10.0 — SORTIE VISUELLE EN FENÊTRE SÉPARÉE
Le bouton Visuels parcourt : Fond → Panneau → Fenêtre séparée → Fond.
Déplacer la fenêtre sur un écran ou vidéoprojecteur puis utiliser Plein écran,
le double-clic sur l’image ou la touche F. Échap quitte le plein écran.
La page principale doit rester ouverte ; elle garde le moteur musical et visuel.
La sortie montre Hydra ou le piano roll global en direct, sans audio supplémentaire.
Les réglages opacité/teinte/couleurs sont appliqués à la sortie. La hauteur du
panneau reste réservée au mode Panneau. Les contrôles de sortie s’estompent
après une période sans interaction.
Fermer la fenêtre remet les visuels en panneau, sans arrêter la musique.
Quitter le mode Fenêtre arrête le flux vidéo et ferme sa fenêtre.
Au rechargement, un ancien choix Fenêtre est restauré en Panneau : recliquer
pour ouvrir la sortie. Si le navigateur bloque les pop-up, un message explique
comment les autoriser.
Technique : composite 2D des canvas existants puis captureStream(30) vers une
vidéo muette dans une fenêtre de même origine. Aucun deuxième moteur musical.
Hydra publie sa frame après tick pour copier le framebuffer WebGL avant sa
réinitialisation. Le flux est redimensionné lors du changement d’écran/fenêtre.
Validation Chromium : pixels Hydra et piano roll réels, Update, réglages en
direct, arrêt, redimensionnement, plein écran, fermetures, rechargement et
blocage de pop-up ; régressions presets, sauvegardes et WAV.
À confirmer dans Firefox et avec deux écrans physiques.


CORRECTION 0.10.1 — SORTIE DIRECTE ET PLEIN ÉCRAN
Remplace la transmission vidéo de 0.10.0 : aucun captureStream ni vidéo à
encoder/décoder. Le canevas WebGL Hydra est déplacé dans la fenêtre de sortie,
avec son contexte et ses textures, puis ramené dans la page quand on la ferme.
L’animation Hydra utilise requestAnimationFrame de la fenêtre visible.
Le piano roll global utilise également cette horloge ; sa sortie 2D est copiée
directement dans un canvas, sans flux vidéo. Les visuels intégrés sous les
pistes continuent à fonctionner dans la page principale.
Les commandes de plein écran sont maintenant exécutées par la fenêtre de
sortie elle-même. F11 reste disponible comme plein écran du navigateur.
Validation Chromium : rendu coloré en plein écran et après redimensionnement
1920×1080 ; horloge de la page principale volontairement suspendue sans arrêt
d’Hydra ; bouton et touche F ; Update, filtres, Stop et reprise ; récupération
du canevas après fermeture, piano roll global, presets, WAV et visuels par piste.
À confirmer sur Firefox et sur les écrans physiques de l’utilisateur.


CORRECTION 0.10.2 — PUNCHCARD PAR PISTE ET NOMS COURTS DE PERCUSSIONS
Ajoute ._punchcard(options) sous l’éditeur, avec le renderer punchcard natif
de Strudel. Les évènements sont lus sur le pattern final et filtrés par une
marque propre à la piste : les transformations placées après _punchcard
restent visibles et les pistes ne se mélangent pas dans leurs panneaux.
Stop fige les visuels ; Update et les changements de presets nettoient les
anciens panneaux. Les options cycles et playhead règlent la fenêtre de lecture.
Les noms sr16_rim et 9000_sd sont enregistrés pour les samples AlesisSR16 rim
et Linn9000 snare de tidal-drum-machines. Les fichiers audio sont téléchargés
à la demande depuis le dépôt, sans ajouter leur chargement aux autres scripts.
Source des percussions : https://github.com/ritchse/tidal-drum-machines
Validation Chromium : script utilisateur inchangé, fichiers GM clean/muted
réels, percussions réelles, signal audio mesuré, deux punchcards animés et
indépendants, couleur/transposition/slow après _punchcard, Stop/Update/mobile.
Régressions : piano roll et scope par piste, Hydra/plein écran, sauvegardes et WAV.


VERSION 0.11.0 — SECTIONS ET LISTES DE PRESETS
Les anciens boutons deviennent des sections, avec leur script conservé dans
le premier emplacement. Jusqu’à 10 sections et 10 presets par section.
Réglages → Strudel — Apparence → Sections et listes de presets.
Chaque section a un nom, une case de visibilité et le bouton Ajouter un preset.
Chaque preset a un nom, du code et une action (code ou choix aléatoire).
Vider ce preset efface son code au prochain enregistrement du formulaire ;
masquer une section conserve tous ses scripts. Les emplacements vides ne
sont pas affichés. Le retour à l’apparence d’origine conserve les sections.
Sur le site : survol ou clic du bouton pour ouvrir la liste, puis clic sur le
preset pour charger son code. Lecture / Update lance le code. Sur écran
tactile : toucher la section puis le preset. Clavier : Entrée ouvre/ferme,
flèches haut/bas parcourent les choix, Échap ferme et rend le focus au bouton.
Les listes suivent les couleurs et le mode sombre, restent dans la largeur
de l’écran et défilent si nécessaire. L’aperçu admin reflète sections et noms.
Le preset de départ peut être un preset de n’importe quelle section active ;
un brouillon local reste prioritaire.
Validation PHP : migration des noms/scripts/visibilités, 100 emplacements,
preset enfant au départ, sections masquées, double validation et remise à zéro.
Validation Chromium : survol, clic, clavier, tactile/mobile, choix aléatoire,
chargement de code, lecture, ajout/vidage et aperçu des sections. Le formulaire
compte 344 champs, sous la limite usuelle de 1000 entrées PHP.
Régressions : punchcards, instruments et samples réels, sortie Hydra directe
et plein écran, sauvegardes/import/export et enregistrement WAV.


VERSION 0.11.1 — CHARGEMENT SANS LECTURE
Cliquer un preset arrête la lecture en cours et charge seulement son code.
L’éditeur reçoit le focus ; Ctrl + Entrée ou Lecture / Update lance le script.
Hydra et les visualisations sont également arrêtés lors du changement.
L’action « Choisir un preset au hasard » est supprimée du formulaire Apparence
et du comportement des presets. Les noms et scripts enregistrés sont conservés.
Les anciens emplacements aléatoires sans code deviennent des emplacements vides.
Validation Chromium : compteur d’évaluations inchangé au clic avant/après lecture,
focus éditeur, Ctrl + Entrée, Hydra lancé uniquement sur demande, ajout/vidage admin.
Régressions : sauvegardes, import/export UTF-8, WAV, punchcards et sortie visuelle.


VERSION 0.11.2 — PRÉPARER LE PRESET SUIVANT
Choisir un preset modifie uniquement le code dans l’éditeur et lui donne le focus.
La lecture, Hydra, les visualisations et l’enregistrement en cours continuent.
Ctrl + Entrée ou Lecture / Update applique le nouveau script ; Stop reste explicite.
Le choix ne modifie pas non plus une évaluation déjà en préparation.
Validation Chromium : aucune évaluation ni interruption au clic pendant la lecture,
Hydra conservé au changement, focus et application explicite par Ctrl + Entrée.


VERSION 0.11.3 — ENTRÉE AUDIO HYDRA
L’initialisation avec detectAudio:true attache le canvas avant la création
de l’analyseur audio, qui utilise son parent pour le vumètre FFT.
Utiliser await initHydra({ detectAudio: true }) pour analyser l’entrée audio
du navigateur. detectAudio:false conserve les visuels sans entrée audio.
Les pistes du microphone et le contexte audio sont libérés quand Hydra
est remplacé par un script sans Hydra ; le vumètre est également retiré.
Validation Chromium avec entrée simulée : script utilisateur, valeurs FFT
non nulles, remplacement explicite et libération du microphone.
Régressions : sélection sans interruption, Hydra séparé et plein écran.


VERSION 0.11.4 — ÉTAT ET RECONNEXION DU MICRO HYDRA
Les scripts initHydra({detectAudio:true}) affichent un état du micro, le nom
de l’entrée fournie par le navigateur et Reconnecter l’entrée audio.
La reconnexion conserve le visuel, le code, l’objet a et ses réglages FFT.
Elle libère l’ancienne entrée et son contexte audio avant de les rouvrir.
L’autorisation refusée, l’absence de périphérique, l’entrée inaccessible,
une piste déconnectée et un moteur audio suspendu ont des messages dédiés.
Une autorisation refusée doit être rétablie dans les réglages du navigateur ;
le bouton ne contourne pas les permissions. L’entrée reste celle du navigateur.
Les scripts sans entrée audio ne demandent aucune permission. Après avoir
quitté Hydra, le bouton est désactivé. Le microphone est libéré à la sortie de page.
La capture Hydra désactive echoCancellation, noiseSuppression et autoGainControl.
Le bundle local hydra-synth 1.3.29-pilami-0.11.4 expose connectStream pour permettre
à l’adaptateur de gérer autorisations, erreurs et connexions devenues obsolètes.
Sa licence reste celle fournie dans assets/vendor/LICENSE-Hydra.txt.
Validation Chromium : FFT réelle d’une entrée simulée, reconnexion sans destruction
du canvas, conservation des réglages, fermeture de l’ancienne entrée, refus puis
rétablissement d’autorisation, libération d’une capture arrivée après changement
de script ; sortie séparée/plein écran et presets sans interruption.

PARTAGE 0.12.0
Choisir un preset puis cliquer sur « Copier le lien », près de Lecture / Update.
Le destinataire ouvre le lien : le code est chargé, puis il clique sur Lecture.
Un preset inchangé utilise un lien court #preset=... ; il reflète le preset actuel
configuré sur le site. Si ce preset est modifié plus tard dans WordPress, son lien
charge sa nouvelle version.
Un code modifié, importé ou sauvegardé est transporté dans le lien lui-même,
avec son nom et le volume. Les valeurs des curseurs inscrites dans le code sont
conservées. Le lien peut être long. Limite : 100 000 caractères ; au-delà, exporter.
L’ouverture du lien prend la priorité sur le brouillon restauré. Aucune lecture
ni demande de microphone n’est déclenchée par le partage lui-même.
En cas de refus du presse-papiers, le lien est sélectionné pour une copie manuelle.
Les sauvegardes, réglages d’apparence et presets WordPress sont conservés.

VALIDATION DU PARTAGE 0.12.0
Syntaxe JavaScript vérifiée. Tests du module de partage : liens de presets,
aller-retour du script Julia et des caractères Unicode, volume, priorité sur
le brouillon, changements de lien, liens invalides, copie manuelle en secours,
code vide et trop long. Chargement vérifié sans appel à Lecture.
Tous les autres fichiers de la version 0.11.4 sont préservés à l’identique.
Ces contrôles utilisent le module réel avec une interface simulée ; cette
nouvelle version n’a pas encore été testée sur le site WordPress en production.

LIENS COURTS 0.13.0
Le bouton « Copier le lien » enregistre une copie exacte du code, de son nom,
du volume et des valeurs de curseurs inscrites dans le code. Le lien a la forme
https://pilami.fr/strudel/?partage=IDENTIFIANT
Chaque copie enregistrée est immuable. Le même contenu réutilise son identifiant ;
un nouveau code ou de nouveaux réglages produisent un nouveau lien.
Les partages sont conservés sans expiration automatique dans la table WordPress
{prefixe}pilami_strudel_shares, créée automatiquement à l’activation ou mise à jour.
Aucun fichier ni serveur supplémentaire à configurer. La désactivation ou le
remplacement du plugin ne supprime pas les partages. Inclure cette table dans
les sauvegardes WordPress pour conserver les liens.
Les anciens liens #preset et #pilami continuent de fonctionner.
Le code partagé est chargé après le brouillon local ; il n’est joué que quand
le destinataire clique sur Lecture. Si celui-ci modifie l’éditeur ou lance la
lecture avant la fin du chargement, le chargement est annulé pour préserver son code.
Si le navigateur refuse la copie automatique, le lien court est sélectionné
pour une copie manuelle avec Ctrl+C / Cmd+C.
En cas d’erreur de serveur, un message s’affiche et le code reste dans l’éditeur.
Le bouton ne remplace pas un lien court par un ancien lien long en cas d’échec.

STOCKAGE ET LIMITES
Les routes REST /pilami-strudel/v1/shares (POST) et /shares/{id} (GET) sont publiques,
pour permettre le partage depuis la page sans compte WordPress. Le serveur stocke
uniquement du texte et ne l’exécute jamais. Taille du code limitée à 64 Ko ;
les noms à 400 octets, le volume à 0–100. Les identifiants sont aléatoires (96 bits).
Déduplication par empreinte SHA-256 du contenu. Requêtes SQL préparées.
60 demandes de création par heure et adresse de connexion (proxy éventuel inclus),
1000 nouveaux partages par jour et 10 000 au total. Les partages existants restent
lisibles quand une limite est atteinte. L’adresse IP n’est pas stockée dans les
morceaux ; un compteur temporaire associé à son empreinte expire après une heure.
Ces compteurs limitent le rythme normal ; ils ne remplacent pas les règles du
pare-feu pour les requêtes simultanées massives ou les attaques réseau.

VALIDATION 0.13.0
Syntaxe PHP 8.3 et JavaScript vérifiée. Tests de la véritable implémentation PHP
avec SQLite et une interface WordPress simulée : installation idempotente,
routes REST, conservation exacte du script Julia / Unicode / GLSL, déduplication,
liens immuables, validation des données, limite de taille, limites de création.
Tests du module JavaScript avec une interface et un serveur simulés : lien court,
restauration, volume, cache du dernier partage, anciens formats, erreurs serveur,
copie manuelle, URL REST simples ou avec rest_route, annulation du chargement
quand le code est modifié ou joué. Aucune validation en production WordPress/MariaDB
n’est revendiquée avant installation sur le site.
Moteurs audio, Hydra, presets, réglages, sauvegardes et autres modules inchangés.
Références WordPress :
https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/
https://developer.wordpress.org/plugins/creating-tables-with-plugins/

DEUX ESPACES 0.14.0 — STRUDEL + HYDRA
Le shortcode [pilami_strudel] affiche désormais deux espaces dans la même page.
Strudel : éditeur, presets musicaux, Lecture/Update, Stop, volume, essais et WAV.
Hydra : éditeur JavaScript, catalogue de visuels, Update, Stop, curseurs, essais,
import et export. Sur ordinateur, les espaces se placent côte à côte ; sur mobile,
ils se placent l’un sous l’autre. Le panneau de projection est commun aux visuels.
Un preset charge seulement son code : aucun lancement automatique.
Les raccourcis Ctrl+Entrée et Alt+point agissent sur l’éditeur où tu écris.
Un Update ou Stop Strudel ne coupe pas un visuel lancé depuis l’espace Hydra.
Un Update ou Stop Hydra ne réinitialise pas le moteur audio Strudel.
Les fenêtres de projection et les réglages Visuels restent disponibles.

BIBLIOTHÈQUE HYDRA
WordPress → Réglages → Hydra — Presets.
Chaque preset est une fiche WordPress : titre, code et catégorie(s).
Ajouter, modifier, publier, dépublier ou mettre à la corbeille avec les commandes
WordPress habituelles. Les presets publiés avec du code apparaissent sur la page.
La bibliothèque n’a plus de grille fixe de dix emplacements. Recherche par nom
ou catégorie et filtre par catégorie dans l’espace Hydra. Les catégories peuvent
être créées dans le menu WordPress de cette bibliothèque.
Les anciens presets contenant uniquement des visuels Hydra sont copiés à
l’installation, avec leur code intact et la section d’origine comme catégorie.
Ils sont masqués dans les menus Strudel ; leurs anciens champs WordPress sont
conservés pour retrouver le code. Cette migration ne crée pas de doublons.
Cinq exemples sont ajoutés : Ondes colorées, Mandala, Brume, Basses lumineuses,
Julia — curseurs. Les codes mêlant musique et Hydra restent dans Strudel.
Le catalogue utilise le type de contenu pilami_hydra et la taxonomie
pilami_hydra_cat. Les opérations d’administration exigent manage_options.

CODE ET CURSEURS HYDRA
Le code de l’éditeur Hydra est du JavaScript ordinaire, y compris les chaînes
entre guillemets ou les modèles GLSL entre accents graves.
Utiliser await initHydra() pour un visuel ; detectAudio:true active l’entrée audio.
Si aucun initHydra n’est appelé, le lecteur initialise Hydra sans entrée audio.
Pour un curseur : var Vitesse = H(slider(0.08, 0, 0.3, 0.001))
Puis par exemple : osc(20, Vitesse, 1.4).out(o0)
Les curseurs renvoient des fonctions qui lisent leur valeur actuelle. H conserve
ces fonctions, pour rester compatible avec le code Julia déjà fourni.
Les variables donnent leur nom aux curseurs. Modifier un curseur met aussi sa
valeur dans le code pour les sauvegardes et les liens. Relancer le script réinitialise
ses variables d’animation, comme le zoom accumulé de la Julia.
L’analyse syntaxique utilise Acorn 8.15.0, inclus localement avec sa licence MIT.
Les visuels lancés depuis cet espace sont pilotés indépendamment de Strudel.
Un ancien script Strudel mêlant musique et initHydra fonctionne en mode historique
avant le lancement du lecteur Hydra séparé. Quand ce lecteur pilote les visuels,
initHydra dans Strudel invite à déplacer le code visuel dans l’éditeur Hydra.

ESSAIS ET PARTAGE
Les anciens essais purement Hydra sauvegardés dans ce navigateur sont copiés
vers « Mes essais Hydra », puis retirés de la liste des essais musicaux. La copie
réussit avant le retrait ; les sources distinctes avec un même identifiant sont
conservées séparément. Un ancien brouillon Hydra est déplacé dans l’éditeur Hydra.
Les sauvegardes musicales et leur brouillon restent disponibles.
« Copier le lien Strudel » partage le code musical et son volume.
« Copier le lien Hydra » partage le visuel et ses valeurs de curseurs.
« Partager musique + visuels » partage les deux éditeurs ensemble.
Tous ces liens restent courts et immuables. Rien n’est joué à l’ouverture du lien.
Les anciens liens v1 contenant un code purement Hydra le chargent automatiquement
dans l’éditeur Hydra. Les anciens #preset et #pilami restent pris en charge.
Le format v2 transporte mode, strudel et hydra dans la table de partages existante.
La limite est 64 Ko par éditeur ; les limites de rythme de la version 0.13 restent
appliquées. L’export Hydra utilise .txt pour faciliter son téléchargement.

VALIDATION 0.14.0
Vérifications PHP 8.3 et JavaScript. Tests PHP du catalogue et du stockage avec une
interface WordPress simulée et SQLite : copie exacte des anciens presets du site,
migration idempotente, ajout de 25 presets au-delà des dix emplacements, séparation
musique/visuels, droits et nonce administrateur, conservation verbatim du code,
partages duo/Strudel/Hydra et compatibilité des anciens partages v1.
Tests dans Chromium 151 avec les véritables moteurs Strudel et Hydra, Web Audio
et WebGL (rendu logiciel) : 13 presets au départ de la migration, son Strudel mesuré,
Update/Stop indépendants, Julia et ses 11 curseurs en direct, valeurs inscrites dans
le code, GLSL avec modèles de chaînes, fenêtre de projection, essais Hydra,
liens vers le stockage PHP, absence de lancement automatique, mode sombre,
affichage à 390 px sans débordement, migration et restauration après rechargement
des anciens essais et brouillon dans le navigateur.
Ce test local n’est pas une exécution complète de WordPress/MariaDB en production.
Licences et autres moteurs fournis dans les versions précédentes conservés.
Acorn : https://github.com/acornjs/acorn (MIT, licence dans assets/vendor).

NOUVEAUTÉS 0.15.0 — FENÊTRES DÉTACHABLES
Au-dessus de chaque éditeur, « Code en fenêtre » et « Curseurs en fenêtre »
ouvrent une fenêtre dédiée. Jusqu’à quatre fenêtres indépendantes : code et
curseurs Strudel, code et curseurs Hydra, en plus de la projection existante.
Chaque fenêtre dispose de Lecture / Update, Stop, Plein écran et Rattacher.
Ctrl + Entrée applique le code ; Alt + point arrête le moteur correspondant.
Le code est synchronisé avec la page, ses sauvegardes et ses liens de partage.
Les curseurs restent actifs et inscrivent leurs valeurs dans le même code.
Choisir un autre preset dans la page met aussi la fenêtre de code à jour.
Un panneau de curseurs vide se remplit après la lecture d’un script avec slider().
Rattacher ou fermer une fenêtre réaffiche son champ sans arrêter la lecture.
Garder la page principale ouverte : elle porte les moteurs audio et visuels.
Sa fermeture ou son rechargement ferme les fenêtres de contrôle.
Les fenêtres peuvent être déplacées, agrandies et minimisées avec Windows.
Le navigateur peut choisir de les ouvrir en onglets selon ses préférences.
S’il bloque l’ouverture, un message invite à autoriser les fenêtres du site.
Plein écran utilise l’API du navigateur ; F11 reste une alternative.
Documentation : https://developer.mozilla.org/en-US/docs/Web/API/Window/open
https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen

VALIDATION 0.15.0
Chromium réel, WebGL et Web Audio : quatre fenêtres de contrôle simultanées,
Julia et ses onze curseurs, curseurs audio Strudel, synchronisation du code et
des presets, sauvegardes et partage duo, commandes indépendantes, signal audio
présent après Stop Hydra, plein écran effectif et repli après refus, palette sombre,
fermeture et rattachement, blocage des fenêtres, fermeture au rechargement.
Régression de la v0.14.0 : lecture, projection, liens anciens et récents, migration
des essais, mise en page mobile. PHP : catalogue, migration, partage et syntaxe.
Tests réalisés avec le HTML du plugin et une couche WordPress de test, sans
déploiement sur le site de production ni simulation des boutons Windows.

NOUVEAUTÉS 0.16.0 — CONTRÔLEURS HYDRA ET LIAISONS AUDIO
« Curseurs du visuel » devient « Contrôleurs du visuel ». Le bouton Hydra
« Contrôleurs en fenêtre » ouvre le panneau complet, toujours rattachable.

PREMIER ESSAI
1. Charger Julia — curseurs, puis Hydra / Update.
2. Ouvrir Contrôleurs en fenêtre. Le pad Centre apparaît automatiquement.
3. Glisser a.fft[1] sur « Lier X » : le son déplace le centre horizontalement.
4. Glisser une autre bande sur « Lier Y », ou une bande sur le pad entier
   pour piloter les deux axes avec cette même bande.
5. Ajuster la profondeur dans la carte du paramètre : positive ou négative.
6. Délier revient à la valeur manuelle. Les changements sont inscrits dans
   le code, les brouillons, les sauvegardes et les liens de partage Hydra/duo.
Alternative au glisser-déposer : cliquer la source audio, puis le nom du
paramètre ou le bouton X/Y. Cela fonctionne aussi avec le clavier.

Le panneau présente a.fft[0] à a.fft[4] par défaut. Hydra compte depuis 0.
Une bande grisée devient disponible lors de sa première liaison. Si nécessaire,
le nombre de bandes augmente et les appels numériques a.setBins(...) du code
sont mis à jour. Les autres bandes configurées par le script sont aussi affichées,
jusqu’à seize. Les sources restent visibles pendant le défilement du panneau.
L’activation audio se fait à ta demande : bouton d’entrée audio ou création
d’une liaison. Charger un preset ou un lien ne demande pas le micro et ne joue
pas automatiquement. Le navigateur peut demander l’autorisation de l’entrée.

Une bande peut piloter plusieurs paramètres. Chaque paramètre possède une
liaison audio ; déposer une autre bande remplace sa source et conserve sa profondeur.
Valeur effective = valeur manuelle + niveau de bande × profondeur.
Le niveau est borné entre 0 et 1 et le résultat reste entre min et max.
La profondeur utilise les unités du paramètre. Elle peut être négative.
La valeur manuelle reste modifiable, y compris pendant la modulation ou après Stop.
Les liaisons et les valeurs changent en direct sans relancer le script :
le zoom accumulé, les phases, le rendu et la connexion audio restent en place.
Un Update explicite relance le script comme auparavant.
La sensibilité et le lissage des bandes suivent les réglages a.setCutoff(),
a.setScale() et a.setSmooth() du script. Les vumètres suivent a.fft pendant la lecture.

PRÉSENTATIONS
Le menu de chaque paramètre propose Curseur, Potentiomètre ou Fader vertical.
Un paramètre de 0 à 1 peut aussi être présenté comme un interrupteur.
Un potentiomètre se règle par glissement vertical ; Maj affine le mouvement.
Flèches, Début et Fin permettent aussi de le régler au clavier.
Le pad XY répond au pointeur et aux quatre flèches du clavier.
Son point plein montre les valeurs avec audio, son cercle la position manuelle.
Les paires de noms Centre_X/Centre_Y, Position_X/Position_Y, etc. créent un pad.

AIDES DE CODE — ÉDITEUR HYDRA PILAMI
Ces fonctions sont fournies par l’éditeur Hydra Pilami :
var Saturation = knob(1, 0, 3, 0.01)
var Vitesse = fader(0.1, 0, 0.5, 0.001)
var Actif = toggle(1)
var Centre_X = H(audioMod(slider(0, -1, 1, 0.001), {band: 1, depth: 0.2}))
var Centre_Y = H(slider(0, -1, 1, 0.001))
xyPad('Centre', Centre_X, Centre_Y)

slider(), knob(), fader() et toggle() renvoient des fonctions pour Hydra.
H(...) reste compatible avec les anciens presets. xyPad() permet de grouper
explicitement deux contrôleurs, même si leurs noms ne se terminent pas par X/Y.
Le panneau relie les paramètres déclarés par ces fonctions. Les constantes
numériques placées directement dans un osc(...), etc. doivent d’abord être
exposées par un contrôleur. Les anciennes expressions a.fft écrites à la main
continuent à fonctionner et leur code reste présent.

VALIDATION 0.16.0
Chromium réel avec WebGL, Web Audio et entrée microphone de test : glisser-déposer
sur X/Y et le pad entier, profondeurs signées, mise à jour effective des uniformes
du shader, phase de zoom préservée, même canvas et même flux audio, activation
audio sur un rendu sans analyseur, agrandissement des bandes, potentiomètre
au pointeur et au clavier, fader, interrupteur, pad au pointeur, déliaison,
alternative par clic, sauvegarde et aller-retour d’un lien court sans lecture
automatique, contrôle après Stop, fenêtre détachée, palette sombre et vue étroite.
Régression : quatre fenêtres simultanées, plein écran, rattachement, code et
curseurs Strudel, Julia, sauvegardes anciennes, projection et liens de partage.
Analyse AST : chaînes/commentaires, H imbriqué, précision de profondeur,
conversion de présentation binaire et rejet des liaisons audio invalides.
PHP : catalogue, migration, partage et syntaxe. Couche WordPress de test ;
le site de production et les pilotes RME/Steinberg sont à essayer après installation.
Source audio Hydra : https://github.com/hydra-synth/hydra/blob/main/README.md

CORRECTION 0.16.1 — MENUS DES CONTRÔLEURS
Les options des menus (Curseur, Potentiomètre, Fader vertical et bandes audio)
suivent les couleurs du panneau. Le menu natif suit le thème clair/sombre,
y compris dans les fenêtres détachées. Fichiers modifiés versionnés pour le cache.

VERSION 0.17.0 — MODIFIER UN PRESET HYDRA DEPUIS L’ÉDITEUR
Connecté à WordPress comme administrateur, choisis un preset Hydra, modifie son
code ou ses contrôleurs, puis clique sur « Mettre à jour le preset ». Le bouton
existe aussi dans les fenêtres détachées Code et Contrôleurs. Il remplace le code
du preset sélectionné dans WordPress, en conservant son nom et ses catégories.
Les valeurs actuelles des contrôleurs sont déjà inscrites dans le code et sont
donc enregistrées avec lui. Enregistrer ne démarre ni ne relance les visuels.
Le brouillon conserve le preset associé après rechargement. Les essais importés
et les liens partagés doivent d’abord être associés à un preset en le choisissant
dans la bibliothèque, puis en collant le code voulu.
Le bouton reste invisible pour les visiteurs. Une session d’administration
WordPress active est nécessaire ; il n’y a pas de nouveau mot de passe.
Si le preset a changé ailleurs, la mise à jour est refusée et le code édité reste
intact : exporte-le avant de recharger. « Sauvegarder » dans Mes essais Hydra
continue à enregistrer les essais uniquement dans ce navigateur.
Après installation : Ctrl + F5 et purge du cache de la page Strudel si nécessaire.

Vérifications 0.17.0 : syntaxe PHP/JavaScript, enregistrement simulé du code
exact (accents et antislashs), réinitialisation, refus de syntaxe incorrecte,
conflit et session expirée, saisie pendant un enregistrement, fenêtre détachée,
restauration du brouillon, bouton masqué pour les visiteurs et catalogue actualisé
avec une page en cache. Validation réelle sur WordPress après installation.

VERSION 0.18.0 — IMPORT DIRECT D’UN PRESET HYDRA DANS WORDPRESS
Connecté comme administrateur, clique sur Mes essais Hydra → Importer et choisis
un fichier .txt ou .js (64 Ko maximum). Le code est vérifié sans être exécuté,
puis un nouveau preset publié est créé dans la catégorie « Imports ». Son nom
vient du fichier sans extension. Le preset est ajouté à la liste et sélectionné.
Clique sur Hydra / Update pour le lancer ; l’import ne lance pas la lecture.
Le bouton « Mettre à jour le preset » enregistre ensuite tes modifications.
Un nouvel import du même fichier inchangé réutilise le preset déjà importé.
Les visiteurs continuent à importer uniquement dans leur navigateur. La création
WordPress exige une session admin active ; en cas d’échec, un message indique
que le preset n’a pas pu être créé et le code déjà chargé reste dans l’éditeur.
Les filtres sont ajustés pour rendre visible le nouveau preset. Une modification
ou un changement de preset pendant l’envoi ne sont pas écrasés par la réponse.
Installation : remplacer l’extension existante, puis Ctrl + F5 sur la page.

Vérifications 0.18.0 : syntaxe PHP/JS, simulation d’import du fichier Mandelbulb
exact, nom et nonce, ajout/sélection/filtres, mise à jour après import, réimport,
visiteur, erreurs réseau/session/stockage, fichiers invalides, saisie et changement
de preset pendant l’envoi. Enregistrement réel sur WordPress à tester après installation.

CORRECTION 0.18.1 — LISIBILITÉ DES CATÉGORIES
Les options et groupes des menus natifs suivent désormais les couleurs de
l’éditeur, dans les thèmes clair et sombre. Correction des catégories Hydra et
des listes de sauvegardes ; les menus des contrôleurs gardent leur palette.
Feuille CSS renommée pour contourner les caches. Remplacer l’extension puis
recharger avec Ctrl + F5 ; purger le cache de la page si nécessaire.
Vérification des références des fichiers et de l’intégrité de l’archive.

EVOLUTION 0.19.0
Bouton 📌 Au-dessus à côté de Visuels : ouvre une fenêtre flottante native
avec Document Picture-in-Picture, si le navigateur le propose (HTTPS requis).
Le canvas Hydra est transféré sans réinitialiser le moteur ;
le rendu Strudel 2D continue via son miroir habituel. Audio et contrôleurs restent
sur la page principale. Reclique sur Au-dessus pour revenir en fenêtre classique.
Fermer la fenêtre flottante ramène les visuels au panneau. Le plein écran reste
disponible dans la fenêtre classique. Aucun visuel ne s’ouvre automatiquement.
Si l’API est absente ou refusée, un message l’indique et le mode existant est conservé.
Firefox de bureau prend en charge cette API depuis la version 151 ; Chrome/Edge
depuis la version 116. La disponibilité est détectée sans supposer le navigateur.
La taille et la position de la fenêtre flottante sont gérées par le navigateur.

CORRECTION 0.19.1 — IMPORT WORDPRESS DES PRESETS HYDRA
L’import administrateur ne dépend plus du filtre par expression régulière utilisé
pour migrer les anciens presets. L’éditeur valide les fichiers avec Acorn avant
leur envoi : les commentaires, chaînes GLSL et générateurs personnalisés ne sont
plus soumis à une seconde classification approximative côté serveur.
Les droits administrateur, le nonce REST, l’UTF-8 et la limite de 64 Ko restent
vérifiés. Le nom vide dispose d’un message d’erreur précis. L’enregistrement,
la catégorie Imports, la détection des doublons et la mise à jour restent inchangés.
Installation : remplacer l’extension existante puis recharger la page Strudel.

VERSION 0.20.0 — PANNEAUX ET HISTORIQUE
Les boutons « Masquer Strudel » et « Masquer Hydra » restent au-dessus des
panneaux. Le panneau visible prend toute la largeur ; les deux peuvent être
masqués puis réaffichés. Le choix est mémorisé par page et par laboratoire dans
ce navigateur. Il ne modifie ni le code, ni les sauvegardes, ni les moteurs.
La musique, les visuels et les fenêtres séparées restent actifs.
Réglages → Strudel — Apparence affiche la version installée et les changements
des versions documentées, des plus récentes aux plus anciennes. Les notes sont
repliables. Un lien Historique est ajouté dans la liste des extensions.
Vérifications 0.20.0 : masquage indépendant, deux panneaux masqués puis réaffichés,
restauration du choix, conservation des champs, volume et projection, absence
d’appel aux moteurs, focus et attributs accessibles, stockage indisponible et
plusieurs laboratoires. Syntaxe PHP/JS, cohérence des 30 versions documentées,
régression de l’import Hydra et intégrité de l’archive. Tests d’interface simulés ;
affichage réel dans WordPress à confirmer après installation.

VERSION 0.21.0 — COULEURS PAR FONCTION ET CATÉGORIE
Réglages → Strudel — Apparence : couleurs douces des boutons, couleurs de chaque
section Strudel et catégorie Hydra. Aperçu instantané en clair ou sombre.
La case « Distinguer les boutons et catégories » active ou désactive ces accents.
Les fonds personnalisés gardent leur réglage séparé. Les presets ne sont pas modifiés.
Le champ « Nom du preset / essai » se trouve au-dessus des commandes Hydra.
Administrateur connecté : « Mettre à jour le preset » enregistre nom et code dans
WordPress, sans relancer le visuel. Également disponible dans les fenêtres séparées.
Le bouton « Sauvegarder » reste réservé aux essais locaux du navigateur.
« Créer un preset WordPress » enregistre le script affiché dans la bibliothèque,
dans la catégorie Imports. Administrateur connecté nécessaire. Aucun fichier à
importer et aucun lancement automatique. « Sauvegarder sur ce navigateur » reste local.


VERSION 0.22.0 — CATÉGORIES DES PRESETS HYDRA

Pour un administrateur connecté, charger un preset de la bibliothèque puis ouvrir
« Catégories du preset ». Cocher ses catégories WordPress et cliquer sur
« Enregistrer les catégories ». Plusieurs catégories sont possibles ; aucune
sélection classe le preset sous « Sans catégorie ». Les catégories existantes,
y compris vides, sont proposées. Leur création reste dans WordPress.

L’enregistrement du classement n’envoie ni le code ni le nom et ne relance pas
Hydra. Les brouillons et contrôleurs sont conservés. Les filtres et couleurs sont
actualisés et le preset déplacé reste visible dans sa nouvelle catégorie.
Les fenêtres détachées Hydra proposent le même classement synchronisé.
L’API exige une session WordPress administrateur et le nonce REST ; elle vérifie
la taxonomie des identifiants et le classement chargé avant l’enregistrement.
Les refus et conflits gardent le brouillon et la sélection dans l’éditeur.


VERSION 0.23.0 — IMAGES PERSONNELLES DANS HYDRA

Après await initHydra(), utiliser await imageSource(s0, 'https://…/photo.jpg').
Cette fonction charge une image dans s0 et affiche le panneau « Image source ».
« Choisir une image » remplace la photo en direct ; cela reste un aperçu local,
conservé pendant les Update de ce preset et oublié en quittant la page.
JPG, PNG, WebP ou GIF (première image uniquement), 10 Mo maximum. Les sources
sont réduites à 2048 px sur leur plus grand côté pour limiter la mémoire GPU.
« Revenir à l’image du script » retire l’aperçu local. Les autres scripts Hydra
n’affichent pas ce panneau. Une URL inaccessible est signalée dans le panneau.

Pour l’administrateur connecté avec upload_files : choisir la photo, cliquer sur
« Enregistrer l’image dans WordPress ». Le fichier original est ajouté à la
médiathèque via l’API native et son URL remplace uniquement l’URL imageSource du
code courant. Cliquer ensuite sur Hydra / Update et enregistrer le preset dans
WordPress. Aucun preset n’est enregistré automatiquement par le choix d’une image.
Un visiteur dispose seulement de l’aperçu local ou d’une URL directe dans son code.
Les fenêtres détachées Hydra partagent le même panneau et la même image.
Le téléversement utilise le nonce et les permissions WordPress natives ; les
changements d’éditeur pendant le transfert ne sont jamais écrasés. Le média déjà
créé reste disponible dans la médiathèque si l’éditeur a changé entre-temps.



0.39.21 : affichage des PNG de la grille (priorité CSS sur les boutons génériques), raccourcis J/K intégrés aux réglages existants, arrêt du séquenceur sur transition Play→Stop de Link (option locale activée par défaut). Bridge server.cjs : Start/Stop Sync lecture seule, sans recompilation.


Version 0.39.22 : Sequenceur visuel — Play avec Live, Stop avec Live,
PNG stables au survol (calque independant), aucun halo autour des
cases colorees, protection contre la touche Espace qui recliquait les cases apres selection ; bridge Link resilient
aux erreurs du transport, avec diagnostics console.
