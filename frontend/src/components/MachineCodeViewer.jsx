import React from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";
import { colorFor, fieldAlpha } from "../lib/fields.js";

// One colour-coded field block; width is proportional to its bit count.
function Segment({ seg, offsetBits }) {
  const width = seg.bits.length;
  const hiBit = 31 - offsetBits;
  const loBit = hiBit - width + 1;
  return (
    <div
      className="flex flex-col rounded overflow-hidden border"
      style={{
        flexGrow: width,
        flexBasis: 0,
        minWidth: 0,
        borderColor: fieldAlpha(seg.key, 0.55),
        backgroundColor: fieldAlpha(seg.key, 0.1),
      }}
      title={`${seg.label} = ${seg.value} (bits ${hiBit}:${loBit})`}
    >
      <div
        className="px-1 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide truncate"
        style={{ color: colorFor(seg.key), backgroundColor: fieldAlpha(seg.key, 0.14) }}
      >
        {seg.label}
      </div>
      <div className="px-1 py-1.5 text-center font-mono text-[12px] font-semibold tracking-[0.14em] text-ice break-all">
        {seg.bits}
      </div>
      <div className="px-1 pb-1 text-center font-mono text-[10px] text-muted truncate">
        {seg.value}
      </div>
    </div>
  );
}

export default function MachineCodeViewer() {
  const { active } = useSimulator();
  const segments = active?.machine?.segments ?? [];

  let acc = 0;
  const withOffset = segments.map((seg) => {
    const o = acc;
    acc += seg.bits.length;
    return { seg, offsetBits: o };
  });

  return (
    <div className="p-3">
      <div className="flex justify-between px-1 mb-1.5 text-[9px] font-mono text-ghost">
        <span>bit 31</span>
        <span>MSB → LSB</span>
        <span>bit 0</span>
      </div>
      <div className="flex gap-1">
        {withOffset.length ? (
          withOffset.map(({ seg, offsetBits }, i) => (
            <Segment key={i} seg={seg} offsetBits={offsetBits} />
          ))
        ) : (
          <div className="w-full text-center py-6 text-ghost text-sm">
            No instruction selected
          </div>
        )}
      </div>
    </div>
  );
}
