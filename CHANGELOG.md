# SupplyPilot — CHANGELOG

> Traçabilité complète de chaque version. Chaque entrée documente les changements, fichiers impactés, et le contexte de la décision.

---

## v2.1.0 — Module Inventaire Tournant (Cycle Count)
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx` (2 731 lignes, +524 lignes)  
**Version précédente** : v2.0.0  
**Résumé** : Nouveau module complet d'inventaire tournant avec planification automatique par classe ABC, saisie avec questionnaire de cause racine obligatoire sur écart critique, historique, et analyse des causes compilée en KPIs.

### Données ajoutées
| Constante | Contenu |
|-----------|---------|
| `CYCLE_FREQ` | Fréquence comptage par classe : A=1 mois, B=3 mois, C=6 mois |
| `ECART_SEUILS` | Seuils écart tolérés : A=±5%, B=±10%, C=±15% |
| `CAUSE_OPTIONS` | 9 causes racines (erreur réception, picking, casse, vol, saisie, transfert, retour, obsolescence, autre) |
| `ZONE_OPTIONS` | 5 zones de stockage |
| `ACTION_OPTIONS` | 6 actions correctives |
| `CRITICAL_CAUSES` | 3 causes déclenchant auto-investigation (vol, casse, erreur fournisseur) |
| `INITIAL_COUNTS` | 12 comptages historiques avec causes et zones variées |
| `MONTHLY_PRECISION` | 6 mois de tendance précision (Oct→Mars) |

### Composants créés
- **`CycleCountPage`** — Page complète avec 4 onglets (plan, saisie, historique, analyse), état local `countForm` + `showQuestionnaire`
- **`RadioOption`** — Bouton radio stylisé pour le questionnaire (cercle + sélection accent)
- **`CheckOption`** — Checkbox stylisée pour les actions multiples

### 4 onglets de la page

**Onglet Plan** :
- Génère automatiquement la liste des articles à compter ce mois basé sur `CYCLE_FREQ[abc]`
- Tri par priorité : non comptés d'abord, puis par couverture croissante
- Affiche dernier comptage, statut compté/à compter, bouton "Compter"
- Export CSV

**Onglet Saisie** :
- Sélection article (input avec datalist autocomplete)
- Affichage info article : stock système, classe ABC, seuil écart
- Entrée quantité physique avec affichage écart live (unités + %)
- Si écart ≤ seuil → validation automatique sans questionnaire
- Si écart > seuil → ouverture questionnaire modal obligatoire

**Questionnaire écart (modal)** :
- Q1 : Cause principale (radio, 9 options) — **obligatoire**
- Q2 : Zone de stockage (radio, 5 options) — **obligatoire**
- Q3 : Actions correctives (checkbox multiple, 6 options)
- Q4 : Commentaire libre (textarea)
- Détection automatique cause critique avec avertissement visuel rouge
- Bouton Valider désactivé tant que Q1 + Q2 non remplis

**Onglet Historique** :
- Tableau chronologique : date, SKU, article, stock sys, compté, écart, %, statut, compteur, cause
- Export CSV complet

**Onglet Analyse causes** :
- Donut répartition des causes racines (PieChart avec labels %)
- Tendance précision mensuelle (ComposedChart : barres comptages + ligne précision %)
- Tableau causes par classe ABC (cause #1 par classe)
- Tableau zones problématiques (nombre d'écarts par zone)
- Précision par classe vs cible : barres de progression (A cible 95%, B cible 90%, C cible 85%)

### Intégrations avec l'existant
| Intégration | Détail |
|-------------|--------|
| **stock_net** | Mis à jour directement sur l'item après validation du comptage |
| **Événement audit** | `CYCLE_COUNT` créé à chaque comptage — niveau INFO/WARNING/ERROR selon % écart |
| **Tâche investigation** | Auto-créée si cause ∈ CRITICAL_CAUSES (vol, casse, erreur fournisseur) — assignée à Sophie Gagnon |
| **Toast** | Vert si validé, rouge si investigation créée |
| **Badge sidebar** | Bleu, affiche le nombre d'articles restants à compter ce mois |
| **Dashboard KPI** | Nouvelle carte "Précision inventaire" (7ème) — cliquable vers la page |

### État ajouté dans App
- `counts` / `setCounts` : `useState(INITIAL_COUNTS)`
- `setCounts`, `addEvent`, `showToast`, `setTasks` exposés via `DataContext`
- `cycleCountRemaining` calculé avec `useMemo` pour le badge sidebar

---

## v2.0.0 — KPI Expand Overlay (4 vues détaillées)
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx` (2 207 lignes, +398 lignes)  
**Version précédente** : v1.9.0  
**Résumé** : Changement majeur — cliquer sur le titre d'une carte graphique du dashboard ouvre un overlay plein écran avec des métriques détaillées, graphiques agrandis, tableaux drill-down et exports CSV. 4 KPIs expandables implémentés.

### Composants créés
- **`KPIExpandOverlay`** — Overlay plein écran avec header sticky, animation scale-in (`kpiExpand`), contenu scrollable. Accepte `kpiId` ("abc" | "couverture" | "familles" | "po_statut") et `onClose`.
- **`CalcRowSimple`** — Ligne label/valeur réutilisable pour la section workflow PO.
- **`MiniKpi`** (interne au composant) — Carte KPI compacte pour les headers d'expansion.

### Composant `Card` modifié
- Nouveau prop `onTitleClick` : rend le titre cliquable avec curseur pointer
- Icône expand (↗) discrète en opacité 0.4 à côté du titre quand `onTitleClick` est présent
- Couleur accent au hover sur le titre

### État ajouté dans App
- `expandedKPI` : `null` | `"abc"` | `"couverture"` | `"familles"` | `"po_statut"`
- `setExpandedKPI` ajouté au `DataContext`
- Gestionnaire ESC mis à jour pour fermer l'overlay

### 4 expansions détaillées

**1. Distribution ABC — Pareto (`abc`)**
- 5 mini-KPIs : valeur totale, % valeur A, % valeur B, % valeur top 5, compteur A/B/C
- Courbe Pareto top 50 : `ComposedChart` barres colorées par classe + ligne % cumulé
- Tableau top 20 articles (rang, SKU, article, valeur, % cumulé, ABC, famille) + export CSV
- Tableau répartition ABC par famille avec barre de progression % classe A

**2. Couverture stock (`couverture`)**
- 5 mini-KPIs : couverture moyenne, articles <10j, 10-20j, >30j, risque global
- Distribution fine 8 tranches (0-5j → 60j+) avec couleurs rouge→bleu
- Tableau couverture par classe ABC (moyenne + minimum)
- Tableau couverture par famille (moyenne + nombre en danger <10j)
- Tableau articles en danger <10 jours triés par urgence + export CSV

**3. Valeur par famille (`familles`)**
- 4 mini-KPIs : valeur totale, famille #1, valeur moy/article, nombre familles
- Barres horizontales détaillées avec couleurs distinctes par famille
- Pie chart répartition en % avec labels inline
- Tableau détaillé 10 colonnes : articles, valeur, %, val moy, A/B/C, couverture, sous seuil + export CSV

**4. Statut PO (`po_statut`)**
- 5 mini-KPIs par statut avec valeur $ engagée entre parenthèses
- Donut volume + barres valeur engagée par statut
- Card indicateurs workflow : taux clôture, écart prix négocié vs payé, PO ouverts
- Tableau PO les plus anciens non clos (candidats relance) + export CSV

### Dashboard wiring
4 cartes graphiques du dashboard connectées via `onTitleClick` → `setExpandedKPI()` :
- "Distribution ABC — Pareto" → `abc`
- "Couverture stock (jours)" → `couverture`
- "Valeur annuelle par famille" → `familles`
- "Statut des Purchase Orders" → `po_statut`

### Animation
`@keyframes kpiExpand { from { opacity:0; transform: scale(0.97); } to { opacity:1; transform: scale(1); } }`

---

## v1.9.0 — Page Performance TRS
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx` (1 809 lignes, +205 lignes)  
**Version précédente** : v1.8.0  
**Résumé** : Nouvelle page dédiée au Taux de Rendement Synthétique (TRS / OEE), avec inputs interactifs, jauges SVG, tendance mensuelle et section pédagogique. Données fidèles au module Excel `Performance_TRS`.

### Composants créés
- **`GaugeChart`** — Jauge SVG semi-circulaire réutilisable (arc background + arc valeur + aiguille + label + niveau). Props : `value`, `label`, `color`, `size`. Niveaux automatiques : World Class ≥85%, Bon ≥75%, Acceptable ≥60%, Critique <60%.
- **`TRSPage`** — Page complète avec état local `inputs` pour les 5 paramètres de production.

### Données ajoutées
- **`TRS_DEFAULTS`** — 5 inputs du module Excel : temps planifié 160h, arrêts 12h, cadence théorique 85/h, qté totale 11 800, qté rejetée 280.
- **`TRS_MONTHLY`** — 6 mois d'historique (Oct→Mars) avec dispo, perf, qual, trs par mois.

### Contenu de la page
| Section | Description |
|---------|-------------|
| **4 KPI Cards** | Disponibilité, Performance, Qualité, TRS Global — couleurs dynamiques selon seuils |
| **4 Jauges SVG** | Jauges semi-circulaires avec aiguille, valeur %, label et niveau (World Class/Bon/Acceptable/Critique) |
| **Inputs interactifs** | 5 champs éditables (temps planifié, arrêts, cadence, qté totale, qté rejetée) avec recalcul temps réel + bouton Réinitialiser |
| **Résultats calculés** | Temps fonctionnement, cadence réelle, qtés bonnes, taux de rebut — dérivés en live des inputs |
| **Tendance 6 mois** | ComposedChart (4 lignes + barres TRS) avec axe Y 60–100%, légende, tooltip |
| **Historique mensuel** | Tableau 6 lignes avec badge niveau coloré par mois |
| **Formules** | 4 cartes pédagogiques : Disponibilité, Performance, Qualité, TRS — formule monospace + description |
| **Repères industriels** | Grille 2×2 avec seuils colorés (World Class ≥85%, Bon 75–84%, Acceptable 60–74%, Critique <60%) |
| **Export CSV** | Bouton sur le graphique tendance — exporte les 6 mois |

### Formules implémentées
```
Temps fonctionnement = Temps planifié − Arrêts
Disponibilité = Temps fonctionnement / Temps planifié
Performance = (Qté totale / Temps fonctionnement) / Cadence théorique
Qualité = (Qté totale − Qté rejetée) / Qté totale
TRS = Disponibilité × Performance × Qualité
```

### Valeurs par défaut (depuis le Excel)
| Input | Valeur | Résultat |
|-------|--------|----------|
| Temps planifié | 160h | Disponibilité : 92.5% |
| Arrêts | 12h | Performance : 93.8% |
| Cadence théorique | 85/h | Qualité : 97.6% |
| Qté totale | 11 800 | **TRS : 84.7%** |
| Qté rejetée | 280 | Niveau : Bon |

### Navigation
- Icône ajoutée au composant `Icon` (roue crantée avec cercles concentriques)
- Position : entre "Journal d'audit" et "Règles / Config" dans la sidebar
- Page ID : `trs`, Label : "Performance TRS"

---

## v1.8.0 — Prompt de reconstruction
**Date** : 2026-03-17  
**Fichiers** : `PROMPT_SupplyPilot_Frontend.md`  
**Résumé** : Document prompt de ~300 lignes capturant l'intégralité de l'application pour permettre sa reconstruction fidèle par un LLM dans une nouvelle conversation.  
**Contenu** : 13 sections couvrant contexte, stack, design system, architecture état, génération données, tri, 8 pages, workflow PO, garde-fous, optimisations UX, header, contraintes techniques, format de livraison.

---

## v1.7.0 — Backend complet (FastAPI + PostgreSQL + SQLAlchemy)
**Date** : 2026-03-17  
**Fichiers** : `supplypilot-backend.zip` (28 fichiers, ~1 600 lignes backend)  
**Résumé** : Ajout du projet backend complet pour remplacer les données en mémoire par une persistance PostgreSQL.

### Fichiers créés
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `database/schema.sql` | 134 | DDL PostgreSQL — 6 tables, contraintes CHECK, index, triggers auto-update |
| `backend/app/core/config.py` | 21 | Configuration pydantic-settings (DATABASE_URL, CORS, etc.) |
| `backend/app/database/session.py` | 18 | Engine SQLAlchemy + session factory + `get_db()` dependency |
| `backend/app/models/models.py` | 125 | 6 modèles ORM : Supplier, Item, PurchaseOrder, POStatusHistory, Task, EventLog |
| `backend/app/schemas/schemas.py` | 193 | Schémas Pydantic in/out + DashboardSummary agrégé |
| `backend/app/rules_engine/engine.py` | 233 | Moteur de règles complet — 7 garde-fous, calculs EOQ/ROP, réappro auto |
| `backend/app/services/services.py` | 213 | 5 services métier séparés des routes |
| `backend/app/api/routes/api.py` | 156 | 18 endpoints REST |
| `backend/app/audit/service.py` | 22 | Logging centralisé `log_business_event()` |
| `backend/app/database/seed.py` | 184 | Seed : 400 articles, 5 fournisseurs, 20 POs, 12 tâches, 30 événements |
| `backend/app/main.py` | 32 | Point d'entrée FastAPI avec CORS et auto-create tables |
| `frontend/src/services/api.ts` | 196 | Client TypeScript typé pour toutes les routes API |
| `backend/requirements.txt` | 8 | Dépendances Python |
| `README.md` | 158 | Documentation d'installation complète |

---

## v1.6.0 — 6 optimisations UX
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx` (1 601 lignes)  
**Résumé** : Implémentation des 6 optimisations identifiées lors de l'audit UX.

### Changements détaillés
1. **Recherche globale (⌘K)** — Composant `GlobalSearch`. Overlay modal, recherche instantanée multi-entités (articles, POs, fournisseurs), résultats avec badge type coloré, navigation + ouverture SlideOver. Raccourci clavier `⌘K` / `Ctrl+K` via `useEffect`.
2. **KPI Cards cliquables** — Prop `onClick` ajoutée à `KpiCard`. 6 cartes du dashboard naviguent vers la page pertinente. Effet hover `translateY(-2px)`, flèche → en bas à droite.
3. **Panneau latéral SlideOver** — Composant `SlideOver` (420px, animation slideRight 0.25s). 3 types de détail : article, PO, fournisseur. Fermeture ESC/✕/clic extérieur. `stopPropagation` sur les boutons d'action.
4. **Export CSV** — Fonction `exportCSV()` + composant `ExportButton`. 7 tableaux équipés. UTF-8 BOM pour Excel. Exporte données filtrées/triées.
5. **Badges compteurs sidebar** — Objet `badgeCounts` avec 4 entrées (critical, orders, tasks, audit). Couleurs contextuelles par item de navigation.
6. **Feedback inline ActionBtn** — Composant `ActionBtn` avec 3 états : idle → "···" (300ms) → "✓ OK" vert (1.2s). Remplace les boutons statiques du workflow PO.

### Composants ajoutés
`GlobalSearch`, `SlideOver`, `ActionBtn`, `ExportButton`, `exportCSV()`

### État ajouté dans App
`globalSearch`, `slideOver`, `setSlideOver` (dans DataContext)

---

## v1.5.0 — Tri ordinal métier
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx`  
**Résumé** : Les colonnes catégorielles (Priorité, ABC, Statut, etc.) trient maintenant selon l'ordre métier logique plutôt qu'alphabétique.

### Changement
Ajout de `ORDINAL_MAPS` — table de correspondance pour 8 colonnes :
- `priorite` : Haute=1 → Moyenne=2 → Basse=3
- `statut_service` : Rupture=1 → Sous seuil=2 → Conforme=3
- `abc` : A=1 → B=2 → C=3
- `statut` (PO) : BROUILLON=1 → ... → CLOS=5
- `level` (audit) : CRITICAL=1 → ... → INFO=4
- `status` (tâche) : Ouverte=1 → En cours=2 → Terminée=3
- `old_status`, `new_status` : même map que statut PO

Le hook `useSortable` détecte automatiquement si la colonne a un mapping ordinal.

---

## v1.4.0 — Colonnes triables sur tous les tableaux
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx`  
**Résumé** : Ajout de flèches de tri ▲▼ sur chaque colonne de chaque tableau de l'application.

### Système créé
- Hook réutilisable `useSortable(defaultCol, defaultDir)` — gère sortCol, sortDir, handleSort, sortData
- Composant `SortableTh` — header cliquable, flèches ▲▼ grises par défaut, vertes quand actif
- Tri automatique : string (localeCompare), number, null-safe

### 9 tableaux mis à jour
| Page | Colonnes triables |
|------|-------------------|
| Dashboard — Articles critiques | 5 |
| Dashboard — PO en attente | 5 |
| Inventaire | 13 (toutes) |
| Articles critiques | 10 |
| Fournisseurs | 7 |
| Purchase Orders | 9 |
| Tâches | 6 |
| Audit — Événements | 7 |
| Audit — Historique transitions | 6 |

---

## v1.3.0 — Conformité audit (workflow, garde-fous, journalisation)
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx`  
**Résumé** : Audit contre 4 critères (Workflow PO /10, Automatisation /10, Journalisation /5, UAT /5) — corrections pour atteindre 30/30.

### Corrections apportées
1. **po_status_history** — Nouvel état `statusHistory` avec tracking structuré (old_status, new_status, changed_by, changed_at, comment). Affiché dans la page Audit.
2. **Dates par étape** — `date_validation`, `date_envoi`, `date_reception` trackées dans chaque transition.
3. **Modal de confirmation** — Obligatoire pour Réceptionner (ENVOYÉ→REÇU) et Clore (REÇU→CLOS). Affiche PO number + badges transition.
4. **Garde-fou qty > EOQ×2** — Crée une tâche "Approbation managériale" + log WARNING sur validation.
5. **Garde-fou qty ≤ 0** — Refuse la création PO + log ERROR.
6. **Fermeture auto tâches** — Les tâches liées passent à "Terminée" quand le PO atteint ENVOYÉ ou CLOS.

### État ajouté
`statusHistory`, `confirmAction`, `doTransitionPO()` (exécution réelle), `transitionPO()` (wrapper avec gardes)

---

## v1.2.0 — Boutons d'action fonctionnels
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx`  
**Résumé** : Tous les boutons de workflow PO et création PO sont câblés avec logique métier.

### Changements majeurs
- Données rendues mutables : `POS` → `INITIAL_POS` + `useState`, idem TASKS et EVENTS
- Ajout `DataContext` + `useData()` pour partager l'état entre pages
- **createPO(item)** : garde-fous (PO unique par SKU, fournisseur actif), création PO BROUILLON + tâche validation + log audit + toast + navigation
- **transitionPO(poId)** : avancement BROUILLON→A_VALIDER→ENVOYÉ→REÇU→CLOS, prix_payé auto à réception, tâches auto-fermées
- Toast notifications (succès vert, erreur rouge, auto-disparition 3s)
- Bouton "+ Nouveau PO" → navigation Articles critiques
- Icône cloche → navigation Audit
- Liens "Voir tout →" câblés sur le dashboard

### Composants impactés
DashboardPage, CriticalPage, PurchaseOrdersPage, TasksPage, AuditPage — tous mis à jour pour `useData()`

---

## v1.1.0 — Dark / Light mode
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx`  
**Résumé** : Ajout du toggle dark/light mode avec deux palettes complètes.

### Changements
- `COLORS` statique → `THEMES.dark` + `THEMES.light`
- Ajout `ThemeContext` + `useTheme()` hook
- Chaque composant (15 au total) migré de `COLORS` global vers `useTheme()`
- Composant `ThemeToggle` : interrupteur animé lune/soleil, dans la sidebar
- Transitions fluides 0.35s sur background, border-color, color
- Light mode : cards avec `box-shadow` subtil, accent `#059669`
- Flag `isLight` dans chaque palette pour styles conditionnels

---

## v1.0.0 — Dashboard initial
**Date** : 2026-03-17  
**Fichier** : `dashboard.jsx` (955 lignes)  
**Résumé** : Première version complète du dashboard SupplyPilot, construite à partir du fichier Excel `Dashboard_EOQ_Pareto_v2_1_AuditAjuste_6_0.xlsx`.

### Données extraites du Excel
- 400 articles avec calculs EOQ/ROP/couverture
- Classification ABC Pareto
- 8 familles d'articles
- KPIs : taux de service 78%, 88 articles sous seuil, couverture moyenne 32.1j

### Données générées
- 5 fournisseurs (dont 1 inactif)
- 20 POs dans 5 statuts différents
- 12 tâches de validation
- 18 événements d'audit

### 8 pages créées
1. **Dashboard** — 6 KPI cards, 4 graphiques (ABC, couverture, familles, PO donut), 2 mini-tableaux, performance fournisseurs
2. **Inventaire** — tableau 400 articles, recherche, filtres ABC/famille, pagination, tri partiel
3. **Articles critiques** — vue filtrée sous seuil + haute priorité, 4 KPI cards
4. **Fournisseurs** — tableau 5 fournisseurs avec scoring, barres conformité
5. **Purchase Orders** — tableau 20 POs, filtres par statut, boutons d'action (non fonctionnels)
6. **Tâches** — vue validation avec indicateur échéance
7. **Journal d'audit** — tableau horodaté, filtres par niveau
8. **Règles / Config** — 8 règles documentées, formules EOQ/ROP

### Composants créés
`Badge`, `KpiCard`, `Card`, `TableContainer`, `Th`, `Td`, `SearchInput`, `FilterPills`, `CustomTooltip`, `Icon` (12 icônes SVG)

### Design
- Dark mode uniquement, palette émeraude/marine
- Font DM Sans, sidebar collapsible, scrollbars custom

---

## Convention de versioning

| Format | Signification |
|--------|--------------|
| **vX.0.0** | Changement majeur (nouvelle couche, refonte architecture) |
| **vX.Y.0** | Nouvelle fonctionnalité |
| **vX.Y.Z** | Correction de bug, ajustement mineur |

### Informations obligatoires par entrée
- **Date**
- **Fichiers impactés** (avec nombre de lignes si pertinent)
- **Résumé** (1-2 phrases)
- **Changements détaillés** (ce qui a été ajouté/modifié/supprimé)
- **Composants/État impactés** (si applicable)
- **Version précédente** de référence

---

## Résumé des versions

| Version | Titre | Lignes JSX | Fichiers total |
|---------|-------|-----------|----------------|
| v1.0.0 | Dashboard initial | 955 | 1 |
| v1.1.0 | Dark/Light mode | ~1 010 | 1 |
| v1.2.0 | Boutons fonctionnels | ~1 188 | 1 |
| v1.3.0 | Conformité audit | ~1 267 | 1 |
| v1.4.0 | Colonnes triables | ~1 340 | 1 |
| v1.5.0 | Tri ordinal métier | ~1 379 | 1 |
| v1.6.0 | 6 optimisations UX | ~1 601 | 1 |
| v1.7.0 | Backend complet | ~1 601 + 1 600 | 28+ |
| v1.8.0 | Prompt reconstruction | — | +1 doc |
| v1.9.0 | Page Performance TRS | ~1 809 | 1 |
| v2.0.0 | KPI Expand Overlay | ~2 207 | 1 |
| v2.1.0 | Module Inventaire Tournant | ~2 731 | 1 |

**Version courante : v2.1.0**
