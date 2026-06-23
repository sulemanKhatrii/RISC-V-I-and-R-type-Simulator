import React from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";
import { colorFor, fieldAlpha } from "../lib/fields.js";

const TEMPLATES = {
  R: {
    label: "R-Type",
    fields: [
      { key: "funct7", label: "funct7", bits: 7 },
      { key: "rs2", label: "rs2", bits: 5 },
      { key: "rs1", label: "rs1", bits: 5 },
      { key: "funct3", label: "funct3", bits: 3 },
      { key: "rd", label: "rd", bits: 5 },
      { key: "opcode", label: "opcode", bits: 7 },
    ],
  },
  I: {
    label: "I-Type",
    fields: [
      { key: "imm", label: "imm[11:0]", bits: 12 },
      { key: "rs1", label: "rs1", bits: 5 },
      { key: "funct3", label: "funct3", bits: 3 },
      { key: "rd", label: "rd", bits: 5 },
      { key: "opcode", label: "opcode", bits: 7 },
    ],
  },
};

function Template({ tpl, activeFmt }) {
  const isActive =
    (tpl.id === "R" && activeFmt === "R") ||
    (tpl.id === "I" && ["I", "S", "B"].includes(activeFmt));
  return (
    <div
      className="rounded border border-line p-2"
      style={{ opacity: isActive ? 1 : 0.45 }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-[11px] font-semibold ${
            isActive ? "text-ice" : "text-ghost"
          }`}
        >
          {tpl.label}
        </span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
      </div>
      <div className="flex gap-1">
        {tpl.fields.map((f) => (
          <div
            key={f.label}
            style={{ flexGrow: f.bits, flexBasis: 0 }}
            className="flex flex-col items-center"
          >
            <div
              className="w-full border rounded px-0.5 py-1 text-center"
              style={{
                backgroundColor: isActive
                  ? fieldAlpha(f.key, 0.14)
                  : "rgb(var(--elevated) / 0.6)",
                borderColor: isActive ? fieldAlpha(f.key, 0.5) : "rgb(var(--line))",
              }}
            >
              <div
                className="text-[9px] font-semibold truncate"
                style={{ color: isActive ? colorFor(f.key) : "rgb(var(--ghost))" }}
              >
                {f.label}
              </div>
              <div className="text-[8px] text-ghost font-mono">{f.bits}b</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InstructionFormatViz() {
  const { active } = useSimulator();
  const fmt = active?.fmt;
  return (
    <div className="p-3 space-y-2">
      <Template tpl={{ id: "R", ...TEMPLATES.R }} activeFmt={fmt} />
      <Template tpl={{ id: "I", ...TEMPLATES.I }} activeFmt={fmt} />
      {(fmt === "S" || fmt === "B") && (
        <p className="text-[10px] text-ghost leading-snug">
          Note: {fmt === "S" ? "sw uses the S-Type" : "branches use the B-Type"}{" "}
          encoding — a variant with a split immediate (see the machine code
          viewer for the exact field split).
        </p>
      )}
    </div>
  );
}
