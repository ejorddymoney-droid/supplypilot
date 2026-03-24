import { useTheme } from '../../contexts/ThemeContext';
import Icon from '../common/Icon';
import { APP_VERSION } from '../../data/constants';

const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", icon:"dashboard", roles:["admin"] },
  { id:"inventory", label:"Inventaire", icon:"inventory", roles:["admin"] },
  { id:"critical", label:"Articles critiques", icon:"critical", roles:["admin"] },
  { id:"suppliers", label:"Fournisseurs", icon:"suppliers", roles:["admin"] },
  { id:"orders", label:"Purchase Orders", icon:"orders", roles:["admin"] },
  { id:"tasks", label:"Tâches", icon:"tasks", roles:["admin"] },
  { id:"audit", label:"Journal d'audit", icon:"audit", roles:["admin"] },
  { id:"trs", label:"Performance TRS", icon:"trs", roles:["admin"] },
  { id:"warehouse_orders", label:"Commandes internes", icon:"orders", roles:["admin","entrepot"] },
  { id:"cyclecount", label:"Inventaire tournant", icon:"cyclecount", roles:["admin","entrepot"] },
  { id:"warehouse_home", label:"Mon tableau de bord", icon:"dashboard", roles:["entrepot"] },
  { id:"inventory_readonly", label:"Consulter inventaire", icon:"inventory", roles:["entrepot"] },
  { id:"warehouse_stats", label:"Mes statistiques", icon:"trs", roles:["entrepot"] },
  { id:"settings", label:"Règles / Config", icon:"settings", roles:["admin"] },
];

const Sidebar = ({ currentUser, activePage, setActivePage, sidebarCollapsed, setSidebarCollapsed, badgeCounts, onLogout }) => {
  const COLORS = useTheme();

  return (
    <aside style={{
      width: sidebarCollapsed ? 68 : 240,
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease",
      flexShrink: 0, overflow: "hidden",
    }} aria-label="Navigation principale">
      {/* Logo */}
      <div style={{ padding: sidebarCollapsed ? "20px 14px" : "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => setSidebarCollapsed(c => !c)} role="button" aria-label={sidebarCollapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(16,185,129,0.3)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
        </div>
        {!sidebarCollapsed && <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: COLORS.text }}>SupplyPilot</div>
          <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "0.04em" }}>PROCUREMENT HUB</div>
        </div>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }} role="navigation" aria-label="Menu principal">
        {NAV_ITEMS.filter(item => item.roles.includes(currentUser?.role)).map(item => {
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: sidebarCollapsed ? "12px 18px" : "10px 16px",
                borderRadius: 10, border: "none",
                background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                boxShadow: isActive ? "0 0 20px rgba(16,185,129,0.08), inset 0 0 20px rgba(16,185,129,0.04)" : "none",
                color: isActive ? COLORS.accent : COLORS.textMuted,
                cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s", textAlign: "left", width: "100%", position: "relative",
              }}>
              {isActive && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: 2, background: COLORS.accent, boxShadow: "0 0 8px rgba(16,185,129,0.4)" }} />}
              <span style={{ flexShrink: 0 }} aria-hidden="true"><Icon name={item.icon} size={18} /></span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && badgeCounts[item.id] > 0 && (() => {
                const badgeColor = item.id === "audit" ? COLORS.danger : item.id === "critical" ? "#f43f5e" : item.id === "orders" || item.id === "warehouse_orders" ? COLORS.warning : item.id === "cyclecount" ? COLORS.info : COLORS.danger;
                return (
                  <span style={{ marginLeft: "auto", background: badgeColor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, minWidth: 18, textAlign: "center", boxShadow: `0 0 10px ${badgeColor}40` }}
                    role="status" aria-label={`${badgeCounts[item.id]} éléments`}>
                    {badgeCounts[item.id]}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      {!sidebarCollapsed && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${currentUser?.color || "#6366f1"}, ${currentUser?.color || "#8b5cf6"}cc)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: `0 0 12px ${currentUser?.color || "#6366f1"}40` }}>{currentUser?.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{currentUser?.nom}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim }}>{currentUser?.poste}</div>
            </div>
            <span style={{ fontSize: 9, color: COLORS.textDim, opacity: 0.5 }}>{APP_VERSION}</span>
          </div>
          <button onClick={onLogout} aria-label="Se déconnecter"
            style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: COLORS.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.danger; e.currentTarget.style.color = COLORS.danger; e.currentTarget.style.boxShadow = "0 0 12px rgba(239,68,68,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = COLORS.textMuted; e.currentTarget.style.boxShadow = "none"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
