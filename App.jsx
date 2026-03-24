import { useState, useMemo, createContext, useContext, useCallback, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend, ComposedChart } from "recharts";

const APP_VERSION = "v2.9.0";

// ─── DATE UTILITIES ──────────────────────────────────────────────────────────
const NOW = new Date();
const TODAY = `${NOW.getFullYear()}-${String(NOW.getMonth()+1).padStart(2,'0')}-${String(NOW.getDate()).padStart(2,'0')}`;
const TODAY_DISPLAY = NOW.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' });
const QUARTER = `Q${Math.ceil((NOW.getMonth()+1)/3)} ${NOW.getFullYear()}`;
const formatDate = (d) => { if (!d) return "—"; const dt = typeof d === "string" ? new Date(d) : d; return isNaN(dt) ? d : dt.toLocaleDateString('fr-CA'); };
const daysAgo = (n) => { const d = new Date(NOW); d.setDate(d.getDate()-n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const daysFromNow = (n) => { const d = new Date(NOW); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const parseDecimal = (v) => { if (typeof v === 'number') return v; return parseFloat(String(v).replace(',','.')) || 0; };

// ─── DATA ────────────────────────────────────────────────────────────────────
const SUPPLIERS = [
  { id:1, nom:"AcierPlus Inc.", statut:"actif", delai_moyen:8, taux_conformite:94.2, taux_retard:6.1, pays:"Canada", email:"achat@acierplus.ca" },
  { id:2, nom:"HydroTech SA", statut:"actif", delai_moyen:12, taux_conformite:88.5, taux_retard:11.5, pays:"France", email:"orders@hydrotech.fr" },
  { id:3, nom:"ElectroParts GmbH", statut:"actif", delai_moyen:15, taux_conformite:91.7, taux_retard:8.3, pays:"Allemagne", email:"supply@electroparts.de" },
  { id:4, nom:"PackFlow Ltd.", statut:"inactif", delai_moyen:20, taux_conformite:72.3, taux_retard:27.7, pays:"Chine", email:"sales@packflow.cn" },
  { id:5, nom:"MétalPro Québec", statut:"actif", delai_moyen:5, taux_conformite:97.1, taux_retard:2.9, pays:"Canada", email:"commandes@metalpro.qc.ca" },
];

const SUPPLIER_MAP = Object.fromEntries(SUPPLIERS.map(s => [s.id, s.nom]));

const FAMILLES = [
  { name:"Électrique", count:61, valeur:57733481 },
  { name:"Mécanique", count:48, valeur:43739553 },
  { name:"MRO", count:44, valeur:42446102 },
  { name:"Sécurité", count:52, valeur:41647746 },
  { name:"Packaging", count:49, valeur:38231714 },
  { name:"Consommables", count:56, valeur:36054207 },
  { name:"Quincaillerie", count:51, valeur:35851153 },
  { name:"Hydraulique", count:39, valeur:29557574 },
];

const COVERAGE_DIST = [
  { range:"<10j", count:42, color:"#ef4444" },
  { range:"10-20j", count:70, color:"#f97316" },
  { range:"20-30j", count:70, color:"#eab308" },
  { range:"30-45j", count:110, color:"#22c55e" },
  { range:"45-60j", count:108, color:"#06b6d4" },
];

const ABC_DATA = [
  { classe:"A", count:183, pctValeur:80, color:"#f43f5e" },
  { classe:"B", count:111, pctValeur:15, color:"#f59e0b" },
  { classe:"C", count:106, pctValeur:5, color:"#6366f1" },
];

const KPIS = {
  total_items:400, valeur_totale:325261528, eoq_moyen:204.0, rop_moyen:606.8,
  couverture_moyenne:32.1, taux_service:78.0, articles_rupture:0, articles_sous_seuil:88,
  nb_a:183, nb_b:111, nb_c:106, critiques:62, po_brouillon:6, po_a_valider:4,
  po_envoye:7, po_recu:9, po_clos:9, taches_ouvertes:6, alertes_total:25, violations_regles:6,
};

// Generate items from Excel data patterns
function generateItems() {
  const families = ["Électrique","Consommables","Hydraulique","MRO","Mécanique","Packaging","Quincaillerie","Sécurité"];
  const prefixes = ["Max","Nano","Smart","Flex","Premium","Industrial","Ultra","Pro","Core","Titan"];
  const types = ["Coupling","Filter","Bolt","Fuse","Sensor","Valve","Relay","Pump","Bearing","Label","Switch","Motor","Gasket","Clamp","Tube"];
  const items = [];
  const rng = (min,max) => Math.floor(Math.random()*((max-min)+1))+min;
  
  // Use seeded pseudo-random
  let seed = 42;
  const rand = () => { seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
  
  for (let i=0; i<400; i++) {
    const dem = Math.floor(rand()*19000)+1000;
    const cout = Math.floor(rand()*490*100)/100+10;
    const lt = Math.floor(rand()*30)+2;
    const ss = Math.floor(rand()*800)+20;
    const tp = [0.18,0.20,0.25,0.28,0.30][Math.floor(rand()*5)];
    const cc = Math.floor(rand()*90*100)/100+10;
    const va = dem*cout;
    const h = cout*tp;
    const eoq = Math.sqrt((2*dem*cc)/h);
    const cj = dem/365;
    const rop = cj*lt+ss;
    const sn = Math.floor(cj*(rand()*55+5));
    const sm = Math.floor(ss*1.2);
    const couv = sn/cj;
    const statut = sn<=0?"Rupture":(sn<sm?"Sous seuil":"Conforme");
    items.push({
      id:i+1, sku:`SKU-${String(i+1).padStart(4,'0')}`,
      article:`${prefixes[Math.floor(rand()*prefixes.length)]} ${types[Math.floor(rand()*types.length)]} ${String(Math.floor(rand()*500)).padStart(3,'0')}`,
      famille:families[Math.floor(rand()*families.length)],
      demande:dem, cout_unitaire:cout, lead_time:lt, stock_securite:ss,
      taux_possession:tp, cout_commande:cc, valeur_annuelle:va,
      h_annuel:h, eoq:Math.round(eoq), cmd_an:+(dem/eoq).toFixed(1),
      rop:Math.round(rop), stock_net:sn, seuil_min:sm,
      couverture:+couv.toFixed(1), statut_service:statut,
      supplier_id:[1,2,3,5,1,3,5,2][Math.floor(rand()*8)],
    });
  }
  // Sort by valeur desc for ABC
  items.sort((a,b)=>b.valeur_annuelle-a.valeur_annuelle);
  const totalVal = items.reduce((s,it)=>s+it.valeur_annuelle,0);
  let cumul = 0;
  items.forEach(it => {
    cumul += it.valeur_annuelle;
    it.abc = cumul/totalVal<=0.80?"A":(cumul/totalVal<=0.95?"B":"C");
    it.priorite = it.abc!=="C"&&it.statut_service!=="Conforme"?"Haute":(it.abc!=="C"?"Moyenne":"Basse");
  });
  return items;
}

const ITEMS = generateItems();

const INITIAL_POS = [
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

const INITIAL_TASKS = [
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

const INITIAL_EVENTS = [
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

// ─── CYCLE COUNT (INVENTAIRE TOURNANT) ───────────────────────────────────────
const CYCLE_FREQ = { A:1, B:3, C:6 }; // months between counts
const ECART_SEUILS = { A:5, B:10, C:15 }; // % threshold per class

const CAUSE_OPTIONS = [
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
const ZONE_OPTIONS = ["Entrepôt principal","Zone de transit","Zone de quarantaine","Rack spécifique","Externe (sous-traitant)"];
const ACTION_OPTIONS = [
  "Recompter l'article",
  "Vérifier bons de réception récents",
  "Vérifier bons de sortie récents",
  "Signaler au fournisseur",
  "Ajuster le stock système",
  "Aucune action — écart mineur accepté",
];
const CRITICAL_CAUSES = ["Vol / perte inexpliquée","Casse / détérioration","Erreur de réception fournisseur"];

const INITIAL_COUNTS = [
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

const MONTHLY_PRECISION = [
  { mois:"Oct", precision:91.2, comptages:45 },
  { mois:"Nov", precision:88.7, comptages:52 },
  { mois:"Déc", precision:85.3, comptages:38 },
  { mois:"Jan", precision:90.1, comptages:60 },
  { mois:"Fév", precision:92.5, comptages:55 },
  { mois:"Mars", precision:93.8, comptages:42 },
];

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    isLight: false,
    bg: "#0B0F1A",
    surface: "#111827",
    card: "#1A2035",
    cardHover: "#1E2742",
    border: "#2A3454",
    borderLight: "#374268",
    text: "#E8ECF4",
    textMuted: "#8B95B0",
    textDim: "#5C6682",
    accent: "#10B981",
    accentDim: "#065F46",
    accentGlow: "rgba(16,185,129,0.15)",
    danger: "#EF4444",
    dangerDim: "rgba(239,68,68,0.15)",
    warning: "#F59E0B",
    warningDim: "rgba(245,158,11,0.15)",
    info: "#3B82F6",
    infoDim: "rgba(59,130,246,0.15)",
    purple: "#8B5CF6",
    purpleDim: "rgba(139,92,246,0.15)",
  },
  light: {
    isLight: true,
    bg: "#F3F4F8",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    cardHover: "#F0F2F7",
    border: "#E2E5ED",
    borderLight: "#CBD0DC",
    text: "#1A1D26",
    textMuted: "#5F6778",
    textDim: "#9098A9",
    accent: "#059669",
    accentDim: "#A7F3D0",
    accentGlow: "rgba(5,150,105,0.10)",
    danger: "#DC2626",
    dangerDim: "rgba(220,38,38,0.08)",
    warning: "#D97706",
    warningDim: "rgba(217,119,6,0.08)",
    info: "#2563EB",
    infoDim: "rgba(37,99,235,0.08)",
    purple: "#7C3AED",
    purpleDim: "rgba(124,58,237,0.08)",
  },
};

const ThemeContext = createContext(THEMES.dark);
const useTheme = () => useContext(ThemeContext);

const DataContext = createContext(null);
const useData = () => useContext(DataContext);

// ─── AUTH SYSTEM ─────────────────────────────────────────────────────────────
const USERS = [
  { id:1, username:"admin", password:"admin123", role:"admin", nom:"Jean Dupont", poste:"Gestionnaire achats", initials:"JD", color:"#6366f1" },
  { id:2, username:"entrepot", password:"entrepot123", role:"entrepot", nom:"Marc Bélanger", poste:"Chef d'entrepôt", initials:"MB", color:"#f59e0b" },
  { id:3, username:"sophie", password:"sophie123", role:"entrepot", nom:"Sophie Gagnon", poste:"Préposée entrepôt", initials:"SG", color:"#10b981" },
  { id:4, username:"luc", password:"luc123", role:"entrepot", nom:"Luc Martineau", poste:"Manutentionnaire", initials:"LM", color:"#3b82f6" },
];

const WAREHOUSE_DAILY_TASKS = [
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

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// Workflow transition map
const PO_TRANSITIONS = {
  BROUILLON: { next: "A_VALIDER", label: "Valider" },
  A_VALIDER: { next: "ENVOYE", label: "Envoyer" },
  ENVOYE: { next: "RECU", label: "Réceptionner" },
  RECU: { next: "CLOS", label: "Clore" },
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    inventory: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    critical: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    suppliers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    orders: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    tasks: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    audit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    trs: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>,
    cyclecount: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    chevron: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    arrowUp: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    arrowDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    externalLink: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  };
  return icons[name] || null;
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-CA').format(Math.round(n));
const fmtM = (n) => `${(n/1000000).toFixed(1)}M`;

const Badge = ({ children, variant="default" }) => {
  const COLORS = useTheme();
  const styles = {
    A: { background:"rgba(244,63,94,0.15)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.3)" },
    B: { background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)" },
    C: { background:"rgba(99,102,241,0.15)", color:"#6366f1", border:"1px solid rgba(99,102,241,0.3)" },
    Conforme: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    "Sous seuil": { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    Rupture: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Haute: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Moyenne: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    Basse: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    BROUILLON: { background:"rgba(107,114,128,0.15)", color:"#9ca3af", border:"1px solid rgba(107,114,128,0.3)" },
    A_VALIDER: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    ENVOYE: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    RECU: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    CLOS: { background:COLORS.purpleDim, color:COLORS.purple, border:"1px solid rgba(139,92,246,0.3)" },
    actif: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    inactif: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Ouverte: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    "En cours": { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    "Terminée": { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    INFO: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    WARNING: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    ERROR: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    CRITICAL: { background:"rgba(239,68,68,0.25)", color:"#ff6b6b", border:"1px solid rgba(239,68,68,0.5)" },
    default: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
  };
  const s = styles[children] || styles[variant] || styles.default;
  return <span style={{ ...s, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600, letterSpacing:"0.02em", whiteSpace:"nowrap", display:"inline-block" }}>{children}</span>;
};

const KpiCard = ({ label, value, sub, icon, color, trend, onClick }) => {
  const COLORS = useTheme();
  if (color === undefined) color = COLORS.accent;
  return (
  <div onClick={onClick} style={{ background:COLORS.card, borderRadius:16, padding:"22px 24px", border:`1px solid ${COLORS.border}`, position:"relative", overflow:"hidden", minWidth:0, boxShadow: COLORS.isLight ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition:"background 0.35s, border-color 0.35s, transform 0.15s", cursor:onClick?"pointer":"default" }}
    onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform="translateY(-2px)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; }}>
    <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right, ${color}15, transparent)`, borderRadius:"0 16px 0 0" }}/>
    <div style={{ fontSize:12, color:COLORS.textMuted, fontWeight:500, marginBottom:8, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:700, color:COLORS.text, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:COLORS.textDim, marginTop:6 }}>{sub}</div>}
    {trend && <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8, fontSize:12, color:trend>0?COLORS.accent:COLORS.danger }}><Icon name={trend>0?"arrowUp":"arrowDown"} size={14}/>{Math.abs(trend)}%</div>}
    {onClick && <div style={{ position:"absolute", bottom:8, right:12, fontSize:10, color:COLORS.textDim, opacity:0.5 }}>→</div>}
  </div>
);
};

const Card = ({ title, children, style={}, headerRight, onTitleClick }) => {
  const COLORS = useTheme();
  return (
  <div style={{ background:COLORS.card, borderRadius:16, border:`1px solid ${COLORS.border}`, overflow:"hidden", boxShadow: COLORS.isLight ? "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" : "none", transition:"background 0.35s, border-color 0.35s, box-shadow 0.35s", ...style }}>
    {title && <div style={{ padding:"16px 20px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span onClick={onTitleClick} style={{ fontSize:14, fontWeight:600, color:COLORS.text, letterSpacing:"0.01em", cursor:onTitleClick?"pointer":"default", display:"flex", alignItems:"center", gap:6, transition:"color 0.15s" }}
        onMouseEnter={e=>{ if(onTitleClick) e.currentTarget.style.color=COLORS.accent; }}
        onMouseLeave={e=>{ if(onTitleClick) e.currentTarget.style.color=COLORS.text; }}>
        {title}
        {onTitleClick && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity:0.4 }}><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>}
      </span>
      {headerRight}
    </div>}
    <div style={{ padding:"16px 20px" }}>{children}</div>
  </div>
);
};

const TableContainer = ({ children }) => (
  <div style={{ overflowX:"auto", width:"100%" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>{children}</table>
  </div>
);

const Th = ({ children, style={}, tip }) => {
  const COLORS = useTheme();
  return <th title={tip} style={{ textAlign:"left", padding:"10px 12px", color:COLORS.textMuted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${COLORS.border}`, whiteSpace:"nowrap", cursor:tip?"help":"default", ...style }}>{children}</th>;
};

const Td = ({ children, style={} }) => {
  const COLORS = useTheme();
  return <td style={{ padding:"10px 12px", color:COLORS.text, borderBottom:`1px solid ${COLORS.border}22`, whiteSpace:"nowrap", ...style }}>{children}</td>;
};

// ─── SORTABLE TABLE SYSTEM ───────────────────────────────────────────────────
const ORDINAL_MAPS = {
  priorite:       { "Haute":1, "Moyenne":2, "Basse":3 },
  statut_service: { "Rupture":1, "Sous seuil":2, "Conforme":3 },
  abc:            { "A":1, "B":2, "C":3 },
  statut:         { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
  level:          { "CRITICAL":1, "ERROR":2, "WARNING":3, "INFO":4 },
  status:         { "Ouverte":1, "En cours":2, "Terminée":3 },
  old_status:     { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
  new_status:     { "BROUILLON":1, "A_VALIDER":2, "ENVOYE":3, "RECU":4, "CLOS":5 },
};

const useSortable = (defaultCol=null, defaultDir="desc") => {
  const [sortCol, setSortCol] = useState(defaultCol);
  const [sortDir, setSortDir] = useState(defaultDir);
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };
  const sortData = (data, accessor) => {
    if (!sortCol) return data;
    const ordMap = ORDINAL_MAPS[sortCol];
    return [...data].sort((a, b) => {
      let va = accessor ? accessor(a, sortCol) : a[sortCol];
      let vb = accessor ? accessor(b, sortCol) : b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (ordMap) {
        va = ordMap[va] ?? 999;
        vb = ordMap[vb] ?? 999;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  };
  return { sortCol, sortDir, handleSort, sortData };
};

const SortableTh = ({ col, sortCol, sortDir, onSort, children, style={}, tip }) => {
  const COLORS = useTheme();
  const isActive = sortCol === col;
  return (
    <th onClick={() => onSort(col)} title={tip}
      style={{
        textAlign:"left", padding:"10px 12px", fontWeight:600, fontSize:11,
        textTransform:"uppercase", letterSpacing:"0.06em",
        borderBottom:`1px solid ${COLORS.border}`, whiteSpace:"nowrap",
        cursor:"pointer", userSelect:"none",
        color: isActive ? COLORS.accent : COLORS.textMuted,
        transition:"color 0.15s",
        ...style,
      }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        {children}
        <span style={{ display:"inline-flex", flexDirection:"column", lineHeight:1, fontSize:8, opacity: isActive ? 1 : 0.3, transition:"opacity 0.15s" }}>
          <span style={{ color: isActive && sortDir==="asc" ? COLORS.accent : COLORS.textDim }}>▲</span>
          <span style={{ color: isActive && sortDir==="desc" ? COLORS.accent : COLORS.textDim, marginTop:-2 }}>▼</span>
        </span>
      </span>
    </th>
  );
};

const SearchInput = ({ value, onChange, placeholder="Rechercher..." }) => {
  const COLORS = useTheme();
  return (
  <div style={{ position:"relative", width:260 }}>
    <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:COLORS.textDim }}><Icon name="search" size={16}/></div>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"8px 12px 8px 36px", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:10, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box" }}
    />
  </div>
);
};

const FilterPills = ({ options, selected, onSelect }) => {
  const COLORS = useTheme();
  return (
  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
    {options.map(o => (
      <button key={o} onClick={()=>onSelect(o===selected?null:o)}
        style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:500, border:`1px solid ${o===selected?COLORS.accent:COLORS.border}`, background:o===selected?COLORS.accentGlow:"transparent", color:o===selected?COLORS.accent:COLORS.textMuted, cursor:"pointer", transition:"all 0.2s" }}>
        {o}
      </button>
    ))}
  </div>
);
};

const CustomTooltip = ({ active, payload, label }) => {
  const COLORS = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:COLORS.textMuted, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||COLORS.text, fontWeight:600 }}>{p.name}: {typeof p.value==='number'?fmt(p.value):p.value}</div>)}
    </div>
  );
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const exportCSV = (data, columns, filename) => {
  const header = columns.map(c => c.label).join(",");
  const rows = data.map(row => columns.map(c => {
    let v = typeof c.key === "function" ? c.key(row) : row[c.key];
    if (v == null) v = "";
    v = String(v).replace(/"/g, '""');
    return `"${v}"`;
  }).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const ExportButton = ({ data, columns, filename }) => {
  const COLORS = useTheme();
  return (
    <button onClick={() => exportCSV(data, columns, filename)}
      style={{ padding:"4px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, fontSize:11, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.accent;e.currentTarget.style.color=COLORS.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.color=COLORS.textMuted;}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      CSV
    </button>
  );
};

// ─── GLOBAL SEARCH ───────────────────────────────────────────────────────────
const GlobalSearch = ({ onNavigate, onClose }) => {
  const COLORS = useTheme();
  const { pos } = useData();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (q.length < 2) return [];
    const ql = q.toLowerCase();
    const out = [];
    ITEMS.filter(i => i.article.toLowerCase().includes(ql) || i.sku.toLowerCase().includes(ql)).slice(0,5)
      .forEach(i => out.push({ type:"Article", label:i.article, sub:`${i.sku} · ${i.abc} · ${i.statut_service}`, page:"inventory", data:i }));
    pos.filter(p => p.po_number.toLowerCase().includes(ql) || p.article.toLowerCase().includes(ql)).slice(0,4)
      .forEach(p => out.push({ type:"PO", label:p.po_number, sub:`${p.article} · ${p.statut}`, page:"orders", data:p }));
    SUPPLIERS.filter(s => s.nom.toLowerCase().includes(ql)).slice(0,3)
      .forEach(s => out.push({ type:"Fournisseur", label:s.nom, sub:`${s.pays} · ${s.statut}`, page:"suppliers", data:s }));
    return out;
  }, [q, pos]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:100, zIndex:1001 }} onClick={onClose}>
      <div style={{ width:540, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:`1px solid ${COLORS.border}` }}>
          <Icon name="search" size={18}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher articles, POs, fournisseurs..."
            style={{ flex:1, background:"transparent", border:"none", color:COLORS.text, fontSize:15, outline:"none" }}/>
          <span onClick={onClose} style={{ padding:"2px 8px", borderRadius:6, background:COLORS.surface, color:COLORS.textDim, fontSize:11, cursor:"pointer", border:`1px solid ${COLORS.border}` }}>ESC</span>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight:360, overflowY:"auto", padding:6 }}>
            {results.map((r,i) => (
              <div key={i} onClick={()=>{onNavigate(r.page, r.data); onClose();}} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:5, background:r.type==="Article"?COLORS.infoDim:r.type==="PO"?COLORS.accentGlow:COLORS.purpleDim, color:r.type==="Article"?COLORS.info:r.type==="PO"?COLORS.accent:COLORS.purple }}>{r.type}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.label}</div>
                  <div style={{ fontSize:11, color:COLORS.textDim }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {q.length >= 2 && results.length === 0 && (
          <div style={{ padding:24, textAlign:"center", color:COLORS.textDim, fontSize:13 }}>Aucun résultat pour « {q} »</div>
        )}
        {q.length < 2 && (
          <div style={{ padding:20, textAlign:"center", color:COLORS.textDim, fontSize:12 }}>Tapez au moins 2 caractères...</div>
        )}
      </div>
    </div>
  );
};

// ─── SLIDE-OVER DETAIL ───────────────────────────────────────────────────────
const SlideOver = ({ data, type, onClose }) => {
  const COLORS = useTheme();
  const { setTasks, tasks, events, setEvents, pos, showToast, addEvent } = useData();
  const auth = useAuth();
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  if (!data) return null;

  const ASSIGNEES = ["Jean Dupont","Marie Lavoie","Pierre Tremblay","Sophie Gagnon","Marc Bélanger","Luc Martineau"];

  const Row = ({ label, value, color }) => (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:12, color:COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:color||COLORS.text, textAlign:"right", maxWidth:220 }}>{value}</span>
    </div>
  );

  const handleAssign = (taskId, assignee) => {
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, assigned_to: assignee } : t));
    addEvent("TASK_REASSIGNED", "Task", taskId, `Tâche #${taskId} réassignée à ${assignee}`, "INFO");
    showToast(`Tâche réassignée à ${assignee}`);
  };

  const handleAddComment = (taskId) => {
    if (!newComment.trim()) return;
    setTasks(prev => prev.map(t => {
      if (t.task_id !== taskId) return t;
      const comments = t.comments || [];
      return { ...t, comments: [...comments, { text: newComment, by: auth?.user?.nom || "Admin", date: TODAY }] };
    }));
    setNewComment("");
    showToast("Commentaire ajouté");
  };

  const handleAddNote = (eventId) => {
    if (!newNote.trim()) return;
    setEvents(prev => prev.map(e => {
      if (e.event_id !== eventId) return e;
      const notes = e.notes || [];
      return { ...e, notes: [...notes, { text: newNote, by: auth?.user?.nom || "Admin", date: TODAY }] };
    }));
    setNewNote("");
    showToast("Note ajoutée");
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: newStatus, ...(newStatus === "Terminée" ? { completed_at: TODAY } : {}) } : t));
    showToast(`Statut → ${newStatus}`);
  };

  const title = type === "item" ? "Détail article" : type === "po" ? "Détail PO" : type === "task" ? "Détail tâche" : type === "event" ? "Détail événement" : "Détail fournisseur";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1002, display:"flex" }} onClick={onClose}>
      <div style={{ flex:1 }}/>
      <div onClick={e=>e.stopPropagation()} style={{
        width:440, background:COLORS.card, borderLeft:`1px solid ${COLORS.border}`, height:"100%",
        boxShadow:"-10px 0 40px rgba(0,0,0,0.3)", overflowY:"auto", animation:"slideRight 0.25s ease",
      }}>
        <div style={{ padding:"20px 24px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:COLORS.card, zIndex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:COLORS.text }}>{title}</div>
          <button onClick={onClose} style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8, color:COLORS.textMuted, cursor:"pointer", padding:"4px 10px", fontSize:12 }}>✕</button>
        </div>
        <div style={{ padding:"16px 24px" }}>
          {type === "item" && <>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>{data.article}</div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}><Badge>{data.abc}</Badge><Badge>{data.statut_service}</Badge><Badge>{data.priorite}</Badge></div>
            <Row label="SKU" value={data.sku}/><Row label="Famille" value={data.famille}/><Row label="Demande annuelle" value={fmt(data.demande)}/>
            <Row label="Coût unitaire" value={`$${data.cout_unitaire?.toFixed(2)}`}/><Row label="EOQ" value={fmt(data.eoq)} color={COLORS.accent}/>
            <Row label="ROP" value={fmt(data.rop)}/><Row label="Stock net" value={fmt(data.stock_net)} color={data.stock_net<data.seuil_min?COLORS.danger:COLORS.accent}/>
            <Row label="Seuil minimum" value={fmt(data.seuil_min)}/><Row label="Couverture" value={`${data.couverture?.toFixed(1)} jours`} color={data.couverture<15?COLORS.danger:data.couverture<30?COLORS.warning:COLORS.accent}/>
            <Row label="Lead time" value={`${data.lead_time} jours`}/><Row label="Fournisseur" value={SUPPLIER_MAP[data.supplier_id] || "—"}/>
          </>}
          {type === "po" && <>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.accent, marginBottom:4 }}>{data.po_number}</div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}><Badge>{data.statut}</Badge>{data.documents?.length > 0 && <span style={{ fontSize:10, color:COLORS.textDim }}>📎 {data.documents.length}</span>}</div>
            <Row label="Article" value={data.article}/><Row label="SKU" value={data.sku}/><Row label="Fournisseur" value={SUPPLIER_MAP[data.supplier_id] || "—"}/>
            <Row label="Quantité" value={data.qty_recue ? `${data.qty_recue} reçu / ${data.qty} cmd` : data.qty}/>
            <Row label="Prix négocié" value={`$${data.prix_negocie?.toFixed(2)}`}/><Row label="Prix payé" value={data.prix_paye ? `$${data.prix_paye.toFixed(2)}` : "—"}/>
            <Row label="Créé par" value={data.created_by}/>{data.received_by && <Row label="Réceptionné par" value={data.received_by}/>}
            {data.reception_probleme && data.reception_probleme !== "Aucun — conforme" && <Row label="Problème" value={data.reception_probleme} color={COLORS.danger}/>}
            <div style={{ marginTop:20, marginBottom:8, fontSize:12, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em" }}>Timeline du PO</div>
            <div style={{ position:"relative", paddingLeft:20 }}>
              <div style={{ position:"absolute", left:7, top:8, bottom:8, width:2, background:COLORS.border }}/>
              {[{label:"Création",date:data.date_creation,color:"#6b7280"},{label:"Validation",date:data.date_validation,color:"#f59e0b"},{label:"Envoi",date:data.date_envoi,color:"#3b82f6"},{label:"Réception",date:data.date_reception,color:"#10b981"},{label:"Clôture",date:data.statut==="CLOS"?data.date_reception:null,color:"#8b5cf6"}].map((step,i)=>{
                const done=step.date!=null; return (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14, position:"relative" }}>
                  <div style={{ width:16, height:16, borderRadius:8, border:`2px solid ${done?step.color:COLORS.border}`, background:done?step.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                    {done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div><div style={{ fontSize:12, fontWeight:done?600:400, color:done?COLORS.text:COLORS.textDim }}>{step.label}</div>
                  <div style={{ fontSize:11, color:done?step.color:COLORS.textDim }}>{done?formatDate(step.date):"En attente"}</div></div>
                </div>);
              })}
            </div>
          </>}
          {type === "task" && (() => {
            const t = tasks.find(tk => tk.task_id === data.task_id) || data;
            const po = pos.find(p => p.po_id === t.related_po_id);
            const comments = t.comments || [];
            return <>
              <div style={{ fontSize:16, fontWeight:700, color:COLORS.text, marginBottom:4 }}>{t.type}</div>
              <div style={{ display:"flex", gap:6, marginBottom:16 }}><Badge>{t.status}</Badge></div>
              {po && <Row label="PO lié" value={po.po_number}/>}
              <Row label="Échéance" value={formatDate(t.due_at)} color={new Date(t.due_at)<new Date(TODAY)&&t.status!=="Terminée"?COLORS.danger:COLORS.text}/>
              {/* Status change */}
              <div style={{ marginTop:16, marginBottom:8, fontSize:12, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em" }}>Changer le statut</div>
              <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                {["Ouverte","En cours","Terminée"].map(s => (
                  <button key={s} onClick={()=>handleStatusChange(t.task_id, s)}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${t.status===s?COLORS.accent:COLORS.border}`,
                      background:t.status===s?COLORS.accentGlow:"transparent", color:t.status===s?COLORS.accent:COLORS.textMuted,
                      fontSize:11, fontWeight:t.status===s?600:400, cursor:"pointer" }}>{s}</button>
                ))}
              </div>
              {/* Assignee */}
              <div style={{ marginBottom:8, fontSize:12, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em" }}>Assigné à</div>
              <select value={t.assigned_to} onChange={e=>handleAssign(t.task_id, e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:13, outline:"none", marginBottom:16, fontFamily:"inherit", cursor:"pointer" }}>
                {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {/* Comments */}
              <div style={{ marginBottom:8, fontSize:12, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em" }}>Commentaires ({comments.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12, maxHeight:220, overflowY:"auto" }}>
                {t.comment && <div style={{ padding:"10px 12px", borderRadius:8, background:COLORS.surface, border:`1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize:12, color:COLORS.text }}>{t.comment}</div>
                  <div style={{ fontSize:10, color:COLORS.textDim, marginTop:4 }}>Note initiale</div>
                </div>}
                {comments.map((c, i) => (
                  <div key={i} style={{ padding:"10px 12px", borderRadius:8, background:COLORS.surface, border:`1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize:12, color:COLORS.text }}>{c.text}</div>
                    <div style={{ fontSize:10, color:COLORS.textDim, marginTop:4 }}>{c.by} — {formatDate(c.date)}</div>
                  </div>
                ))}
                {comments.length === 0 && !t.comment && <div style={{ fontSize:12, color:COLORS.textDim, padding:8 }}>Aucun commentaire</div>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} rows={2} placeholder="Ajouter un commentaire..."
                  style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:12, outline:"none", resize:"vertical", fontFamily:"inherit" }}/>
                <button onClick={()=>handleAddComment(t.task_id)} disabled={!newComment.trim()}
                  style={{ padding:"8px 14px", borderRadius:8, border:"none", background:COLORS.accent, color:"white", fontSize:11, fontWeight:600, cursor:"pointer", alignSelf:"flex-end", opacity:newComment.trim()?1:0.4 }}>Envoyer</button>
              </div>
            </>;
          })()}
          {type === "event" && (() => {
            const ev = events.find(e => e.event_id === data.event_id) || data;
            const notes = ev.notes || [];
            return <>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><Badge>{ev.level}</Badge><span style={{ fontSize:14, fontWeight:600, color:COLORS.text }}>{ev.type_event}</span></div>
              <Row label="Date" value={ev.date}/><Row label="Utilisateur" value={ev.utilisateur}/><Row label="Entité" value={ev.entite}/><Row label="ID" value={`#${ev.entite_id}`}/>
              <div style={{ marginTop:12, padding:"12px 14px", borderRadius:10, background:COLORS.surface, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontSize:11, fontWeight:600, color:COLORS.textMuted, marginBottom:6 }}>DÉTAILS</div>
                <div style={{ fontSize:13, color:COLORS.text, lineHeight:1.5 }}>{ev.details}</div>
              </div>
              <div style={{ marginTop:20, marginBottom:8, fontSize:12, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em" }}>Notes ({notes.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12, maxHeight:220, overflowY:"auto" }}>
                {notes.length === 0 && <div style={{ fontSize:12, color:COLORS.textDim, padding:8 }}>Aucune note ajoutée</div>}
                {notes.map((n, i) => (
                  <div key={i} style={{ padding:"10px 12px", borderRadius:8, background:COLORS.surface, border:`1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize:12, color:COLORS.text }}>{n.text}</div>
                    <div style={{ fontSize:10, color:COLORS.textDim, marginTop:4 }}>{n.by} — {formatDate(n.date)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} rows={2} placeholder="Ajouter une note..."
                  style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:12, outline:"none", resize:"vertical", fontFamily:"inherit" }}/>
                <button onClick={()=>handleAddNote(ev.event_id)} disabled={!newNote.trim()}
                  style={{ padding:"8px 14px", borderRadius:8, border:"none", background:COLORS.accent, color:"white", fontSize:11, fontWeight:600, cursor:"pointer", alignSelf:"flex-end", opacity:newNote.trim()?1:0.4 }}>Envoyer</button>
              </div>
            </>;
          })()}
          {type === "supplier" && <>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>{data.nom}</div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}><Badge>{data.statut}</Badge></div>
            <Row label="Pays" value={data.pays}/><Row label="Délai moyen" value={`${data.delai_moyen} jours`}/>
            <Row label="Conformité" value={`${data.taux_conformite}%`} color={data.taux_conformite>90?COLORS.accent:COLORS.warning}/>
            <Row label="Taux retard" value={`${data.taux_retard}%`} color={data.taux_retard>10?COLORS.danger:COLORS.text}/><Row label="Email" value={data.email}/>
          </>}
        </div>
      </div>
    </div>
  );
};

// ─── ACTION BUTTON WITH FEEDBACK ─────────────────────────────────────────────
const ActionBtn = ({ onClick, borderColor, bgColor, textColor, children }) => {
  const [state, setState] = useState("idle"); // idle | loading | done
  const handleClick = () => {
    setState("loading");
    setTimeout(() => { onClick(); setState("done"); setTimeout(() => setState("idle"), 1200); }, 300);
  };
  return (
    <button onClick={handleClick} disabled={state !== "idle"}
      style={{ padding:"3px 10px", borderRadius:5, border:`1px solid ${state==="done"?"#10B981":borderColor}`,
        background:state==="done"?"rgba(16,185,129,0.15)":bgColor,
        color:state==="done"?"#10B981":textColor,
        fontSize:10, fontWeight:600, cursor:state==="idle"?"pointer":"default",
        transition:"all 0.2s", minWidth:70, textAlign:"center", opacity:state==="loading"?0.6:1,
      }}>
      {state === "loading" ? "···" : state === "done" ? "✓ OK" : children}
    </button>
  );
};

// ─── PAGES ───────────────────────────────────────────────────────────────────

// DASHBOARD
const DashboardPage = () => {
  const COLORS = useTheme();
  const { pos, tasks, setActivePage, setExpandedKPI, counts } = useData();
  const critSort = useSortable("couverture","asc");
  const poSort = useSortable("date_creation","desc");
  const poStatutData = [
    { name:"Brouillon", value:pos.filter(p=>p.statut==="BROUILLON").length, color:"#6b7280" },
    { name:"À valider", value:pos.filter(p=>p.statut==="A_VALIDER").length, color:"#f59e0b" },
    { name:"Envoyé", value:pos.filter(p=>p.statut==="ENVOYE").length, color:"#3b82f6" },
    { name:"Reçu", value:pos.filter(p=>p.statut==="RECU").length, color:"#10b981" },
    { name:"Clos", value:pos.filter(p=>p.statut==="CLOS").length, color:"#8b5cf6" },
  ];

  const criticalItems = ITEMS.filter(i=>i.priorite==="Haute").slice(0,6);
  const pendingPOs = pos.filter(p=>p.statut==="A_VALIDER"||p.statut==="BROUILLON").slice(0,5);
  const openTasks = tasks.filter(t=>t.status==="Ouverte").length;
  const poToProcess = pos.filter(p=>p.statut==="BROUILLON"||p.statut==="A_VALIDER").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
        <KpiCard label="Articles actifs" value={KPIS.total_items} sub={`${KPIS.nb_a}A / ${KPIS.nb_b}B / ${KPIS.nb_c}C`} color={COLORS.accent} onClick={()=>setActivePage("inventory")}/>
        <KpiCard label="Taux de service" value={`${KPIS.taux_service}%`} sub={`${KPIS.articles_sous_seuil} sous seuil`} color={KPIS.taux_service>85?COLORS.accent:COLORS.warning} trend={-2.3} onClick={()=>setActivePage("critical")}/>
        <KpiCard label="Articles critiques" value={KPIS.critiques} sub="Priorité haute A/B" color={COLORS.danger} onClick={()=>setActivePage("critical")}/>
        <KpiCard label="Couverture moy." value={`${KPIS.couverture_moyenne}j`} sub="Objectif > 30 jours" color={COLORS.info} onClick={()=>setActivePage("inventory")}/>
        <KpiCard label="PO à traiter" value={poToProcess} sub={`${openTasks} tâches ouvertes`} color={COLORS.warning} onClick={()=>setActivePage("orders")}/>
        <KpiCard label="Alertes actives" value={KPIS.alertes_total} sub={`${KPIS.violations_regles} violations règles`} color={COLORS.danger} onClick={()=>setActivePage("audit")}/>
        {(() => { const mc = counts.filter(c=>c.date>="2026-03-01"); const p = mc.length>0?mc.filter(c=>Math.abs(c.ecart_pct)<=ECART_SEUILS[ITEMS.find(i=>i.sku===c.sku)?.abc||"C"]).length/mc.length*100:100; return <KpiCard label="Précision inventaire" value={`${p.toFixed(1)}%`} sub={`${mc.length} comptages ce mois`} color={p>=95?COLORS.accent:p>=85?COLORS.warning:COLORS.danger} onClick={()=>setActivePage("cyclecount")}/>; })()}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Distribution ABC — Pareto" headerRight={<span style={{ fontSize:11, color:COLORS.textDim }}>400 articles</span>} onTitleClick={()=>setExpandedKPI("abc")}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={ABC_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="classe" tick={{ fill:COLORS.textMuted, fontSize:12 }} axisLine={{ stroke:COLORS.border }} />
              <YAxis yAxisId="left" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} unit="%" />
              <Tooltip content={<CustomTooltip/>} />
              <Bar yAxisId="left" dataKey="count" name="Articles" radius={[6,6,0,0]} barSize={50}>
                {ABC_DATA.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
              <Line yAxisId="right" dataKey="pctValeur" name="% valeur" stroke="#10b981" strokeWidth={2} dot={{ fill:"#10b981", r:5 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Couverture stock (jours)" headerRight={<span style={{ fontSize:11, color:COLORS.textDim }}>Distribution</span>} onTitleClick={()=>setExpandedKPI("couverture")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={COVERAGE_DIST}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="range" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={{ stroke:COLORS.border }} />
              <YAxis tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip/>} />
              <Bar dataKey="count" name="Articles" radius={[6,6,0,0]} barSize={40}>
                {COVERAGE_DIST.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Valeur annuelle par famille" onTitleClick={()=>setExpandedKPI("familles")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FAMILLES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
              <XAxis type="number" tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={false} tickFormatter={v=>fmtM(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} width={95} />
              <Tooltip content={<CustomTooltip/>} formatter={v=>fmtM(v)} />
              <Bar dataKey="valeur" name="Valeur" fill={COLORS.accent} radius={[0,6,6,0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Statut des Purchase Orders" onTitleClick={()=>setExpandedKPI("po_statut")}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={poStatutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {poStatutData.map((d,i)=><Cell key={i} fill={d.color} stroke="none"/>)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
              {poStatutData.map(d => (
                <div key={d.name} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:d.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:COLORS.textMuted, flex:1 }}>{d.name}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:COLORS.text }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Articles critiques" headerRight={<span onClick={()=>setActivePage("critical")} style={{ fontSize:11, color:COLORS.danger, cursor:"pointer" }}>Voir tout →</span>}>
          <TableContainer>
            <thead><tr>
              <SortableTh col="article" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Article</SortableTh>
              <SortableTh col="abc" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>ABC</SortableTh>
              <SortableTh col="stock_net" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Stock</SortableTh>
              <SortableTh col="couverture" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Couv.</SortableTh>
              <SortableTh col="statut_service" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Statut</SortableTh>
            </tr></thead>
            <tbody>
              {critSort.sortData(criticalItems).map(it => (
                <tr key={it.id}>
                  <Td><span style={{ fontWeight:500 }}>{it.article}</span><br/><span style={{ fontSize:11, color:COLORS.textDim }}>{it.sku}</span></Td>
                  <Td><Badge>{it.abc}</Badge></Td>
                  <Td>{fmt(it.stock_net)}</Td>
                  <Td style={{ color:it.couverture<15?COLORS.danger:COLORS.warning }}>{it.couverture.toFixed(0)}j</Td>
                  <Td><Badge>{it.statut_service}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="PO en attente" headerRight={<span onClick={()=>setActivePage("orders")} style={{ fontSize:11, color:COLORS.warning, cursor:"pointer" }}>Voir tout →</span>}>
          <TableContainer>
            <thead><tr>
              <SortableTh col="po_number" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>PO</SortableTh>
              <SortableTh col="article" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Article</SortableTh>
              <SortableTh col="qty" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Qty</SortableTh>
              <SortableTh col="statut" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Statut</SortableTh>
              <SortableTh col="created_by" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Créé par</SortableTh>
            </tr></thead>
            <tbody>
              {poSort.sortData(pendingPOs).map(po => (
                <tr key={po.po_id}>
                  <Td style={{ fontWeight:600, color:COLORS.accent }}>{po.po_number}</Td>
                  <Td>{po.article}</Td>
                  <Td>{po.qty}</Td>
                  <Td><Badge>{po.statut}</Badge></Td>
                  <Td style={{ color:COLORS.textMuted }}>{po.created_by}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      </div>

      {/* Supplier summary */}
      <Card title="Performance fournisseurs">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12 }}>
          {SUPPLIERS.map(s => (
            <div key={s.id} style={{ background:COLORS.surface, borderRadius:12, padding:16, border:`1px solid ${COLORS.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:COLORS.text }}>{s.nom.split(' ')[0]}</span>
                <Badge>{s.statut}</Badge>
              </div>
              <div style={{ fontSize:11, color:COLORS.textDim, marginBottom:4 }}>Conformité</div>
              <div style={{ background:COLORS.bg, borderRadius:6, height:6, overflow:"hidden", marginBottom:8 }}>
                <div style={{ width:`${s.taux_conformite}%`, height:"100%", background:s.taux_conformite>90?COLORS.accent:s.taux_conformite>80?COLORS.warning:COLORS.danger, borderRadius:6, transition:"width 0.3s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11 }}>
                <span style={{ color:COLORS.textMuted }}>{s.taux_conformite}%</span>
                <span style={{ color:COLORS.textMuted }}>{s.delai_moyen}j délai</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// INVENTORY
const InventoryPage = () => {
  const COLORS = useTheme();
  const { setSlideOver, addEvent, showToast, pos, createPO } = useData();
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [abcFilter, setAbcFilter] = useState(null);
  const [familleFilter, setFamilleFilter] = useState(null);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("valeur_annuelle","desc");
  const [page, setPage] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const handleImportItems = (rows) => {
    let added = 0, updated = 0;
    rows.forEach(row => {
      const sku = row.sku || row.SKU;
      if (!sku) return;
      const existing = ITEMS.find(i => i.sku === sku);
      if (existing) {
        if (row.nom) existing.article = row.nom;
        if (row.famille) existing.famille = row.famille;
        if (row.stock_net) existing.stock_net = parseInt(row.stock_net) || existing.stock_net;
        if (row.demande_annuelle) existing.demande = parseInt(row.demande_annuelle) || existing.demande;
        if (row.cout_unitaire) existing.cout_unitaire = parseFloat(row.cout_unitaire) || existing.cout_unitaire;
        if (row.seuil_min) existing.seuil_min = parseInt(row.seuil_min) || existing.seuil_min;
        updated++;
      } else {
        const id = ITEMS.length + 1;
        const dem = parseInt(row.demande_annuelle) || 1000;
        const cout = parseFloat(row.cout_unitaire) || 50;
        const cc = parseFloat(row.cout_commande) || 25;
        const tp = 0.25;
        const sn = parseInt(row.stock_net) || 100;
        const sm = parseInt(row.seuil_min) || 80;
        const ss = parseInt(row.stock_securite) || 50;
        const lt = parseInt(row.lead_time_jours) || 10;
        const h = cout * tp;
        const eoq = h > 0 ? Math.round(Math.sqrt((2 * dem * cc) / h)) : 100;
        const rop = Math.round((dem / 365 * lt) + ss);
        const couv = dem > 0 ? +(sn / (dem / 365)).toFixed(1) : 999;
        ITEMS.push({
          id, sku, article: row.nom || sku, famille: row.famille || "Autre",
          abc: "C", demande: dem, cout_unitaire: cout, cout_commande: cc, taux_possession: tp,
          stock_net: sn, seuil_min: sm, stock_securite: ss, lead_time: lt,
          eoq, rop, couverture: couv, supplier_id: 1,
          valeur_annuelle: dem * cout,
          statut_service: sn <= 0 ? "Rupture" : sn < sm ? "Sous seuil" : "Conforme",
          priorite: "Basse",
        });
        added++;
      }
    });
    addEvent("IMPORT_ITEMS", "Item", 0, `Import CSV: ${added} ajoutés, ${updated} mis à jour (${rows.length} lignes)`, "INFO");
    showToast(`Import terminé — ${added} ajoutés, ${updated} mis à jour`);
    setShowImport(false);
    setRefreshKey(k => k + 1);
  };

  const filtered = useMemo(() => {
    let data = [...ITEMS];
    if (search) data = data.filter(i => i.article.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));
    if (abcFilter) data = data.filter(i => i.abc === abcFilter);
    if (familleFilter) data = data.filter(i => i.famille === familleFilter);
    return sortData(data);
  }, [search, abcFilter, familleFilter, sortCol, sortDir]);

  const paged = filtered.slice(page*pageSize, (page+1)*pageSize);
  const totalPages = Math.ceil(filtered.length/pageSize);
  const csvCols = [{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"famille",label:"Famille"},{key:"abc",label:"ABC"},{key:"demande",label:"Demande/an"},{key:"cout_unitaire",label:"Coût unit."},{key:"eoq",label:"EOQ"},{key:"rop",label:"ROP"},{key:"stock_net",label:"Stock"},{key:"seuil_min",label:"Seuil"},{key:"couverture",label:"Couverture (j)"},{key:"statut_service",label:"Statut"},{key:"priorite",label:"Priorité"}];

  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={c=>{handleSort(c);setPage(0);}} tip={tip}>{children}</SortableTh>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(0);}} />
        <FilterPills options={["A","B","C"]} selected={abcFilter} onSelect={v=>{setAbcFilter(v);setPage(0);}}/>
        <FilterPills options={["Électrique","Mécanique","MRO","Hydraulique","Packaging","Consommables","Quincaillerie","Sécurité"]} selected={familleFilter} onSelect={v=>{setFamilleFilter(v);setPage(0);}}/>
        <span style={{ marginLeft:"auto", fontSize:12, color:COLORS.textMuted }}>{filtered.length} articles</span>
      </div>
      <Card headerRight={<div style={{ display:"flex", gap:6 }}>{auth?.user?.role === "admin" && <button onClick={()=>setShowImport(true)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.info}`, background:`${COLORS.info}15`, color:COLORS.info, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>📥 Importer CSV</button>}<ExportButton data={filtered} columns={csvCols} filename="inventaire"/></div>}>
        <TableContainer>
          <thead>
            <tr>
              <S col="sku" tip="Identifiant unique de l'article">SKU</S>
              <S col="article" tip="Nom de l'article">Article</S>
              <S col="famille" tip="Catégorie de l'article">Famille</S>
              <S col="abc" tip="Classification Pareto — A: 80% valeur, B: 15%, C: 5%">ABC</S>
              <S col="demande" tip="Quantité consommée par année">Demande/an</S>
              <S col="cout_unitaire" tip="Prix d'achat unitaire">Coût unit.</S>
              <S col="eoq" tip="Economic Order Quantity — quantité optimale de commande">EOQ</S>
              <S col="rop" tip="Reorder Point — seuil de déclenchement de commande">ROP</S>
              <S col="stock_net" tip="Quantité actuellement en stock">Stock</S>
              <S col="seuil_min" tip="Stock minimum avant alerte">Seuil</S>
              <S col="couverture" tip="Nombre de jours de stock restant au rythme actuel">Couv. (j)</S>
              <S col="statut_service" tip="Conforme, Sous seuil ou Rupture">Statut</S>
              <Th tip="Statut du bon de commande en cours pour cet article">PO</Th>
            </tr>
          </thead>
          <tbody>
            {paged.map(it => {
              const activePO = pos.find(p => p.sku === it.sku && p.statut !== "CLOS");
              const statusColors = { BROUILLON:"#6b7280", A_VALIDER:"#f59e0b", ENVOYE:"#3b82f6", RECU:"#10b981" };
              const statusSteps = ["BROUILLON","A_VALIDER","ENVOYE","RECU"];
              const stepIdx = activePO ? statusSteps.indexOf(activePO.statut) : -1;
              return (
              <tr key={it.id} style={{ transition:"background 0.15s", cursor:"pointer" }} onClick={()=>setSlideOver({data:it,type:"item"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Td style={{ fontWeight:600, color:COLORS.accent, fontSize:12 }}>{it.sku}</Td>
                <Td style={{ fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>{it.article}</Td>
                <Td style={{ color:COLORS.textMuted }}>{it.famille}</Td>
                <Td><Badge>{it.abc}</Badge></Td>
                <Td>{fmt(it.demande)}</Td>
                <Td>${it.cout_unitaire.toFixed(2)}</Td>
                <Td>{fmt(it.eoq)}</Td>
                <Td>{fmt(it.rop)}</Td>
                <Td style={{ fontWeight:600, color:it.stock_net<it.seuil_min?COLORS.danger:COLORS.text }}>{fmt(it.stock_net)}</Td>
                <Td style={{ color:COLORS.textDim }}>{fmt(it.seuil_min)}</Td>
                <Td style={{ color:it.couverture<15?COLORS.danger:it.couverture<30?COLORS.warning:COLORS.accent }}>{it.couverture.toFixed(0)}j</Td>
                <Td><Badge>{it.statut_service}</Badge></Td>
                <Td onClick={e=>e.stopPropagation()}>
                  {activePO ? (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ display:"flex", gap:2 }}>
                        {statusSteps.map((s, i) => (
                          <div key={s} style={{ width:14, height:4, borderRadius:2, background:i<=stepIdx ? statusColors[statusSteps[Math.min(i, stepIdx)]] || COLORS.border : COLORS.border, transition:"background 0.2s" }}/>
                        ))}
                      </div>
                      <span style={{ fontSize:9, color:statusColors[activePO.statut], fontWeight:600 }}>{activePO.po_number}</span>
                    </div>
                  ) : (
                    <button onClick={()=>createPO(it)} style={{ padding:"2px 8px", borderRadius:4, border:`1px solid ${COLORS.accent}40`, background:`${COLORS.accent}10`, color:COLORS.accent, fontSize:9, fontWeight:600, cursor:"pointer" }}>+ PO</button>
                  )}
                </Td>
              </tr>
              );
            })}
          </tbody>
        </TableContainer>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, paddingTop:12, borderTop:`1px solid ${COLORS.border}` }}>
          <span style={{ fontSize:12, color:COLORS.textMuted }}>Page {page+1} / {totalPages}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:12 }}>← Préc.</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, cursor:"pointer", fontSize:12 }}>Suiv. →</button>
          </div>
        </div>
      </Card>
      {showImport && <ImportModal type="items" onClose={()=>setShowImport(false)} onImport={handleImportItems}/>}
    </div>
  );
};

// CRITICAL ITEMS
const CriticalPage = () => {
  const COLORS = useTheme();
  const { createPO, setSlideOver } = useData();
  const criticals = useMemo(() => ITEMS.filter(i => i.priorite==="Haute" || i.statut_service==="Sous seuil"), []);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("couverture","asc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const sorted = sortData(criticals).slice(0,30);
  const csvCols = [{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"famille",label:"Famille"},{key:"abc",label:"ABC"},{key:"stock_net",label:"Stock net"},{key:"seuil_min",label:"Seuil min"},{key:"eoq",label:"EOQ"},{key:"rop",label:"ROP"},{key:"couverture",label:"Couverture (j)"},{key:"statut_service",label:"Statut"},{key:r=>SUPPLIER_MAP[r.supplier_id]||"",label:"Fournisseur"}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <KpiCard label="Priorité haute" value={ITEMS.filter(i=>i.priorite==="Haute").length} color={COLORS.danger}/>
        <KpiCard label="Sous seuil" value={ITEMS.filter(i=>i.statut_service==="Sous seuil").length} color={COLORS.warning}/>
        <KpiCard label="Couverture < 15j" value={ITEMS.filter(i=>i.couverture<15).length} color={COLORS.danger}/>
        <KpiCard label="Classe A sous seuil" value={ITEMS.filter(i=>i.abc==="A"&&i.statut_service!=="Conforme").length} color="#f43f5e"/>
      </div>
      <Card title={`Articles critiques — ${criticals.length} articles`} headerRight={<ExportButton data={sorted} columns={csvCols} filename="articles_critiques"/>}>
        <TableContainer>
          <thead>
            <tr><S col="sku">SKU</S><S col="article">Article</S><S col="famille">Famille</S><S col="abc">ABC</S><S col="stock_net">Stock net</S><S col="seuil_min">Seuil min</S><S col="eoq">EOQ</S><S col="rop">ROP</S><S col="couverture">Couv. (j)</S><S col="statut_service">Statut</S><Th>Fournisseur</Th><Th>Action</Th></tr>
          </thead>
          <tbody>
            {sorted.map(it => (
              <tr key={it.id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:it,type:"item"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Td style={{ fontWeight:600, color:COLORS.accent, fontSize:12 }}>{it.sku}</Td>
                <Td style={{ fontWeight:500 }}>{it.article}</Td>
                <Td style={{ color:COLORS.textMuted }}>{it.famille}</Td>
                <Td><Badge>{it.abc}</Badge></Td>
                <Td style={{ fontWeight:600, color:COLORS.danger }}>{fmt(it.stock_net)}</Td>
                <Td>{fmt(it.seuil_min)}</Td>
                <Td>{fmt(it.eoq)}</Td>
                <Td>{fmt(it.rop)}</Td>
                <Td style={{ color:it.couverture<15?COLORS.danger:COLORS.warning }}>{it.couverture.toFixed(0)}j</Td>
                <Td><Badge>{it.statut_service}</Badge></Td>
                <Td style={{ fontSize:12, color:COLORS.textMuted }}>{SUPPLIER_MAP[it.supplier_id]?.split(' ')[0]}</Td>
                <Td><button onClick={(e)=>{e.stopPropagation();createPO(it);}} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>Créer PO</button></Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </div>
  );
};

// SUPPLIERS
const SuppliersPage = () => {
  const COLORS = useTheme();
  const { setSlideOver, addEvent, showToast } = useData();
  const { sortCol, sortDir, handleSort, sortData } = useSortable("taux_conformite","desc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom:"", statut:"actif", delai_moyen:"", taux_conformite:"", taux_retard:"", pays:"", email:"" });
  const suppliersWithScore = SUPPLIERS.map(s => ({ ...s, score: Math.round(s.taux_conformite*0.6 + (100-s.taux_retard)*0.2 + (30-Math.min(s.delai_moyen,30))/30*100*0.2) }));
  const sorted = sortData(suppliersWithScore);
  const csvCols = [{key:"nom",label:"Nom"},{key:"statut",label:"Statut"},{key:"pays",label:"Pays"},{key:"delai_moyen",label:"Délai moyen"},{key:"taux_conformite",label:"Conformité %"},{key:"taux_retard",label:"Retard %"},{key:"score",label:"Score"},{key:"email",label:"Email"}];

  const handleAddSupplier = () => {
    if (!form.nom) return;
    const newId = SUPPLIERS.length + 1;
    const newSupplier = {
      id: newId, nom: form.nom, statut: form.statut,
      delai_moyen: parseDecimal(form.delai_moyen) || 10,
      taux_conformite: parseDecimal(form.taux_conformite) || 90,
      taux_retard: parseDecimal(form.taux_retard) || 5,
      pays: form.pays || "Canada", email: form.email || "",
    };
    SUPPLIERS.push(newSupplier);
    SUPPLIER_MAP[newId] = newSupplier.nom;
    addEvent("SUPPLIER_CREATED", "Supplier", newId, `Fournisseur créé: ${newSupplier.nom} (${newSupplier.pays})`, "INFO");
    showToast(`Fournisseur "${newSupplier.nom}" ajouté`);
    setForm({ nom:"", statut:"actif", delai_moyen:"", taux_conformite:"", taux_retard:"", pays:"", email:"" });
    setShowAdd(false);
  };

  const InputField = ({ label, field, type="text", placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>{label}</label>
      <input value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} type={type} placeholder={placeholder}
        style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
        onFocus={e=>e.target.style.borderColor=COLORS.accent} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
    </div>
  );

  return (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
      <KpiCard label="Fournisseurs actifs" value={SUPPLIERS.filter(s=>s.statut==="actif").length} sub={`sur ${SUPPLIERS.length} total`} color={COLORS.accent}/>
      <KpiCard label="Délai moyen" value={`${(SUPPLIERS.reduce((s,sup)=>s+sup.delai_moyen,0)/SUPPLIERS.length).toFixed(0)}j`} color={COLORS.info}/>
      <KpiCard label="Conformité moy." value={`${(SUPPLIERS.reduce((s,sup)=>s+sup.taux_conformite,0)/SUPPLIERS.length).toFixed(1)}%`} color={COLORS.accent}/>
      <KpiCard label="À risque" value={SUPPLIERS.filter(s=>s.taux_conformite<80||s.statut==="inactif").length} color={COLORS.danger}/>
    </div>
    <Card title="Fournisseurs" headerRight={<div style={{ display:"flex", gap:6 }}>
      <button onClick={()=>setShowAdd(true)} style={{ padding:"4px 14px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>+ Ajouter</button>
      <ExportButton data={sorted} columns={csvCols} filename="fournisseurs"/>
    </div>}>
      <TableContainer>
        <thead><tr>
          <S col="nom" tip="Raison sociale du fournisseur">Nom</S>
          <S col="statut" tip="Actif ou inactif — les fournisseurs inactifs bloquent la création de PO">Statut</S>
          <S col="pays" tip="Pays d'origine du fournisseur">Pays</S>
          <S col="delai_moyen" tip="Délai moyen de livraison en jours">Délai moyen</S>
          <S col="taux_conformite" tip="Pourcentage de commandes conformes aux spécifications">Conformité</S>
          <S col="taux_retard" tip="Pourcentage de commandes livrées en retard">Taux retard</S>
          <S col="score" tip="Score composite: 60% conformité + 20% ponctualité + 20% rapidité">Score</S>
          <Th tip="Adresse courriel du contact principal">Email</Th>
        </tr></thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:s,type:"supplier"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Td style={{ fontWeight:600 }}>{s.nom}</Td>
              <Td><Badge>{s.statut}</Badge></Td>
              <Td style={{ color:COLORS.textMuted }}>{s.pays}</Td>
              <Td>{s.delai_moyen} jours</Td>
              <Td>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ background:COLORS.bg, borderRadius:4, height:6, width:80, overflow:"hidden" }}>
                    <div style={{ width:`${s.taux_conformite}%`, height:"100%", background:s.taux_conformite>90?COLORS.accent:s.taux_conformite>80?COLORS.warning:COLORS.danger, borderRadius:4 }}/>
                  </div>
                  <span style={{ fontSize:12 }}>{s.taux_conformite}%</span>
                </div>
              </Td>
              <Td style={{ color:s.taux_retard>15?COLORS.danger:s.taux_retard>8?COLORS.warning:COLORS.text }}>{s.taux_retard}%</Td>
              <Td><span style={{ fontWeight:700, fontSize:16, color:s.score>85?COLORS.accent:s.score>70?COLORS.warning:COLORS.danger }}>{s.score}</span><span style={{ fontSize:11, color:COLORS.textDim }}>/100</span></Td>
              <Td style={{ fontSize:12, color:COLORS.textDim }}>{s.email}</Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </Card>

    {/* Add Supplier Modal */}
    {showAdd && (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
        <div style={{ width:480, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:20 }}>Ajouter un fournisseur</div>
          <InputField label="Nom *" field="nom" placeholder="Ex: AcierPlus Inc."/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Pays" field="pays" placeholder="Canada"/>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>Statut</label>
              <div style={{ display:"flex", gap:6 }}>
                {["actif","inactif"].map(s => (
                  <button key={s} onClick={()=>setForm(f=>({...f,statut:s}))}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${form.statut===s?COLORS.accent:COLORS.border}`,
                      background:form.statut===s?COLORS.accentGlow:"transparent", color:form.statut===s?COLORS.accent:COLORS.textMuted,
                      fontSize:12, fontWeight:form.statut===s?600:400, cursor:"pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <InputField label="Délai moyen (jours)" field="delai_moyen" placeholder="10"/>
            <InputField label="Conformité (%)" field="taux_conformite" placeholder="90,5"/>
            <InputField label="Taux retard (%)" field="taux_retard" placeholder="5,2"/>
          </div>
          <InputField label="Email" field="email" placeholder="contact@fournisseur.com"/>
          <div style={{ fontSize:11, color:COLORS.textDim, marginBottom:16 }}>💡 Les décimales acceptent la virgule et le point (ex: 94,2 ou 94.2)</div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
            <button onClick={handleAddSupplier} disabled={!form.nom}
              style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:form.nom?1:0.5 }}>
              Ajouter le fournisseur
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

// PURCHASE ORDERS
const PurchaseOrdersPage = () => {
  const COLORS = useTheme();
  const { pos, transitionPO, setSlideOver, setPos, addEvent, showToast } = useData();
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [attachModal, setAttachModal] = useState(null); // PO object
  const { sortCol, sortDir, handleSort, sortData } = useSortable("date_creation","desc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const filtered = useMemo(() => {
    let data = [...pos];
    if (filter) data = data.filter(p => p.statut === filter);
    if (search) data = data.filter(p => p.po_number.toLowerCase().includes(search.toLowerCase()) || p.article.toLowerCase().includes(search.toLowerCase()));
    return sortData(data);
  }, [filter, search, pos, sortCol, sortDir]);

  const handleImportPOs = (rows) => {
    let count = 0;
    const newPOs = rows.map(row => {
      const sku = row.sku || row.SKU;
      if (!sku) return null;
      const item = ITEMS.find(i => i.sku === sku);
      if (!item) return null;
      count++;
      const poId = pos.length + count + 100;
      return {
        po_id: poId, po_number: `PO-IMP-${String(poId).padStart(4, '0')}`,
        sku, article: item.article, supplier_id: parseInt(row.supplier_id) || item.supplier_id || 1,
        qty: parseInt(row.qty) || 100, statut: "BROUILLON",
        prix_negocie: parseFloat(row.prix_negocie) || +(item.cout_unitaire * 0.95).toFixed(2),
        prix_paye: null, date_creation: TODAY, created_by: "Import CSV",
        commentaire: row.commentaire || "", documents: [],
      };
    }).filter(Boolean);
    setPos(prev => [...prev, ...newPOs]);
    addEvent("IMPORT_POS", "PurchaseOrder", 0, `Import CSV: ${newPOs.length} POs créés (${rows.length} lignes)`, "INFO");
    showToast(`Import terminé — ${newPOs.length} POs créés en BROUILLON`);
    setShowImport(false);
  };

  const handleAttachDocs = (poId, docs) => {
    setPos(prev => prev.map(p => p.po_id === poId ? { ...p, documents: [...(p.documents || []), ...docs] } : p));
    addEvent("DOCUMENT_ATTACHED", "PurchaseOrder", poId, `${docs.length} document(s) joint(s): ${docs.map(d => d.name).join(', ')}`, "INFO");
    showToast(`${docs.length} document(s) joint(s)`);
    setAttachModal(null);
  };

  const btnStyle = (borderColor, bgColor, textColor) => ({
    padding:"3px 10px", borderRadius:5, border:`1px solid ${borderColor}`,
    background:bgColor, color:textColor, fontSize:10, fontWeight:600, cursor:"pointer",
    transition:"opacity 0.15s",
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12 }}>
        {[
          { label:"Brouillon", val:pos.filter(p=>p.statut==="BROUILLON").length, color:"#6b7280" },
          { label:"À valider", val:pos.filter(p=>p.statut==="A_VALIDER").length, color:COLORS.warning },
          { label:"Envoyé", val:pos.filter(p=>p.statut==="ENVOYE").length, color:COLORS.info },
          { label:"Reçu", val:pos.filter(p=>p.statut==="RECU").length, color:COLORS.accent },
          { label:"Clos", val:pos.filter(p=>p.statut==="CLOS").length, color:COLORS.purple },
        ].map(k => <KpiCard key={k.label} label={k.label} value={k.val} color={k.color}/>)}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <SearchInput value={search} onChange={setSearch}/>
        <FilterPills options={["BROUILLON","A_VALIDER","ENVOYE","RECU","CLOS"]} selected={filter} onSelect={setFilter}/>
      </div>
      <Card title={`Purchase Orders — ${filtered.length}`} headerRight={<div style={{ display:"flex", gap:6 }}><button onClick={()=>setShowImport(true)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.info}`, background:`${COLORS.info}15`, color:COLORS.info, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>📥 Importer CSV</button><ExportButton data={filtered} columns={[{key:"po_number",label:"PO #"},{key:"article",label:"Article"},{key:"sku",label:"SKU"},{key:r=>SUPPLIER_MAP[r.supplier_id]||"",label:"Fournisseur"},{key:"qty",label:"Qty"},{key:"statut",label:"Statut"},{key:"prix_negocie",label:"Prix négocié"},{key:"prix_paye",label:"Prix payé"},{key:"date_creation",label:"Date création"},{key:"created_by",label:"Créé par"}]} filename="purchase_orders"/></div>}>
        <TableContainer>
          <thead><tr><S col="po_number">PO #</S><S col="article">Article</S><S col="supplier_id">Fournisseur</S><S col="qty">Qty</S><S col="statut">Statut</S><S col="prix_negocie">Prix négocié</S><S col="prix_paye">Prix payé</S><S col="date_creation">Date création</S><S col="created_by">Créé par</S><Th>Actions</Th></tr></thead>
          <tbody>
            {filtered.map(po => (
              <tr key={po.po_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:po,type:"po"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Td style={{ fontWeight:700, color:COLORS.accent }}>{po.po_number}</Td>
                <Td><span style={{ fontWeight:500 }}>{po.article}</span><br/><span style={{ fontSize:11, color:COLORS.textDim }}>{po.sku}</span></Td>
                <Td style={{ color:COLORS.textMuted }}>{SUPPLIER_MAP[po.supplier_id]?.split(' ')[0]}</Td>
                <Td style={{ fontWeight:600 }}>{po.qty}</Td>
                <Td><Badge>{po.statut}</Badge></Td>
                <Td>${po.prix_negocie.toFixed(2)}</Td>
                <Td>{po.prix_paye ? `$${po.prix_paye.toFixed(2)}` : <span style={{ color:COLORS.textDim }}>—</span>}</Td>
                <Td style={{ color:COLORS.textMuted, fontSize:12 }}>{po.date_creation}</Td>
                <Td style={{ color:COLORS.textMuted, fontSize:12 }}>{po.created_by}</Td>
                <Td>
                  <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:4, alignItems:"center" }}>
                    {po.statut==="BROUILLON" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.warning} bgColor={COLORS.warningDim} textColor={COLORS.warning}>Valider</ActionBtn>}
                    {po.statut==="A_VALIDER" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.info} bgColor={COLORS.infoDim} textColor={COLORS.info}>Envoyer</ActionBtn>}
                    {po.statut==="ENVOYE" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.accent} bgColor={COLORS.accentGlow} textColor={COLORS.accent}>Réceptionner</ActionBtn>}
                    {po.statut==="RECU" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.purple} bgColor={COLORS.purpleDim} textColor={COLORS.purple}>Clore</ActionBtn>}
                    {po.statut==="CLOS" && <span style={{ fontSize:10, color:COLORS.textDim }}>—</span>}
                    <button onClick={()=>setAttachModal(po)} title="Joindre un document"
                      style={{ padding:"3px 6px", borderRadius:4, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:12, position:"relative" }}>
                      📎{po.documents && po.documents.length > 0 && <span style={{ position:"absolute", top:-4, right:-4, minWidth:14, height:14, borderRadius:7, background:COLORS.accent, color:"white", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{po.documents.length}</span>}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
      {showImport && <ImportModal type="orders" onClose={()=>setShowImport(false)} onImport={handleImportPOs}/>}
      {attachModal && <DocumentAttachModal po={attachModal} onClose={()=>setAttachModal(null)} onAttach={handleAttachDocs}/>}
    </div>
  );
};

// TASKS
const TasksPage = () => {
  const COLORS = useTheme();
  const { tasks, pos, setSlideOver } = useData();
  const [filter, setFilter] = useState(null);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("due_at","asc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const base = filter ? tasks.filter(t=>t.status===filter) : tasks;
  const filtered = sortData(base);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
        <KpiCard label="Ouvertes" value={tasks.filter(t=>t.status==="Ouverte").length} color={COLORS.warning}/>
        <KpiCard label="En cours" value={tasks.filter(t=>t.status==="En cours").length} color={COLORS.info}/>
        <KpiCard label="Terminées" value={tasks.filter(t=>t.status==="Terminée").length} color={COLORS.accent}/>
      </div>
      <FilterPills options={["Ouverte","En cours","Terminée"]} selected={filter} onSelect={setFilter}/>
      <Card title="Tâches" headerRight={<ExportButton data={filtered.map(t=>({...t, po_number:pos.find(p=>p.po_id===t.related_po_id)?.po_number||""}))} columns={[{key:"type",label:"Type"},{key:"po_number",label:"PO lié"},{key:"assigned_to",label:"Assigné à"},{key:"status",label:"Statut"},{key:"due_at",label:"Échéance"},{key:"comment",label:"Commentaire"}]} filename="taches"/>}>
        <TableContainer>
          <thead><tr><S col="type">Type</S><S col="related_po_id">PO lié</S><S col="assigned_to">Assigné à</S><S col="status">Statut</S><S col="due_at">Échéance</S><S col="comment">Commentaire</S></tr></thead>
          <tbody>
            {filtered.map(t => {
              const po = pos.find(p=>p.po_id===t.related_po_id);
              const overdue = new Date(t.due_at) < new Date(TODAY) && t.status !== "Terminée";
              return (
                <tr key={t.task_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:t,type:"task"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:500 }}>{t.type}</Td>
                  <Td style={{ color:COLORS.accent, fontWeight:600 }}>{po?.po_number||"—"}</Td>
                  <Td>{t.assigned_to}</Td>
                  <Td><Badge>{t.status}</Badge></Td>
                  <Td style={{ color:overdue?COLORS.danger:COLORS.textMuted, fontWeight:overdue?600:400 }}>{formatDate(t.due_at)}{overdue && " ⚠"}</Td>
                  <Td style={{ color:COLORS.textDim, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis" }}>{t.comment}{t.comments?.length > 0 && <span style={{ marginLeft:6, fontSize:9, color:COLORS.accent }}>💬 {t.comments.length}</span>}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
      </Card>
    </div>
  );
};

// AUDIT LOG
const AuditPage = () => {
  const COLORS = useTheme();
  const { events, statusHistory, setSlideOver } = useData();
  const [levelFilter, setLevelFilter] = useState(null);
  const evSort = useSortable("date","desc");
  const SE = ({ col, children }) => <SortableTh col={col} sortCol={evSort.sortCol} sortDir={evSort.sortDir} onSort={evSort.handleSort}>{children}</SortableTh>;
  const hSort = useSortable("changed_at","desc");
  const SH = ({ col, children }) => <SortableTh col={col} sortCol={hSort.sortCol} sortDir={hSort.sortDir} onSort={hSort.handleSort}>{children}</SortableTh>;
  const base = levelFilter ? events.filter(e=>e.level===levelFilter) : events;
  const filtered = evSort.sortData(base);
  const sortedHistory = hSort.sortData([...statusHistory].reverse());
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <KpiCard label="Total événements" value={events.length} color={COLORS.info}/>
        <KpiCard label="Warnings" value={events.filter(e=>e.level==="WARNING").length} color={COLORS.warning}/>
        <KpiCard label="Erreurs" value={events.filter(e=>e.level==="ERROR").length} color={COLORS.danger}/>
        <KpiCard label="Critiques" value={events.filter(e=>e.level==="CRITICAL").length} color="#ff4444"/>
      </div>
      <FilterPills options={["INFO","WARNING","ERROR","CRITICAL"]} selected={levelFilter} onSelect={setLevelFilter}/>
      <Card title="Journal d'audit" headerRight={<ExportButton data={filtered} columns={[{key:"date",label:"Date"},{key:"level",label:"Niveau"},{key:"type_event",label:"Type"},{key:"utilisateur",label:"Utilisateur"},{key:"entite",label:"Entité"},{key:"entite_id",label:"ID"},{key:"details",label:"Détails"}]} filename="audit_log"/>}>
        <TableContainer>
          <thead><tr><SE col="date">Date</SE><SE col="level">Niveau</SE><SE col="type_event">Type</SE><SE col="utilisateur">Utilisateur</SE><SE col="entite">Entité</SE><SE col="entite_id">ID</SE><SE col="details">Détails</SE></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.event_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:e,type:"event"})} onMouseEnter={ev=>ev.currentTarget.style.background=COLORS.cardHover} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                <Td style={{ fontSize:12, color:COLORS.textMuted, whiteSpace:"nowrap" }}>{e.date}</Td>
                <Td><Badge>{e.level}</Badge></Td>
                <Td style={{ fontSize:12, fontWeight:500 }}>{e.type_event}</Td>
                <Td>{e.utilisateur}</Td>
                <Td style={{ color:COLORS.textDim }}>{e.entite}</Td>
                <Td style={{ color:COLORS.textDim }}>#{e.entite_id}</Td>
                <Td style={{ fontSize:12, color:COLORS.textMuted, maxWidth:350, overflow:"hidden", textOverflow:"ellipsis" }}>{e.details}{e.notes?.length > 0 && <span style={{ marginLeft:6, fontSize:9, color:COLORS.accent }}>📝 {e.notes.length}</span>}</Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card title={`Historique transitions PO — ${statusHistory.length}`} headerRight={<ExportButton data={sortedHistory} columns={[{key:"po_id",label:"PO ID"},{key:"old_status",label:"Ancien statut"},{key:"new_status",label:"Nouveau statut"},{key:"changed_by",label:"Par"},{key:"changed_at",label:"Date"},{key:"comment",label:"Commentaire"}]} filename="historique_transitions"/>}>
          <TableContainer>
            <thead><tr><SH col="po_id">PO ID</SH><SH col="old_status">Ancien statut</SH><SH col="new_status">Nouveau statut</SH><SH col="changed_by">Par</SH><SH col="changed_at">Date</SH><SH col="comment">Commentaire</SH></tr></thead>
            <tbody>
              {sortedHistory.map(h => (
                <tr key={h.id} onMouseEnter={ev=>ev.currentTarget.style.background=COLORS.cardHover} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:600, color:COLORS.accent }}>PO-{String(h.po_id).padStart(4,'0')}</Td>
                  <Td>{h.old_status ? <Badge>{h.old_status}</Badge> : <span style={{ color:COLORS.textDim }}>—</span>}</Td>
                  <Td><Badge>{h.new_status}</Badge></Td>
                  <Td>{h.changed_by}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textMuted }}>{h.changed_at}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textMuted }}>{h.comment}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};

// SETTINGS / RULES / ADMIN
const SettingsPage = () => {
  const COLORS = useTheme();
  const auth = useAuth();
  const { showToast, addEvent } = useData();
  const [tab, setTab] = useState("rules");
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ username:"", password:"", nom:"", poste:"", role:"entrepot" });
  const [pwForm, setPwForm] = useState({ current:"", newPw:"", confirm:"" });

  const rules = [
    { id:1, name:"Réapprovisionnement automatique", condition:"Classe A/B + Stock < Seuil min + Fournisseur actif", action:"Créer PO brouillon + Tâche validation + Log audit", active:true },
    { id:2, name:"Garde-fou PO unique", condition:"Un seul PO BROUILLON ou A_VALIDER par SKU", action:"Bloquer création + Log warning", active:true },
    { id:3, name:"Limite quantité EOQ", condition:"Qty > EOQ × 2", action:"Exiger validation managériale", active:true },
    { id:4, name:"Fournisseur inactif", condition:"Fournisseur.statut == inactif", action:"Bloquer création PO + Log erreur", active:true },
    { id:5, name:"Quantité positive", condition:"Qty <= 0", action:"Refuser PO + Log violation", active:true },
    { id:6, name:"Workflow envoi", condition:"PO non validé → tentative envoi", action:"Bloquer transition + Log erreur", active:true },
    { id:7, name:"Workflow réception", condition:"PO non envoyé → tentative réception", action:"Bloquer transition + Log erreur", active:true },
    { id:8, name:"PO clos immuable", condition:"PO.statut == CLOS → modification", action:"Bloquer modification + Log violation", active:true },
  ];

  const formulas = [
    { name:"EOQ", formula:"√((2 × D × S) / H)", desc:"D = demande annuelle, S = coût commande, H = coût unitaire × taux possession" },
    { name:"ROP", formula:"(D/365 × Lead time) + Stock sécurité", desc:"Point de réapprovisionnement avec marge sécurité" },
    { name:"Couverture", formula:"Stock net / (D / 365)", desc:"Nombre de jours de stock restant au rythme actuel" },
    { name:"Classification ABC", formula:"Pareto sur valeur annuelle (D × Coût)", desc:"A ≤ 80% cumulé, B ≤ 95%, C > 95%" },
    { name:"TRS", formula:"Disponibilité × Performance × Qualité", desc:"Taux de rendement synthétique (OEE)" },
    { name:"Disponibilité", formula:"(Temps planifié − Arrêts) / Temps planifié", desc:"Temps réellement productif vs temps prévu" },
    { name:"Performance", formula:"(Qté / Temps fonct.) / Cadence théorique", desc:"Ratio cadence réelle vs nominale" },
    { name:"Score fournisseur", formula:"Conformité×0.6 + (100−Retard)×0.2 + Rapidité×0.2", desc:"Score composite sur 100" },
  ];

  const kpiDefs = [
    { name:"Taux de service", def:"% d'articles avec stock ≥ seuil minimum. Mesure la capacité à servir les demandes sans rupture.", cible:"≥ 95%", page:"Dashboard" },
    { name:"Couverture moyenne", def:"Nombre moyen de jours de stock restant sur l'ensemble des articles. Indicateur de santé globale du stock.", cible:"30–45 jours", page:"Dashboard" },
    { name:"Articles critiques", def:"Articles en rupture, sous seuil, ou avec couverture < 15 jours pour les classes A/B.", cible:"< 10% du total", page:"Articles critiques" },
    { name:"Précision inventaire", def:"% d'articles comptés dont l'écart est dans la tolérance (A: ±5%, B: ±10%, C: ±15%).", cible:"A ≥ 95%, B ≥ 90%, C ≥ 85%", page:"Inventaire tournant" },
    { name:"TRS", def:"Taux de rendement synthétique. Produit de Disponibilité × Performance × Qualité.", cible:"≥ 85% (World Class)", page:"Performance TRS" },
    { name:"Délai moyen fournisseur", def:"Nombre moyen de jours entre l'envoi du PO et la réception.", cible:"< 10 jours", page:"Fournisseurs" },
    { name:"Taux de conformité", def:"% de commandes reçues conformes aux spécifications (qualité, quantité).", cible:"≥ 95%", page:"Fournisseurs" },
    { name:"PO à traiter", def:"Nombre de POs en statut BROUILLON ou A_VALIDER nécessitant une action.", cible:"< 5", page:"Purchase Orders" },
  ];

  const handleAddUser = () => {
    if (!userForm.username || !userForm.password || !userForm.nom) return;
    const initials = userForm.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6","#06b6d4"];
    const newUser = {
      id: USERS.length + 1, username: userForm.username, password: userForm.password,
      role: userForm.role, nom: userForm.nom, poste: userForm.poste || (userForm.role === "admin" ? "Gestionnaire" : "Préposé entrepôt"),
      initials, color: colors[USERS.length % colors.length],
    };
    USERS.push(newUser);
    addEvent("USER_CREATED", "User", newUser.id, `Profil créé: ${newUser.nom} (${newUser.role})`, "INFO");
    showToast(`Utilisateur "${newUser.nom}" créé`);
    setUserForm({ username:"", password:"", nom:"", poste:"", role:"entrepot" });
    setShowAddUser(false);
  };

  const handleChangePw = () => {
    const user = USERS.find(u => u.id === auth.user.id);
    if (!user || pwForm.current !== user.password) { showToast("Mot de passe actuel incorrect", "error"); return; }
    if (pwForm.newPw.length < 4) { showToast("Minimum 4 caractères", "error"); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast("Les mots de passe ne correspondent pas", "error"); return; }
    user.password = pwForm.newPw;
    showToast("Mot de passe modifié");
    setPwForm({ current:"", newPw:"", confirm:"" });
  };

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${tab === id ? COLORS.accent : COLORS.border}`,
        background:tab === id ? COLORS.accentGlow : "transparent", color:tab === id ? COLORS.accent : COLORS.textMuted,
        fontSize:12, fontWeight:tab === id ? 600 : 400, cursor:"pointer", transition:"all 0.15s" }}>{label}</button>
  );

  const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>{label}</label>
      <input value={value} onChange={onChange} type={type} placeholder={placeholder}
        style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <Tab id="rules" label="Moteur de règles"/><Tab id="formulas" label="Formules"/><Tab id="kpis" label="Définitions KPI"/><Tab id="users" label="Gestion profils"/><Tab id="password" label="Mon compte"/>
      </div>

      {/* RULES */}
      {tab === "rules" && (
        <Card title={`Moteur de règles — ${rules.length} garde-fous`}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {rules.map(r => (
              <div key={r.id} style={{ background:COLORS.surface, borderRadius:12, padding:16, border:`1px solid ${COLORS.border}`, display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:COLORS.accentGlow, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16, fontWeight:700, color:COLORS.accent }}>{r.id}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:COLORS.text, marginBottom:6 }}>{r.name}</div>
                  <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:4 }}><span style={{ color:COLORS.info, fontWeight:500 }}>SI</span> {r.condition}</div>
                  <div style={{ fontSize:12, color:COLORS.textMuted }}><span style={{ color:COLORS.warning, fontWeight:500 }}>ALORS</span> {r.action}</div>
                </div>
                <span style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` }}>ACTIF</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* FORMULAS */}
      {tab === "formulas" && (
        <Card title={`Formules — ${formulas.length} calculs`}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {formulas.map(f => (
              <div key={f.name} style={{ background:COLORS.surface, borderRadius:12, padding:16, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight:700, color:COLORS.accent, marginBottom:6, fontSize:14 }}>{f.name}</div>
                <div style={{ fontFamily:"'Courier New', monospace", fontSize:13, color:COLORS.text, marginBottom:8, padding:"8px 12px", background:COLORS.bg, borderRadius:8, border:`1px solid ${COLORS.border}` }}>{f.formula}</div>
                <div style={{ fontSize:12, color:COLORS.textDim }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPI DEFINITIONS */}
      {tab === "kpis" && (
        <Card title={`Définitions KPI — ${kpiDefs.length} indicateurs`}>
          <TableContainer>
            <thead><tr><Th>KPI</Th><Th>Définition</Th><Th>Cible</Th><Th>Page</Th></tr></thead>
            <tbody>
              {kpiDefs.map(k => (
                <tr key={k.name} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:600, color:COLORS.accent, whiteSpace:"nowrap" }}>{k.name}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textMuted, maxWidth:400 }}>{k.def}</Td>
                  <Td style={{ fontWeight:600, color:COLORS.accent, whiteSpace:"nowrap" }}>{k.cible}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textDim }}>{k.page}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {/* USER MANAGEMENT */}
      {tab === "users" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card title="Profils utilisateurs" headerRight={<button onClick={()=>setShowAddUser(true)} style={{ padding:"4px 14px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>+ Nouveau profil</button>}>
            <TableContainer>
              <thead><tr><Th>Utilisateur</Th><Th>Nom complet</Th><Th>Poste</Th><Th>Rôle</Th><Th>Pages accessibles</Th></tr></thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg, ${u.color}, ${u.color}aa)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:11 }}>{u.initials}</div>
                        <span style={{ fontFamily:"monospace", fontSize:12, color:COLORS.text }}>{u.username}</span>
                      </div>
                    </Td>
                    <Td style={{ fontWeight:500 }}>{u.nom}</Td>
                    <Td style={{ color:COLORS.textMuted }}>{u.poste}</Td>
                    <Td><Badge>{u.role}</Badge></Td>
                    <Td style={{ fontSize:11, color:COLORS.textDim }}>{u.role === "admin" ? "Toutes les pages" : "Tableau de bord, Inventaire, Commandes, Comptages, Stats"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </Card>

          {/* Permission matrix */}
          <Card title="Matrice des permissions">
            <TableContainer>
              <thead><tr><Th>Page</Th><Th>Admin</Th><Th>Entrepôt</Th></tr></thead>
              <tbody>
                {[
                  {page:"Dashboard",admin:true,entrepot:false},{page:"Inventaire",admin:true,entrepot:true},
                  {page:"Articles critiques",admin:true,entrepot:false},{page:"Fournisseurs",admin:true,entrepot:false},
                  {page:"Purchase Orders",admin:true,entrepot:false},{page:"Tâches",admin:true,entrepot:false},
                  {page:"Journal d'audit",admin:true,entrepot:false},{page:"Performance TRS",admin:true,entrepot:false},
                  {page:"Mon tableau de bord",admin:false,entrepot:true},{page:"Commandes internes",admin:true,entrepot:true},
                  {page:"Inventaire tournant",admin:true,entrepot:true},{page:"Mes statistiques",admin:false,entrepot:true},
                  {page:"Règles / Config",admin:true,entrepot:false},
                ].map(p => (
                  <tr key={p.page} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td style={{ fontWeight:500 }}>{p.page}</Td>
                    <Td>{p.admin ? <span style={{ color:COLORS.accent }}>✓</span> : <span style={{ color:COLORS.textDim }}>—</span>}</Td>
                    <Td>{p.entrepot ? <span style={{ color:COLORS.accent }}>✓</span> : <span style={{ color:COLORS.textDim }}>—</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </Card>

          {/* Add user modal */}
          {showAddUser && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
              <div style={{ width:460, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:20 }}>Créer un profil</div>
                <Input label="Nom d'utilisateur *" value={userForm.username} onChange={e=>setUserForm(f=>({...f,username:e.target.value}))} placeholder="ex: marie.lavoie"/>
                <Input label="Mot de passe *" value={userForm.password} onChange={e=>setUserForm(f=>({...f,password:e.target.value}))} type="password" placeholder="Min. 4 caractères"/>
                <Input label="Nom complet *" value={userForm.nom} onChange={e=>setUserForm(f=>({...f,nom:e.target.value}))} placeholder="Prénom Nom"/>
                <Input label="Poste" value={userForm.poste} onChange={e=>setUserForm(f=>({...f,poste:e.target.value}))} placeholder="ex: Analyste achats"/>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Rôle</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{id:"admin",label:"Admin — Accès complet"},{id:"entrepot",label:"Entrepôt — Accès limité"}].map(r => (
                      <button key={r.id} onClick={()=>setUserForm(f=>({...f,role:r.id}))}
                        style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${userForm.role===r.id?COLORS.accent:COLORS.border}`,
                          background:userForm.role===r.id?COLORS.accentGlow:"transparent", color:userForm.role===r.id?COLORS.accent:COLORS.textMuted,
                          fontSize:12, fontWeight:userForm.role===r.id?600:400, cursor:"pointer" }}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowAddUser(false)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
                  <button onClick={handleAddUser} disabled={!userForm.username||!userForm.password||!userForm.nom}
                    style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:userForm.username&&userForm.password&&userForm.nom?1:0.5 }}>Créer le profil</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD */}
      {tab === "password" && (
        <Card title="Mon compte">
          <div style={{ maxWidth:400 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg, ${auth.user.color}, ${auth.user.color}aa)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:18 }}>{auth.user.initials}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:COLORS.text }}>{auth.user.nom}</div>
                <div style={{ fontSize:12, color:COLORS.textMuted }}>{auth.user.poste} · {auth.user.role}</div>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, marginBottom:12 }}>Changer le mot de passe</div>
            <Input label="Mot de passe actuel" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} type="password"/>
            <Input label="Nouveau mot de passe" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} type="password"/>
            <Input label="Confirmer le nouveau mot de passe" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} type="password"/>
            <button onClick={handleChangePw} disabled={!pwForm.current||!pwForm.newPw||!pwForm.confirm}
              style={{ padding:"10px 24px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:pwForm.current&&pwForm.newPw&&pwForm.confirm?1:0.5, marginTop:8 }}>Modifier le mot de passe</button>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
// ─── KPI EXPAND OVERLAY ──────────────────────────────────────────────────────
const KPIExpandOverlay = ({ kpiId, onClose }) => {
  const COLORS = useTheme();
  const { pos } = useData();
  if (!kpiId) return null;

  const Wrap = ({ title, children }) => (
    <div style={{ position:"fixed", inset:0, zIndex:1003, background:COLORS.bg, overflowY:"auto", animation:"kpiExpand 0.25s ease" }}>
      <div style={{ position:"sticky", top:0, zIndex:2, background:COLORS.surface, borderBottom:`1px solid ${COLORS.border}`, padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:20, fontWeight:700, color:COLORS.text }}>{title}</div>
        <button onClick={onClose} style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          <span>Fermer</span><span style={{ padding:"1px 6px", borderRadius:4, background:COLORS.bg, fontSize:10, border:`1px solid ${COLORS.border}` }}>ESC</span>
        </button>
      </div>
      <div style={{ padding:32, maxWidth:1400, margin:"0 auto" }}>{children}</div>
    </div>
  );

  const MiniKpi = ({ label, value, color }) => (
    <div style={{ background:COLORS.card, borderRadius:12, padding:"16px 20px", border:`1px solid ${COLORS.border}` }}>
      <div style={{ fontSize:11, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color:color||COLORS.text }}>{value}</div>
    </div>
  );

  // ─── ABC PARETO ─────────────────────────────────────────
  if (kpiId === "abc") {
    const sorted = [...ITEMS].sort((a,b) => (b.demande*b.cout_unitaire) - (a.demande*a.cout_unitaire));
    const totalVal = sorted.reduce((s,i) => s + i.demande*i.cout_unitaire, 0);
    let cumul = 0;
    const paretoData = sorted.slice(0,50).map((item,idx) => {
      cumul += item.demande * item.cout_unitaire;
      return { rang:idx+1, article:item.article, sku:item.sku, valeur:item.demande*item.cout_unitaire, pctCumule:+(cumul/totalVal*100).toFixed(1), abc:item.abc, famille:item.famille };
    });
    const valA = sorted.filter(i=>i.abc==="A").reduce((s,i)=>s+i.demande*i.cout_unitaire,0);
    const valB = sorted.filter(i=>i.abc==="B").reduce((s,i)=>s+i.demande*i.cout_unitaire,0);
    const valTop5 = sorted.slice(0,5).reduce((s,i)=>s+i.demande*i.cout_unitaire,0);
    // ABC by family
    const families = [...new Set(ITEMS.map(i=>i.famille))].sort();
    const familyABC = families.map(f => {
      const items = ITEMS.filter(i=>i.famille===f);
      return { famille:f, total:items.length, a:items.filter(i=>i.abc==="A").length, b:items.filter(i=>i.abc==="B").length, c:items.filter(i=>i.abc==="C").length };
    });

    return <Wrap title="Distribution ABC — Analyse Pareto détaillée">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12, marginBottom:24 }}>
        <MiniKpi label="Valeur totale" value={fmtM(totalVal)} color={COLORS.text}/>
        <MiniKpi label="% valeur classe A" value={`${(valA/totalVal*100).toFixed(1)}%`} color="#f43f5e"/>
        <MiniKpi label="% valeur classe B" value={`${(valB/totalVal*100).toFixed(1)}%`} color="#f59e0b"/>
        <MiniKpi label="% valeur Top 5" value={`${(valTop5/totalVal*100).toFixed(1)}%`} color={COLORS.accent}/>
        <MiniKpi label="Articles A / B / C" value={`${ITEMS.filter(i=>i.abc==="A").length} / ${ITEMS.filter(i=>i.abc==="B").length} / ${ITEMS.filter(i=>i.abc==="C").length}`}/>
      </div>

      <Card title="Courbe Pareto — Top 50 articles" style={{ marginBottom:20 }}>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="rang" tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={{ stroke:COLORS.border }}/>
            <YAxis yAxisId="left" tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={false} tickFormatter={v=>fmtM(v)}/>
            <YAxis yAxisId="right" orientation="right" tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={false} unit="%" domain={[0,100]}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar yAxisId="left" dataKey="valeur" name="Valeur annuelle" radius={[3,3,0,0]} barSize={14}>
              {paretoData.map((d,i)=><Cell key={i} fill={d.abc==="A"?"#f43f5e":d.abc==="B"?"#f59e0b":"#6366f1"}/>)}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="pctCumule" name="% cumulé" stroke={COLORS.accent} strokeWidth={2.5} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Top 20 articles par valeur" headerRight={<ExportButton data={paretoData} columns={[{key:"rang",label:"Rang"},{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:r=>fmtM(r.valeur),label:"Valeur"},{key:"pctCumule",label:"% cumulé"},{key:"abc",label:"ABC"},{key:"famille",label:"Famille"}]} filename="pareto_top50"/>}>
          <TableContainer>
            <thead><tr><Th>Rang</Th><Th>SKU</Th><Th>Article</Th><Th>Valeur ann.</Th><Th>% cumulé</Th><Th>ABC</Th><Th>Famille</Th></tr></thead>
            <tbody>
              {paretoData.slice(0,20).map(r => (
                <tr key={r.rang} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:700, color:COLORS.textDim }}>#{r.rang}</Td>
                  <Td style={{ color:COLORS.accent, fontSize:12 }}>{r.sku}</Td>
                  <Td style={{ fontWeight:500 }}>{r.article}</Td>
                  <Td>{fmtM(r.valeur)}</Td>
                  <Td style={{ color:COLORS.accent }}>{r.pctCumule}%</Td>
                  <Td><Badge>{r.abc}</Badge></Td>
                  <Td style={{ color:COLORS.textMuted }}>{r.famille}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="Répartition ABC par famille">
          <TableContainer>
            <thead><tr><Th>Famille</Th><Th>Total</Th><Th>A</Th><Th>B</Th><Th>C</Th><Th>% classe A</Th></tr></thead>
            <tbody>
              {familyABC.map(f => (
                <tr key={f.famille} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:500 }}>{f.famille}</Td>
                  <Td>{f.total}</Td>
                  <Td style={{ color:"#f43f5e", fontWeight:600 }}>{f.a}</Td>
                  <Td style={{ color:"#f59e0b", fontWeight:600 }}>{f.b}</Td>
                  <Td style={{ color:"#6366f1", fontWeight:600 }}>{f.c}</Td>
                  <Td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ background:COLORS.bg, borderRadius:4, height:6, width:60, overflow:"hidden" }}>
                        <div style={{ width:`${f.total>0?f.a/f.total*100:0}%`, height:"100%", background:"#f43f5e", borderRadius:4 }}/>
                      </div>
                      <span style={{ fontSize:12 }}>{f.total>0?(f.a/f.total*100).toFixed(0):0}%</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      </div>
    </Wrap>;
  }

  // ─── COUVERTURE STOCK ───────────────────────────────────
  if (kpiId === "couverture") {
    const danger = [...ITEMS].filter(i=>i.couverture<10).sort((a,b)=>a.couverture-b.couverture);
    const warning = [...ITEMS].filter(i=>i.couverture>=10&&i.couverture<20).sort((a,b)=>a.couverture-b.couverture);
    const abcCov = ["A","B","C"].map(c => {
      const items = ITEMS.filter(i=>i.abc===c);
      return { classe:c, moy:+(items.reduce((s,i)=>s+i.couverture,0)/Math.max(items.length,1)).toFixed(1), min:items.length?+Math.min(...items.map(i=>i.couverture)).toFixed(1):0, count:items.length };
    });
    const famCov = [...new Set(ITEMS.map(i=>i.famille))].sort().map(f => {
      const items = ITEMS.filter(i=>i.famille===f);
      return { famille:f, moy:+(items.reduce((s,i)=>s+i.couverture,0)/Math.max(items.length,1)).toFixed(1), danger:items.filter(i=>i.couverture<10).length, count:items.length };
    });
    const covFine = [
      { range:"0-5j", count:ITEMS.filter(i=>i.couverture<5).length, color:"#dc2626" },
      { range:"5-10j", count:ITEMS.filter(i=>i.couverture>=5&&i.couverture<10).length, color:"#ef4444" },
      { range:"10-15j", count:ITEMS.filter(i=>i.couverture>=10&&i.couverture<15).length, color:"#f97316" },
      { range:"15-20j", count:ITEMS.filter(i=>i.couverture>=15&&i.couverture<20).length, color:"#eab308" },
      { range:"20-30j", count:ITEMS.filter(i=>i.couverture>=20&&i.couverture<30).length, color:"#84cc16" },
      { range:"30-45j", count:ITEMS.filter(i=>i.couverture>=30&&i.couverture<45).length, color:"#22c55e" },
      { range:"45-60j", count:ITEMS.filter(i=>i.couverture>=45&&i.couverture<60).length, color:"#06b6d4" },
      { range:"60j+", count:ITEMS.filter(i=>i.couverture>=60).length, color:"#3b82f6" },
    ];

    return <Wrap title="Couverture stock — Analyse détaillée">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12, marginBottom:24 }}>
        <MiniKpi label="Couverture moyenne" value={`${(ITEMS.reduce((s,i)=>s+i.couverture,0)/ITEMS.length).toFixed(1)}j`} color={COLORS.info}/>
        <MiniKpi label="Articles < 10 jours" value={danger.length} color={COLORS.danger}/>
        <MiniKpi label="Articles 10-20 jours" value={warning.length} color={COLORS.warning}/>
        <MiniKpi label="Articles > 30 jours" value={ITEMS.filter(i=>i.couverture>=30).length} color={COLORS.accent}/>
        <MiniKpi label="Risque global" value={danger.length > 50 ? "Élevé" : danger.length > 20 ? "Modéré" : "Faible"} color={danger.length>50?COLORS.danger:danger.length>20?COLORS.warning:COLORS.accent}/>
      </div>

      <Card title="Distribution fine de la couverture" style={{ marginBottom:20 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={covFine}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="range" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={{ stroke:COLORS.border }}/>
            <YAxis tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="count" name="Articles" radius={[6,6,0,0]} barSize={45}>
              {covFine.map((d,i)=><Cell key={i} fill={d.color}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <Card title="Couverture par classe ABC">
          <TableContainer>
            <thead><tr><Th>Classe</Th><Th>Articles</Th><Th>Couv. moyenne</Th><Th>Couv. min</Th></tr></thead>
            <tbody>
              {abcCov.map(c => (
                <tr key={c.classe} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td><Badge>{c.classe}</Badge></Td>
                  <Td>{c.count}</Td>
                  <Td style={{ fontWeight:600, color:c.moy<15?COLORS.danger:c.moy<30?COLORS.warning:COLORS.accent }}>{c.moy}j</Td>
                  <Td style={{ color:c.min<10?COLORS.danger:COLORS.textMuted }}>{c.min}j</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="Couverture par famille">
          <TableContainer>
            <thead><tr><Th>Famille</Th><Th>Articles</Th><Th>Couv. moy.</Th><Th>En danger (&lt;10j)</Th></tr></thead>
            <tbody>
              {famCov.map(f => (
                <tr key={f.famille} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:500 }}>{f.famille}</Td>
                  <Td>{f.count}</Td>
                  <Td style={{ fontWeight:600, color:f.moy<15?COLORS.danger:f.moy<30?COLORS.warning:COLORS.accent }}>{f.moy}j</Td>
                  <Td style={{ color:f.danger>0?COLORS.danger:COLORS.textDim, fontWeight:f.danger>0?700:400 }}>{f.danger}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      </div>

      <Card title={`Articles en danger — couverture < 10 jours (${danger.length})`} headerRight={<ExportButton data={danger} columns={[{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"abc",label:"ABC"},{key:"famille",label:"Famille"},{key:r=>r.couverture.toFixed(1),label:"Couverture (j)"},{key:"stock_net",label:"Stock"},{key:"seuil_min",label:"Seuil"},{key:"statut_service",label:"Statut"}]} filename="couverture_danger"/>}>
        <TableContainer>
          <thead><tr><Th>SKU</Th><Th>Article</Th><Th>ABC</Th><Th>Famille</Th><Th>Couverture</Th><Th>Stock</Th><Th>Seuil</Th><Th>Statut</Th></tr></thead>
          <tbody>
            {danger.slice(0,20).map(it => (
              <tr key={it.id} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Td style={{ color:COLORS.accent, fontWeight:600, fontSize:12 }}>{it.sku}</Td>
                <Td style={{ fontWeight:500 }}>{it.article}</Td>
                <Td><Badge>{it.abc}</Badge></Td>
                <Td style={{ color:COLORS.textMuted }}>{it.famille}</Td>
                <Td style={{ fontWeight:700, color:COLORS.danger }}>{it.couverture.toFixed(1)}j</Td>
                <Td>{fmt(it.stock_net)}</Td>
                <Td style={{ color:COLORS.textDim }}>{fmt(it.seuil_min)}</Td>
                <Td><Badge>{it.statut_service}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </Wrap>;
  }

  // ─── VALEUR PAR FAMILLE ─────────────────────────────────
  if (kpiId === "familles") {
    const totalVal = FAMILLES.reduce((s,f)=>s+f.valeur,0);
    const familyDetail = FAMILLES.map(f => {
      const items = ITEMS.filter(i=>i.famille===f.name);
      return { ...f, pct:+(f.valeur/totalVal*100).toFixed(1), moyArticle:items.length?Math.round(f.valeur/items.length):0,
        nb_a:items.filter(i=>i.abc==="A").length, nb_b:items.filter(i=>i.abc==="B").length, nb_c:items.filter(i=>i.abc==="C").length,
        covMoy:+(items.reduce((s,i)=>s+i.couverture,0)/Math.max(items.length,1)).toFixed(1),
        sousSeuil:items.filter(i=>i.statut_service==="Sous seuil").length,
      };
    }).sort((a,b)=>b.valeur-a.valeur);

    const pieData = familyDetail.map((f,i) => ({ name:f.name, value:f.valeur, color:["#f43f5e","#f59e0b","#10b981","#8b5cf6","#3b82f6","#06b6d4","#ec4899","#6366f1"][i] }));

    return <Wrap title="Valeur annuelle par famille — Analyse détaillée">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:24 }}>
        <MiniKpi label="Valeur totale" value={fmtM(totalVal)} color={COLORS.text}/>
        <MiniKpi label="Famille #1" value={familyDetail[0]?.name} color="#f43f5e"/>
        <MiniKpi label="Valeur moy. / article" value={`$${fmt(Math.round(totalVal/ITEMS.length))}`} color={COLORS.info}/>
        <MiniKpi label="Familles" value={FAMILLES.length} color={COLORS.accent}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:20 }}>
        <Card title="Valeur par famille (détaillé)">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={familyDetail} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false}/>
              <XAxis type="number" tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={false} tickFormatter={v=>fmtM(v)}/>
              <YAxis type="category" dataKey="name" tick={{ fill:COLORS.textMuted, fontSize:12 }} axisLine={false} width={100}/>
              <Tooltip content={<CustomTooltip/>} formatter={v=>fmtM(v)}/>
              <Bar dataKey="valeur" name="Valeur" radius={[0,6,6,0]} barSize={22}>
                {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Répartition en %">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((d,i)=><Cell key={i} fill={d.color} stroke="none"/>)}
              </Pie>
              <Tooltip formatter={v=>fmtM(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Détail par famille" headerRight={<ExportButton data={familyDetail} columns={[{key:"name",label:"Famille"},{key:"count",label:"Articles"},{key:r=>fmtM(r.valeur),label:"Valeur"},{key:"pct",label:"% total"},{key:"nb_a",label:"Classe A"},{key:"nb_b",label:"Classe B"},{key:"nb_c",label:"Classe C"},{key:"covMoy",label:"Couv. moy."},{key:"sousSeuil",label:"Sous seuil"}]} filename="familles_detail"/>}>
        <TableContainer>
          <thead><tr><Th>Famille</Th><Th>Articles</Th><Th>Valeur ann.</Th><Th>% total</Th><Th>Val. moy./article</Th><Th>A</Th><Th>B</Th><Th>C</Th><Th>Couv. moy.</Th><Th>Sous seuil</Th></tr></thead>
          <tbody>
            {familyDetail.map((f,i) => (
              <tr key={f.name} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Td style={{ fontWeight:600 }}><span style={{ display:"inline-block", width:8, height:8, borderRadius:4, background:pieData[i]?.color, marginRight:8 }}/>{f.name}</Td>
                <Td>{f.count}</Td>
                <Td style={{ fontWeight:600 }}>{fmtM(f.valeur)}</Td>
                <Td style={{ color:COLORS.accent }}>{f.pct}%</Td>
                <Td>{fmtM(f.moyArticle)}</Td>
                <Td style={{ color:"#f43f5e", fontWeight:600 }}>{f.nb_a}</Td>
                <Td style={{ color:"#f59e0b", fontWeight:600 }}>{f.nb_b}</Td>
                <Td style={{ color:"#6366f1", fontWeight:600 }}>{f.nb_c}</Td>
                <Td style={{ color:f.covMoy<20?COLORS.warning:COLORS.accent }}>{f.covMoy}j</Td>
                <Td style={{ color:f.sousSeuil>0?COLORS.danger:COLORS.textDim, fontWeight:f.sousSeuil>0?700:400 }}>{f.sousSeuil}</Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </Wrap>;
  }

  // ─── STATUT PO ──────────────────────────────────────────
  if (kpiId === "po_statut") {
    const allPOs = pos;
    const statusGroups = ["BROUILLON","A_VALIDER","ENVOYE","RECU","CLOS"].map(s => {
      const group = allPOs.filter(p=>p.statut===s);
      const totalVal = group.reduce((sum,p)=>sum+(p.prix_negocie||0)*p.qty,0);
      return { statut:s, count:group.length, valeur:totalVal };
    });
    const statusColors = { BROUILLON:"#6b7280", A_VALIDER:"#f59e0b", ENVOYE:"#3b82f6", RECU:"#10b981", CLOS:"#8b5cf6" };
    const pieData = statusGroups.map(g => ({ name:g.statut, value:g.count, color:statusColors[g.statut] }));

    const closedPOs = allPOs.filter(p=>p.statut==="CLOS"&&p.date_creation);
    const recuPOs = allPOs.filter(p=>(p.statut==="RECU"||p.statut==="CLOS")&&p.prix_paye&&p.prix_negocie);
    const ecartMoyen = recuPOs.length > 0 ? recuPOs.reduce((s,p)=>s+(p.prix_paye-p.prix_negocie)/p.prix_negocie*100,0)/recuPOs.length : 0;

    const openOld = [...allPOs].filter(p=>p.statut!=="CLOS"&&p.statut!=="RECU").sort((a,b)=>a.date_creation>b.date_creation?1:-1);

    return <Wrap title="Purchase Orders — Analyse par statut">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12, marginBottom:24 }}>
        {statusGroups.map(g => (
          <MiniKpi key={g.statut} label={g.statut.replace("_"," ")} value={<span>{g.count} <span style={{ fontSize:12, fontWeight:400, color:COLORS.textDim }}>({fmtM(g.valeur)})</span></span>} color={statusColors[g.statut]}/>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <Card title="Répartition par statut (volume)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3} dataKey="value" label={({name,value})=>`${name} (${value})`}>
                {pieData.map((d,i)=><Cell key={i} fill={d.color} stroke="none"/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Valeur engagée par statut">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="statut" tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={{ stroke:COLORS.border }}/>
              <YAxis tick={{ fill:COLORS.textMuted, fontSize:10 }} axisLine={false} tickFormatter={v=>fmtM(v)}/>
              <Tooltip content={<CustomTooltip/>} formatter={v=>`$${fmt(v)}`}/>
              <Bar dataKey="valeur" name="Valeur $" radius={[6,6,0,0]} barSize={45}>
                {statusGroups.map((g,i)=><Cell key={i} fill={statusColors[g.statut]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <Card title="Indicateurs workflow">
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <CalcRowSimple label="PO total" value={allPOs.length} color={COLORS.text}/>
            <CalcRowSimple label="Taux de clôture" value={`${allPOs.length>0?(allPOs.filter(p=>p.statut==="CLOS").length/allPOs.length*100).toFixed(0):0}%`} color={COLORS.accent}/>
            <CalcRowSimple label="Écart prix moyen (négocié vs payé)" value={`${ecartMoyen>=0?"+":""}${ecartMoyen.toFixed(2)}%`} color={ecartMoyen>2?COLORS.danger:COLORS.accent}/>
            <CalcRowSimple label="PO ouverts (non clos/reçus)" value={openOld.length} color={openOld.length>10?COLORS.warning:COLORS.text}/>
          </div>
        </Card>

        <Card title={`PO les plus anciens non clos (${openOld.length})`} headerRight={<ExportButton data={openOld} columns={[{key:"po_number",label:"PO"},{key:"article",label:"Article"},{key:"statut",label:"Statut"},{key:"date_creation",label:"Créé le"},{key:"qty",label:"Qty"},{key:r=>`$${(r.prix_negocie||0).toFixed(2)}`,label:"Prix négocié"}]} filename="po_anciens"/>}>
          <TableContainer>
            <thead><tr><Th>PO</Th><Th>Article</Th><Th>Statut</Th><Th>Créé le</Th><Th>Qty</Th><Th>Valeur</Th></tr></thead>
            <tbody>
              {openOld.slice(0,8).map(po => (
                <tr key={po.po_id} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:700, color:COLORS.accent }}>{po.po_number}</Td>
                  <Td style={{ fontWeight:500 }}>{po.article}</Td>
                  <Td><Badge>{po.statut}</Badge></Td>
                  <Td style={{ color:COLORS.textMuted, fontSize:12 }}>{po.date_creation}</Td>
                  <Td>{po.qty}</Td>
                  <Td>${fmt((po.prix_negocie||0)*po.qty)}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      </div>
    </Wrap>;
  }

  return null;
};

// Helper for PO expand
const CalcRowSimple = ({ label, value, color }) => {
  const COLORS = useTheme();
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize:15, fontWeight:700, color:color||COLORS.text }}>{value}</span>
    </div>
  );
};

// ─── TRS (Taux de Rendement Synthétique) ─────────────────────────────────────
const TRS_DEFAULTS = { tempsPlannifie: 160, arrets: 12, cadenceTheorique: 85, qteTotale: 11800, qteMauvaise: 280 };
const TRS_MONTHLY = [
  { mois:"Oct", dispo:91.2, perf:90.5, qual:96.8, trs:79.8 },
  { mois:"Nov", dispo:93.1, perf:91.8, qual:97.2, trs:83.1 },
  { mois:"Déc", dispo:89.5, perf:88.4, qual:95.9, trs:75.8 },
  { mois:"Jan", dispo:92.5, perf:93.8, qual:97.6, trs:84.7 },
  { mois:"Fév", dispo:94.0, perf:92.1, qual:98.0, trs:84.9 },
  { mois:"Mars", dispo:93.2, perf:94.5, qual:97.8, trs:86.1 },
];

const GaugeChart = ({ value, label, color, size=140 }) => {
  const COLORS = useTheme();
  const radius = (size-20)/2;
  const cx = size/2; const cy = size/2+10;
  const startAngle = -210; const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const valueAngle = startAngle + (value/100) * totalArc;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const needleX = cx + (radius-20) * Math.cos(toRad(valueAngle));
  const needleY = cy + (radius-20) * Math.sin(toRad(valueAngle));
  const level = value >= 85 ? "World Class" : value >= 75 ? "Bon" : value >= 60 ? "Acceptable" : "Critique";
  const levelColor = value >= 85 ? COLORS.accent : value >= 75 ? COLORS.info : value >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <svg width={size} height={size*0.7} viewBox={`0 0 ${size} ${size*0.75}`}>
        <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round"/>
        <path d={arcPath(startAngle, valueAngle, radius)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill={COLORS.text}/>
        <text x={cx} y={cy-18} textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="DM Sans">{value.toFixed(1)}%</text>
      </svg>
      <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, marginTop:2 }}>{label}</div>
      <div style={{ fontSize:10, fontWeight:600, color:levelColor, marginTop:2, padding:"2px 8px", borderRadius:4, background:`${levelColor}18` }}>{level}</div>
    </div>
  );
};

const TRSPage = () => {
  const COLORS = useTheme();
  const [inputs, setInputs] = useState(TRS_DEFAULTS);
  const update = (key, val) => setInputs(prev => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));

  // Calculs
  const tempsFonct = inputs.tempsPlannifie - inputs.arrets;
  const dispo = inputs.tempsPlannifie > 0 ? (tempsFonct / inputs.tempsPlannifie) * 100 : 0;
  const perf = tempsFonct > 0 && inputs.cadenceTheorique > 0 ? ((inputs.qteTotale / tempsFonct) / inputs.cadenceTheorique) * 100 : 0;
  const qual = inputs.qteTotale > 0 ? ((inputs.qteTotale - inputs.qteMauvaise) / inputs.qteTotale) * 100 : 0;
  const trs = (dispo/100) * (perf/100) * (qual/100) * 100;
  const qteBonne = inputs.qteTotale - inputs.qteMauvaise;

  const InputRow = ({ label, field, unit="" }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="number" value={inputs[field]} onChange={e=>update(field, e.target.value)}
          style={{ width:80, padding:"5px 10px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.accent, fontSize:14, fontWeight:700, textAlign:"right", outline:"none" }}
          onFocus={e=>e.target.style.borderColor=COLORS.accent} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
        {unit && <span style={{ fontSize:11, color:COLORS.textDim, width:16 }}>{unit}</span>}
      </div>
    </div>
  );

  const CalcRow = ({ label, value, unit="%", color }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize:15, fontWeight:700, color:color||COLORS.text }}>{typeof value==="number"?value.toFixed(1):value}{unit}</span>
    </div>
  );

  const trsColor = trs >= 85 ? COLORS.accent : trs >= 75 ? COLORS.info : trs >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16 }}>
        <KpiCard label="Disponibilité" value={`${dispo.toFixed(1)}%`} sub={`${tempsFonct}h / ${inputs.tempsPlannifie}h`} color={dispo>=90?COLORS.accent:COLORS.warning}/>
        <KpiCard label="Performance" value={`${perf.toFixed(1)}%`} sub={`Cadence réelle: ${tempsFonct>0?(inputs.qteTotale/tempsFonct).toFixed(1):0}/h`} color={perf>=95?COLORS.accent:COLORS.info}/>
        <KpiCard label="Qualité" value={`${qual.toFixed(1)}%`} sub={`${qteBonne} bonnes / ${inputs.qteTotale}`} color={qual>=99?COLORS.accent:qual>=95?COLORS.info:COLORS.warning}/>
        <KpiCard label="TRS Global" value={`${trs.toFixed(1)}%`} sub={trs>=85?"World Class":trs>=75?"Bon":trs>=60?"Acceptable":"Critique"} color={trsColor}/>
      </div>

      {/* Gauges + Inputs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Jauges de performance">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16, padding:"12px 0" }}>
            <GaugeChart value={dispo} label="Disponibilité" color="#10B981"/>
            <GaugeChart value={Math.min(perf,100)} label="Performance" color="#3B82F6"/>
            <GaugeChart value={qual} label="Qualité" color="#A855F7"/>
            <GaugeChart value={Math.min(trs,100)} label="TRS" color="#F59E0B"/>
          </div>
        </Card>

        <div style={{ display:"grid", gridTemplateRows:"1fr 1fr", gap:16 }}>
          <Card title="Inputs production" headerRight={<button onClick={()=>setInputs(TRS_DEFAULTS)} style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, fontSize:10, cursor:"pointer" }}>Réinitialiser</button>}>
            <InputRow label="Temps planifié" field="tempsPlannifie" unit="h"/>
            <InputRow label="Arrêts non planifiés" field="arrets" unit="h"/>
            <InputRow label="Cadence théorique" field="cadenceTheorique" unit="/h"/>
            <InputRow label="Quantité totale" field="qteTotale"/>
            <InputRow label="Quantité rejetée" field="qteMauvaise"/>
          </Card>

          <Card title="Résultats calculés">
            <CalcRow label="Temps de fonctionnement" value={tempsFonct} unit="h" color={COLORS.text}/>
            <CalcRow label="Cadence réelle" value={tempsFonct>0?inputs.qteTotale/tempsFonct:0} unit="/h" color={COLORS.info}/>
            <CalcRow label="Quantités bonnes" value={qteBonne} unit="" color={COLORS.accent}/>
            <CalcRow label="Taux de rebut" value={inputs.qteTotale>0?(inputs.qteMauvaise/inputs.qteTotale)*100:0} unit="%" color={COLORS.danger}/>
          </Card>
        </div>
      </div>

      {/* Trend chart */}
      <Card title="Tendance mensuelle (6 mois)" headerRight={<ExportButton data={TRS_MONTHLY} columns={[{key:"mois",label:"Mois"},{key:"dispo",label:"Disponibilité %"},{key:"perf",label:"Performance %"},{key:"qual",label:"Qualité %"},{key:"trs",label:"TRS %"}]} filename="trs_tendance"/>}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={TRS_MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="mois" tick={{ fill:COLORS.textMuted, fontSize:12 }} axisLine={{ stroke:COLORS.border }}/>
            <YAxis domain={[60,100]} tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} unit="%"/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ fontSize:11, color:COLORS.textMuted }}/>
            <Line type="monotone" dataKey="dispo" name="Disponibilité" stroke="#10B981" strokeWidth={2} dot={{ r:4 }}/>
            <Line type="monotone" dataKey="perf" name="Performance" stroke="#3B82F6" strokeWidth={2} dot={{ r:4 }}/>
            <Line type="monotone" dataKey="qual" name="Qualité" stroke="#A855F7" strokeWidth={2} dot={{ r:4 }}/>
            <Bar dataKey="trs" name="TRS" fill="#F59E0B" fillOpacity={0.25} radius={[4,4,0,0]} barSize={30}/>
            <Line type="monotone" dataKey="trs" name="TRS (ligne)" stroke="#F59E0B" strokeWidth={3} dot={{ r:5, fill:"#F59E0B" }} strokeDasharray=""/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Historical table + Formulas */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Historique mensuel">
          <TableContainer>
            <thead><tr><Th>Mois</Th><Th>Dispo.</Th><Th>Perf.</Th><Th>Qual.</Th><Th>TRS</Th><Th>Niveau</Th></tr></thead>
            <tbody>
              {TRS_MONTHLY.map(m => {
                const lvl = m.trs >= 85 ? "World Class" : m.trs >= 75 ? "Bon" : m.trs >= 60 ? "Acceptable" : "Critique";
                const lc = m.trs >= 85 ? COLORS.accent : m.trs >= 75 ? COLORS.info : m.trs >= 60 ? COLORS.warning : COLORS.danger;
                return (
                  <tr key={m.mois} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td style={{ fontWeight:600 }}>{m.mois}</Td>
                    <Td>{m.dispo}%</Td>
                    <Td>{m.perf}%</Td>
                    <Td>{m.qual}%</Td>
                    <Td style={{ fontWeight:700, color:lc }}>{m.trs}%</Td>
                    <Td><span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:600, background:`${lc}18`, color:lc }}>{lvl}</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="Formules et repères">
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { name:"Disponibilité", formula:"(Temps planifié − Arrêts) / Temps planifié", desc:"Mesure le temps réellement productif par rapport au temps prévu" },
              { name:"Performance", formula:"(Qté totale / Temps fonct.) / Cadence théorique", desc:"Ratio entre cadence réelle et cadence nominale de la machine" },
              { name:"Qualité", formula:"(Qté totale − Qté rejetée) / Qté totale", desc:"Part de production conforme sans reprise ni rebut" },
              { name:"TRS", formula:"Disponibilité × Performance × Qualité", desc:"Indicateur synthétique de l'efficacité globale de l'équipement" },
            ].map(f => (
              <div key={f.name} style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight:700, color:COLORS.accent, marginBottom:4, fontSize:13 }}>{f.name}</div>
                <div style={{ fontFamily:"'Courier New', monospace", fontSize:12, color:COLORS.text, padding:"6px 10px", background:COLORS.bg, borderRadius:6, marginBottom:6, border:`1px solid ${COLORS.border}` }}>{f.formula}</div>
                <div style={{ fontSize:11, color:COLORS.textDim }}>{f.desc}</div>
              </div>
            ))}

            <div style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}`, marginTop:4 }}>
              <div style={{ fontWeight:700, color:COLORS.text, marginBottom:8, fontSize:13 }}>Repères industriels</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { label:"World Class", min:"≥ 85%", color:COLORS.accent },
                  { label:"Bon", min:"75–84%", color:COLORS.info },
                  { label:"Acceptable", min:"60–74%", color:COLORS.warning },
                  { label:"Critique", min:"< 60%", color:COLORS.danger },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:6, background:`${r.color}10` }}>
                    <div style={{ width:8, height:8, borderRadius:4, background:r.color }}/>
                    <span style={{ fontSize:12, color:COLORS.text, fontWeight:500 }}>{r.label}</span>
                    <span style={{ fontSize:11, color:COLORS.textDim, marginLeft:"auto" }}>{r.min}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── CYCLE COUNT PAGE ────────────────────────────────────────────────────────
const CycleCountPage = () => {
  const COLORS = useTheme();
  const { counts, setCounts, addEvent, setTasks, tasks, showToast } = useData();
  const [activeTab, setActiveTab] = useState("plan"); // plan | saisie | historique | analyse
  const [countForm, setCountForm] = useState({ sku:"", stockCompte:"", cause:null, zone:null, actions:[], comment:"" });
  const [showQuestionnaire, setShowQuestionnaire] = useState(null); // { sku, stockSys, stockCompte, ecart, ecartPct, item }

  // Plan: items to count this month based on ABC frequency
  const currentMonth = 3; // March
  const itemsToCount = useMemo(() => {
    return ITEMS.filter(item => {
      const freq = CYCLE_FREQ[item.abc] || 6;
      return currentMonth % freq === 0 || freq === 1;
    }).map(item => {
      const lastCount = [...counts].reverse().find(c => c.sku === item.sku);
      return { ...item, lastCount: lastCount?.date || "Jamais", alreadyCounted: lastCount && lastCount.date >= "2026-03-01" };
    }).sort((a, b) => {
      if (a.alreadyCounted !== b.alreadyCounted) return a.alreadyCounted ? 1 : -1;
      return (a.couverture||999) - (b.couverture||999);
    });
  }, [counts]);

  const remaining = itemsToCount.filter(i => !i.alreadyCounted).length;
  const completed = itemsToCount.filter(i => i.alreadyCounted).length;
  const total = itemsToCount.length;

  // Precision calc
  const thisMonthCounts = counts.filter(c => c.date >= "2026-03-01");
  const precisionCount = thisMonthCounts.filter(c => {
    const item = ITEMS.find(i => i.sku === c.sku);
    const seuil = ECART_SEUILS[item?.abc || "C"];
    return Math.abs(c.ecart_pct) <= seuil;
  }).length;
  const precision = thisMonthCounts.length > 0 ? (precisionCount / thisMonthCounts.length * 100) : 100;
  const valeurEcarts = counts.reduce((s, c) => s + Math.abs(c.ecart) * (ITEMS.find(i => i.sku === c.sku)?.cout_unitaire || 0), 0);

  // Handle count submission
  const handleStartCount = (item) => {
    setCountForm({ sku: item.sku, stockCompte: "", cause: null, zone: null, actions: [], comment: "" });
    setActiveTab("saisie");
  };

  const handleStockEntry = () => {
    const item = ITEMS.find(i => i.sku === countForm.sku);
    if (!item || !countForm.stockCompte) return;
    const stockSys = item.stock_net;
    const stockCompte = parseInt(countForm.stockCompte);
    const ecart = stockCompte - stockSys;
    const ecartPct = stockSys > 0 ? (ecart / stockSys * 100) : 0;
    const seuil = ECART_SEUILS[item.abc || "C"];

    if (Math.abs(ecartPct) > seuil) {
      setShowQuestionnaire({ sku: item.sku, stockSys, stockCompte, ecart, ecartPct: +ecartPct.toFixed(1), item });
    } else {
      // No questionnaire needed — auto validate
      submitCount(item.sku, stockSys, stockCompte, ecart, +ecartPct.toFixed(1), null, null, [], "", "Validé");
    }
  };

  const submitCount = (sku, stockSys, stockCompte, ecart, ecartPct, cause, zone, actions, comment, statut) => {
    const item = ITEMS.find(i => i.sku === sku);
    const isCritical = CRITICAL_CAUSES.includes(cause);
    const finalStatut = isCritical ? "Investigation" : statut;

    const newCount = {
      id: counts.length + 1, sku, date: TODAY,
      stock_systeme: stockSys, stock_compte: stockCompte,
      ecart, ecart_pct: ecartPct, statut: finalStatut,
      compteur: "Jean Dupont", cause, zone, actions, comment,
    };
    setCounts(prev => [newCount, ...prev]);

    // Update stock_net on the item
    if (item) item.stock_net = stockCompte;

    // Audit event
    const level = Math.abs(ecartPct) <= 5 ? "INFO" : Math.abs(ecartPct) <= 15 ? "WARNING" : "ERROR";
    addEvent("CYCLE_COUNT", "Item", item?.id || 0,
      `Comptage ${sku}: système ${stockSys} → compté ${stockCompte} (écart ${ecart >= 0 ? "+" : ""}${ecart}, ${ecartPct}%)${cause ? ` — Cause: ${cause}` : ""}`,
      level);

    // Investigation task if critical
    if (isCritical) {
      const newTask = {
        task_id: tasks.length + 100, type: "Investigation écart inventaire",
        related_po_id: null, assigned_to: "Sophie Gagnon", status: "Ouverte",
        due_at: "2026-03-21", comment: `Écart critique ${sku}: ${ecart} unités (${ecartPct}%) — ${cause}`,
      };
      setTasks(prev => [newTask, ...prev]);
    }

    showToast(isCritical
      ? `Comptage ${sku} — investigation créée (${cause})`
      : `Comptage ${sku} validé (écart: ${ecart >= 0 ? "+" : ""}${ecart})`,
      isCritical ? "error" : "success"
    );

    setShowQuestionnaire(null);
    setCountForm({ sku: "", stockCompte: "", cause: null, zone: null, actions: [], comment: "" });
    setActiveTab("historique");
  };

  const handleQuestionnaireSubmit = () => {
    const q = showQuestionnaire;
    if (!countForm.cause || !countForm.zone) return;
    submitCount(q.sku, q.stockSys, q.stockCompte, q.ecart, q.ecartPct,
      countForm.cause, countForm.zone, countForm.actions, countForm.comment,
      Math.abs(q.ecartPct) > 15 ? "Investigation" : "Validé");
  };

  // Analyse data
  const causeData = useMemo(() => {
    const withCause = counts.filter(c => c.cause);
    const grouped = {};
    withCause.forEach(c => { grouped[c.cause] = (grouped[c.cause] || 0) + 1; });
    return Object.entries(grouped).map(([cause, count], i) => ({
      name: cause.length > 25 ? cause.slice(0, 25) + "…" : cause,
      fullName: cause, value: count,
      color: ["#f43f5e", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#06b6d4", "#ec4899", "#6366f1", "#84cc16"][i % 9],
    })).sort((a, b) => b.value - a.value);
  }, [counts]);

  const zoneData = useMemo(() => {
    const withZone = counts.filter(c => c.zone);
    const grouped = {};
    withZone.forEach(c => { grouped[c.zone] = (grouped[c.zone] || 0) + 1; });
    return Object.entries(grouped).map(([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count);
  }, [counts]);

  const causeByABC = useMemo(() => {
    return ["A", "B", "C"].map(abc => {
      const items = counts.filter(c => { const it = ITEMS.find(i => i.sku === c.sku); return it?.abc === abc && c.cause; });
      const topCause = items.length > 0 ? (() => { const g = {}; items.forEach(c => { g[c.cause] = (g[c.cause]||0)+1; }); return Object.entries(g).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—"; })() : "—";
      return { abc, comptages: items.length, topCause };
    });
  }, [counts]);

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${activeTab === id ? COLORS.accent : COLORS.border}`,
        background: activeTab === id ? COLORS.accentGlow : "transparent",
        color: activeTab === id ? COLORS.accent : COLORS.textMuted,
        fontSize: 13, fontWeight: activeTab === id ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
      {label}
    </button>
  );

  const CheckOption = ({ label, checked, onChange }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6,
      background: checked ? COLORS.accentGlow : "transparent", border: `1px solid ${checked ? COLORS.accent : COLORS.border}`,
      cursor: "pointer", fontSize: 12, color: checked ? COLORS.accent : COLORS.textMuted, transition: "all 0.15s" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }}/>
      <span style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${checked ? COLORS.accent : COLORS.textDim}`,
        background: checked ? COLORS.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      {label}
    </label>
  );

  const RadioOption = ({ label, selected, onSelect }) => (
    <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8,
      background: selected ? COLORS.accentGlow : "transparent", border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
      cursor: "pointer", fontSize: 12, color: selected ? COLORS.accent : COLORS.textMuted, transition: "all 0.15s" }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${selected ? COLORS.accent : COLORS.textDim}`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <span style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.accent }}/>}
      </span>
      {label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        <KpiCard label="Précision inventaire" value={`${precision.toFixed(1)}%`} color={precision >= 95 ? COLORS.accent : precision >= 85 ? COLORS.warning : COLORS.danger}/>
        <KpiCard label="Comptages ce mois" value={thisMonthCounts.length} sub={`sur ${total} planifiés`} color={COLORS.info}/>
        <KpiCard label="Restants à compter" value={remaining} color={remaining > 50 ? COLORS.danger : COLORS.warning}/>
        <KpiCard label="En investigation" value={counts.filter(c => c.statut === "Investigation").length} color={COLORS.danger}/>
        <KpiCard label="Valeur des écarts" value={`$${fmt(Math.round(valeurEcarts))}`} color={COLORS.warning}/>
        <KpiCard label="Jamais comptés" value={ITEMS.filter(i => !counts.some(c => c.sku === i.sku)).length} color={COLORS.textDim}/>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        <Tab id="plan" label={`Plan de comptage (${remaining} restants)`}/>
        <Tab id="saisie" label="Saisie comptage"/>
        <Tab id="historique" label={`Historique (${counts.length})`}/>
        <Tab id="analyse" label="Analyse causes"/>
      </div>

      {/* ─── TAB: PLAN ─── */}
      {activeTab === "plan" && (
        <Card title={`Articles à compter — Mars 2026 (${total} planifiés, ${remaining} restants)`}
          headerRight={<ExportButton data={itemsToCount} columns={[{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"abc",label:"ABC"},{key:"famille",label:"Famille"},{key:"stock_net",label:"Stock"},{key:r=>r.lastCount,label:"Dernier comptage"},{key:r=>r.alreadyCounted?"Oui":"Non",label:"Compté ce mois"}]} filename="plan_comptage"/>}>
          <TableContainer>
            <thead><tr><Th>SKU</Th><Th>Article</Th><Th>ABC</Th><Th>Fréquence</Th><Th>Stock actuel</Th><Th>Dernier comptage</Th><Th>Statut</Th><Th>Action</Th></tr></thead>
            <tbody>
              {itemsToCount.slice(0, 30).map(item => (
                <tr key={item.id} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Td style={{ fontWeight: 600, color: COLORS.accent, fontSize: 12 }}>{item.sku}</Td>
                  <Td style={{ fontWeight: 500 }}>{item.article}</Td>
                  <Td><Badge>{item.abc}</Badge></Td>
                  <Td style={{ color: COLORS.textMuted }}>Chaque {CYCLE_FREQ[item.abc]}m</Td>
                  <Td>{fmt(item.stock_net)}</Td>
                  <Td style={{ color: COLORS.textDim, fontSize: 12 }}>{item.lastCount}</Td>
                  <Td>{item.alreadyCounted
                    ? <span style={{ color: COLORS.accent, fontSize: 11, fontWeight: 600 }}>✓ Compté</span>
                    : <span style={{ color: COLORS.warning, fontSize: 11, fontWeight: 600 }}>À compter</span>}
                  </Td>
                  <Td>{!item.alreadyCounted && <button onClick={() => handleStartCount(item)}
                    style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${COLORS.accent}`, background: COLORS.accentGlow, color: COLORS.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Compter</button>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {/* ─── TAB: SAISIE ─── */}
      {activeTab === "saisie" && (
        <Card title="Saisie de comptage">
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Article (SKU ou nom)</div>
              <input value={countForm.sku} onChange={e => setCountForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="Ex: SKU-0003" list="sku-list"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none", boxSizing:"border-box" }}/>
              <datalist id="sku-list">{ITEMS.slice(0, 50).map(i => <option key={i.sku} value={i.sku}>{i.article}</option>)}</datalist>
            </div>
            {countForm.sku && ITEMS.find(i => i.sku === countForm.sku) && (
              <div style={{ background: COLORS.surface, borderRadius: 10, padding: 14, border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
                {(() => { const item = ITEMS.find(i => i.sku === countForm.sku); return item ? <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{item.article}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: COLORS.textMuted }}>
                    <span>Stock système: <strong style={{ color: COLORS.text }}>{fmt(item.stock_net)}</strong></span>
                    <span>Classe: <Badge>{item.abc}</Badge></span>
                    <span>Seuil écart: ±{ECART_SEUILS[item.abc]}%</span>
                  </div>
                </> : null; })()}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Quantité comptée physiquement</div>
              <input type="number" value={countForm.stockCompte} onChange={e => setCountForm(f => ({ ...f, stockCompte: e.target.value }))}
                placeholder="Entrer la quantité"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.accent, fontSize: 18, fontWeight: 700, outline: "none", boxSizing:"border-box" }}/>
            </div>
            {countForm.sku && countForm.stockCompte && (() => {
              const item = ITEMS.find(i => i.sku === countForm.sku);
              if (!item) return null;
              const ecart = parseInt(countForm.stockCompte) - item.stock_net;
              const ecartPct = item.stock_net > 0 ? (ecart / item.stock_net * 100) : 0;
              const seuil = ECART_SEUILS[item.abc || "C"];
              const overSeuil = Math.abs(ecartPct) > seuil;
              return <div style={{ background: overSeuil ? COLORS.dangerDim : COLORS.accentGlow, borderRadius: 10, padding: 14, border: `1px solid ${overSeuil ? "rgba(239,68,68,0.3)" : COLORS.accentDim}`, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
                  <span style={{ color: COLORS.textMuted }}>Écart: <strong style={{ color: overSeuil ? COLORS.danger : COLORS.accent }}>{ecart >= 0 ? "+" : ""}{ecart} unités ({ecartPct.toFixed(1)}%)</strong></span>
                  <span style={{ color: overSeuil ? COLORS.danger : COLORS.accent, fontWeight: 600 }}>
                    {overSeuil ? "⚠ Questionnaire requis" : "✓ Écart acceptable"}
                  </span>
                </div>
              </div>;
            })()}
            <button onClick={handleStockEntry} disabled={!countForm.sku || !countForm.stockCompte || !ITEMS.find(i => i.sku === countForm.sku)}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (!countForm.sku || !countForm.stockCompte) ? 0.5 : 1 }}>
              Soumettre le comptage
            </button>
          </div>
        </Card>
      )}

      {/* ─── QUESTIONNAIRE MODAL ─── */}
      {showQuestionnaire && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1005 }}>
          <div style={{ width: 560, maxHeight: "85vh", overflowY: "auto", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Questionnaire d'écart</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>
              <strong style={{ color: COLORS.danger }}>{showQuestionnaire.sku}</strong> — Écart de <strong style={{ color: COLORS.danger }}>{showQuestionnaire.ecart >= 0 ? "+" : ""}{showQuestionnaire.ecart}</strong> unités ({showQuestionnaire.ecartPct}%)
            </div>

            {/* Q1: Cause */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>1. Cause principale de l'écart *</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CAUSE_OPTIONS.map(c => <RadioOption key={c} label={c} selected={countForm.cause === c} onSelect={() => setCountForm(f => ({ ...f, cause: c }))}/>)}
              </div>
            </div>

            {/* Q2: Zone */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>2. Zone de stockage concernée *</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ZONE_OPTIONS.map(z => <RadioOption key={z} label={z} selected={countForm.zone === z} onSelect={() => setCountForm(f => ({ ...f, zone: z }))}/>)}
              </div>
            </div>

            {/* Q3: Actions */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>3. Actions correctives recommandées</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ACTION_OPTIONS.map(a => <CheckOption key={a} label={a}
                  checked={countForm.actions.includes(a)}
                  onChange={() => setCountForm(f => ({ ...f, actions: f.actions.includes(a) ? f.actions.filter(x => x !== a) : [...f.actions, a] }))}/>)}
              </div>
            </div>

            {/* Q4: Comment */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>4. Commentaire (optionnel)</div>
              <textarea value={countForm.comment} onChange={e => setCountForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing:"border-box" }}
                placeholder="Détails supplémentaires..."/>
            </div>

            {CRITICAL_CAUSES.includes(countForm.cause) && (
              <div style={{ background: COLORS.dangerDim, borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 12, color: COLORS.danger, border: "1px solid rgba(239,68,68,0.3)" }}>
                ⚠ Cause critique détectée — une tâche d'investigation sera automatiquement créée.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowQuestionnaire(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button onClick={handleQuestionnaireSubmit} disabled={!countForm.cause || !countForm.zone}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (!countForm.cause || !countForm.zone) ? 0.5 : 1 }}>
                Valider le comptage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: HISTORIQUE ─── */}
      {activeTab === "historique" && (
        <Card title={`Historique des comptages (${counts.length})`}
          headerRight={<ExportButton data={counts.map(c => ({ ...c, article: ITEMS.find(i => i.sku === c.sku)?.article || "" }))}
            columns={[{key:"date",label:"Date"},{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"stock_systeme",label:"Stock sys."},{key:"stock_compte",label:"Compté"},{key:"ecart",label:"Écart"},{key:"ecart_pct",label:"% Écart"},{key:"statut",label:"Statut"},{key:"compteur",label:"Compteur"},{key:"cause",label:"Cause"},{key:"zone",label:"Zone"}]}
            filename="historique_comptages"/>}>
          <TableContainer>
            <thead><tr><Th>Date</Th><Th>SKU</Th><Th>Article</Th><Th>Stock sys.</Th><Th>Compté</Th><Th>Écart</Th><Th>%</Th><Th>Statut</Th><Th>Compteur</Th><Th>Cause</Th></tr></thead>
            <tbody>
              {counts.map(c => {
                const item = ITEMS.find(i => i.sku === c.sku);
                return (
                  <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Td style={{ fontSize: 12, color: COLORS.textMuted }}>{c.date}</Td>
                    <Td style={{ fontWeight: 600, color: COLORS.accent, fontSize: 12 }}>{c.sku}</Td>
                    <Td style={{ fontWeight: 500 }}>{item?.article || "—"}</Td>
                    <Td>{c.stock_systeme}</Td>
                    <Td style={{ fontWeight: 600 }}>{c.stock_compte}</Td>
                    <Td style={{ fontWeight: 700, color: c.ecart === 0 ? COLORS.textDim : c.ecart < 0 ? COLORS.danger : COLORS.warning }}>
                      {c.ecart >= 0 ? "+" : ""}{c.ecart}
                    </Td>
                    <Td style={{ color: Math.abs(c.ecart_pct) > 10 ? COLORS.danger : Math.abs(c.ecart_pct) > 5 ? COLORS.warning : COLORS.textMuted }}>
                      {c.ecart_pct >= 0 ? "+" : ""}{c.ecart_pct}%
                    </Td>
                    <Td><Badge>{c.statut === "Investigation" ? "ERROR" : "Conforme"}</Badge></Td>
                    <Td style={{ color: COLORS.textMuted }}>{c.compteur}</Td>
                    <Td style={{ fontSize: 11, color: COLORS.textDim, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{c.cause || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {/* ─── TAB: ANALYSE ─── */}
      {activeTab === "analyse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Répartition des causes racines">
              {causeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={causeData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {causeData.map((d, i) => <Cell key={i} fill={d.color} stroke="none"/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ padding: 40, textAlign: "center", color: COLORS.textDim }}>Aucun écart avec cause enregistré</div>}
            </Card>

            <Card title="Tendance précision mensuelle">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={MONTHLY_PRECISION}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
                  <XAxis dataKey="mois" tick={{ fill: COLORS.textMuted, fontSize: 12 }} axisLine={{ stroke: COLORS.border }}/>
                  <YAxis domain={[80, 100]} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} unit="%"/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="comptages" name="Comptages" fill={COLORS.info} fillOpacity={0.2} radius={[4, 4, 0, 0]} barSize={28} yAxisId={0}/>
                  <Line type="monotone" dataKey="precision" name="Précision %" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 5, fill: COLORS.accent }}/>
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Card title="Causes par classe ABC">
              <TableContainer>
                <thead><tr><Th>Classe</Th><Th>Comptages avec écart</Th><Th>Cause #1</Th></tr></thead>
                <tbody>
                  {causeByABC.map(c => (
                    <tr key={c.abc} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Td><Badge>{c.abc}</Badge></Td>
                      <Td>{c.comptages}</Td>
                      <Td style={{ fontSize: 11, color: COLORS.textMuted }}>{c.topCause}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableContainer>
            </Card>

            <Card title="Top zones problématiques">
              <TableContainer>
                <thead><tr><Th>Zone</Th><Th>Écarts</Th></tr></thead>
                <tbody>
                  {zoneData.map(z => (
                    <tr key={z.zone} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Td style={{ fontWeight: 500 }}>{z.zone}</Td>
                      <Td style={{ fontWeight: 700, color: z.count > 3 ? COLORS.danger : COLORS.text }}>{z.count}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableContainer>
            </Card>

            <Card title="Précision par classe (cible)">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ abc: "A", cible: 95 }, { abc: "B", cible: 90 }, { abc: "C", cible: 85 }].map(c => {
                  const items = counts.filter(ct => { const it = ITEMS.find(i => i.sku === ct.sku); return it?.abc === c.abc; });
                  const prec = items.length > 0 ? items.filter(ct => Math.abs(ct.ecart_pct) <= ECART_SEUILS[c.abc]).length / items.length * 100 : 100;
                  const ok = prec >= c.cible;
                  return (
                    <div key={c.abc} style={{ background: COLORS.surface, borderRadius: 10, padding: 12, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>Classe {c.abc}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ok ? COLORS.accent : COLORS.danger }}>{prec.toFixed(1)}% <span style={{ fontSize: 10, fontWeight: 400, color: COLORS.textDim }}>/ {c.cible}%</span></span>
                      </div>
                      <div style={{ background: COLORS.bg, borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(prec, 100)}%`, height: "100%", background: ok ? COLORS.accent : COLORS.danger, borderRadius: 4, transition: "width 0.3s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── IMPORT SYSTEM (Admin only) ──────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ""));
  return { headers, rows };
};

const ImportModal = ({ type, onClose, onImport }) => {
  const COLORS = useTheme();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const expectedCols = type === "items"
    ? ["sku","nom","famille","demande_annuelle","cout_unitaire","cout_commande","stock_net","seuil_min","stock_securite","lead_time_jours"]
    : ["sku","supplier_id","qty","prix_negocie","commentaire"];

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCSV(ev.target.result);
        if (rows.length === 0) { setError("Fichier vide ou format invalide"); return; }
        setPreview({ headers, rows: rows.slice(0, 5), totalRows: rows.length, allRows: rows });
      } catch (err) { setError("Erreur de lecture: " + err.message); }
    };
    reader.readAsText(f, 'UTF-8');
  };

  const handleImport = () => {
    if (!preview) return;
    setImporting(true);
    setTimeout(() => { onImport(preview.allRows); setImporting(false); }, 500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
      <div style={{ width:640, maxHeight:"85vh", overflowY:"auto", background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text }}>{type === "items" ? "📥 Importer des articles" : "📥 Importer des commandes"}</div>
            <div style={{ fontSize:12, color:COLORS.textDim, marginTop:4 }}>Format : CSV (séparateur virgule, point-virgule ou tabulation)</div>
          </div>
          <button onClick={onClose} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}`, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:8 }}>Colonnes attendues</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {expectedCols.map(c => <span key={c} style={{ padding:"3px 10px", borderRadius:5, fontSize:11, background:COLORS.bg, color:COLORS.accent, border:`1px solid ${COLORS.border}`, fontFamily:"monospace" }}>{c}</span>)}
          </div>
        </div>

        <label style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", borderRadius:12, border:`2px dashed ${file ? COLORS.accent : COLORS.border}`, background:file ? COLORS.accentGlow : "transparent", cursor:"pointer", transition:"all 0.15s", marginBottom:16 }}>
          <input type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{ display:"none" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{file ? "✅" : "📄"}</div>
            <div style={{ fontSize:13, color:file ? COLORS.accent : COLORS.textMuted, fontWeight:file ? 600 : 400 }}>{file ? file.name : "Cliquer pour sélectionner un fichier CSV"}</div>
            {file && <div style={{ fontSize:11, color:COLORS.textDim, marginTop:4 }}>{(file.size / 1024).toFixed(1)} Ko</div>}
          </div>
        </label>

        {error && <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#EF4444", fontSize:12, marginBottom:16 }}>{error}</div>}

        {preview && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, marginBottom:8 }}>Aperçu — {preview.totalRows} lignes détectées</div>
            <div style={{ overflowX:"auto", borderRadius:8, border:`1px solid ${COLORS.border}` }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr style={{ background:COLORS.surface }}>{preview.headers.map(h => <th key={h} style={{ padding:"8px 10px", textAlign:"left", color:COLORS.textMuted, fontWeight:600, borderBottom:`1px solid ${COLORS.border}`, whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>{preview.rows.map((row, i) => (
                  <tr key={i}>{preview.headers.map(h => <td key={h} style={{ padding:"6px 10px", color:COLORS.text, borderBottom:`1px solid ${COLORS.border}22`, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row[h]}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            {preview.totalRows > 5 && <div style={{ fontSize:11, color:COLORS.textDim, marginTop:6 }}>... et {preview.totalRows - 5} lignes supplémentaires</div>}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
          <button onClick={handleImport} disabled={!preview || importing}
            style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:preview && !importing ? 1 : 0.5 }}>
            {importing ? "Import en cours..." : `Importer ${preview ? preview.totalRows : 0} lignes`}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentAttachModal = ({ po, onClose, onAttach }) => {
  const COLORS = useTheme();
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState("Bon de livraison");
  const DOC_TYPES = ["Bon de livraison","Facture fournisseur","Bon de réception","Photo","Certificat qualité","Autre"];

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name, size: f.size, type: docType, uploadedAt: TODAY, uploadedBy: "Jean Dupont",
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleAttach = () => {
    if (files.length === 0) return;
    onAttach(po.po_id, files);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
      <div style={{ width:500, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>📎 Joindre des documents</div>
        <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:20 }}>
          <strong style={{ color:COLORS.accent }}>{po.po_number}</strong> — {po.article}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:COLORS.text, marginBottom:8 }}>Type de document</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {DOC_TYPES.map(t => (
              <button key={t} onClick={() => setDocType(t)}
                style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${docType === t ? COLORS.accent : COLORS.border}`,
                  background:docType === t ? COLORS.accentGlow : "transparent", color:docType === t ? COLORS.accent : COLORS.textMuted,
                  fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>{t}</button>
            ))}
          </div>
        </div>

        <label style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 16px", borderRadius:12, border:`2px dashed ${COLORS.border}`, cursor:"pointer", marginBottom:16 }}>
          <input type="file" multiple onChange={handleFiles} style={{ display:"none" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:4 }}>📁</div>
            <div style={{ fontSize:12, color:COLORS.textMuted }}>Cliquer pour ajouter des fichiers</div>
          </div>
        </label>

        {files.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:COLORS.text, marginBottom:8 }}>{files.length} document{files.length > 1 ? "s" : ""} prêt{files.length > 1 ? "s" : ""}</div>
            {files.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, background:COLORS.surface, border:`1px solid ${COLORS.border}`, marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{f.type === "Photo" ? "📷" : f.type === "Facture fournisseur" ? "🧾" : "📄"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:COLORS.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                  <div style={{ fontSize:10, color:COLORS.textDim }}>{f.type} · {(f.size / 1024).toFixed(1)} Ko</div>
                </div>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  style={{ padding:"2px 6px", borderRadius:4, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textDim, cursor:"pointer", fontSize:10 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Already attached */}
        {po.documents && po.documents.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:COLORS.textMuted, marginBottom:8 }}>Documents déjà joints ({po.documents.length})</div>
            {po.documents.map((d, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 12px", borderRadius:6, fontSize:11, color:COLORS.textDim }}>
                <span>📄</span> {d.name} <span style={{ color:COLORS.textDim }}>({d.type})</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Fermer</button>
          {files.length > 0 && <button onClick={handleAttach}
            style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Joindre {files.length} document{files.length > 1 ? "s" : ""}
          </button>}
        </div>
      </div>
    </div>
  );
};

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [isDark] = useState(true);
  const COLORS = THEMES.dark;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError("Identifiants invalides");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{ minHeight:"100vh", background:COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width:420, padding:40, background:COLORS.card, borderRadius:24, border:`1px solid ${COLORS.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg, #10B981, #059669)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color:COLORS.text, letterSpacing:"-0.02em" }}>SupplyPilot</div>
            <div style={{ fontSize:11, color:COLORS.textDim, letterSpacing:"0.04em" }}>PROCUREMENT HUB · {APP_VERSION}</div>
          </div>
        </div>

        <div style={{ fontSize:15, fontWeight:600, color:COLORS.text, marginBottom:6 }}>Connexion</div>
        <div style={{ fontSize:12, color:COLORS.textDim, marginBottom:24 }}>Entrez vos identifiants pour accéder à l'application</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Nom d'utilisateur</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin ou entrepot"
              style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="#10B981"} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="#10B981"} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
          </div>

          {error && <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#EF4444", fontSize:12, fontWeight:500, marginBottom:16 }}>{error}</div>}

          <button type="submit" disabled={loading || !username || !password}
            style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background:`linear-gradient(135deg, #10B981, #059669)`, color:"white", fontSize:14, fontWeight:600, cursor:"pointer", opacity:(loading||!username||!password)?0.6:1, fontFamily:"inherit", letterSpacing:"0.01em" }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop:24, padding:16, background:COLORS.surface, borderRadius:10, border:`1px solid ${COLORS.border}` }}>
          <div style={{ fontSize:11, fontWeight:600, color:COLORS.textMuted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.04em" }}>Comptes démo</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:COLORS.textMuted }}>Admin complet</span>
              <span style={{ color:COLORS.accent, fontFamily:"monospace" }}>admin / admin123</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:COLORS.textMuted }}>Chef entrepôt</span>
              <span style={{ color:COLORS.accent, fontFamily:"monospace" }}>entrepot / entrepot123</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:COLORS.textMuted }}>Préposée entrepôt</span>
              <span style={{ color:COLORS.accent, fontFamily:"monospace" }}>sophie / sophie123</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #5C6682; }
      `}</style>
    </div>
  );
};

// ─── WAREHOUSE DASHBOARD ─────────────────────────────────────────────────────
const WarehouseDashboard = () => {
  const COLORS = useTheme();
  const { pos, counts, dailyTasks, setDailyTasks, activityLog, completeDailyTask } = useData();
  const auth = useAuth();

  const myTasks = dailyTasks.filter(t => t.assignee === auth.user.nom);
  const toggleTask = (id) => setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const myPOs = pos.filter(p => p.statut === "ENVOYE");
  const myCountsToday = counts.filter(c => c.compteur === auth.user.nom && c.date >= TODAY).length;
  const tasksCompleted = myTasks.filter(t => t.done).length;
  const priorityColors = { Haute: COLORS.danger, Moyenne: COLORS.warning, Basse: COLORS.info };
  const myActivity = activityLog.filter(a => a.user === auth.user.nom).slice(0, 8);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Welcome */}
      <div style={{ background:`linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.info}10)`, borderRadius:16, padding:"24px 28px", border:`1px solid ${COLORS.border}` }}>
        <div style={{ fontSize:22, fontWeight:700, color:COLORS.text, marginBottom:4 }}>Bonjour, {auth.user.nom.split(' ')[0]} 👋</div>
        <div style={{ fontSize:13, color:COLORS.textMuted }}>{auth.user.poste} — {TODAY_DISPLAY}</div>
        {tasksCompleted === myTasks.length && myTasks.length > 0 && (
          <div style={{ marginTop:8, padding:"4px 14px", borderRadius:20, fontSize:11, fontWeight:600, background:`${COLORS.accent}20`, color:COLORS.accent, display:"inline-block" }}>🎉 Toutes les tâches complétées !</div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
        <KpiCard label="Mes tâches du jour" value={`${tasksCompleted}/${myTasks.length}`} sub="Complétées" color={tasksCompleted===myTasks.length&&myTasks.length>0?COLORS.accent:COLORS.warning}/>
        <KpiCard label="Commandes à préparer" value={myPOs.length} sub="Statut ENVOYÉ" color={COLORS.info}/>
        <KpiCard label="Comptages effectués" value={myCountsToday} sub="Aujourd'hui" color={COLORS.accent}/>
        <KpiCard label="Progression" value={`${myTasks.length>0?Math.round(tasksCompleted/myTasks.length*100):0}%`} color={tasksCompleted===myTasks.length&&myTasks.length>0?COLORS.accent:COLORS.warning}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Daily tasks */}
        <Card title={`Mes tâches du jour (${tasksCompleted}/${myTasks.length})`}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {myTasks.length === 0 && <div style={{ padding:20, textAlign:"center", color:COLORS.textDim }}>Aucune tâche assignée</div>}
            {myTasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:10,
                  background: t.done ? `${COLORS.accent}08` : COLORS.surface,
                  border:`1px solid ${t.done ? COLORS.accentDim : COLORS.border}`,
                  cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${t.done?COLORS.accent:COLORS.textDim}`,
                  background:t.done?COLORS.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {t.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:t.done?COLORS.textDim:COLORS.text, textDecoration:t.done?"line-through":"none" }}>{t.task}</div>
                  {t.completed_at && <div style={{ fontSize:10, color:COLORS.accent, marginTop:2 }}>✓ Complétée automatiquement</div>}
                </div>
                <span style={{ padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:600,
                  background:`${priorityColors[t.priority]}15`, color:priorityColors[t.priority],
                  border:`1px solid ${priorityColors[t.priority]}30` }}>{t.priority}</span>
              </div>
            ))}
          </div>
          {myTasks.length > 0 && (
            <div style={{ marginTop:14, height:6, background:COLORS.bg, borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${myTasks.length>0?tasksCompleted/myTasks.length*100:0}%`, height:"100%", background:COLORS.accent, borderRadius:3, transition:"width 0.3s" }}/>
            </div>
          )}
        </Card>

        {/* Activity history */}
        <Card title="Mes dernières actions">
          {myActivity.length === 0 ? (
            <div style={{ padding:20, textAlign:"center", color:COLORS.textDim }}>Aucune action enregistrée aujourd'hui</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {myActivity.map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, background:COLORS.surface, border:`1px solid ${COLORS.border}` }}>
                  <div style={{ width:8, height:8, borderRadius:4, background:a.action==="Réception"?COLORS.accent:a.action==="Picking"?COLORS.info:a.action==="Rangement"?COLORS.warning:COLORS.purple, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:COLORS.text }}>{a.action}</div>
                    <div style={{ fontSize:11, color:COLORS.textDim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.details}</div>
                  </div>
                  <span style={{ fontSize:10, color:COLORS.textDim, flexShrink:0 }}>{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick access: orders to prepare */}
      <Card title={`Commandes à préparer (${myPOs.length})`}>
        {myPOs.length === 0 ? (
          <div style={{ padding:20, textAlign:"center", color:COLORS.textDim }}>Aucune commande en attente de préparation</div>
        ) : (
          <TableContainer>
            <thead><tr><Th>PO #</Th><Th>Article</Th><Th>Qty</Th><Th>Fournisseur</Th><Th>Créé le</Th></tr></thead>
            <tbody>
              {myPOs.slice(0,5).map(po => (
                <tr key={po.po_id} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:700, color:COLORS.accent }}>{po.po_number}</Td>
                  <Td style={{ fontWeight:500 }}>{po.article}</Td>
                  <Td style={{ fontWeight:600 }}>{po.qty}</Td>
                  <Td style={{ color:COLORS.textMuted }}>{SUPPLIER_MAP[po.supplier_id]?.split(' ')[0]}</Td>
                  <Td style={{ color:COLORS.textDim, fontSize:12 }}>{po.date_creation}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        )}
      </Card>
    </div>
  );
};

// ─── WAREHOUSE ORDERS PAGE ───────────────────────────────────────────────────
const WarehouseOrdersPage = () => {
  const COLORS = useTheme();
  const { pos, addEvent, showToast, setPos, setTasks, tasks, completeDailyTask, addNotification, addActivity, setSlideOver } = useData();
  const auth = useAuth();
  const [filter, setFilter] = useState("ENVOYE");
  const [search, setSearch] = useState("");
  const [receptionModal, setReceptionModal] = useState(null);
  const [receptionForm, setReceptionForm] = useState({ qtyRecue:"", probleme:null, note:"" });
  const [pickingModal, setPickingModal] = useState(null);
  const [pickingLines, setPickingLines] = useState([]);
  const [rangementModal, setRangementModal] = useState(null);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("po_number","asc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;

  const WAREHOUSE_WORKERS = USERS.filter(u => u.role === "entrepot").map(u => u.nom);
  const assignRandom = () => WAREHOUSE_WORKERS[Math.floor(Math.random() * WAREHOUSE_WORKERS.length)];

  const PROBLEMES = ["Aucun — conforme","Colis endommagé","Quantité manquante","Mauvais article reçu","Article défectueux","Documentation manquante"];

  const warehousePOs = useMemo(() => {
    let filtered = pos.filter(p => {
      if (filter === "all") return ["ENVOYE","RECU","CLOS"].includes(p.statut);
      return p.statut === filter;
    });
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.po_number.toLowerCase().includes(s) || p.article.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    return sortData(filtered);
  }, [pos, filter, search, sortCol, sortDir]);

  // Calculate days since sent for urgency
  const daysSinceSent = (po) => {
    if (!po.date_envoi) return 0;
    const sent = new Date(po.date_envoi);
    const now = new Date(TODAY);
    return Math.floor((now - sent) / (1000*60*60*24));
  };

  const todayActions = pos.filter(p => p.received_by === auth.user.nom && p.date_reception === TODAY).length;

  // ─── RÉCEPTION ─────────────────────────────────
  const handleOpenReception = (po) => {
    setReceptionForm({ qtyRecue: String(po.qty), probleme: null, note: "" });
    setReceptionModal(po);
  };

  const handleConfirmReception = () => {
    const po = receptionModal;
    if (!po) return;
    const qtyRecue = parseInt(receptionForm.qtyRecue) || 0;
    const ecart = qtyRecue - po.qty;
    const ecartPct = po.qty > 0 ? Math.abs(ecart / po.qty * 100) : 0;
    const hasProbleme = receptionForm.probleme && receptionForm.probleme !== "Aucun — conforme";

    // Update PO: ENVOYE → RECU
    setPos(prev => prev.map(p => p.po_id === po.po_id ? {
      ...p, statut: "RECU", date_reception: TODAY,
      qty_recue: qtyRecue,
      prix_paye: +(p.prix_negocie * (0.97 + Math.random() * 0.06)).toFixed(2),
      received_by: auth.user.nom,
      reception_note: receptionForm.note,
      reception_probleme: receptionForm.probleme,
    } : p));

    // Audit event
    const level = hasProbleme || ecartPct > 5 ? "WARNING" : "INFO";
    addEvent("PO_RECEIVED", "PurchaseOrder", po.po_id,
      `${po.po_number} réceptionné par ${auth.user.nom} — Qty: ${qtyRecue}/${po.qty}${hasProbleme ? ` — Problème: ${receptionForm.probleme}` : ""}${receptionForm.note ? ` — Note: ${receptionForm.note}` : ""}`,
      level);

    // Investigation task if qty ecart > 5%
    if (ecartPct > 5) {
      setTasks(prev => [{
        task_id: prev.length + 200, type: "Investigation écart réception",
        related_po_id: po.po_id, assigned_to: "Jean Dupont", status: "Ouverte",
        due_at: "2026-03-25", comment: `${po.po_number} — Écart réception: ${ecart} unités (${ecartPct.toFixed(1)}%) reçu par ${auth.user.nom}`,
      }, ...prev]);
    }

    // Investigation task if problem reported
    if (hasProbleme) {
      setTasks(prev => [{
        task_id: prev.length + 201, type: "Problème réception fournisseur",
        related_po_id: po.po_id, assigned_to: "Marie Lavoie", status: "Ouverte",
        due_at: "2026-03-22", comment: `${po.po_number} — ${receptionForm.probleme}${receptionForm.note ? `: ${receptionForm.note}` : ""}`,
      }, ...prev]);
    }

    showToast(`${po.po_number} réceptionné — ${qtyRecue} unités${hasProbleme ? " (problème signalé)" : ""}`);
    completeDailyTask(po.po_number, "reception");
    addNotification(`${auth.user.nom} a réceptionné ${po.po_number} (${qtyRecue}/${po.qty} unités)${hasProbleme ? " ⚠ problème signalé" : ""}`, "admin", hasProbleme ? "warning" : "success");
    addActivity("Réception", `${po.po_number} — ${qtyRecue} unités${hasProbleme ? ` — ${receptionForm.probleme}` : ""}`);
    setReceptionModal(null);
  };

  // ─── PICKING / PRÉPARATION ─────────────────────
  const handleOpenPicking = (po) => {
    // Generate picking lines from PO
    const item = ITEMS.find(i => i.sku === po.sku);
    const lines = [
      { id: 1, sku: po.sku, article: po.article, qty: po.qty, emplacement: item ? `Allée ${item.famille.charAt(0)}-${String(item.id % 20 + 1).padStart(2, '0')}` : "A-01", picked: false, qtyPicked: po.qty, rupture: false },
    ];
    setPickingLines(lines);
    setPickingModal(po);
  };

  const togglePickLine = (lineId) => {
    setPickingLines(prev => prev.map(l => l.id === lineId ? { ...l, picked: !l.picked } : l));
  };

  const handleConfirmPicking = () => {
    const po = pickingModal;
    if (!po) return;
    const allPicked = pickingLines.every(l => l.picked);
    const hasRupture = pickingLines.some(l => l.rupture);

    // Update PO with picking info
    setPos(prev => prev.map(p => p.po_id === po.po_id ? {
      ...p, picking_done: true, picking_by: auth.user.nom, picking_date: TODAY,
    } : p));

    addEvent("WAREHOUSE_PICKING", "PurchaseOrder", po.po_id,
      `${po.po_number} préparé par ${auth.user.nom} — ${pickingLines.filter(l => l.picked).length}/${pickingLines.length} lignes${hasRupture ? " (rupture partielle)" : ""}`,
      hasRupture ? "WARNING" : "INFO");

    if (hasRupture) {
      setTasks(prev => [{
        task_id: prev.length + 300, type: "Rupture partielle picking",
        related_po_id: po.po_id, assigned_to: "Jean Dupont", status: "Ouverte",
        due_at: "2026-03-20", comment: `${po.po_number} — rupture signalée par ${auth.user.nom}`,
      }, ...prev]);
    }

    showToast(`${po.po_number} — picking ${allPicked ? "complet" : "partiel"}`);
    completeDailyTask(po.po_number, "picking");
    addNotification(`${auth.user.nom} a préparé ${po.po_number}${hasRupture ? " ⚠ rupture partielle" : ""}`, "admin", hasRupture ? "warning" : "info");
    addActivity("Picking", `${po.po_number} — ${pickingLines.filter(l=>l.picked).length}/${pickingLines.length} lignes${hasRupture ? " (rupture)" : ""}`);
    setPickingModal(null);
  };

  // ─── RANGEMENT ─────────────────────────────────
  const handleRangement = (po) => {
    setRangementModal(po);
  };

  const handleConfirmRangement = () => {
    const po = rangementModal;
    if (!po) return;
    const item = ITEMS.find(i => i.sku === po.sku);
    const qtyToAdd = po.qty_recue || po.qty;

    // Update stock_net on the item
    if (item) {
      item.stock_net += qtyToAdd;
    }

    // Mark PO as ranged
    setPos(prev => prev.map(p => p.po_id === po.po_id ? {
      ...p, rangement_done: true, rangement_by: auth.user.nom, rangement_date: TODAY,
    } : p));

    addEvent("WAREHOUSE_RANGEMENT", "PurchaseOrder", po.po_id,
      `${po.po_number} rangé par ${auth.user.nom} — ${qtyToAdd} unités ajoutées au stock de ${po.sku}`,
      "INFO");

    showToast(`${po.po_number} rangé — +${qtyToAdd} unités dans ${po.sku}`);
    completeDailyTask(po.po_number, "rangement");
    addNotification(`${auth.user.nom} a rangé ${po.po_number} — +${qtyToAdd} unités ${po.sku}`, "admin", "success");
    addActivity("Rangement", `${po.po_number} — +${qtyToAdd} unités dans ${po.sku}`);
    setRangementModal(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12 }}>
        <KpiCard label="À réceptionner" value={pos.filter(p=>p.statut==="ENVOYE").length} color={COLORS.info}/>
        <KpiCard label="À ranger" value={pos.filter(p=>p.statut==="RECU" && !p.rangement_done).length} color={COLORS.warning}/>
        <KpiCard label="Picking à faire" value={pos.filter(p=>p.statut==="ENVOYE" && !p.picking_done).length} color={COLORS.purple}/>
        <KpiCard label="Traités aujourd'hui" value={todayActions} sub={TODAY_DISPLAY} color={COLORS.accent}/>
        <KpiCard label="En retard (>7j)" value={pos.filter(p=>p.statut==="ENVOYE"&&daysSinceSent(p)>7).length} color={pos.filter(p=>p.statut==="ENVOYE"&&daysSinceSent(p)>7).length>0?COLORS.danger:COLORS.textDim}/>
      </div>

      {/* Filters + Search */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {[{id:"ENVOYE",label:"À traiter"},{id:"RECU",label:"Reçus"},{id:"all",label:"Tous"}].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)}
            style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${filter===f.id?COLORS.accent:COLORS.border}`,
              background:filter===f.id?COLORS.accentGlow:"transparent", color:filter===f.id?COLORS.accent:COLORS.textMuted,
              fontSize:12, fontWeight:filter===f.id?600:400, cursor:"pointer", transition:"all 0.15s" }}>
            {f.label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ position:"relative" }}>
          <Icon name="search" size={14} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher PO, article, SKU..."
            style={{ padding:"7px 12px 7px 32px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:12, outline:"none", width:220, fontFamily:"inherit" }}/>
        </div>
      </div>

      {/* Table */}
      <Card title={`Commandes internes — ${warehousePOs.length}`}>
        <TableContainer>
          <thead><tr><S col="po_number">PO #</S><S col="article">Article</S><S col="sku">SKU</S><S col="qty">Qty</S><S col="supplier_id">Fournisseur</S><S col="statut">Statut</S><Th>Assigné</Th><S col="date_envoi">Envoyé</S><Th>Urgence</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {warehousePOs.map(po => {
              const days = daysSinceSent(po);
              const urgent = po.statut === "ENVOYE" && days > 7;
              if (!po.assigned_worker && po.statut === "ENVOYE") { po.assigned_worker = assignRandom(); }
              return (
                <tr key={po.po_id} style={{ background: urgent ? `${COLORS.danger}08` : "transparent", cursor:"pointer" }}
                  onClick={()=>setSlideOver({data:po,type:"po"})}
                  onMouseEnter={e=>e.currentTarget.style.background=urgent?`${COLORS.danger}12`:COLORS.cardHover}
                  onMouseLeave={e=>e.currentTarget.style.background=urgent?`${COLORS.danger}08`:"transparent"}>
                  <Td style={{ fontWeight:700, color:COLORS.accent }}>{po.po_number}</Td>
                  <Td style={{ fontWeight:500 }}>{po.article}</Td>
                  <Td style={{ color:COLORS.textDim, fontSize:12 }}>{po.sku}</Td>
                  <Td style={{ fontWeight:600 }}>{po.qty_recue ? `${po.qty_recue}/${po.qty}` : po.qty}</Td>
                  <Td style={{ color:COLORS.textMuted, fontSize:12 }}>{SUPPLIER_MAP[po.supplier_id]?.split(' ')[0]}</Td>
                  <Td><Badge>{po.statut}</Badge></Td>
                  <Td style={{ fontSize:11, color:COLORS.info }}>{po.assigned_worker || "—"}</Td>
                  <Td style={{ color:COLORS.textDim, fontSize:12 }}>{po.date_envoi || "—"}</Td>
                  <Td>
                    {urgent && <span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, background:`${COLORS.danger}20`, color:COLORS.danger, animation:"pulse 1.5s infinite" }}>⚠ {days}j</span>}
                    {!urgent && po.statut === "ENVOYE" && days > 0 && <span style={{ fontSize:11, color:COLORS.textDim }}>{days}j</span>}
                  </Td>
                  <Td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {po.statut === "ENVOYE" && <>
                        <button onClick={()=>handleOpenReception(po)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:10, fontWeight:600, cursor:"pointer" }}>📦 Réceptionner</button>
                        {!po.picking_done && <button onClick={()=>handleOpenPicking(po)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${COLORS.info}`, background:`${COLORS.info}15`, color:COLORS.info, fontSize:10, fontWeight:600, cursor:"pointer" }}>📋 Picking</button>}
                        {po.picking_done && <span style={{ fontSize:10, color:COLORS.accent, padding:"4px 8px" }}>✓ Préparé</span>}
                      </>}
                      {po.statut === "RECU" && !po.rangement_done && (
                        <button onClick={()=>handleRangement(po)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${COLORS.warning}`, background:`${COLORS.warning}15`, color:COLORS.warning, fontSize:10, fontWeight:600, cursor:"pointer" }}>🏷️ Ranger</button>
                      )}
                      {po.statut === "RECU" && po.rangement_done && <span style={{ fontSize:10, color:COLORS.accent }}>✓ Rangé</span>}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
        {warehousePOs.length === 0 && <div style={{ padding:30, textAlign:"center", color:COLORS.textDim }}>Aucune commande dans ce filtre</div>}
      </Card>

      {/* ─── MODAL: RÉCEPTION ─── */}
      {receptionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
          <div style={{ width:500, maxHeight:"85vh", overflowY:"auto", background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>📦 Réception marchandise</div>
            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:20 }}>
              <strong style={{ color:COLORS.accent }}>{receptionModal.po_number}</strong> — {receptionModal.article} ({receptionModal.sku})
            </div>

            <div style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}`, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:COLORS.textMuted }}>Quantité commandée</span>
                <strong style={{ color:COLORS.text }}>{receptionModal.qty} unités</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginTop:6 }}>
                <span style={{ color:COLORS.textMuted }}>Fournisseur</span>
                <span style={{ color:COLORS.text }}>{SUPPLIER_MAP[receptionModal.supplier_id]}</span>
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:COLORS.text, display:"block", marginBottom:6 }}>Quantité reçue *</label>
              <input type="number" value={receptionForm.qtyRecue} onChange={e=>setReceptionForm(f=>({...f, qtyRecue:e.target.value}))}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.accent, fontSize:18, fontWeight:700, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
              {receptionForm.qtyRecue && parseInt(receptionForm.qtyRecue) !== receptionModal.qty && (
                <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, background:`${Math.abs(parseInt(receptionForm.qtyRecue)-receptionModal.qty)/receptionModal.qty > 0.05 ? COLORS.danger : COLORS.warning}15`, border:`1px solid ${Math.abs(parseInt(receptionForm.qtyRecue)-receptionModal.qty)/receptionModal.qty > 0.05 ? COLORS.danger : COLORS.warning}30`, fontSize:12 }}>
                  <strong style={{ color: Math.abs(parseInt(receptionForm.qtyRecue)-receptionModal.qty)/receptionModal.qty > 0.05 ? COLORS.danger : COLORS.warning }}>
                    Écart: {parseInt(receptionForm.qtyRecue) - receptionModal.qty} unités ({((parseInt(receptionForm.qtyRecue) - receptionModal.qty) / receptionModal.qty * 100).toFixed(1)}%)
                  </strong>
                  {Math.abs(parseInt(receptionForm.qtyRecue)-receptionModal.qty)/receptionModal.qty > 0.05 && <span style={{ display:"block", marginTop:4, color:COLORS.danger }}>⚠ Écart &gt;5% — une tâche d'investigation sera créée</span>}
                </div>
              )}
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:600, color:COLORS.text, display:"block", marginBottom:8 }}>Signaler un problème</label>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {PROBLEMES.map(p => (
                  <div key={p} onClick={()=>setReceptionForm(f=>({...f, probleme:p}))}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8,
                      background:receptionForm.probleme===p?COLORS.accentGlow:"transparent", border:`1px solid ${receptionForm.probleme===p?COLORS.accent:COLORS.border}`,
                      cursor:"pointer", fontSize:12, color:receptionForm.probleme===p?COLORS.accent:COLORS.textMuted, transition:"all 0.15s" }}>
                    <span style={{ width:14, height:14, borderRadius:7, border:`2px solid ${receptionForm.probleme===p?COLORS.accent:COLORS.textDim}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {receptionForm.probleme===p && <span style={{ width:6, height:6, borderRadius:3, background:COLORS.accent }}/>}
                    </span>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:COLORS.text, display:"block", marginBottom:6 }}>Note de réception (optionnel)</label>
              <textarea value={receptionForm.note} onChange={e=>setReceptionForm(f=>({...f, note:e.target.value}))} rows={2}
                placeholder="Détails sur l'état de la livraison..."
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:12, outline:"none", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }}/>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setReceptionModal(null)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
              <button onClick={handleConfirmReception} disabled={!receptionForm.qtyRecue}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:receptionForm.qtyRecue?1:0.5 }}>
                Confirmer la réception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PICKING ─── */}
      {pickingModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
          <div style={{ width:520, maxHeight:"85vh", overflowY:"auto", background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>📋 Préparation commande</div>
            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:20 }}>
              <strong style={{ color:COLORS.info }}>{pickingModal.po_number}</strong> — Cochez chaque ligne au fur et à mesure du picking
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
              {pickingLines.map(line => (
                <div key={line.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:10,
                  background:line.picked?`${COLORS.accent}08`:COLORS.surface, border:`1px solid ${line.picked?COLORS.accentDim:COLORS.border}`, transition:"all 0.15s" }}>
                  <div onClick={()=>togglePickLine(line.id)} style={{ width:24, height:24, borderRadius:6, border:`2px solid ${line.picked?COLORS.accent:COLORS.textDim}`,
                    background:line.picked?COLORS.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    {line.picked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:line.picked?COLORS.textDim:COLORS.text, textDecoration:line.picked?"line-through":"none" }}>{line.article}</div>
                    <div style={{ fontSize:11, color:COLORS.textDim }}>{line.sku} · {line.emplacement}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:line.picked?COLORS.accent:COLORS.text }}>{line.qty}</div>
                    <div style={{ fontSize:10, color:COLORS.textDim }}>unités</div>
                  </div>
                  <button onClick={()=>setPickingLines(prev=>prev.map(l=>l.id===line.id?{...l,rupture:!l.rupture}:l))}
                    style={{ padding:"3px 8px", borderRadius:5, border:`1px solid ${line.rupture?COLORS.danger:COLORS.border}`,
                      background:line.rupture?`${COLORS.danger}15`:"transparent", color:line.rupture?COLORS.danger:COLORS.textDim,
                      fontSize:9, cursor:"pointer", fontWeight:line.rupture?700:400 }}>
                    {line.rupture ? "⚠ Rupture" : "Rupture?"}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background:COLORS.surface, borderRadius:8, padding:12, marginBottom:20, display:"flex", justifyContent:"space-between", fontSize:12 }}>
              <span style={{ color:COLORS.textMuted }}>Progression</span>
              <strong style={{ color:pickingLines.every(l=>l.picked)?COLORS.accent:COLORS.warning }}>{pickingLines.filter(l=>l.picked).length}/{pickingLines.length} lignes</strong>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setPickingModal(null)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
              <button onClick={handleConfirmPicking}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.info}, #2563EB)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Confirmer le picking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RANGEMENT ─── */}
      {rangementModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
          <div style={{ width:440, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:4 }}>🏷️ Confirmation de rangement</div>
            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:20 }}>
              <strong style={{ color:COLORS.warning }}>{rangementModal.po_number}</strong> — {rangementModal.article}
            </div>

            <div style={{ background:COLORS.surface, borderRadius:10, padding:16, border:`1px solid ${COLORS.border}`, marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:COLORS.textMuted }}>Quantité à ranger</span>
                <strong style={{ color:COLORS.accent }}>{rangementModal.qty_recue || rangementModal.qty} unités</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:COLORS.textMuted }}>SKU</span>
                <span style={{ color:COLORS.text }}>{rangementModal.sku}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:COLORS.textMuted }}>Stock actuel</span>
                <span style={{ color:COLORS.text }}>{ITEMS.find(i=>i.sku===rangementModal.sku)?.stock_net || 0} unités</span>
              </div>
              <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, background:COLORS.accentGlow, border:`1px solid ${COLORS.accentDim}` }}>
                <div style={{ fontSize:12, color:COLORS.accent, fontWeight:600 }}>
                  → Nouveau stock après rangement : {(ITEMS.find(i=>i.sku===rangementModal.sku)?.stock_net || 0) + (rangementModal.qty_recue || rangementModal.qty)} unités
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setRangementModal(null)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
              <button onClick={handleConfirmRangement}
                style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.warning}, #D97706)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Confirmer le rangement
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
    </div>
  );
};

// ─── WAREHOUSE STATS PAGE ────────────────────────────────────────────────────
const WarehouseStatsPage = () => {
  const COLORS = useTheme();
  const { pos, counts, activityLog, dailyTasks } = useData();
  const auth = useAuth();
  const nom = auth.user.nom;

  // Réceptions traitées
  const myReceptions = pos.filter(p => p.received_by === nom);
  const receptionCount = myReceptions.length;
  const totalQtyReceived = myReceptions.reduce((s, p) => s + (p.qty_recue || p.qty), 0);
  const problemCount = myReceptions.filter(p => p.reception_probleme && p.reception_probleme !== "Aucun — conforme").length;

  // Pickings effectués
  const myPickings = pos.filter(p => p.picking_by === nom);
  const pickingCount = myPickings.length;

  // Rangements effectués
  const myRangements = pos.filter(p => p.rangement_by === nom);
  const rangementCount = myRangements.length;
  const totalQtyRanged = myRangements.reduce((s, p) => s + (p.qty_recue || p.qty), 0);

  // Comptages inventaire
  const myComptages = counts.filter(c => c.compteur === nom);
  const comptageCount = myComptages.length;
  const comptagesConformes = myComptages.filter(c => Math.abs(c.ecart_pct) <= (ECART_SEUILS[ITEMS.find(i => i.sku === c.sku)?.abc || "C"])).length;
  const precisionPct = comptageCount > 0 ? (comptagesConformes / comptageCount * 100) : 100;

  // Tâches du jour
  const myDailyTasks = dailyTasks.filter(t => t.assignee === nom);
  const completedToday = myDailyTasks.filter(t => t.done).length;

  // Activity timeline
  const myActivity = activityLog.filter(a => a.user === nom);
  const activityByType = {};
  myActivity.forEach(a => { activityByType[a.action] = (activityByType[a.action] || 0) + 1; });
  const activityChartData = Object.entries(activityByType).map(([action, count]) => ({
    name: action, value: count,
    color: action === "Réception" ? "#10b981" : action === "Picking" ? "#3b82f6" : action === "Rangement" ? "#f59e0b" : "#8b5cf6",
  }));

  // Score global
  const totalActions = receptionCount + pickingCount + rangementCount + comptageCount;
  const score = Math.min(100, Math.round(
    (receptionCount * 10 + pickingCount * 8 + rangementCount * 6 + comptageCount * 5 + completedToday * 3) / Math.max(1, totalActions) * 10
  ));
  const scoreColor = score >= 80 ? COLORS.accent : score >= 60 ? COLORS.warning : COLORS.danger;
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Bon" : "À améliorer";

  const StatBlock = ({ label, value, sub, color, icon }) => (
    <div style={{ background: COLORS.card, borderRadius: 14, padding: "20px 22px", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: color || COLORS.text, letterSpacing: "-0.02em" }}>{value}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, background: COLORS.card, borderRadius: 16, padding: "24px 28px", border: `1px solid ${COLORS.border}` }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${auth.user.color}, ${auth.user.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 20 }}>{auth.user.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{nom}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{auth.user.poste}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor, letterSpacing: "-0.03em" }}>{score}</div>
          <div style={{ fontSize: 11, color: scoreColor, fontWeight: 600 }}>{scoreLabel}</div>
          <div style={{ fontSize: 10, color: COLORS.textDim }}>Score performance</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatBlock icon="📦" label="Réceptions traitées" value={receptionCount} sub={`${totalQtyReceived} unités reçues`} color="#10b981"/>
        <StatBlock icon="📋" label="Pickings effectués" value={pickingCount} sub={`commandes préparées`} color="#3b82f6"/>
        <StatBlock icon="🏷️" label="Rangements confirmés" value={rangementCount} sub={`${totalQtyRanged} unités rangées`} color="#f59e0b"/>
        <StatBlock icon="🔄" label="Comptages inventaire" value={comptageCount} sub={`${comptagesConformes} conformes`} color="#8b5cf6"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Précision & KPIs */}
        <Card title="Indicateurs de performance">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>Précision comptages</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 80, height: 6, background: COLORS.bg, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${precisionPct}%`, height: "100%", background: precisionPct >= 95 ? COLORS.accent : precisionPct >= 85 ? COLORS.warning : COLORS.danger, borderRadius: 3 }}/>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: precisionPct >= 95 ? COLORS.accent : precisionPct >= 85 ? COLORS.warning : COLORS.danger }}>{precisionPct.toFixed(1)}%</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>Problèmes signalés</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: problemCount > 0 ? COLORS.warning : COLORS.accent }}>{problemCount} <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textDim }}>/ {receptionCount} réceptions</span></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>Tâches complétées aujourd'hui</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: completedToday === myDailyTasks.length && myDailyTasks.length > 0 ? COLORS.accent : COLORS.text }}>{completedToday}/{myDailyTasks.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>Total actions ce mois</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{totalActions}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>Score global</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{score}/100 — {scoreLabel}</span>
            </div>
          </div>
        </Card>

        {/* Activity breakdown */}
        <Card title="Répartition des actions">
          {activityChartData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={activityChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {activityChartData.map((d, i) => <Cell key={i} fill={d.color} stroke="none"/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
                {activityChartData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.textMuted }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: d.color }}/>
                    {d.name}: <strong style={{ color: COLORS.text }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.textDim }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 13 }}>Effectue des actions pour voir tes statistiques</div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card title={`Historique complet — ${myActivity.length} actions`}>
        {myActivity.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: COLORS.textDim }}>Aucune action enregistrée</div>
        ) : (
          <TableContainer>
            <thead><tr><Th>Heure</Th><Th>Action</Th><Th>Détails</Th></tr></thead>
            <tbody>
              {myActivity.slice(0, 20).map(a => (
                <tr key={a.id} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Td style={{ fontSize: 12, color: COLORS.textDim, whiteSpace: "nowrap" }}>{a.time}</Td>
                  <Td>
                    <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                      background: `${a.action === "Réception" ? "#10b981" : a.action === "Picking" ? "#3b82f6" : a.action === "Rangement" ? "#f59e0b" : "#8b5cf6"}15`,
                      color: a.action === "Réception" ? "#10b981" : a.action === "Picking" ? "#3b82f6" : a.action === "Rangement" ? "#f59e0b" : "#8b5cf6",
                      border: `1px solid ${a.action === "Réception" ? "#10b981" : a.action === "Picking" ? "#3b82f6" : a.action === "Rangement" ? "#f59e0b" : "#8b5cf6"}30`,
                    }}>{a.action}</span>
                  </Td>
                  <Td style={{ fontSize: 12, color: COLORS.textMuted }}>{a.details}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        )}
      </Card>
    </div>
  );
};

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  // Admin pages
  { id:"dashboard", label:"Dashboard", icon:"dashboard", roles:["admin"] },
  { id:"inventory", label:"Inventaire", icon:"inventory", roles:["admin"] },
  { id:"critical", label:"Articles critiques", icon:"critical", roles:["admin"] },
  { id:"suppliers", label:"Fournisseurs", icon:"suppliers", roles:["admin"] },
  { id:"orders", label:"Purchase Orders", icon:"orders", roles:["admin"] },
  { id:"tasks", label:"Tâches", icon:"tasks", roles:["admin"] },
  { id:"audit", label:"Journal d'audit", icon:"audit", roles:["admin"] },
  { id:"trs", label:"Performance TRS", icon:"trs", roles:["admin"] },
  // Shared pages
  { id:"warehouse_orders", label:"Commandes internes", icon:"orders", roles:["admin","entrepot"] },
  { id:"cyclecount", label:"Inventaire tournant", icon:"cyclecount", roles:["admin","entrepot"] },
  // Entrepôt pages
  { id:"warehouse_home", label:"Mon tableau de bord", icon:"dashboard", roles:["entrepot"] },
  { id:"inventory_readonly", label:"Consulter inventaire", icon:"inventory", roles:["entrepot"] },
  { id:"warehouse_stats", label:"Mes statistiques", icon:"trs", roles:["entrepot"] },
  // Admin only
  { id:"settings", label:"Règles / Config", icon:"settings", roles:["admin"] },
];

const PAGES = {
  dashboard: DashboardPage,
  inventory: InventoryPage,
  critical: CriticalPage,
  suppliers: SuppliersPage,
  orders: PurchaseOrdersPage,
  tasks: TasksPage,
  audit: AuditPage,
  trs: TRSPage,
  cyclecount: CycleCountPage,
  warehouse_orders: WarehouseOrdersPage,
  warehouse_home: WarehouseDashboard,
  warehouse_stats: WarehouseStatsPage,
  inventory_readonly: InventoryPage,
  settings: SettingsPage,
};

const PAGE_TITLES = {
  dashboard: "Tableau de bord",
  inventory: "Gestion d'inventaire",
  critical: "Articles critiques",
  suppliers: "Fournisseurs",
  orders: "Purchase Orders",
  tasks: "Tâches de validation",
  audit: "Journal d'audit",
  trs: "Performance TRS",
  cyclecount: "Inventaire tournant",
  warehouse_orders: "Commandes internes",
  warehouse_home: "Mon tableau de bord",
  warehouse_stats: "Mes statistiques",
  inventory_readonly: "Inventaire (consultation)",
  settings: "Règles et configuration",
};

// ─── THEME TOGGLE ────────────────────────────────────────────────────────────
const ThemeToggle = ({ isDark, onToggle }) => (
  <button onClick={onToggle} aria-label="Toggle theme"
    style={{
      position:"relative", width:52, height:28, borderRadius:14, border:"none", cursor:"pointer",
      background: isDark ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.15)",
      transition:"background 0.3s ease",
      display:"flex", alignItems:"center", padding:3,
    }}>
    <div style={{
      width:22, height:22, borderRadius:11,
      background: isDark ? "#10B981" : "#2563EB",
      transform: isDark ? "translateX(24px)" : "translateX(0px)",
      transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow: isDark ? "0 0 8px rgba(16,185,129,0.4)" : "0 0 8px rgba(37,99,235,0.3)",
    }}>
      {isDark ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      )}
    </div>
  </button>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const COLORS = isDark ? THEMES.dark : THEMES.light;

  // Mutable state
  const [pos, setPos] = useState(INITIAL_POS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [nextPoId, setNextPoId] = useState(21);
  const [toast, setToast] = useState(null);
  const [globalSearch, setGlobalSearch] = useState(false);
  const [slideOver, setSlideOver] = useState(null);
  const [expandedKPI, setExpandedKPI] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dailyTasks, setDailyTasks] = useState(WAREHOUSE_DAILY_TASKS);
  const [notifications, setNotifications] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setGlobalSearch(true); }
      if (e.key === "Escape") { setGlobalSearch(false); setSlideOver(null); setExpandedKPI(null); setShowNotifs(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auth handlers
  const handleLogin = (user) => {
    setCurrentUser(user);
    setActivePage(user.role === "admin" ? "dashboard" : "warehouse_home");
  };
  const handleLogout = () => { setCurrentUser(null); setActivePage(null); };

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addEvent = useCallback((type_event, entite, entite_id, details, level="INFO") => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setEvents(prev => [{ event_id: prev.length+1, date, type_event, utilisateur: currentUser?.nom || "Système", entite, entite_id, details, level }, ...prev]);
  }, [currentUser]);

  // Auto-sync daily tasks when warehouse actions complete
  const completeDailyTask = useCallback((poNumber, actionType) => {
    setDailyTasks(prev => prev.map(t => {
      if (t.done) return t;
      // Match by PO reference AND action type
      if (t.po_ref === poNumber && t.action_type === actionType) return { ...t, done: true, completed_at: TODAY };
      // Match by action type alone for non-PO tasks (rangement generic, etc.)
      if (!t.po_ref && t.action_type === actionType && t.assignee === currentUser?.nom) return { ...t, done: true, completed_at: TODAY };
      return t;
    }));
  }, [currentUser]);

  // Notifications between roles
  const addNotification = useCallback((message, forRole, type="info") => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setNotifications(prev => [{
      id: prev.length + 1, message, forRole, type, time, read: false, by: currentUser?.nom || "Système",
    }, ...prev].slice(0, 50)); // Keep max 50
  }, [currentUser]);

  // Activity log per user
  const addActivity = useCallback((action, details) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setActivityLog(prev => [{
      id: prev.length + 1, user: currentUser?.nom, role: currentUser?.role, action, details, time, date: TODAY,
    }, ...prev].slice(0, 100)); // Keep max 100
  }, [currentUser]);

  const doTransitionPO = useCallback((poId) => {
    setPos(prev => prev.map(po => {
      if (po.po_id !== poId) return po;
      const transition = PO_TRANSITIONS[po.statut];
      if (!transition) return po;
      const oldStatut = po.statut;
      const newStatut = transition.next;
      const now = TODAY;
      const updated = { ...po, statut: newStatut };
      // Track dates per transition step
      if (newStatut === "A_VALIDER") updated.date_validation = now;
      if (newStatut === "ENVOYE") updated.date_envoi = now;
      if (newStatut === "RECU") {
        updated.date_reception = now;
        updated.prix_paye = +(po.prix_negocie * (0.97 + Math.random()*0.06)).toFixed(2);
      }
      // Status history
      setStatusHistory(prev => [...prev, {
        id: prev.length+1, po_id: poId, old_status: oldStatut, new_status: newStatut,
        changed_by: "Jean Dupont", changed_at: now, comment: `Transition ${oldStatut} → ${newStatut}`,
      }]);
      addEvent("PO_TRANSITION", "PurchaseOrder", poId,
        `${po.po_number} : ${oldStatut} → ${newStatut}`, "INFO");
      showToast(`${po.po_number} → ${newStatut}`);
      // Notify warehouse when PO is sent
      if (newStatut === "ENVOYE") {
        addNotification(`Nouveau PO à traiter : ${po.po_number} — ${po.article} (${po.qty} unités)`, "entrepot", "info");
      }
      addActivity("Transition PO", `${po.po_number} : ${oldStatut} → ${newStatut}`);
      // Mark related tasks as done
      if (newStatut === "ENVOYE" || newStatut === "CLOS") {
        setTasks(prev => prev.map(t =>
          t.related_po_id === poId && t.status !== "Terminée"
            ? { ...t, status: "Terminée" } : t
        ));
      }
      return updated;
    }));
    setConfirmAction(null);
  }, [addEvent, showToast]);

  // Wrapper: require confirmation for ENVOYE→RECU and RECU→CLOS
  const transitionPO = useCallback((poId) => {
    const po = pos.find(p => p.po_id === poId);
    if (!po) return;
    // Guard: EOQ ×2 on validation step
    if (po.statut === "BROUILLON") {
      const item = ITEMS.find(i => i.sku === po.sku);
      if (item && po.qty > item.eoq * 2) {
        addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", poId,
          `${po.po_number} — Qty ${po.qty} > EOQ×2 (${item.eoq*2}) — validation managériale requise`, "WARNING");
        // Create managerial approval task
        setTasks(prev => [{ task_id: prev.length+1, type:"Approbation managériale",
          related_po_id: poId, assigned_to:"Jean Dupont", status:"Ouverte",
          due_at:daysFromNow(3), comment:`Qty ${po.qty} > EOQ×2 pour ${po.po_number}` }, ...prev]);
        showToast(`Qty > EOQ×2 — approbation managériale créée`, "error");
        // Still allow transition but with audit trail
      }
    }
    // Confirmation required for reception and closure
    if (po.statut === "ENVOYE" || po.statut === "RECU") {
      setConfirmAction({ poId, po, action: PO_TRANSITIONS[po.statut].label, nextStatut: PO_TRANSITIONS[po.statut].next });
      return;
    }
    doTransitionPO(poId);
  }, [pos, doTransitionPO, addEvent, showToast]);

  const createPO = useCallback((item) => {
    // Guard #4: qty <= 0
    if (!item.eoq || item.eoq <= 0) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `Quantité EOQ invalide (${item.eoq}) pour ${item.sku} — création refusée`, "ERROR");
      showToast(`Quantité invalide — PO refusé`, "error");
      return;
    }
    // Guard #1: check no existing open PO for this SKU
    const existing = pos.find(p => p.sku === item.sku && (p.statut === "BROUILLON" || p.statut === "A_VALIDER"));
    if (existing) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `PO déjà existant (${existing.po_number}) pour ${item.sku} — création bloquée`, "WARNING");
      showToast(`PO déjà en cours pour ${item.sku}`, "error");
      return;
    }
    // Guard #3: check supplier active
    const supplier = SUPPLIERS.find(s => s.id === item.supplier_id);
    if (!supplier || supplier.statut === "inactif") {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `Fournisseur inactif — création PO bloquée pour ${item.sku}`, "ERROR");
      showToast(`Fournisseur inactif — PO bloqué`, "error");
      return;
    }
    const poId = nextPoId;
    const poNumber = `PO-2026-${String(poId).padStart(4,'0')}`;
    const qty = Math.round(item.eoq);
    const newPO = {
      po_id: poId, po_number: poNumber, sku: item.sku, article: item.article,
      supplier_id: item.supplier_id, qty, statut: "BROUILLON",
      prix_negocie: +(item.cout_unitaire * 0.95).toFixed(2), prix_paye: null,
      date_creation: TODAY, date_validation: null, date_envoi: null, date_reception: null,
      created_by: "Jean Dupont",
    };
    setPos(prev => [newPO, ...prev]);
    setNextPoId(prev => prev + 1);
    // Status history: initial
    setStatusHistory(prev => [...prev, {
      id: prev.length+1, po_id: poId, old_status: null, new_status: "BROUILLON",
      changed_by: "Jean Dupont", changed_at: TODAY, comment: `PO créé — ${item.article}`,
    }]);
    // Create validation task
    const newTask = {
      task_id: tasks.length + 1, type: "Validation PO", related_po_id: poId,
      assigned_to: "Marie Lavoie", status: "Ouverte",
      due_at: daysFromNow(3), comment: `Validation ${poNumber} — ${item.article}`,
    };
    setTasks(prev => [newTask, ...prev]);
    // Guard #2: qty > EOQ × 2 warning
    if (qty > item.eoq * 2) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", poId,
        `${poNumber} — Qty ${qty} > EOQ×2 (${Math.round(item.eoq*2)}) — tâche approbation créée`, "WARNING");
      setTasks(prev => [{ task_id: prev.length+1, type:"Approbation managériale",
        related_po_id: poId, assigned_to:"Jean Dupont", status:"Ouverte",
        due_at:daysFromNow(3), comment:`Qty > EOQ×2 pour ${poNumber}` }, ...prev]);
    }
    addEvent("PO_CREATED", "PurchaseOrder", poId,
      `${poNumber} créé pour ${item.article} (${item.sku}) — qty: ${qty}`, "INFO");
    showToast(`${poNumber} créé pour ${item.article}`);
    setActivePage("orders");
  }, [pos, tasks, nextPoId, addEvent, showToast]);

  const PageComponent = PAGES[activePage];

  const dataValue = useMemo(() => ({
    pos, tasks, events, statusHistory, counts, transitionPO, createPO, setActivePage, confirmAction,
    setSlideOver, setExpandedKPI, setCounts, setTasks, addEvent, showToast, setPos, setEvents,
    dailyTasks, setDailyTasks, completeDailyTask, notifications, addNotification, activityLog, addActivity,
  }), [pos, tasks, events, statusHistory, counts, transitionPO, createPO, confirmAction, dailyTasks, notifications, activityLog]);

  const openTaskCount = tasks.filter(t => t.status === "Ouverte").length;
  const criticalCount = ITEMS.filter(i => i.priorite === "Haute").length;
  const poToProcessCount = pos.filter(p => p.statut === "BROUILLON" || p.statut === "A_VALIDER").length;
  const errorCount = events.filter(e => e.level === "ERROR" || e.level === "CRITICAL").length;
  const cycleCountRemaining = useMemo(() => {
    const currentMonth = 3;
    return ITEMS.filter(item => {
      const freq = CYCLE_FREQ[item.abc] || 6;
      if (!(currentMonth % freq === 0 || freq === 1)) return false;
      return !counts.some(c => c.sku === item.sku && c.date >= "2026-03-01");
    }).length;
  }, [counts]);
  const badgeCounts = { critical: criticalCount, orders: poToProcessCount, tasks: openTaskCount, audit: errorCount, cyclecount: cycleCountRemaining };

  // Auth guard: show login if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const authValue = { user: currentUser, logout: handleLogout };

  return (
    <ThemeContext.Provider value={COLORS}>
    <AuthContext.Provider value={authValue}>
    <DataContext.Provider value={dataValue}>
    <div style={{ display:"flex", height:"100vh", fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif", background:COLORS.bg, color:COLORS.text, overflow:"hidden", transition:"background 0.35s ease, color 0.35s ease" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? 68 : 240,
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease, background 0.35s ease, border-color 0.35s ease",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? "20px 14px" : "20px 24px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"border-color 0.35s" }} onClick={()=>setSidebarCollapsed(c=>!c)}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          {!sidebarCollapsed && <div>
            <div style={{ fontWeight:700, fontSize:16, letterSpacing:"-0.02em", color:COLORS.text, transition:"color 0.35s" }}>SupplyPilot</div>
            <div style={{ fontSize:10, color:COLORS.textDim, letterSpacing:"0.04em", transition:"color 0.35s" }}>PROCUREMENT HUB</div>
          </div>}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV_ITEMS.filter(item => item.roles.includes(currentUser?.role)).map(item => {
            const isActive = activePage===item.id;
            return (
              <button key={item.id} onClick={()=>setActivePage(item.id)}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding: sidebarCollapsed ? "12px 18px" : "10px 16px",
                  borderRadius:10, border:"none",
                  background: isActive ? COLORS.accentGlow : "transparent",
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                  cursor:"pointer", fontSize:13, fontWeight: isActive ? 600 : 400,
                  transition:"all 0.2s", textAlign:"left", width:"100%",
                  position:"relative",
                }}>
                {isActive && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:20, borderRadius:2, background:COLORS.accent }}/>}
                <span style={{ flexShrink:0 }}><Icon name={item.icon} size={18}/></span>
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && badgeCounts[item.id] > 0 && (
                  <span style={{ marginLeft:"auto", background:item.id==="audit"?COLORS.danger:item.id==="critical"?"#f43f5e":item.id==="orders"||item.id==="warehouse_orders"?COLORS.warning:item.id==="cyclecount"?COLORS.info:COLORS.danger, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10, minWidth:18, textAlign:"center" }}>
                    {badgeCounts[item.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle in sidebar */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap:10, transition:"border-color 0.35s" }}>
          <ThemeToggle isDark={isDark} onToggle={()=>setIsDark(d=>!d)} />
          {!sidebarCollapsed && <span style={{ fontSize:12, color:COLORS.textMuted, transition:"color 0.35s" }}>{isDark ? "Mode sombre" : "Mode clair"}</span>}
        </div>

        {/* User + Logout */}
        {!sidebarCollapsed && (
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${COLORS.border}`, transition:"border-color 0.35s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg, ${currentUser?.color || "#6366f1"}, ${currentUser?.color || "#8b5cf6"}cc)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:13, flexShrink:0 }}>{currentUser?.initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, transition:"color 0.35s" }}>{currentUser?.nom}</div>
                <div style={{ fontSize:11, color:COLORS.textDim, transition:"color 0.35s" }}>{currentUser?.poste}</div>
              </div>
              <span style={{ fontSize:9, color:COLORS.textDim, opacity:0.5 }}>{APP_VERSION}</span>
            </div>
            <button onClick={handleLogout} style={{ width:"100%", padding:"6px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.danger;e.currentTarget.style.color=COLORS.danger;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.color=COLORS.textMuted;}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <header style={{ padding:"16px 28px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:COLORS.surface, flexShrink:0, transition:"background 0.35s, border-color 0.35s" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:0, letterSpacing:"-0.02em" }}>{PAGE_TITLES[activePage]}</h1>
            <div style={{ fontSize:12, color:COLORS.textDim, marginTop:2, transition:"color 0.35s" }}>{TODAY_DISPLAY} — {QUARTER} · <span style={{ opacity:0.5 }}>{APP_VERSION}</span></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>setGlobalSearch(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:10, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.textMuted, fontSize:12, cursor:"pointer", transition:"border-color 0.2s", minWidth:180, justifyContent:"space-between" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=COLORS.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=COLORS.border}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="search" size={14}/>Rechercher...</span>
              <span style={{ padding:"1px 6px", borderRadius:4, background:COLORS.bg, fontSize:10, color:COLORS.textDim, border:`1px solid ${COLORS.border}` }}>⌘K</span>
            </button>
            {/* Notification bell */}
            {(() => {
              const myNotifs = notifications.filter(n => n.forRole === currentUser?.role || n.forRole === "all");
              const unreadCount = myNotifs.filter(n => !n.read).length;
              return (
                <div style={{ position:"relative" }}>
                  <div style={{ cursor:"pointer", color:COLORS.textMuted, transition:"color 0.35s" }} onClick={()=>setShowNotifs(s=>!s)}>
                    <Icon name="bell" size={20}/>
                    {unreadCount > 0 && <div style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, borderRadius:8, background:COLORS.danger, color:"white", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{unreadCount}</div>}
                  </div>
                  {showNotifs && (
                    <div style={{ position:"absolute", top:36, right:0, width:360, maxHeight:400, overflowY:"auto", background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.3)", zIndex:1002 }}>
                      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:COLORS.text }}>Notifications ({unreadCount})</span>
                        {unreadCount > 0 && <button onClick={()=>setNotifications(prev=>prev.map(n=>({...n, read:true})))} style={{ fontSize:10, color:COLORS.accent, background:"transparent", border:"none", cursor:"pointer" }}>Tout marquer lu</button>}
                      </div>
                      {myNotifs.length === 0 ? (
                        <div style={{ padding:24, textAlign:"center", color:COLORS.textDim, fontSize:12 }}>Aucune notification</div>
                      ) : (
                        myNotifs.slice(0,15).map(n => (
                          <div key={n.id} style={{ padding:"12px 18px", borderBottom:`1px solid ${COLORS.border}08`, background:n.read?"transparent":`${COLORS.accent}06`, display:"flex", gap:12, alignItems:"flex-start" }}>
                            <div style={{ width:8, height:8, borderRadius:4, marginTop:5, flexShrink:0,
                              background:n.type==="warning"?COLORS.warning:n.type==="success"?COLORS.accent:COLORS.info }}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, color:COLORS.text, lineHeight:1.4 }}>{n.message}</div>
                              <div style={{ fontSize:10, color:COLORS.textDim, marginTop:3 }}>{n.by} · {n.time}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {currentUser?.role === "admin" && <button onClick={()=>setActivePage("critical")} style={{ padding:"8px 18px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.01em" }}>
              + Nouveau PO
            </button>}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflow:"auto", padding:24 }}>
          <PageComponent />
        </main>
      </div>

      {/* KPI Expand Overlay */}
      {expandedKPI && <KPIExpandOverlay kpiId={expandedKPI} onClose={()=>setExpandedKPI(null)}/>}

      {/* Global Search */}
      {globalSearch && <GlobalSearch onNavigate={(page, data) => {
        setActivePage(page);
        if (data?.sku) setSlideOver({ data, type:"item" });
        else if (data?.po_number) setSlideOver({ data, type:"po" });
        else if (data?.taux_conformite !== undefined) setSlideOver({ data, type:"supplier" });
      }} onClose={()=>setGlobalSearch(false)} />}

      {/* Slide-over detail */}
      {slideOver && <SlideOver data={slideOver.data} type={slideOver.type} onClose={()=>setSlideOver(null)} />}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:COLORS.text, marginBottom:8 }}>Confirmer l'action</div>
            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:20, lineHeight:1.6 }}>
              Voulez-vous <strong style={{ color:COLORS.accent }}>{confirmAction.action.toLowerCase()}</strong> le PO <strong style={{ color:COLORS.text }}>{confirmAction.po.po_number}</strong> ?
              <br/>Transition : <Badge>{confirmAction.po.statut}</Badge> → <Badge>{confirmAction.nextStatut}</Badge>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={()=>setConfirmAction(null)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
              <button onClick={()=>doTransitionPO(confirmAction.poId)} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, padding:"12px 20px", borderRadius:12,
          background: toast.type==="error" ? "#7f1d1d" : "#064e3b",
          color: "#fff", fontSize:13, fontWeight:600, zIndex:999,
          boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
          animation:"slideIn 0.3s ease",
          display:"flex", alignItems:"center", gap:8,
          border: `1px solid ${toast.type==="error" ? "#991b1b" : "#065f46"}`,
        }}>
          <span style={{ fontSize:16 }}>{toast.type==="error" ? "⛔" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderLight}; }
        button { font-family: inherit; }
        input { font-family: inherit; }
        input::placeholder { color: ${COLORS.textDim}; }
        @keyframes slideIn { from { transform: translateX(100px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes kpiExpand { from { opacity:0; transform: scale(0.97); } to { opacity:1; transform: scale(1); } }
      `}</style>
    </div>
    </DataContext.Provider>
    </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
