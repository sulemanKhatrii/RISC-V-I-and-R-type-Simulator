import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "../api/client.js";
import { SAMPLE_PROGRAM } from "../lib/fields.js";

const SimulatorContext = createContext(null);
export const useSimulator = () => useContext(SimulatorContext);

const RUN_INTERVAL_MS = 420; // pace of auto-run so animations are readable

export function SimulatorProvider({ children }) {
  const [code, setCode] = useState(SAMPLE_PROGRAM);
  const [snapshot, setSnapshot] = useState(null); // latest backend state
  const [selected, setSelected] = useState(null); // instruction shown in panels
  const [status, setStatus] = useState("idle"); // idle|ready|running|halted|error
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(true);

  const lastAssembled = useRef(null); // code string last sent to /assemble
  const runTimer = useRef(null);
  const runningRef = useRef(false);

  // The instruction the panels should display: an explicit click wins,
  // otherwise the instruction under the PC.
  const active = selected || snapshot?.current || null;
  const activeLine = snapshot?.current?.source_line ?? null;

  const fail = useCallback((err) => {
    setError(err.message || String(err));
    setStatus("error");
  }, []);

  // Make sure the current editor text is assembled on the backend.
  const ensureAssembled = useCallback(async () => {
    if (lastAssembled.current === code && snapshot?.assembled) return true;
    const data = await api.assemble(code);
    lastAssembled.current = code;
    setSnapshot(data.state);
    setSelected(null);
    setError(null);
    setStatus(data.state.finished ? "halted" : "ready");
    return true;
  }, [code, snapshot]);

  const assemble = useCallback(async () => {
    setBusy(true);
    try {
      const data = await api.assemble(code);
      lastAssembled.current = code;
      setSnapshot(data.state);
      setSelected(null);
      setError(null);
      setStatus(data.state.finished ? "halted" : "ready");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }, [code, fail]);

  const step = useCallback(async () => {
    try {
      await ensureAssembled();
      const data = await api.step();
      setSnapshot(data.state);
      setSelected(null);
      setStatus(data.state.finished ? "halted" : "ready");
      return data.state;
    } catch (err) {
      fail(err);
      return null;
    }
  }, [ensureAssembled, fail]);

  // Auto-run: step on an interval so the PC, registers and datapath animate.
  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (runTimer.current) {
      clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    setStatus((s) => (s === "running" ? "halted" : s));
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    try {
      await ensureAssembled();
    } catch (err) {
      fail(err);
      return;
    }
    runningRef.current = true;
    setRunning(true);
    setStatus("running");

    const tick = async () => {
      if (!runningRef.current) return;
      try {
        const data = await api.step();
        setSnapshot(data.state);
        setSelected(null);
        if (data.state.finished) {
          stopRun();
          setStatus("halted");
          return;
        }
        runTimer.current = setTimeout(tick, RUN_INTERVAL_MS);
      } catch (err) {
        stopRun();
        fail(err);
      }
    };
    tick();
  }, [ensureAssembled, fail, stopRun]);

  const reset = useCallback(async () => {
    stopRun();
    try {
      await ensureAssembled();
      const data = await api.reset();
      setSnapshot(data.state);
      setSelected(null);
      setError(null);
      setStatus(data.state.finished ? "halted" : "ready");
    } catch (err) {
      fail(err);
    }
  }, [ensureAssembled, fail, stopRun]);

  const clear = useCallback(async () => {
    stopRun();
    setCode("");
    setSelected(null);
    setError(null);
    lastAssembled.current = "";
    try {
      const data = await api.assemble("");
      setSnapshot(data.state);
    } catch {
      setSnapshot(null);
    }
    setStatus("idle");
  }, [stopRun]);

  // Decode an arbitrary line (click-to-inspect) without affecting execution.
  const inspectLine = useCallback(async (lineText) => {
    const trimmed = (lineText || "").trim();
    if (!trimmed) return;
    try {
      const data = await api.decode(trimmed);
      if (data.decoded) setSelected(data.decoded);
    } catch {
      /* mid-typing / invalid line: ignore quietly */
    }
  }, []);

  // Assemble the sample program once on mount.
  useEffect(() => {
    (async () => {
      try {
        await api.health();
        setConnected(true);
        await assemble();
      } catch {
        setConnected(false);
        setStatus("error");
        setError(
          "Cannot reach the backend at /api. Start it with: uvicorn app:app --port 8000"
        );
      }
    })();
    return () => stopRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    code,
    setCode,
    snapshot,
    selected,
    setSelected,
    active,
    activeLine,
    status,
    error,
    busy,
    running,
    connected,
    actions: { assemble, step, run, reset, clear, inspectLine, stopRun },
  };

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
}
