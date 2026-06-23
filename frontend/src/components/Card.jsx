import React from "react";

// A clean panel with an icon + title header. One subtle entrance animation.
export default function Card({
  title,
  icon: Icon,
  actions,
  children,
  className = "",
  bodyClass = "",
}) {
  return (
    <section
      className={`panel-in flex flex-col rounded-lg border border-line bg-panel overflow-hidden ${className}`}
    >
      {title && (
        <header className="flex items-center gap-2.5 px-4 py-2.5 border-b border-line">
          {Icon && (
            <Icon size={15} strokeWidth={2} className="text-muted shrink-0" />
          )}
          <h2 className="text-[12px] font-semibold tracking-[0.04em] text-muted uppercase">
            {title}
          </h2>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={`flex-1 min-h-0 ${bodyClass}`}>{children}</div>
    </section>
  );
}
