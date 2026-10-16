# Organisation du code

Ce dépôt démarre avec les fichiers de l’extension 0.39.31. Le premier import conserve les fichiers existants et leurs noms versionnés ; il ne reconstitue pas artificiellement des commits pour les versions antérieures.

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
- Ouverture des fenêtres et raccourcis hors saisie.
- Modification d’un preset en administrateur et consultation en visiteur.
- Export VJ hors ligne, et Link/MIDI si la modification les concerne.

Le code seul n’embarque pas les contenus de la base WordPress du site. Pour reproduire un problème lié à un preset, joins son code et les réglages pertinents au signalement.
