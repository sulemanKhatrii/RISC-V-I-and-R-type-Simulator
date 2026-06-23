"""
app.py
======
FastAPI REST layer over the simulator.

Run with:
    uvicorn app:app --reload --port 8000

Endpoints
---------
POST /api/assemble        body {code}          -> decoded program
POST /api/run                                  -> final state snapshot
POST /api/step                                 -> state snapshot (one step)
POST /api/reset                                -> cleared state snapshot
GET  /api/registers                            -> register table
GET  /api/memory                               -> memory table
GET  /api/pc                                   -> program counter
POST /api/decode          body {instruction}   -> decoded fields
POST /api/machine-code    body {instruction}   -> 32-bit machine code

State is held in a single in-process SimulatorService (sufficient for a
single-user teaching tool). Swap for a per-session store to go multi-user.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from simulator import SimulatorService, AssemblerError, RuntimeSimError

app = FastAPI(title="RV32 Studio API", version="1.0.0")

# Allow the Vite dev server (and any local origin) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

service = SimulatorService()


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------
class CodeBody(BaseModel):
    code: str


class InstructionBody(BaseModel):
    instruction: str


# ---------------------------------------------------------------------------
# Uniform error helpers
# ---------------------------------------------------------------------------
def assembler_error(exc: AssemblerError):
    return JSONResponse(
        status_code=400,
        content={"ok": False, "error": exc.pretty(), "line": exc.line},
    )


def runtime_error(exc: RuntimeSimError):
    return JSONResponse(
        status_code=400,
        content={"ok": False, "error": str(exc), "kind": "runtime"},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"ok": True, "service": "rv32-studio"}


@app.post("/api/assemble")
def assemble(body: CodeBody):
    try:
        instructions = service.assemble(body.code)
    except AssemblerError as exc:
        return assembler_error(exc)
    return {"ok": True, "count": len(instructions),
            "instructions": instructions, "state": service.snapshot()}


@app.post("/api/step")
def step():
    try:
        snap = service.step()
    except RuntimeSimError as exc:
        return runtime_error(exc)
    return {"ok": True, "state": snap}


@app.post("/api/run")
def run():
    try:
        snap = service.run()
    except RuntimeSimError as exc:
        return runtime_error(exc)
    return {"ok": True, "state": snap}


@app.post("/api/reset")
def reset():
    return {"ok": True, "state": service.reset()}


@app.get("/api/registers")
def registers():
    return {"ok": True, "registers": service.registers_view()}


@app.get("/api/memory")
def memory():
    return {"ok": True, "memory": service.memory_view()}


@app.get("/api/pc")
def program_counter():
    return {"ok": True, "pc": service.cpu.pc,
            "pc_hex": "0x{:08X}".format(service.cpu.pc),
            "pc_index": service.cpu.current_index(),
            "finished": service.cpu.finished()}


@app.post("/api/decode")
def decode(body: InstructionBody):
    try:
        decoded = service.decode_one(body.instruction)
    except AssemblerError as exc:
        return assembler_error(exc)
    if decoded is None:
        return {"ok": False, "error": "No instruction found."}
    return {"ok": True, "decoded": decoded}


@app.post("/api/machine-code")
def machine_code(body: InstructionBody):
    try:
        decoded = service.decode_one(body.instruction)
    except AssemblerError as exc:
        return assembler_error(exc)
    if decoded is None:
        return {"ok": False, "error": "No instruction found."}
    return {"ok": True, "machine": decoded["machine"]}
