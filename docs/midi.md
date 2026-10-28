# Audio et MIDI : choisir la bonne connexion

Ces trois usages sont indépendants. Commence par celui dont tu as besoin.

| Objectif | Connexion |
|---|---|
| Le visuel bouge en fonction du son | Entrée audio et preset audio réactif |
| Un bouton ou une note pilote un paramètre / snapshot | Entrée MIDI et MIDI Learn |
| Une collision envoie une note à Ableton | Sortie MIDI d’un preset prévu pour cela |
| Le tempo du séquenceur suit Ableton | Ableton Link et bridge facultatif |

## Faire réagir un visuel au son

1. Lance un preset préparé pour l’audio.
2. Clique sur **Activer l’audio**, puis accepte l’autorisation dans le navigateur.
3. Dans les réglages d’entrée audio, sélectionne la source proposée qui reçoit réellement ton son.
4. Vérifie les mesures de niveau, puis ajuste la sensibilité et les profondeurs audio du preset.

Le son joué par Ableton ou par Strudel n’est pas automatiquement une entrée du navigateur. Son routage dépend de ta carte son et de ton système. Le navigateur doit recevoir ce signal sur l’entrée choisie.

Une liaison audio désactivée peut expliquer un paramètre immobile. Certains presets possèdent aussi leur propre interrupteur **Audio_Reactif**, et continuent une animation autonome même quand l’audio est coupé.

## Apprendre un contrôleur MIDI

1. Branche le contrôleur, puis clique sur **Activer le MIDI**.
2. Dans **Contrôler avec un appareil MIDI**, sélectionne l’entrée et le canal voulus.
3. Clique sur le logo **MIDI Learn** du paramètre : il clignote pendant l’apprentissage.
4. Bouge un seul potentiomètre ou appuie sur la note voulue.
5. Vérifie la liaison en manipulant à nouveau cette commande.

Un CC est une commande continue, typiquement un potentiomètre ou un axe de pad. Une note convient plutôt à un déclenchement. Pour un pad XY qui émet deux CC en même temps, renseigne les deux CC manuellement pour éviter d’apprendre le mauvais axe. **Associations → Modifier** permet de corriger une liaison et le lissage rend les mouvements plus continus.

Pour déclencher un snapshot depuis un clip Ableton, sa piste doit envoyer les notes vers l’entrée MIDI sélectionnée par Pilami. Un routage qui renvoie immédiatement ces mêmes notes dans Ableton peut créer une boucle ; sélectionne précisément les entrées et sorties de chaque piste.

## Envoyer une note de collision à Ableton

Le preset **Balle — Rebond MIDI**, dans **Expériences MIDI**, illustre la sortie MIDI. Cette fonction n’est pas ajoutée automatiquement à tous les shaders.

1. Sous Windows, ouvre un port MIDI virtuel avec un logiciel adapté, par exemple loopMIDI. Donne-lui un nom identifiable, comme **Pilami Rebond**.
2. Dans Pilami, charge et lance le preset, puis ouvre ses contrôleurs.
3. Dans **Rebond → sortie MIDI**, clique sur **Autoriser le MIDI**, choisis le port de sortie et active l’envoi.
4. Dans Ableton, active **Piste / Track** pour cette entrée MIDI.
5. Sur une piste contenant un instrument, choisis cette entrée. Mets **Monitor / Monitoring sur In**, ou **Auto** avec la piste armée.
6. Clique sur **Envoyer une note de test** dans Pilami. Vérifie ce trajet avant de régler les collisions.

Le numéro MIDI de la note, son canal, sa durée et sa vélocité sont réglables. Un compteur d’envoi ne prouve pas à lui seul qu’Ableton a reçu puis joué la note. Les essais automatisés utilisent des ports simulés ; valide le routage réel sur ton poste avec le bouton de test.

La sortie dépend de Web MIDI et des autorisations du navigateur. Les paramètres de port restent dans la session du navigateur ; ils ne sont pas inclus dans les pages web publiques exportées. L’arrêt du visuel coupe la note suivie.

## Partager le tempo avec Link

Link transporte une horloge musicale, pas des notes MIDI ni du son. Utilise le [guide Ableton Link](ableton-link.md) si tu veux synchroniser le tempo et, selon les options, les départs et arrêts du séquenceur.
