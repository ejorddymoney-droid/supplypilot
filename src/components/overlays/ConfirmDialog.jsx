import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../common';

const ConfirmDialog = ({ confirmAction, onConfirm, onCancel }) => {
  const COLORS = useTheme();
  if (!confirmAction) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      role="dialog" aria-label="Confirmation" aria-modal="true">
      <div style={{ background: "rgba(15,20,35,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Confirmer l'action</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Voulez-vous <strong style={{ color: COLORS.accent }}>{confirmAction.action.toLowerCase()}</strong> le PO <strong style={{ color: COLORS.text }}>{confirmAction.po.po_number}</strong> ?
          <br />Transition : <Badge>{confirmAction.po.statut}</Badge> → <Badge>{confirmAction.nextStatut}</Badge>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
