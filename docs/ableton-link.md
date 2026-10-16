# Connexion Ableton Link

La passerelle est un programme local facultatif. Le site et son séquenceur à BPM interne fonctionnent sans elle.

## Sous Windows

1. Ouvre les [versions de Pilami Link Bridge](https://github.com/LostForgotten/pilami-link-bridge/releases).
2. Télécharge et décompresse la version portable Windows 64 bits, puis lance `Pilami-Link.exe`.
3. Dans Ableton Live, active **Link**. Pour suivre Play/Stop, active aussi **Start/Stop Sync**, nommé **Synchro de démarrage arrêt** selon la langue de Live.
4. Sur la page Pilami, clique sur **Connecter Link** et vérifie le BPM et le nombre de pairs.
5. Dans le séquenceur visuel, choisis les options de démarrage et d’arrêt avec Live selon ton usage.

L’aide **ⓘ Aide Link** est accessible dans la barre principale de l’application. La version portable évite l’installation d’une chaîne de compilation. Les instructions de compilation et les sources du bridge sont maintenues dans son dépôt dédié.

## Flux des données

Le bridge lit l’horloge du réseau Ableton Link puis expose un WebSocket local sur `ws://127.0.0.1:8765`. La page reçoit BPM, temps, phases musicales et état Play/Stop quand celui-ci est disponible. Cette intégration ne renvoie pas les commandes du séquenceur vers Live.

La copie du serveur conservée dans `tools/ableton-link-bridge/` accepte les pages HTTPS pilami.fr/www.pilami.fr et les pages locales localhost/127.0.0.1. Pour un autre site, ajoute son origine précisément dans le bridge ; ne remplace pas cette liste par une autorisation générale.

## Dépannage

- **Le BPM suit, mais pas Play/Stop :** vérifie Start/Stop Sync dans Live, le témoin LIVE PLAY/STOP et les options du séquenceur.
- **Aucune connexion :** vérifie que le bridge est lancé, qu’une seule instance utilise le port 8765 et que la page utilise une origine acceptée.
- **Animation saccadée en arrière-plan :** laisse la fenêtre de projection visible. Un onglet complètement suspendu ne garantit pas le rendu en temps réel.
- **Décalage en forte charge :** la précision dépend du navigateur, du WebSocket et de la charge graphique. Les déclenchements visuels ne sont pas précis à l’échantillon près.

Le dépôt compagnon est [LostForgotten/pilami-link-bridge](https://github.com/LostForgotten/pilami-link-bridge).
