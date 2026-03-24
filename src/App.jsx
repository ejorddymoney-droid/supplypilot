import { useState, useMemo, useCallback, useEffect } from "react";
import { THEMES } from "./styles/themes";
import { ThemeContext } from "./contexts/ThemeContext";
import AuthContext from "./contexts/AuthContext";
import DataContext from "./contexts/DataContext";
import { TODAY, daysFromNow } from "./utils/formatters";
import {
  SUPPLIERS, SUPPLIER_MAP, INITIAL_POS, INITIAL_TASKS, INITIAL_EVENTS,
  INITIAL_COUNTS, USERS, WAREHOUSE_DAILY_TASKS, PO_TRANSITIONS, CYCLE_FREQ, ECART_SEUILS,
} from "./data/constants";
import { ITEMS } from "./data/generators";
import { Sidebar, Header } from "./components/layout";
import { GlobalSearch, SlideOver, ConfirmDialog, Toast } from "./components/overlays";
import KPIExpandOverlay from "./components/overlays/KPIExpandOverlay";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import InventoryPage from "./components/pages/InventoryPage";
import CriticalPage from "./components/pages/CriticalPage";
import SuppliersPage from "./components/pages/SuppliersPage";
import PurchaseOrdersPage from "./components/pages/PurchaseOrdersPage";
import TasksPage from "./components/pages/TasksPage";
import AuditPage from "./components/pages/AuditPage";
import SettingsPage from "./components/pages/SettingsPage";
import TRSPage from "./components/pages/TRSPage";
import CycleCountPage from "./components/pages/CycleCountPage";
import WarehouseDashboard from "./components/pages/WarehouseDashboard";
import WarehouseOrdersPage from "./components/pages/WarehouseOrdersPage";
import WarehouseStatsPage from "./components/pages/WarehouseStatsPage";

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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const COLORS = THEMES.dark;

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

  // Auth
  const handleLogin = (user) => {
    setCurrentUser(user);
    setActivePage(user.role === "admin" ? "dashboard" : "warehouse_home");
  };
  const handleLogout = () => { setCurrentUser(null); setActivePage(null); };

  const showToastFn = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addEvent = useCallback((type_event, entite, entite_id, details, level = "INFO") => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setEvents(prev => [{ event_id: prev.length + 1, date, type_event, utilisateur: currentUser?.nom || "Système", entite, entite_id, details, level }, ...prev]);
  }, [currentUser]);

  const completeDailyTask = useCallback((poNumber, actionType) => {
    setDailyTasks(prev => prev.map(t => {
      if (t.done) return t;
      if (t.po_ref === poNumber && t.action_type === actionType) return { ...t, done: true, completed_at: TODAY };
      if (!t.po_ref && t.action_type === actionType && t.assignee === currentUser?.nom) return { ...t, done: true, completed_at: TODAY };
      return t;
    }));
  }, [currentUser]);

  const addNotification = useCallback((message, forRole, type = "info") => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNotifications(prev => [{
      id: prev.length + 1, message, forRole, type, time, read: false, by: currentUser?.nom || "Système",
    }, ...prev].slice(0, 50));
  }, [currentUser]);

  const addActivity = useCallback((action, details) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setActivityLog(prev => [{
      id: prev.length + 1, user: currentUser?.nom, role: currentUser?.role, action, details, time, date: TODAY,
    }, ...prev].slice(0, 100));
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
      if (newStatut === "A_VALIDER") updated.date_validation = now;
      if (newStatut === "ENVOYE") updated.date_envoi = now;
      if (newStatut === "RECU") {
        updated.date_reception = now;
        updated.prix_paye = +(po.prix_negocie * (0.97 + Math.random() * 0.06)).toFixed(2);
      }
      setStatusHistory(prev => [...prev, {
        id: prev.length + 1, po_id: poId, old_status: oldStatut, new_status: newStatut,
        changed_by: "Jean Dupont", changed_at: now, comment: `Transition ${oldStatut} → ${newStatut}`,
      }]);
      addEvent("PO_TRANSITION", "PurchaseOrder", poId, `${po.po_number} : ${oldStatut} → ${newStatut}`, "INFO");
      showToastFn(`${po.po_number} → ${newStatut}`);
      if (newStatut === "ENVOYE") {
        addNotification(`Nouveau PO à traiter : ${po.po_number} — ${po.article} (${po.qty} unités)`, "entrepot", "info");
      }
      addActivity("Transition PO", `${po.po_number} : ${oldStatut} → ${newStatut}`);
      if (newStatut === "ENVOYE" || newStatut === "CLOS") {
        setTasks(prev => prev.map(t =>
          t.related_po_id === poId && t.status !== "Terminée" ? { ...t, status: "Terminée" } : t
        ));
      }
      return updated;
    }));
    setConfirmAction(null);
  }, [addEvent, showToastFn, addNotification, addActivity]);

  const transitionPO = useCallback((poId) => {
    const po = pos.find(p => p.po_id === poId);
    if (!po) return;
    if (po.statut === "BROUILLON") {
      const item = ITEMS.find(i => i.sku === po.sku);
      if (item && po.qty > item.eoq * 2) {
        addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", poId,
          `${po.po_number} — Qty ${po.qty} > EOQ×2 (${item.eoq * 2}) — validation managériale requise`, "WARNING");
        setTasks(prev => [{ task_id: prev.length + 1, type: "Approbation managériale",
          related_po_id: poId, assigned_to: "Jean Dupont", status: "Ouverte",
          due_at: daysFromNow(3), comment: `Qty ${po.qty} > EOQ×2 pour ${po.po_number}` }, ...prev]);
        showToastFn(`Qty > EOQ×2 — approbation managériale créée`, "error");
      }
    }
    if (po.statut === "ENVOYE" || po.statut === "RECU") {
      setConfirmAction({ poId, po, action: PO_TRANSITIONS[po.statut].label, nextStatut: PO_TRANSITIONS[po.statut].next });
      return;
    }
    doTransitionPO(poId);
  }, [pos, doTransitionPO, addEvent, showToastFn]);

  const createPO = useCallback((item) => {
    if (!item.eoq || item.eoq <= 0) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `Quantité EOQ invalide (${item.eoq}) pour ${item.sku} — création refusée`, "ERROR");
      showToastFn(`Quantité invalide — PO refusé`, "error");
      return;
    }
    const existing = pos.find(p => p.sku === item.sku && (p.statut === "BROUILLON" || p.statut === "A_VALIDER"));
    if (existing) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `PO déjà existant (${existing.po_number}) pour ${item.sku} — création bloquée`, "WARNING");
      showToastFn(`PO déjà en cours pour ${item.sku}`, "error");
      return;
    }
    const supplier = SUPPLIERS.find(s => s.id === item.supplier_id);
    if (!supplier || supplier.statut === "inactif") {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", 0,
        `Fournisseur inactif — création PO bloquée pour ${item.sku}`, "ERROR");
      showToastFn(`Fournisseur inactif — PO bloqué`, "error");
      return;
    }
    const poId = nextPoId;
    const poNumber = `PO-2026-${String(poId).padStart(4, '0')}`;
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
    setStatusHistory(prev => [...prev, {
      id: prev.length + 1, po_id: poId, old_status: null, new_status: "BROUILLON",
      changed_by: "Jean Dupont", changed_at: TODAY, comment: `PO créé — ${item.article}`,
    }]);
    const newTask = {
      task_id: tasks.length + 1, type: "Validation PO", related_po_id: poId,
      assigned_to: "Marie Lavoie", status: "Ouverte",
      due_at: daysFromNow(3), comment: `Validation ${poNumber} — ${item.article}`,
    };
    setTasks(prev => [newTask, ...prev]);
    if (qty > item.eoq * 2) {
      addEvent("GUARDRAIL_BLOCKED", "PurchaseOrder", poId,
        `${poNumber} — Qty ${qty} > EOQ×2 (${Math.round(item.eoq * 2)}) — tâche approbation créée`, "WARNING");
      setTasks(prev => [{ task_id: prev.length + 1, type: "Approbation managériale",
        related_po_id: poId, assigned_to: "Jean Dupont", status: "Ouverte",
        due_at: daysFromNow(3), comment: `Qty > EOQ×2 pour ${poNumber}` }, ...prev]);
    }
    addEvent("PO_CREATED", "PurchaseOrder", poId,
      `${poNumber} créé pour ${item.article} (${item.sku}) — qty: ${qty}`, "INFO");
    showToastFn(`${poNumber} créé pour ${item.article}`);
    setActivePage("orders");
  }, [pos, tasks, nextPoId, addEvent, showToastFn]);

  const PageComponent = PAGES[activePage];

  const dataValue = useMemo(() => ({
    pos, tasks, events, statusHistory, counts, transitionPO, createPO, setActivePage, confirmAction,
    setSlideOver, setExpandedKPI, setCounts, setTasks, addEvent, showToast: showToastFn, setPos, setEvents,
    dailyTasks, setDailyTasks, completeDailyTask, notifications, addNotification, activityLog, addActivity,
  }), [pos, tasks, events, statusHistory, counts, transitionPO, createPO, confirmAction, dailyTasks, notifications, activityLog, completeDailyTask, addNotification, addActivity, addEvent, showToastFn]);

  // Badge counts for nav
  const badgeCounts = useMemo(() => {
    const openTaskCount = tasks.filter(t => t.status === "Ouverte").length;
    const criticalCount = ITEMS.filter(i => i.priorite === "Haute").length;
    const poToProcessCount = pos.filter(p => p.statut === "BROUILLON" || p.statut === "A_VALIDER").length;
    const errorCount = events.filter(e => e.level === "ERROR" || e.level === "CRITICAL").length;
    const currentMonth = 3;
    const cycleCountRemaining = ITEMS.filter(item => {
      const freq = CYCLE_FREQ[item.abc] || 6;
      if (!(currentMonth % freq === 0 || freq === 1)) return false;
      return !counts.some(c => c.sku === item.sku && c.date >= "2026-03-01");
    }).length;
    return { critical: criticalCount, orders: poToProcessCount, tasks: openTaskCount, audit: errorCount, cyclecount: cycleCountRemaining };
  }, [tasks, pos, events, counts]);

  // Auth guard
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const authValue = { user: currentUser, logout: handleLogout };

  return (
    <ThemeContext.Provider value={COLORS}>
    <AuthContext.Provider value={authValue}>
    <DataContext.Provider value={dataValue}>
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", background: COLORS.meshBg, color: COLORS.text, overflow: "hidden" }}>
      <Sidebar
        currentUser={currentUser}
        activePage={activePage}
        setActivePage={setActivePage}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        badgeCounts={badgeCounts}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          activePage={activePage}
          onOpenSearch={() => setGlobalSearch(true)}
          notifications={notifications}
          setNotifications={setNotifications}
          currentUser={currentUser}
          showNotifs={showNotifs}
          setShowNotifs={setShowNotifs}
        />

        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {PageComponent && <PageComponent />}
        </main>
      </div>

      {expandedKPI && <KPIExpandOverlay kpiId={expandedKPI} onClose={() => setExpandedKPI(null)} />}

      {globalSearch && <GlobalSearch onNavigate={(page, data) => {
        setActivePage(page);
        if (data?.sku) setSlideOver({ data, type: "item" });
        else if (data?.po_number) setSlideOver({ data, type: "po" });
        else if (data?.taux_conformite !== undefined) setSlideOver({ data, type: "supplier" });
      }} onClose={() => setGlobalSearch(false)} />}

      {slideOver && <SlideOver data={slideOver.data} type={slideOver.type} onClose={() => setSlideOver(null)} />}

      {confirmAction && <ConfirmDialog
        confirmAction={confirmAction}
        onConfirm={() => doTransitionPO(confirmAction.poId)}
        onCancel={() => setConfirmAction(null)}
      />}

      {toast && <Toast toast={toast} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        button { font-family: inherit; }
        input { font-family: inherit; }
        input::placeholder { color: ${COLORS.textDim}; }
        @keyframes slideIn { from { transform: translateX(100px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes kpiExpand { from { opacity:0; transform: scale(0.97); } to { opacity:1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes glowPulse { 0%, 100% { opacity:1; } 50% { opacity:0.7; } }
      `}</style>
    </div>
    </DataContext.Provider>
    </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
