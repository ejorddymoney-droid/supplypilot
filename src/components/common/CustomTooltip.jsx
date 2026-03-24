import { useTheme } from '../../contexts/ThemeContext';
import { fmt } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  const COLORS = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"10px 14px", fontSize:12 }} role="tooltip">
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
