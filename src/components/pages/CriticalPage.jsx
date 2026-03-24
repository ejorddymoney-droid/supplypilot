import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { fmt } from '../../utils/formatters';
import { ITEMS } from '../../data/generators';
import { SUPPLIER_MAP } from '../../data/constants';
import { KpiCard, Card, Badge, ExportButton, TableContainer, Th, SortableTh } from '../common';

const CriticalPage = () => {
  const COLORS = useTheme();
  const { createPO, setSlideOver } = useData();
  const criticals = useMemo(() => ITEMS.filter(i => i.priorite==="Haute" || i.statut_service==="Sous seuil"), []);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("couverture","asc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const sorted = sortData(criticals).slice(0,30);
  const csvCols = [{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"famille",label:"Famille"},{key:"abc",label:"ABC"},{key:"stock_net",label:"Stock net"},{key:"seuil_min",label:"Seuil min"},{key:"eoq",label:"EOQ"},{key:"rop",label:"ROP"},{key:"couverture",label:"Couverture (j)"},{key:"statut_service",label:"Statut"},{key:r=>SUPPLIER_MAP[r.supplier_id]||"",label:"Fournisseur"}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <KpiCard label="Priorité haute" value={ITEMS.filter(i=>i.priorite==="Haute").length} color={COLORS.danger}/>
        <KpiCard label="Sous seuil" value={ITEMS.filter(i=>i.statut_service==="Sous seuil").length} color={COLORS.warning}/>
        <KpiCard label="Couverture < 15j" value={ITEMS.filter(i=>i.couverture<15).length} color={COLORS.danger}/>
        <KpiCard label="Classe A sous seuil" value={ITEMS.filter(i=>i.abc==="A"&&i.statut_service!=="Conforme").length} color="#f43f5e"/>
      </div>
      <Card title={`Articles critiques — ${criticals.length} articles`} headerRight={<ExportButton data={sorted} columns={csvCols} filename="articles_critiques"/>}>
        <TableContainer>
          <thead>
            <tr><S col="sku">SKU</S><S col="article">Article</S><S col="famille">Famille</S><S col="abc">ABC</S><S col="stock_net">Stock net</S><S col="seuil_min">Seuil min</S><S col="eoq">EOQ</S><S col="rop">ROP</S><S col="couverture">Couv. (j)</S><S col="statut_service">Statut</S><Th>Fournisseur</Th><Th>Action</Th></tr>
          </thead>
          <tbody>
            {sorted.map(it => (
              <tr key={it.id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:it,type:"item"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 12px", fontWeight:600, color:COLORS.accent, fontSize:12 }}>{it.sku}</td>
                <td style={{ padding:"10px 12px", fontWeight:500 }}>{it.article}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textMuted }}>{it.famille}</td>
                <td style={{ padding:"10px 12px" }}><Badge>{it.abc}</Badge></td>
                <td style={{ padding:"10px 12px", fontWeight:600, color:COLORS.danger }}>{fmt(it.stock_net)}</td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.seuil_min)}</td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.eoq)}</td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.rop)}</td>
                <td style={{ padding:"10px 12px", color:it.couverture<15?COLORS.danger:COLORS.warning }}>{it.couverture.toFixed(0)}j</td>
                <td style={{ padding:"10px 12px" }}><Badge>{it.statut_service}</Badge></td>
                <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textMuted }}>{SUPPLIER_MAP[it.supplier_id]?.split(' ')[0]}</td>
                <td style={{ padding:"10px 12px" }}><button onClick={(e)=>{e.stopPropagation();createPO(it);}} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>Créer PO</button></td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
    </div>
  );
};

export default CriticalPage;
