"""
alu.py
======
The arithmetic / logic unit. Every result is reduced to 32 bits.
"""

from .isa import MASK32, to_signed32, RuntimeSimError


class ALU:
    """Performs the integer operations used by the CPU."""

    def execute(self, op, a, b):
        a &= MASK32
        b &= MASK32
        if op == "add":
            return (a + b) & MASK32
        if op == "sub":
            return (a - b) & MASK32
        if op == "and":
            return a & b
        if op == "or":
            return a | b
        if op == "xor":
            return a ^ b
        if op == "sll":
            return (a << (b & 0x1F)) & MASK32
        if op == "srl":
            return (a & MASK32) >> (b & 0x1F)
        if op == "slt":
            return 1 if to_signed32(a) < to_signed32(b) else 0
        raise RuntimeSimError("ALU received unknown operation '{}'".format(op))
