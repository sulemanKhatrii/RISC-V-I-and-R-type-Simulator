"""
instruction.py
==============
A single decoded instruction, plus everything needed to turn it into a
32-bit machine word and to describe its bit-fields for the UI.
"""

from .isa import (
    MASK32, CANON_ABI, AssemblerError,
    OPCODE_R, OPCODE_I, OPCODE_LOAD, OPCODE_STORE, OPCODE_BRANCH,
    bin_field,
)

# Format -> friendly label shown in the decoder.
FORMAT_LABEL = {"R": "R-Type", "I": "I-Type", "S": "S-Type", "B": "B-Type"}


class Instruction:
    """Holds the decoded fields of one instruction and encodes itself."""

    def __init__(self, mnemonic, fmt, opcode, source_line, text,
                 rd=None, rs1=None, rs2=None, imm=None,
                 funct3=None, funct7=None, label=None):
        self.mnemonic = mnemonic
        self.fmt = fmt                 # 'R', 'I', 'S' or 'B'
        self.opcode = opcode
        self.source_line = source_line
        self.text = text
        self.rd = rd
        self.rs1 = rs1
        self.rs2 = rs2
        self.imm = imm                 # signed Python int
        self.funct3 = funct3
        self.funct7 = funct7
        self.label = label

    # -- encoding ------------------------------------------------------------

    def encode(self):
        """Return the 32-bit machine code as an int."""
        if self.fmt == "R":
            return ((self.funct7 & 0x7F) << 25 | (self.rs2 & 0x1F) << 20 |
                    (self.rs1 & 0x1F) << 15 | (self.funct3 & 0x7) << 12 |
                    (self.rd & 0x1F) << 7 | self.opcode)

        if self.fmt == "I":
            imm = self.imm & 0xFFF
            return (imm << 20 | (self.rs1 & 0x1F) << 15 |
                    (self.funct3 & 0x7) << 12 | (self.rd & 0x1F) << 7 |
                    self.opcode)

        if self.fmt == "S":
            imm = self.imm & 0xFFF
            return (((imm >> 5) & 0x7F) << 25 | (self.rs2 & 0x1F) << 20 |
                    (self.rs1 & 0x1F) << 15 | (self.funct3 & 0x7) << 12 |
                    (imm & 0x1F) << 7 | self.opcode)

        if self.fmt == "B":
            imm = self.imm & 0x1FFF
            return (((imm >> 12) & 1) << 31 | ((imm >> 5) & 0x3F) << 25 |
                    (self.rs2 & 0x1F) << 20 | (self.rs1 & 0x1F) << 15 |
                    (self.funct3 & 0x7) << 12 | ((imm >> 1) & 0xF) << 8 |
                    ((imm >> 11) & 1) << 7 | self.opcode)

        raise AssemblerError("Cannot encode format '{}'".format(self.fmt),
                             self.source_line)

    def machine_binary(self):
        return bin_field(self.encode(), 32)

    def machine_hex(self):
        return "0x{:08X}".format(self.encode())

    # -- decoder fields ------------------------------------------------------

    def decode_fields(self):
        """Dictionary of decoded fields for the decoder panel."""
        def reg(n):
            return None if n is None else "x{}".format(n)

        return {
            "format": FORMAT_LABEL[self.fmt],
            "opcode": bin_field(self.opcode, 7),
            "funct3": None if self.funct3 is None else bin_field(self.funct3, 3),
            "funct7": None if self.funct7 is None else bin_field(self.funct7, 7),
            "rs1": reg(self.rs1),
            "rs2": reg(self.rs2),
            "rd": reg(self.rd),
            "immediate": None if self.imm is None else self.imm,
        }

    # -- machine-code field segmentation (MSB -> LSB) ------------------------

    def field_segments(self):
        """
        Ordered list of bit-fields as they appear in the 32-bit word,
        most-significant first. Each entry:
            {key, label, bits, value}
        `key` is used by the UI to colour-code the field.
        """
        b = self.machine_binary()  # 32-char string, index 0 = bit 31

        def seg(key, label, start, length, value):
            return {"key": key, "label": label,
                    "bits": b[start:start + length],
                    "value": value}

        if self.fmt == "R":
            return [
                seg("funct7", "funct7", 0, 7, bin_field(self.funct7, 7)),
                seg("rs2", "rs2", 7, 5, "x{}".format(self.rs2)),
                seg("rs1", "rs1", 12, 5, "x{}".format(self.rs1)),
                seg("funct3", "funct3", 17, 3, bin_field(self.funct3, 3)),
                seg("rd", "rd", 20, 5, "x{}".format(self.rd)),
                seg("opcode", "opcode", 25, 7, bin_field(self.opcode, 7)),
            ]

        if self.fmt == "I":
            return [
                seg("imm", "imm[11:0]", 0, 12, str(self.imm)),
                seg("rs1", "rs1", 12, 5, "x{}".format(self.rs1)),
                seg("funct3", "funct3", 17, 3, bin_field(self.funct3, 3)),
                seg("rd", "rd", 20, 5, "x{}".format(self.rd)),
                seg("opcode", "opcode", 25, 7, bin_field(self.opcode, 7)),
            ]

        if self.fmt == "S":
            return [
                seg("imm", "imm[11:5]", 0, 7, str(self.imm)),
                seg("rs2", "rs2", 7, 5, "x{}".format(self.rs2)),
                seg("rs1", "rs1", 12, 5, "x{}".format(self.rs1)),
                seg("funct3", "funct3", 17, 3, bin_field(self.funct3, 3)),
                seg("imm", "imm[4:0]", 20, 5, str(self.imm)),
                seg("opcode", "opcode", 25, 7, bin_field(self.opcode, 7)),
            ]

        # B-Type
        return [
            seg("imm", "imm[12|10:5]", 0, 7, str(self.imm)),
            seg("rs2", "rs2", 7, 5, "x{}".format(self.rs2)),
            seg("rs1", "rs1", 12, 5, "x{}".format(self.rs1)),
            seg("funct3", "funct3", 17, 3, bin_field(self.funct3, 3)),
            seg("imm", "imm[4:1|11]", 20, 5, str(self.imm)),
            seg("opcode", "opcode", 25, 7, bin_field(self.opcode, 7)),
        ]

    # -- serialisation for the API -------------------------------------------

    def to_dict(self, index=None):
        """Full JSON-friendly description used by the REST API."""
        return {
            "index": index,
            "source_line": self.source_line,
            "text": self.text,
            "mnemonic": self.mnemonic,
            "fmt": self.fmt,
            "label": self.label,
            "decode": self.decode_fields(),
            "machine": {
                "binary": self.machine_binary(),
                "hex": self.machine_hex(),
                "segments": self.field_segments(),
            },
        }
