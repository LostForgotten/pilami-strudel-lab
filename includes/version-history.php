<?php
if (!defined('ABSPATH')) { exit; }

// User-facing release notes, newest first. Keep new releases in this one list.
function pilami_strudel_lab_history() {
    return array(
        '0.39.31' => array('Panneaux toujours accessibles et raccourci de mode visuel', array(
            'Snapshots, séquenceur et panneau MIDI visibles dès l’ouverture d’Hydra, y compris avant le lancement et avec un preset sans contrôleur.',
            'Capture de snapshot désactivée lorsqu’aucun paramètre ne peut être mémorisé, avec une explication visible.',
            'V : Panneau → Fenêtre séparée → Fond ; touche modifiable dans Raccourcis et écrans, sans activation dans les champs de saisie.',
            'Le raccourci fonctionne également depuis les fenêtres séparées et partage le comportement du bouton Visuels.',
        )),
        '0.39.30' => array('Séquenceur : Rappel et Morphing au clic réversible', array(
            'Clic gauche : activer un Rappel sur une case vide ; recliquer à gauche sur un Rappel pour le retirer.',
            'Clic droit : activer un Morphing sur une case vide ; recliquer à droite sur un Morphing pour le retirer.',
            'Sur un Rappel, clic droit = Morphing ; sur un Morphing, clic gauche = Rappel, sans étape intermédiaire.',
            'Conservation du remplissage Random et de sa densité, des patterns existants et de la synchronisation Ableton Link.',
        )),
        '0.39.29' => array('Séquenceur : clic gauche Rappel, clic droit Morphing et Random', array(
            'Clic gauche sur une case vide : Rappel ; sur une case déjà occupée : désactivation, quel que soit son type.',
            'Clic droit sur une case vide ou un Rappel : Morphing immédiat, sans mode à choisir ; Maj + Entrée sur une case focalisée au clavier.',
            'Bouton 🎲 Random près d’Effacer la grille : densité 0 à 100 %, rappels et morphings mélangés parmi les snapshots capturés, un seul événement par colonne.',
            'Le pourcentage choisi est mémorisé localement. Les patterns sont enregistrés par banque et la grille reste modifiable pendant la lecture.',
            'Aucune modification du moteur Link ni de la reprise en arrière-plan.',
        )),
        '0.39.28' => array('Aide Link accessible depuis la barre principale', array(
            'Bouton « ⓘ Aide Link » toujours visible à côté de « Connecter Link » dans la barre LINK.',
            'Installation Windows et téléchargement de la bêta GitHub accessibles sans ouvrir les contrôleurs ou le séquenceur.',
            'Aucune modification de l’horloge Link, du séquenceur ni du correctif de lecture en arrière-plan.',
        )),
        '0.39.27' => array('Ableton Link en arrière-plan et accès à la bêta Windows', array(
            'Séquenceur : déclenchement piloté également par les messages WebSocket Link, sans dépendre uniquement des minuteries ralenties par Firefox en arrière-plan.',
            'Après une suspension de l’onglet, le séquenceur se recale sur le pas musical courant sans rejouer les déclenchements anciens en rafale ; reconnexion temporaire mieux tolérée.',
            'Le dernier état du transport est conservé lors des microcoupures, pour ne pas perdre un Play reçu pendant que Firefox était inactif.',
            'Dans ⓘ Aide Link, accès à la bêta portable Windows sur GitHub, avec aide Start/Stop Sync et instructions de lancement.',
            'Limite du navigateur : un onglet entièrement suspendu ne peut pas garantir le rendu Hydra en temps réel ; privilégier une fenêtre de projection visible.',
        )),
        '0.39.26' => array('Ableton Link : téléchargement public de Pilami Link Bridge', array(
            'Lien de téléchargement Windows 64 bits (bêta v0.1.0-beta.1) ajouté au panneau ⓘ Aide Link du séquenceur.',
            'Accès aux versions et aux sources sur GitHub, avec instructions pour démarrer le bridge portable sans Node.js.',
            'Rappel du réglage Start/Stop Sync d’Ableton Live, indépendant du bouton Link, et des options Play/Stop avec Live du séquenceur.',
            'Aucun changement du moteur Link, du séquenceur, des raccourcis ni des associations MIDI.',
        )),
        '0.39.25' => array('Accès Raccourcis dans le dock visuel', array(
            'Ajout du bouton ⌨ directement dans le menu flottant repliable du visuel, à côté de la roue dentée.',
            'Le bouton ouvre le panneau existant Raccourcis et écrans, sans dupliquer ses réglages.',
            'Suppression de la détection fragile du texte Mode clair/sombre de WordPress.',
            'Aucune modification de Link, du séquenceur ou des snapshots.',
        )),
        '0.39.24' => array('Séquenceur : snapshots disponibles, aide Link et accès flottant', array(
            'Les cases des snapshots non capturés sont inactives et grisées ; capture le snapshot avant de placer un déclenchement.',
            'Si un ancien pattern contient une case liée à un snapshot supprimé, cette case reste retirable et sera ignorée pendant la lecture.',
            'Bouton d’aide Link près du transport : explique comment activer la synchronisation Play/Stop dans les paramètres Ableton Live.',
            'Accès « Raccourcis » ajouté à côté du bouton de thème du menu flottant WordPress lorsqu’il est présent ; renvoie vers les réglages existants.',
            'Aucun changement du bridge Ableton Link, des patterns enregistrés ni des commandes MIDI.',
        )),
        '0.39.23' => array('Grille PNG recadrés et diagnostics Ableton Link', array(
            'Recadrage CSS des images Rappel/Morphing pour masquer les bordures lumineuses déjà dessinées dans les PNG ; images WordPress inchangées.',
            'Témoin LIVE PLAY/STOP/transport inconnu directement dans les outils du séquenceur pour identifier les commandes effectivement reçues.',
            'Bridge local : détection du transport par état et callback, logs BPM/pairs/Play/Stop dans la console ; aucun message envoyé à Ableton.',
            'La quantification du séquenceur et les interactions MIDI restent inchangées.',
        )),
        '0.39.22' => array('Séquenceur : suivre Play/Stop Live, images stables et Espace protégé', array(
            'Options Play avec Live et Stop avec Live indépendantes ; le démarrage suit un vrai passage Stop → Play avec Start/Stop Sync et un pair Link détecté.',
            'Images des cases isolées des styles de survol : rappel et morphing restent visibles sous le pointeur.',
            'Espace ne modifie plus la case qui garde le focus après un clic ; Entrée reste disponible pour l’accessibilité.',
            'Bridge renforcé : une éventuelle erreur de lecture du transport ne doit plus interrompre les données BPM.',
        )),
        '0.39.21' => array('Séquenceur : PNG visibles, raccourcis et Stop avec Live', array(
            'Corrige les PNG invisibles dans la grille, masqués par le style général des boutons Hydra ; apparence toujours personnalisable depuis WordPress.',
            'Raccourcis J pour afficher ou masquer la grille, K pour lancer ou arrêter le séquenceur ; configurables dans Raccourcis et écrans, sans activation dans les champs de saisie.',
            'Nouvelle option locale « Stop avec Live » pour arrêter la lecture du séquenceur sur une transition Play vers Stop d’Ableton Link. Ne démarre pas automatiquement avec Live.',
            'Pour Start/Stop Sync : remplacer server.cjs sur le PC (aucune recompilation) et activer Start/Stop Sync dans Ableton Live. Aucun message de transport n’est émis vers Live.',
        )),
        '0.39.20' => array('Séquenceur : édition live et PNG personnalisés', array(
            'Cases modifiables pendant la lecture : poser, déplacer, retirer et inverser Rappel/Morphing au clic droit, sans arrêter Link.',
            'Le pattern modifié est enregistré dans ce navigateur et pris en compte au prochain passage du pas.',
            'Cases dessinées avec les PNG de la médiathèque : vide, rappel, morphing et active ; tête de lecture lumineuse réalisée en CSS.',
            'URLs des quatre images configurables dans Réglages → Strudel — Apparence, y compris pour la fenêtre détachée des contrôleurs. Bridge Windows inchangé.',
        )),
        '0.39.19' => array('Grille de déclenchements pour le séquenceur visuel', array(
            'Grille de dix snapshots, 16 ou 32 pas ; un seul déclenchement par colonne (version A).',
            'Cases Rappel ou Morphing, curseur mobile, quantification au pas et synchronisation avec Ableton Link.',
            'Lecture autonome à BPM réglable, stockage local par banque de snapshots et conversion des anciennes étapes.',
            'Pas de changement du bridge Windows ; installation WordPress habituelle.',
        )),
        '0.39.18' => array('Stabilité des menus du séquenceur visuel', array(
            'Correction du clignotement des menus déroulants sous Firefox : les étapes ne sont plus recréées lors d’une sélection.',
            'Actualisation douce des options disponibles et animation optimisée des barres de progression, sans altérer Link ou MIDI.',
        )),
        '0.39.17' => array('Séquenceur visuel de snapshots', array(
            'Jusqu’à 8 étapes, rappels ou morphings, durée de 1, 2, 4 ou 8 mesures par étape, boucle et réorganisation.',
            'Horloge Ableton Link si disponible : départ sur la prochaine mesure et étapes recadrées à chaque évolution du BPM. Horloge interne sinon.',
            'Morphings progressant en temps musicaux sous Link. Programme local au navigateur, indépendant des sauvegardes WordPress.',
            'Lecture stoppée en cas de perte de Link ; les commandes manuelles et MIDI reprennent la priorité sur la séquence.',
        )),
        '0.39.16' => array('Ableton Link : snapshots calés au temps ou à la mesure', array(
            'Choix du déclenchement : immédiat, prochain temps, prochaine mesure, prochains cycles de 4 et 8 mesures.',
            'Boutons, associations MIDI et déclencheurs par notes partagent l’horloge Link locale.',
            'Une seule action en attente, annulation et repli immédiat sans Link ; préférence locale au navigateur.',
            'Le bridge fournit les phases 16 et 32 temps pour les blocs de 4 et 8 mesures. Pas de commande de tempo ni de transport.',
        )),
        '0.39.15' => array('Ableton Link : première connexion locale', array(
            'Barre Link facultative avec affichage BPM, phase de mesure et participants via bridge local.',
            'Connexion sur demande, reconnexion et mode autonome préservé ; tempo en lecture seule, sans toucher aux snapshots ni au MIDI.',
            'Bridge Node.js expérimental fourni dans tools/ableton-link-bridge ; aucune connexion WordPress serveur vers le PC.',
        )),
        '0.39.14' => array('Commandes visuelles repliables et titres centrés', array(
            'Le panneau flottant en bas à droite démarre minimisé. Un petit bouton affiche ou replie les commandes et leurs messages, sans changer la diffusion des visuels.',
            'Réduire le panneau ferme aussi les réglages. Échap ferme d’abord les réglages ouverts, puis permet de replier le panneau et rend le focus au bouton visible.',
            'Les titres des paramètres sont recentrés à côté du logo MIDI Learn, sur la page et dans les contrôleurs détachés et hors ligne.',
        )),
        '0.39.13' => array('MIDI Learn compact sur les paramètres', array(
            'Le logo MIDI Learn remplace le bouton texte et se place en haut à droite de chaque bloc de paramètre.',
            'Il clignote pendant l’apprentissage ; un second clic annule. L’infobulle indique la liaison actuelle et le logo associé est accentué.',
            'La ligne inférieure est masquée sans association MIDI. Délier MIDI et inverser la plage restent disponibles sur les paramètres associés.',
            'Disponible dans la page, les fenêtres détachées et les nouveaux packs VJ hors ligne.',
        )),
        '0.39.12' => array('Logo MIDI Learn dans les associations', array(
            'Dans Associations → Modifier, le logo MIDI Learn remplace le bouton Apprendre. Le logo clignote pendant l’attente puis redevient fixe.',
            'Infobulle et libellé accessible indiquent Apprendre ou Annuler l’apprentissage MIDI. Un clic pendant l’attente l’arrête ; Enregistrer valide la nouvelle association.',
            'Disponible dans la page, les contrôleurs détachés et les nouveaux packs VJ hors ligne.',
        )),
        '0.39.11' => array('MIDI Learn directement sur les snapshots', array(
            'Logo MIDI Learn placé entre le bouton principal du snapshot et sa flèche. Un petit menu permet d’apprendre le rappel immédiat ou le morphing vers ce snapshot.',
            'Le logo clignote pendant l’attente du prochain message MIDI, puis redevient fixe après association ou annulation. Un clic pendant l’apprentissage l’annule.',
            'Les associations actuelles sont indiquées au survol. Le menu permet de délier le rappel ou le morphing indépendamment, sans chercher dans le panneau Associations.',
            'Logo inclus dans le plugin, adapté au thème clair/sombre et embarqué dans les nouveaux packs VJ hors ligne. Fonction disponible aussi dans les fenêtres détachées.',
        )),
        '0.39.10' => array('Réapprendre depuis Modifier une association MIDI', array(
            'Bouton Apprendre dans le formulaire Modifier d’une association MIDI : le prochain CC ou Note compatible remplit automatiquement le message, le numéro, le canal et l’entrée.',
            'La destination choisie dans le formulaire est conservée. Enregistrer applique le changement ; Annuler ou Échap ferme sans modifier l’association précédente.',
            'Le message utilisé pour apprendre ne déclenche pas de snapshot ou de morphing. Fermeture du formulaire et changement de destination interrompent l’apprentissage.',
            'Fonction disponible dans la page, les contrôleurs détachés et les nouveaux packs VJ hors ligne.',
        )),
        '0.39.9' => array('Rechargement sans banque MIDI enregistrée', array(
            'Corrige le rechargement lorsqu’aucune banque de snapshots/MIDI n’existe : la liste vide [] renvoyée par WordPress est acceptée comme une absence de banque enregistrée.',
            'Le rechargement peut ainsi retirer les associations locales non enregistrées et recréer les contrôleurs sans ces liaisons. Les banques enregistrées restent restaurées normalement.',
            'Une réponse manquante ou mal formée conserve le brouillon et affiche une erreur, comme auparavant.',
        )),
        '0.39.8' => array('Recharger réellement la version enregistrée du preset', array(
            'Recharger le preset relit la version WordPress actuelle et restaure ensemble le code, les snapshots et les associations MIDI enregistrés, y compris leur inversion.',
            'Les associations et captures non enregistrées du preset sont retirées, même si elles appartiennent à une structure de contrôleurs ajoutée temporairement. Les autres presets restent intacts.',
            'Si aucune banque n’est enregistrée, le preset revient sans snapshots ni associations MIDI. Un problème de connexion ou de session interrompt la restauration et conserve le brouillon.',
            'Dans les nouveaux packs VJ hors ligne, le rechargement revient à la version incluse dans le pack.',
        )),
        '0.39.7' => array('Inverser la plage d’un contrôleur MIDI', array(
            'Bouton + / − à droite des commandes MIDI de chaque paramètre associé à un CC. Au survol : Inverser plage MIDI, avec le sens actuel.',
            '+ : MIDI 0 vers Min et 127 vers Max. − : MIDI 0 vers Max et 127 vers Min. Les bornes Min/Max et la réponse des contrôleurs à la souris ne changent pas.',
            'Sens indépendant pour chaque destination : un même CC peut faire monter un paramètre et descendre un autre. Lissage MIDI conservé.',
            'Inversion conservée dans les banques locales, les sauvegardes WordPress, les nouveaux packs VJ et lors de la modification ou du réapprentissage du CC. Les anciennes associations restent en sens normal.',
        )),
        '0.39.6' => array('CC partagés et commandes directes des contrôleurs', array(
            'Un même CC peut être appris, attribué ou modifié pour piloter plusieurs paramètres du visuel. Les associations précédentes sont conservées ; chaque destination garde ses bornes Min/Max et le lissage MIDI.',
            'Partage accepté dans les sauvegardes WordPress et les banques locales. Les notes et commandes de snapshots ou de morphing conservent une destination par source.',
            'Délier MIDI sur chaque paramètre, près du bouton MIDI Learn, sans ouvrir Associations. Retire uniquement ce lien et conserve les autres destinations du CC.',
            'Recharger le preset dans la fenêtre Hydra · Contrôleurs restaure le code enregistré du preset sélectionné et relance le visuel. Les modifications non enregistrées du code sont remplacées ; les snapshots et associations restent conservés.',
            'Disponible également dans les nouveaux packs VJ hors ligne. Liaisons audio multiples et affichage des valeurs audio conservés.',
        )),
        '0.39.5' => array('Une source audio, plusieurs paramètres', array(
            'La source audio reste sélectionnée après une liaison : cliquer plusieurs titres de paramètres, X, Y ou le pad pour créer plusieurs liaisons depuis la même source.',
            'Bandeau dans les paramètres indiquant la source et ses destinations, avec Terminer les liaisons. Reclique la source ou utilise Échap hors d’un champ de saisie pour quitter la sélection.',
            'Les liaisons précédentes et leur profondeur individuelle sont conservées. Plusieurs clics pendant l’autorisation audio sont regroupés et appliqués ensemble.',
            'Les confirmations de liaison audio apparaissent dans le panneau Sources audio, au lieu du statut général placé près des commandes de lecture.',
            'Disponible dans la page, les contrôleurs détachés et les nouveaux packs VJ hors ligne. Lissage MIDI et hauteur stable des valeurs audio conservés.',
        )),
        '0.39.4' => array('Hauteur stable des valeurs audio', array(
            'Valeur avec audio occupe deux lignes fixes : libellé, puis valeur et liaison audio. Les changements de décimales ne font plus sauter la hauteur des contrôleurs.',
            'Chiffres de largeur constante ; détails trop longs abrégés visuellement, avec le texte complet au survol. La zone reste réservée en mode manuel.',
            'Même affichage dans la page, les contrôleurs détachés et les nouveaux packs VJ hors ligne. Calcul audio et lissage MIDI conservés.',
        )),
        '0.39.3' => array('Lissage des contrôleurs MIDI', array(
            'Lissage MIDI dans Contrôleurs → MIDI : curseur et saisie de 0 à 300 ms, 60 ms par défaut. Choix mémorisé dans ce navigateur et partagé avec les fenêtres détachées.',
            'Les axes XY, potentiomètres, sliders et faders avancent par valeurs intermédiaires à chaque image. Chaque nouveau CC ajuste la cible depuis la valeur affichée, sans file de mouvements en retard.',
            '0 ms retrouve la réponse immédiate. Interrupteurs, paramètres à pas entier, notes et déclenchements de snapshots gardent leur comportement discret.',
            'Une saisie manuelle, un rappel de snapshot, une nouvelle transition, une modification d’association ou la désactivation du MIDI interrompt les mouvements concernés.',
            'Les associations existantes, la réactivité audio et la prise de contrôle MIDI pendant un morphing sont conservées. Inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.39.2' => array('Modifier les associations MIDI', array(
            'Bouton Modifier dans chaque ligne de la liste Associations : formulaire prérempli pour corriger la destination, le type Note/CC, le numéro, le canal et l’entrée MIDI.',
            'Permet notamment de remplacer Rappeler le snapshot par Morpher vers le snapshot en gardant la note et le canal déjà appris.',
            'Enregistrer applique la modification ; Annuler ou Échap ferme le formulaire sans changer l’association. Les types de message proposés suivent la destination choisie.',
            'Un conflit de source ou une destination déjà liée conserve toutes les associations et affiche le problème. Les modifications sont enregistrables dans WordPress, comme avant.',
            'Inclus dans les contrôleurs détachés et les nouveaux packs VJ hors ligne. CC manuels et protection des axes XY conservés.',
        )),
        '0.39.1' => array('Attribution manuelle des CC MIDI', array(
            'MIDI : choisir la destination, ouvrir Attribuer un CC manuellement, saisir le numéro de CC et son canal, puis Attribuer le CC. Permet de fixer X sur CC1 et Y sur CC2 sans toucher le pad.',
            'Le MIDI Learn conserve une association existante si le même CC est reçu pour une autre destination : message explicite, sans supprimer la liaison du premier axe.',
            'Un CC manuel utilise l’entrée sélectionnée ; avec plusieurs ports, une entrée précise est demandée. Numéro 0 à 127 et canal 1 à 16 vérifiés.',
            'Associations conservées avec les presets et snapshots. Disponible dans les contrôleurs détachés et les nouveaux packs VJ hors ligne.',
        )),
        '0.39.0' => array('Première passe de lisibilité de l’interface', array(
            'Musique · Strudel et Visuels · Hydra : choix du preset et commandes de lecture au premier plan, avec une consigne de démarrage courte. Choisir un preset ne lance toujours pas la lecture.',
            'Code, sauvegarde et partage, enregistrement WAV, fenêtres et outils avancés regroupés dans des sections repliées au départ. Les commandes existantes restent accessibles.',
            'Boutons Lancer la musique / Lancer le visuel, puis Appliquer les modifications pendant la lecture. Libellés synchronisés dans les fenêtres séparées.',
            'Contrôleurs : paramètres du visuel en premier ; snapshots, audio et MIDI dans des sections repliables. Présentation, bornes Min/Max et apprentissage MIDI sous Réglages du contrôleur. Les liaisons audio actives restent visibles.',
            'Présentation commune à la page, aux contrôleurs détachés et aux nouveaux packs VJ hors ligne. Correctifs audio, snapshots et raccourcis F/G/H conservés.',
        )),
        '0.38.0' => array('Raccourcis clavier et choix des écrans', array(
            'F : visuel sur l’écran 2, sinon principal ; G : contrôleurs Hydra sur l’écran 3, sinon principal ; H : code Hydra sur l’écran principal.',
            'Panneau Raccourcis et écrans dans la barre Détacher de Hydra : touches et destinations personnalisables, activation, détection des moniteurs et boutons Tester. Réglages mémorisés dans ce navigateur.',
            'Placement automatique après autorisation dans un navigateur compatible ; placement manuel pour Firefox. Une fenêtre ouverte est réutilisée. Une destination déconnectée revient sur l’écran principal.',
            'Raccourcis ignorés pendant la saisie, les combinaisons Ctrl/Alt et les répétitions de touches. Dans sa propre fenêtre en plein écran, la même touche revient en mode fenêtre ; Échap reste disponible.',
            'Si le navigateur exige une action dans la fenêtre cible, un bouton termine le plein écran. Le visuel épinglé repasse en fenêtre classique. Inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.37.7' => array('Conserver les liaisons audio pendant les morphings', array(
            'Le morphing conserve les sources audio et profondeurs actuellement liées aux paramètres : une ancienne capture ne retire plus une liaison comme C5 vers la saturation.',
            'Les réglages visuels, valeurs, bornes et lissage continuent leur transition. La liaison audio reste active du départ à l’arrivée.',
            'Applicable aux morphings déclenchés par les notes, le MIDI, les flèches de snapshots, les transitions A/B et le curseur de morphing.',
            'Captures existantes conservées et position d’arrivée reconnue malgré les liaisons ajoutées après la capture. Inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.37.6' => array('Trois états pour les liaisons audio', array(
            'Gris : aucune liaison ; mauve : liaison créée dans les contrôleurs ; ambre : lecture FFT intégrée au code. Les lectures directes sont repérées dans le script et gardent leur comportement initial.',
            'Les deux types de liaisons apparaissent dans le détail de la source. Une source liée dans les contrôleurs et dans le code reste mauve et indique les deux destinations.',
            'Clic droit : désactiver ou réactiver la liaison du code, ou délier toute la source. Délier est masqué lorsqu’il n’y a aucune liaison.',
            'Fréquences affichées avec leur partie entière. La précision de détection reste conservée si le champ n’est pas modifié.',
            'États et réglages inclus dans les fenêtres détachées et les nouveaux packs VJ hors ligne.',
        )),
        '0.37.5' => array('Afficher les liaisons de la source sélectionnée', array(
            'Cliquer sur une source liée affiche ses destinations : paramètres, axes X/Y des pads, rappel de snapshot ou morphing avec son numéro.',
            'Le message Clique une destination est réservé aux sources sans liaison. Les infobulles donnent aussi les destinations précises.',
            'Affichage actualisé pendant les modifications et dans les contrôleurs détachés ; inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.37.4' => array('Sources non liées toujours grisées', array(
            'Toutes les sources sans liaison sont grisées par défaut, FFT comme notes. Seules les sources liées aux paramètres ou aux snapshots sont colorées.',
            'La disponibilité de l’entrée audio ne change plus la couleur de liaison. Les vumètres restent visibles et une source déliée redevient grise.',
            'Sélection d’une source non liée indiquée par un contour gris pointillé ; éclair de frappe réservé aux sources liées.',
            'Affichage synchronisé dans les contrôleurs détachés et les nouveaux packs VJ hors ligne.',
        )),
        '0.37.3' => array('Destination audio vide par défaut', array(
            'Le menu de liaison commence sur Aucune destination, pour les FFT et les sources personnalisées. Aucun premier paramètre présélectionné.',
            'Lier reste désactivé jusqu’au choix explicite d’une cible. Délier reste accessible sans choisir de destination.',
            'Inclut la neutralisation des lectures FFT intégrées aux scripts, notamment le zoom Julia, et les protections contre les liaisons encore en préparation.',
        )),
        '0.37.2' => array('Déliaison des FFT intégrées au script', array(
            'Délier une FFT neutralise aussi ses lectures directes a.fft dans le script actif, comme l’accélération audio du zoom Julia. Le signal brut et les autres bandes restent disponibles.',
            'Neutralisation conservée avec le code du preset. Une nouvelle liaison ou Réactiver l’audio du script rétablit cette bande.',
            'Les liaisons et rappels de snapshots encore en préparation ne peuvent plus rétablir une association après une édition manuelle.',
            'Correction incluse dans les fenêtres détachées et les nouveaux packs VJ hors ligne.',
        )),
        '0.37.1' => array('Délier une source audio par clic droit', array(
            'Bouton Délier cette source dans le menu du clic droit : retire toutes les modulations actives de cette source et son déclenchement de snapshot ou morphing.',
            'Une source avec une liaison active prend une couleur mauve ; elle revient à son aspect normal après déliaison. Les paramètres liés sont listés dans le menu. La source reste disponible pour une nouvelle liaison ; les captures de snapshots conservent leurs réglages enregistrés.',
            'Code du preset actualisé en direct, sans relancer Hydra. Compatible avec les bandes FFT, sources par note, pads XY, fenêtres détachées et nouveaux packs VJ hors ligne.',
        )),
        '0.37.0' => array('Sources audio par note et liaisons par clic droit', array(
            'Jusqu’à 32 sources personnalisées : fréquence en Hz, demi-largeur, sensibilité, seuil, enveloppe et délai entre les frappes.',
            'Gamme C Mixophonic 11 notes préremplie, avec diapason A4 réglable. G3 vaut environ 195,998 Hz pour A4 = 440 Hz.',
            'Clic droit sur toute source : paramètres, axes des pads, rappel ou morphing vers les dix snapshots, y compris hors écran ou en fenêtre détachée.',
            'Détection des nouvelles montées du son et aide contre les harmoniques ; reconnaissance à ajuster sur le vrai instrument, particulièrement pour les accords et octaves.',
            'Réglages et déclenchements intégrés au code du preset ; sauvegardes WordPress, partages, snapshots et nouveaux packs VJ hors ligne compatibles.',
        )),
        '0.36.0' => array('Random à puissance réglable', array(
            'Bouton Random dans les contrôleurs : variations des valeurs actuelles avec une puissance de 0 à 100 %, réglable par curseur ou au clavier.',
            'À faible puissance, exploration autour des réglages actuels ; à 100 %, tirage sur toute la plage Min–Max. Bornes, pas, présentations et liaisons audio conservés.',
            'Annuler Random restaure les valeurs précédentes. Une nouvelle édition ou un morphing rend cette annulation indisponible.',
            'Random et son annulation sont désactivés pendant les transitions ; les snapshots capturés restent intacts.',
            'Synchronisation dans les contrôleurs détachés, code actualisé sans relancer Hydra et compatibilité avec les nouveaux packs VJ hors ligne.',
        )),
        '0.35.1' => array('Morpher vers un snapshot en un clic', array(
            'Bouton de snapshot scindé : rappel instantané à gauche, petite flèche à droite pour morpher depuis les réglages actuels.',
            'La flèche utilise la durée et le lissage choisis, comme la destination Morpher vers du MIDI Learn, sans sélection De / Vers.',
            'Flèche désactivée pour les emplacements vides et pendant une transition ; la cible en cours est indiquée.',
            'Disponible dans la page, les contrôleurs détachés et les nouveaux packs VJ hors ligne.',
        )),
        '0.35.0' => array('Dix snapshots pour le live', array(
            'Mettre à jour le preset enregistre aussi la banque locale après une édition manuelle du code compatible ; confirmation explicite du nombre de snapshots sauvegardés.',
            'Dix emplacements par preset, avec capture, rappel, morphing et lissage entre toutes les variations.',
            'Migration des banques de quatre snapshots : captures, durée, lissage et associations MIDI conservés.',
            'MIDI Learn étendu au rappel et au morphing vers les snapshots 5 à 10 ; sauvegarde WordPress et export hors ligne compatibles.',
            'Disposition en deux rangées de cinq sur grand écran ; panneau non fixe sur les petites hauteurs.',
        )),
        '0.34.3' => array('Guide rapide en PDF', array(
            'Lien Guide rapide (PDF) sous l’introduction du laboratoire, accessible à tous les visiteurs.',
            'Ouverture dans un nouvel onglet pour garder le laboratoire ouvert pendant la consultation.',
        )),
        '0.34.2' => array('Transitions plus légères', array(
            'Regroupement des sauvegardes locales du code pendant les changements en direct, au lieu d’une écriture à chaque image. Dernier brouillon conservé lors de la sortie de page.',
            'Le Designer suspend ses horloges, sa synchronisation et ses vumètres lorsqu’il est masqué, minimisé ou que sa fenêtre perd le focus. Il reprend automatiquement avec le code courant.',
            'Les fenêtres de code et les contrôleurs suivent leurs cadences d’affichage ; le calcul du morphing et les paramètres du visuel restent actualisés à chaque image.',
            'Durée, lissage, contrôle MIDI, valeurs finales et sauvegardes WordPress conservés. Optimisations également incluses dans les exports hors ligne.',
        )),
        '0.34.1' => array('Contrôle MIDI pendant le morphing', array(
            'Modifier un paramètre par MIDI ne coupe plus la transition : les autres contrôleurs continuent leur morphing avec la durée et le lissage choisis.',
            'Le contrôleur touché suit les dernières valeurs MIDI et les conserve à l’arrivée. Ses bornes et liaisons audio restent celles de la prise en main.',
            'Compatible avec les transitions vers un snapshot, les transitions A/B, les interrupteurs MIDI, les fenêtres détachées et les exports hors ligne.',
            'Les snapshots enregistrés restent intacts. À la transition suivante, tous les contrôleurs participent à nouveau ; la position MIDI et Pause gardent leur prise en main globale.',
        )),
        '0.34.0' => array('Morphing MIDI vers un snapshot', array(
            'Quatre nouvelles destinations MIDI Learn : Morpher vers le snapshot 1, 2, 3 ou 4, depuis les réglages actuels.',
            'Transitions avec la durée et le lissage sélectionnés, sans relancer Hydra et avec les liaisons audio actives. Aucun choix De / Vers nécessaire.',
            'Les déclenchements reçus pendant une transition ou sa préparation sont ignorés, sans file d’attente. Un snapshot déjà atteint ne relance pas de transition.',
            'Associations conservées avec le preset dans WordPress, les contrôleurs détachés et les exports VJ hors ligne. Les rappels instantanés restent disponibles.',
        )),
        '0.33.0' => array('MIDI Learn et Ableton', array(
            'MIDI Learn depuis les contrôleurs : paramètres CC, interrupteurs, rappel des quatre snapshots, morphing aller/retour/pause, position et durée.',
            'Choix du port et du canal, moniteur MIDI, associations modifiables et suppression des liaisons. Compatible avec la fenêtre de contrôleurs détachée.',
            'Associations sauvegardées avec les snapshots dans WordPress et emportées dans les exports VJ hors ligne. Aucun accès MIDI demandé avant activation.',
            'Réception des ports déjà ouverts, branchement à chaud et filtrage des Note Off / vélocités nulles. Traitement des CC regroupé par image sans relancer Hydra.',
            'hydra-midi 0.4.6 embarqué sous licence MIT avec adaptation isolée pour préserver les fonctions Strudel. Chargement des URL CDN remplacé par la copie locale.',
        )),
        '0.32.0' => array('Snapshots dans WordPress', array(
            'Enregistrement des quatre snapshots, de la durée et du lissage dans le preset WordPress depuis les contrôleurs, y compris en plein écran.',
            'Mettre à jour le preset enregistre également sa banque de snapshots. Création de presets avec reprise des captures du brouillon actif.',
            'Récupération sur un autre navigateur pour un administrateur connecté. Copie locale conservée hors connexion ; conflits et erreurs signalés sans perte des captures.',
            'API réservée aux administrateurs, validation des contrôleurs et protection des modifications concurrentes. Le visuel continue pendant la sauvegarde.',
            'Les packs VJ hors ligne incluent aussi les banques WordPress récupérées lors de l’export.',
        )),
        '0.31.0' => array('Lissage du morphing', array(
            'Lissage optionnel des transitions automatiques : départ doux, arrivée douce ou les deux, avec courbes sinusoïdale, quadratique ou cubique.',
            'Aperçu de la courbe et activation directe dans les contrôleurs. La durée reste celle choisie, dans les deux sens.',
            'Le curseur manuel conserve son contrôle direct. Modifier le lissage interrompt le fondu en cours et prépare la prochaine transition.',
            'Réglages conservés par preset, synchronisés dans les fenêtres détachées et inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.30.1' => array('Sélection stable des snapshots', array(
            'Correction du clignotement des sélecteurs De et Vers : les options sont mises à jour uniquement quand leur état change.',
            'La sélection native au clavier reste intacte pendant les rafraîchissements audio et le morphing, dans la page et les fenêtres détachées.',
            'Correction incluse dans les nouveaux packs VJ hors ligne ; les snapshots déjà capturés restent conservés.',
        )),
        '0.30.0' => array('Snapshots et morphing Hydra', array(
            'Quatre snapshots par preset dans les contrôleurs : capture et rappel des valeurs manuelles, bornes, présentations et liaisons audio.',
            'Morphing manuel entre deux snapshots, durée réglable de 0,1 à 600 secondes et transitions automatiques dans les deux sens, avec pause.',
            'Modulation audio active pendant les transitions. Les changements de bande passent par une profondeur nulle ; les interrupteurs basculent à mi-parcours.',
            'Rendu et phases conservés : rappel et morphing mettent à jour le code et les contrôleurs sans relancer Hydra. Un réglage manuel interrompt la transition.',
            'Snapshots conservés dans ce navigateur, isolés par preset et par structure de script, synchronisés dans les fenêtres détachées et inclus dans les nouveaux packs VJ hors ligne.',
        )),
        '0.29.1' => array('Saisie des valeurs des contrôleurs', array(
            'La valeur à droite de chaque contrôleur est éditable au clavier. Entrée ou clic ailleurs applique le réglage ; Échap annule la saisie.',
            'Décimales avec point ou virgule, nombres négatifs et notation scientifique. La valeur respecte les bornes et le pas du contrôleur.',
            'La saisie reste stable pendant la modulation audio. Le champ règle la valeur manuelle ; la valeur avec audio reste affichée séparément.',
            'Synchronisation immédiate du curseur, des potentiomètres, des faders, des pads XY et du code, sans relancer le visuel.',
            'Disponible dans les fenêtres détachées et les nouveaux packs VJ hors ligne. Les sauvegardes et mises à jour de presets conservent la valeur saisie.',
        )),
        '0.29.0' => array('Bornes des contrôleurs Hydra', array(
            'Champs Min et Max directement sur les curseurs, potentiomètres et faders, avec application des deux bornes ensemble.',
            'Modification en direct sans relancer le visuel : code du preset, limites audio et pads XY suivent la nouvelle plage. La valeur manuelle reste dans les bornes.',
            'Bornes synchronisées dans les fenêtres détachées des contrôleurs. Les interrupteurs gardent leur plage fixe 0–1.',
            'Validation des nombres et de Min < Max ; les réglages invalides ne remplacent pas la plage active.',
            'Inclus dans les nouveaux packs VJ hors ligne. Les nouvelles bornes sont conservées par les sauvegardes, exports et mises à jour de presets existantes.',
        )),
        '0.28.0' => array('Hyper-Hydra : modes de fusion locaux', array(
            'Hydra-blend intégré au plugin et au pack VJ hors ligne : screen, colorBurn, linearBurn, overlay, softLight et les autres modes, sans CDN.',
            'Les anciens appels loadScript de hydra-blend chargent la copie locale ; loadHydraExtension(\'blend\') est également disponible.',
            'Raccourcis pm et negate disponibles après chaque chargement, y compris sur un nouveau moteur.',
            'Les fonctions natives luma, mask et layer sont restaurées au lancement du preset suivant, pour ne pas transmettre les changements de hydra-blend.',
            'Correction de compilation du mode phoenix ; sources originales et licence GPL v3 incluses.',
        )),
        '0.27.0' => array('Shaders locaux et pack VJ hors ligne', array(
            'Lib-color, lib-noise et hydra-fractals intégrés au plugin : les appels loadScript des presets existants chargent ces copies locales sans CDN.',
            'Nouvelle fonction loadHydraExtension pour charger color, noise ou fractals ; définitions enregistrées sur le moteur actif, sans modifier les formules.',
            'Pack VJ hors ligne réservé à l’administrateur : téléchargement d’un fichier HTML autonome avec le catalogue Hydra, le brouillon, les essais locaux, les contrôleurs audio et le Designer.',
            'Le fichier fonctionne sans WordPress ni connexion ; les images personnelles peuvent être choisies sur le disque. Les URL d’images et autres scripts externes ne sont pas embarqués.',
            'Sources originales, attributions et licences incluses ; bibliothèque figée plutôt qu’une version latest chargée pendant une performance.',
        )),
        '0.26.0' => array('Supprimer un preset depuis Hydra', array(
            'Bouton Supprimer le preset dans l’éditeur Hydra et ses fenêtres détachées, réservé aux administrateurs connectés.',
            'Confirmation avec le nom du preset, puis placement dans la corbeille WordPress et retrait immédiat du catalogue.',
            'Le code, le nom en cours d’édition, les contrôleurs et le rendu restent en place ; le brouillon est détaché du preset supprimé.',
            'Protection contre les modifications concurrentes du code, du nom ou des catégories ; les refus gardent le preset et le brouillon.',
            'Les essais locaux et les autres presets restent indépendants. Le Designer et les images personnelles sont conservés.',
        )),
        '0.25.1' => array('Contrôleurs visuels dans le Designer', array(
            'Le nœud Bouton rotatif affiche une molette circulaire avec indicateur ; le nœud Slider affiche une glissière horizontale.',
            'Manipulation à la souris ou au clavier, valeur affichée et champs min/max/pas conservés. Les gestes respectent la plage et le pas.',
            'Même rendu dans la fenêtre détachée, annuler/rétablir et sauvegarde du graphe. Update reste nécessaire pour appliquer les changements au visuel.',
        )),
        '0.25.0' => array('Importer les anciens presets dans le Designer', array(
            'Bouton Importer le code dans le Designer et sa fenêtre détachée : analyse du script courant sans exécution, sans modification du code ou du preset WordPress.',
            'Conversion des sources, transformations, couleurs, mélanges, modulations et buffers o0–o3 en nœuds et câbles.',
            'Fonctions fléchées audio, tableaux smooth/fast et variables conservés dans des nœuds Expression, avec édition JavaScript.',
            'Initialisations, sliders, fonctions, shaders setFunction, images, vitesse et render conservés dans leur ordre original. Générateurs personnalisés représentés par des blocs de code.',
            'Update applique le résultat ; les sauvegardes gardent le graphe et le code conservé. Les sorties conditionnelles, dans des boucles ou fonctions, et les multiples écritures d’un même buffer restent en mode Code, avec diagnostic explicite.',
        )),
        '0.24.0' => array('Hydra Designer — première version', array(
            'Canvas de nœuds avec câbles typés, zoom, déplacement, cadrage et annuler/rétablir. Fenêtre détachable et plein écran.',
            'Sources, transformations, couleur, mix et modulations du moteur Hydra ; FFT 0–5, amplitude moyenne, sliders, knobs, pad XY et LFO.',
            'Génération de code dans le moteur existant. Update lance le patch ; charger une démo ou modifier un paramètre ne lance pas les visuels.',
            'Graphe JSON intégré dans un commentaire du script : presets WordPress, essais locaux, partages et exports gardent le graphe et ses positions. Import/export JSON séparé disponible.',
            'Les scripts Hydra existants restent en mode Code. Confirmation avant remplacement ; cette version ne convertit pas les scripts libres en nœuds. Le LFO BPM utilise un tempo manuel, sans nouvelle intégration Ableton Link.',
        )),
        '0.23.0' => array('Images personnelles dans Hydra', array(
            'Panneau Image source pour les scripts utilisant await imageSource(s0, URL), avec aperçu local et remplacement à chaud de l’image.',
            'Import JPG, PNG, WebP et GIF depuis l’ordinateur, URL directe et retour à l’image du script.',
            'Pour les administrateurs : enregistrement de la photo dans la médiathèque WordPress et insertion de son URL dans le code du preset.',
            'Panneau synchronisé dans les fenêtres détachées Hydra ; les effets et contrôleurs restent indépendants du choix d’image.',
        )),
        '0.22.0' => array('Catégories des presets Hydra', array(
            'Classement des presets dans les catégories WordPress existantes depuis l’application, réservé aux administrateurs.',
            'Sélection de plusieurs catégories ou retrait de toutes les catégories, avec mise à jour immédiate du filtre et des couleurs.',
            'Enregistrement séparé du classement : le code, le nom en cours d’édition, les contrôleurs et le visuel restent actifs.',
            'Catégories synchronisées dans les fenêtres détachées du code et des contrôleurs Hydra.',
        )),
        '0.21.0' => array('Couleurs par fonction et catégorie', array(
            'Accents doux pour les commandes de lecture, arrêt, réinitialisation, sauvegarde et outils, en modes clair et sombre.',
            'Couleurs réglables dans Apparence, avec une couleur par section Strudel et par catégorie Hydra.',
            'Aperçu immédiat en clair ou sombre, et preset sélectionné plus visible. Les réglages et presets existants sont conservés.',
            'Créer un nouveau preset WordPress depuis le script affiché, sans fichier à importer. Le bouton de sauvegarde locale indique maintenant clairement sa destination.',
            'Renommer un preset Hydra depuis le site ou une fenêtre séparée : « Mettre à jour le preset » enregistre le nom et le code. Protection contre les modifications concurrentes.',
        )),
        '0.20.0' => array('Panneaux et historique', array(
            'Boutons pour masquer ou réafficher Strudel et Hydra séparément. Le panneau visible occupe toute la largeur.',
            'Choix mémorisé dans le navigateur, sans interrompre la lecture ni fermer les fenêtres séparées.',
            'Version installée et historique des changements dans les réglages, avec un accès depuis la liste des extensions.',
        )),
        '0.19.1' => array('Correction de l’import Hydra', array('Suppression du filtre serveur qui pouvait rejeter les presets complexes ; validation du code dans l’éditeur et contrôles administrateur conservés.')),
        '0.19.0' => array('Visuels au-dessus', array('Bouton « Au-dessus » pour une fenêtre flottante native lorsque le navigateur le permet. Fermeture et retour au panneau sans réinitialiser Hydra.')),
        '0.18.1' => array('Lisibilité des catégories', array('Couleurs des menus de catégories et de sauvegardes corrigées en modes clair et sombre.')),
        '0.18.0' => array('Importer dans WordPress', array('L’import Hydra crée directement un preset WordPress pour l’administrateur, dans la catégorie Imports. Les réimports identiques évitent les doublons.')),
        '0.17.0' => array('Modifier les presets depuis le site', array('Bouton « Mettre à jour le preset » dans l’éditeur Hydra et ses fenêtres séparées, réservé à l’administrateur. Protection contre l’écrasement d’une modification concurrente.')),
        '0.16.1' => array('Menus des contrôleurs', array('Lisibilité des menus de types de contrôleurs et de leurs options en mode sombre.')),
        '0.16.0' => array('Contrôleurs et liaisons audio', array('Contrôleurs Hydra : sliders, boutons rotatifs, faders, interrupteurs et pads XY.', 'Liaisons audio par glisser-déposer des bandes FFT, profondeur réglable et mise à jour du code.')),
        '0.15.0' => array('Fenêtres détachables', array('Éditeurs de code et contrôleurs Strudel/Hydra dans des fenêtres séparées, synchronisées avec la page. Commandes de lecture, plein écran et rattachement.')),
        '0.14.0' => array('Deux espaces Strudel et Hydra', array('Éditeurs indépendants pour la musique et les visuels, bibliothèque Hydra WordPress avec catégories et recherche.', 'Essais Hydra séparés et partage conjoint de la musique et des visuels.')),
        '0.13.0' => array('Liens courts', array('Partages conservés dans WordPress : une copie du code, du nom et du volume accessible par un lien court. Compatibilité avec les anciens liens.')),
        '0.12.0' => array('Partager un morceau', array('Partage du preset ou du code modifié avec le nom, le volume et les valeurs des curseurs. Aucun lancement automatique à l’ouverture du lien.')),
        '0.11.4' => array('État et reconnexion du micro', array('État de l’entrée audio Hydra, nom du périphérique et bouton de reconnexion sans réinitialiser le visuel. Messages dédiés aux problèmes de capture.')),
        '0.11.3' => array('Entrée audio Hydra', array('Correction de l’initialisation de l’analyse audio et du vumètre FFT ; libération du microphone lorsqu’il n’est plus utilisé.')),
        '0.11.2' => array('Préparer le preset suivant', array('Charger un preset laisse la lecture et l’enregistrement en cours continuer. Update applique le nouveau code.')),
        '0.11.1' => array('Chargement sans lecture', array('Les presets chargent seulement leur code. Suppression de l’ancienne action aléatoire dans les réglages des presets.')),
        '0.11.0' => array('Sections de presets', array('Jusqu’à dix sections et dix presets par section, avec listes au survol, au clic et au clavier. Noms et visibilité configurables dans WordPress.')),
        '0.10.2' => array('Punchcards et percussions', array('Visualisations punchcard indépendantes par piste et prise en charge de noms courts de percussions supplémentaires.')),
        '0.10.1' => array('Sortie directe et plein écran', array('Sortie Hydra transférée directement dans la fenêtre séparée pour réduire la latence. Commandes de plein écran exécutées depuis cette fenêtre.')),
        '0.10.0' => array('Projection séparée', array('Fenêtre dédiée aux visuels, déplaçable sur un second écran, avec commandes de plein écran.')),
        '0.9.0' => array('Presets personnalisables', array('Noms, code, visibilité et preset de départ configurables dans WordPress.')),
        '0.8.2' => array('Banques General MIDI', array('Lecture de banques contenant des expressions arithmétiques et amélioration du préchargement des instruments.')),
        '0.8.1' => array('Visualisations par piste', array('Visualisations sous les pistes et ajout du son de clap local.')),
        '0.8.0' => array('Hydra', array('Intégration du moteur Hydra, des contrôles visuels et de la passerelle H pour les paramètres.')),
        '0.7.0' => array('Visuels en fond ou en panneau', array('Choix du mode visuel et réglages d’opacité, de teinte, de saturation et de hauteur mémorisés dans le navigateur.')),
        '0.6.0' => array('Apparence WordPress', array('Réglages de dimensions, couleurs, textes et panneaux avec aperçu dans l’administration.')),
        '0.5.0' => array('Curseurs et General MIDI', array('Curseurs générés depuis le code et instruments General MIDI chargés à la demande.')),
        '0.4.0' => array('Sauvegardes et WAV', array('Essais et brouillons dans le navigateur, import/export de code et enregistrement audio WAV.')),
        '0.3.2' => array('Lisibilité du code', array('Amélioration des couleurs, de la sélection et du focus dans l’éditeur.')),
        '0.3.1' => array('Caches des fichiers', array('Fichiers JavaScript et CSS versionnés dans leur nom pour éviter de mélanger différentes versions.')),
    );
}

function pilami_strudel_lab_render_history() {
    $history = pilami_strudel_lab_history();
    $current = $history[PILAMI_STRUDEL_LAB_VERSION] ?? null;
    ?>
    <section class="pilami-admin-card pilami-version-history" id="pilami-version-history" aria-label="Version du plugin et historique">
        <h2>Version installée : <span class="pilami-version-badge"><?php echo esc_html(PILAMI_STRUDEL_LAB_VERSION); ?></span></h2>
        <?php if ($current) { ?>
            <h3><?php echo esc_html($current[0]); ?></h3>
            <ul><?php foreach ($current[1] as $change) { ?><li><?php echo esc_html($change); ?></li><?php } ?></ul>
        <?php } ?>
        <details class="pilami-history-all">
            <summary>Historique des versions précédentes</summary>
            <p>Versions documentées, de la plus récente à la plus ancienne.</p>
        <?php foreach ($history as $version => $entry) { if ($version === PILAMI_STRUDEL_LAB_VERSION) { continue; } ?>
            <details>
                <summary><?php echo esc_html($version . ' — ' . $entry[0]); ?></summary>
                <ul><?php foreach ($entry[1] as $change) { ?><li><?php echo esc_html($change); ?></li><?php } ?></ul>
            </details>
        <?php } ?>
        </details>
    </section>
    <?php
}
