import React from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";

export default function ProgramCounterPanel() {
  const { snapshot } = useSimulator();
  const pcHex = snapshot?.pc_hex ?? "0x00000000";
  const index = snapshot?.pc_index ?? 0;
  const length = Math.max(1, snapshot?.program_length ?? 1);
  const progress = Math.min(100, (index / length) * 100);
  const finished = snapshot?.finished;
  const currentText = snapshot?.current?.text;

  return (
    <div className="p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ghost mb-1">
            Program Counter
          </div>
          <div className="font-mono text-2xl font-bold tracking-tight text-ice">
            {pcHex}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ghost mb-1">
            Instr #
          </div>
          <div className="font-mono text-2xl font-bold text-ice">{index}</div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-line bg-surface/60 px-3 py-2 font-mono text-[12.5px] min-h-[2.1rem] flex items-center">
        {finished ? (
          <span className="text-warn">— program halted —</span>
        ) : currentText ? (
          <span className="text-accent2">{currentText}</span>
        ) : (
          <span className="text-ghost">no instruction</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-ghost font-mono tabular-nums">
          {index}/{length}
        </span>
      </div>
    </div>
  );
}
