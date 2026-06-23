// fields.js — design tokens for instruction bit-fields.
//
// Each field has one colour, defined as a CSS variable so it adapts to the
// active theme (see index.css). Helpers return theme-aware colour strings.

export const FIELD_VARS = {
  opcode: "--f-opcode",
  rd: "--f-rd",
  funct3: "--f-funct3",
  funct7: "--f-funct7",
  rs1: "--f-rs1",
  rs2: "--f-rs2",
  imm: "--f-imm",
};

// Solid colour for a field key, e.g. "rgb(var(--f-opcode))".
export const colorFor = (key) =>
  FIELD_VARS[key] ? `rgb(var(${FIELD_VARS[key]}))` : "rgb(var(--muted))";

// Translucent colour for a field key, e.g. "rgb(var(--f-opcode) / 0.1)".
export const fieldAlpha = (key, a) =>
  FIELD_VARS[key]
    ? `rgb(var(${FIELD_VARS[key]}) / ${a})`
    : `rgb(var(--muted) / ${a})`;

export const SAMPLE_PROGRAM = `# Sum 1..3 into x3, store the result, read it back
        addi x1, x0, 3      # n = 3
        addi x2, x0, 0      # i = 0
        addi x3, x0, 0      # sum = 0
loop:   addi x2, x2, 1      # i = i + 1
        add  x3, x3, x2     # sum += i
        bne  x2, x1, loop   # repeat while i != n
        sw   x3, 0(x0)      # mem[0] = sum
        lw   x4, 0(x0)      # x4 = mem[0]
`;
