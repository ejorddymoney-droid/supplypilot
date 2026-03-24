import { useTheme } from '../../contexts/ThemeContext';

const Card = ({ title, children, style = {}, headerRight, onTitleClick }) => {
  const COLORS = useTheme();
  return (
    <section
      style={{
        background:COLORS.card, borderRadius:16, border:`1px solid ${COLORS.border}`, overflow:"hidden",
        boxShadow: COLORS.isLight ? "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" : "none",
        transition:"background 0.35s, border-color 0.35s, box-shadow 0.35s", ...style,
      }}
      aria-label={title || undefined}
    >
      {title && (
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {onTitleClick ? (
            <button
              onClick={onTitleClick}
              style={{ fontSize:14, fontWeight:600, color:COLORS.text, letterSpacing:"0.01em", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"color 0.15s", background:"transparent", border:"none", padding:0, fontFamily:"inherit" }}
              onMouseEnter={e => e.currentTarget.style.color = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.color = COLORS.text}
            >
              <h2 style={{ fontSize:"inherit", fontWeight:"inherit", margin:0 }}>{title}</h2>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity:0.4 }} aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            </button>
          ) : (
            <h2 style={{ fontSize:14, fontWeight:600, color:COLORS.text, letterSpacing:"0.01em", margin:0 }}>{title}</h2>
          )}
          {headerRight}
        </div>
      )}
      <div style={{ padding:"16px 20px" }}>{children}</div>
    </section>
  );
};

export default Card;
