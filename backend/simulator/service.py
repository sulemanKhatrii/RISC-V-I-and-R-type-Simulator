"""
service.py
==========
A thin stateful layer on top of CPU that the REST API talks to.

It owns a single CPU instance, tracks which registers / memory cells changed
between snapshots (so the UI can animate them), and produces JSON-friendly
state dictionaries.
"""

from .isa import CANON_ABI, MEM_SIZE, to_signed32, to_unsigned32
from .parser import Parser
from .cpu import CPU


# A small default window of memory always shown in the UI.
DEFAULT_MEM_WINDOW = list(range(0, 0x40, 4))


class SimulatorService:
    def __init__(self):
        self.cpu = CPU()
        self.parser = Parser()
        self.assembled = False

    # -- program -------------------------------------------------------------

    def assemble(self, code):
        """Parse + load a program. Returns the decoded instruction list."""
        program = self.parser.parse(code)
        self.cpu.load_program(program)
        self.assembled = bool(program)
        return [ins.to_dict(index=i) for i, ins in enumerate(program)]

    def decode_one(self, text):
        """Decode a single instruction line (for click-to-inspect)."""
        program = self.parser.parse(text)
        if not program:
            return None
        return program[0].to_dict(index=0)

    # -- snapshots -----------------------------------------------------------

    def registers_view(self, changed=()):
        out = []
        for i in range(32):
            value = self.cpu.registers.read(i)
            out.append({
                "index": i,
                "name": "x{}".format(i),
                "abi": CANON_ABI[i],
                "hex": "0x{:08X}".format(value),
                "unsigned": to_unsigned32(value),
                "signed": to_signed32(value),
                "changed": i in changed,
            })
        return out

    def memory_view(self, changed=()):
        addresses = sorted(set(DEFAULT_MEM_WINDOW) | set(self.cpu.memory.words))
        out = []
        for addr in addresses:
            value = self.cpu.memory.load_word(addr)
            out.append({
                "addr": addr,
                "addr_hex": "0x{:04X}".format(addr),
                "hex": "0x{:08X}".format(value),
                "unsigned": to_unsigned32(value),
                "signed": to_signed32(value),
                "changed": addr in changed,
            })
        return out

    def snapshot(self, changed_regs=(), changed_mem=(), prev_pc=None):
        instr = self.cpu.current_instruction()
        return {
            "pc": self.cpu.pc,
            "pc_hex": "0x{:08X}".format(self.cpu.pc),
            "pc_index": self.cpu.current_index(),
            "prev_pc": prev_pc,
            "steps": self.cpu.steps,
            "program_length": len(self.cpu.program),
            "finished": self.cpu.finished(),
            "assembled": self.assembled,
            "registers": self.registers_view(changed_regs),
            "memory": self.memory_view(changed_mem),
            "current": instr.to_dict(index=self.cpu.current_index())
                       if instr else None,
        }

    # -- controls ------------------------------------------------------------

    def step(self):
        prev_pc = self.cpu.pc
        before_regs = list(self.cpu.registers.regs)
        before_mem = dict(self.cpu.memory.words)

        moved = self.cpu.step()

        changed_regs = {i for i in range(32)
                        if self.cpu.registers.regs[i] != before_regs[i]}
        changed_mem = {a for a, v in self.cpu.memory.words.items()
                       if before_mem.get(a) != v}
        snap = self.snapshot(changed_regs, changed_mem, prev_pc)
        snap["moved"] = moved
        return snap

    def run(self):
        prev_pc = self.cpu.pc
        before_regs = list(self.cpu.registers.regs)
        before_mem = dict(self.cpu.memory.words)

        executed = self.cpu.run()

        changed_regs = {i for i in range(32)
                        if self.cpu.registers.regs[i] != before_regs[i]}
        changed_mem = {a for a, v in self.cpu.memory.words.items()
                       if before_mem.get(a) != v}
        snap = self.snapshot(changed_regs, changed_mem, prev_pc)
        snap["executed"] = executed
        return snap

    def reset(self):
        self.cpu.reset(keep_program=True)
        return self.snapshot()
