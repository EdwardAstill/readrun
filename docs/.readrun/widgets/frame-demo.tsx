import React from "react";
import { Frame, scale } from "@readrun/widgets/plot";
import { Shell, Sub, Stage } from "@readrun/widgets/primitives";

export function FrameDemo() {
  const xScale = scale.linear({ domain: [0, 2 * Math.PI], range: [0, 560] });
  const yScale = scale.linear({ domain: [-1.2, 1.2], range: [160, 0] });

  const sinePoints: [number, number][] = [];
  const cosPoints: [number, number][] = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * 2 * Math.PI;
    sinePoints.push([t, Math.sin(t)]);
    cosPoints.push([t, Math.cos(t)]);
  }

  const sinePath =
    "M " + sinePoints.map(([x, y]) => `${xScale(x)} ${yScale(y)}`).join(" L ");
  const cosPath =
    "M " + cosPoints.map(([x, y]) => `${xScale(x)} ${yScale(y)}`).join(" L ");

  return (
    <Shell title="Frame + scale + Axis">
      <Sub>
        Plot scaffold: Frame wraps an SVG with axes. Children are a render-prop receiving scaled coordinates.
      </Sub>
      <Stage>
        <Frame width={640} height={240} xScale={xScale} yScale={yScale} xLabel="t (radians)" yLabel="amplitude">
          {() => (
            <>
              <path fill="none" stroke="#4f46e5" strokeWidth={2} d={sinePath} />
              <path fill="none" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 3" d={cosPath} />
            </>
          )}
        </Frame>
      </Stage>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#64748b" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "#4f46e5", borderRadius: 1 }} />
          sin(t)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "#0ea5e9", borderRadius: 1, borderTop: "2px dashed #0ea5e9" }} />
          cos(t)
        </span>
      </div>
    </Shell>
  );
}
