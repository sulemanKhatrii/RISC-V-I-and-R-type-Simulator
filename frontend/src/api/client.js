// client.js — thin wrapper around the FastAPI backend.
// In dev, Vite proxies /api to http://localhost:8000 (see vite.config.js),
// so we use same-origin relative URLs. Override with VITE_API_URL if hosting
// the API elsewhere.

const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned a non-JSON response (${res.status}).`);
  }

  // The API returns {ok:false, error} for handled failures.
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `Request failed (${res.status}).`);
    err.line = data.line;
    err.kind = data.kind;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  assemble: (code) => request("/assemble", { method: "POST", body: { code } }),
  step: () => request("/step", { method: "POST" }),
  run: () => request("/run", { method: "POST" }),
  reset: () => request("/reset", { method: "POST" }),
  getRegisters: () => request("/registers"),
  getMemory: () => request("/memory"),
  getPC: () => request("/pc"),
  decode: (instruction) =>
    request("/decode", { method: "POST", body: { instruction } }),
  machineCode: (instruction) =>
    request("/machine-code", { method: "POST", body: { instruction } }),
};
