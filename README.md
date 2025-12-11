# Webapp de détection de phishing par URL (API Dataiku / PhiUSIIL)

Projet réalisé dans le cadre du **Master HES-SO MScBA en Management des Systèmes d’Information** —
**Cours : Exploration avancée des données – Projet EAD : Webapp PhiUSIIL**

L’application Angular sert de vitrine front-end pour plusieurs **services de scoring Dataiku** construits à partir du **dataset PhiUSIIL phishing URL**, d'un autre provenant du Kaggle Mustafavi ainsi que de modèles de classification de phishing via les seules caractéristiques lexicales d’URL. 

---

## Objectif

La webapp permet de :

* Saisir une URL suspecte,
* Extraire localement les features (longueurs, TLD, ratios de caractères, etc.) au format *Only URL Specs* du dataset PhiUSIIL,
* Envoyer ces features à une API Dataiku (avec choix du modèle),
* Adapter la sensibilité de détection via un sélecteur de profil de sécurité,
* Visualiser le **verdict (phishing / légitime)** et les probabilités associées.


---

## Fonctionnement global

### 1. Saisie utilisateur & paramètres

L’utilisateur interagit avec la carte principale **“Analyseur d’URL”** :

* **Champ d’entrée :**

  * `URL cible` — texte libre (`https://...`), avec bouton pour effacer.
* **Paramètres de détection :**

  * **Sensibilité (profil de sécurité)** via un groupe de toggles :

    * **Bas** – plus tolérant (moins d’alertes phishing),
    * **Normal** – comportement recommandé,
    * **Haut** – mode strict (détection maximale).
  * **Modèle API** (liste déroulante) — choix du service Dataiku à appeler.
* **Actions :**

  1. **“1. Extraire”** : calcule les features à partir de l’URL.
  2. **“2. Prédire”** : envoie les features à l’API Dataiku sélectionnée et affiche le résultat.

En cas d’erreur (URL invalide, problème d’API), un bandeau rouge **“alert-box”** affiche le message correspondant.

---

### 2. Extraction locale des features (format PhiUSIIL / Only URL Specs)

La logique d’extraction est implémentée dans `UrlFeatureExtractorService`.
À partir de l’URL fournie, l’appli calcule un vecteur de features lexicales inspirées du dataset **PhiUSIIL phishing URL dataset** (partie URL-only). 

Principales features calculées :

| Catégorie                   | Champs                                                                                  | Description synthétique                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Structure de l’URL**      | `URL`, `URLLength`                                                                      | URL normalisée + longueur totale                                                                                      |
| **Domaine**                 | `Domain`, `DomainLength`, `IsDomainIP`                                                  | Hostname, longueur, flag IP (0/1)                                                                                     |
| **TLD & sous-domaines**     | `TLD`, `TLDLength`, `NoOfSubDomain`                                                     | TLD simple (ex.: `com`), longueur, nb de sous-domaines                                                                |
| **Comptages de caractères** | `NoOfLettersInURL`, `NoOfDegitsInURL`                                                   | Nb de lettres vs. chiffres (hors schéma, etc.)                                                                        |
| **Caractères spéciaux**     | `NoOfQMarkInURL`, `NoOfEqualsInURL`, `NoOfAmpersandInURL`, `NoOfOtherSpecialCharsInURL` | `?`, `=`, `&` et autres caractères spéciaux                                                                           |
| **Ratios**                  | `LetterRatioInURL`, `DegitRatioInURL`, `SpacialCharRatioInURL`                          | Ratios lettres / chiffres / spéciaux rapportés à la longueur de l’URL                                                 |
| **CharContinuationRate**    | `CharContinuationRate`                                                                  | Mesure la longueur maximale de runs consécutifs (lettres, chiffres, spéciaux) dans le SLD, normalisée par la longueur |

Quelques points importants :

* L’URL est **normalisée** avant analyse :

  * ajout de `https://` si nécessaire,
  * parsing via l’objet `URL`,
  * séparation host / path / query / fragment.
* Le **TLD** est calculé comme le **dernier label du hostname**.
* `NoOfSubDomain` = `max(0, nb_labels - 2)` (ex. `a.b.c.com` → 2 sous-domaines).
* `IsDomainIP` détecte IPv4 / IPv6 par regex et présence de `:`.

Ces features sont ensuite affichées dans la carte **“Features Extraites”**, sous forme de formulaires **éditables** : l’utilisateur peut ajuster une valeur à la main avant la prédiction.

---

### 3. Champs transmis à l’API Dataiku

Le service `UrlPredictionService` transforme les features Angular (`UrlFeatures`) en payload pour l’API Dataiku, sous la forme d’un objet `DataikuPredictionRequest`.

**Endpoint générique :**

```text
https://dss.ga-fl.net/public/api/v1/{serviceId}/{endpointId}/predict
```

---

### 4. Modèles exposés (sélecteur “Modèle API”)

La webapp permet d’interroger plusieurs services de prédiction hébergés sur Dataiku :

| Libellé dans l’UI      | Service Dataiku (`serviceId/endpointId`) | Seuil de base (`baseThreshold`) |
| ---------------------- | ---------------------------------------- | ------------------------------- |
| **PhiUSIIL regénéré**  | `phiusiil_gen/phiusiil_gen`              | 0.50                            |
| **PhiUSIIL original**  | `OnlyURLSpecs/prediction`                | 0.60                            |
| **Kaggle External HM** | `kaggle1/kaggle1`                        | 0.45                            |
| **PhiUSIIL+ Kaggle**   | `PhiUSIILKaggle/PhiUSIILKaggle`          | 0.40                            |
| **Early Kaggle Test**  | `EarlyKaggleTest/EarlyKaggleTest`        | 0.15                            |
| **PhiUSIIL alimenté**  | `PhiUSIILAugmented/PhiUSIILAugmented`    | 0.125                           |

> Plus le **seuil de base** est faible, plus le modèle est **sensible** au phishing pour une même probabilité de la classe “0 = phishing”.

Les modèles sont entraînés côté Dataiku sur le dataset PhiUSIIL ou des variantes enrichies (combinaisons avec un dataset Kaggle). 

---

### 5. Profils de sécurité (Sensibilité)

Le comportement de la webapp s’inspire directement du concept de **diverse security profiles** introduit dans le framework PhiUSIIL (LowSecurity / BestSecurity / HighSecurity). 

Dans le composant, cela se traduit par un **seuil dynamique** appliqué à la **proba de la classe “0 = phishing”** :

* **Normal (securityLevel = 1)**

  * Comportement par défaut : on suit simplement la **classe prédite par le modèle** (`prediction === '0'` → phishing).
* **Bas (Tolérant, securityLevel = 0)**

  * Le seuil de décision est **rehaussé** → l’URL doit paraître plus clairement phishing pour être marquée comme telle (moins de faux positifs).
* **Haut (Strict, securityLevel = 2)**

  * Le seuil de décision est **abaissé** → un doute raisonnable sur le phishing suffit pour déclencher l’alerte (moins de faux négatifs).

L’algorithme de décision côté front :

1. On lit `probas['0']` (probabilité de phishing).
2. Si indisponible, on retombe sur la classe `prediction` renvoyée.
3. On compare `probas['0']` au **seuil ajusté** (`phishingThreshold`) en fonction du modèle et du profil de sécurité.

---

### 6. Réponse de l’API & affichage dans l’UI

L’API Dataiku renvoie une structure du type :

```json
{
  "result": {
    "prediction": "0",
    "probaPercentile": 92,
    "probas": {
      "0": 0.96,
      "1": 0.04
    },
    "ignored": false
  },
  "timing": { "...": 12.3 },
  "apiContext": {
    "serviceId": "phiusiil_gen",
    "endpointId": "phiusiil_gen",
    "serviceGeneration": "1"
  }
}
```

Dans la webapp :

* Une **carte de résultat** affiche :

  * Un **badge de verdict** :

    * `URL LÉGITIME (Probable)` (icône *verified_user*) ou
    * `PHISHING DÉTECTÉ` (icône *warning*).
  * Le **percentile** (`probaPercentile`) sous forme de statistique.
  * Deux barres de progression (`mat-progress-bar`) :

    * **Phishing (0)** — en rouge (`color="warn"`),
    * **Légitime (1)** — en bleu (`color="primary"`),
      avec les valeurs formatées en pourcentage.
* Un panneau extensible **“Données brutes”** affiche le JSON `result` pour debug / audit.

---

## Structure du projet

Organisation simplifiée des principaux fichiers Angular :

```text
src/
  app/
    app.component.ts          # Composant principal (UI + logique globale)
    app.component.html        # Template : formulaire URL, cartes, résultats
    app.component.scss        # Styles et layout (Material + responsive)

    models/
      url-features.model.ts   # Interface des features locales (UrlFeatures)
      dataiku.model.ts        # Interfaces de la réponse Dataiku

    services/
      url-feature-extractor.service.ts  # Extraction des features lexicales
      url-prediction.service.ts         # Appel HTTP aux services Dataiku

.github/
  workflows/                  # Workflows GitHub Actions (CI / build Angular)
```

---

## Technologies utilisées

* **Angular 18** 
* **Angular Material** (`@angular/material`)
  (toolbar, cards, inputs, selects, toggles, progress bars, expansion panels…)
* **RxJS** pour la gestion des flux asynchrones (appel API Dataiku).
* **Angular HttpClient** pour les requêtes HTTP vers Dataiku.
* **TypeScript** pour la logique de calcul des features.
* **Dataiku DSS** pour l’hébergement des modèles de prédiction (services REST).

---

## Lancement du projet localement

1. **Cloner le repository**

   ```bash
   git clone https://github.com/francoisbrouchoud/phishing-ui-form.git
   cd phishing-ui-form
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

   > Pré-requis : **Node.js** récent et **Angular CLI** (v18) installés globalement (`npm install -g @angular/cli`).

3. **Lancer le serveur de dev**

   ```bash
   ng serve
   ```

   Puis ouvrir : [http://localhost:4200](http://localhost:4200)
   L’application se recharge automatiquement à chaque modification des sources.

4. **Tester la détection de phishing**

   * Saisir une URL (ex. une URL clairement légitime, puis une URL suspecte),
   * Cliquer sur **“1. Extraire”** pour voir les features générées,
   * Ajuster éventuellement quelques champs (TLD, nb de sous-domaines, etc.),
   * Choisir un **modèle API** et un niveau de **Sensibilité**,
   * Cliquer sur **“2. Prédire”** et observer le verdict et les probabilités.

---

## CI / CD & déploiement

Le dépôt contient un dossier `.github/workflows` avec au moins un workflow GitHub Actions permettant d’automatiser le build Angular et la publication sur GitHub pages.


## Références

* A. Prasad, S. Chandra – *PhiUSIIL: A diverse security profile empowered phishing URL detection framework based on similarity index and incremental learning* (Computers & Security 136, 2024). 
