# Contribuer

Le projet est en développement. Les retours d’usage, essais de presets, corrections de documentation et propositions de code sont les bienvenus.

## Signaler un problème

Ouvre une issue avec :

- la version de l’extension, le système et le navigateur ;
- les actions permettant de reproduire le problème ;
- le résultat attendu et ce qui se produit ;
- le code du preset si le problème dépend de lui ;
- une capture ou une erreur de console utile, en retirant les informations personnelles.

Pour un problème du programme local Ableton Link, utilise les [issues du bridge](https://github.com/LostForgotten/pilami-link-bridge/issues). Pour l’affichage ou le séquenceur dans le navigateur, utilise ce dépôt.

## Proposer une modification

Crée une branche dans ton fork, limite la modification à un objectif et ouvre une pull request expliquant le comportement obtenu et comment tu l’as testé. Commence par [l’organisation du code](docs/developpement.md).

Conserve les licences et notices. N’ajoute pas de base de données WordPress, d’identifiants, de fichiers de configuration privés, de `node_modules/` ou de dépendances compilées. Les fichiers de travail et archives générées sont exclus avec `.gitignore`.

Les contrôles statiques et l’archive se préparent avec :

```sh
python3 scripts/check_package.py
python3 scripts/build_plugin.py
```

Ajoute à ta pull request le résultat de tes essais dans le navigateur, surtout si tu touches l’audio, les fenêtres détachées, les exports hors ligne, le MIDI ou la synchronisation.
