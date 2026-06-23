// highlight.jsx — a tiny assembly tokenizer for the editor overlay.
// Token colours use CSS variables so they adapt to the active theme.

import React from "react";

const MNEMONICS = new Set([
  "add", "sub", "and", "or", "xor", "sll", "srl", "slt",
  "addi", "andi", "ori", "xori", "slti", "lw", "sw", "beq", "bne",
]);

const TOKEN_STYLE = {
  comment: { color: "rgb(var(--syn-comment))", fontStyle: "italic" },
  label: { color: "rgb(var(--syn-label))", fontWeight: 600 },
  mnemonic: { color: "rgb(var(--syn-keyword))", fontWeight: 600 },
  reg: { color: "rgb(var(--syn-reg))" },
  imm: { color: "rgb(var(--syn-imm))" },
  punct: { color: "rgb(var(--syn-punct))" },
  text: { color: "rgb(var(--syn-text))" },
};

const isReg = (t) =>
  /^x([0-9]|[12][0-9]|3[01])$/i.test(t) ||
  /^(zero|ra|sp|gp|tp|fp|t[0-6]|s([0-9]|1[01])|a[0-7])$/i.test(t);

const isImm = (t) => /^-?(0x[0-9a-f]+|\d+)$/i.test(t);

export function highlightLine(line, keyPrefix) {
  let code = line;
  let comment = "";
  const cIdx = (() => {
    const h = line.indexOf("#");
    const s = line.indexOf("//");
    const cands = [h, s].filter((i) => i >= 0);
    return cands.length ? Math.min(...cands) : -1;
  })();
  if (cIdx >= 0) {
    code = line.slice(0, cIdx);
    comment = line.slice(cIdx);
  }

  const nodes = [];
  const parts = code.split(/(\s+|,|\(|\))/);
  let seenMnemonic = false;

  parts.forEach((part, i) => {
    if (part === "") return;
    if (/^\s+$/.test(part)) {
      nodes.push(
        <span key={`${keyPrefix}-w${i}`} style={{ whiteSpace: "pre" }}>
          {part}
        </span>
      );
      return;
    }
    let cls = "text";
    if (part === "," || part === "(" || part === ")") cls = "punct";
    else if (part.endsWith(":")) cls = "label";
    else if (!seenMnemonic && MNEMONICS.has(part.toLowerCase())) {
      cls = "mnemonic";
      seenMnemonic = true;
    } else if (isReg(part)) cls = "reg";
    else if (isImm(part)) cls = "imm";
    nodes.push(
      <span key={`${keyPrefix}-t${i}`} style={TOKEN_STYLE[cls]}>
        {part}
      </span>
    );
  });

  if (comment) {
    nodes.push(
      <span key={`${keyPrefix}-c`} style={TOKEN_STYLE.comment}>
        {comment}
      </span>
    );
  }
  if (nodes.length === 0)
    nodes.push(<span key={`${keyPrefix}-empty`}>{" "}</span>);
  return nodes;
}
