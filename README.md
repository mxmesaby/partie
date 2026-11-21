# Parties ●

Application mobile de pétanque en français, construite avec React Native, Expo et TypeScript. Fonctionne sur Android et iPhone avec Expo Go. Version locale, sans compte ni serveur.

## Tester sur votre smartphone

1. Installez **Expo Go** depuis Google Play ou l’App Store (version compatible avec Expo SDK 58).
2. Sur votre ordinateur, installez Node.js 24 LTS et Git.
3. Ouvrez un terminal et lancez :

```sh
git clone https://github.com/mxmesaby/partie.git
cd partie
npm ci
npx expo start --go
```

4. Connectez le téléphone et l’ordinateur au **même réseau Wi-Fi**.
5. Android : ouvrez Expo Go et scannez le QR code du terminal. iPhone : scannez-le avec l’app Appareil photo puis ouvrez Expo Go.
6. Attendez le chargement. Le serveur doit rester ouvert sur l’ordinateur. Les modifications du code seront rechargées sur le téléphone.

Si le Wi-Fi bloque la connexion, utilisez `npx expo start --go --tunnel` (Internet nécessaire ; Expo peut proposer l’installation de son outil de tunnel). Un QR code d’un serveur cloud inaccessible ne suffit pas : la méthode ci-dessus utilise votre ordinateur.

Si Expo Go indique une incompatibilité SDK, mettez Expo Go à jour. Si SDK 58 n’est pas proposé par votre boutique, utilisez un client de développement compatible ou attendez sa disponibilité ; ne modifiez pas les versions de React Native isolément.

### Parcours de vérification sur téléphone

- Lancez une doublette avec quatre noms distincts et une adresse complète.
- Ajoutez 6 points, puis 6, puis 1 à la même équipe : résultat 13–0 et heure de fin ; aucune dette avant confirmation du choix d’enjeu.
- À la clôture, choisissez « Enjeu sur cette partie » ; faites prendre les dettes par un perdant, puis honorez-en une dans le carnet.
- Lancez la revanche et faites gagner l’autre équipe : le bouton La Belle apparaît.
- Fermez et relancez l’application : parties et dettes restent présentes.
- En tête-à-tête, les boutons 4 à 6 sont visibles mais désactivés.

## Fonctionnalités

- Équipes de 1, 2 ou 3 joueurs, parité et noms uniques ; contrôle des joueurs occupés dans les parties locales.
- Lieu obligatoire, horodatage automatique, saisie de 1 à 6 points selon le format et victoire automatique dès 13 (score exact conservé).
- Arrêt anticipé avec motif, forfait explicite ; égalité bloquée hors forfait pour garantir un gagnant unique.
- Dettes individuelles, échéance, règlement horodaté et prise en charge exclusive avant tout règlement. Une dette immédiate reste ouverte jusqu’à confirmation du règlement.
- Revanche, Belle à 1–1, vainqueur du duel, scores cumulés et bilan des dettes.
- Historique, détails des mènes et carnet filtrable par joueur.
- Sauvegarde locale AsyncStorage ; erreur de lecture bloquante pour éviter l’écrasement, erreur d’écriture signalée avec possibilité de réessayer.

## Développement

```sh
npm ci
npm run typecheck
npm test
npx expo export --platform all
npm start
```

`npm run web` permet aussi un essai navigateur. Les tests couvrent les règles métier ; la compilation ne remplace pas les essais sur appareils physiques.

- `App.tsx` : écrans et navigation.
- `src/domain.ts` : parties, scores et exports métier.
- `src/domain/` : types partagés, enjeux et tournois.
- `src/components/StakePanel.tsx` : choix des enjeux et règlement.
- `src/storage/local.ts` : persistance locale et suppression des anciennes données.
- `tests/domain.test.ts` : tests métier.
- `docs/specification-partie.md` : spécifications fournies.

## Limites de cette première version

Aucun essai physique n’a été réalisé dans l’environnement cloud. Pas de synchronisation multi-appareil, d’authentification, de notifications, de géolocalisation automatique ou de favoris des lieux. La non-simultanéité est limitée aux données de cet appareil. Les joueurs sont identifiés par leur nom normalisé : utilisez des noms distincts pour les homonymes. Les couleurs des équipes sont sélectionnables dans une palette. Les données ne sont pas chiffrées par l’application et sont perdues en désinstallant celle-ci ; pas encore d’export ni de sauvegarde distante. L’horloge utilisée est celle du téléphone. Le règlement d’une dette doit être confirmé manuellement.

La documentation métier présente à la fois une localisation manuelle et automatique ; cette version implémente la saisie manuelle. Elle impose un gagnant pour toute partie terminée sans définir le cas d’égalité lors d’un arrêt : cette version exige une mène décisive ou un forfait. Cette décision pourra être adaptée.

Pour distribuer une application installable indépendante d’Expo Go, prévoir ensuite une configuration EAS Build et les comptes développeur requis par les boutiques.

## Révision des enjeux et tournois (v2)

À la première ouverture de cette version, les données de `parties.v1` sont supprimées, conformément à la demande. Les nouvelles données `parties.v2` sont conservées entre les ouvertures ; cette suppression ne se répète pas sur les données v2. Aucune donnée d’un téléphone distant n’est supprimée avant qu’il charge la mise à jour.

À la fin de la première partie libre avec enjeu, confirmez un choix définitif : enjeu sur cette partie, seulement si les mêmes gagnants gagnent la revanche, ou enjeu sur la Belle. Avant le choix et tant que la condition n’est pas acquise, aucune dette n’est créée. Un enjeu n’est acquis qu’une fois pour le duel. Le bouton « Terminer le duel sans autre manche » classe un enjeu encore en attente comme non dû.

Conventions de la spécification : à 1–1, un enjeu sur la revanche devient non dû ; un enjeu sur la Belle devient non dû si le duel finit à 2–0. Elles sont affichées dans l’application. Leur confirmation métier reste à prévoir.

L’onglet Tournois permet de créer un tournoi classique ou « Les jeudis à la mêlée », avec enjeu optionnel et échéance, puis d’ajouter manuellement ses parties. Les paramètres d’enjeu sont conservés pour chaque partie. En classique, les perdants paient. Aux Jeudis, si les perdants atteignent 7 points, les gagnants paient ; de 0 à 6, les perdants paient. La reprise exclusive est proposée à l’équipe redevable. Sans enjeu, aucune dette n’est créée.

Les arrêts anticipés des Jeudis avec enjeu sont bloqués en attendant la définition de leur règle spécifique. Les autres parties gardent la clôture anticipée. Le tirage automatique, les classements et le nombre de tours ne sont pas spécifiés et ne sont pas implémentés.

### Recette supplémentaire

- Choisir l’enjeu sur la Belle ; vérifier zéro dette avant celle-ci, puis un seul lot après sa clôture.
- Créer un tournoi sans enjeu ; terminer une partie et vérifier l’absence de dette.
- Créer un tournoi Jeudis avec enjeu ; vérifier 13–6 (perdants redevables) et 13–7 (gagnants redevables).
- Faire prendre en charge les dettes par un gagnant redevable, puis les honorer.
- Relancer l’application et vérifier que les données v2 restent présentes.
