import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { formatDate, TODAY } from '../../utils/formatters';
import { KpiCard, Card, Badge, FilterPills, ExportButton, TableContainer, SortableTh } from '../common';

const TasksPage = () => {
  const COLORS = useTheme();
  const { tasks, pos, setSlideOver } = useData();
  const [filter, setFilter] = useState(null);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("due_at","asc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const base = filter ? tasks.filter(t=>t.status===filter) : tasks;
  const filtered = sortData(base);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
        <KpiCard label="Ouvertes" value={tasks.filter(t=>t.status==="Ouverte").length} color={COLORS.warning}/>
        <KpiCard label="En cours" value={tasks.filter(t=>t.status==="En cours").length} color={COLORS.info}/>
        <KpiCard label="Terminées" value={tasks.filter(t=>t.status==="Terminée").length} color={COLORS.accent}/>
      </div>
      <FilterPills options={["Ouverte","En cours","Terminée"]} selected={filter} onSelect={setFilter}/>
      <Card title="Tâches" headerRight={<ExportButton data={filtered.map(t=>({...t, po_number:pos.find(p=>p.po_id===t.related_po_id)?.po_number||""}))} columns={[{key:"type",label:"Type"},{key:"po_number",label:"PO lié"},{key:"assigned_to",label:"Assigné à"},{key:"status",label:"Statut"},{key:"due_at",label:"Échéance"},{key:"comment",label:"Commentaire"}]} filename="taches"/>}>
        <TableContainer>
          <thead><tr><S col="type">Type</S><S col="related_po_id">PO lié</S><S col="assigned_to">Assigné à</S><S col="status">Statut</S><S col="due_at">Échéance</S><S col="comment">Commentaire</S></tr></thead>
          <tbody>
            {filtered.map(t => {
              const po = pos.find(p=>p.po_id===t.related_po_id);
              const overdue = new Date(t.due_at) < new Date(TODAY) && t.status !== "Terminée";
              return (
                <tr key={t.task_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:t,type:"task"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"10px 12px", fontWeight:500 }}>{t.type}</td>
                  <td style={{ padding:"10px 12px", color:COLORS.accent, fontWeight:600 }}>{po?.po_number||"—"}</td>
                  <td style={{ padding:"10px 12px" }}>{t.assigned_to}</td>
                  <td style={{ padding:"10px 12px" }}><Badge>{t.status}</Badge></td>
                  <td style={{ padding:"10px 12px", color:overdue?COLORS.danger:COLORS.textMuted, fontWeight:overdue?600:400 }}>{formatDate(t.due_at)}{overdue && " ⚠"}</td>
                  <td style={{ padding:"10px 12px", color:COLORS.textDim, maxWidth:250, overflow:"hidden", textOverflow:"ellipsis" }}>{t.comment}{t.comments?.length > 0 && <span style={{ marginLeft:6, fontSize:9, color:COLORS.accent }}>💬 {t.comments.length}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </TableContainer>
      </Card>
    </div>
  );
};

export default TasksPage;
