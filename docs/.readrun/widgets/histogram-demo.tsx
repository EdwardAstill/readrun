import React, { useMemo, useState } from "react";
import { Frame, Histogram, scale } from "@readrun/widgets/plot";
import { Shell, Sub, Slider, Stat, SectionLabel } from "@readrun/widgets/primitives";

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function boxMuller(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const N = 600;
const W = 520;
const H = 260;
const INNER_W = W - 50;
const INNER_H = H - 40;

export function HistogramDemo() {
  const [k, setK] = useState(2);
  const [bins, setBins] = useState(30);

  const values = useMemo(() => {
    const rng = seededRng(7);
    const out: number[] = [];
    for (let i = 0; i < N; i++) out.push(boxMuller(rng));
    return out;
  }, []);

  const mu = values.reduce((a, b) => a + b, 0) / values.length;
  const sigma = Math.sqrt(values.reduce((a, b) => a + (b - mu) ** 2, 0) / values.length);
  const lo = mu - 4 * sigma;
  const hi = mu + 4 * sigma;

  const xScale = scale.linear({ domain: [lo, hi], range: [0, INNER_W] });
  const yScale = scale.linear({ domain: [0, 1], range: [INNER_H, 0] }); // unused; only here for axis ticks

  const inBand = (centre: number) => Math.abs(centre - mu) <= k * sigma;
  const insideCount = values.filter((v) => Math.abs(v - mu) <= k * sigma).length;

  return (
    <Shell title="Histogram primitive">
      <Sub>
        600 standard-normal samples. Bars within ±k·σ get the accent fill;
        outside bars use the muted text colour. Histogram is just the bars —
        the axis comes from Frame.
      </Sub>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <Frame
            width={W}
            height={H}
            xScale={xScale}
            yScale={yScale}
            margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
            xLabel="value"
          >
            {({ innerWidth, innerHeight }) => (
              <>
                <Histogram
                  values={values}
                  bins={bins}
                  domain={[lo, hi]}
                  width={innerWidth}
                  height={innerHeight}
                  highlight={inBand}
                  fillIn="var(--accent)"
                  fillOut="var(--text-muted)"
                />
                <line
                  x1={xScale(mu)}
                  x2={xScale(mu)}
                  y1={0}
                  y2={innerHeight}
                  stroke="var(--text)"
                  strokeWidth={1.5}
                />
                <line
                  x1={xScale(mu - k * sigma)}
                  x2={xScale(mu - k * sigma)}
                  y1={0}
                  y2={innerHeight}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <line
                  x1={xScale(mu + k * sigma)}
                  x2={xScale(mu + k * sigma)}
                  y1={0}
                  y2={innerHeight}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              </>
            )}
          </Frame>
        </div>

        <div style={{ minWidth: 200 }}>
          <SectionLabel>Controls</SectionLabel>
          <Slider label="bins" value={bins} min={5} max={80} step={1} onChange={setBins} />
          <Slider label="k (band width)" value={k} min={0.5} max={4} step={0.1} onChange={setK} />
          <SectionLabel style={{ marginTop: 16 }}>Stats</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Stat label="μ" value={mu.toFixed(3)} />
            <Stat label="σ" value={sigma.toFixed(3)} />
            <Stat label="in band" value={`${insideCount}/${values.length}`} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
