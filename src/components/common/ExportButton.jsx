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
        padding:"4px 12px", borderRadius:8, border:`1px solid ${COLORS.border}`, background:"transparent",
        color:COLORS.textMuted, fontSize:11, fontWeight:500, cursor:"pointer",
        display:"flex", alignItems:"center", gap:5, transition:"all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
    >
      <Icon name="download" size={12} />
      CSV
    </button>
  );
};

export default ExportButton;
