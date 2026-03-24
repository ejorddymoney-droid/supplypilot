import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { KpiCard, Card, Badge, ActionBtn, SearchInput } from '../common';
import { TableContainer, Th, Td, SortableTh } from '../common/Table';
import { useSortable } from '../../hooks/useSortable';
import { SUPPLIER_MAP } from '../../data/constants';
import { fmt, formatDate, TODAY } from '../../utils/formatters';

const WarehouseOrdersPage = () => {
  const COLORS = useTheme();
  const { pos, setPos, addEvent, showToast, completeDailyTask, addNotification, addActivity } = useData();
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [receptionModal, setReceptionModal] = useState(null);
  const [receptionForm, setReceptionForm] = useState({ qtyRecue: "", probleme: "Aucun — conforme" });
  const { sortCol, sortDir, handleSort, sortData } = useSortable("date_creation", "desc");

  const warehousePOs = useMemo(() => {
    let data = pos.filter(p => p.statut === "ENVOYE" || p.statut === "RECU");
    if (search) data = data.filter(p => p.po_number.toLowerCase().includes(search.toLowerCase()) || p.article.toLowerCase().includes(search.toLowerCase()));
    return sortData(data);
  }, [pos, search, sortCol, sortDir]);

  const handleReception = () => {
    if (!receptionModal) return;
    const po = receptionModal;
    const qtyRecue = parseInt(receptionForm.qtyRecue) || po.qty;
    setPos(prev => prev.map(p => {
      if (p.po_id !== po.po_id) return p;
      return {
        ...p, statut: "RECU", date_reception: TODAY, qty_recue: qtyRecue,
        prix_paye: +(p.prix_negocie * (0.97 + Math.random() * 0.06)).toFixed(2),
        received_by: auth.user.nom, reception_probleme: receptionForm.probleme,
      };
    }));
    addEvent("PO_RECEIVED", "PurchaseOrder", po.po_id, `${po.po_number} réceptionné par ${auth.user.nom} — ${qtyRecue}/${po.qty} unités`, "INFO");
    completeDailyTask(po.po_number, "reception");
    addNotification(`PO ${po.po_number} réceptionné — ${qtyRecue} unités reçues`, "admin", "success");
    addActivity("Réception PO", `${po.po_number} — ${qtyRecue} unités`);
    showToast(`${po.po_number} réceptionné`);
    setReceptionModal(null);
    setReceptionForm({ qtyRecue: "", probleme: "Aucun — conforme" });
  };

  const S = ({ col, children }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>{children}</SortableTh>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="PO envoyés" value={pos.filter(p => p.statut === "ENVOYE").length} color={COLORS.info} />
        <KpiCard label="PO reçus" value={pos.filter(p => p.statut === "RECU").length} color={COLORS.accent} />
        <KpiCard label="À traiter" value={pos.filter(p => p.statut === "ENVOYE").length} color={COLORS.warning} />
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un PO..." />
      <Card title={`Commandes internes — ${warehousePOs.length}`}>
        <TableContainer>
          <thead><tr><S col="po_number">PO</S><S col="article">Article</S><Th>Fournisseur</Th><S col="qty">Qty</S><S col="statut">Statut</S><S col="date_creation">Créé le</S><Th>Actions</Th></tr></thead>
          <tbody>
            {warehousePOs.map(po => (
              <tr key={po.po_id} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Td style={{ fontWeight: 700, color: COLORS.accent }}>{po.po_number}</Td>
                <Td><span style={{ fontWeight: 500 }}>{po.article}</span><br /><span style={{ fontSize: 11, color: COLORS.textDim }}>{po.sku}</span></Td>
                <Td style={{ color: COLORS.textMuted }}>{SUPPLIER_MAP[po.supplier_id]?.split(' ')[0]}</Td>
                <Td style={{ fontWeight: 600 }}>{po.qty_recue ? `${po.qty_recue}/${po.qty}` : po.qty}</Td>
                <Td><Badge>{po.statut}</Badge></Td>
                <Td style={{ color: COLORS.textMuted, fontSize: 12 }}>{po.date_creation}</Td>
                <Td>
                  <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>
                    {po.statut === "ENVOYE" && <ActionBtn onClick={() => setReceptionModal(po)} borderColor={COLORS.accent} bgColor={COLORS.accentGlow} textColor={COLORS.accent}>Réceptionner</ActionBtn>}
                    {po.statut === "RECU" && <span style={{ fontSize: 10, color: COLORS.textDim }}>Reçu {po.received_by ? `par ${po.received_by}` : ""}</span>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>

      {receptionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1005 }} role="dialog" aria-label="Réception PO" aria-modal="true">
          <div style={{ width: 480, background: "rgba(15,20,35,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Réception — {receptionModal.po_number}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>{receptionModal.article} — Qty commandée : {receptionModal.qty}</div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="qty-recue" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Quantité reçue</label>
              <input id="qty-recue" type="number" value={receptionForm.qtyRecue} onChange={e => setReceptionForm(f => ({ ...f, qtyRecue: e.target.value }))}
                placeholder={String(receptionModal.qty)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="probleme" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Problème de réception</label>
              <select id="probleme" value={receptionForm.probleme} onChange={e => setReceptionForm(f => ({ ...f, probleme: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                {["Aucun — conforme", "Quantité inférieure", "Quantité supérieure", "Dommages constatés", "Mauvais article", "Emballage endommagé"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setReceptionModal(null)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button onClick={handleReception} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirmer la réception</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseOrdersPage;
