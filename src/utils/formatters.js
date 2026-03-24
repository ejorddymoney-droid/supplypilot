const NOW = new Date();
export const TODAY = `${NOW.getFullYear()}-${String(NOW.getMonth()+1).padStart(2,'0')}-${String(NOW.getDate()).padStart(2,'0')}`;
export const TODAY_DISPLAY = NOW.toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' });
export const QUARTER = `Q${Math.ceil((NOW.getMonth()+1)/3)} ${NOW.getFullYear()}`;

export const formatDate = (d) => {
  if (!d) return "\u2014";
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt) ? d : dt.toLocaleDateString('fr-CA');
};

export const daysAgo = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate()-n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const daysFromNow = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const parseDecimal = (v) => {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(',','.')) || 0;
};

export const fmt = (n) => new Intl.NumberFormat('fr-CA').format(Math.round(n));
export const fmtM = (n) => `${(n/1000000).toFixed(1)}M`;
