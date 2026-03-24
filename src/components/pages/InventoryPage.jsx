import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSortable } from '../../hooks/useSortable';
import { fmt } from '../../utils/formatters';
import { ITEMS } from '../../data/generators';
import { KpiCard, Card, Badge, SearchInput, FilterPills, ExportButton, TableContainer, Th, SortableTh } from '../common';

const InventoryPage = () => {
  const COLORS = useTheme();
  const { setSlideOver, addEvent, showToast, pos, createPO } = useData();
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [abcFilter, setAbcFilter] = useState(null);
  const [familleFilter, setFamilleFilter] = useState(null);
  const { sortCol, sortDir, handleSort, sortData } = useSortable("valeur_annuelle","desc");
  const [page, setPage] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 20;

  const handleImportItems = (rows) => {
    let added = 0, updated = 0;
    rows.forEach(row => {
      const sku = row.sku || row.SKU;
      if (!sku) return;
      const existing = ITEMS.find(i => i.sku === sku);
      if (existing) {
        if (row.nom) existing.article = row.nom;
        if (row.famille) existing.famille = row.famille;
        if (row.stock_net) existing.stock_net = parseInt(row.stock_net) || existing.stock_net;
        if (row.demande_annuelle) existing.demande = parseInt(row.demande_annuelle) || existing.demande;
        if (row.cout_unitaire) existing.cout_unitaire = parseFloat(row.cout_unitaire) || existing.cout_unitaire;
        if (row.seuil_min) existing.seuil_min = parseInt(row.seuil_min) || existing.seuil_min;
        updated++;
      } else {
        const id = ITEMS.length + 1;
        const dem = parseInt(row.demande_annuelle) || 1000;
        const cout = parseFloat(row.cout_unitaire) || 50;
        const cc = parseFloat(row.cout_commande) || 25;
        const tp = 0.25;
        const sn = parseInt(row.stock_net) || 100;
        const sm = parseInt(row.seuil_min) || 80;
        const ss = parseInt(row.stock_securite) || 50;
        const lt = parseInt(row.lead_time_jours) || 10;
        const h = cout * tp;
        const eoq = h > 0 ? Math.round(Math.sqrt((2 * dem * cc) / h)) : 100;
        const rop = Math.round((dem / 365 * lt) + ss);
        const couv = dem > 0 ? +(sn / (dem / 365)).toFixed(1) : 999;
        ITEMS.push({
          id, sku, article: row.nom || sku, famille: row.famille || "Autre",
          abc: "C", demande: dem, cout_unitaire: cout, cout_commande: cc, taux_possession: tp,
          stock_net: sn, seuil_min: sm, stock_securite: ss, lead_time: lt,
          eoq, rop, couverture: couv, supplier_id: 1,
          valeur_annuelle: dem * cout,
          statut_service: sn <= 0 ? "Rupture" : sn < sm ? "Sous seuil" : "Conforme",
          priorite: "Basse",
        });
        added++;
      }
    });
    addEvent("IMPORT_ITEMS", "Item", 0, `Import CSV: ${added} ajoutés, ${updated} mis à jour (${rows.length} lignes)`, "INFO");
    showToast(`Import terminé — ${added} ajoutés, ${updated} mis à jour`);
    setShowImport(false);
    setRefreshKey(k => k + 1);
  };

  const filtered = useMemo(() => {
    let data = [...ITEMS];
    if (search) data = data.filter(i => i.article.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));
    if (abcFilter) data = data.filter(i => i.abc === abcFilter);
    if (familleFilter) data = data.filter(i => i.famille === familleFilter);
    return sortData(data);
  }, [search, abcFilter, familleFilter, sortCol, sortDir]);

  const paged = filtered.slice(page*pageSize, (page+1)*pageSize);
  const totalPages = Math.ceil(filtered.length/pageSize);
  const csvCols = [{key:"sku",label:"SKU"},{key:"article",label:"Article"},{key:"famille",label:"Famille"},{key:"abc",label:"ABC"},{key:"demande",label:"Demande/an"},{key:"cout_unitaire",label:"Coût unit."},{key:"eoq",label:"EOQ"},{key:"rop",label:"ROP"},{key:"stock_net",label:"Stock"},{key:"seuil_min",label:"Seuil"},{key:"couverture",label:"Couverture (j)"},{key:"statut_service",label:"Statut"},{key:"priorite",label:"Priorité"}];

  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={c=>{handleSort(c);setPage(0);}} tip={tip}>{children}</SortableTh>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <SearchInput value={search} onChange={v=>{setSearch(v);setPage(0);}} />
        <FilterPills options={["A","B","C"]} selected={abcFilter} onSelect={v=>{setAbcFilter(v);setPage(0);}}/>
        <FilterPills options={["Électrique","Mécanique","MRO","Hydraulique","Packaging","Consommables","Quincaillerie","Sécurité"]} selected={familleFilter} onSelect={v=>{setFamilleFilter(v);setPage(0);}}/>
        <span style={{ marginLeft:"auto", fontSize:12, color:COLORS.textMuted }}>{filtered.length} articles</span>
      </div>
      <Card headerRight={<div style={{ display:"flex", gap:6 }}>{auth?.user?.role === "admin" && <button onClick={()=>setShowImport(true)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.info}`, background:`${COLORS.info}15`, color:COLORS.info, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>📥 Importer CSV</button>}<ExportButton data={filtered} columns={csvCols} filename="inventaire"/></div>}>
        <TableContainer>
          <thead>
            <tr>
              <S col="sku" tip="Identifiant unique de l'article">SKU</S>
              <S col="article" tip="Nom de l'article">Article</S>
              <S col="famille" tip="Catégorie de l'article">Famille</S>
              <S col="abc" tip="Classification Pareto — A: 80% valeur, B: 15%, C: 5%">ABC</S>
              <S col="demande" tip="Quantité consommée par année">Demande/an</S>
              <S col="cout_unitaire" tip="Prix d'achat unitaire">Coût unit.</S>
              <S col="eoq" tip="Economic Order Quantity — quantité optimale de commande">EOQ</S>
              <S col="rop" tip="Reorder Point — seuil de déclenchement de commande">ROP</S>
              <S col="stock_net" tip="Quantité actuellement en stock">Stock</S>
              <S col="seuil_min" tip="Stock minimum avant alerte">Seuil</S>
              <S col="couverture" tip="Nombre de jours de stock restant au rythme actuel">Couv. (j)</S>
              <S col="statut_service" tip="Conforme, Sous seuil ou Rupture">Statut</S>
              <Th tip="Statut du bon de commande en cours pour cet article">PO</Th>
            </tr>
          </thead>
          <tbody>
            {paged.map(it => {
              const activePO = pos.find(p => p.sku === it.sku && p.statut !== "CLOS");
              const statusColors = { BROUILLON:"#6b7280", A_VALIDER:"#f59e0b", ENVOYE:"#3b82f6", RECU:"#10b981" };
              const statusSteps = ["BROUILLON","A_VALIDER","ENVOYE","RECU"];
              const stepIdx = activePO ? statusSteps.indexOf(activePO.statut) : -1;
              return (
              <tr key={it.id} style={{ transition:"background 0.15s", cursor:"pointer" }} onClick={()=>setSlideOver({data:it,type:"item"})} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 12px", fontWeight:600, color:COLORS.accent, fontSize:12 }}>{it.sku}</td>
                <td style={{ padding:"10px 12px", fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>{it.article}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textMuted }}>{it.famille}</td>
                <td style={{ padding:"10px 12px" }}><Badge>{it.abc}</Badge></td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.demande)}</td>
                <td style={{ padding:"10px 12px" }}>${it.cout_unitaire.toFixed(2)}</td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.eoq)}</td>
                <td style={{ padding:"10px 12px" }}>{fmt(it.rop)}</td>
                <td style={{ padding:"10px 12px", fontWeight:600, color:it.stock_net<it.seuil_min?COLORS.danger:COLORS.text }}>{fmt(it.stock_net)}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textDim }}>{fmt(it.seuil_min)}</td>
                <td style={{ padding:"10px 12px", color:it.couverture<15?COLORS.danger:it.couverture<30?COLORS.warning:COLORS.accent }}>{it.couverture.toFixed(0)}j</td>
                <td style={{ padding:"10px 12px" }}><Badge>{it.statut_service}</Badge></td>
                <td style={{ padding:"10px 12px" }} onClick={e=>e.stopPropagation()}>
                  {activePO ? (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ display:"flex", gap:2 }}>
                        {statusSteps.map((s, i) => (
                          <div key={s} style={{ width:14, height:4, borderRadius:2, background:i<=stepIdx ? statusColors[statusSteps[Math.min(i, stepIdx)]] || COLORS.border : COLORS.border, transition:"background 0.2s" }}/>
                        ))}
                      </div>
                      <span style={{ fontSize:9, color:statusColors[activePO.statut], fontWeight:600 }}>{activePO.po_number}</span>
                    </div>
                  ) : (
                    <button onClick={()=>createPO(it)} style={{ padding:"2px 8px", borderRadius:4, border:`1px solid ${COLORS.accent}40`, background:`${COLORS.accent}10`, color:COLORS.accent, fontSize:9, fontWeight:600, cursor:"pointer" }}>+ PO</button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </TableContainer>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, paddingTop:12, borderTop:`1px solid ${COLORS.border}` }}>
          <span style={{ fontSize:12, color:COLORS.textMuted }}>Page {page+1} / {totalPages}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:12 }}>← Préc.</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, cursor:"pointer", fontSize:12 }}>Suiv. →</button>
          </div>
        </div>
      </Card>
      {showImport && <ImportModal type="items" onClose={()=>setShowImport(false)} onImport={handleImportItems}/>}
    </div>
  );
};

export default InventoryPage;
