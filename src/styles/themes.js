export const THEMES = {
  dark: {
    // Base palette — deepened for mesh contrast
    bg: "#080B14",
    surface: "rgba(255,255,255,0.03)",
    card: "rgba(255,255,255,0.04)",
    cardHover: "rgba(255,255,255,0.07)",
    border: "rgba(255,255,255,0.08)",
    borderLight: "rgba(255,255,255,0.12)",
    text: "#E8ECF4",
    textMuted: "#8B95B0",
    textDim: "#5C6682",
    accent: "#10B981",
    accentDim: "#065F46",
    accentGlow: "rgba(16,185,129,0.15)",
    danger: "#EF4444",
    dangerDim: "rgba(239,68,68,0.12)",
    warning: "#F59E0B",
    warningDim: "rgba(245,158,11,0.12)",
    info: "#3B82F6",
    infoDim: "rgba(59,130,246,0.12)",
    purple: "#8B5CF6",
    purpleDim: "rgba(139,92,246,0.12)",

    // Glass tokens
    glass: {
      bg: "rgba(255,255,255,0.04)",
      bgHover: "rgba(255,255,255,0.07)",
      bgIntense: "rgba(255,255,255,0.06)",
      blur: "16px",
      blurHeavy: "24px",
      border: "rgba(255,255,255,0.08)",
      borderHover: "rgba(255,255,255,0.14)",
      borderHighlight: "rgba(255,255,255,0.10)",
      innerShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
    },

    // Glow presets per semantic color
    glow: {
      accent: "0 0 30px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.05)",
      accentHover: "0 0 40px rgba(16,185,129,0.25), 0 0 80px rgba(16,185,129,0.08)",
      danger: "0 0 30px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.05)",
      dangerHover: "0 0 40px rgba(239,68,68,0.25)",
      warning: "0 0 30px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)",
      warningHover: "0 0 40px rgba(245,158,11,0.25)",
      info: "0 0 30px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)",
      infoHover: "0 0 40px rgba(59,130,246,0.25)",
      purple: "0 0 30px rgba(139,92,246,0.15), 0 0 60px rgba(139,92,246,0.05)",
    },

    // Gradient mesh background
    meshBg: [
      "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(16,185,129,0.07) 0%, transparent 60%)",
      "radial-gradient(ellipse 60% 80% at 85% 75%, rgba(59,130,246,0.06) 0%, transparent 55%)",
      "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 50%)",
      "linear-gradient(180deg, #080B14 0%, #0A0E1A 50%, #080B14 100%)",
    ].join(", "),
  },
};
