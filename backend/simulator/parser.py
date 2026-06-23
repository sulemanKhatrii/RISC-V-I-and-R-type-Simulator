"""
parser.py
=========
A two-pass assembler that turns multi-line assembly source into a list of
Instruction objects, resolving labels for branches.
"""

from .isa import (
    ABI_NAMES, AssemblerError,
    OPCODE_R, OPCODE_I, OPCODE_LOAD, OPCODE_STORE, OPCODE_BRANCH,
    R_TYPE, I_ARITH, LOAD_F3, STORE_F3, BRANCH_F3,
)
from .instruction import Instruction


class Parser:
    """Assembly text -> list[Instruction]."""

    def parse(self, source_text):
        raw_lines = source_text.splitlines()

        # ---- Pass 1: clean lines, collect labels & instruction lines -------
        pending = []          # (index, line_no, tokens, clean_text)
        labels = {}
        index = 0

        for line_no, raw in enumerate(raw_lines, start=1):
            clean = self._strip_comment(raw).strip()
            if not clean:
                continue
            clean = self._extract_labels(clean, line_no, labels, index)
            if not clean:
                continue
            pending.append((index, line_no, self._tokenize(clean), clean))
            index += 1

        # ---- Pass 2: build instructions ------------------------------------
        return [self._build(i, ln, tk, txt, labels)
                for (i, ln, tk, txt) in pending]

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _strip_comment(line):
        for marker in ("#", "//"):
            pos = line.find(marker)
            if pos != -1:
                line = line[:pos]
        return line

    @staticmethod
    def _extract_labels(clean, line_no, labels, index):
        while ":" in clean:
            label_part, _, rest = clean.partition(":")
            label = label_part.strip()
            if not label or " " in label:
                raise AssemblerError("Invalid label '{}'".format(label_part),
                                     line_no)
            if label in labels:
                raise AssemblerError("Duplicate label '{}'".format(label),
                                     line_no)
            labels[label] = index
            clean = rest.strip()
        return clean

    @staticmethod
    def _tokenize(clean):
        return [t for t in clean.replace(",", " ").split() if t]

    @staticmethod
    def _reg(token, line_no):
        t = token.strip().lower()
        if t in ABI_NAMES:
            return ABI_NAMES[t]
        if t.startswith("x") and t[1:].isdigit():
            num = int(t[1:])
            if 0 <= num <= 31:
                return num
            raise AssemblerError(
                "Invalid register '{}' (must be x0..x31)".format(token), line_no)
        raise AssemblerError("Invalid register '{}'".format(token), line_no)

    @staticmethod
    def _imm(token, line_no, bits, signed=True):
        try:
            value = int(token.strip(), 0)
        except ValueError:
            raise AssemblerError("Invalid immediate '{}'".format(token), line_no)
        if signed:
            lo, hi = -(1 << (bits - 1)), (1 << (bits - 1)) - 1
            if not (lo <= value <= hi):
                raise AssemblerError(
                    "Immediate {} out of range for {}-bit field "
                    "[{}, {}]".format(value, bits, lo, hi), line_no)
        return value

    @staticmethod
    def _mem(token, line_no):
        if "(" not in token or not token.endswith(")"):
            raise AssemblerError(
                "Invalid memory operand '{}' (expected offset(reg))".format(token),
                line_no)
        offset_str, _, rest = token.partition("(")
        return (offset_str.strip() or "0"), rest[:-1]

    @staticmethod
    def _need(tokens, count, line_no):
        if len(tokens) != count + 1:
            raise AssemblerError(
                "'{}' expects {} operand(s), got {}".format(
                    tokens[0], count, len(tokens) - 1), line_no)

    # -- build one instruction ----------------------------------------------

    def _build(self, index, line_no, tokens, clean, labels):
        mnem = tokens[0].lower()

        if mnem in R_TYPE:
            self._need(tokens, 3, line_no)
            funct3, funct7 = R_TYPE[mnem]
            return Instruction(mnem, "R", OPCODE_R, line_no, clean,
                               rd=self._reg(tokens[1], line_no),
                               rs1=self._reg(tokens[2], line_no),
                               rs2=self._reg(tokens[3], line_no),
                               funct3=funct3, funct7=funct7)

        if mnem in I_ARITH:
            self._need(tokens, 3, line_no)
            return Instruction(mnem, "I", OPCODE_I, line_no, clean,
                               rd=self._reg(tokens[1], line_no),
                               rs1=self._reg(tokens[2], line_no),
                               imm=self._imm(tokens[3], line_no, 12),
                               funct3=I_ARITH[mnem])

        if mnem in LOAD_F3:
            self._need(tokens, 2, line_no)
            rd = self._reg(tokens[1], line_no)
            offset, reg = self._mem(tokens[2], line_no)
            return Instruction(mnem, "I", OPCODE_LOAD, line_no, clean,
                               rd=rd, rs1=self._reg(reg, line_no),
                               imm=self._imm(offset, line_no, 12),
                               funct3=LOAD_F3[mnem])

        if mnem in STORE_F3:
            self._need(tokens, 2, line_no)
            rs2 = self._reg(tokens[1], line_no)
            offset, reg = self._mem(tokens[2], line_no)
            return Instruction(mnem, "S", OPCODE_STORE, line_no, clean,
                               rs1=self._reg(reg, line_no), rs2=rs2,
                               imm=self._imm(offset, line_no, 12),
                               funct3=STORE_F3[mnem])

        if mnem in BRANCH_F3:
            self._need(tokens, 3, line_no)
            rs1 = self._reg(tokens[1], line_no)
            rs2 = self._reg(tokens[2], line_no)
            target = tokens[3]
            label_name = None
            if target in labels:
                imm = (labels[target] - index) * 4
                label_name = target
            else:
                try:
                    imm = self._imm(target, line_no, 13)
                except AssemblerError:
                    raise AssemblerError(
                        "Unknown label or invalid offset '{}'".format(target),
                        line_no)
            if imm % 2 != 0:
                raise AssemblerError("Branch offset must be even", line_no)
            return Instruction(mnem, "B", OPCODE_BRANCH, line_no, clean,
                               rs1=rs1, rs2=rs2, imm=imm,
                               funct3=BRANCH_F3[mnem], label=label_name)

        raise AssemblerError("Unknown instruction '{}'".format(tokens[0]),
                             line_no)
