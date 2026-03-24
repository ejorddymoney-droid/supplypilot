import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Icon from '../common/Icon';
import { ITEMS } from '../../data/generators';
import { SUPPLIERS } from '../../data/constants';

const GlobalSearch = ({ onNavigate, onClose }) => {
  const COLORS = useTheme();
  const { pos } = useData();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const ql = q.toLowerCase();
    const out = [];
    ITEMS.filter(i => i.article.toLowerCase().includes(ql) || i.sku.toLowerCase().includes(ql)).slice(0, 5)
      .forEach(i => out.push({ type: "Article", label: i.article, sub: `${i.sku} · ${i.abc} · ${i.statut_service}`, page: "inventory", data: i }));
    pos.filter(p => p.po_number.toLowerCase().includes(ql) || p.article.toLowerCase().includes(ql)).slice(0, 4)
      .forEach(p => out.push({ type: "PO", label: p.po_number, sub: `${p.article} · ${p.statut}`, page: "orders", data: p }));
    SUPPLIERS.filter(s => s.nom.toLowerCase().includes(ql)).slice(0, 3)
      .forEach(s => out.push({ type: "Fournisseur", label: s.nom, sub: `${s.pays} · ${s.statut}`, page: "suppliers", data: s }));
    return out;
  }, [q, pos]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100, zIndex: 1001 }}
      onClick={onClose} role="dialog" aria-label="Recherche globale" aria-modal="true">
      <div style={{ width: 540, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}` }}>
          <Icon name="search" size={18} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Rechercher articles, POs, fournisseurs..."
            aria-label="Recherche"
            style={{ flex: 1, background: "transparent", border: "none", color: COLORS.text, fontSize: 15, outline: "none" }} />
          <span onClick={onClose} style={{ padding: "2px 8px", borderRadius: 6, background: COLORS.surface, color: COLORS.textDim, fontSize: 11, cursor: "pointer", border: `1px solid ${COLORS.border}` }}>ESC</span>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => { onNavigate(r.page, r.data); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: r.type === "Article" ? COLORS.infoDim : r.type === "PO" ? COLORS.accentGlow : COLORS.purpleDim, color: r.type === "Article" ? COLORS.info : r.type === "PO" ? COLORS.accent : COLORS.purple }}>{r.type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {q.length >= 2 && results.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: COLORS.textDim, fontSize: 13 }}>Aucun résultat pour « {q} »</div>
        )}
        {q.length < 2 && (
          <div style={{ padding: 20, textAlign: "center", color: COLORS.textDim, fontSize: 12 }}>Tapez au moins 2 caractères...</div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
