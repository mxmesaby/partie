# Spécifications Fonctionnelles & Techniques — Application `parties`

> Révision du 21 novembre 2026 — enjeux différés des parties libres et règle des « Jeudis à la mêlée ». Document de spécification ; les fonctionnalités décrites ne sont pas toutes implémentées.

## 1. Présentation Générale

L'application **`parties`** est une solution logicielle dédiée à la gestion, au suivi du score, à la traçabilité et aux traditions conviviales du jeu de **pétanque**.
Elle permet d'organiser des **parties libres**, des **tournois** et des séries de duels (Revanche, La Belle) entre deux équipes, tout en gérant la géolocalisation, les engagements (dettes/gages individuels ou d'équipe), la non-simultanéité des joueurs et l'historique complet des résultats.

---

## 2. Périmètre Fonctionnel

### 2.1 Gestion des Équipes et Joueurs
- **Création et composition des équipes** : Configuration des deux équipes adverses (nom d'équipe, couleur d'identification).
- **Règle stricte de parité des effectifs** : Lors d'une confrontation, les deux équipes doivent obligatoirement être composées du **même nombre de joueurs** ($N_1 = N_2$).
- **Contrainte d'unicité et de non-simultanéité** :
  - **Un joueur ne peut pas participer à 2 parties en parallèle.**
  - Si un joueur est déjà engagé dans une partie au statut `EN_COURS`, l'application bloque son inscription ou le démarrage d'une nouvelle partie tant que sa partie précédente n'est pas clôturée.

### 2.2 Formats de Jeu Autorisés & Nombre de Boules en Main
L'application prend en charge les trois formats traditionnels et officiels de la pétanque :
1. **Tête-à-tête (1 contre 1)** : 1 joueur par équipe, 3 boules par joueur $\rightarrow$ **3 boules au total par équipe**.
2. **Doublette (2 contre 2)** : 2 joueurs par équipe, 3 boules par joueur $\rightarrow$ **6 boules au total par équipe**.
3. **Triplette (3 contre 3)** : 3 joueurs par équipe, 2 boules par joueur $\rightarrow$ **6 boules au total par équipe**.

---

### 2.3 Localisation et Temporalité Obligatoires
Chaque partie est rigoureusement contextualisée dans le temps et dans l'espace. Les champs suivants sont **strictement obligatoires** à l'initialisation :
- **Temporalité** :
  - **Date** de la partie.
  - **Heure de début** (horodatage précis du coup d'envoi).
  - **Heure de fin** (enregistrée automatiquement lors de la clôture nominale ou anticipée).
- **Lieu de la partie** :
  - **Adresse** (numéro et voie / nom du boulodrome ou terrain).
  - **Code postal**.
  - **Ville**.
  - **Pays**.

---

### 2.4 Enjeu, Dettes et Gages de Convivialité (« Le Carnet de Dettes »)

Fidèle à la tradition de la pétanque, la partie permet de formaliser un enjeu amical (ex: un verre à boire, une tournée, un café, etc.) qui donne lieu à une ou plusieurs **dettes uniquement lorsque la condition de déclenchement convenue est satisfaite**. L'enjeu décrit ce qui est promis ; la dette désigne une obligation effectivement acquise. Sans enjeu, aucune dette n'est créée.

#### A. Nature Individuelle de la Dette
- **Principe général** : La dette est **individuelle**, quel que soit le format de jeu (Tête-à-tête, Doublette ou Triplette).
- Chaque dette relie précisément deux personnes :
  - **Le Créancier** : La personne (joueur) à qui la dette est due (généralement un membre de l'équipe gagnante).
  - **Le Débiteur** : La personne (joueur) qui doit la dette (généralement un membre de l'équipe perdante).
- *Exemple en Triplette (3 vs 3)* : Lorsque l'enjeu devient dû, 3 dettes individuelles sont créées, une par joueur de l'équipe redevable envers un joueur de l'équipe bénéficiaire. En partie libre, les perdants sont redevables ; la règle spéciale des Jeudis à la mêlée peut inverser ces rôles.

#### B. Prise en Charge Exclusive par un Coéquipier (« Régaler l'équipe »)
- **Règle de solidarité** : Un joueur de l'équipe peut décider volontairement de **prendre la dette pour lui tout seul** (assumer l'intégralité des dettes dues par son équipe).
- **Enregistrement dans l'application** :
  - L'application consigne formellement cette prise en charge : ce joueur devient le **débiteur unique** de toutes les dettes générées par la partie.
  - L'application garde en mémoire l'historique de cette décision avec un indicateur dédié (`est_reprise_exclusive: true`), mentionnant que ce joueur a régalé et déchargé ses coéquipiers.

#### C. Statut et Suivi de la Dette : « Ouverte » vs « Fermée »
L'application permet de savoir à tout moment si une dette a été honorée :
- **Dette OUVERTE** : La dette a été contractée mais n'a pas encore été honorée/payée.
- **Dette FERMÉE** : La dette a été honorée par le débiteur envers le créancier.
- **Modalité de consommation** :
  - **À consommer tout de suite** : Peut être clôturée immédiatement à la fin de la partie (passage immédiat à `FERMÉE`).
  - **À consommer plus tard** : Reste au statut `OUVERTE` dans le carnet de dettes des deux joueurs jusqu'à son règlement ultérieur dans l'application.

#### D. Données Obligatoires d'une Dette
Chaque dette enregistre de manière immuable :
- La **date d'enregistrement** de la dette.
- L'identité précise du **Créancier** (Joueur).
- L'identité précise du **Débiteur** (Joueur).
- La nature de la dette (ex: *« Verre à boire »*).
- L'échéance convenue (*Tout de suite* / *Plus tard*).
- Le statut courant : **`OUVERTE`** ou **`FERMÉE`**.
- La **date et heure de fermeture / acquittement** (dès qu'elle est honorée).
- La mention de prise en charge solitaire le cas échéant.
- L'identifiant de l'enjeu d'origine, la règle appliquée et la partie ou manche qui l'a déclenché.

---

#### E. Parties libres : choix du déclenchement à la fin de la première partie

À la clôture de la première partie, avant toute création ou tout règlement des dettes, les joueurs peuvent conserver l'enjeu de cette partie ou décider de le reporter :

| Choix | Condition de déclenchement | Création des dettes |
|---|---|---|
| Première partie | Résultat de la première partie confirmé | Les perdants doivent l'enjeu aux gagnants de cette partie. |
| Revanche | L'équipe gagnante de la première partie gagne aussi la revanche | Les perdants doivent l'enjeu à cette équipe après sa deuxième victoire. |
| Belle | Une Belle est jouée après une égalité à 1–1 | Les perdants de la Belle doivent l'enjeu aux gagnants de la Belle. |

- Le choix est enregistré et horodaté à la fin de la première partie, avant le lancement de la revanche. Le résultat sportif reste immédiatement enregistré.
- Un enjeu différé reste **EN_ATTENTE** : aucune dette ouverte ou fermée n'est créée au titre de la première partie ou d'une manche intermédiaire.
- L'enjeu est unique pour la séquence concernée : sa validation génère un seul lot de dettes nominatives, sans multiplication par le nombre de manches. Un second traitement du même résultat ne doit pas recréer de dettes.
- La condition d'acquisition (première partie, revanche ou Belle) est indépendante de l'échéance de consommation (tout de suite ou plus tard), qui s'applique seulement après acquisition.
- Une condition non réalisée ne déclenche aucune dette. Si la séquence se termine sans satisfaire cette condition, l'enjeu devient **NON_DU** ; si elle est seulement interrompue puis reprise, il reste **EN_ATTENTE**.
- Les modalités précises suivantes sont des **conventions proposées à valider** : en mode Revanche, une égalité à 1–1 ne reporte pas automatiquement l'enjeu sur la Belle ; en mode Belle, un résultat 2–0 sans Belle ne déclenche pas l'enjeu. Ces cas ne doivent pas être confondus avec un enjeu général au vainqueur de la série.
- Une fois le choix confirmé, il ne peut pas réaffecter des dettes déjà créées ou honorées. La décision et son historique sont conservés.

#### F. Tournois : enjeux optionnels

- Un tournoi peut être organisé **avec ou sans enjeu**. Le choix est explicite dans sa configuration.
- Sans enjeu : aucune dette n'est générée, quel que soit le score. Cela ne supprime ni ne modifie les anciennes dettes.
- Avec enjeu : sa nature, son échéance et la règle d'attribution sont affichées avant le début des parties concernées et conservées avec leurs résultats.
- Les conditions Revanche et Belle des parties libres ne s'appliquent pas automatiquement aux parties d'un tournoi.
- Les autres règles d'organisation des tournois (tirage, classement, nombre de tours) ne sont pas définies par cette révision.

#### G. Tournoi « Les jeudis à la mêlée » : seuil de 7 points

Lorsqu'un enjeu est activé, pour chaque partie terminée, l'application examine **le score final de l'équipe perdante** :

| Score final des perdants | Équipe qui paie l'enjeu | Équipe bénéficiaire |
|---|---|---|
| De 0 à 6 points inclus | Les perdants | Les gagnants |
| 7 points ou plus | Les gagnants | Les perdants |

- Le seuil s'applique au score de cette partie, pas au cumul des points du tournoi. Exactement **7 points** fait payer les gagnants ; exactement **6 points** fait payer les perdants.
- Exemples : **13–6**, les perdants paient ; **13–7**, les gagnants paient ; **13–12**, les gagnants paient.
- Le résultat sportif n'est pas inversé : le gagnant reste gagnant même lorsqu'il doit l'enjeu.
- Les dettes restent nominatives : un joueur de l'équipe redevable doit à un joueur de l'équipe bénéficiaire. La prise en charge exclusive est proposée aux joueurs de **l'équipe redevable**, même s'il s'agit des gagnants.
- Sans enjeu activé, aucun de ces scores ne génère de dette.
- Un résultat doit désigner un gagnant et un perdant avant tout calcul de dette. Le traitement spécifique des forfaits, annulations et arrêts anticipés dans ce type de tournoi reste à préciser ; aucune règle spéciale ne doit être inventée silencieusement.

---

### 2.5 Déroulement, Points par Mène et Clôture de Partie

#### A. Décompte des Points par Mène (Jusqu'à 6 points)
- À chaque mène jouée, une seule équipe marque des points (celle dont la boule la plus proche est plus proche du bouchon que la meilleure boule adverse).
- **Capacité de points par mène** : Une équipe marque autant de points qu'elle a de boules mieux placées que la meilleure boule adverse.
  - En **Tête-à-tête (1 vs 1)** : L'équipe a 3 boules en main $\rightarrow$ gain possible de **1 à 3 points**.
  - En **Doublette (2 vs 2)** : L'équipe a 6 boules en main (2 joueurs $\times$ 3 boules) $\rightarrow$ gain possible de **1 à 6 points** si toutes les boules en main comptent.
  - En **Triplette (3 vs 3)** : L'équipe a 6 boules en main (3 joueurs $\times$ 2 boules) $\rightarrow$ gain possible de **1 à 6 points** si toutes les boules en main comptent.
- **Exigence d'interface absolue** : L'écran de saisie du score d'une mène **ne doit en aucun cas être restreint à 4 points**. Il doit proposer des sélecteurs allant de **1 à 6 points** (de 1 à 6 boutons de points directement accessibles).

#### B. Règle Nominale de Victoire (13 points)
- Une partie classique se dispute en **13 points gagnants**.
- Dès qu'une équipe atteint ou dépasse 13 points à l'issue d'une mène, la partie se termine automatiquement.
- L'application désigne formellement le **Gagnant** et le **Perdant**.

#### C. Clôture Anticipée (< 13 points)
- Une partie peut être arrêtée avant que l'une des équipes n'atteigne 13 points.
- Motifs pris en compte : Abandon/Forfait, Limite de temps, Météo/Obscurité, Accord mutuel.
- L'état exact du score est sauvegardé avec l'heure exacte de clôture. Le gagnant est désigné sur la base du score au moment de l'arrêt (ou par forfait).

#### D. Données Mémorisées à la Fin de la Partie
À la fin de la partie, l'application fige et historise obligatoirement :
- L'équipe gagnante et ses joueurs.
- L'équipe perdante et ses joueurs.
- Le score final exact de chaque équipe.
- La date, l'heure de début et l'heure exacte de fin.
- Le lieu complet (adresse, code postal, ville, pays).
- Le choix de déclenchement et le statut de l’enjeu (en attente, dû ou non dû), la règle appliquée et les dettes effectivement créées (créancier, débiteur, statut ouverte/fermée, date).
- L'appartenance éventuelle à une série de duels (Revanche / La Belle).

---

### 2.6 Enchaînement de Parties : « Revanche » et « La Belle »

L'application gère nativement le cycle traditionnel de duel en série :
1. **Proposition de Revanche Immédiate** :
   - Dès la clôture d'une partie (Partie 1), l'application propose immédiatement au perdant de lancer une **Revanche** (Partie 2).
   - Les compositions d'équipes et le lieu sont conservés par défaut pour un lancement instantané.
2. **« La Belle » (Manche décisive)** :
   - Si l'équipe qui a perdu la première partie remporte la revanche, le score de la série est de **1 manche partout (1 - 1)**.
   - L'application propose alors de lancer une 3ème manche décisive appelée **« La Belle »**.
   - Cette 3ème partie détermine le **Vainqueur Final** de la série.
3. **Mémorisation de l'Enchaînement** :
   - L'application regroupe ces parties sous une même entité logique de **Série / Duel**.
   - Elle mémorise la filiation : `Partie Initiale` ➔ `Revanche` ➔ `La Belle`.
   - L'historique permet de consulter la série dans son ensemble (score global des manches, cumul des points, cumul et bilan des dettes).
   - L'enjeu différé choisi à la fin de la première partie est conservé et évalué à la manche prévue, sans générer une dette pour chaque manche.

---

## 3. Matrice des Règles Métier (Business Rules)

| Code | Règle Métier | Description | Priorité |
|---|---|---|---|
| **BR-01** | **Parité des effectifs** | L'effectif de l'Équipe 1 doit être strictement égal à celui de l'Équipe 2 ($N_1 = N_2$). | Bloquante |
| **BR-02** | **Formats stricts** | Les seules valeurs autorisées pour $N$ sont **1 (Tête-à-tête)**, **2 (Doublette)** ou **3 (Triplette)**. | Bloquante |
| **BR-03** | **Non-simultanéité joueur** | Un joueur participant à une partie avec statut `EN_COURS` ne peut pas être ajouté à une autre partie simultanément. | Bloquante |
| **BR-04** | **Complétude temporelle et géographique** | Date, Heure de début, Adresse, Code Postal, Ville et Pays sont strictement obligatoires pour démarrer une partie. | Bloquante |
| **BR-05** | **Score maximal par mène (jusqu'à 6 points)** | Une équipe peut marquer de **1 à 6 points** par mène pour l'ensemble des boules en main au départ (jusqu'à 3 en 1v1, jusqu'à 6 en 2v2 et 3v3). L'interface doit obligatoirement proposer les options de 1 à 6 points. | Bloquante |
| **BR-06** | **Victoire nominale à 13 pts** | Dès qu'une équipe atteint **13 points**, la partie se clôture immédiatement avec statut `TERMINEE_13_PTS`. | Automatique |
| **BR-07** | **Arrêt prématuré** | Une partie peut être stoppée à un score `< 13`. L'heure de fin, le score arrêté et le motif sont archivés. | Majeure |
| **BR-08** | **Désignation Gagnant / Perdant** | Toute partie terminée identifie sans ambiguïté 1 Équipe Gagnante et 1 Équipe Perdante (avec archivage de l'heure de fin). | Obligatoire |
| **BR-09** | **Dette nominative individuelle** | La dette est nominative et individuelle entre un **Débiteur** (joueur) et un **Créancier** (joueur), enregistrée avec sa date. | Obligatoire |
| **BR-10** | **Statut Ouverte / Fermée** | Une dette est créée avec le statut **`OUVERTE`**. L'application permet de la marquer comme honorée, passant son statut à **`FERMÉE`** avec horodatage de fermeture. | Obligatoire |
| **BR-11** | **Prise en charge exclusive de dette** | Un joueur de l'équipe redevable (perdante ou gagnante selon la règle) peut assumer seul la totalité des dettes de son équipe. L'application consigne explicitement ce fait. | Majeure |
| **BR-12** | **Enchaînement Revanche** | À la fin d'une partie, une Revanche peut être générée immédiatement en liant la nouvelle partie à la précédente. | Majeure |
| **BR-13** | **Déclenchement de La Belle** | Si le score de la série est de 1 manche partout après la Revanche, une 3ème partie « La Belle » est autorisée pour départager les équipes. | Majeure |


| **BR-14** | **Choix différé en partie libre** | À la fin de la première partie, choix horodaté du déclenchement : première partie, revanche gagnée aussi par le premier gagnant ou Belle. | Majeure |
| **BR-15** | **Pas de dette avant acquisition** | Un enjeu en attente ne crée aucune dette ; un enjeu acquis ne génère qu'un lot de dettes, même si le résultat est retraité. | Bloquante |
| **BR-16** | **Tournoi sans enjeu** | L'enjeu est optionnel ; son absence interdit toute génération de dette liée au tournoi. | Bloquante |
| **BR-17** | **Jeudis : score perdant ≤ 6** | Avec enjeu, les perdants paient lorsque leur score final est de 0 à 6 inclus. | Bloquante |
| **BR-18** | **Jeudis : score perdant ≥ 7** | Avec enjeu, les gagnants paient lorsque le score final des perdants atteint 7 points ou plus. | Bloquante |
| **BR-19** | **Résultat et dette distincts** | Le payeur peut être gagnant ; le résultat sportif reste inchangé. | Obligatoire |

---

## 4. Modèle Conceptuel de Données (MCD)

```mermaid
erDiagram
    TOURNOI o|--o{ PARTIE : "contient"
    ENJEU o|--o{ DETTE : "déclenche après acquisition"
    SERIE_PARTIES o|--o{ ENJEU : "porte"
    PARTIE o|--o{ ENJEU : "contexte initial"
    TOURNOI o|--o{ ENJEU : "configure"
    LIEU ||--o{ PARTIE : "se déroule à"
    SERIE_PARTIES ||--o{ PARTIE : "regroupe"
    JOUEUR ||--o{ COMPOSITION_EQUIPE : participe
    EQUIPE ||--o{ COMPOSITION_EQUIPE : compose
    EQUIPE ||--o{ PARTIE : "joue en Equipe 1"
    EQUIPE ||--o{ PARTIE : "joue en Equipe 2"
    PARTIE ||--o{ MENE : comptabilise
    PARTIE ||--o{ DETTE : "génère"
    JOUEUR ||--o{ DETTE : "est créancier de"
    JOUEUR ||--o{ DETTE : "est débiteur de"

    TOURNOI {
        string id PK
        string type "LES_JEUDIS_A_LA_MELEE | AUTRE"
        boolean enjeu_active
        string regle_enjeu "SEUIL_PERDANT_7 | AUTRE"
    }

    ENJEU {
        string id PK
        string partie_initiale_id FK
        string serie_id FK "Optionnel"
        string tournoi_id FK "Optionnel"
        string description
        string declenchement "PREMIERE_PARTIE | REVANCHE | BELLE | PARTIE_TOURNOI"
        string echeance "IMMEDIATE | PLUS_TARD"
        string statut "EN_ATTENTE | DU | NON_DU"
        datetime date_choix
        string partie_declencheuse_id FK "Renseigné si acquis"
        string equipe_redevable_id FK "Renseigné si acquis"
        string equipe_beneficiaire_id FK "Renseigné si acquis"
        string regle_appliquee
    }

    LIEU {
        string id PK
        string nom_lieu "Optionnel (ex: Boulodrome du Parc)"
        string adresse
        string code_postal
        string ville
        string pays
    }

    SERIE_PARTIES {
        string id PK
        string nom_serie
        string statut "EN_COURS | CLOTUREE"
        string vainqueur_final_id FK
        datetime date_creation
    }

    JOUEUR {
        string id PK
        string pseudo
        string nom
        string prenom
        boolean est_en_partie
    }

    EQUIPE {
        string id PK
        string nom
        datetime date_creation
    }

    PARTIE {
        string id PK
        string serie_id FK "Optionnel (si intégrée à une série)"
        string tournoi_id FK "Optionnel"
        string type_manche "INITIALE | REVANCHE | BELLE | INDEPENDANTE"
        string format "1V1 | 2V2 | 3V3"
        string lieu_id FK
        datetime date_partie
        time heure_debut
        datetime heure_fin
        string equipe1_id FK
        string equipe2_id FK
        int score_equipe1
        int score_equipe2
        string gagnant_id FK
        string perdant_id FK
        string statut "EN_COURS | TERMINEE | TERMINEE_ANTICIPEE | ANNULEE"
        string motif_fin "SCORE_13 | ABANDON | LIMITE_TEMPS | METEO | ACCORD_MUTUEL"
        string partie_precedente_id FK "Lien vers la partie dont elle est la revanche"
    }

    DETTE {
        string id PK
        string partie_id FK "Partie déclencheuse"
        string enjeu_id FK
        string creancier_id FK "Joueur qui bénéficie de la dette"
        string debiteur_id FK "Joueur qui doit la dette"
        string description "ex: Verre à boire, Tournée, Café"
        string echeance "IMMEDIATE | PLUS_TARD"
        string statut "OUVERTE | FERMEE"
        datetime date_enregistrement
        datetime date_fermeture "Horodatage quand la dette a été honorée"
        boolean est_reprise_exclusive "Indique si un joueur a payé pour toute son équipe"
        string debiteur_initial_id FK "Joueur initial si substitution solidaire"
    }

    MENE {
        string id PK
        string partie_id FK
        int numero_mene
        int points_equipe1
        int points_equipe2
        string equipe_gagnante_mene
    }
```

---

## 5. Parcours Utilisateur & Expérience (UX)

### Écran 1 : Initialisation de la Partie Libre
1. **Localisation obligatoire** :
   - Saisie ou géolocalisation automatique : Adresse, Code postal, Ville, Pays (avec mémoire des lieux favoris).
2. **Format & Équipes** :
   - Sélection : Tête-à-tête (1v1 - 3 boules/équipe), Doublette (2v2 - 6 boules/équipe) ou Triplette (3v3 - 6 boules/équipe).
   - Sélection des joueurs avec **contrôle d'indisponibilité** (alerte bloquante si un joueur est déjà dans une partie active).
3. **Paramétrage de l'Enjeu (La Dette)** :
   - Choix : *Verre à boire*, *Tournée*, *Gage libre*, ou *Sans enjeu*.
   - Échéance : *Tout de suite* ou *Plus tard*.
4. **Action** : Horodatage automatique de l'heure de début et clic sur **« Lancer la partie »**.

### Écran 2 : Tableau de Score en Temps Réel
- Affichage du format, du lieu et de l'enjeu fixé.
- Scoreboard dynamique mène par mène.
- **Saisie des points de la mène** :
  - Sélection de l'équipe gagnante de la mène (Équipe A ou Équipe B).
  - **Sélecteur de points de 1 à 6** : Boutons tactiles `[ 1 ]` `[ 2 ]` `[ 3 ]` `[ 4 ]` `[ 5 ]` `[ 6 ]` permettant d'enregistrer la totalité des boules ayant marqué (notamment les 6 boules en main en Doublette et Triplette).
- Protection d'intégrité : Joueurs engagés marqués comme indisponibles pour d'autres parties.
- Bouton de clôture anticipée avec saisie de motif en cas d'arrêt avant 13 points.

### Écran 3 : Clôture, Proclamation & Répartition des Dettes
- **Fin de la première partie libre** : afficher le choix « Enjeu sur cette partie », « Seulement si les gagnants gagnent aussi la revanche », « Enjeu sur la Belle ». Confirmer ce choix avant de générer les dettes.
- **Enjeu différé** : afficher la condition et « En attente » ; ne proposer ni règlement ni reprise exclusive tant qu'aucune dette n'est acquise.
- **Tournoi Les jeudis à la mêlée** : afficher le score des perdants et l'explication « 7 points ou plus : les gagnants paient » ou « 0 à 6 points : les perdants paient », uniquement si un enjeu est activé.
- Horodatage immédiat de l'heure de fin.
- Proclamation officielle du **Gagnant** et du **Perdant** avec le score final.
- **Gestion des Dettes de la partie** :
  - Liste nominative des dettes effectivement acquises : chaque joueur redevable doit à un joueur bénéficiaire selon la règle appliquée.
  - Option solidaire d'équipe : Case à cocher **« [Nom du joueur] prend toute la dette pour l'équipe »**.
    - *Si activée* : Toutes les dettes sont assignées à ce joueur comme unique débiteur, avec mention spéciale dans l'application.
  - Action immédiate :
    - Bouton **« Marquer comme honorée maintenant (Fermée) »** si consommée sur-le-champ.
    - Sinon, enregistrement avec le statut **`OUVERTE`** pour règlement futur.
- **Bloc Revanche** :
  - Bouton : **« Proposer la revanche au perdant »** (Initialisation de la Manche 2 en conservant les équipes et le lieu).

### Écran 4 : Gestion de Série (Revanche & La Belle)
- Si l'équipe battue en Manche 1 gagne la Revanche :
  - L'écran affiche l'égalité : **1 manche à 1**.
  - L'application propose automatiquement le bouton : **« Lancer La Belle (Manche Décisive) »**.
- Afficher à chaque manche le choix d’enjeu enregistré, son statut et les éventuelles dettes déclenchées, sans doublon.
- Clôture de La Belle :
  - Proclamation du **Vainqueur Final de la Série**.
  - Historique complet des 3 manches consécutives avec leurs scores, durées et cumul des dettes (ouvertes et fermées).

### Écran 5 : Espace « Carnet de Dettes » (Consultation & Règlement)
- Accessible depuis le menu principal ou le profil joueur :
  - **Onglet « Dettes à payer » (Débiteur)** : Liste des dettes ouvertes dues par le joueur (vers qui, quelle partie, quelle date).
  - **Onglet « Dettes à recevoir » (Créancier)** : Liste des verres / gages dus au joueur.
  - **Historique « Dettes honorées » (Fermées)** : Archive avec date à laquelle chaque dette a été fermée.
  - Bouton d'action rapide : **« Marquer comme honorée »** (fait passer la dette de `OUVERTE` à `FERMÉE` avec horodatage).

---

### Écran 6 : Paramétrage des enjeux du tournoi
- Interrupteur explicite « Avec enjeu / Sans enjeu ».
- Si activé : nature, échéance et règle affichées avant le lancement.
- Pour « Les jeudis à la mêlée » : rappel permanent du seuil 7 points et de l'équipe redevable.

## 6. Synthèse des Données Mémorisées par l'Application

L'application conserve en base persistante pour chaque partie :
- ✅ **Date et heures précises** (Début et Fin horodatés).
- ✅ **Lieu complet** (Adresse, Code Postal, Ville, Pays).
- ✅ **Format et joueurs** (avec contrôle strict d'absence de parties simultanées).
- ✅ **Points par mène complets** : Saisie libre de 1 à 6 points par mène.
- ✅ **Résultat certifié** : Identité du Gagnant, identité du Perdant, score final.
- ✅ **Dettes nominatives complètes** :
  - Date d'enregistrement et date de fermeture.
  - Débiteur précis et Créancier précis (joueurs individuels).
  - Statut : **`OUVERTE`** ou **`FERMÉE`** (savoir si elle a été honorée).
  - Traçabilité de la **prise en charge pour soi tout seul** par un coéquipier.
- ✅ **Lien de série** : Filiation Revanche / La Belle avec désignation du vainqueur final de la confrontation.

- **Enjeu et contexte** : activation ou absence d'enjeu, condition choisie, date du choix, statut d'acquisition, lien au tournoi ou à la série et règle appliquée.
- **Traçabilité du seuil** : score final des perdants et identité de l'équipe redevable distincte du résultat sportif.

## 7. Critères de recette de la révision

| Situation | Résultat attendu |
|---|---|
| Première partie terminée, choix non confirmé | Résultat sportif conservé ; aucune dette à régler avant le choix. |
| Enjeu sur la revanche ; même équipe gagne les deux manches | Un seul lot de dettes après la revanche. |
| Enjeu sur la Belle ; série à 1–1 | Aucune dette avant la Belle ; un seul lot à son résultat. |
| Tournoi sans enjeu, résultat 13–7 | Aucune dette. |
| Jeudis avec enjeu, résultat 13–0 ou 13–6 | Les perdants sont redevables. |
| Jeudis avec enjeu, résultat 13–7 ou 13–12 | Les gagnants sont redevables. |
| Résultat déclencheur traité une seconde fois | Aucune dette supplémentaire. |
| Gagnants redevables, un gagnant régale son équipe | Reprise exclusive autorisée pour ce gagnant ; débiteurs initiaux conservés. |
| Enjeu différé non acquis | Aucun bouton pour honorer une dette inexistante. |

Les conventions proposées et les cas particuliers signalés en section 2.4 restent distincts des règles expressément confirmées. Cette révision ne vaut pas implémentation du mode tournoi dans l'application.
