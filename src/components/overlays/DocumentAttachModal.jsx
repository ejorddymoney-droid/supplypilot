import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DocumentAttachModal = ({ po, onClose, onAttach }) => {
  const COLORS = useTheme();
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).map(f => ({
      name: f.name, size: f.size, type: f.type, date: new Date().toISOString().slice(0, 10),
    }));
    setFiles(prev => [...prev, ...selected]);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1005 }}
      role="dialog" aria-label="Joindre des documents" aria-modal="true">
      <div style={{ width: 460, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Joindre des documents</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>PO : <strong style={{ color: COLORS.accent }}>{po.po_number}</strong> — {po.article}</div>
        <label htmlFor="doc-upload" style={{ display: "block", padding: "20px", borderRadius: 12, border: `2px dashed ${COLORS.border}`, textAlign: "center", cursor: "pointer", marginBottom: 16, transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Cliquez pour sélectionner des fichiers</div>
          <input id="doc-upload" type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
        </label>
        {files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{f.name}</span>
                <span style={{ fontSize: 10, color: COLORS.textDim }}>{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "transparent", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 14 }}>{"\u2715"}</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
          <button onClick={() => onAttach(po.po_id, files)} disabled={files.length === 0}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: files.length > 0 ? 1 : 0.5 }}>
            Joindre {files.length} document(s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAttachModal;
