"""
register_file.py
================
The 32 general-purpose registers. x0 is hard-wired to zero.
"""

from .isa import MASK32, RuntimeSimError


class RegisterFile:
    def __init__(self):
        self.regs = [0] * 32

    def read(self, num):
        if not (0 <= num <= 31):
            raise RuntimeSimError("Register x{} does not exist".format(num))
        return 0 if num == 0 else self.regs[num] & MASK32

    def write(self, num, value):
        if not (0 <= num <= 31):
            raise RuntimeSimError("Register x{} does not exist".format(num))
        if num != 0:                       # writes to x0 are discarded
            self.regs[num] = value & MASK32

    def reset(self):
        self.regs = [0] * 32
