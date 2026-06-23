import React from "react";

const MAP = {
  idle: { label: "Idle", varName: "--ghost" },
  ready: { label: "Ready", varName: "--good" },
  running: { label: "Running", varName: "--accent2" },
  halted: { label: "Halted", varName: "--warn" },
  error: { label: "Error", varName: "--bad" },
};

export default function StatusPill({ status }) {
  const s = MAP[status] || MAP.idle;
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1">
      <span
        className="block w-2 h-2 rounded-full"
        style={{ backgroundColor: `rgb(var(${s.varName}))` }}
      />
      <span className="text-[12px] font-medium tracking-wide text-muted">
        {s.label}
      </span>
    </div>
  );
}
