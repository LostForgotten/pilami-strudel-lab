# Exporter un visuel pour Max for Live

L’export Max for Live de la version 0.39.96 transforme **certains** presets Hydra en périphériques visuels pour Ableton Live. Le bouton et son diagnostic se trouvent dans **Preset sélectionné**, à côté des autres exports. Deux cibles sont proposées : conversion Jitter native pour Live 11 / Max 8 et lecteur WebGL embarqué pour Live 12 / Max 9.2 ou plus récent.

## Préparer et installer

1. Ouvre un preset Hydra et lance le visuel avec **Lecture / Update**. L’indicateur près du bouton explique si la conversion est possible ; certaines vérifications exigent que le visuel soit lancé.
2. Clique **Exporter pour Max for Live**, choisis la cible selon la version de Max utilisée par Live et sélectionne de zéro à seize contrôleurs. Les contrôleurs non exposés gardent leur valeur de base au moment de l’export et leur modulation audio compatible.
3. Décompresse **tout** le ZIP dans un dossier permanent et conserve tous les fichiers à côté du `.amxd`. La cible native utilise notamment `.js` et `.jxs` ; la cible WebGL ajoute son HTML et son lecteur JavaScript.
4. Glisse le `.amxd` sur la piste adaptée, puis active **Visuel actif**. Pour la cible WebGL, vérifier dans les préférences de Live 12 que Max 9.2 ou plus récent est réellement sélectionné. Si le périphérique vient d’être remplacé pendant que Live était ouvert, redémarre Live avant de le tester.

L’export propose une résolution et une vitesse globale réglables. L’effet audio transmet le son de la piste et adapte son analyse en trois enveloppes, graves, médiums et aigus. Ajuste **Sensibilité audio** dans Live : les valeurs peuvent différer de l’analyse FFT du navigateur. L’effet MIDI transmet les événements de notes et ne reçoit pas d’audio. Les horloges reconnues dans la cible native repartent de leur état initial au chargement du périphérique.

## Compatibilité et limites

Une chaîne Hydra avec une sortie `.out()` et, si nécessaire, un feedback sur cette même sortie peut être convertie. La sélection des contrôleurs est limitée à seize paramètres automatisables. L’indicateur précise la raison d’un refus ; le convertisseur ne télécharge pas de périphérique partiel.

La cible native ne convertit pas les moteurs WebGL indépendants à plusieurs passes, comme **Blob translucide** ; elle prend en charge des horloges et formules reconnues pour **Feu et étincelles**, **Plis lumineux** et **Julia-curseurs**. La cible Live 12 embarque le moteur du preset et peut conserver ses buffers WebGL, ainsi que les images fixes déclarées. Elle refuse notamment l’accès caméra, vidéo, réseau et la lecture directe d’échantillons WebAudio. Le diagnostic d’export précise les restrictions applicables au preset choisi.

Les snapshots, le séquenceur, les associations MIDI et Ableton Link du laboratoire ne sont pas emportés dans le périphérique. Recrée les variations utiles avec les automatisations et affectations de Live. L’export depuis un Pack VJ hors ligne n’est pas proposé dans cette version.

Le preset **Gyroïde tranchée** exporté en WebGL a été essayé par l’utilisateur dans Live 12 : le rendu, les contrôleurs et le plein écran fonctionnent après redémarrage d’Ableton. Cette validation porte sur ce preset et cette configuration ; les autres exports peuvent demander des essais supplémentaires.


## Si un potard bloque le visuel

Un ancien lecteur pouvait signaler un remplacement du modèle de contrôleurs à chaque changement de valeur. Certains presets, dont Tourbillons fluides, nettoyaient alors leurs ressources WebGL et leur image se figeait.

La v0.39.96 sépare ces notifications et utilise un lecteur versionné. Après installation de la mise à jour WordPress, recharge le laboratoire avec **Ctrl + F5**, refais l’export et extrais-le dans un nouveau dossier. Vérifie la présence de **`player-0.39.96.js`**. Retire l’ancienne instance de Live et charge le nouveau `.amxd` ; conserve tous les fichiers du ZIP ensemble. Les anciens exports ne sont pas mis à jour par l’installation du plugin.

L’export refuse désormais un lecteur dont la version ne correspond pas. Le nouvel export de **Tourbillons fluides** a été testé par l’utilisateur dans Live : les potards fonctionnent sans bloquer le visuel. Les tests automatiques couvrent les notifications, le maintien de la boucle de rendu et le refus d’un lecteur périmé ; ils ne remplacent pas un essai GPU dans Live.
