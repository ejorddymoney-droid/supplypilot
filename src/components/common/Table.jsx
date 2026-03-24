import { useTheme } from '../../contexts/ThemeContext';

export const TableContainer = ({ children, label }) => (
  <div style={{ overflowX:"auto", width:"100%" }} role="region" aria-label={label || "Table de donn\u00e9es"} tabIndex={0}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>{children}</table>
  </div>
);

export const Th = ({ children, style = {}, tip }) => {
  const COLORS = useTheme();
  return (
    <th
      title={tip}
      scope="col"
      style={{ textAlign:"left", padding:"10px 12px", color:COLORS.textMuted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${COLORS.border}`, whiteSpace:"nowrap", cursor:tip?"help":"default", ...style }}
    >
      {children}
    </th>
  );
};

export const Td = ({ children, style = {} }) => {
  const COLORS = useTheme();
  return (
    <td style={{ padding:"10px 12px", color:COLORS.text, borderBottom:`1px solid ${COLORS.border}22`, whiteSpace:"nowrap", ...style }}>
      {children}
    </td>
  );
};

export const SortableTh = ({ col, sortCol, sortDir, onSort, children, style = {}, tip }) => {
  const COLORS = useTheme();
  const isActive = sortCol === col;
  const ariaSortValue = !isActive ? "none" : sortDir === "asc" ? "ascending" : "descending";

  return (
    <th
      onClick={() => onSort(col)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(col); } }}
      title={tip}
      scope="col"
      role="columnheader"
      aria-sort={ariaSortValue}
      tabIndex={0}
      style={{
        textAlign:"left", padding:"10px 12px", fontWeight:600, fontSize:11,
        textTransform:"uppercase", letterSpacing:"0.06em",
        borderBottom:`1px solid ${COLORS.border}`, whiteSpace:"nowrap",
        cursor:"pointer", userSelect:"none",
        color: isActive ? COLORS.accent : COLORS.textMuted,
        transition:"color 0.15s", outline:"none",
        ...style,
      }}
    >
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        {children}
        <span style={{ display:"inline-flex", flexDirection:"column", lineHeight:1, fontSize:8, opacity: isActive ? 1 : 0.3, transition:"opacity 0.15s" }} aria-hidden="true">
          <span style={{ color: isActive && sortDir==="asc" ? COLORS.accent : COLORS.textDim }}>{"\u25B2"}</span>
          <span style={{ color: isActive && sortDir==="desc" ? COLORS.accent : COLORS.textDim, marginTop:-2 }}>{"\u25BC"}</span>
        </span>
      </span>
    </th>
  );
};
