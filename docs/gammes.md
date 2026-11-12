# Créer une gamme personnalisée

Les gammes sont accessibles sans compte administrateur. Elles restent dans le navigateur et accompagnent le code du preset après enregistrement de la gamme. La publication dans WordPress nécessite les droits administrateur.

## Saisir ses notes

1. Lance un visuel et ouvre les contrôleurs, puis **Sources par note / fréquence**.
2. Ouvre **Mes gammes → Créer une gamme** et indique un nom.
3. Choisis le diapason **440 Hz** ou **432 Hz**.
4. Saisis les notes, par exemple `C3 F3 G3 Bb3 C4 D4 E4 F4 G4 Bb4 C5`. Espaces, virgules et tirets sont acceptés ; `Bb3` et `A#3` désignent la même note.
5. Vérifie l’aperçu, puis clique sur **Enregistrer la gamme**.
6. Sélectionne la gamme et clique sur **Appliquer la gamme**.

Les fréquences affichent leur partie entière, tandis que la détection conserve le calcul précis. Une gamme contient de 1 à 32 notes distinctes. La liste des sources est remplacée lors de l’application : elle ne s’allonge pas à chaque changement.

## Garder les liaisons utiles

Les notes communes aux deux gammes gardent leurs réglages et associations. Les liaisons des notes retirées sont supprimées dans les contrôleurs, les déclenchements et les snapshots. Les sources FFT générales restent indépendantes.

Le menu indique la gamme actuelle d’après les sources présentes. Choisir une autre gamme prépare son application ; le remplacement se fait avec **Appliquer la gamme**.

## Ajouter une seule note

**Source personnalisée** propose un choix de note avec calcul automatique. Les boutons **▼ / ▲** descendent ou montent d’un demi-ton. La fréquence peut aussi être saisie librement.

## Conserver et partager

Les deux exports TXT emportent les gammes et sources enregistrées dans le code. L’[export complet](presets-et-snapshots.md#exporter-et-réimporter-un-preset) ajoute les associations MIDI et le séquenceur. Dans WordPress, enregistre le preset après tes modifications pour conserver sa version sur le site.
