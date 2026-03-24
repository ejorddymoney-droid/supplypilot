import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { ITEMS } from '../../data/generators';
import { FAMILLES } from '../../data/constants';
import { fmt, fmtM } from '../../utils/formatters';
import { Card, Badge, ExportButton, CustomTooltip } from '../common';
import { TableContainer, Th, Td } from '../common/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart } from 'recharts';

const KPIExpandOverlay = ({ kpiId, onClose }) => {
  const COLORS = useTheme();
  const { pos } = useData();
  if (!kpiId) return null;

  const Wrap = ({ title, children }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 1003, background: COLORS.bg, overflowY: "auto", animation: "kpiExpand 0.25s ease" }}
      role="dialog" aria-label={title} aria-modal="true">
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{title}</div>
        <button onClick={onClose} style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <span>Fermer</span><kbd style={{ padding: "1px 6px", borderRadius: 4, background: COLORS.bg, fontSize: 10, border: `1px solid ${COLORS.border}` }}>ESC</kbd>
        </button>
      </div>
      <div style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>{children}</div>
    </div>
  );

  const MiniKpi = ({ label, value, color }) => (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: "16px 20px", border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || COLORS.text }}>{value}</div>
    </div>
  );

  if (kpiId === "abc") {
    const sorted = [...ITEMS].sort((a, b) => (b.demande * b.cout_unitaire) - (a.demande * a.cout_unitaire));
    const totalVal = sorted.reduce((s, i) => s + i.demande * i.cout_unitaire, 0);
    let cumul = 0;
    const paretoData = sorted.slice(0, 50).map((item, idx) => {
      cumul += item.demande * item.cout_unitaire;
      return { rang: idx + 1, article: item.article, sku: item.sku, valeur: item.demande * item.cout_unitaire, pctCumule: +(cumul / totalVal * 100).toFixed(1), abc: item.abc, famille: item.famille };
    });
    const valA = sorted.filter(i => i.abc === "A").reduce((s, i) => s + i.demande * i.cout_unitaire, 0);
    const valB = sorted.filter(i => i.abc === "B").reduce((s, i) => s + i.demande * i.cout_unitaire, 0);

    return <Wrap title="Distribution ABC — Analyse Pareto détaillée">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <MiniKpi label="Valeur totale" value={fmtM(totalVal)} />
        <MiniKpi label="% valeur classe A" value={`${(valA / totalVal * 100).toFixed(1)}%`} color="#f43f5e" />
        <MiniKpi label="% valeur classe B" value={`${(valB / totalVal * 100).toFixed(1)}%`} color="#f59e0b" />
        <MiniKpi label="Articles A / B / C" value={`${ITEMS.filter(i => i.abc === "A").length} / ${ITEMS.filter(i => i.abc === "B").length} / ${ITEMS.filter(i => i.abc === "C").length}`} />
      </div>
      <Card title="Courbe Pareto — Top 50 articles" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="rang" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={{ stroke: COLORS.border }} />
            <YAxis yAxisId="left" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickFormatter={v => fmtM(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="valeur" name="Valeur annuelle" radius={[3, 3, 0, 0]} barSize={14}>
              {paretoData.map((d, i) => <Cell key={i} fill={d.abc === "A" ? "#f43f5e" : d.abc === "B" ? "#f59e0b" : "#6366f1"} />)}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="pctCumule" name="% cumulé" stroke={COLORS.accent} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Top 20 articles par valeur">
        <TableContainer>
          <thead><tr><Th>Rang</Th><Th>SKU</Th><Th>Article</Th><Th>Valeur ann.</Th><Th>% cumulé</Th><Th>ABC</Th><Th>Famille</Th></tr></thead>
          <tbody>
            {paretoData.slice(0, 20).map(r => (
              <tr key={r.rang} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Td style={{ fontWeight: 700, color: COLORS.textDim }}>#{r.rang}</Td>
                <Td style={{ color: COLORS.accent, fontSize: 12 }}>{r.sku}</Td>
                <Td style={{ fontWeight: 500 }}>{r.article}</Td>
                <Td>{fmtM(r.valeur)}</Td>
                <Td style={{ color: COLORS.accent }}>{r.pctCumule}%</Td>
                <Td><Badge>{r.abc}</Badge></Td>
                <Td style={{ color: COLORS.textMuted }}>{r.famille}</Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </Wrap>;
  }

  if (kpiId === "couverture") {
    const danger = [...ITEMS].filter(i => i.couverture < 10).sort((a, b) => a.couverture - b.couverture);
    const covFine = [
      { range: "0-5j", count: ITEMS.filter(i => i.couverture < 5).length, color: "#dc2626" },
      { range: "5-10j", count: ITEMS.filter(i => i.couverture >= 5 && i.couverture < 10).length, color: "#ef4444" },
      { range: "10-15j", count: ITEMS.filter(i => i.couverture >= 10 && i.couverture < 15).length, color: "#f97316" },
      { range: "15-20j", count: ITEMS.filter(i => i.couverture >= 15 && i.couverture < 20).length, color: "#eab308" },
      { range: "20-30j", count: ITEMS.filter(i => i.couverture >= 20 && i.couverture < 30).length, color: "#84cc16" },
      { range: "30-45j", count: ITEMS.filter(i => i.couverture >= 30 && i.couverture < 45).length, color: "#22c55e" },
      { range: "45-60j", count: ITEMS.filter(i => i.couverture >= 45 && i.couverture < 60).length, color: "#06b6d4" },
      { range: "60j+", count: ITEMS.filter(i => i.couverture >= 60).length, color: "#3b82f6" },
    ];
    return <Wrap title="Couverture stock — Analyse détaillée">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <MiniKpi label="Couverture moyenne" value={`${(ITEMS.reduce((s, i) => s + i.couverture, 0) / ITEMS.length).toFixed(1)}j`} color={COLORS.info} />
        <MiniKpi label="Articles < 10 jours" value={danger.length} color={COLORS.danger} />
        <MiniKpi label="Articles > 30 jours" value={ITEMS.filter(i => i.couverture >= 30).length} color={COLORS.accent} />
        <MiniKpi label="Risque global" value={danger.length > 50 ? "Élevé" : danger.length > 20 ? "Modéré" : "Faible"} color={danger.length > 50 ? COLORS.danger : danger.length > 20 ? COLORS.warning : COLORS.accent} />
      </div>
      <Card title="Distribution fine de la couverture" style={{ marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={covFine}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="range" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} />
            <YAxis tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Articles" radius={[6, 6, 0, 0]} barSize={45}>
              {covFine.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title={`Articles en danger — couverture < 10 jours (${danger.length})`}>
        <TableContainer>
          <thead><tr><Th>SKU</Th><Th>Article</Th><Th>ABC</Th><Th>Famille</Th><Th>Couverture</Th><Th>Stock</Th><Th>Statut</Th></tr></thead>
          <tbody>
            {danger.slice(0, 20).map(it => (
              <tr key={it.id} onMouseEnter={e => e.currentTarget.style.background = COLORS.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Td style={{ color: COLORS.accent, fontWeight: 600, fontSize: 12 }}>{it.sku}</Td>
                <Td style={{ fontWeight: 500 }}>{it.article}</Td>
                <Td><Badge>{it.abc}</Badge></Td>
                <Td style={{ color: COLORS.textMuted }}>{it.famille}</Td>
                <Td style={{ fontWeight: 700, color: COLORS.danger }}>{it.couverture.toFixed(1)}j</Td>
                <Td>{fmt(it.stock_net)}</Td>
                <Td><Badge>{it.statut_service}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </Wrap>;
  }

  if (kpiId === "familles") {
    return <Wrap title="Valeur annuelle par famille — Détail">
      <Card title="Répartition par famille">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={FAMILLES} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickFormatter={v => fmtM(v)} />
            <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} width={95} />
            <Tooltip content={<CustomTooltip />} formatter={v => fmtM(v)} />
            <Bar dataKey="valeur" name="Valeur" fill={COLORS.accent} radius={[0, 6, 6, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Wrap>;
  }

  if (kpiId === "po_statut") {
    const poStatutData = [
      { name: "Brouillon", value: pos.filter(p => p.statut === "BROUILLON").length, color: "#6b7280" },
      { name: "À valider", value: pos.filter(p => p.statut === "A_VALIDER").length, color: "#f59e0b" },
      { name: "Envoyé", value: pos.filter(p => p.statut === "ENVOYE").length, color: "#3b82f6" },
      { name: "Reçu", value: pos.filter(p => p.statut === "RECU").length, color: "#10b981" },
      { name: "Clos", value: pos.filter(p => p.statut === "CLOS").length, color: "#8b5cf6" },
    ];
    return <Wrap title="Statut des Purchase Orders — Détail">
      <Card title="Distribution des statuts">
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <ResponsiveContainer width="40%" height={300}>
            <PieChart>
              <Pie data={poStatutData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                {poStatutData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {poStatutData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: COLORS.textMuted, flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Wrap>;
  }

  return null;
};

export default KPIExpandOverlay;
