import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { KpiCard, Card, Badge, FilterPills, ExportButton, TableContainer, SortableTh } from '../common';

const AuditPage = () => {
  const COLORS = useTheme();
  const { events, statusHistory, setSlideOver } = useData();
  const [levelFilter, setLevelFilter] = useState(null);
  const evSort = useSortable("date","desc");
  const SE = ({ col, children }) => <SortableTh col={col} sortCol={evSort.sortCol} sortDir={evSort.sortDir} onSort={evSort.handleSort}>{children}</SortableTh>;
  const hSort = useSortable("changed_at","desc");
  const SH = ({ col, children }) => <SortableTh col={col} sortCol={hSort.sortCol} sortDir={hSort.sortDir} onSort={hSort.handleSort}>{children}</SortableTh>;
  const base = levelFilter ? events.filter(e=>e.level===levelFilter) : events;
  const filtered = evSort.sortData(base);
  const sortedHistory = hSort.sortData([...statusHistory].reverse());
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <KpiCard label="Total événements" value={events.length} color={COLORS.info}/>
        <KpiCard label="Warnings" value={events.filter(e=>e.level==="WARNING").length} color={COLORS.warning}/>
        <KpiCard label="Erreurs" value={events.filter(e=>e.level==="ERROR").length} color={COLORS.danger}/>
        <KpiCard label="Critiques" value={events.filter(e=>e.level==="CRITICAL").length} color="#ff4444"/>
      </div>
      <FilterPills options={["INFO","WARNING","ERROR","CRITICAL"]} selected={levelFilter} onSelect={setLevelFilter}/>
      <Card title="Journal d'audit" headerRight={<ExportButton data={filtered} columns={[{key:"date",label:"Date"},{key:"level",label:"Niveau"},{key:"type_event",label:"Type"},{key:"utilisateur",label:"Utilisateur"},{key:"entite",label:"Entité"},{key:"entite_id",label:"ID"},{key:"details",label:"Détails"}]} filename="audit_log"/>}>
        <TableContainer>
          <thead><tr><SE col="date">Date</SE><SE col="level">Niveau</SE><SE col="type_event">Type</SE><SE col="utilisateur">Utilisateur</SE><SE col="entite">Entité</SE><SE col="entite_id">ID</SE><SE col="details">Détails</SE></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.event_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:e,type:"event"})} onMouseEnter={ev=>ev.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textMuted, whiteSpace:"nowrap" }}>{e.date}</td>
                <td style={{ padding:"10px 12px" }}><Badge>{e.level}</Badge></td>
                <td style={{ padding:"10px 12px", fontSize:12, fontWeight:500 }}>{e.type_event}</td>
                <td style={{ padding:"10px 12px" }}>{e.utilisateur}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textDim }}>{e.entite}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textDim }}>#{e.entite_id}</td>
                <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textMuted, maxWidth:350, overflow:"hidden", textOverflow:"ellipsis" }}>{e.details}{e.notes?.length > 0 && <span style={{ marginLeft:6, fontSize:9, color:COLORS.accent }}>📝 {e.notes.length}</span>}</td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card title={`Historique transitions PO — ${statusHistory.length}`} headerRight={<ExportButton data={sortedHistory} columns={[{key:"po_id",label:"PO ID"},{key:"old_status",label:"Ancien statut"},{key:"new_status",label:"Nouveau statut"},{key:"changed_by",label:"Par"},{key:"changed_at",label:"Date"},{key:"comment",label:"Commentaire"}]} filename="historique_transitions"/>}>
          <TableContainer>
            <thead><tr><SH col="po_id">PO ID</SH><SH col="old_status">Ancien statut</SH><SH col="new_status">Nouveau statut</SH><SH col="changed_by">Par</SH><SH col="changed_at">Date</SH><SH col="comment">Commentaire</SH></tr></thead>
            <tbody>
              {sortedHistory.map(h => (
                <tr key={h.id} onMouseEnter={ev=>ev.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"10px 12px", fontWeight:600, color:COLORS.accent }}>PO-{String(h.po_id).padStart(4,'0')}</td>
                  <td style={{ padding:"10px 12px" }}>{h.old_status ? <Badge>{h.old_status}</Badge> : <span style={{ color:COLORS.textDim }}>—</span>}</td>
                  <td style={{ padding:"10px 12px" }}><Badge>{h.new_status}</Badge></td>
                  <td style={{ padding:"10px 12px" }}>{h.changed_by}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textMuted }}>{h.changed_at}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textMuted }}>{h.comment}</td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}
    </div>
  );
};

export default AuditPage;
