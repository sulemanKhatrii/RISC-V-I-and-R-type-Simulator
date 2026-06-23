import React, { useEffect, useMemo, useRef } from "react";
import { useSimulator } from "../context/SimulatorContext.jsx";
import { highlightLine } from "../lib/highlight.jsx";

const LINE_HEIGHT = 22;
const PAD_Y = 14;

export default function CodeEditor() {
  const { code, setCode, activeLine, actions, running } = useSimulator();
  const taRef = useRef(null);
  const overlayRef = useRef(null);
  const gutterRef = useRef(null);

  const lines = useMemo(() => code.split("\n"), [code]);
  const activeIndex = activeLine ? activeLine - 1 : -1;

  const syncScroll = () => {
    const top = taRef.current?.scrollTop ?? 0;
    if (overlayRef.current)
      overlayRef.current.style.transform = `translateY(${-top}px)`;
    if (gutterRef.current)
      gutterRef.current.style.transform = `translateY(${-top}px)`;
  };

  useEffect(() => {
    if (activeIndex < 0 || !taRef.current) return;
    const ta = taRef.current;
    const lineTop = activeIndex * LINE_HEIGHT;
    const viewTop = ta.scrollTop;
    const viewBottom = viewTop + ta.clientHeight - PAD_Y * 2;
    if (lineTop < viewTop || lineTop + LINE_HEIGHT > viewBottom) {
      ta.scrollTop = Math.max(0, lineTop - ta.clientHeight / 2 + LINE_HEIGHT);
      syncScroll();
    }
  }, [activeIndex]);

  const handleCaret = () => {
    const ta = taRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart);
    const lineIdx = before.split("\n").length - 1;
    actions.inspectLine(lines[lineIdx] || "");
  };

  return (
    <div className="relative flex h-full min-h-0 font-mono text-[13px] leading-[22px]">
      <div className="relative w-11 shrink-0 overflow-hidden border-r border-line bg-surface select-none">
        <div ref={gutterRef} style={{ paddingTop: PAD_Y }}>
          {lines.map((_, i) => (
            <div
              key={i}
              style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
              className={`pr-3 text-right tabular-nums ${
                i === activeIndex ? "text-accent font-semibold" : "text-ghost"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-w-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div ref={overlayRef} style={{ paddingTop: PAD_Y }} className="px-4">
            {activeIndex >= 0 && (
              <div
                className="absolute left-0 right-0 border-l-2 border-accent"
                style={{
                  top: PAD_Y + activeIndex * LINE_HEIGHT,
                  height: LINE_HEIGHT,
                  backgroundColor: "rgb(var(--accent) / 0.08)",
                }}
              />
            )}
            <pre className="relative m-0 whitespace-pre">
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
                >
                  {highlightLine(line, i)}
                </div>
              ))}
            </pre>
          </div>
        </div>

        <textarea
          ref={taRef}
          value={code}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          onScroll={syncScroll}
          onClick={handleCaret}
          onKeyUp={handleCaret}
          readOnly={running}
          style={{
            paddingTop: PAD_Y,
            lineHeight: `${LINE_HEIGHT}px`,
            caretColor: "rgb(var(--accent))",
          }}
          className="absolute inset-0 w-full h-full resize-none bg-transparent px-4 pb-4
            font-mono text-[13px] text-transparent outline-none whitespace-pre overflow-auto"
        />
      </div>
    </div>
  );
}
