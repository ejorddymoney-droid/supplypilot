import { useTheme } from '../../contexts/ThemeContext';
import { exportCSV } from '../../utils/csv';
import Icon from './Icon';

const ExportButton = ({ data, columns, filename }) => {
  const COLORS = useTheme();
  return (
    <button
      onClick={() => exportCSV(data, columns, filename)}
      aria-label={`Exporter ${filename} en CSV`}
      style={{
        padding:"4px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)",
        backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        color:COLORS.textMuted, fontSize:11, fontWeight:500, cursor:"pointer",
        display:"flex", alignItems:"center", gap:5, transition:"all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; e.currentTarget.style.boxShadow = "0 0 12px rgba(16,185,129,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = COLORS.textMuted; e.currentTarget.style.boxShadow = "none"; }}
    >
      <Icon name="download" size={12} />
      CSV
    </button>
  );
};

export default ExportButton;
