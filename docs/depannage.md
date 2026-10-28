# Dépanner ses premiers essais

Commence par garder une copie de ton code ou de tes essais si tu envisages de recharger ou de changer de navigateur. Évite d’effacer les données du site pour résoudre un simple problème de lecture : elles peuvent contenir tes photos et captures locales.

| Ce qui se passe | À vérifier en premier |
|---|---|
| Le preset est sélectionné mais aucune animation ne démarre | Clique sur **Lancer le visuel** ; la sélection seule ne lance pas la lecture |
| Le bouton de lecture affiche une erreur | Lis le message Hydra et teste un preset simple ; un script personnalisé peut demander WebGL 2 ou une bibliothèque particulière |
| Aucun contrôleur | Lance le preset ; certains scripts n’en définissent pas |
| Les contrôleurs disparaissent après **Utiliser** sur une photo | Réapplique le code avec **Appliquer les modifications / Hydra Update** |
| La photo semble absente | Vérifie le type de preset, l’application du code et ses paramètres de fond / exposition ; ils varient d’un preset à l’autre |
| La photo manque sur un autre ordinateur | Elle était peut-être locale : enregistre l’image dans WordPress, puis le preset |
| Aucun effet du son | Vérifie l’entrée réellement reçue, les autorisations, les liaisons et les interrupteurs audio du preset |
| Aucune musique alors que l’audio est activé | L’entrée audio analyse un signal ; lance séparément une musique dans Strudel ou ton logiciel audio |
| Le visuel ralentit en plein écran | Fixe la résolution à **640 × 360** ou **800 × 450**, puis consulte le [guide de fluidité](performance.md) |
| Une fenêtre Code / Contrôleurs ne s’ouvre pas | Autorise les pop-up du site, puis réessaie ; le navigateur peut demander un clic pour le plein écran |
| Les boutons WordPress ne sont pas disponibles | Vérifie la connexion et les droits du compte ; le voyant vert ne garantit pas les droits administrateur |
| Les snapshots manquent après changement de PC | Vérifie leur banque WordPress et les sauvegardes : une capture locale n’est pas automatiquement une sauvegarde sur le site |
| La note MIDI de collision n’arrive pas dans Ableton | Teste d’abord **Envoyer une note de test**, le port, l’entrée Track, l’instrument et le monitoring de la piste |
| L’export reste silencieux | Les entrées audio ne sont pas reproduites ; un son généré par le preset peut aussi demander un clic d’activation |
| Facebook montre une ancienne miniature | Dépose le nouveau HTML et son JPEG ensemble ; le cache du réseau social peut conserver l’ancienne prévisualisation |
| Une mise à jour semble ne rien changer | Ferme les fenêtres détachées, recharge avec **Ctrl + F5**, puis rouvre-les ; le cache du site peut aussi devoir être purgé |

## Si un problème persiste

Pour le décrire, relève la version du plugin, ton navigateur, le preset et les actions exactes qui le déclenchent. Note aussi la résolution choisie et si le problème se produit sur l’écran principal, l’écran de projection ou les deux.

Avant de partager une capture ou un extrait de console, retire les données personnelles. Le [guide de contribution](../CONTRIBUTING.md) indique où signaler le problème.
