import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, ExportButton, TableContainer, Th, Td, KpiCard } from '../common';
import { USERS } from '../../data/constants';

const SettingsPage = () => {
  const COLORS = useTheme();
  const auth = useAuth();
  const { showToast, addEvent } = useData();
  const [tab, setTab] = useState("rules");
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ username:"", password:"", nom:"", poste:"", role:"entrepot" });
  const [pwForm, setPwForm] = useState({ current:"", newPw:"", confirm:"" });

  const rules = [
    { id:1, name:"Reapprovisionnement automatique", condition:"Classe A/B + Stock < Seuil min + Fournisseur actif", action:"Creer PO brouillon + Tache validation + Log audit", active:true },
    { id:2, name:"Garde-fou PO unique", condition:"Un seul PO BROUILLON ou A_VALIDER par SKU", action:"Bloquer creation + Log warning", active:true },
    { id:3, name:"Limite quantite EOQ", condition:"Qty > EOQ x 2", action:"Exiger validation manageriale", active:true },
    { id:4, name:"Fournisseur inactif", condition:"Fournisseur.statut == inactif", action:"Bloquer creation PO + Log erreur", active:true },
    { id:5, name:"Quantite positive", condition:"Qty <= 0", action:"Refuser PO + Log violation", active:true },
    { id:6, name:"Workflow envoi", condition:"PO non valide -> tentative envoi", action:"Bloquer transition + Log erreur", active:true },
    { id:7, name:"Workflow reception", condition:"PO non envoye -> tentative reception", action:"Bloquer transition + Log erreur", active:true },
    { id:8, name:"PO clos immuable", condition:"PO.statut == CLOS -> modification", action:"Bloquer modification + Log violation", active:true },
  ];

  const formulas = [
    { name:"EOQ", formula:"√((2 × D × S) / H)", desc:"D = demande annuelle, S = coût commande, H = coût unitaire × taux possession" },
    { name:"ROP", formula:"(D/365 × Lead time) + Stock sécurité", desc:"Point de réapprovisionnement avec marge sécurité" },
    { name:"Couverture", formula:"Stock net / (D / 365)", desc:"Nombre de jours de stock restant au rythme actuel" },
    { name:"Classification ABC", formula:"Pareto sur valeur annuelle (D × Coût)", desc:"A ≤ 80% cumulé, B ≤ 95%, C > 95%" },
    { name:"TRS", formula:"Disponibilité × Performance × Qualité", desc:"Taux de rendement synthétique (OEE)" },
    { name:"Disponibilité", formula:"(Temps planifié − Arrêts) / Temps planifié", desc:"Temps réellement productif vs temps prévu" },
    { name:"Performance", formula:"(Qté / Temps fonct.) / Cadence théorique", desc:"Ratio cadence réelle vs nominale" },
    { name:"Score fournisseur", formula:"Conformité×0.6 + (100−Retard)×0.2 + Rapidité×0.2", desc:"Score composite sur 100" },
  ];

  const kpiDefs = [
    { name:"Taux de service", def:"% d'articles avec stock ≥ seuil minimum. Mesure la capacité à servir les demandes sans rupture.", cible:"≥ 95%", page:"Dashboard" },
    { name:"Couverture moyenne", def:"Nombre moyen de jours de stock restant sur l'ensemble des articles. Indicateur de santé globale du stock.", cible:"30–45 jours", page:"Dashboard" },
    { name:"Articles critiques", def:"Articles en rupture, sous seuil, ou avec couverture < 15 jours pour les classes A/B.", cible:"< 10% du total", page:"Articles critiques" },
    { name:"Précision inventaire", def:"% d'articles comptés dont l'écart est dans la tolérance (A: ±5%, B: ±10%, C: ±15%).", cible:"A ≥ 95%, B ≥ 90%, C ≥ 85%", page:"Inventaire tournant" },
    { name:"TRS", def:"Taux de rendement synthétique. Produit de Disponibilité × Performance × Qualité.", cible:"≥ 85% (World Class)", page:"Performance TRS" },
    { name:"Délai moyen fournisseur", def:"Nombre moyen de jours entre l'envoi du PO et la réception.", cible:"< 10 jours", page:"Fournisseurs" },
    { name:"Taux de conformité", def:"% de commandes reçues conformes aux spécifications (qualité, quantité).", cible:"≥ 95%", page:"Fournisseurs" },
    { name:"PO à traiter", def:"Nombre de POs en statut BROUILLON ou A_VALIDER nécessitant une action.", cible:"< 5", page:"Purchase Orders" },
  ];

  const handleAddUser = () => {
    if (!userForm.username || !userForm.password || !userForm.nom) return;
    const initials = userForm.nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6","#06b6d4"];
    const newUser = {
      id: USERS.length + 1, username: userForm.username, password: userForm.password,
      role: userForm.role, nom: userForm.nom, poste: userForm.poste || (userForm.role === "admin" ? "Gestionnaire" : "Prepose entrepot"),
      initials, color: colors[USERS.length % colors.length],
    };
    USERS.push(newUser);
    addEvent("USER_CREATED", "User", newUser.id, `Profil cree: ${newUser.nom} (${newUser.role})`, "INFO");
    showToast(`Utilisateur "${newUser.nom}" cree`);
    setUserForm({ username:"", password:"", nom:"", poste:"", role:"entrepot" });
    setShowAddUser(false);
  };

  const handleChangePw = () => {
    const user = USERS.find(u => u.id === auth.user.id);
    if (!user || pwForm.current !== user.password) { showToast("Mot de passe actuel incorrect", "error"); return; }
    if (pwForm.newPw.length < 4) { showToast("Minimum 4 caracteres", "error"); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast("Les mots de passe ne correspondent pas", "error"); return; }
    user.password = pwForm.newPw;
    showToast("Mot de passe modifie");
    setPwForm({ current:"", newPw:"", confirm:"" });
  };

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${tab === id ? COLORS.accent : COLORS.border}`,
        background:tab === id ? COLORS.accentGlow : "transparent", color:tab === id ? COLORS.accent : COLORS.textMuted,
        fontSize:12, fontWeight:tab === id ? 600 : 400, cursor:"pointer", transition:"all 0.15s" }}>{label}</button>
  );

  const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:4 }}>{label}</label>
      <input value={value} onChange={onChange} type={type} placeholder={placeholder}
        style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <Tab id="rules" label="Moteur de règles"/><Tab id="formulas" label="Formules"/><Tab id="kpis" label="Définitions KPI"/><Tab id="users" label="Gestion profils"/><Tab id="password" label="Mon compte"/>
      </div>

      {/* RULES */}
      {tab === "rules" && (
        <Card title={`Moteur de règles — ${rules.length} garde-fous`}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {rules.map(r => (
              <div key={r.id} style={{ background:COLORS.surface, borderRadius:12, padding:16, border:`1px solid ${COLORS.border}`, display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:COLORS.accentGlow, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16, fontWeight:700, color:COLORS.accent }}>{r.id}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:COLORS.text, marginBottom:6 }}>{r.name}</div>
                  <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:4 }}><span style={{ color:COLORS.info, fontWeight:500 }}>SI</span> {r.condition}</div>
                  <div style={{ fontSize:12, color:COLORS.textMuted }}><span style={{ color:COLORS.warning, fontWeight:500 }}>ALORS</span> {r.action}</div>
                </div>
                <span style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` }}>ACTIF</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* FORMULAS */}
      {tab === "formulas" && (
        <Card title={`Formules — ${formulas.length} calculs`}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {formulas.map(f => (
              <div key={f.name} style={{ background:COLORS.surface, borderRadius:12, padding:16, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight:700, color:COLORS.accent, marginBottom:6, fontSize:14 }}>{f.name}</div>
                <div style={{ fontFamily:"'Courier New', monospace", fontSize:13, color:COLORS.text, marginBottom:8, padding:"8px 12px", background:COLORS.bg, borderRadius:8, border:`1px solid ${COLORS.border}` }}>{f.formula}</div>
                <div style={{ fontSize:12, color:COLORS.textDim }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPI DEFINITIONS */}
      {tab === "kpis" && (
        <Card title={`Définitions KPI — ${kpiDefs.length} indicateurs`}>
          <TableContainer>
            <thead><tr><Th>KPI</Th><Th>Définition</Th><Th>Cible</Th><Th>Page</Th></tr></thead>
            <tbody>
              {kpiDefs.map(k => (
                <tr key={k.name} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Td style={{ fontWeight:600, color:COLORS.accent, whiteSpace:"nowrap" }}>{k.name}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textMuted, maxWidth:400 }}>{k.def}</Td>
                  <Td style={{ fontWeight:600, color:COLORS.accent, whiteSpace:"nowrap" }}>{k.cible}</Td>
                  <Td style={{ fontSize:12, color:COLORS.textDim }}>{k.page}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
        </Card>
      )}

      {/* USER MANAGEMENT */}
      {tab === "users" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card title="Profils utilisateurs" headerRight={<button onClick={()=>setShowAddUser(true)} style={{ padding:"4px 14px", borderRadius:6, border:`1px solid ${COLORS.accent}`, background:COLORS.accentGlow, color:COLORS.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}>+ Nouveau profil</button>}>
            <TableContainer>
              <thead><tr><Th>Utilisateur</Th><Th>Nom complet</Th><Th>Poste</Th><Th>Rôle</Th><Th>Pages accessibles</Th></tr></thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg, ${u.color}, ${u.color}aa)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:11 }}>{u.initials}</div>
                        <span style={{ fontFamily:"monospace", fontSize:12, color:COLORS.text }}>{u.username}</span>
                      </div>
                    </Td>
                    <Td style={{ fontWeight:500 }}>{u.nom}</Td>
                    <Td style={{ color:COLORS.textMuted }}>{u.poste}</Td>
                    <Td><Badge>{u.role}</Badge></Td>
                    <Td style={{ fontSize:11, color:COLORS.textDim }}>{u.role === "admin" ? "Toutes les pages" : "Tableau de bord, Inventaire, Commandes, Comptages, Stats"}</Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </Card>

          {/* Permission matrix */}
          <Card title="Matrice des permissions">
            <TableContainer>
              <thead><tr><Th>Page</Th><Th>Admin</Th><Th>Entrepôt</Th></tr></thead>
              <tbody>
                {[
                  {page:"Dashboard",admin:true,entrepot:false},{page:"Inventaire",admin:true,entrepot:true},
                  {page:"Articles critiques",admin:true,entrepot:false},{page:"Fournisseurs",admin:true,entrepot:false},
                  {page:"Purchase Orders",admin:true,entrepot:false},{page:"Tâches",admin:true,entrepot:false},
                  {page:"Journal d'audit",admin:true,entrepot:false},{page:"Performance TRS",admin:true,entrepot:false},
                  {page:"Mon tableau de bord",admin:false,entrepot:true},{page:"Commandes internes",admin:true,entrepot:true},
                  {page:"Inventaire tournant",admin:true,entrepot:true},{page:"Mes statistiques",admin:false,entrepot:true},
                  {page:"Règles / Config",admin:true,entrepot:false},
                ].map(p => (
                  <tr key={p.page} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td style={{ fontWeight:500 }}>{p.page}</Td>
                    <Td>{p.admin ? <span style={{ color:COLORS.accent }}>{"✓"}</span> : <span style={{ color:COLORS.textDim }}>{"—"}</span>}</Td>
                    <Td>{p.entrepot ? <span style={{ color:COLORS.accent }}>{"✓"}</span> : <span style={{ color:COLORS.textDim }}>{"—"}</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </Card>

          {/* Add user modal */}
          {showAddUser && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1005 }}>
              <div style={{ width:460, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize:18, fontWeight:700, color:COLORS.text, marginBottom:20 }}>Créer un profil</div>
                <Input label="Nom d'utilisateur *" value={userForm.username} onChange={e=>setUserForm(f=>({...f,username:e.target.value}))} placeholder="ex: marie.lavoie"/>
                <Input label="Mot de passe *" value={userForm.password} onChange={e=>setUserForm(f=>({...f,password:e.target.value}))} type="password" placeholder="Min. 4 caractères"/>
                <Input label="Nom complet *" value={userForm.nom} onChange={e=>setUserForm(f=>({...f,nom:e.target.value}))} placeholder="Prénom Nom"/>
                <Input label="Poste" value={userForm.poste} onChange={e=>setUserForm(f=>({...f,poste:e.target.value}))} placeholder="ex: Analyste achats"/>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Rôle</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{id:"admin",label:"Admin — Accès complet"},{id:"entrepot",label:"Entrepôt — Accès limité"}].map(r => (
                      <button key={r.id} onClick={()=>setUserForm(f=>({...f,role:r.id}))}
                        style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${userForm.role===r.id?COLORS.accent:COLORS.border}`,
                          background:userForm.role===r.id?COLORS.accentGlow:"transparent", color:userForm.role===r.id?COLORS.accent:COLORS.textMuted,
                          fontSize:12, fontWeight:userForm.role===r.id?600:400, cursor:"pointer" }}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowAddUser(false)} style={{ padding:"8px 20px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, cursor:"pointer", fontSize:13 }}>Annuler</button>
                  <button onClick={handleAddUser} disabled={!userForm.username||!userForm.password||!userForm.nom}
                    style={{ padding:"8px 20px", borderRadius:8, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:userForm.username&&userForm.password&&userForm.nom?1:0.5 }}>Créer le profil</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD */}
      {tab === "password" && (
        <Card title="Mon compte">
          <div style={{ maxWidth:400 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg, ${auth.user.color}, ${auth.user.color}aa)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:18 }}>{auth.user.initials}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:COLORS.text }}>{auth.user.nom}</div>
                <div style={{ fontSize:12, color:COLORS.textMuted }}>{auth.user.poste} · {auth.user.role}</div>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, marginBottom:12 }}>Changer le mot de passe</div>
            <Input label="Mot de passe actuel" value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} type="password"/>
            <Input label="Nouveau mot de passe" value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} type="password"/>
            <Input label="Confirmer le nouveau mot de passe" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} type="password"/>
            <button onClick={handleChangePw} disabled={!pwForm.current||!pwForm.newPw||!pwForm.confirm}
              style={{ padding:"10px 24px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${COLORS.accent}, #059669)`, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity:pwForm.current&&pwForm.newPw&&pwForm.confirm?1:0.5, marginTop:8 }}>Modifier le mot de passe</button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
