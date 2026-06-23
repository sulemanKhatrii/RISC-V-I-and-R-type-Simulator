"""
memory.py
=========
Byte-addressable, word-accessed data memory backed by a sparse dict.
"""

from .isa import MASK32, MEM_SIZE, RuntimeSimError


class Memory:
    def __init__(self, size=MEM_SIZE):
        self.size = size
        self.words = {}                    # word_address -> 32-bit value

    def _check(self, addr):
        if addr < 0 or addr + 4 > self.size:
            raise RuntimeSimError(
                "Memory access at 0x{:X} is out of range "
                "(0x0..0x{:X})".format(addr, self.size - 1))
        if addr % 4 != 0:
            raise RuntimeSimError(
                "Unaligned memory access at 0x{:X} (must be 4-byte "
                "aligned)".format(addr))

    def load_word(self, addr):
        self._check(addr)
        return self.words.get(addr, 0) & MASK32

    def store_word(self, addr, value):
        self._check(addr)
        self.words[addr] = value & MASK32

    def reset(self):
        self.words = {}
