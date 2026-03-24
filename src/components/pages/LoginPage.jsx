import { useState } from 'react';
import { THEMES } from '../../styles/themes';
import { USERS, APP_VERSION } from '../../data/constants';

const LoginPage = ({ onLogin }) => {
  const COLORS = THEMES.dark;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Identifiants invalides"); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: 420, padding: 40, background: COLORS.card, borderRadius: 24, border: `1px solid ${COLORS.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em" }}>SupplyPilot</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, letterSpacing: "0.04em" }}>PROCUREMENT HUB · {APP_VERSION}</div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Connexion</div>
        <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 24 }}>Entrez vos identifiants pour accéder à l'application</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="login-user" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Nom d'utilisateur</label>
            <input id="login-user" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin ou entrepot" autoComplete="username"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#10B981"} onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-pw" style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Mot de passe</label>
            <input id="login-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#10B981"} onBlur={e => e.target.style.borderColor = COLORS.border} />
          </div>
          {error && <div role="alert" style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 12, fontWeight: 500, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading || !username || !password}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (loading || !username || !password) ? 0.6 : 1, fontFamily: "inherit" }}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <div style={{ marginTop: 24, padding: 16, background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Comptes démo</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Admin complet", "admin / admin123"], ["Chef entrepôt", "entrepot / entrepot123"], ["Préposée entrepôt", "sophie / sophie123"]].map(([label, cred]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: COLORS.textMuted }}>{label}</span>
                <span style={{ color: COLORS.accent, fontFamily: "monospace" }}>{cred}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; }input::placeholder { color: #5C6682; }`}</style>
    </div>
  );
};

export default LoginPage;
