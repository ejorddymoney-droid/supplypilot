# SupplyPilot — Inventory & Procurement Management

Application métier complète de pilotage supply chain / approvisionnement, transformée à partir d'un modèle Excel de gestion d'inventaire EOQ/Pareto.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, shadcn/ui |
| **Backend** | Python, FastAPI, SQLAlchemy, Pydantic, Alembic |
| **Base de données** | PostgreSQL |

## Architecture

```
inventory-procurement-app/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── core/config.py           # Settings (env-based)
│   │   ├── database/
│   │   │   ├── session.py           # SQLAlchemy engine + session
│   │   │   └── seed.py              # Demo data seeder
│   │   ├── models/models.py         # SQLAlchemy ORM models
│   │   ├── schemas/schemas.py       # Pydantic I/O schemas
│   │   ├── api/routes/api.py        # REST API endpoints
│   │   ├── services/services.py     # Business logic layer
│   │   ├── rules_engine/engine.py   # Rules + guardrails
│   │   └── audit/service.py         # Centralized event logging
│   ├── .env
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── services/api.ts          # TypeScript API client
│       └── ... (React components)
├── database/
│   └── schema.sql                   # PostgreSQL DDL
└── README.md
```

## Installation

### Prérequis

- Python 3.11+
- PostgreSQL 15+
- Node.js 18+
- npm ou pnpm

### 1. Base de données PostgreSQL

```bash
# Créer l'utilisateur et la base
sudo -u postgres psql -c "CREATE USER supplypilot WITH PASSWORD 'supplypilot';"
sudo -u postgres psql -c "CREATE DATABASE supplypilot OWNER supplypilot;"

# Appliquer le schéma
psql -U supplypilot -d supplypilot -f database/schema.sql
```

### 2. Backend FastAPI

```bash
cd backend

# Créer un virtualenv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement (modifier .env si nécessaire)
cp .env.example .env  # ou éditer .env directement

# Lancer le seed (données de démonstration)
python -m app.database.seed

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur démarre sur `http://localhost:8000`.
- Documentation Swagger: `http://localhost:8000/docs`
- Documentation ReDoc: `http://localhost:8000/redoc`

### 3. Frontend React

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'URL de l'API (optionnel, défaut: http://localhost:8000/api)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Lancer le serveur de dev
npm run dev
```

Le frontend démarre sur `http://localhost:5173`.

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/items` | Liste des articles (filtres: abc, famille, search) |
| GET | `/api/items/critical` | Articles critiques uniquement |
| GET | `/api/items/{id}` | Détail d'un article |
| POST | `/api/items` | Créer un article |
| PATCH | `/api/items/{id}` | Modifier un article (recalcul EOQ auto) |
| GET | `/api/suppliers` | Liste des fournisseurs |
| GET | `/api/suppliers/{id}` | Détail fournisseur |
| GET | `/api/purchase-orders` | Liste des POs (filtres: statut, search) |
| POST | `/api/purchase-orders` | Créer un PO (garde-fous actifs) |
| POST | `/api/purchase-orders/{id}/approve` | Valider (BROUILLON → A_VALIDER) |
| POST | `/api/purchase-orders/{id}/send` | Envoyer (A_VALIDER → ENVOYE) |
| POST | `/api/purchase-orders/{id}/receive` | Réceptionner (ENVOYE → RECU) |
| POST | `/api/purchase-orders/{id}/close` | Clore (RECU → CLOS) |
| GET | `/api/purchase-orders/{id}/history` | Historique des transitions |
| GET | `/api/tasks` | Liste des tâches (filtre: status) |
| GET | `/api/event-log` | Journal d'audit (filtre: level) |
| GET | `/api/dashboard/summary` | KPIs consolidés |
| POST | `/api/rules/run-replenishment-check` | Lancer le scan de réapprovisionnement |

## Règles métier (Rules Engine)

| # | Règle | Résultat |
|---|-------|---------|
| 1 | Un seul PO BROUILLON/A_VALIDER par SKU | Création bloquée + log WARNING |
| 2 | Qty > EOQ × 2 | Tâche approbation managériale + log WARNING |
| 3 | Fournisseur inactif | Création PO bloquée + log ERROR |
| 4 | Qty <= 0 | Refus + log ERROR |
| 5 | Envoi sans validation | Transition bloquée + log ERROR |
| 6 | Réception sans envoi | Transition bloquée + log ERROR |
| 7 | PO clos → modification | Bloqué + log ERROR |

## Formules

- **EOQ** = √((2 × D × S) / H)
- **ROP** = (D/365 × Lead time) + Stock sécurité
- **Couverture** = Stock net / (D / 365)
- **Classification ABC** = Pareto sur valeur annuelle (A ≤ 80%, B ≤ 95%, C > 95%)

## Données seed

Le script `seed.py` génère:
- 5 fournisseurs (dont 1 inactif)
- 400 articles avec classification ABC automatique
- 20 POs dans différents statuts
- 12 tâches de validation
- 30 événements d'audit

## Licence

Propriétaire — usage interne uniquement.
