# Organisation du code

Ce dépôt a démarré avec les fichiers de l’extension 0.39.31 ; la version actuelle est 0.39.58. Le premier import conserve les fichiers existants et leurs noms versionnés ; il ne reconstitue pas artificiellement des commits pour les versions antérieures.

## Repères

| Chemin | Rôle |
|---|---|
| `pilami-strudel-lab.php` | Point d’entrée WordPress, shortcode, chargement des ressources et interface principale |
| `includes/` | Catalogue Hydra, édition, partages, apparence, banques de snapshots et historique |
| `assets/pilami-*.js` et `.css` | Modules de l’interface et styles, avec noms versionnés |
| `assets/vendor/` | Moteurs et bibliothèques embarqués, avec licences |
| `assets/offline/` | Modèle HTML et ressources du Pack VJ hors ligne |
| `sources/` | Sources et notices des moteurs adaptés et extensions Hydra |
| `tools/ableton-link-bridge/` | Copie du bridge associée à cette version ; projet maintenu séparément |
| `scripts/` | Vérification du paquet et fabrication du ZIP WordPress |
| `docs/` | Documentation du dépôt |
| `examples/` | Presets texte à importer et à expérimenter |

Pour trouver le module réellement chargé, commence par `pilami_strudel_lab_enqueue_assets()` dans le fichier PHP principal. Le numéro dans le nom d’un module ne correspond pas toujours à la version globale de l’extension. Plusieurs générations de fichiers coexistent à cause des adaptations du cache, des dépendances et des exports hors ligne.

## Modifier l’interface

1. Repère le module actif dans le chargement WordPress.
2. Modifie la source concernée ; pour une nouvelle version, adapte le nom/version chargé selon les conventions existantes.
3. Vérifie les fenêtres détachées et le Pack VJ : ils peuvent incorporer des copies ou listes distinctes de ressources.
4. Documente le comportement dans `includes/version-history.php` et le journal de version.
5. Vérifie la syntaxe PHP/JavaScript et teste le parcours concerné dans un WordPress de test.

Les fichiers historiques ne doivent être supprimés qu’après vérification des références et de la génération hors ligne. Le premier import les conserve intégralement.

## Moteurs embarqués

Le code PHP/JS/CSS Pilami est livré directement. Les sources Strudel se trouvent dans `sources/strudel-web/`, avec leurs versions de dépendances et leur configuration Vite. Hydra se trouve dans `sources/hydra-synth/`, avec sa commande de build Browserify. Les versions déjà compilées et adaptées sont dans `assets/vendor/`.

Installer ou reconstruire ces projets demande leurs dépendances npm. Le dépôt ne fournit pas de verrouillage complet des dépendances ni de commande unique reconstruisant à l’identique tous les bundles et le modèle hors ligne. Le script `build_plugin.py` **empaquette les ressources présentes**, sans recompiler les moteurs.

Les sources, versions et liens amont déjà livrés sont détaillés dans `README.txt` et `THIRD_PARTY_NOTICES.md`. Conserve les notices des composants que tu modifies ou redistribues.

## Performance et connexions

Le panneau Performance est dans `assets/pilami-performance-0.39.45.js`. Il utilise le modèle de contrôleurs existant et charge la bibliothèque locale Pixi à la demande. Les sources de compilation sont dans `sources/pixi-performance/` : `npm ci`, puis `npm run build`. Le build adapte l’énumération des systèmes Pixi aux méthodes héritées des tableaux Hydra ; conserve cette adaptation et les notices.

La barre Audio / MIDI / Link est montée par `assets/pilami-connections-0.39.37.js`. Elle réutilise les API MIDI et Link. L’adaptateur `pilami-hydra-0.39.56.js` conserve une connexion audio de session, indépendante du rendu et réutilisée au changement de preset. La désactivation ferme le flux et son contexte, et remet les mesures à zéro. Le compactage du thème est limité par la classe de page ajoutée pour le shortcode.

L’adaptation WordPress est dans `includes/account.php`, `assets/pilami-account-0.39.57.js` et `assets/pilami-site-menu-0.39.58.js`. Elle vérifie la connexion sans cache et déplace les nœuds de l’en-tête Blocksy dans un panneau, sans cloner ses liens ni ses gestionnaires de recherche. Ces outils ne sont pas intégrés aux exports publics ou aux Packs VJ.

Le Pack VJ incorpore des scripts et des sources en JSON : modifier uniquement un fichier chargé par WordPress ne suffit pas à le mettre à jour. Vérifie aussi le modèle autonome après tout changement partagé.

L’adaptateur Hydra distingue la taille demandée par le preset, les dimensions de l’affichage et le choix de résolution du navigateur. Les changements d’affichage passent par le redimensionnement interne ; les appels `setResolution` du preset mémorisent sa demande. Une préférence manuelle a la priorité sans réécrire le code. Les sélecteurs partagent ce même état, y compris dans les fenêtres détachées.

## Export public et exemple du bol

L’export est orchestré par `assets/pilami-public-export-0.39.55.js`. Le lecteur minimal est `assets/offline/public-player-0.39.55.js` ; le modèle exporté est `assets/offline/pilami-hydra-public.html`. Il est distinct du Pack VJ complet.

Le canevas lisible de la page exportée est `templates/public-page.html`. Les versions actives sont regroupées dans `scripts/export_assets.py` : une mise à jour du plugin ne signifie pas que tous les modules portent ce même numéro.

Après modification de ces modules, régénère le modèle public, puis sa copie embarquée dans le Pack VJ :

```sh
python3 scripts/build_public_template.py
python3 scripts/sync_public_export_offline.py
```

Ces scripts utilisent le canevas public, le modèle VJ et les sources déjà présents ; ils ne recompilent pas les moteurs tiers. Le synchroniseur conserve les modules MIDI récents et embarque l’icône MIDI Learn pour la lecture locale. `check_package.py` vérifie aussi la cohérence du lecteur public, de sa copie embarquée et des sources d’export archivées. Vérifie les exports en ligne et hors ligne après synchronisation.

Le bol possède ses sources dans `sources/glass-bowl/` et son exemple autonome dans `examples/`. `python3 scripts/build_glass_bowl.py` recompile ce seul preset avec esbuild 0.25.4. Les noms des contrôleurs du modèle servent à migrer les snapshots : leur stabilité est importante.

## Vérifications

```sh
python3 scripts/check_package.py
python3 scripts/build_plugin.py
```

La vérification contrôle la version, les chemins de ressources directement chargées par WordPress et les fichiers nécessaires. Elle ne remplace pas un test du rendu, du son ou du MIDI dans le navigateur.

Avec PHP installé, utilise `php -l` sur les fichiers PHP modifiés. Avec Node.js, utilise `node --check` sur les scripts d’interface modifiés. Le workflow GitHub effectue les contrôles de syntaxe des modules directement chargés, puis fabrique le ZIP et le joint comme artefact du workflow.

## Parcours à vérifier avant une version

- Lecture/Update et Stop Strudel, puis lancement d’un visuel Hydra.
- Modification d’un contrôleur, capture de snapshots, rappel et morphing.
- Clics Rappel/Morphing de la grille, lecture et Random.
- Ouverture des fenêtres, éditeur visible sans plein écran et raccourcis hors saisie.
- Clic droit sur les différents contrôleurs et glisser continu sur le pad Performance.
- Résolutions fixes, retour Selon le preset, plein écran et synchronisation des sélecteurs.
- Modification d’un preset en administrateur et consultation en visiteur.
- Export VJ hors ligne, et Link/MIDI si la modification les concerne.
- Mise à jour du code d’un preset avec snapshots, renommage et vérification de sa sauvegarde.
- Export public après rappel d’un snapshot, son de collision opt-in, fichier local et page hébergée sans requête externe.

Le code seul n’embarque pas les contenus de la base WordPress du site. Pour reproduire un problème lié à un preset, joins son code et les réglages pertinents au signalement.
