import React from "react";
import {
  Cpu, Play, Pause, SkipForward, RotateCcw, Eraser, Sun, Moon,
} from "lucide-react";
import { useSimulator } from "../context/SimulatorContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import ControlButton from "./ControlButton.jsx";
import StatusPill from "./StatusPill.jsx";

export default function TopBar() {
  const { actions, status, running, busy, snapshot } = useSimulator();
  const { theme, toggle } = useTheme();
  const steps = snapshot?.steps ?? 0;

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 border-b border-line bg-ink/95 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-8 h-8 rounded-md border border-line bg-elevated text-accent">
          <Cpu size={17} strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <div className="font-mono text-[15px] font-bold tracking-tight text-ice">
            R and I Type <span className="text-accent"></span>
          </div>
          <div className="text-[10px] text-ghost tracking-wide">
            Instruction simulator
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        <ControlButton
          icon={running ? Pause : Play}
          label={running ? "Pause" : "Run"}
          variant="primary"
          active={running}
          onClick={actions.run}
        />
        <ControlButton
          icon={SkipForward}
          label="Step"
          variant="accent2"
          disabled={running}
          onClick={actions.step}
        />
        <ControlButton
          icon={RotateCcw}
          label="Reset"
          variant="ghost"
          onClick={actions.reset}
        />
        <ControlButton
          icon={Eraser}
          label="Clear"
          variant="danger"
          onClick={actions.clear}
        />
      </div>

      {/* Status + theme toggle */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-none">
          <span className="font-mono text-[13px] text-ice tabular-nums">
            {steps}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ghost">
            steps
          </span>
        </div>
        <StatusPill status={busy ? "running" : status} />
        <button
          onClick={toggle}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label="Toggle theme"
          className="grid place-items-center w-9 h-9 rounded-md border border-line bg-elevated text-muted hover:text-ice hover:bg-surface"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
