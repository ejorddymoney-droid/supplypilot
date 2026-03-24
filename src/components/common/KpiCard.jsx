import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';

const KpiCard = ({ label, value, sub, color, trend, onClick }) => {
  const COLORS = useTheme();
  if (color === undefined) color = COLORS.accent;

  // Map KPI color to glow preset
  const glowMap = {
    [COLORS.danger]: COLORS.glow.danger,
    [COLORS.warning]: COLORS.glow.warning,
    [COLORS.info]: COLORS.glow.info,
    [COLORS.accent]: COLORS.glow.accent,
    [COLORS.purple]: COLORS.glow.purple,
  };
  const glowHoverMap = {
    [COLORS.danger]: COLORS.glow.dangerHover,
    [COLORS.warning]: COLORS.glow.warningHover,
    [COLORS.info]: COLORS.glow.infoHover,
    [COLORS.accent]: COLORS.glow.accentHover,
    [COLORS.purple]: COLORS.glow.purple,
  };
  const cardGlow = glowMap[color] || COLORS.glow.accent;
  const cardGlowHover = glowHoverMap[color] || COLORS.glow.accentHover;

  const content = (
    <>
      {/* Gradient top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} aria-hidden="true" />
      <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 300, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 20px rgba(255,255,255,0.04)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 6 }}>{sub}</div>}
      {trend != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, color: trend > 0 ? COLORS.accent : COLORS.danger }} aria-label={`Tendance: ${trend > 0 ? 'hausse' : 'baisse'} de ${Math.abs(trend)}%`}>
          <Icon name={trend > 0 ? "arrowUp" : "arrowDown"} size={14} />
          {Math.abs(trend)}%
        </div>
      )}
    </>
  );

  const baseStyle = {
    background: COLORS.glass.bg,
    backdropFilter: `blur(${COLORS.glass.blur})`,
    WebkitBackdropFilter: `blur(${COLORS.glass.blur})`,
    borderRadius: 16,
    padding: "22px 24px",
    border: `1px solid ${COLORS.glass.border}`,
    borderTop: `1px solid ${COLORS.glass.borderHighlight}`,
    position: "relative",
    overflow: "hidden",
    minWidth: 0,
    textAlign: "left",
    width: "100%",
    boxShadow: `${cardGlow}, ${COLORS.glass.innerShadow}`,
    transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease",
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
        style={{ ...baseStyle, cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
          e.currentTarget.style.boxShadow = `${cardGlowHover}, ${COLORS.glass.innerShadow}`;
          e.currentTarget.style.borderColor = COLORS.glass.borderHover;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = `${cardGlow}, ${COLORS.glass.innerShadow}`;
          e.currentTarget.style.borderColor = COLORS.glass.border;
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
};

export default KpiCard;
