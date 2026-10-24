# Bol de verre, billes et mélangeur

Le [preset à importer](../examples/Bol-de-verre-billes-audio.hydra.txt), version 1.13, est une scène originale WebGL 2 associée à Hydra. Il contient son moteur, sans téléchargement de bibliothèque externe. Les [sources séparées](../sources/glass-bowl/README.md) permettent de modifier la simulation et de reconstruire le preset.

Importe le fichier avec **Ctrl + I**, puis lance **Hydra / Update**. Le départ se fait à 640 × 360 avec 54 billes. Le sélecteur de résolution de l’application permet ensuite d’adapter la finesse au matériel. Exemple public : [les billes sur pilami.fr](https://pilami.fr/visuels/billes/).

## Mouvement, matière et cadrage

- `Nombre_Billes` ajoute ou retire des billes. Le moteur n’impose pas de plafond fixe au nombre ; le maximum du contrôleur est modifiable. Le coût dépend du matériel et du nombre de contacts.
- `Variation_Taille` va de tailles identiques à une dispersion allant de presque zéro à deux fois la référence. La variation reste stable pour chaque bille ; `Graine` renouvelle le tirage.
- `Melange`, `Sensibilite` et `Agitation_Verticale` relient le brassage au son. `Mouvement_Autonome` et `Trajet_Aleatoire` permettent aussi un mouvement sans entrée audio.
- Le métal, la rugosité, la transparence, le grain et les reflets sont réglables séparément pour les billes et le mélangeur. Une transparence à zéro rend l’objet opaque.
- Les repères peints suivent la rotation des objets. Le bol est ouvert : une forte agitation peut éjecter des billes sur la table.
- `Zoom`, `Angle_Camera` et `Elevation_Camera` règlent la vue. `Cadrage_X` et `Cadrage_Y`, réunis dans le pad **Cadrage de la caméra**, déplacent la caméra et sa cible ensemble. Zéro sur les deux axes recentre la vue.

Les sphères utilisent des contacts avec rebond et frottement ; la grosse bille est un mélangeur cinématique piloté. Le verre et les reflets sont stylisés : le moteur ne calcule pas de caustiques physiques.

## Sons et lueurs des collisions

Active `Son_Collisions` pour entendre les nouveaux impacts. `Mode_Clic` choisit un sinus (0) ou un clic de bruit filtré (1). Fréquence, volume, durée, variation de hauteur, seuil, espacement, dynamique, stéréo et polyphonie sont réglables. Les contacts persistants au repos ne redéclenchent pas un son à chaque image. Le volume est indépendant de Strudel.

`Lueur_Collisions` allume un point à l’endroit du contact, qui reste solidaire de la rotation de la bille. Intensité, étendue, diffusion interne, durée, montée, extinction et lissage sont réglables. La lueur reste visible avec `Lumiere` à zéro, même sans son de collision.

Par défaut, chaque bille émet sa propre couleur, mélangeur compris. `Couleur_Lueur_Perso` permet de choisir une teinte commune avec `Teinte_Lueur` et `Saturation_Lueur`.

`Diffusion_Voisines` éclaire les billes proches à partir des objets réellement allumés. Intensité, portée et qualité règlent cet éclairage local. Il ne s’agit pas d’une illumination globale avec rebonds multiples ; les lumières directes ne calculent pas d’ombre entre chaque paire de billes.

`Occlusion_Ambiante` assombrit les contacts et creux avec des voisins sphériques et la table. `Intensite_AO`, `Portee_AO` et `Qualite_AO` règlent cet effet approché, sans éteindre l’émission propre des collisions.

## Snapshots et versions

Les snapshots mémorisent les contrôleurs, dont le cadrage. Ils ne sauvegardent pas les positions, vitesses et rotations exactes de la simulation.

Pour remplacer une ancienne version du code, sélectionne le preset existant, clique sur **Mettre à jour le code**, choisis le nouveau fichier puis **Mettre à jour le preset**. Les réglages compatibles et snapshots sont transférés par nom de contrôleur. Les nouveaux contrôleurs reçoivent leur valeur par défaut ; évite de renommer les contrôleurs existants si tu veux conserver cette correspondance.

Pour une page publique utilisant ces réglages, consulte [l’export web autonome](export-web.md).

## Alléger le rendu

Commence par réduire la résolution ou le nombre de billes, puis les qualités de diffusion et d’occlusion. Zéro désactive ces effets. La précision physique et le nombre de contacts influencent aussi le calcul. Les valeurs extrêmes ou les plages personnalisées restent à tester sur la machine de représentation.
