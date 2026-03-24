import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, KpiCard, ExportButton, CustomTooltip, TableContainer, Th, Td } from '../common';

const TRS_DEFAULTS = { tempsPlannifie: 160, arrets: 12, cadenceTheorique: 85, qteTotale: 11800, qteMauvaise: 280 };

const TRS_MONTHLY = [
  { mois:"Oct", dispo:91.2, perf:90.5, qual:96.8, trs:79.8 },
  { mois:"Nov", dispo:93.1, perf:91.8, qual:97.2, trs:83.1 },
  { mois:"Déc", dispo:89.5, perf:88.4, qual:95.9, trs:75.8 },
  { mois:"Jan", dispo:92.5, perf:93.8, qual:97.6, trs:84.7 },
  { mois:"Fév", dispo:94.0, perf:92.1, qual:98.0, trs:84.9 },
  { mois:"Mars", dispo:93.2, perf:94.5, qual:97.8, trs:86.1 },
];

const GaugeChart = ({ value, label, color, size=140 }) => {
  const COLORS = useTheme();
  const radius = (size-20)/2;
  const cx = size/2; const cy = size/2+10;
  const startAngle = -210; const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const valueAngle = startAngle + (value/100) * totalArc;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const needleX = cx + (radius-20) * Math.cos(toRad(valueAngle));
  const needleY = cy + (radius-20) * Math.sin(toRad(valueAngle));
  const level = value >= 85 ? "World Class" : value >= 75 ? "Bon" : value >= 60 ? "Acceptable" : "Critique";
  const levelColor = value >= 85 ? COLORS.accent : value >= 75 ? COLORS.info : value >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <svg width={size} height={size*0.7} viewBox={`0 0 ${size} ${size*0.75}`}>
        <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke={COLORS.border} strokeWidth="10" strokeLinecap="round"/>
        <path d={arcPath(startAngle, valueAngle, radius)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={COLORS.text} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill={COLORS.text}/>
        <text x={cx} y={cy-18} textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="DM Sans">{value.toFixed(1)}%</text>
      </svg>
      <div style={{ fontSize:13, fontWeight:600, color:COLORS.text, marginTop:2 }}>{label}</div>
      <div style={{ fontSize:10, fontWeight:600, color:levelColor, marginTop:2, padding:"2px 8px", borderRadius:4, background:`${levelColor}18` }}>{level}</div>
    </div>
  );
};

const TRSPage = () => {
  const COLORS = useTheme();
  const [inputs, setInputs] = useState(TRS_DEFAULTS);
  const update = (key, val) => setInputs(prev => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));

  // Calculs
  const tempsFonct = inputs.tempsPlannifie - inputs.arrets;
  const dispo = inputs.tempsPlannifie > 0 ? (tempsFonct / inputs.tempsPlannifie) * 100 : 0;
  const perf = tempsFonct > 0 && inputs.cadenceTheorique > 0 ? ((inputs.qteTotale / tempsFonct) / inputs.cadenceTheorique) * 100 : 0;
  const qual = inputs.qteTotale > 0 ? ((inputs.qteTotale - inputs.qteMauvaise) / inputs.qteTotale) * 100 : 0;
  const trs = (dispo/100) * (perf/100) * (qual/100) * 100;
  const qteBonne = inputs.qteTotale - inputs.qteMauvaise;

  const InputRow = ({ label, field, unit="" }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input type="number" value={inputs[field]} onChange={e=>update(field, e.target.value)}
          style={{ width:80, padding:"5px 10px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:COLORS.surface, color:COLORS.accent, fontSize:14, fontWeight:700, textAlign:"right", outline:"none" }}
          onFocus={e=>e.target.style.borderColor=COLORS.accent} onBlur={e=>e.target.style.borderColor=COLORS.border}/>
        {unit && <span style={{ fontSize:11, color:COLORS.textDim, width:16 }}>{unit}</span>}
      </div>
    </div>
  );

  const CalcRow = ({ label, value, unit="%", color }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}22` }}>
      <span style={{ fontSize:13, color:COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize:15, fontWeight:700, color:color||COLORS.text }}>{typeof value==="number"?value.toFixed(1):value}{unit}</span>
    </div>
  );

  const trsColor = trs >= 85 ? COLORS.accent : trs >= 75 ? COLORS.info : trs >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16 }}>
        <KpiCard label="Disponibilité" value={`${dispo.toFixed(1)}%`} sub={`${tempsFonct}h / ${inputs.tempsPlannifie}h`} color={dispo>=90?COLORS.accent:COLORS.warning}/>
        <KpiCard label="Performance" value={`${perf.toFixed(1)}%`} sub={`Cadence réelle: ${tempsFonct>0?(inputs.qteTotale/tempsFonct).toFixed(1):0}/h`} color={perf>=95?COLORS.accent:COLORS.info}/>
        <KpiCard label="Qualité" value={`${qual.toFixed(1)}%`} sub={`${qteBonne} bonnes / ${inputs.qteTotale}`} color={qual>=99?COLORS.accent:qual>=95?COLORS.info:COLORS.warning}/>
        <KpiCard label="TRS Global" value={`${trs.toFixed(1)}%`} sub={trs>=85?"World Class":trs>=75?"Bon":trs>=60?"Acceptable":"Critique"} color={trsColor}/>
      </div>

      {/* Gauges + Inputs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Jauges de performance">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16, padding:"12px 0" }}>
            <GaugeChart value={dispo} label="Disponibilité" color="#10B981"/>
            <GaugeChart value={Math.min(perf,100)} label="Performance" color="#3B82F6"/>
            <GaugeChart value={qual} label="Qualité" color="#A855F7"/>
            <GaugeChart value={Math.min(trs,100)} label="TRS" color="#F59E0B"/>
          </div>
        </Card>

        <div style={{ display:"grid", gridTemplateRows:"1fr 1fr", gap:16 }}>
          <Card title="Inputs production" headerRight={<button onClick={()=>setInputs(TRS_DEFAULTS)} style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, fontSize:10, cursor:"pointer" }}>Réinitialiser</button>}>
            <InputRow label="Temps planifié" field="tempsPlannifie" unit="h"/>
            <InputRow label="Arrêts non planifiés" field="arrets" unit="h"/>
            <InputRow label="Cadence théorique" field="cadenceTheorique" unit="/h"/>
            <InputRow label="Quantité totale" field="qteTotale"/>
            <InputRow label="Quantité rejetée" field="qteMauvaise"/>
          </Card>

          <Card title="Résultats calculés">
            <CalcRow label="Temps de fonctionnement" value={tempsFonct} unit="h" color={COLORS.text}/>
            <CalcRow label="Cadence réelle" value={tempsFonct>0?inputs.qteTotale/tempsFonct:0} unit="/h" color={COLORS.info}/>
            <CalcRow label="Quantités bonnes" value={qteBonne} unit="" color={COLORS.accent}/>
            <CalcRow label="Taux de rebut" value={inputs.qteTotale>0?(inputs.qteMauvaise/inputs.qteTotale)*100:0} unit="%" color={COLORS.danger}/>
          </Card>
        </div>
      </div>

      {/* Trend chart */}
      <Card title="Tendance mensuelle (6 mois)" headerRight={<ExportButton data={TRS_MONTHLY} columns={[{key:"mois",label:"Mois"},{key:"dispo",label:"Disponibilité %"},{key:"perf",label:"Performance %"},{key:"qual",label:"Qualité %"},{key:"trs",label:"TRS %"}]} filename="trs_tendance"/>}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={TRS_MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="mois" tick={{ fill:COLORS.textMuted, fontSize:12 }} axisLine={{ stroke:COLORS.border }}/>
            <YAxis domain={[60,100]} tick={{ fill:COLORS.textMuted, fontSize:11 }} axisLine={false} unit="%"/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ fontSize:11, color:COLORS.textMuted }}/>
            <Line type="monotone" dataKey="dispo" name="Disponibilité" stroke="#10B981" strokeWidth={2} dot={{ r:4 }}/>
            <Line type="monotone" dataKey="perf" name="Performance" stroke="#3B82F6" strokeWidth={2} dot={{ r:4 }}/>
            <Line type="monotone" dataKey="qual" name="Qualité" stroke="#A855F7" strokeWidth={2} dot={{ r:4 }}/>
            <Bar dataKey="trs" name="TRS" fill="#F59E0B" fillOpacity={0.25} radius={[4,4,0,0]} barSize={30}/>
            <Line type="monotone" dataKey="trs" name="TRS (ligne)" stroke="#F59E0B" strokeWidth={3} dot={{ r:5, fill:"#F59E0B" }} strokeDasharray=""/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Historical table + Formulas */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Historique mensuel">
          <TableContainer>
            <thead><tr><Th>Mois</Th><Th>Dispo.</Th><Th>Perf.</Th><Th>Qual.</Th><Th>TRS</Th><Th>Niveau</Th></tr></thead>
            <tbody>
              {TRS_MONTHLY.map(m => {
                const lvl = m.trs >= 85 ? "World Class" : m.trs >= 75 ? "Bon" : m.trs >= 60 ? "Acceptable" : "Critique";
                const lc = m.trs >= 85 ? COLORS.accent : m.trs >= 75 ? COLORS.info : m.trs >= 60 ? COLORS.warning : COLORS.danger;
                return (
                  <tr key={m.mois} onMouseEnter={e=>e.currentTarget.style.background=COLORS.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Td style={{ fontWeight:600 }}>{m.mois}</Td>
                    <Td>{m.dispo}%</Td>
                    <Td>{m.perf}%</Td>
                    <Td>{m.qual}%</Td>
                    <Td style={{ fontWeight:700, color:lc }}>{m.trs}%</Td>
                    <Td><span style={{ padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:600, background:`${lc}18`, color:lc }}>{lvl}</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </TableContainer>
        </Card>

        <Card title="Formules et repères">
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { name:"Disponibilité", formula:"(Temps planifié − Arrêts) / Temps planifié", desc:"Mesure le temps réellement productif par rapport au temps prévu" },
              { name:"Performance", formula:"(Qté totale / Temps fonct.) / Cadence théorique", desc:"Ratio entre cadence réelle et cadence nominale de la machine" },
              { name:"Qualité", formula:"(Qté totale − Qté rejetée) / Qté totale", desc:"Part de production conforme sans reprise ni rebut" },
              { name:"TRS", formula:"Disponibilité × Performance × Qualité", desc:"Indicateur synthétique de l'efficacité globale de l'équipement" },
            ].map(f => (
              <div key={f.name} style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight:700, color:COLORS.accent, marginBottom:4, fontSize:13 }}>{f.name}</div>
                <div style={{ fontFamily:"'Courier New', monospace", fontSize:12, color:COLORS.text, padding:"6px 10px", background:COLORS.bg, borderRadius:6, marginBottom:6, border:`1px solid ${COLORS.border}` }}>{f.formula}</div>
                <div style={{ fontSize:11, color:COLORS.textDim }}>{f.desc}</div>
              </div>
            ))}

            <div style={{ background:COLORS.surface, borderRadius:10, padding:14, border:`1px solid ${COLORS.border}`, marginTop:4 }}>
              <div style={{ fontWeight:700, color:COLORS.text, marginBottom:8, fontSize:13 }}>Repères industriels</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { label:"World Class", min:"≥ 85%", color:COLORS.accent },
                  { label:"Bon", min:"75–84%", color:COLORS.info },
                  { label:"Acceptable", min:"60–74%", color:COLORS.warning },
                  { label:"Critique", min:"< 60%", color:COLORS.danger },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:6, background:`${r.color}10` }}>
                    <div style={{ width:8, height:8, borderRadius:4, background:r.color }}/>
                    <span style={{ fontSize:12, color:COLORS.text, fontWeight:500 }}>{r.label}</span>
                    <span style={{ fontSize:11, color:COLORS.textDim, marginLeft:"auto" }}>{r.min}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TRSPage;
