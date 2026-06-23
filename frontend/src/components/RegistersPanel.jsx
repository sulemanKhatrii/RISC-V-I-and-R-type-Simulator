import React from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";

// Changed registers get a static accent border + faint background that
// fades in via the global colour transition (the only motion here).
function RegisterRow({ reg }) {
  const changed = reg.changed;
  return (
    <div
      className="themed grid grid-cols-[3.6rem_1fr_4.5rem] items-center gap-2 px-3 py-[5px] rounded border-l-2"
      style={{
        borderLeftColor: changed ? "rgb(var(--accent))" : "transparent",
        backgroundColor: changed ? "rgb(var(--accent) / 0.10)" : "transparent",
      }}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[13px] font-semibold text-ice">
          {reg.name}
        </span>
        <span className="text-[10px] text-ghost">{reg.abi}</span>
      </div>
      <span
        className={`font-mono text-[12.5px] tabular-nums ${
          reg.unsigned === 0 ? "text-ghost" : "text-ice"
        }`}
      >
        {reg.hex}
      </span>
      <span className="font-mono text-[12px] tabular-nums text-right text-muted">
        {reg.signed}
      </span>
    </div>
  );
}

export default function RegistersPanel() {
  const { snapshot } = useSimulator();
  const registers = snapshot?.registers ?? [];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-[3.6rem_1fr_4.5rem] gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ghost border-b border-line">
        <span>Reg</span>
        <span>Hex</span>
        <span className="text-right">Dec</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 py-1.5 space-y-px">
        {registers.map((reg) => (
          <RegisterRow key={reg.index} reg={reg} />
        ))}
      </div>
    </div>
  );
}
