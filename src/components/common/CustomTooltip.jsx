import { useTheme } from '../../contexts/ThemeContext';
import { fmt } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  const COLORS = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(15,20,35,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 14px", fontSize:12, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }} role="tooltip">
      <div style={{ color:COLORS.textMuted, marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || COLORS.text, fontWeight:600 }}>
          {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;
