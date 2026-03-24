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
            border:`1px solid ${o===selected ? COLORS.accent : COLORS.border}`,
            background: o===selected ? COLORS.accentGlow : "transparent",
            color: o===selected ? COLORS.accent : COLORS.textMuted,
            cursor:"pointer", transition:"all 0.2s",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
};

export default FilterPills;
