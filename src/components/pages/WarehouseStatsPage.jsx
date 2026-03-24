import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { KpiCard, Card } from '../common';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WarehouseStatsPage = () => {
  const COLORS = useTheme();
  const { dailyTasks, activityLog, counts } = useData();
  const auth = useAuth();

  const myTasks = dailyTasks.filter(t => t.assignee === auth.user.nom);
  const done = myTasks.filter(t => t.done).length;
  const pending = myTasks.length - done;
  const myCounts = counts.filter(c => c.compteur === auth.user.nom);
  const myActivity = activityLog.filter(a => a.user === auth.user.nom);

  const pieData = [
    { name: "Complétées", value: done, color: COLORS.accent },
    { name: "En attente", value: pending, color: COLORS.warning },
  ];

  const StatBlock = ({ label, value, color, sub }) => (
    <div style={{ background: COLORS.card, borderRadius: 12, padding: "16px 20px", border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || COLORS.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Tâches complétées" value={done} sub={`sur ${myTasks.length}`} color={COLORS.accent} />
        <KpiCard label="Taux complétion" value={`${myTasks.length > 0 ? Math.round(done / myTasks.length * 100) : 0}%`} color={done === myTasks.length ? COLORS.accent : COLORS.warning} />
        <KpiCard label="Comptages effectués" value={myCounts.length} color={COLORS.info} />
        <KpiCard label="Actions enregistrées" value={myActivity.length} color={COLORS.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Répartition des tâches">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>{d.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Performance par type">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBlock label="Réceptions" value={myTasks.filter(t => t.action_type === "reception" && t.done).length} sub={`/ ${myTasks.filter(t => t.action_type === "reception").length}`} color={COLORS.accent} />
            <StatBlock label="Picking" value={myTasks.filter(t => t.action_type === "picking" && t.done).length} sub={`/ ${myTasks.filter(t => t.action_type === "picking").length}`} color={COLORS.info} />
            <StatBlock label="Comptages" value={myTasks.filter(t => t.action_type === "comptage" && t.done).length} sub={`/ ${myTasks.filter(t => t.action_type === "comptage").length}`} color={COLORS.warning} />
            <StatBlock label="Autres" value={myTasks.filter(t => !t.action_type && t.done).length} sub={`/ ${myTasks.filter(t => !t.action_type).length}`} color={COLORS.textMuted} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseStatsPage;
