import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { KpiCard, Card, Badge } from '../common';
import { TODAY } from '../../utils/formatters';

const WarehouseDashboard = () => {
  const COLORS = useTheme();
  const { pos, counts, dailyTasks, setDailyTasks, activityLog } = useData();
  const auth = useAuth();

  const myTasks = dailyTasks.filter(t => t.assignee === auth.user.nom);
  const toggleTask = (id) => setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const myPOs = pos.filter(p => p.statut === "ENVOYE");
  const myCountsToday = counts.filter(c => c.compteur === auth.user.nom && c.date >= TODAY).length;
  const tasksCompleted = myTasks.filter(t => t.done).length;
  const priorityColors = { Haute: COLORS.danger, Moyenne: COLORS.warning, Basse: COLORS.info };
  const myActivity = activityLog.filter(a => a.user === auth.user.nom).slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.info}10)`, borderRadius: 16, padding: "24px 28px", border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Bonjour, {auth.user.nom.split(' ')[0]}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>Voici vos tâches pour aujourd'hui — {tasksCompleted}/{myTasks.length} complétées</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Mes tâches" value={`${tasksCompleted}/${myTasks.length}`} color={COLORS.accent} />
        <KpiCard label="PO à traiter" value={myPOs.length} color={COLORS.warning} />
        <KpiCard label="Comptages aujourd'hui" value={myCountsToday} color={COLORS.info} />
        <KpiCard label="Progression" value={`${myTasks.length > 0 ? Math.round(tasksCompleted / myTasks.length * 100) : 0}%`} color={tasksCompleted === myTasks.length ? COLORS.accent : COLORS.warning} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card title="Mes tâches du jour">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myTasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: t.done ? `${COLORS.accent}08` : COLORS.surface, border: `1px solid ${t.done ? COLORS.accentDim : COLORS.border}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.done ? COLORS.accent : COLORS.border}`, background: t.done ? COLORS.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.done ? COLORS.textDim : COLORS.text, textDecoration: t.done ? "line-through" : "none" }}>{t.task}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, color: priorityColors[t.priority], background: `${priorityColors[t.priority]}15`, border: `1px solid ${priorityColors[t.priority]}30` }}>{t.priority}</span>
              </div>
            ))}
            {myTasks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: COLORS.textDim, fontSize: 13 }}>Aucune tâche assignée</div>}
          </div>
        </Card>

        <Card title="Mon activité récente">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myActivity.map(a => (
              <div key={a.id} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.text }}>{a.action}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>{a.details} · {a.time}</div>
              </div>
            ))}
            {myActivity.length === 0 && <div style={{ padding: 16, textAlign: "center", color: COLORS.textDim, fontSize: 12 }}>Aucune activité récente</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
