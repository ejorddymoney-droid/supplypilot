import { daysFromNow, TODAY } from '../utils/formatters';

export const APP_VERSION = "v3.0.0";

export const SUPPLIERS = [
  { id:1, nom:"AcierPlus Inc.", statut:"actif", delai_moyen:8, taux_conformite:94.2, taux_retard:6.1, pays:"Canada", email:"achat@acierplus.ca" },
  { id:2, nom:"HydroTech SA", statut:"actif", delai_moyen:12, taux_conformite:88.5, taux_retard:11.5, pays:"France", email:"orders@hydrotech.fr" },
  { id:3, nom:"ElectroParts GmbH", statut:"actif", delai_moyen:15, taux_conformite:91.7, taux_retard:8.3, pays:"Allemagne", email:"supply@electroparts.de" },
  { id:4, nom:"PackFlow Ltd.", statut:"inactif", delai_moyen:20, taux_conformite:72.3, taux_retard:27.7, pays:"Chine", email:"sales@packflow.cn" },
  { id:5, nom:"MétalPro Québec", statut:"actif", delai_moyen:5, taux_conformite:97.1, taux_retard:2.9, pays:"Canada", email:"commandes@metalpro.qc.ca" },
];

export const SUPPLIER_MAP = Object.fromEntries(SUPPLIERS.map(s => [s.id, s.nom]));

export const FAMILLES = [
  { name:"Électrique", count:61, valeur:57733481 },
  { name:"Mécanique", count:48, valeur:43739553 },
  { name:"MRO", count:44, valeur:42446102 },
  { name:"Sécurité", count:52, valeur:41647746 },
  { name:"Packaging", count:49, valeur:38231714 },
  { name:"Consommables", count:56, valeur:36054207 },
  { name:"Quincaillerie", count:51, valeur:35851153 },
  { name:"Hydraulique", count:39, valeur:29557574 },
];

export const COVERAGE_DIST = [
  { range:"<10j", count:42, color:"#ef4444" },
  { range:"10-20j", count:70, color:"#f97316" },
  { range:"20-30j", count:70, color:"#eab308" },
  { range:"30-45j", count:110, color:"#22c55e" },
  { range:"45-60j", count:108, color:"#06b6d4" },
];

export const ABC_DATA = [
  { classe:"A", count:183, pctValeur:80, color:"#f43f5e" },
  { classe:"B", count:111, pctValeur:15, color:"#f59e0b" },
  { classe:"C", count:106, pctValeur:5, color:"#6366f1" },
];

export const KPIS = {
  total_items:400, valeur_totale:325261528, eoq_moyen:204.0, rop_moyen:606.8,
  couverture_moyenne:32.1, taux_service:78.0, articles_rupture:0, articles_sous_seuil:88,
  nb_a:183, nb_b:111, nb_c:106, critiques:62, po_brouillon:6, po_a_valider:4,
  po_envoye:7, po_recu:9, po_clos:9, taches_ouvertes:6, alertes_total:25, violations_regles:6,
};

export const INITIAL_POS = [
  { po_id:1, po_number:"PO-2026-0001", sku:"SKU-0041", article:"Nano Bolt 305", supplier_id:1, qty:290, statut:"ENVOYE", prix_negocie:201.65, prix_paye:null, date_creation:"2026-01-22", created_by:"Jean Dupont" },
  { po_id:2, po_number:"PO-2026-0002", sku:"SKU-0059", article:"Premium Bearing 329", supplier_id:1, qty:74, statut:"BROUILLON", prix_negocie:218.28, prix_paye:null, date_creation:"2026-01-09", created_by:"Pierre Tremblay" },
  { po_id:3, po_number:"PO-2026-0003", sku:"SKU-0012", article:"Smart Label 218", supplier_id:5, qty:480, statut:"ENVOYE", prix_negocie:174.84, prix_paye:null, date_creation:"2026-03-20", created_by:"Pierre Tremblay" },
  { po_id:4, po_number:"PO-2026-0004", sku:"SKU-0028", article:"Ultra Sensor 112", supplier_id:3, qty:155, statut:"A_VALIDER", prix_negocie:312.40, prix_paye:null, date_creation:"2026-02-14", created_by:"Marie Lavoie" },
  { po_id:5, po_number:"PO-2026-0005", sku:"SKU-0005", article:"Industrial Fuse 357", supplier_id:3, qty:320, statut:"RECU", prix_negocie:245.96, prix_paye:251.22, date_creation:"2026-01-03", created_by:"Jean Dupont" },
  { po_id:6, po_number:"PO-2026-0006", sku:"SKU-0017", article:"Flex Relay 204", supplier_id:2, qty:410, statut:"CLOS", prix_negocie:189.50, prix_paye:187.30, date_creation:"2025-12-10", created_by:"Marie Lavoie" },
  { po_id:7, po_number:"PO-2026-0007", sku:"SKU-0033", article:"Core Valve 088", supplier_id:5, qty:98, statut:"A_VALIDER", prix_negocie:445.00, prix_paye:null, date_creation:"2026-03-01", created_by:"Jean Dupont" },
  { po_id:8, po_number:"PO-2026-0008", sku:"SKU-0002", article:"Nano Filter 397", supplier_id:2, qty:520, statut:"RECU", prix_negocie:211.40, prix_paye:215.60, date_creation:"2026-01-18", created_by:"Pierre Tremblay" },
  { po_id:9, po_number:"PO-2026-0009", sku:"SKU-0045", article:"Titan Motor 190", supplier_id:1, qty:185, statut:"BROUILLON", prix_negocie:380.20, prix_paye:null, date_creation:"2026-03-10", created_by:"Marie Lavoie" },
  { po_id:10, po_number:"PO-2026-0010", sku:"SKU-0008", article:"Pro Gasket 456", supplier_id:3, qty:600, statut:"ENVOYE", prix_negocie:78.90, prix_paye:null, date_creation:"2026-02-22", created_by:"Jean Dupont" },
  { po_id:11, po_number:"PO-2026-0011", sku:"SKU-0021", article:"Smart Switch 331", supplier_id:5, qty:210, statut:"CLOS", prix_negocie:156.75, prix_paye:154.20, date_creation:"2025-11-28", created_by:"Pierre Tremblay" },
  { po_id:12, po_number:"PO-2026-0012", sku:"SKU-0056", article:"Max Clamp 072", supplier_id:1, qty:340, statut:"RECU", prix_negocie:92.30, prix_paye:93.80, date_creation:"2026-02-05", created_by:"Marie Lavoie" },
  { po_id:13, po_number:"PO-2026-0013", sku:"SKU-0003", article:"Nano Bolt 013", supplier_id:2, qty:270, statut:"A_VALIDER", prix_negocie:195.00, prix_paye:null, date_creation:"2026-03-08", created_by:"Jean Dupont" },
  { po_id:14, po_number:"PO-2026-0014", sku:"SKU-0019", article:"Ultra Tube 599", supplier_id:3, qty:150, statut:"BROUILLON", prix_negocie:267.80, prix_paye:null, date_creation:"2026-03-12", created_by:"Pierre Tremblay" },
  { po_id:15, po_number:"PO-2026-0015", sku:"SKU-0067", article:"Flex Pump 211", supplier_id:5, qty:88, statut:"ENVOYE", prix_negocie:510.00, prix_paye:null, date_creation:"2026-02-28", created_by:"Marie Lavoie" },
  { po_id:16, po_number:"PO-2026-0016", sku:"SKU-0011", article:"Core Bearing 145", supplier_id:1, qty:430, statut:"CLOS", prix_negocie:175.40, prix_paye:172.90, date_creation:"2025-12-20", created_by:"Jean Dupont" },
  { po_id:17, po_number:"PO-2026-0017", sku:"SKU-0038", article:"Pro Sensor 422", supplier_id:2, qty:165, statut:"RECU", prix_negocie:298.50, prix_paye:302.10, date_creation:"2026-01-28", created_by:"Marie Lavoie" },
  { po_id:18, po_number:"PO-2026-0018", sku:"SKU-0074", article:"Titan Label 380", supplier_id:3, qty:500, statut:"ENVOYE", prix_negocie:45.20, prix_paye:null, date_creation:"2026-03-03", created_by:"Pierre Tremblay" },
  { po_id:19, po_number:"PO-2026-0019", sku:"SKU-0009", article:"Smart Coupling 287", supplier_id:5, qty:120, statut:"A_VALIDER", prix_negocie:420.00, prix_paye:null, date_creation:"2026-03-11", created_by:"Jean Dupont" },
  { po_id:20, po_number:"PO-2026-0020", sku:"SKU-0052", article:"Max Filter 019", supplier_id:1, qty:380, statut:"BROUILLON", prix_negocie:134.60, prix_paye:null, date_creation:"2026-03-13", created_by:"Marie Lavoie" },
];

export const INITIAL_TASKS = [
  { task_id:1, type:"Validation PO", related_po_id:2, assigned_to:"Marie Lavoie", status:"Ouverte", due_at:"2026-03-16", comment:"PO haute valeur — validation requise" },
  { task_id:2, type:"Approbation managériale", related_po_id:4, assigned_to:"Jean Dupont", status:"Ouverte", due_at:"2026-03-15", comment:"Qty > 2x EOQ" },
  { task_id:3, type:"Relance fournisseur", related_po_id:1, assigned_to:"Pierre Tremblay", status:"En cours", due_at:TODAY, comment:"Délai dépassé de 3 jours" },
  { task_id:4, type:"Vérification stock", related_po_id:5, assigned_to:"Sophie Gagnon", status:"Terminée", due_at:"2026-03-10", comment:"Stock confirmé après réception" },
  { task_id:5, type:"Validation PO", related_po_id:7, assigned_to:"Marie Lavoie", status:"Ouverte", due_at:daysFromNow(3), comment:"Nouveau fournisseur — vérification" },
  { task_id:6, type:"Approbation managériale", related_po_id:13, assigned_to:"Jean Dupont", status:"Ouverte", due_at:"2026-03-19", comment:"Article critique classe A" },
  { task_id:7, type:"Relance fournisseur", related_po_id:10, assigned_to:"Pierre Tremblay", status:"En cours", due_at:"2026-03-20", comment:"Accusé réception non reçu" },
  { task_id:8, type:"Vérification stock", related_po_id:8, assigned_to:"Sophie Gagnon", status:"Terminée", due_at:"2026-03-08", comment:"Écart quantité réception" },
  { task_id:9, type:"Validation PO", related_po_id:9, assigned_to:"Marie Lavoie", status:"Ouverte", due_at:"2026-03-21", comment:"Brouillon en attente" },
  { task_id:10, type:"Approbation managériale", related_po_id:14, assigned_to:"Jean Dupont", status:"Ouverte", due_at:"2026-03-22", comment:"Budget Q1 à vérifier" },
  { task_id:11, type:"Relance fournisseur", related_po_id:15, assigned_to:"Pierre Tremblay", status:"En cours", due_at:"2026-03-23", comment:"Confirmation date livraison" },
  { task_id:12, type:"Validation PO", related_po_id:19, assigned_to:"Sophie Gagnon", status:"Ouverte", due_at:"2026-03-24", comment:"Prix au-dessus du marché" },
];

export const INITIAL_EVENTS = [
  { event_id:1, date:"2026-03-14 09:12", type_event:"PO_CREATED", utilisateur:"Système", entite:"PurchaseOrder", entite_id:20, details:"PO créé automatiquement — règle réappro classe A", level:"INFO" },
  { event_id:2, date:"2026-03-14 09:10", type_event:"STOCK_ALERT", utilisateur:"Système", entite:"Item", entite_id:52, details:"Stock sous seuil minimum — couverture < 10 jours", level:"WARNING" },
  { event_id:3, date:"2026-03-14 08:45", type_event:"GUARDRAIL_BLOCKED", utilisateur:"Pierre Tremblay", entite:"PurchaseOrder", entite_id:14, details:"Quantité excède 2x EOQ — validation managériale requise", level:"WARNING" },
  { event_id:4, date:"2026-03-13 17:30", type_event:"PO_VALIDATED", utilisateur:"Marie Lavoie", entite:"PurchaseOrder", entite_id:13, details:"PO validé — transition A_VALIDER → ENVOYE", level:"INFO" },
  { event_id:5, date:"2026-03-13 16:22", type_event:"RULE_VIOLATION", utilisateur:"Jean Dupont", entite:"PurchaseOrder", entite_id:0, details:"Tentative création PO fournisseur inactif (PackFlow Ltd.) — bloqué", level:"ERROR" },
  { event_id:6, date:"2026-03-13 14:05", type_event:"PO_SENT", utilisateur:"Pierre Tremblay", entite:"PurchaseOrder", entite_id:18, details:"PO envoyé au fournisseur ElectroParts GmbH", level:"INFO" },
  { event_id:7, date:"2026-03-13 11:30", type_event:"STOCK_ALERT", utilisateur:"Système", entite:"Item", entite_id:8, details:"Alerte couverture < 10 jours — article classe A", level:"CRITICAL" },
  { event_id:8, date:"2026-03-12 16:45", type_event:"ITEM_UPDATED", utilisateur:"Sophie Gagnon", entite:"Item", entite_id:33, details:"Article mis à jour — recalcul EOQ effectué", level:"INFO" },
  { event_id:9, date:"2026-03-12 15:10", type_event:"GUARDRAIL_BLOCKED", utilisateur:"Système", entite:"PurchaseOrder", entite_id:0, details:"PO déjà existant en BROUILLON pour ce SKU — création bloquée", level:"WARNING" },
  { event_id:10, date:"2026-03-12 10:20", type_event:"PO_CREATED", utilisateur:"Jean Dupont", entite:"PurchaseOrder", entite_id:19, details:"PO créé manuellement — article critique", level:"INFO" },
  { event_id:11, date:"2026-03-11 14:30", type_event:"RULE_VIOLATION", utilisateur:"Système", entite:"PurchaseOrder", entite_id:0, details:"Qty <= 0 refusée — garde-fou activé", level:"ERROR" },
  { event_id:12, date:"2026-03-11 09:15", type_event:"STOCK_ALERT", utilisateur:"Système", entite:"Item", entite_id:15, details:"Stock sous seuil minimum détecté", level:"WARNING" },
  { event_id:13, date:"2026-03-10 17:00", type_event:"PO_VALIDATED", utilisateur:"Marie Lavoie", entite:"PurchaseOrder", entite_id:4, details:"Transition BROUILLON → A_VALIDER validée", level:"INFO" },
  { event_id:14, date:"2026-03-10 11:45", type_event:"GUARDRAIL_BLOCKED", utilisateur:"Système", entite:"PurchaseOrder", entite_id:0, details:"Impossible envoyer PO non validé — garde-fou actif", level:"ERROR" },
  { event_id:15, date:"2026-03-09 16:20", type_event:"ITEM_UPDATED", utilisateur:"Pierre Tremblay", entite:"Item", entite_id:71, details:"Mise à jour lead time fournisseur — recalcul ROP", level:"INFO" },
  { event_id:16, date:"2026-03-09 10:30", type_event:"STOCK_ALERT", utilisateur:"Système", entite:"Item", entite_id:3, details:"Couverture critique — 4.2 jours restants", level:"CRITICAL" },
  { event_id:17, date:"2026-03-08 15:45", type_event:"PO_SENT", utilisateur:"Jean Dupont", entite:"PurchaseOrder", entite_id:10, details:"PO envoyé au fournisseur ElectroParts GmbH", level:"INFO" },
  { event_id:18, date:"2026-03-08 09:00", type_event:"RULE_VIOLATION", utilisateur:"Système", entite:"Supplier", entite_id:4, details:"Fournisseur PackFlow Ltd. marqué inactif — 3 PO en attente réaffectés", level:"WARNING" },
];

export const CYCLE_FREQ = { A:1, B:3, C:6 };
export const ECART_SEUILS = { A:5, B:10, C:15 };

export const CAUSE_OPTIONS = [
  "Erreur de réception fournisseur",
  "Erreur de picking / expédition",
  "Casse / détérioration",
  "Vol / perte inexpliquée",
  "Erreur de saisie système",
  "Transfert non documenté",
  "Retour client non traité",
  "Obsolescence / péremption",
  "Autre",
];
export const ZONE_OPTIONS = ["Entrepôt principal","Zone de transit","Zone de quarantaine","Rack spécifique","Externe (sous-traitant)"];
export const ACTION_OPTIONS = [
  "Recompter l'article",
  "Vérifier bons de réception récents",
  "Vérifier bons de sortie récents",
  "Signaler au fournisseur",
  "Ajuster le stock système",
  "Aucune action — écart mineur accepté",
];
export const CRITICAL_CAUSES = ["Vol / perte inexpliquée","Casse / détérioration","Erreur de réception fournisseur"];

export const INITIAL_COUNTS = [
  { id:1, sku:"SKU-0003", date:"2026-02-15", stock_systeme:412, stock_compte:398, ecart:-14, ecart_pct:-3.4, statut:"Validé", compteur:"Sophie Gagnon", cause:"Erreur de picking / expédition", zone:"Entrepôt principal", actions:["Vérifier bons de sortie récents"], comment:"" },
  { id:2, sku:"SKU-0008", date:"2026-02-15", stock_systeme:285, stock_compte:285, ecart:0, ecart_pct:0, statut:"Validé", compteur:"Pierre Tremblay", cause:null, zone:"Entrepôt principal", actions:[], comment:"" },
  { id:3, sku:"SKU-0012", date:"2026-02-16", stock_systeme:520, stock_compte:487, ecart:-33, ecart_pct:-6.3, statut:"Investigation", compteur:"Sophie Gagnon", cause:"Casse / détérioration", zone:"Zone de transit", actions:["Recompter l'article","Signaler au fournisseur"], comment:"Emballage endommagé constaté" },
  { id:4, sku:"SKU-0021", date:"2026-02-18", stock_systeme:190, stock_compte:192, ecart:2, ecart_pct:1.1, statut:"Validé", compteur:"Marie Lavoie", cause:null, zone:"Entrepôt principal", actions:[], comment:"" },
  { id:5, sku:"SKU-0033", date:"2026-02-20", stock_systeme:340, stock_compte:301, ecart:-39, ecart_pct:-11.5, statut:"Investigation", compteur:"Pierre Tremblay", cause:"Vol / perte inexpliquée", zone:"Rack spécifique", actions:["Recompter l'article","Vérifier bons de sortie récents"], comment:"Zone non surveillée" },
  { id:6, sku:"SKU-0041", date:"2026-03-01", stock_systeme:156, stock_compte:160, ecart:4, ecart_pct:2.6, statut:"Validé", compteur:"Sophie Gagnon", cause:"Retour client non traité", zone:"Zone de transit", actions:["Ajuster le stock système"], comment:"" },
  { id:7, sku:"SKU-0002", date:"2026-03-01", stock_systeme:620, stock_compte:618, ecart:-2, ecart_pct:-0.3, statut:"Validé", compteur:"Marie Lavoie", cause:null, zone:"Entrepôt principal", actions:[], comment:"" },
  { id:8, sku:"SKU-0056", date:"2026-03-05", stock_systeme:445, stock_compte:412, ecart:-33, ecart_pct:-7.4, statut:"Validé", compteur:"Pierre Tremblay", cause:"Erreur de saisie système", zone:"Entrepôt principal", actions:["Ajuster le stock système"], comment:"Double saisie réception" },
  { id:9, sku:"SKU-0005", date:"2026-03-07", stock_systeme:278, stock_compte:250, ecart:-28, ecart_pct:-10.1, statut:"Investigation", compteur:"Sophie Gagnon", cause:"Erreur de réception fournisseur", zone:"Zone de quarantaine", actions:["Signaler au fournisseur","Vérifier bons de réception récents"], comment:"Qty livrée inférieure au BL" },
  { id:10, sku:"SKU-0009", date:"2026-03-10", stock_systeme:88, stock_compte:90, ecart:2, ecart_pct:2.3, statut:"Validé", compteur:"Marie Lavoie", cause:null, zone:"Entrepôt principal", actions:[], comment:"" },
  { id:11, sku:"SKU-0019", date:"2026-03-10", stock_systeme:310, stock_compte:275, ecart:-35, ecart_pct:-11.3, statut:"Investigation", compteur:"Pierre Tremblay", cause:"Transfert non documenté", zone:"Externe (sous-traitant)", actions:["Vérifier bons de sortie récents"], comment:"Envoi sous-traitant non tracé" },
  { id:12, sku:"SKU-0045", date:"2026-03-12", stock_systeme:203, stock_compte:198, ecart:-5, ecart_pct:-2.5, statut:"Validé", compteur:"Sophie Gagnon", cause:"Erreur de picking / expédition", zone:"Entrepôt principal", actions:["Aucune action — écart mineur accepté"], comment:"" },
];

export const MONTHLY_PRECISION = [
  { mois:"Oct", precision:91.2, comptages:45 },
  { mois:"Nov", precision:88.7, comptages:52 },
  { mois:"Déc", precision:85.3, comptages:38 },
  { mois:"Jan", precision:90.1, comptages:60 },
  { mois:"Fév", precision:92.5, comptages:55 },
  { mois:"Mars", precision:93.8, comptages:42 },
];

export const USERS = [
  { id:1, username:"admin", password:"admin123", role:"admin", nom:"Jean Dupont", poste:"Gestionnaire achats", initials:"JD", color:"#6366f1" },
  { id:2, username:"entrepot", password:"entrepot123", role:"entrepot", nom:"Marc Bélanger", poste:"Chef d'entrepôt", initials:"MB", color:"#f59e0b" },
  { id:3, username:"sophie", password:"sophie123", role:"entrepot", nom:"Sophie Gagnon", poste:"Préposée entrepôt", initials:"SG", color:"#10b981" },
  { id:4, username:"luc", password:"luc123", role:"entrepot", nom:"Luc Martineau", poste:"Manutentionnaire", initials:"LM", color:"#3b82f6" },
];

export const WAREHOUSE_DAILY_TASKS = [
  { id:1, assignee:"Marc Bélanger", task:"Réceptionner PO-2026-0001 (Nano Bolt 305)", priority:"Haute", done:false, action_type:"reception", po_ref:"PO-2026-0001" },
  { id:2, assignee:"Marc Bélanger", task:"Picking PO-2026-0010 (Pro Gasket 456)", priority:"Haute", done:false, action_type:"picking", po_ref:"PO-2026-0010" },
  { id:3, assignee:"Marc Bélanger", task:"Comptage allée B — articles classe A", priority:"Moyenne", done:false, action_type:"comptage", po_ref:null },
  { id:4, assignee:"Sophie Gagnon", task:"Réceptionner PO-2026-0003 (Smart Label 218)", priority:"Haute", done:false, action_type:"reception", po_ref:"PO-2026-0003" },
  { id:5, assignee:"Sophie Gagnon", task:"Ranger réception HydroTech SA", priority:"Moyenne", done:false, action_type:"rangement", po_ref:null },
  { id:6, assignee:"Sophie Gagnon", task:"Inventaire tournant — Zone transit", priority:"Basse", done:false, action_type:"comptage", po_ref:null },
  { id:7, assignee:"Luc Martineau", task:"Picking PO-2026-0010 (Pro Gasket 456)", priority:"Haute", done:false, action_type:"picking", po_ref:"PO-2026-0010" },
  { id:8, assignee:"Luc Martineau", task:"Consolidation palette secteur C", priority:"Moyenne", done:false, action_type:null, po_ref:null },
  { id:9, assignee:"Luc Martineau", task:"Nettoyage zone de quarantaine", priority:"Basse", done:false, action_type:null, po_ref:null },
];

export const PO_TRANSITIONS = {
  BROUILLON: { next: "A_VALIDER", label: "Valider" },
  A_VALIDER: { next: "ENVOYE", label: "Envoyer" },
  ENVOYE: { next: "RECU", label: "Réceptionner" },
  RECU: { next: "CLOS", label: "Clore" },
};

export const ASSIGNEES = ["Jean Dupont","Marie Lavoie","Pierre Tremblay","Sophie Gagnon","Marc Bélanger","Luc Martineau"];
