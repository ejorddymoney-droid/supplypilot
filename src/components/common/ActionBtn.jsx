import { useState } from 'react';

const ActionBtn = ({ onClick, borderColor, bgColor, textColor, children }) => {
  const [state, setState] = useState("idle");

  const handleClick = () => {
    setState("loading");
    setTimeout(() => {
      onClick();
      setState("done");
      setTimeout(() => setState("idle"), 1200);
    }, 300);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state !== "idle"}
      aria-busy={state === "loading"}
      aria-label={state === "done" ? "Action compl\u00e9t\u00e9e" : undefined}
      style={{
        padding:"3px 10px", borderRadius:5,
        border:`1px solid ${state==="done" ? "#10B981" : borderColor}`,
        background: state==="done" ? "rgba(16,185,129,0.15)" : bgColor,
        color: state==="done" ? "#10B981" : textColor,
        fontSize:10, fontWeight:600, cursor: state==="idle" ? "pointer" : "default",
        transition:"all 0.2s", minWidth:70, textAlign:"center",
        opacity: state==="loading" ? 0.6 : 1,
        backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        boxShadow: state==="done" ? "0 0 16px rgba(16,185,129,0.2)" : "none",
      }}
    >
      {state === "loading" ? "\u2026" : state === "done" ? "\u2713 OK" : children}
    </button>
  );
};

export default ActionBtn;
