import React, { useRef, useState } from "react";
import { useRaf } from "@readrun/widgets/interaction";
import { tween, cubicOut, linear, quadInOut } from "@readrun/widgets/draw";
import { Shell, Sub, Btn, Stat } from "@readrun/widgets/primitives";

type EasingName = "cubicOut" | "linear" | "quadInOut";

const EASINGS: Record<EasingName, (t: number) => number> = { cubicOut, linear, quadInOut };
const COLORS: Record<EasingName, string> = {
  cubicOut: "#4f46e5",
  linear: "#0ea5e9",
  quadInOut: "#10b981",
};

const DURATION = 1200;
const BAR_MAX = 540;

export function EasingAnimDemo() {
  const [values, setValues] = useState<Record<EasingName, number>>({
    cubicOut: 0,
    linear: 0,
    quadInOut: 0,
  });
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const tweensRef = useRef<Record<EasingName, ReturnType<typeof tween>> | null>(null);

  function start() {
    const now = performance.now();
    startRef.current = now;
    tweensRef.current = {
      cubicOut: tween({ from: 0, to: BAR_MAX, startedAt: now, durationMs: DURATION, easing: cubicOut }),
      linear: tween({ from: 0, to: BAR_MAX, startedAt: now, durationMs: DURATION, easing: linear }),
      quadInOut: tween({ from: 0, to: BAR_MAX, startedAt: now, durationMs: DURATION, easing: quadInOut }),
    };
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    tweensRef.current = null;
    setValues({ cubicOut: 0, linear: 0, quadInOut: 0 });
  }

  useRaf(
    (_dt: number) => {
      if (!tweensRef.current) return;
      const now = performance.now();
      const next: Record<EasingName, number> = { cubicOut: 0, linear: 0, quadInOut: 0 };
      let allDone = true;
      for (const key of Object.keys(tweensRef.current) as EasingName[]) {
        const { value, done } = tweensRef.current[key](now);
        next[key] = value;
        if (!done) allDone = false;
      }
      setValues(next);
      if (allDone) setRunning(false);
    },
    { enabled: running }
  );

  return (
    <Shell title="useRaf + tween — easing animation">
      <Sub>Each bar animates from 0 to 100% using a different easing function driven by useRaf.</Sub>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn kind="primary" onClick={start} disabled={running}>Animate</Btn>
        <Btn kind="ghost" onClick={reset}>Reset</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(Object.keys(EASINGS) as EasingName[]).map((name) => (
          <div key={name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              <span style={{ fontFamily: "ui-monospace, monospace", color: COLORS[name] }}>{name}</span>
              <Stat label="width" value={`${((values[name] / BAR_MAX) * 100).toFixed(0)}%`} />
            </div>
            <div style={{ height: 28, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: values[name],
                  background: COLORS[name],
                  borderRadius: 4,
                  transition: "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
