import React from "react";
import { palette } from "@readrun/widgets/draw";
import type { TopicPalette } from "@readrun/widgets/draw";
import { Shell, Sub, SectionLabel } from "@readrun/widgets/primitives";

const PALETTES: [string, TopicPalette][] = [
  ["math", palette.math],
  ["neuro", palette.neuro],
  ["network", palette.network],
  ["algo", palette.algo],
];

const FIELDS: (keyof TopicPalette)[] = ["accent", "accent2", "dim", "surface", "text", "textDim"];

const SEQ_STOPS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff", "#f5f3ff"];

export function PaletteDemo() {
  return (
    <Shell title="Palette swatches">
      <Sub>Named palettes and their six fields. Plus a sequential gradient built from custom stops.</Sub>

      {PALETTES.map(([name, pal]) => (
        <div key={name} style={{ marginBottom: 24 }}>
          <SectionLabel>{name}</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FIELDS.map((field) => (
              <div key={field} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 40,
                    background: pal[field],
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>{field}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>{pal[field]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <SectionLabel>sequential gradient (6 stops, t = 0..1)</SectionLabel>
      <div style={{ display: "flex", height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: palette.sequential(SEQ_STOPS, i / 59),
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {SEQ_STOPS.map((stop) => (
          <div
            key={stop}
            style={{
              width: 20,
              height: 20,
              background: stop,
              borderRadius: 4,
              border: "1px solid #e2e8f0",
            }}
            title={stop}
          />
        ))}
      </div>
    </Shell>
  );
}
