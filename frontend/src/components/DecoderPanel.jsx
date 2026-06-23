import React from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";
import { colorFor, fieldAlpha } from "../lib/fields.js";

const ROWS = [
  { key: "opcode", color: "opcode" },
  { key: "funct3", color: "funct3" },
  { key: "funct7", color: "funct7" },
  { key: "rs1", color: "rs1" },
  { key: "rs2", color: "rs2" },
  { key: "rd", color: "rd" },
  { key: "immediate", color: "imm" },
];

function FieldRow({ row, value }) {
  const present = value !== null && value !== undefined;
  return (
    <div
      className="themed flex items-center justify-between rounded px-2.5 py-[7px]"
      style={{
        backgroundColor: present ? fieldAlpha(row.color, 0.09) : "transparent",
        borderLeft: `2px solid ${present ? colorFor(row.color) : "rgb(var(--line))"}`,
      }}
    >
      <span
        className="font-mono text-[12px] font-semibold"
        style={{ color: present ? colorFor(row.color) : "rgb(var(--ghost))" }}
      >
        {row.key}
      </span>
      <span
        className={`font-mono text-[12.5px] ${present ? "text-ice" : "text-ghost"}`}
      >
        {present ? String(value) : "—"}
      </span>
    </div>
  );
}

export default function DecoderPanel() {
  const { active } = useSimulator();
  const decode = active?.decode;
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
          {decode?.format || "—"}
        </span>
        <span className="font-mono text-[12.5px] text-muted truncate max-w-[60%]">
          {active?.text || "select an instruction"}
        </span>
      </div>
      <div className="space-y-1.5">
        {ROWS.map((row) => (
          <FieldRow
            key={row.key}
            row={row}
            value={decode ? decode[row.key] : null}
          />
        ))}
      </div>
    </div>
  );
}
