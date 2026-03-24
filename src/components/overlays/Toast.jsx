const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 12,
      background: toast.type === "error" ? "#7f1d1d" : "#064e3b",
      color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      animation: "slideIn 0.3s ease",
      display: "flex", alignItems: "center", gap: 8,
      border: `1px solid ${toast.type === "error" ? "#991b1b" : "#065f46"}`,
    }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{toast.type === "error" ? "\u26D4" : "\u2713"}</span>
      {toast.msg}
    </div>
  );
};

export default Toast;
