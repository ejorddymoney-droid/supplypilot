import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';

const KpiCard = ({ label, value, sub, color, trend, onClick }) => {
  const COLORS = useTheme();
  if (color === undefined) color = COLORS.accent;

  const content = (
    <>
      <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle at top right, ${color}15, transparent)`, borderRadius:"0 16px 0 0" }} aria-hidden="true" />
      <div style={{ fontSize:12, color:COLORS.textMuted, fontWeight:500, marginBottom:8, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:COLORS.text, letterSpacing:"-0.02em", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:COLORS.textDim, marginTop:6 }}>{sub}</div>}
      {trend != null && (
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8, fontSize:12, color:trend>0?COLORS.accent:COLORS.danger }} aria-label={`Tendance: ${trend > 0 ? 'hausse' : 'baisse'} de ${Math.abs(trend)}%`}>
          <Icon name={trend>0?"arrowUp":"arrowDown"} size={14}/>
          {Math.abs(trend)}%
        </div>
      )}
    </>
  );

  const baseStyle = {
    background:COLORS.card, borderRadius:16, padding:"22px 24px", border:`1px solid ${COLORS.border}`,
    position:"relative", overflow:"hidden", minWidth:0, textAlign:"left", width:"100%",
    boxShadow: COLORS.isLight ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
    transition:"background 0.35s, border-color 0.35s, transform 0.15s",
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
        style={{ ...baseStyle, cursor:"pointer", fontFamily:"inherit" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
      >
        {content}
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
};

export default KpiCard;
