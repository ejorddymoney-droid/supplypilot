import { useTheme } from '../../contexts/ThemeContext';

const FilterPills = ({ options, selected, onSelect, label = "Filtres" }) => {
  const COLORS = useTheme();
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }} role="group" aria-label={label}>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onSelect(o === selected ? null : o)}
          aria-pressed={o === selected}
          style={{
            padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:500,
            border:`1px solid ${o===selected ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
            background: o===selected ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
            color: o===selected ? COLORS.accent : COLORS.textMuted,
            cursor:"pointer", transition:"all 0.2s",
            backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
            boxShadow: o===selected ? "0 0 16px rgba(16,185,129,0.12)" : "none",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
};

export default FilterPills;
