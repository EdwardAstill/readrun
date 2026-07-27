import React, { useState } from "react";
import { Handle } from "@readrun/widgets/interaction";
import { Shell, Sub, Stage, Stat } from "@readrun/widgets/primitives";

export function HandleDemo() {
  const [pos, setPos] = useState({ x: 350, y: 190 });

  return (
    <Shell title="Handle drag">
      <Sub>Drag the handle to move it. Handle uses useDrag internally and reports absolute SVG coords.</Sub>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <Stat label="x" value={pos.x.toFixed(0)} />
        <Stat label="y" value={pos.y.toFixed(0)} />
      </div>
      <Stage>
        <svg
          viewBox="0 0 700 380"
          width={700}
          height={380}
          style={{ display: "block", maxWidth: "100%" }}
        >
          {/* Grid lines */}
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={`vg${i}`}
              x1={(i + 1) * 700 / 8}
              y1={0}
              x2={(i + 1) * 700 / 8}
              y2={380}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <line
              key={`hg${i}`}
              x1={0}
              y1={(i + 1) * 380 / 4}
              x2={700}
              y2={(i + 1) * 380 / 4}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          ))}
          {/* Cross-hair at position */}
          <line x1={pos.x} y1={0} x2={pos.x} y2={380} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3" />
          <line x1={0} y1={pos.y} x2={700} y2={pos.y} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3" />
          <Handle
            x={pos.x}
            y={pos.y}
            onMove={(x, y) => setPos({ x, y })}
            r={10}
          />
        </svg>
      </Stage>
    </Shell>
  );
}
