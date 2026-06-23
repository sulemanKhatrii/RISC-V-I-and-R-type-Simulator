"""
isa.py
======
Constants, lookup tables and small helpers shared across the simulator.

This is the single source of truth for the supported instruction set
(a small subset of RV32I) and the two's-complement helpers used everywhere.
"""

# ---------------------------------------------------------------------------
# Machine parameters
# ---------------------------------------------------------------------------
MASK32 = 0xFFFFFFFF       # mask used to keep every value 32-bit
MEM_SIZE = 4096           # bytes of simulated data memory
MAX_STEPS = 200_000       # infinite-loop guard for "run to completion"

# ---------------------------------------------------------------------------
# Opcodes (7-bit) per instruction family
# ---------------------------------------------------------------------------
OPCODE_R = 0b0110011
OPCODE_I = 0b0010011
OPCODE_LOAD = 0b0000011
OPCODE_STORE = 0b0100011
OPCODE_BRANCH = 0b1100011

# R-Type:  mnemonic -> (funct3, funct7)
R_TYPE = {
    "add": (0x0, 0x00),
    "sub": (0x0, 0x20),
    "sll": (0x1, 0x00),
    "slt": (0x2, 0x00),
    "xor": (0x4, 0x00),
    "srl": (0x5, 0x00),
    "or":  (0x6, 0x00),
    "and": (0x7, 0x00),
}

# I-Type arithmetic:  mnemonic -> funct3
I_ARITH = {
    "addi": 0x0,
    "slti": 0x2,
    "xori": 0x4,
    "ori":  0x6,
    "andi": 0x7,
}

LOAD_F3 = {"lw": 0x2}                 # load funct3
STORE_F3 = {"sw": 0x2}                # store funct3
BRANCH_F3 = {"beq": 0x0, "bne": 0x1}  # branch funct3

# ---------------------------------------------------------------------------
# Register naming
# ---------------------------------------------------------------------------
# Canonical ABI name for every register number (used for display).
CANON_ABI = [
    "zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
    "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
    "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
    "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6",
]

# Accept ABI names *and* xN when parsing assembly.
ABI_NAMES = {name: num for num, name in enumerate(CANON_ABI)}
ABI_NAMES["fp"] = 8  # fp is an alias for s0


# ---------------------------------------------------------------------------
# Two's-complement helpers
# ---------------------------------------------------------------------------
def to_signed32(value):
    """Interpret a 32-bit pattern as a signed integer."""
    value &= MASK32
    return value - (1 << 32) if value & 0x80000000 else value


def to_unsigned32(value):
    """Reduce any integer to its 32-bit unsigned representation."""
    return value & MASK32


def bin_field(value, width):
    """Fixed-width binary string of the low `width` bits of `value`."""
    return format(value & ((1 << width) - 1), "0{}b".format(width))


# ---------------------------------------------------------------------------
# Error types
# ---------------------------------------------------------------------------
class AssemblerError(Exception):
    """Raised for parse / encode problems. Carries an optional line number."""

    def __init__(self, message, line=None):
        self.line = line
        super().__init__(message)

    def pretty(self):
        if self.line is not None:
            return "Line {}: {}".format(self.line, super().__str__())
        return super().__str__()


class RuntimeSimError(Exception):
    """Raised for problems that surface only during execution."""
