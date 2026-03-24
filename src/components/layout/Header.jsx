import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Icon from '../common/Icon';
import { APP_VERSION } from '../../data/constants';
import { TODAY_DISPLAY, QUARTER } from '../../utils/formatters';

const PAGE_TITLES = {
  dashboard: "Tableau de bord", inventory: "Gestion d'inventaire",
  critical: "Articles critiques", suppliers: "Fournisseurs",
  orders: "Purchase Orders", tasks: "Tâches de validation",
  audit: "Journal d'audit", trs: "Performance TRS",
  cyclecount: "Inventaire tournant", warehouse_orders: "Commandes internes",
  warehouse_home: "Mon tableau de bord", warehouse_stats: "Mes statistiques",
  inventory_readonly: "Inventaire (consultation)", settings: "Règles et configuration",
};

const Header = ({ activePage, onOpenSearch, notifications, setNotifications, currentUser, showNotifs, setShowNotifs }) => {
  const COLORS = useTheme();
  const { setActivePage } = useData();

  const myNotifs = notifications.filter(n => n.forRole === currentUser?.role || n.forRole === "all");
  const unreadCount = myNotifs.filter(n => !n.read).length;

  return (
    <header style={{ padding:"16px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", flexShrink:0 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, margin:0, letterSpacing:"-0.02em", textShadow:"0 0 30px rgba(255,255,255,0.04)" }}>{PAGE_TITLES[activePage]}</h1>
        <div style={{ fontSize:12, color:COLORS.textDim, marginTop:2 }}>{TODAY_DISPLAY} — {QUARTER} · <span style={{ opacity:0.5 }}>{APP_VERSION}</span></div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onOpenSearch} aria-label="Ouvrir la recherche globale"
          style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", color:COLORS.textMuted, fontSize:12, cursor:"pointer", transition:"border-color 0.2s, box-shadow 0.2s", minWidth:180, justifyContent:"space-between" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.boxShadow = "0 0 12px rgba(16,185,129,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}>
          <span style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="search" size={14}/>Rechercher...</span>
          <kbd style={{ padding:"1px 6px", borderRadius:4, background:COLORS.bg, fontSize:10, color:COLORS.textDim, border:`1px solid ${COLORS.border}` }}>⌘K</kbd>
        </button>

        {/* Notification bell */}
        <div style={{ position:"relative" }}>
          <button style={{ cursor:"pointer", color:COLORS.textMuted, background:"transparent", border:"none", padding:4 }}
            onClick={() => setShowNotifs(s => !s)} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}>
            <Icon name="bell" size={20}/>
            {unreadCount > 0 && <div style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, borderRadius:8, background:COLORS.danger, color:"white", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }} role="status">{unreadCount}</div>}
          </button>
          {showNotifs && (
            <div style={{ position:"absolute", top:36, right:0, width:360, maxHeight:400, overflowY:"auto", background:"rgba(15,20,35,0.9)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.5)", zIndex:1002 }} role="dialog" aria-label="Notifications">
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:COLORS.text }}>Notifications ({unreadCount})</span>
                {unreadCount > 0 && <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} style={{ fontSize:10, color:COLORS.accent, background:"transparent", border:"none", cursor:"pointer" }}>Tout marquer lu</button>}
              </div>
              {myNotifs.length === 0 ? (
                <div style={{ padding:24, textAlign:"center", color:COLORS.textDim, fontSize:12 }}>Aucune notification</div>
              ) : (
                myNotifs.slice(0, 15).map(n => (
                  <div key={n.id} style={{ padding:"12px 18px", borderBottom:`1px solid ${COLORS.border}08`, background: n.read ? "transparent" : `${COLORS.accent}06`, display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:8, height:8, borderRadius:4, marginTop:5, flexShrink:0,
                      background: n.type === "warning" ? COLORS.warning : n.type === "success" ? COLORS.accent : COLORS.info }} aria-hidden="true"/>
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

        {currentUser?.role === "admin" && (
          <button onClick={() => setActivePage("critical")}
            style={{ padding:"8px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg, #10B981, #059669)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.01em", boxShadow:"0 0 20px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.2)", transition:"box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.45), 0 6px 16px rgba(0,0,0,0.3)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.2)"}>
            + Nouveau PO
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
