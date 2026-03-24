const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 12,
      background: toast.type === "error" ? "rgba(127,29,29,0.85)" : "rgba(6,78,59,0.85)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 999,
      boxShadow: toast.type === "error"
        ? "0 8px 24px rgba(239,68,68,0.2), 0 0 40px rgba(239,68,68,0.1)"
        : "0 8px 24px rgba(16,185,129,0.2), 0 0 40px rgba(16,185,129,0.1)",
      animation: "slideIn 0.3s ease",
      display: "flex", alignItems: "center", gap: 8,
      border: toast.type === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
    }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{toast.type === "error" ? "\u26D4" : "\u2713"}</span>
      {toast.msg}
    </div>
  );
};

export default Toast;
