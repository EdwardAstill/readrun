import React, { useState } from "react";
import { Frame, Heatmap, scale } from "@readrun/widgets/plot";
import { palette } from "@readrun/widgets/draw";
import { Shell, Sub, SectionLabel, Tabs, Stat } from "@readrun/widgets/primitives";

type ColorMap = "viridis" | "magma" | "plasma";

const MAPS: { id: ColorMap; label: string }[] = [
  { id: "viridis", label: "viridis" },
  { id: "magma", label: "magma" },
  { id: "plasma", label: "plasma" },
];

// Sinusoidal scalar field with a basin near (1, -0.5).
function field(x: number, y: number): number {
  return (
    1.2 * (x - 1) * (x - 1) +
    0.6 * (y + 0.5) * (y + 0.5) +
    0.6 * Math.sin(2 * x) * Math.cos(2 * y)
  );
}

const N = 60;
const X_DOMAIN: readonly [number, number] = [-2, 4];
const Y_DOMAIN: readonly [number, number] = [-2, 2];

const grid: number[][] = [];
for (let i = 0; i < N; i++) {
  grid[i] = [];
  for (let j = 0; j < N; j++) {
    const x = X_DOMAIN[0] + (i / (N - 1)) * (X_DOMAIN[1] - X_DOMAIN[0]);
    const y = Y_DOMAIN[0] + (j / (N - 1)) * (Y_DOMAIN[1] - Y_DOMAIN[0]);
    grid[i]![j] = field(x, y);
  }
}

const W = 480;
const H = 360;
const INNER_W = W - 50;
const INNER_H = H - 40;

export function HeatmapDemo() {
  const [cmap, setCmap] = useState<ColorMap>("viridis");
  const [picked, setPicked] = useState<{ i: number; j: number; v: number } | null>(null);

  const xScale = scale.linear({ domain: X_DOMAIN, range: [0, INNER_W] });
  const yScale = scale.linear({ domain: Y_DOMAIN, range: [INNER_H, 0] });

  return (
    <Shell title="Heatmap + perceptual colormaps">
      <Sub>
        Click any cell to pick a sample. Heatmap renders inside Frame's render-prop —
        cells share viewBox coordinates with the axes.
      </Sub>

      <Tabs value={cmap} onChange={(id) => setCmap(id as ColorMap)} items={MAPS} />

      <div style={{ marginTop: 12 }}>
        <Frame
          width={W}
          height={H}
          xScale={xScale}
          yScale={yScale}
          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
          xLabel="x"
          yLabel="y"
        >
          {({ innerWidth, innerHeight }) => (
            <>
              <Heatmap
                data={grid}
                width={innerWidth}
                height={innerHeight}
                colorScale={palette[cmap]}
                onCellClick={(i, j, v) => setPicked({ i, j, v })}
              />
              {picked && (() => {
                const x = X_DOMAIN[0] + (picked.i / (N - 1)) * (X_DOMAIN[1] - X_DOMAIN[0]);
                const y = Y_DOMAIN[0] + (picked.j / (N - 1)) * (Y_DOMAIN[1] - Y_DOMAIN[0]);
                return (
                  <circle
                    cx={xScale(x)}
                    cy={yScale(y)}
                    r={6}
                    fill="var(--accent)"
                    stroke="var(--bg)"
                    strokeWidth={2}
                  />
                );
              })()}
            </>
          )}
        </Frame>
      </div>

      <SectionLabel style={{ marginTop: 16 }}>Sampled cell</SectionLabel>
      <div style={{ display: "flex", gap: 16 }}>
        <Stat label="i, j" value={picked ? `${picked.i}, ${picked.j}` : "—"} />
        <Stat label="value" value={picked ? picked.v.toFixed(3) : "—"} />
      </div>

      <SectionLabel style={{ marginTop: 16 }}>Colormap stops</SectionLabel>
      <div style={{ display: "flex", height: 24, border: "1px solid var(--border)" }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} style={{ flex: 1, background: palette[cmap](i / 59) }} />
        ))}
      </div>
    </Shell>
  );
}
