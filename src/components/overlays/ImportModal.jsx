import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ImportModal = ({ type, onClose, onImport }) => {
  const COLORS = useTheme();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState([]);

  const hints = type === "items"
    ? "Colonnes attendues : sku, nom, famille, stock_net, demande_annuelle, cout_unitaire, seuil_min, stock_securite, lead_time_jours, cout_commande"
    : "Colonnes attendues : sku, qty, supplier_id, prix_negocie, commentaire";

  const handleParse = () => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(/[,\t;]/).map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(/[,\t;]/).map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    }).filter(r => Object.values(r).some(v => v));
    setParsed(rows);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1005 }}
      role="dialog" aria-label="Importer CSV" aria-modal="true">
      <div style={{ width: 600, maxHeight: "80vh", overflowY: "auto", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Importer des données CSV</div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 16 }}>{hints}</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
          placeholder="Collez vos données CSV ici (avec en-têtes en première ligne)..."
          aria-label="Données CSV"
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleParse} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.info}`, background: `${COLORS.info}15`, color: COLORS.info, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Analyser</button>
          {parsed.length > 0 && <span style={{ fontSize: 12, color: COLORS.accent, alignSelf: "center" }}>{parsed.length} lignes détectées</span>}
        </div>
        {parsed.length > 0 && (
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>Aperçu (5 premières lignes)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>{Object.keys(parsed[0]).map(k => <th key={k} style={{ textAlign: "left", padding: "6px 8px", color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {parsed.slice(0, 5).map((row, i) => (
                  <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: "6px 8px", color: COLORS.text, borderBottom: `1px solid ${COLORS.border}22` }}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
          <button onClick={() => onImport(parsed)} disabled={parsed.length === 0}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: parsed.length > 0 ? 1 : 0.5 }}>
            Importer {parsed.length} lignes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
