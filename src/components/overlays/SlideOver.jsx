import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common';
import { SUPPLIER_MAP, ASSIGNEES } from '../../data/constants';
import { fmt, formatDate, TODAY } from '../../utils/formatters';

const SlideOver = ({ data, type, onClose }) => {
  const COLORS = useTheme();
  const { setTasks, tasks, events, setEvents, pos, showToast, addEvent } = useData();
  const auth = useAuth();
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  if (!data) return null;

  const Row = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color || COLORS.text, textAlign: "right", maxWidth: 220 }}>{value}</span>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 1002, display: "flex" }} onClick={onClose}
      role="dialog" aria-label={title} aria-modal="true">
      <div style={{ flex: 1 }} />
      <div onClick={e => e.stopPropagation()} style={{
        width: 440, background: "rgba(12,16,28,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.06)", height: "100%",
        boxShadow: "-10px 0 40px rgba(0,0,0,0.4)", overflowY: "auto", animation: "slideRight 0.25s ease",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: COLORS.card, zIndex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{title}</div>
          <button onClick={onClose} aria-label="Fermer" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>{"\u2715"}</button>
        </div>
        <div style={{ padding: "16px 24px" }}>
          {type === "item" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{data.article}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><Badge>{data.abc}</Badge><Badge>{data.statut_service}</Badge><Badge>{data.priorite}</Badge></div>
            <Row label="SKU" value={data.sku} /><Row label="Famille" value={data.famille} /><Row label="Demande annuelle" value={fmt(data.demande)} />
            <Row label="Coût unitaire" value={`$${data.cout_unitaire?.toFixed(2)}`} /><Row label="EOQ" value={fmt(data.eoq)} color={COLORS.accent} />
            <Row label="ROP" value={fmt(data.rop)} /><Row label="Stock net" value={fmt(data.stock_net)} color={data.stock_net < data.seuil_min ? COLORS.danger : COLORS.accent} />
            <Row label="Seuil minimum" value={fmt(data.seuil_min)} /><Row label="Couverture" value={`${data.couverture?.toFixed(1)} jours`} color={data.couverture < 15 ? COLORS.danger : data.couverture < 30 ? COLORS.warning : COLORS.accent} />
            <Row label="Lead time" value={`${data.lead_time} jours`} /><Row label="Fournisseur" value={SUPPLIER_MAP[data.supplier_id] || "\u2014"} />
          </>}

          {type === "po" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>{data.po_number}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><Badge>{data.statut}</Badge></div>
            <Row label="Article" value={data.article} /><Row label="SKU" value={data.sku} /><Row label="Fournisseur" value={SUPPLIER_MAP[data.supplier_id] || "\u2014"} />
            <Row label="Quantité" value={data.qty_recue ? `${data.qty_recue} reçu / ${data.qty} cmd` : data.qty} />
            <Row label="Prix négocié" value={`$${data.prix_negocie?.toFixed(2)}`} /><Row label="Prix payé" value={data.prix_paye ? `$${data.prix_paye.toFixed(2)}` : "\u2014"} />
            <Row label="Créé par" value={data.created_by} />{data.received_by && <Row label="Réceptionné par" value={data.received_by} />}
            {data.reception_probleme && data.reception_probleme !== "Aucun — conforme" && <Row label="Problème" value={data.reception_probleme} color={COLORS.danger} />}
            <div style={{ marginTop: 20, marginBottom: 8, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Timeline du PO</div>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: COLORS.border }} />
              {[{ label: "Création", date: data.date_creation, color: "#6b7280" }, { label: "Validation", date: data.date_validation, color: "#f59e0b" }, { label: "Envoi", date: data.date_envoi, color: "#3b82f6" }, { label: "Réception", date: data.date_reception, color: "#10b981" }, { label: "Clôture", date: data.statut === "CLOS" ? data.date_reception : null, color: "#8b5cf6" }].map((step, i) => {
                const done = step.date != null;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, position: "relative" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${done ? step.color : COLORS.border}`, background: done ? step.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                      {done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <div><div style={{ fontSize: 12, fontWeight: done ? 600 : 400, color: done ? COLORS.text : COLORS.textDim }}>{step.label}</div>
                      <div style={{ fontSize: 11, color: done ? step.color : COLORS.textDim }}>{done ? formatDate(step.date) : "En attente"}</div></div>
                  </div>
                );
              })}
            </div>
          </>}

          {type === "task" && (() => {
            const t = tasks.find(tk => tk.task_id === data.task_id) || data;
            const po = pos.find(p => p.po_id === t.related_po_id);
            const comments = t.comments || [];
            return <>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{t.type}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><Badge>{t.status}</Badge></div>
              {po && <Row label="PO lié" value={po.po_number} />}
              <Row label="Échéance" value={formatDate(t.due_at)} color={new Date(t.due_at) < new Date(TODAY) && t.status !== "Terminée" ? COLORS.danger : COLORS.text} />
              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Changer le statut</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {["Ouverte", "En cours", "Terminée"].map(s => (
                  <button key={s} onClick={() => handleStatusChange(t.task_id, s)}
                    style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${t.status === s ? COLORS.accent : COLORS.border}`,
                      background: t.status === s ? COLORS.accentGlow : "transparent", color: t.status === s ? COLORS.accent : COLORS.textMuted,
                      fontSize: 11, fontWeight: t.status === s ? 600 : 400, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Assigné à</div>
              <select value={t.assigned_to} onChange={e => handleAssign(t.task_id, e.target.value)}
                aria-label="Assigner à"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none", marginBottom: 16, fontFamily: "inherit", cursor: "pointer" }}>
                {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Commentaires ({comments.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
                {t.comment && <div style={{ padding: "10px 12px", borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 12, color: COLORS.text }}>{t.comment}</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>Note initiale</div>
                </div>}
                {comments.map((c, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.text }}>{c.text}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{c.by} — {formatDate(c.date)}</div>
                  </div>
                ))}
                {comments.length === 0 && !t.comment && <div style={{ fontSize: 12, color: COLORS.textDim, padding: 8 }}>Aucun commentaire</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={2} placeholder="Ajouter un commentaire..."
                  aria-label="Nouveau commentaire"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                <button onClick={() => handleAddComment(t.task_id)} disabled={!newComment.trim()}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end", opacity: newComment.trim() ? 1 : 0.4 }}>Envoyer</button>
              </div>
            </>;
          })()}

          {type === "event" && (() => {
            const ev = events.find(e => e.event_id === data.event_id) || data;
            const notes = ev.notes || [];
            return <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><Badge>{ev.level}</Badge><span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{ev.type_event}</span></div>
              <Row label="Date" value={ev.date} /><Row label="Utilisateur" value={ev.utilisateur} /><Row label="Entité" value={ev.entite} /><Row label="ID" value={`#${ev.entite_id}`} />
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>DÉTAILS</div>
                <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{ev.details}</div>
              </div>
              <div style={{ marginTop: 20, marginBottom: 8, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Notes ({notes.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
                {notes.length === 0 && <div style={{ fontSize: 12, color: COLORS.textDim, padding: 8 }}>Aucune note ajoutée</div>}
                {notes.map((n, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.text }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 4 }}>{n.by} — {formatDate(n.date)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} placeholder="Ajouter une note..."
                  aria-label="Nouvelle note"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                <button onClick={() => handleAddNote(ev.event_id)} disabled={!newNote.trim()}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end", opacity: newNote.trim() ? 1 : 0.4 }}>Envoyer</button>
              </div>
            </>;
          })()}

          {type === "supplier" && <>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{data.nom}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}><Badge>{data.statut}</Badge></div>
            <Row label="Pays" value={data.pays} /><Row label="Délai moyen" value={`${data.delai_moyen} jours`} />
            <Row label="Conformité" value={`${data.taux_conformite}%`} color={data.taux_conformite > 90 ? COLORS.accent : COLORS.warning} />
            <Row label="Taux retard" value={`${data.taux_retard}%`} color={data.taux_retard > 10 ? COLORS.danger : COLORS.text} /><Row label="Email" value={data.email} />
          </>}
        </div>
      </div>
    </div>
  );
};

export default SlideOver;
