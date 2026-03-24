import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useSortable } from '../../hooks/useSortable';
import { parseDecimal } from '../../utils/formatters';
import { SUPPLIERS, SUPPLIER_MAP } from '../../data/constants';
import { KpiCard, Card, Badge, ExportButton, TableContainer, Th, SortableTh } from '../common';

const SuppliersPage = () => {
  const COLORS = useTheme();
  const { setSlideOver, addEvent, showToast } = useData();
  const { sortCol, sortDir, handleSort, sortData } = useSortable("taux_conformite","desc");
  const S = ({ col, children, tip }) => <SortableTh col={col} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={tip}>{children}</SortableTh>;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nom:"", statut:"actif", delai_moyen:"", taux_conformite:"", taux_retard:"", pays:"", email:"" });
  const suppliersWithScore = SUPPLIERS.map(s => ({ ...s, score: Math.round(s.taux_conformite*0.6 + (100-s.taux_retard)*0.2 + (30-Math.min(s.delai_moyen,30))/30*100*0.2) }));
  const sorted = sortData(suppliersWithScore);
  const csvCols = [{key:"nom",label:"Nom"},{key:"statut",label:"Statut"},{key:"pays",label:"Pays"},{key:"delai_moyen",label:"Délai moyen"},{key:"taux_conformite",label:"Conformité %"},{key:"taux_retard",label:"Retard %"},{key:"score",label:"Score"},{key:"email",label:"Email"}];

  const handleAddSupplier = () => {
    if (!form.nom) return;
    const newId = SUPPLIERS.length + 1;
    const newSupplier = {
      id: newId, nom: form.nom, statut: form.statut,
      delai_moyen: parseDecimal(form.delai_moyen) || 10,
      taux_conformite: parseDecimal(form.taux_conformite) || 90,
      taux_retard: parseDecimal(form.taux_retard) || 5,
      pays: form.pays || "Canada", email: form.email || "",
    };
    SUPPLIERS.push(newSupplier);
    SUPPLIER_MAP[newId] = newSupplier.nom;
    addEvent("SUPPLIER_CREATED", "Supplier", newId, `Fournisseur créé: ${newSupplier.nom} (${newSupplier.pays})`, "INFO");
    showToast(`Fournisseur "${newSupplier.nom}" ajouté`);
    setForm({ nom:"", statut:"actif", delai_moyen:"", taux_conformite:"", taux_retard:"", pays:"", email:"" });
    setShowAdd(false);
  };

  const InputField = ({ label, field, type="text", placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>{label}</label>
      <input value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} type={type} placeholder={placeholder}
        style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"rgba(255,255,255,0.03)", color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
        onFocus={e=>e.target.style.borderColor=COLORS.accent} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
    </div>
  );

  return (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
      <KpiCard label="Fournisseurs actifs" value={SUPPLIERS.filter(s=>s.statut==="actif").length} sub={`sur ${SUPPLIERS.length} total`} color={COLORS.accent}/>
      <KpiCard label="Délai moyen" value={`${(SUPPLIERS.reduce((s,sup)=>s+sup.delai_moyen,0)/SUPPLIERS.length).toFixed(0)}j`} color={COLORS.info}/>
      <KpiCard label="Conformité moy." value={`${(SUPPLIERS.reduce((s,sup)=>s+sup.taux_conformite,0)/SUPPLIERS.length).toFixed(1)}%`} color={COLORS.accent}/>
      <KpiCard label="À risque" value={SUPPLIERS.filter(s=>s.taux_conformite<80||s.statut==="inactif").length} color={COLORS.danger}/>
    </div>
    <Card title="Fournisseurs" headerRight={<div style={{ display:"flex", gap:6 }}>
      <button onClick={()=>setShowAdd(true)} style={{ padding:"4px 14px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>+ Ajouter</button>
      <ExportButton data={sorted} columns={csvCols} filename="fournisseurs"/>
    </div>}>
      <TableContainer>
        <thead><tr>
          <S col="nom" tip="Raison sociale du fournisseur">Nom</S>
          <S col="statut" tip="Actif ou inactif — les fournisseurs inactifs bloquent la création de PO">Statut</S>
          <S col="pays" tip="Pays d'origine du fournisseur">Pays</S>
          <S col="delai_moyen" tip="Délai moyen de livraison en jours">Délai moyen</S>
          <S col="taux_conformite" tip="Pourcentage de commandes conformes aux spécifications">Conformité</S>
          <S col="taux_retard" tip="Pourcentage de commandes livrées en retard">Taux retard</S>
          <S col="score" tip="Score composite: 60% conformité + 20% ponctualité + 20% rapidité">Score</S>
          <Th tip="Adresse courriel du contact principal">Email</Th>
        </tr></thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.id} style={{ cursor:"pointer" }} onClick={()=>setSlideOver({data:s,type:"supplier"})} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"10px 12px", fontWeight:600 }}>{s.nom}</td>
              <td style={{ padding:"10px 12px" }}><Badge>{s.statut}</Badge></td>
              <td style={{ padding:"10px 12px", color:COLORS.textMuted }}>{s.pays}</td>
              <td style={{ padding:"10px 12px" }}>{s.delai_moyen} jours</td>
              <td style={{ padding:"10px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ background:COLORS.bg, borderRadius:4, height:6, width:80, overflow:"hidden" }}>
                    <div style={{ width:`${s.taux_conformite}%`, height:"100%", background:s.taux_conformite>90?COLORS.accent:s.taux_conformite>80?COLORS.warning:COLORS.danger, borderRadius:4 }}/>
                  </div>
                  <span style={{ fontSize:12 }}>{s.taux_conformite}%</span>
                </div>
              </td>
              <td style={{ padding:"10px 12px", color:s.taux_retard>15?COLORS.danger:s.taux_retard>8?COLORS.warning:COLORS.text }}>{s.taux_retard}%</td>
              <td style={{ padding:"10px 12px" }}><span style={{ fontWeight:700, fontSize:16, color:s.score>85?COLORS.accent:s.score>70?COLORS.warning:COLORS.danger }}>{s.score}</span><span style={{ fontSize:11, color:COLORS.textDim }}>/100</span></td>
              <td style={{ padding:"10px 12px", fontSize:12, color:COLORS.textDim }}>{s.email}</td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </Card>

    {/* Add Supplier Modal */}
    {showAdd && (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
        <div style={{ width:480, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:20 }}>Ajouter un fournisseur</div>
          <InputField label="Nom *" field="nom" placeholder="Ex: AcierPlus Inc."/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <InputField label="Pays" field="pays" placeholder="Canada"/>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>Statut</label>
              <div style={{ display:"flex", gap:6 }}>
                {["actif","inactif"].map(s => (
                  <button key={s} onClick={()=>setForm(f=>({...f,statut:s}))}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${form.statut===s?COLORS.accent:COLORS.border}`,
                      background:form.statut===s?COLORS.accentGlow:"transparent", color:form.statut===s?COLORS.accent:COLORS.textMuted,
                      fontSize:12, fontWeight:form.statut===s?600:400, cursor:"pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <InputField label="Délai moyen (jours)" field="delai_moyen" placeholder="10"/>
            <InputField label="Conformité (%)" field="taux_conformite" placeholder="90,5"/>
            <InputField label="Taux retard (%)" field="taux_retard" placeholder="5,2"/>
          </div>
          <InputField label="Email" field="email" placeholder="contact@fournisseur.com"/>
          <div style={{ fontSize:11, color:COLORS.textDim, marginBottom:16 }}>Les décimales acceptent la virgule et le point (ex: 94,2 ou 94.2)</div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>setShowAdd(false)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
            <button onClick={handleAddSupplier} disabled={!form.nom}
              style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:form.nom?1:0.5 }}>
              Ajouter le fournisseur
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default SuppliersPage;
