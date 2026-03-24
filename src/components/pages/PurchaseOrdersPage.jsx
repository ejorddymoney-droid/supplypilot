import { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { TODAY } from '../../utils/formatters';
import { ITEMS } from '../../data/generators';
import { SUPPLIER_MAP } from '../../data/constants';
import { KpiCard, Card, Badge, SearchInput, FilterPills, ExportButton, ActionBtn, TableContainer, SortableTh } from '../common';

const PurchaseOrdersPage = () => {
  const COLORS = useTheme();
  const { pos, transitionPO, setSlideOver, setPos, addEvent, showToast } = useData();
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [attachModal, setAttachModal] = useState(null); // PO object
  const { sortCol, sortDir, handleSort, sortData } = useSortable("date_creation","desc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const filtered = useMemo(() => {
    let data = [...pos];
    if (filter) data = data.filter(p => p.statut === filter);
    if (search) data = data.filter(p => p.po_number.toLowerCase().includes(search.toLowerCase()) || p.article.toLowerCase().includes(search.toLowerCase()));
    return sortData(data);
  }, [filter, search, pos, sortCol, sortDir]);

  const handleImportPOs = (rows) => {
    let count = 0;
    const newPOs = rows.map(row => {
      const sku = row.sku || row.SKU;
      if (!sku) return null;
      const item = ITEMS.find(i => i.sku === sku);
      if (!item) return null;
      count++;
      const poId = pos.length + count + 100;
      return {
        po_id: poId, po_number: `PO-IMP-${String(poId).padStart(4, '0')}`,
        sku, article: item.article, supplier_id: parseInt(row.supplier_id) || item.supplier_id || 1,
        qty: parseInt(row.qty) || 100, statut: "BROUILLON",
        prix_negocie: parseFloat(row.prix_negocie) || +(item.cout_unitaire * 0.95).toFixed(2),
        prix_paye: null, date_creation: TODAY, created_by: "Import CSV",
        commentaire: row.commentaire || "", documents: [],
      };
    }).filter(Boolean);
    setPos(prev => [...prev, ...newPOs]);
    addEvent("IMPORT_POS", "PurchaseOrder", 0, `Import CSV: ${newPOs.length} POs créés (${rows.length} lignes)`, "INFO");
    showToast(`Import terminé — ${newPOs.length} POs créés en BROUILLON`);
    setShowImport(false);
  };

  const handleAttachDocs = (poId, docs) => {
    setPos(prev => prev.map(p => p.po_id === poId ? { ...p, documents: [...(p.documents || []), ...docs] } : p));
    addEvent("DOCUMENT_ATTACHED", "PurchaseOrder", poId, `${docs.length} document(s) joint(s): ${docs.map(d => d.name).join(', ')}`, "INFO");
    showToast(`${docs.length} document(s) joint(s)`);
    setAttachModal(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12 }}>
        {[
          { label:"Brouillon", val:pos.filter(p=>p.statut==="BROUILLON").length, color:"#6b7280" },
          { label:"À valider", val:pos.filter(p=>p.statut==="A_VALIDER").length, color:COLORS.warning },
          { label:"Envoyé", val:pos.filter(p=>p.statut==="ENVOYE").length, color:COLORS.info },
          { label:"Reçu", val:pos.filter(p=>p.statut==="RECU").length, color:COLORS.accent },
          { label:"Clos", val:pos.filter(p=>p.statut==="CLOS").length, color:COLORS.purple },
        ].map(k => <KpiCard key={k.label} label={k.label} value={k.val} color={k.color}/>)}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <SearchInput value={search} onChange={setSearch}/>
        <FilterPills options={["BROUILLON","A_VALIDER","ENVOYE","RECU","CLOS"]} selected={filter} onSelect={setFilter}/>
      </div>
      <Card title={`Purchase Orders — ${filtered.length}`} headerRight={<div style={{ display:"flex", gap:6 }}><button onClick={()=>setShowImport(true)} style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${COLORS.info}`, background:`${COLORS.info}15`, color:COLORS.info, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>📥 Importer CSV</button><ExportButton data={filtered} columns={[{key:"po_number",label:"PO #"},{key:"article",label:"Article"},{key:"sku",label:"SKU"},{key:r=>SUPPLIER_MAP[r.supplier_id]||"",label:"Fournisseur"},{key:"qty",label:"Qty"},{key:"statut",label:"Statut"},{key:"prix_negocie",label:"Prix négocié"},{key:"prix_paye",label:"Prix payé"},{key:"date_creation",label:"Date création"},{key:"created_by",label:"Créé par"}]} filename="purchase_orders"/></div>}>
        <TableContainer>
          <thead><tr><S col="po_number">PO #</S><S col="article">Article</S><S col="supplier_id">Fournisseur</S><S col="qty">Qty</S><S col="statut">Statut</S><S col="prix_negocie">Prix négocié</S><S col="prix_paye">Prix payé</S><S col="date_creation">Date création</S><S col="created_by">Créé par</S><th style={{ padding:"10px 12px" }}>Actions</th></tr></thead>
          <tbody>
            {filtered.map(po => (
              <tr key={po.po_id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:po,type:"po"})} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"10px 12px", fontWeight:700, color:COLORS.accent }}>{po.po_number}</td>
                <td style={{ padding:"10px 12px" }}><span style={{ fontWeight:500 }}>{po.article}</span><br/><span style={{ fontSize:11, color:COLORS.textDim }}>{po.sku}</span></td>
                <td style={{ padding:"10px 12px", color:COLORS.textMuted }}>{SUPPLIER_MAP[po.supplier_id]?.split(' ')[0]}</td>
                <td style={{ padding:"10px 12px", fontWeight:600 }}>{po.qty}</td>
                <td style={{ padding:"10px 12px" }}><Badge>{po.statut}</Badge></td>
                <td style={{ padding:"10px 12px" }}>${po.prix_negocie.toFixed(2)}</td>
                <td style={{ padding:"10px 12px" }}>{po.prix_paye ? `$${po.prix_paye.toFixed(2)}` : <span style={{ color:COLORS.textDim }}>—</span>}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textMuted, fontSize:12 }}>{po.date_creation}</td>
                <td style={{ padding:"10px 12px", color:COLORS.textMuted, fontSize:12 }}>{po.created_by}</td>
                <td style={{ padding:"10px 12px" }}>
                  <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:4, alignItems:"center" }}>
                    {po.statut==="BROUILLON" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.warning} bgColor={COLORS.warningDim} textColor={COLORS.warning}>Valider</ActionBtn>}
                    {po.statut==="A_VALIDER" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.info} bgColor={COLORS.infoDim} textColor={COLORS.info}>Envoyer</ActionBtn>}
                    {po.statut==="ENVOYE" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.accent} bgColor={COLORS.accentGlow} textColor={COLORS.accent}>Réceptionner</ActionBtn>}
                    {po.statut==="RECU" && <ActionBtn onClick={()=>transitionPO(po.po_id)} borderColor={COLORS.purple} bgColor={COLORS.purpleDim} textColor={COLORS.purple}>Clore</ActionBtn>}
                    {po.statut==="CLOS" && <span style={{ fontSize:10, color:COLORS.textDim }}>—</span>}
                    <button onClick={()=>setAttachModal(po)} title="Joindre un document"
                      style={{ padding:"3px 6px", borderRadius:4, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:12, position:"relative" }}>
                      📎{po.documents && po.documents.length > 0 && <span style={{ position:"absolute", top:-4, right:-4, minWidth:14, height:14, borderRadius:7, background:COLORS.accent, color:"white", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{po.documents.length}</span>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      </Card>
      {showImport && <ImportModal type="orders" onClose={()=>setShowImport(false)} onImport={handleImportPOs}/>}
      {attachModal && <DocumentAttachModal po={attachModal} onClose={()=>setAttachModal(null)} onAttach={handleAttachDocs}/>}
    </div>
  );
};

export default PurchaseOrdersPage;
