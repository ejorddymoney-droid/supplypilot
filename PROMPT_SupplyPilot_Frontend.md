# PROMPT — SupplyPilot : Dashboard Supply Chain / Procurement (Frontend Only)

Tu es un développeur frontend senior, expert en React, TypeScript, design système et applications métier supply chain. Ta mission est de créer un dashboard complet de pilotage supply chain / approvisionnement en une seule application React autonome (sans backend).

---

## 1. CONTEXTE PRODUIT

L'application s'appelle **SupplyPilot**. Elle transforme un modèle Excel de gestion d'inventaire EOQ/Pareto en un dashboard interactif de pilotage opérationnel.

Elle combine :
1. Pilotage inventaire (400 articles, classification ABC, EOQ, ROP, couverture stock)
2. Pilotage fournisseurs (5 fournisseurs avec scoring)
3. Workflow Purchase Orders complet (BROUILLON → A_VALIDER → ENVOYÉ → REÇU → CLOS)
4. Règles métier automatiques + garde-fous
5. Journal d'audit centralisé
6. KPI décisionnels temps réel

**Public cible** : gestionnaires achats, directeurs supply chain, contrôleurs inventaire.

---

## 2. STACK FRONTEND

- React (hooks, context)
- Recharts pour les graphiques
- Pas de framework CSS externe — styles inline uniquement
- Pas de backend — toutes les données vivent en mémoire React (state + context)
- Single-file React component (fichier .jsx unique exportant un `default function App()`)

---

## 3. DESIGN / UI

### Direction esthétique
- **Mode double** : dark mode (principal) + light mode avec toggle animé
- Style : professionnel, épuré, haute densité d'information sans surcharge
- Inspiration : dashboards fintech modernes (voir images de référence type iBanKo)

### Thème dark
- Background : `#0B0F1A`
- Surface : `#111827`
- Cards : `#1A2035`
- Accent principal : `#10B981` (vert émeraude)
- Danger : `#EF4444`, Warning : `#F59E0B`, Info : `#3B82F6`, Purple : `#8B5CF6`

### Thème light
- Background : `#F3F4F8`
- Surface/Cards : `#FFFFFF`
- Accent : `#059669`
- Cards avec `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` pour la hiérarchie

### Typographie
- Font : DM Sans (Google Fonts)
- Titres : 700, corps : 400-500
- Tailles : KPI values 28px, labels 12px uppercase, tableaux 13px

### Composants UI réutilisables à créer
- `KpiCard` : label, valeur, sous-texte, couleur accent, tendance %, **cliquable** (navigation)
- `Card` : conteneur avec titre, headerRight (pour bouton export), border-radius 16px
- `Badge` : statut coloré (A/B/C, Conforme/Sous seuil/Rupture, statuts PO, niveaux audit)
- `SearchInput` : champ avec icône loupe
- `FilterPills` : boutons toggle arrondis pour filtres
- `TableContainer` : wrapper overflow-x pour tableaux
- `Th` / `Td` : cellules standardisées
- `SortableTh` : header cliquable avec flèches ▲▼, couleur accent quand actif
- `ExportButton` : bouton CSV avec icône téléchargement
- `ActionBtn` : bouton avec feedback visuel (idle → loading "···" → "✓ OK" vert)
- `ThemeToggle` : switch animé lune/soleil
- `GlobalSearch` : overlay modal de recherche multi-entités (⌘K)
- `SlideOver` : panneau latéral glissant depuis la droite pour détails

---

## 4. ARCHITECTURE ÉTAT

### ThemeContext
- Deux palettes complètes (dark/light) dans un objet `THEMES`
- `ThemeContext` + `useTheme()` hook
- Toggle dans la sidebar, transitions 0.35s sur background/border/color

### DataContext
- État mutable centralisé dans App : `pos`, `tasks`, `events`, `statusHistory`
- Fonctions partagées : `transitionPO()`, `createPO()`, `setActivePage()`, `setSlideOver()`
- `useData()` hook pour accès depuis n'importe quelle page

### Données statiques
- `ITEMS` : 400 articles générés procéduralement avec seed déterministe
- `SUPPLIERS` : 5 fournisseurs (dont 1 inactif — PackFlow Ltd.)
- `INITIAL_POS` : 20 POs dans différents statuts
- `INITIAL_TASKS` : 12 tâches de validation
- `INITIAL_EVENTS` : 18 événements d'audit

---

## 5. GÉNÉRATION DES DONNÉES

### Articles (400)
Générer avec un seed pseudo-aléatoire déterministe (seed=42). Pour chaque article :
- SKU : `SKU-0001` à `SKU-0400`
- Nom : combinaison de [Max, Nano, Smart, Flex, Premium, Industrial, Ultra, Pro, Core, Titan] + [Coupling, Filter, Bolt, Fuse, Sensor, Valve, Relay, Pump, Bearing, Label, Switch, Motor, Gasket, Clamp, Tube] + numéro 3 chiffres
- Famille : une parmi [Électrique, Consommables, Hydraulique, MRO, Mécanique, Packaging, Quincaillerie, Sécurité]
- Demande annuelle : 1000–20000
- Coût unitaire : 10–500$
- Lead time : 2–32 jours
- Stock sécurité : 20–800
- Taux possession : parmi [0.18, 0.20, 0.25, 0.28, 0.30]
- Coût commande : 10–100$

### Calculs dérivés (formules obligatoires)
```
H = coût_unitaire × taux_possession
EOQ = √((2 × demande × coût_commande) / H)
ROP = (demande/365 × lead_time) + stock_sécurité
couverture = stock_net / (demande/365)
```

### Classification ABC (Pareto)
Trier par valeur annuelle (demande × coût) descendant. Cumuler :
- A : ≤ 80% cumulé
- B : ≤ 95% cumulé  
- C : > 95%

### Statut service
- Rupture : stock_net ≤ 0
- Sous seuil : stock_net < seuil_min
- Conforme : sinon

### Priorité
- Haute : classe A/B ET statut ≠ Conforme
- Moyenne : classe A/B ET Conforme
- Basse : classe C

---

## 6. SYSTÈME DE TRI (toutes les colonnes, tous les tableaux)

### Hook `useSortable`
- Gère `sortCol`, `sortDir`, `handleSort`, `sortData`
- Clic sur une colonne : tri descendant. Re-clic : ascendant. Autre colonne : reset descendant.
- Tri automatique : string (localeCompare), number, null-safe

### Tri ordinal pour colonnes catégorielles
Définir une map `ORDINAL_MAPS` pour que le tri respecte l'ordre métier :
```
priorite:       Haute=1, Moyenne=2, Basse=3
statut_service: Rupture=1, Sous seuil=2, Conforme=3
abc:            A=1, B=2, C=3
statut (PO):    BROUILLON=1, A_VALIDER=2, ENVOYE=3, RECU=4, CLOS=5
level (audit):  CRITICAL=1, ERROR=2, WARNING=3, INFO=4
status (tâche): Ouverte=1, En cours=2, Terminée=3
```

### Composant `SortableTh`
- Affiche ▲▼ à côté du titre
- Gris par défaut, accent (vert) quand actif
- Flèche active (▲ ou ▼) mise en évidence selon la direction

---

## 7. PAGES (10 pages avec sidebar)

### Navigation
Sidebar avec icônes SVG, label, indicateur actif (barre verte à gauche + background accent glow). Sidebar collapsible au clic sur le logo.

### Badges compteurs live sur la sidebar
- Articles critiques : nombre priorité haute (rouge)
- Purchase Orders : BROUILLON + A_VALIDER (orange)
- Tâches : ouvertes (rouge)
- Audit : ERROR + CRITICAL (rouge)

---

### PAGE 1 : Dashboard
**KPI Cards (6)** — tous cliquables vers la page pertinente :
- Articles actifs (→ Inventaire)
- Taux de service % (→ Critiques)
- Articles critiques (→ Critiques)
- Couverture moyenne (→ Inventaire)
- PO à traiter (→ Orders)
- Alertes actives (→ Audit)

**Graphiques (4)** :
1. Distribution ABC — ComposedChart (barres + ligne % valeur)
2. Couverture stock — BarChart par tranche (<10j, 10-20j, 20-30j, 30-45j, 45-60j) avec couleurs rouge→cyan
3. Valeur annuelle par famille — BarChart horizontal
4. Statut PO — PieChart donut avec légende

**Mini-tableaux (2)** — triables + "Voir tout →" cliquable :
- Articles critiques (top 6)
- PO en attente (top 5)

**Performance fournisseurs** : 5 cartes avec barre de conformité

**KPI Expand Overlay** — Cliquer sur le **titre** de chaque carte graphique ouvre un overlay plein écran détaillé. Le composant `Card` a un prop `onTitleClick` qui rend le titre cliquable (curseur pointer, couleur accent au hover, icône ↗ discrète). ESC pour fermer.

Le composant `KPIExpandOverlay` prend un `kpiId` et affiche :

**1. "Distribution ABC — Pareto" → `abc`**
- 5 mini-KPIs (valeur totale, % valeur A, % valeur B, % top 5, compteur A/B/C)
- Courbe Pareto top 50 : ComposedChart barres colorées par classe + ligne % cumulé
- Tableau top 20 articles (rang, SKU, valeur, % cumulé, ABC, famille) + export CSV
- Répartition ABC par famille avec barre % classe A

**2. "Couverture stock (jours)" → `couverture`**
- 5 mini-KPIs (couverture moyenne, articles <10j, 10-20j, >30j, risque global)
- Distribution fine 8 tranches (0-5j → 60j+, couleurs rouge→bleu)
- Couverture par classe ABC (moyenne + minimum) et par famille (moyenne + en danger)
- Tableau articles en danger <10j + export CSV

**3. "Valeur annuelle par famille" → `familles`**
- 4 mini-KPIs (valeur totale, famille #1, val moy/article, nb familles)
- Barres horizontales colorées + Pie chart répartition %
- Tableau détaillé 10 colonnes par famille + export CSV

**4. "Statut des Purchase Orders" → `po_statut`**
- 5 mini-KPIs par statut avec valeur $ engagée
- Donut volume + barres valeur par statut
- Indicateurs workflow (taux clôture, écart prix, PO ouverts)
- Tableau PO anciens non clos + export CSV

État : `expandedKPI` dans App (`null` | `"abc"` | `"couverture"` | `"familles"` | `"po_statut"`), partagé via DataContext.
Animation : `@keyframes kpiExpand { from { opacity:0; transform: scale(0.97); } to { opacity:1; transform: scale(1); } }`

---

### PAGE 2 : Inventaire
- Recherche + filtres ABC + filtres famille
- Tableau 400 articles, **toutes les 13 colonnes triables**
- Colonnes : SKU, Article, Famille, ABC, Demande/an, Coût unit., EOQ, ROP, Stock, Seuil, Couv.(j), Statut, Priorité
- Pagination (20/page)
- Export CSV
- Clic sur une ligne → SlideOver détail article

---

### PAGE 3 : Articles critiques
- 4 KPI cards (priorité haute, sous seuil, couverture <15j, classe A sous seuil)
- Tableau filtré (priorité Haute OU sous seuil), **10 colonnes triables**
- Bouton "Créer PO" par ligne (déclenche `createPO`)
- Export CSV

---

### PAGE 4 : Fournisseurs
- 4 KPI cards (actifs, délai moyen, conformité moyenne, à risque)
- Tableau 5 fournisseurs avec **7 colonnes triables**
- Barre de conformité visuelle
- Score calculé : `conformité×0.6 + (100-retard)×0.2 + ((30-délai)/30×100)×0.2`
- Clic ligne → SlideOver détail fournisseur
- Export CSV

---

### PAGE 5 : Purchase Orders
- 5 KPI cards par statut (compteurs live)
- Recherche + filtres par statut
- Tableau **9 colonnes triables**
- **Boutons d'action par statut** avec `ActionBtn` (feedback idle→loading→done) :
  - BROUILLON → "Valider" (orange)
  - A_VALIDER → "Envoyer" (bleu)
  - ENVOYÉ → "Réceptionner" (vert) — avec modal de confirmation
  - REÇU → "Clore" (violet) — avec modal de confirmation
  - CLOS → tiret
- Clic ligne → SlideOver détail PO (toutes les dates, prix)
- Export CSV

---

### PAGE 6 : Tâches
- 3 KPI cards (ouvertes, en cours, terminées)
- Filtres par statut
- Tableau **6 colonnes triables**
- Indicateur ⚠ rouge si échéance dépassée
- Export CSV

---

### PAGE 7 : Journal d'audit
- 4 KPI cards (total, warnings, erreurs, critiques)
- Filtres par niveau
- Tableau événements **7 colonnes triables**
- Section "Historique transitions PO" (apparaît dynamiquement après actions) — **6 colonnes triables**
- Export CSV sur les deux tableaux

---

### PAGE 8 : Performance TRS (Taux de Rendement Synthétique)
Module pédagogique interactif basé sur le module Excel `Performance_TRS`.

**Données par défaut (depuis le Excel)** :
- Temps planifié : 160h, Arrêts : 12h, Cadence théorique : 85/h, Qté totale : 11 800, Qté rejetée : 280

**Données historiques** :
- `TRS_MONTHLY` : 6 mois (Oct→Mars) avec dispo, perf, qual, trs par mois

**Formules** :
```
Temps fonctionnement = Temps planifié − Arrêts
Disponibilité = Temps fonctionnement / Temps planifié
Performance = (Qté totale / Temps fonctionnement) / Cadence théorique
Qualité = (Qté totale − Qté rejetée) / Qté totale
TRS = Disponibilité × Performance × Qualité
```

**Composant `GaugeChart`** — Jauge SVG semi-circulaire réutilisable :
- Arc de fond (gris border) + arc coloré (valeur) + aiguille + valeur % au centre
- Props : `value`, `label`, `color`, `size` (défaut 140)
- Niveaux automatiques : World Class ≥85%, Bon ≥75%, Acceptable ≥60%, Critique <60%
- Badge de niveau coloré sous la jauge

**Layout de la page** :
1. **4 KPI Cards** — Disponibilité, Performance, Qualité, TRS Global (couleurs dynamiques par seuil)
2. **Jauges (gauche)** — Card avec 4 `GaugeChart` en grille 4 colonnes
3. **Inputs (droite haut)** — Card "Inputs production" avec 5 champs `<input type="number">` éditables, bouton Réinitialiser. Recalcul temps réel à chaque modification.
4. **Résultats (droite bas)** — Card "Résultats calculés" : temps fonctionnement, cadence réelle, qtés bonnes, taux de rebut — tous dérivés en live
5. **Tendance 6 mois** — `ComposedChart` : 4 lignes (dispo, perf, qual, trs) + barres TRS semi-transparentes. Axe Y 60–100%. Export CSV.
6. **Historique mensuel (gauche)** — Tableau 6 lignes avec badge niveau coloré par mois
7. **Formules et repères (droite)** — 4 cartes pédagogiques (formule monospace + description) + grille 2×2 des repères industriels colorés

### PAGE 9 : Inventaire tournant (Cycle Count)
Module complet avec 4 onglets : Plan, Saisie, Historique, Analyse.

**Constantes** :
- `CYCLE_FREQ` : A=1 mois, B=3 mois, C=6 mois
- `ECART_SEUILS` : A=±5%, B=±10%, C=±15%
- `CAUSE_OPTIONS` : 9 causes racines (erreur réception, picking, casse, vol, saisie, transfert, retour, obsolescence, autre)
- `ZONE_OPTIONS` : 5 zones (entrepôt principal, transit, quarantaine, rack, externe)
- `ACTION_OPTIONS` : 6 actions correctives
- `CRITICAL_CAUSES` : vol, casse, erreur fournisseur → déclenchent tâche investigation auto
- `INITIAL_COUNTS` : 12 comptages seed historiques
- `MONTHLY_PRECISION` : 6 mois tendance

**Onglet Plan** :
- Génère auto la liste d'articles à compter selon `CYCLE_FREQ[abc]` et le mois courant
- Tri : non comptés d'abord, puis par couverture croissante
- Bouton "Compter" par ligne → bascule vers onglet Saisie
- Export CSV

**Onglet Saisie** :
- Input SKU avec datalist autocomplete + affichage info article (stock sys, classe, seuil)
- Input quantité comptée → calcul écart live (unités + %)
- Si écart ≤ seuil par classe → validation auto sans questionnaire
- Si écart > seuil → modal questionnaire obligatoire

**Questionnaire écart (modal)** :
- Q1 : Cause principale (radio unique, 9 options) — obligatoire
- Q2 : Zone stockage (radio unique, 5 options) — obligatoire
- Q3 : Actions correctives (checkbox multiple, 6 options)
- Q4 : Commentaire libre (textarea)
- Détection cause critique → avertissement rouge + tâche investigation auto
- Composants custom `RadioOption` + `CheckOption` stylisés

**Onglet Historique** :
- Tableau complet : date, SKU, article, stock sys, compté, écart, %, statut, compteur, cause
- Export CSV

**Onglet Analyse causes** :
- Donut répartition causes racines (PieChart)
- Tendance précision mensuelle (ComposedChart : barres comptages + ligne précision)
- Causes par classe ABC (tableau avec cause #1)
- Top zones problématiques (tableau)
- Précision par classe vs cible (A≥95%, B≥90%, C≥85%) avec barres de progression

**6 KPI cards en haut** : Précision, Comptages ce mois, Restants, En investigation, Valeur écarts, Jamais comptés

**Intégrations** :
- `stock_net` mis à jour après validation
- Événement audit `CYCLE_COUNT` (INFO/WARNING/ERROR selon écart)
- Tâche investigation si cause critique
- Badge sidebar bleu (restants à compter)
- KPI "Précision inventaire" ajouté au Dashboard (7ème carte, cliquable)

---

### PAGE 10 : Règles / Configuration
- Liste des 8 règles métier avec numéro, SI/ALORS, badge ACTIF
- Section formules EOQ/ROP/Couverture/ABC dans des cartes monospace

---

## 8. WORKFLOW PO COMPLET

### Transitions autorisées
```
BROUILLON → A_VALIDER → ENVOYÉ → REÇU → CLOS
```
Aucun saut possible. Map `PO_TRANSITIONS` avec `{ next, label }`.

### Fonction `createPO(item)`
1. Garde-fou qty ≤ 0 → toast erreur + log
2. Garde-fou PO déjà ouvert pour ce SKU → toast erreur + log
3. Garde-fou fournisseur inactif → toast erreur + log
4. Créer PO en BROUILLON avec qty = EOQ, prix = coût × 0.95
5. Créer entrée statusHistory (null → BROUILLON)
6. Créer tâche validation assignée à "Marie Lavoie"
7. Si qty > EOQ×2 : créer tâche approbation managériale + log WARNING
8. Log événement PO_CREATED
9. Toast succès + navigation vers page Orders

### Fonction `transitionPO(poId)`
1. Si BROUILLON et qty > EOQ×2 : créer tâche approbation + log WARNING
2. Si ENVOYÉ ou REÇU : ouvrir modal de confirmation avant exécution
3. Sinon : exécuter directement `doTransitionPO`

### Fonction `doTransitionPO(poId)`
1. Appliquer transition (changer statut)
2. Tracker les dates : date_validation, date_envoi, date_reception
3. À réception : générer prix_payé = prix_négocié × random(0.97, 1.03)
4. Enregistrer dans statusHistory
5. Log événement PO_TRANSITION
6. Toast succès
7. Sur ENVOYÉ ou CLOS : fermer automatiquement les tâches liées

---

## 9. GARDE-FOUS (8 règles)

| # | Condition | Action |
|---|-----------|--------|
| 1 | PO BROUILLON/A_VALIDER existe pour ce SKU | Bloquer création + log WARNING |
| 2 | Qty > EOQ × 2 | Tâche approbation managériale + log WARNING |
| 3 | Fournisseur inactif | Bloquer création PO + log ERROR |
| 4 | Qty ≤ 0 | Refuser + log ERROR |
| 5 | Envoi sans validation | Impossible (pas de transition BROUILLON→ENVOYÉ) |
| 6 | Réception sans envoi | Impossible (pas de transition A_VALIDER→REÇU) |
| 7 | PO clos → modification | Pas de bouton d'action + pas de transition |
| 8 | Toute violation | Événement audit avec niveau approprié |

---

## 10. OPTIMISATIONS UX REQUISES

### Recherche globale (⌘K / Ctrl+K)
- Overlay modal centré en haut
- Recherche instantanée à travers articles, POs, fournisseurs (min 2 caractères)
- Résultats avec badge type coloré, nom, sous-texte contextuel
- Clic → navigation + ouverture SlideOver
- Fermeture : ESC, clic extérieur, bouton ESC

### KPI Cards cliquables
- Chaque KPI du dashboard navigue vers la page pertinente
- Effet hover translateY(-2px), petite flèche → en bas à droite

### Panneau latéral (SlideOver)
- Clic sur une ligne de tableau → panneau glissant depuis la droite (420px)
- Détail complet : article (SKU, EOQ, ROP, stock, fournisseur), PO (dates, prix, statut), fournisseur (conformité, email)
- Animation slideRight 0.25s
- Fermeture : ESC, ✕, clic extérieur
- Les boutons d'action dans les tableaux ont `stopPropagation` pour ne pas ouvrir le panneau

### Export CSV
- Bouton ↓ CSV dans le headerRight de chaque Card contenant un tableau
- Exporte les données filtrées et triées avec colonnes visibles
- Encodage UTF-8 BOM pour compatibilité Excel
- Nom de fichier descriptif (inventaire.csv, purchase_orders.csv, etc.)

### Badges compteurs sidebar
- 4 items de nav avec compteur coloré : critiques, orders, tâches, audit
- Mise à jour temps réel

### Feedback inline boutons d'action
- 3 états visuels : texte → "···" (300ms) → "✓ OK" vert (1.2s) → reset
- Bouton désactivé pendant la transition
- Bordure et fond changent au vert pendant l'état "done"

### Modal de confirmation
- Pour les transitions Réceptionner et Clore uniquement
- Affiche PO number, transition actuelle → suivante avec badges
- Boutons Annuler / Confirmer

### Toast notifications
- Position fixed bottom-right
- Vert (succès) ou rouge (erreur) avec icône
- Auto-disparition 3s
- Animation slideIn

---

## 11. HEADER

- Titre de page dynamique + sous-titre "14 mars 2026 — Q1 2026"
- Bouton recherche globale avec indication ⌘K
- Icône cloche (navigue vers Audit) avec point rouge
- Bouton "+ Nouveau PO" (navigue vers Articles critiques)

---

## 12. CONTRAINTES TECHNIQUES

- **Fichier unique** : tout le code dans un seul fichier .jsx exportant `default function App()`
- **Pas de localStorage** : tout en mémoire React
- **Pas de router** : navigation par état `activePage`
- **Pas de dépendances externes** sauf React et Recharts
- **Icônes** : SVG inline dans un composant `Icon`
- **Responsive** : grilles auto-fit, overflow-x sur tableaux
- **Performance** : `useMemo` pour les filtrages/tris, `useCallback` pour les fonctions partagées

---

## 13. FORMAT DE LIVRAISON

Un seul fichier `.jsx` contenant dans cet ordre :
1. Imports React + Recharts
2. Données statiques (SUPPLIERS, FAMILLES, COVERAGE_DIST, ABC_DATA, KPIS)
3. Fonction generateItems() pour les 400 articles
4. Données initiales (INITIAL_POS, INITIAL_TASKS, INITIAL_EVENTS)
5. Thèmes (THEMES dark/light)
6. Contexts (ThemeContext, DataContext)
7. Transition map + Ordinal maps
8. Composants UI réutilisables
9. Hook useSortable + SortableTh
10. Composants utilitaires (exportCSV, ExportButton, GlobalSearch, SlideOver, ActionBtn)
11. KPIExpandOverlay (4 vues: abc, couverture, familles, po_statut) + CalcRowSimple
12. 10 composants de page (dont TRSPage avec GaugeChart, CycleCountPage avec RadioOption/CheckOption)
13. Configuration navigation (NAV_ITEMS, PAGES, PAGE_TITLES)
13. ThemeToggle
14. App() avec tout l'état, les fonctions métier, le rendu (sidebar, header, pages, modals, toasts, CSS)

---

## 14. VERSIONING ET TRAÇABILITÉ

### Constante de version
Déclarer `const APP_VERSION = "vX.Y.Z";` en tête de fichier, après les imports. Afficher dans :
- Le header (sous-titre, opacité 0.5)
- La sidebar (à côté du profil utilisateur, taille 9px, opacité 0.5)

### Convention
| Format | Signification |
|--------|--------------|
| **vX.0.0** | Changement majeur (nouvelle couche, refonte architecture) |
| **vX.Y.0** | Nouvelle fonctionnalité |
| **vX.Y.Z** | Correction de bug, ajustement mineur |

### À chaque modification
1. Incrémenter `APP_VERSION` dans le fichier
2. Documenter dans le CHANGELOG : date, fichiers impactés, résumé, changements détaillés, composants/état impactés
3. Mentionner la version de départ et d'arrivée dans la réponse

### Version courante : v2.1.0
