export const TOKENS = {
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px' },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  fontSize: { xs: 10, sm: 11, md: 12, base: 13, lg: 14, xl: 16, '2xl': 18, '3xl': 22, '4xl': 28, '5xl': 34 },
  fontWeight: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1, snug: 1.2, normal: 1.5, relaxed: 1.75 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.15)',
    md: '0 4px 12px rgba(0,0,0,0.2)',
    lg: '0 10px 30px rgba(0,0,0,0.25)',
    xl: '0 20px 60px rgba(0,0,0,0.5)',
    glass: '0 8px 32px rgba(0,0,0,0.3)',
    glassHover: '0 12px 40px rgba(0,0,0,0.4)',
  },
  transition: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease',
    spring: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  animation: {
    staggerBase: 60,
    entranceDuration: '0.5s',
    entranceEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  zIndex: { base: 0, dropdown: 100, sticky: 200, modal: 1000, overlay: 1001, slideOver: 1002, toast: 1100 },
};
