import React from "react";

/**
 * Lightweight CSS-only background. Diagonal fintech gradient + subtle grid +
 * single slow-drifting orb. Zero network, zero JS, GPU-friendly.
 */
export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      {/* Diagonal gradient base */}
      <div className="fixed inset-0 z-0 bg-pro-mesh" aria-hidden="true" />
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-60" aria-hidden="true" />
      {/* Slow drifting orb for life */}
      <div
        className="fixed -top-40 -right-40 w-[700px] h-[700px] rounded-full z-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)",
          animation: "orb-drift 60s ease-in-out infinite",
          willChange: "transform",
          filter: "blur(20px)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
