import React from "react";

// variant: "primary" | "accent2" | "ghost" | "danger"
const VARIANTS = {
  primary: "bg-accent text-white border-transparent hover:opacity-90",
  accent2: "bg-transparent text-accent2 border-accent2/40 hover:bg-accent2/10",
  ghost: "bg-elevated text-ice border-line hover:bg-surface",
  danger: "bg-transparent text-bad border-bad/40 hover:bg-bad/10",
};

export default function ControlButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  disabled = false,
  active = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-[13px] font-medium
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${active ? "ring-1 ring-accent2/60" : ""}`}
    >
      {Icon && <Icon size={15} strokeWidth={2} />}
      <span>{label}</span>
    </button>
  );
}
