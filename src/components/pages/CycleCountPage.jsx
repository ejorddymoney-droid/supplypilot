import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { ITEMS } from '../../data/generators';
import { CYCLE_FREQ, ECART_SEUILS, CAUSE_OPTIONS, ZONE_OPTIONS, ACTION_OPTIONS, CRITICAL_CAUSES, MONTHLY_PRECISION } from '../../data/constants';
import { KpiCard, Card, Badge, ExportButton, CustomTooltip } from '../common';
import { TableContainer, Th, Td, SortableTh } from '../common/Table';
import { fmt, TODAY } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const CycleCountPage = () => {
  const COLORS = useTheme();
  const { counts, setCounts, addEvent, setTasks, tasks, showToast } = useData();
  const [activeTab, setActiveTab] = useState("plan");
  const [countForm, setCountForm] = useState({ sku: "", stockCompte: "", cause: null, zone: null, actions: [], comment: "" });
  const [showQuestionnaire, setShowQuestionnaire] = useState(null);
  const countSort = useSortable("date", "desc");

  const currentMonth = 3;
  const itemsToCount = useMemo(() => {
    return ITEMS.filter(item => {
      const freq = CYCLE_FREQ[item.abc] || 6;
      return currentMonth % freq === 0 || freq === 1;
    }).map(item => {
      const lastCount = [...counts].reverse().find(c => c.sku === item.sku);
      return { ...item, lastCount: lastCount?.date || "Jamais", alreadyCounted: lastCount && lastCount.date >= "2026-03-01" };
    }).sort((a, b) => {
      if (a.alreadyCounted !== b.alreadyCounted) return a.alreadyCounted ? 1 : -1;
      return (a.couverture || 999) - (b.couverture || 999);
    });
  }, [counts]);

  const counted = itemsToCount.filter(i => i.alreadyCounted).length;
  const remaining = itemsToCount.length - counted;
  const precision = counts.filter(c => c.date >= "2026-03-01").length > 0
    ? counts.filter(c => c.date >= "2026-03-01").filter(c => {
      const item = ITEMS.find(i => i.sku === c.sku);
      return Math.abs(c.ecart_pct) <= ECART_SEUILS[item?.abc || "C"];
    }).length / counts.filter(c => c.date >= "2026-03-01").length * 100
    : 100;

  const handleSubmitCount = () => {
    if (!countForm.sku || !countForm.stockCompte) return;
    const item = ITEMS.find(i => i.sku === countForm.sku);
    if (!item) { showToast("SKU introuvable", "error"); return; }
    const stockSys = item.stock_net;
    const stockCompte = parseInt(countForm.stockCompte);
    const ecart = stockCompte - stockSys;
    const ecartPct = stockSys > 0 ? +(ecart / stockSys * 100).toFixed(1) : 0;
    const seuil = ECART_SEUILS[item.abc] || 15;

    if (Math.abs(ecartPct) > seuil) {
      setShowQuestionnaire({ sku: countForm.sku, stockSys, stockCompte, ecart, ecartPct, item, seuil });
      return;
    }
    finishCount(countForm.sku, stockSys, stockCompte, ecart, ecartPct, "Validé", null, countForm.zone || "Entrepôt principal", [], "");
  };

  const finishCount = (sku, stockSys, stockCompte, ecart, ecartPct, statut, cause, zone, actions, comment) => {
    const newCount = {
      id: counts.length + 1, sku, date: TODAY, stock_systeme: stockSys, stock_compte: stockCompte,
      ecart, ecart_pct: ecartPct, statut, compteur: "Admin", cause, zone, actions, comment,
    };
    setCounts(prev => [...prev, newCount]);
    const level = Math.abs(ecartPct) > 10 ? "WARNING" : "INFO";
    addEvent("CYCLE_COUNT", "Item", ITEMS.find(i => i.sku === sku)?.id || 0,
      `Comptage ${sku} —  Sys: ${stockSys}, Compté: ${stockCompte}, Écart: ${ecartPct}% â ${statut}`, level);

    if (statut === "Investigation" && CRITICAL_CAUSES.includes(cause)) {
      setTasks(prev => [{ task_id: prev.length + 1, type: "Investigation comptage", related_po_id: null,
        assigned_to: "Sophie Gagnon", status: "Ouverte", due_at: TODAY,
        comment: `Écart ${ecartPct}% sur ${sku} —  Cause: ${cause}` }, ...prev]);
    }
    showToast(`Comptage ${sku} enregistré â ${statut}`);
    setCountForm({ sku: "", stockCompte: "", cause: null, zone: null, actions: [], comment: "" });
    setShowQuestionnaire(null);
  };

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)}
      style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${activeTab === id ? COLORS.accent : COLORS.border}`,
        background: activeTab === id ? COLORS.accentGlow : "transparent", color: activeTab === id ? COLORS.accent : COLORS.textMuted,
        fontSize: 12, fontWeight: activeTab === id ? 600 : 400, cursor: "pointer" }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Articles à compter" value={remaining} sub={`${counted} complétés`} color={remaining > 0 ? COLORS.warning : COLORS.accent} />
        <KpiCard label="Précision ce mois" value={`${precision.toFixed(1)}%`} color={precision >= 95 ? COLORS.accent : precision >= 85 ? COLORS.warning : COLORS.danger} />
        <KpiCard label="En investigation" value={counts.filter(c => c.statut === "Investigation").length} color={COLORS.danger} />
        <KpiCard label="Comptages totaux" value={counts.length} color={COLORS.info} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Tab id="plan" label="Plan de comptage" />
        <Tab id="saisie" label="Saisir un comptage" />
        <Tab id="historique" label="Historique" />
        <Tab id="analyse" label="Analyse" />
      </div>

      {activeTab === "plan" && (
        <Card title={`Plan de comptage â Mars 2026 (${remaining} restants)`}>
          <TableContainer>
            <thead><tr><Th>SKU</Th><Th>Article</Th><Th>ABC</Th><Th>Fréq.</Th><Th>Stock</Th><Th>Dernier comptage</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {itemsToCount.slice(0, 30).map(it => (
                <tr key={it.id} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Td style={{ color: COLORS.accent, fontWeight: 600, fontSize: 12 }}>{it.sku}</Td>
                  <Td style={{ fontWeight: 500 }}>{it.article}</Td>
                  <Td><Badge>{it.abc}</Badge></Td>
                  <Td style={{ color: COLORS.textMuted }}>{CYCLE_FREQ[it.abc]}x/an</Td>
                  <Td>{fmt(it.stock_net)}</Td>
                  <Td style={{ color: COLORS.textDim, fontSize: 12 }}>{it.lastCount}</Td>
                  <Td>{it.alreadyCounted ? <span style={{ color: COLORS.accent, fontWeight: 600 }}>{"✓"} Compté</span> : <span style={{ color: COLORS.warning }}>En attente</span>}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {activeTab === "saisie" && (
        <Card title="Saisir un comptage">
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="count-sku" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>SKU de l'article *</label>
              <input id="count-sku" value={countForm.sku} onChange={e => setCountForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
                placeholder="Ex: SKU-0003" list="sku-list"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              <datalist id="sku-list">{itemsToCount.filter(i => !i.alreadyCounted).slice(0, 20).map(i => <option key={i.sku} value={i.sku}>{i.article}</option>)}</datalist>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="count-qty" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Stock compté *</label>
              <input id="count-qty" type="number" value={countForm.stockCompte} onChange={e => setCountForm(f => ({ ...f, stockCompte: e.target.value }))}
                placeholder="Quantité physique comptée"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="count-zone" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Zone</label>
              <select id="count-zone" value={countForm.zone || ""} onChange={e => setCountForm(f => ({ ...f, zone: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                <option value="">Sélectionner...</option>
                {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <button onClick={handleSubmitCount} disabled={!countForm.sku || !countForm.stockCompte}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, #059669)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: countForm.sku && countForm.stockCompte ? 1 : 0.5 }}>
              Enregistrer le comptage
            </button>
          </div>
        </Card>
      )}

      {activeTab === "historique" && (
        <Card title={`Historique des comptages â ${counts.length}`} headerRight={<ExportButton data={counts} columns={[{ key: "sku", label: "SKU" }, { key: "date", label: "Date" }, { key: "stock_systeme", label: "Stock sys." }, { key: "stock_compte", label: "Stock compté" }, { key: "ecart", label: "Écart" }, { key: "ecart_pct", label: "Écart %" }, { key: "statut", label: "Statut" }, { key: "compteur", label: "Compteur" }]} filename="historique_comptages" />}>
          <TableContainer>
            <thead><tr><Th>SKU</Th><Th>Date</Th><Th>Stock sys.</Th><Th>Stock compté</Th><Th>Écart</Th><Th>Écart %</Th><Th>Statut</Th><Th>Compteur</Th><Th>Zone</Th></tr></thead>
            <tbody>
              {[...counts].reverse().map(c => {
                const item = ITEMS.find(i => i.sku === c.sku);
                const seuil = ECART_SEUILS[item?.abc || "C"];
                const overSeuil = Math.abs(c.ecart_pct) > seuil;
                return (
                  <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Td style={{ color: COLORS.accent, fontWeight: 600, fontSize: 12 }}>{c.sku}</Td>
                    <Td style={{ color: COLORS.textMuted, fontSize: 12 }}>{c.date}</Td>
                    <Td>{fmt(c.stock_systeme)}</Td>
                    <Td style={{ fontWeight: 600 }}>{fmt(c.stock_compte)}</Td>
                    <Td style={{ color: c.ecart < 0 ? COLORS.danger : c.ecart > 0 ? COLORS.warning : COLORS.textDim, fontWeight: 600 }}>{c.ecart > 0 ? "+" : ""}{c.ecart}</Td>
                    <Td style={{ fontWeight: 700, color: overSeuil ? COLORS.danger : COLORS.accent }}>{c.ecart_pct > 0 ? "+" : ""}{c.ecart_pct}%</Td>
                    <Td><Badge>{c.statut}</Badge></Td>
                    <Td style={{ color: COLORS.textMuted }}>{c.compteur}</Td>
                    <Td style={{ color: COLORS.textDim, fontSize: 11 }}>{c.zone}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {activeTab === "analyse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Précision mensuelle">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={MONTHLY_PRECISION}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mois" tick={{ fill: COLORS.textMuted, fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
                <YAxis domain={[80, 100]} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="precision" name="Précision %" stroke={COLORS.accent} strokeWidth={2.5} dot={{ fill: COLORS.accent, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Seuils de tolérance par classe">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {["A", "B", "C"].map(c => (
                <div key={c} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                  <Badge>{c}</Badge>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, margin: "12px 0" }}>{"±"}{ECART_SEUILS[c]}%</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>Fréquence : {CYCLE_FREQ[c] === 1 ? "Mensuel" : `${CYCLE_FREQ[c]} mois`}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {showQuestionnaire && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1005 }} role="dialog" aria-label="Investigation écart" aria-modal="true">
          <div style={{ width: 520, maxHeight: "80vh", overflowY: "auto", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.danger, marginBottom: 8 }}>Écart significatif détecté</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>
              {showQuestionnaire.sku} â Écart : <strong style={{ color: COLORS.danger }}>{showQuestionnaire.ecartPct}%</strong> (seuil : {"±"}{showQuestionnaire.seuil}%)
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Cause probable *</label>
              {CAUSE_OPTIONS.map(c => (
                <button key={c} onClick={() => setCountForm(f => ({ ...f, cause: c }))}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: 4, borderRadius: 8,
                    border: `1px solid ${countForm.cause === c ? COLORS.accent : COLORS.border}`,
                    background: countForm.cause === c ? COLORS.accentGlow : "transparent",
                    color: countForm.cause === c ? COLORS.accent : COLORS.textMuted,
                    fontSize: 12, cursor: "pointer" }}>{c}</button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Actions recommandées</label>
              {ACTION_OPTIONS.map(a => (
                <button key={a} onClick={() => setCountForm(f => ({ ...f, actions: f.actions.includes(a) ? f.actions.filter(x => x !== a) : [...f.actions, a] }))}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: 4, borderRadius: 8,
                    border: `1px solid ${countForm.actions.includes(a) ? COLORS.info : COLORS.border}`,
                    background: countForm.actions.includes(a) ? COLORS.infoDim : "transparent",
                    color: countForm.actions.includes(a) ? COLORS.info : COLORS.textMuted,
                    fontSize: 12, cursor: "pointer" }}>{countForm.actions.includes(a) ? "✓ " : ""}{a}</button>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Commentaire</label>
              <textarea value={countForm.comment} onChange={e => setCountForm(f => ({ ...f, comment: e.target.value }))} rows={2}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowQuestionnaire(null)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13 }}>Annuler</button>
              <button onClick={() => finishCount(showQuestionnaire.sku, showQuestionnaire.stockSys, showQuestionnaire.stockCompte, showQuestionnaire.ecart, showQuestionnaire.ecartPct, "Investigation", countForm.cause, countForm.zone || "Entrepôt principal", countForm.actions, countForm.comment)}
                disabled={!countForm.cause}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.danger}, #dc2626)`, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: countForm.cause ? 1 : 0.5 }}>
                Ouvrir une investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleCountPage;
