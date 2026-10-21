# SupplyPilot — pilotage des achats et des stocks

Application web de gestion de la chaîne d'approvisionnement : inventaire, fournisseurs, commandes d'achat, règles de contrôle et journal d'audit. Projet d'équipe réalisé dans le cadre de l'AEC *IA pour la gestion des affaires* (Collège Cumberland, 2026).

**Démo en ligne :** https://supplypilot-five.vercel.app/ (des comptes de démonstration sont indiqués sur la page de connexion)
**Version actuelle :** 3.0.0 — voir le [CHANGELOG](CHANGELOG.md)

## D'où vient le projet

1. **Modèle Excel** : un fichier de gestion d'inventaire (EOQ, point de commande, analyse ABC/Pareto).
2. **Tableau de bord KPI d'inventaire** : le modèle Excel transformé en tableau de bord.
3. **Application web** : le tableau de bord transformé en application complète, développée avec l'aide d'outils d'IA (ChatGPT et Claude) à partir d'un cahier des charges détaillé ([PROMPT_SupplyPilot_Frontend.md](PROMPT_SupplyPilot_Frontend.md)) : règles métier, cycle des commandes, KPI, formules et écrans.
4. **Itérations** : 14 versions, de la 1.0.0 à la 3.0.0, chacune documentée dans le CHANGELOG.

## Ce que fait l'application

- **Tableau de bord** : taux de service, couverture de stock, analyse ABC (Pareto), commandes à traiter.
- **Inventaire** : 400 articles de démonstration, classement ABC, EOQ, point de commande, articles critiques.
- **Fournisseurs** : fiches et statut (actif ou inactif).
- **Commandes d'achat** : cycle complet BROUILLON → À VALIDER → ENVOYÉ → REÇU → CLOS.
- **Tâches et journal d'audit** : chaque création, validation ou blocage est consigné avec l'utilisateur, le niveau et la raison.
- **Entrepôt** : commandes internes, inventaire tournant, statistiques et performance TRS.
- **Accès par rôle** : administrateur (gestionnaire des achats) et équipe d'entrepôt, chacun avec son propre menu.

## Les 8 règles de contrôle

| # | Règle | Condition | Action |
|---|-------|-----------|--------|
| 1 | Réapprovisionnement automatique | Classe A ou B, stock sous le seuil, fournisseur actif | Commande brouillon + tâche de validation + journal |
| 2 | Une seule commande ouverte par article | Déjà une commande BROUILLON ou À VALIDER pour ce SKU | Création bloquée + avertissement |
| 3 | Limite de quantité | Quantité > EOQ × 2 | Validation par un gestionnaire |
| 4 | Fournisseur inactif | Fournisseur au statut inactif | Création bloquée + erreur |
| 5 | Quantité positive | Quantité ≤ 0 | Commande refusée |
| 6 | Envoi sans validation | Commande non validée | Transition bloquée |
| 7 | Réception sans envoi | Commande non envoyée | Transition bloquée |
| 8 | Commande close immuable | Modification d'une commande CLOSE | Modification bloquée |

## Formules

- **EOQ** = √((2 × D × S) / H)
- **Point de commande** = (D / 365 × délai de livraison) + stock de sécurité
- **Couverture** = stock net / (D / 365)
- **Classe ABC** (Pareto sur la valeur annuelle) : A ≤ 80 %, B ≤ 95 %, C > 95 %

## Technologies

| Élément | Choix |
|---------|-------|
| Interface | React 18 (JavaScript, composants fonctionnels et hooks) |
| Graphiques | Recharts |
| Outil de build | Vite 5 |
| État | React Context (données, authentification, thème) |
| Styles | Styles en ligne et jetons de design (`src/styles`) |
| Données | Générées dans le navigateur au démarrage (`src/data/generators.js`) : aucune base de données ni serveur requis |
| Hébergement | Vercel |

> Une version avec serveur (FastAPI, PostgreSQL) a été prototypée à la version 1.7.0 (voir le CHANGELOG). Elle ne fait pas partie de ce dépôt : la version en ligne fonctionne entièrement dans le navigateur.

## Structure

```
src/
├── App.jsx                  # Navigation, workflow des commandes
├── components/
│   ├── pages/               # Un fichier par écran (tableau de bord, inventaire, commandes…)
│   ├── layout/              # Barre latérale et en-tête
│   ├── overlays/            # Fenêtres, recherche globale, notifications
│   └── common/              # Cartes, tableaux, badges, boutons
├── contexts/                # Données, authentification, thème
├── data/                    # Constantes et génération des données de démonstration
├── hooks/                   # Tri des tableaux
├── styles/                  # Jetons de design et thèmes
└── utils/                   # Formatage, export CSV
```

## Lancer le projet en local

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
```

## Licence

Projet scolaire. Tous droits réservés.
