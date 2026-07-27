import React from "react";
import { linear, cubicOut, quadInOut } from "@readrun/widgets/draw";
import { palette } from "@readrun/widgets/draw";
import { Shell, Sub, Stage } from "@readrun/widgets/primitives";

const EASINGS: [string, (t: number) => number, string][] = [
  ["linear", linear, palette.math.accent2],
  ["cubicOut", cubicOut, palette.math.accent],
  ["quadInOut", quadInOut, "#10b981"],
];

const W = 400;
const H = 300;
const PAD = 40;
const INNER_W = W - PAD * 2;
const INNER_H = H - PAD * 2;

function makePath(fn: (t: number) => number): string {
  const pts = Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    const v = fn(t);
    const x = PAD + t * INNER_W;
    const y = PAD + (1 - v) * INNER_H;
    return `${x},${y}`;
  });
  return "M " + pts.join(" L ");
}

export function EasingCurvesDemo() {
  return (
    <Shell title="Easing curves">
      <Sub>All three easing functions plotted as y = f(t) over [0, 1].</Sub>
      <Stage>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const x = PAD + v * INNER_W;
            const y = PAD + (1 - v) * INNER_H;
            return (
              <React.Fragment key={v}>
                <line x1={x} y1={PAD} x2={x} y2={PAD + INNER_H} stroke="#f1f5f9" strokeWidth={1} />
                <line x1={PAD} y1={y} x2={PAD + INNER_W} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              </React.Fragment>
            );
          })}
          {/* Diagonal reference (identity) */}
          <line x1={PAD} y1={PAD + INNER_H} x2={PAD + INNER_W} y2={PAD} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 3" />
          {/* Axes */}
          <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + INNER_H} stroke="#94a3b8" strokeWidth={1} />
          <line x1={PAD} y1={PAD + INNER_H} x2={PAD + INNER_W} y2={PAD + INNER_H} stroke="#94a3b8" strokeWidth={1} />
          {/* Axis labels */}
          <text x={PAD + INNER_W / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="ui-monospace, monospace">t</text>
          <text x={10} y={PAD + INNER_H / 2} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="ui-monospace, monospace" transform={`rotate(-90, 10, ${PAD + INNER_H / 2})`}>output</text>
          {/* Easing curves */}
          {EASINGS.map(([, fn, color]) => (
            <path key={color} d={makePath(fn)} fill="none" stroke={color} strokeWidth={2.5} />
          ))}
        </svg>
      </Stage>
      <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
        {EASINGS.map(([name, , color]) => (
          <span key={name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
            <span style={{ display: "inline-block", width: 24, height: 3, background: color, borderRadius: 2 }} />
            <code style={{ fontFamily: "ui-monospace, monospace" }}>{name}</code>
          </span>
        ))}
      </div>
    </Shell>
  );
}
