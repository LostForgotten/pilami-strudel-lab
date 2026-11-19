# Exporter un visuel pour Max for Live

L’export Max for Live de la version 0.39.92 transforme **certains** presets Hydra en périphériques visuels pour Ableton Live. Le bouton et son diagnostic se trouvent dans **Preset sélectionné**, à côté des autres exports. Le résultat est un ZIP contenant un `.amxd`, un script JavaScript et un shader JXS.

## Préparer et installer

1. Ouvre un preset Hydra et lance le visuel avec **Lecture / Update**. L’indicateur près du bouton explique si la conversion est possible ; certaines vérifications exigent que le visuel soit lancé.
2. Clique **Exporter pour Max for Live** et choisis les contrôleurs à exposer dans Live, de zéro à seize. Les contrôleurs non exposés gardent leur valeur de base au moment de l’export et leur modulation audio compatible.
3. Décompresse **tout** le ZIP dans un dossier permanent. Garde les fichiers `.js` et `.jxs` à côté du `.amxd`.
4. Glisse le `.amxd` sur une piste audio, un groupe ou le Master dans Live 11 Suite / Max 8, puis active **Visuel actif**.

L’export propose une résolution et une vitesse globale réglables. L’audio de la piste est adapté en trois enveloppes, graves, médiums et aigus. Ajuste **Sensibilité audio** dans Live : les valeurs peuvent différer de l’analyse FFT du navigateur. Les horloges reconnues repartent de leur état initial au chargement du périphérique.

## Compatibilité et limites

Une chaîne Hydra avec une sortie `.out()` et, si nécessaire, un feedback sur cette même sortie peut être convertie. La sélection des contrôleurs est limitée à seize paramètres automatisables. L’indicateur précise la raison d’un refus ; le convertisseur ne télécharge pas de périphérique partiel.

Les presets utilisant des images, caméras, vidéos, plusieurs buffers ou un moteur WebGL indépendant à plusieurs passes demandent une adaptation particulière. C’est notamment le cas de **Blob translucide**. Les callbacks JavaScript arbitraires, sources par notes et tableaux temporels ne sont pas exécutés par Max. Les horloges et formules reconnues pour **Feu et étincelles**, **Plis lumineux** et **Julia-curseurs** disposent de conversions spécifiques.

Les snapshots, le séquenceur, les associations MIDI et Ableton Link du laboratoire ne sont pas emportés dans le périphérique. Recrée les variations utiles avec les automatisations et affectations de Live. L’export depuis un Pack VJ hors ligne n’est pas proposé dans cette version.

Le paquet et plusieurs shaders ont fait l’objet de vérifications de structure et de compilation. **Le rendu du périphérique dans Ableton sous Windows reste à tester.** Garde le preset Hydra original pour comparer le comportement et signaler les différences.
