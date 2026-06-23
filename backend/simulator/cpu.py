"""
cpu.py
======
Ties the register file, ALU and memory together and drives execution.

Instructions live at byte addresses 0, 4, 8, ...; PC // 4 indexes them.
"""

from .isa import (
    MASK32, MAX_STEPS, to_signed32,
    OPCODE_I, OPCODE_LOAD, OPCODE_STORE, OPCODE_BRANCH, RuntimeSimError,
)
from .register_file import RegisterFile
from .memory import Memory
from .alu import ALU

# Maps the "immediate" variants back to their base ALU operation.
I_TO_ALU = {"addi": "add", "andi": "and", "ori": "or",
            "xori": "xor", "slti": "slt"}


class CPU:
    def __init__(self):
        self.registers = RegisterFile()
        self.memory = Memory()
        self.alu = ALU()
        self.program = []          # list[Instruction]
        self.pc = 0                # bytes
        self.steps = 0
        self.halted = True

    # -- program management --------------------------------------------------

    def load_program(self, instructions):
        self.program = instructions
        self.reset(keep_program=True)

    def reset(self, keep_program=False):
        self.registers.reset()
        self.memory.reset()
        self.pc = 0
        self.steps = 0
        if keep_program:
            self.halted = not bool(self.program)
        else:
            self.program = []
            self.halted = True

    # -- introspection -------------------------------------------------------

    def current_index(self):
        return self.pc // 4

    def current_instruction(self):
        idx = self.current_index()
        return self.program[idx] if 0 <= idx < len(self.program) else None

    def finished(self):
        return self.current_index() >= len(self.program)

    # -- execution -----------------------------------------------------------

    def step(self):
        """Execute one instruction. Returns False if already finished."""
        if self.finished():
            self.halted = True
            return False

        self.steps += 1
        if self.steps > MAX_STEPS:
            raise RuntimeSimError(
                "Maximum step count exceeded ({}). Possible infinite "
                "loop.".format(MAX_STEPS))

        instr = self.program[self.current_index()]
        next_pc = self.pc + 4

        if instr.fmt == "R":
            a = self.registers.read(instr.rs1)
            b = self.registers.read(instr.rs2)
            self.registers.write(instr.rd, self.alu.execute(instr.mnemonic, a, b))

        elif instr.fmt == "I" and instr.opcode == OPCODE_I:
            a = self.registers.read(instr.rs1)
            op = I_TO_ALU[instr.mnemonic]
            self.registers.write(instr.rd,
                                 self.alu.execute(op, a, instr.imm & MASK32))

        elif instr.opcode == OPCODE_LOAD:
            addr = (self.registers.read(instr.rs1) + instr.imm) & MASK32
            self.registers.write(instr.rd, self.memory.load_word(addr))

        elif instr.opcode == OPCODE_STORE:
            addr = (self.registers.read(instr.rs1) + instr.imm) & MASK32
            self.memory.store_word(addr, self.registers.read(instr.rs2))

        elif instr.opcode == OPCODE_BRANCH:
            a = self.registers.read(instr.rs1)
            b = self.registers.read(instr.rs2)
            take = (a == b) if instr.mnemonic == "beq" else (a != b)
            if take:
                next_pc = self.pc + instr.imm

        else:
            raise RuntimeSimError(
                "Cannot execute instruction '{}'".format(instr.text))

        self.pc = next_pc & MASK32
        if self.finished():
            self.halted = True
        return True

    def run(self):
        executed = 0
        while not self.finished():
            self.step()
            executed += 1
        self.halted = True
        return executed
