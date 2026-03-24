import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { ITEMS } from '../../data/generators';
import { SUPPLIERS, KPIS, ABC_DATA, COVERAGE_DIST, FAMILLES, ECART_SEUILS } from '../../data/constants';
import { KpiCard, Card, Badge, CustomTooltip } from '../common';
import { TableContainer, Td, SortableTh } from '../common/Table';
import { fmt, fmtM } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart } from 'recharts';

const DashboardPage = () => {
  const COLORS = useTheme();
  const { pos, tasks, setActivePage, setExpandedKPI, counts } = useData();
  const critSort = useSortable("couverture", "asc");
  const poSort = useSortable("date_creation", "desc");

  const poStatutData = [
    { name: "Brouillon", value: pos.filter(p => p.statut === "BROUILLON").length, color: "#6b7280" },
    { name: "À valider", value: pos.filter(p => p.statut === "A_VALIDER").length, color: "#f59e0b" },
    { name: "Envoyé", value: pos.filter(p => p.statut === "ENVOYE").length, color: "#3b82f6" },
    { name: "Reçu", value: pos.filter(p => p.statut === "RECU").length, color: "#10b981" },
    { name: "Clos", value: pos.filter(p => p.statut === "CLOS").length, color: "#8b5cf6" },
  ];

  const criticalItems = ITEMS.filter(i => i.priorite === "Haute").slice(0, 6);
  const pendingPOs = pos.filter(p => p.statut === "A_VALIDER" || p.statut === "BROUILLON").slice(0, 5);
  const openTasks = tasks.filter(t => t.status === "Ouverte").length;
  const poToProcess = pos.filter(p => p.statut === "BROUILLON" || p.statut === "A_VALIDER").length;

  const precisionValue = useMemo(() => {
    const mc = counts.filter(c => c.date >= "2026-03-01");
    return mc.length > 0 ? mc.filter(c => Math.abs(c.ecart_pct) <= ECART_SEUILS[ITEMS.find(i => i.sku === c.sku)?.abc || "C"]).length / mc.length * 100 : 100;
  }, [counts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Row — staggered entrance */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          <KpiCard key="k1" label="Articles actifs" value={KPIS.total_items} sub={`${KPIS.nb_a}A / ${KPIS.nb_b}B / ${KPIS.nb_c}C`} color={COLORS.accent} onClick={() => setActivePage("inventory")} />,
          <KpiCard key="k2" label="Taux de service" value={`${KPIS.taux_service}%`} sub={`${KPIS.articles_sous_seuil} sous seuil`} color={KPIS.taux_service > 85 ? COLORS.accent : COLORS.warning} trend={-2.3} onClick={() => setActivePage("critical")} />,
          <KpiCard key="k3" label="Articles critiques" value={KPIS.critiques} sub="Priorité haute A/B" color={COLORS.danger} onClick={() => setActivePage("critical")} />,
          <KpiCard key="k4" label="Couverture moy." value={`${KPIS.couverture_moyenne}j`} sub="Objectif > 30 jours" color={COLORS.info} onClick={() => setActivePage("inventory")} />,
          <KpiCard key="k5" label="PO à traiter" value={poToProcess} sub={`${openTasks} tâches ouvertes`} color={COLORS.warning} onClick={() => setActivePage("orders")} />,
          <KpiCard key="k6" label="Alertes actives" value={KPIS.alertes_total} sub={`${KPIS.violations_regles} violations règles`} color={COLORS.danger} onClick={() => setActivePage("audit")} />,
          <KpiCard key="k7" label="Précision inventaire" value={`${precisionValue.toFixed(1)}%`} sub={`${counts.filter(c => c.date >= "2026-03-01").length} comptages ce mois`} color={precisionValue >= 95 ? COLORS.accent : precisionValue >= 85 ? COLORS.warning : COLORS.danger} onClick={() => setActivePage("cyclecount")} />,
        ].map((card, i) => (
          <div key={i} style={{ animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${i * 60}ms` }}>{card}</div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Distribution ABC — Pareto" headerRight={<span style={{ fontSize: 11, color: COLORS.textDim }}>400 articles</span>} onTitleClick={() => setExpandedKPI("abc")}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={ABC_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="classe" tick={{ fill: COLORS.textMuted, fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
              <YAxis yAxisId="left" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="count" name="Articles" radius={[6, 6, 0, 0]} barSize={50}>
                {ABC_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Line yAxisId="right" dataKey="pctValeur" name="% valeur" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Couverture stock (jours)" headerRight={<span style={{ fontSize: 11, color: COLORS.textDim }}>Distribution</span>} onTitleClick={() => setExpandedKPI("couverture")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={COVERAGE_DIST}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="range" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Articles" radius={[6, 6, 0, 0]} barSize={40}>
                {COVERAGE_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Valeur annuelle par famille" onTitleClick={() => setExpandedKPI("familles")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FAMILLES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={false} tickFormatter={v => fmtM(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} width={95} />
              <Tooltip content={<CustomTooltip />} formatter={v => fmtM(v)} />
              <Bar dataKey="valeur" name="Valeur" fill={COLORS.accent} radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Statut des Purchase Orders" onTitleClick={() => setExpandedKPI("po_statut")}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={poStatutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {poStatutData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              {poStatutData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: COLORS.textMuted, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Articles critiques" headerRight={<span onClick={() => setActivePage("critical")} style={{ fontSize: 11, color: COLORS.danger, cursor: "pointer" }}>Voir tout →</span>}>
          <TableContainer>
            <thead><tr>
              <SortableTh col="article" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Article</SortableTh>
              <SortableTh col="abc" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>ABC</SortableTh>
              <SortableTh col="stock_net" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Stock</SortableTh>
              <SortableTh col="couverture" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Couv.</SortableTh>
              <SortableTh col="statut_service" sortCol={critSort.sortCol} sortDir={critSort.sortDir} onSort={critSort.handleSort}>Statut</SortableTh>
            </tr></thead>
            <tbody>
              {critSort.sortData(criticalItems).map(it => (
                <tr key={it.id}>
                  <Td><span style={{ fontWeight: 500 }}>{it.article}</span><br /><span style={{ fontSize: 11, color: COLORS.textDim }}>{it.sku}</span></Td>
                  <Td><Badge>{it.abc}</Badge></Td>
                  <Td>{fmt(it.stock_net)}</Td>
                  <Td style={{ color: it.couverture < 15 ? COLORS.danger : COLORS.warning }}>{it.couverture.toFixed(0)}j</Td>
                  <Td><Badge>{it.statut_service}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="PO en attente" headerRight={<span onClick={() => setActivePage("orders")} style={{ fontSize: 11, color: COLORS.warning, cursor: "pointer" }}>Voir tout →</span>}>
          <TableContainer>
            <thead><tr>
              <SortableTh col="po_number" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>PO</SortableTh>
              <SortableTh col="article" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Article</SortableTh>
              <SortableTh col="qty" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Qty</SortableTh>
              <SortableTh col="statut" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Statut</SortableTh>
              <SortableTh col="created_by" sortCol={poSort.sortCol} sortDir={poSort.sortDir} onSort={poSort.handleSort}>Créé par</SortableTh>
            </tr></thead>
            <tbody>
              {poSort.sortData(pendingPOs).map(po => (
                <tr key={po.po_id}>
                  <Td style={{ fontWeight: 600, color: COLORS.accent }}>{po.po_number}</Td>
                  <Td>{po.article}</Td>
                  <Td>{po.qty}</Td>
                  <Td><Badge>{po.statut}</Badge></Td>
                  <Td style={{ color: COLORS.textMuted }}>{po.created_by}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      </div>

      {/* Supplier summary */}
      <Card title="Performance fournisseurs">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {SUPPLIERS.map(s => (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s, box-shadow 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{s.nom.split(' ')[0]}</span>
                <Badge>{s.statut}</Badge>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Conformité</div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 6, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${s.taux_conformite}%`, height: "100%", background: s.taux_conformite > 90 ? COLORS.accent : s.taux_conformite > 80 ? COLORS.warning : COLORS.danger, borderRadius: 6, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: COLORS.textMuted }}>{s.taux_conformite}%</span>
                <span style={{ color: COLORS.textMuted }}>{s.delai_moyen}j délai</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
