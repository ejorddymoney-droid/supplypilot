import { useTheme } from '../../contexts/ThemeContext';

const Badge = ({ children, variant = "default" }) => {
  const COLORS = useTheme();
  const styles = {
    A: { background:"rgba(244,63,94,0.15)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.3)" },
    B: { background:"rgba(245,158,11,0.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)" },
    C: { background:"rgba(99,102,241,0.15)", color:"#6366f1", border:"1px solid rgba(99,102,241,0.3)" },
    Conforme: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    "Sous seuil": { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    Rupture: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Haute: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Moyenne: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    Basse: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    BROUILLON: { background:"rgba(107,114,128,0.15)", color:"#9ca3af", border:"1px solid rgba(107,114,128,0.3)" },
    A_VALIDER: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    ENVOYE: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    RECU: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    CLOS: { background:COLORS.purpleDim, color:COLORS.purple, border:"1px solid rgba(139,92,246,0.3)" },
    actif: { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    inactif: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    Ouverte: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    "En cours": { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    "Termin\u00e9e": { background:COLORS.accentGlow, color:COLORS.accent, border:`1px solid ${COLORS.accentDim}` },
    INFO: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
    WARNING: { background:COLORS.warningDim, color:COLORS.warning, border:"1px solid rgba(245,158,11,0.3)" },
    ERROR: { background:COLORS.dangerDim, color:COLORS.danger, border:"1px solid rgba(239,68,68,0.3)" },
    CRITICAL: { background:"rgba(239,68,68,0.25)", color:"#ff6b6b", border:"1px solid rgba(239,68,68,0.5)" },
    default: { background:COLORS.infoDim, color:COLORS.info, border:"1px solid rgba(59,130,246,0.3)" },
  };
  const s = styles[children] || styles[variant] || styles.default;
  return (
    <span
      role="status"
      style={{ ...s, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600, letterSpacing:"0.02em", whiteSpace:"nowrap", display:"inline-block", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", ...(children === "CRITICAL" ? { animation:"glowPulse 2s infinite" } : {}) }}
    >
      {children}
    </span>
  );
};

export default Badge;
