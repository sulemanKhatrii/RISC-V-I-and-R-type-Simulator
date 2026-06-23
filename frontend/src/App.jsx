import React from "react";
import {
  Code2, Binary, Boxes, Gauge, ScanLine, Rows3, AlertTriangle,
} from "lucide-react";
import { useSimulator } from "./context/SimulatorContext.jsx";
import TopBar from "./components/TopBar.jsx";
import Card from "./components/Card.jsx";
import CodeEditor from "./components/CodeEditor.jsx";
import RegistersPanel from "./components/RegistersPanel.jsx";
import ProgramCounterPanel from "./components/ProgramCounterPanel.jsx";
import DecoderPanel from "./components/DecoderPanel.jsx";
import MachineCodeViewer from "./components/MachineCodeViewer.jsx";
// import InstructionFormatViz from "./components/InstructionFormatViz.jsx";

function ErrorBanner() {
  const { error, status, connected } = useSimulator();
  if (!((status === "error" || !connected) && error)) return null;
  return (
    <div className="mx-auto max-w-[1400px] mt-4 px-4">
      <div className="flex items-start gap-3 rounded-md border border-bad/40 bg-bad/10 px-4 py-3">
        <AlertTriangle size={18} className="text-bad shrink-0 mt-0.5" />
        <div className="flex-1 text-[13px] text-bad font-mono">{error}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <ErrorBanner />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4">
        {/* Two aligned columns: editing/encoding on the left, state on the right.
            Both columns stretch to equal height; the editor and the registers
            table flex to fill so the card bottoms line up. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card
              title="Assembly Editor"
              icon={Code2}
              className="flex-1 min-h-[420px]"
              bodyClass="min-h-0"
            >
              <CodeEditor />
            </Card>
            <Card title="Machine Code" icon={Binary}>
              <MachineCodeViewer />
            </Card>
            {/* <Card title="Instruction Format" icon={Boxes}>
              <InstructionFormatViz />
            </Card> */}
          </div>

          {/* Right */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Card title="Program Counter" icon={Gauge}>
              <ProgramCounterPanel />
            </Card>
            <Card title="Instruction Decoder" icon={ScanLine}>
              <DecoderPanel />
            </Card>
            <Card
              title="Registers"
              icon={Rows3}
              className="flex-1 min-h-[260px]"
              bodyClass="min-h-0"
            >
              <RegistersPanel />
            </Card>
          </div>
        </div>

        <footer className="mt-6 text-center text-[11px] text-ghost">
          RV32 Studio — a teaching simulator for a subset of RV32I · React +
          FastAPI
        </footer>
      </main>
    </div>
  );
}
