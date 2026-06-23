# RV32 Studio — RISC-V Simulator (React + FastAPI)

A minimal, dark-themed educational simulator for a subset of **RV32I**, rebuilt
from a Tkinter prototype into a proper **frontend / backend** product. The UI is
deliberately calm and static so attention stays on the logic — the encoding,
the registers, and the decoded fields — rather than on motion.

The Python simulator core (parser, ALU, register file, memory, CPU) is reused
behind a **FastAPI** REST layer; the UI is a component-based **React** dashboard
with **Tailwind CSS** and **Lucide** icons, and a **light / dark theme** toggle.

```
┌──────────────────────────────────────────────────────────────────┐
│  React + Tailwind CSS   (frontend, :5173)                          │
│    editor · registers · PC · decoder · machine code                 │
│    instruction-format diagram · light/dark theme                    │
└───────────────▲────────────────────────────────────────────────────┘
                │  REST  /api/*  (Vite proxy → :8000)
┌───────────────┴────────────────────────────────────────────────────┐
│  FastAPI  (backend, :8000)                                          │
│    SimulatorService → CPU → {Parser, ALU, RegisterFile, Memory}     │
└──────────────────────────────────────────────────────────────────┘
```

## Supported instructions

| Format | Instructions |
| ------ | ------------ |
| R-Type | `add sub and or xor sll srl slt` |
| I-Type (arith) | `addi andi ori xori slti` |
| Load (I-Type enc.) | `lw` |
| Store (S-Type enc.) | `sw` |
| Branch (B-Type enc.) | `beq bne` |

> In real RISC-V only `lw` is I-Type — `sw` is S-Type and branches are B-Type,
> each with a different immediate layout. The simulator generates the **correct**
> machine code for each and reports the true format. Registers may be written as
> `x0..x31` or by ABI name (`a0`, `sp`, `ra`, ...).

`lw` / `sw` still execute and read/write data memory on the backend; the data
memory **panel** has been removed from the UI to keep the dashboard focused.
The memory state is still in the API response (`/api/memory`, and the `memory`
field of every snapshot) if you want to re-add a panel later.

## Project structure

```
riscv-studio/
├── backend/
│   ├── app.py                 # FastAPI app + REST endpoints
│   ├── requirements.txt
│   └── simulator/             # reusable simulator core (no web deps)
│       ├── isa.py             # constants, helpers, error types
│       ├── instruction.py     # decode + 32-bit encoding + field segments
│       ├── parser.py          # two-pass assembler (labels)
│       ├── alu.py
│       ├── register_file.py
│       ├── memory.py
│       ├── cpu.py             # fetch / decode / execute / PC
│       └── service.py         # stateful API layer + change tracking
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js         # /api proxy → :8000
    ├── tailwind.config.js     # colours via CSS variables + fonts
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx            # dashboard layout
        ├── index.css          # theme tokens (light/dark), fonts
        ├── api/client.js      # fetch wrappers for every endpoint
        ├── context/SimulatorContext.jsx   # state + actions (incl. auto-run)
        ├── context/ThemeContext.jsx       # light / dark theme + persistence
        ├── lib/fields.js      # bit-field colour tokens (theme-aware)
        ├── lib/highlight.jsx  # assembly syntax highlighter
        └── components/        # Card, TopBar, CodeEditor, RegistersPanel,
                               # ProgramCounterPanel, DecoderPanel,
                               # MachineCodeViewer, InstructionFormatViz,
                               # ControlButton, StatusPill
```

## Running it

You need **two terminals** (backend + frontend).

### 1) Backend (Python 3.10+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

API is now at `http://localhost:8000` (interactive docs at `/docs`).

### 2) Frontend (Node 18+)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend automatically.
Build for production with `npm run build` (output in `frontend/dist/`).

## REST API

| Method | Path | Body | Returns |
| ------ | ---- | ---- | ------- |
| POST | `/api/assemble` | `{code}` | decoded program + initial state |
| POST | `/api/step` | — | state snapshot after one instruction |
| POST | `/api/run` | — | final state snapshot |
| POST | `/api/reset` | — | cleared state snapshot |
| GET  | `/api/registers` | — | x0–x31 table |
| GET  | `/api/memory` | — | memory table (still available; not shown in UI) |
| GET  | `/api/pc` | — | program counter |
| POST | `/api/decode` | `{instruction}` | decoded fields |
| POST | `/api/machine-code` | `{instruction}` | 32-bit encoding + field segments |

A **state snapshot** includes the PC, the full register table (each register
flagged `changed`), the current instruction (decoded + machine code), the step
count and a `finished` flag.

## UI features

- **Syntax-highlighted editor** with a line gutter, a static current-instruction
  highlight, click-to-inspect, and auto-scroll during execution.
- **Run / Step / Reset / Clear** controls. *Run* auto-steps on a timer; press
  again to pause.
- **Registers** table marks changed registers with a static accent border +
  faint background (no flashing).
- **Program Counter** panel shows the PC, instruction index and a progress bar.
- **Decoder** and **Machine Code** viewer share one colour per bit-field
  (`opcode / funct3 / funct7 / rs1 / rs2 / rd / imm`); the machine-code blocks
  are width-proportional to each field (the redundant hex line was removed to
  keep the focus on the bit layout).
- **Instruction Format** diagram highlights the active format's fields.
- **Light / dark theme** toggle in the top bar, persisted to `localStorage`
  and defaulting to the OS preference.

## Design notes

A minimal, academic engineering-tool aesthetic modelled on **VS Code**. The
palette is defined entirely with CSS variables (RGB triplets) in `index.css`,
with **Dark+** and **Light+** sets that swap via `<html data-theme>`; Tailwind
colours reference those variables so every surface — including the syntax
highlighting and the bit-field colours — adapts to the active theme.
**JetBrains Mono** is used on all "machine" surfaces (code, registers, binary)
and **Inter** for UI chrome. Motion is limited to a single gentle panel
entrance and short colour transitions (respecting `prefers-reduced-motion`).
The two columns stretch to equal height so the cards align, and the layout
collapses to a single column on mobile.

State is held in a single in-process `SimulatorService` (fine for a single-user
teaching tool). For multi-user hosting, key the service by a session id.
