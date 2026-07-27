import React, { useState } from "react";
import { WidgetLayout, Btn, Slider, Stat, Tabs } from "@readrun/widgets/primitives";
import type { WidgetArrangement } from "@readrun/widgets/primitives";

const ARRANGEMENTS: WidgetArrangement[] = [
  "visual-left",
  "visual-right",
  "visual-top",
  "visual-bottom",
  "stacked",
];

export function WidgetLayoutsDemo() {
  const [arr, setArr] = useState<WidgetArrangement>("visual-left");
  const [val, setVal] = useState(50);
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Tabs
          value={arr}
          items={ARRANGEMENTS.map((a) => ({ id: a, label: a }))}
          onChange={(v) => setArr(v as WidgetArrangement)}
        />
      </div>
      <WidgetLayout
        arrangement={arr}
        title="Demo widget"
        subtitle="Switch arrangement above to see the layout change."
      >
        <WidgetLayout.Visual>
          <svg
            viewBox="0 0 320 240"
            width="100%"
            height={240}
            style={{ display: "block" }}
          >
            <rect
              x={20}
              y={20}
              width={280}
              height={200}
              fill="none"
              stroke="var(--text-muted)"
              strokeDasharray="4 3"
            />
            <text
              x={160}
              y={120}
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-muted)"
              fontFamily="var(--font-mono)"
            >
              visual area
            </text>
          </svg>
        </WidgetLayout.Visual>
        <WidgetLayout.Controls>
          <Slider
            label="example"
            value={val}
            min={0}
            max={100}
            step={1}
            onChange={setVal}
          />
          <div style={{ marginTop: 8 }}>
            <Stat label="value" value={val.toFixed(0)} />
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <Btn>Action</Btn>
            <Btn kind="ghost" onClick={() => setVal(50)}>
              Reset
            </Btn>
          </div>
        </WidgetLayout.Controls>
        <WidgetLayout.Aside>
          The aside slot pins to the bottom of the controls column when there
          is room. In stacked / visual-top / visual-bottom arrangements it
          appears at the bottom of the entire layout.
        </WidgetLayout.Aside>
      </WidgetLayout>
    </div>
  );
}
