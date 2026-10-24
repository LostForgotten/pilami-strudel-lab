# Installation et mises à jour

L’extension s’installe dans un WordPress existant. Une page publique avec le shortcode `[pilami_strudel]` affiche le laboratoire.

## Première installation

1. Télécharge le ZIP WordPress fourni avec une version, ou fabrique-le depuis les sources avec `python3 scripts/build_plugin.py`.
2. Dans WordPress, ouvre **Extensions → Ajouter une extension → Téléverser une extension**.
3. Sélectionne le ZIP puis active **Pilami Strudel Lab**.
4. Crée une page, ajoute un bloc **Code court** et saisis `[pilami_strudel]`.
5. Publie cette page et teste un preset Strudel puis un visuel Hydra.

Le moteur et les ressources embarquées se trouvent dans l’extension : aucune installation de Node.js n’est nécessaire pour l’usage courant dans WordPress. Le téléchargement GitHub « Source code » représente une copie du dépôt ; le script de fabrication produit un ZIP avec le nom de dossier stable `pilami-strudel-lab/`.

## Navigateur et autorisations

L’audio utilise Web Audio, les visuels WebGL. Lance la lecture par un clic ou un raccourci. Pour le micro, le MIDI et certaines API d’affichage, utilise une page HTTPS et accepte les autorisations demandées. La compatibilité MIDI et multiécran dépend du navigateur.

Les fenêtres détachées peuvent demander l’autorisation des pop-up. Le navigateur peut aussi demander un clic pour terminer le passage en plein écran ; F11 reste utilisable dans la fenêtre.

## Ce qui vient de pilami.fr

Le dépôt n’emporte pas la base de données du site : presets Hydra publiés, banques sauvegardées dans WordPress et médiathèque doivent être transférés séparément si tu veux reproduire le catalogue du site.

Des images du séquenceur, images sources de presets et le lien vers le guide PDF peuvent encore pointer vers pilami.fr. Pour adapter les images de la grille, ouvre **Réglages → Strudel — Apparence**. La passerelle Link fournie accepte pilami.fr et localhost ; un autre domaine HTTPS doit être ajouté explicitement aux origines autorisées du bridge.

## Mettre à jour

Sauvegarde d’abord les fichiers et la base WordPress avec ton outil habituel. Téléverse ensuite le nouveau ZIP et accepte le remplacement. Recharge la page principale avec Ctrl + F5 et ferme puis rouvre les fenêtres détachées pour charger les nouveaux modules. Purge le cache du site si nécessaire. Exporte un nouveau Pack VJ pour emporter ces améliorations hors ligne.

Les essais, réglages MIDI, raccourcis et patterns peuvent être conservés dans le stockage local du navigateur. Ils ne sont pas tous synchronisés avec WordPress. Conserve les exports proposés dans l’interface avant de changer de navigateur ou d’effacer ses données.

## Fabriquer le ZIP

Depuis la racine du dépôt, avec Python 3 :

```sh
python3 scripts/check_package.py
python3 scripts/build_plugin.py
```

Sous Windows, `py` peut remplacer `python3`. Le ZIP apparaît dans `dist/`, avec un fichier d’empreinte SHA-256. Les sources tierces et les licences sont conservées dans l’archive ; les fichiers réservés au dépôt GitHub sont exclus.

## Publier seulement un visuel

L’export **Exporter la page web** produit un HTML autonome à déposer dans les fichiers publics de l’hébergement. Il ne demande pas d’installer WordPress chez le visiteur. Consulte le [guide de publication](export-web.md) pour le placement du fichier, les réglages capturés et les limites audio.
