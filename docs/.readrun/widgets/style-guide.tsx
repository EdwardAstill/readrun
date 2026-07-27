import React, { useState } from "react";
import {
  Shell,
  Sub,
  Stage,
  Panel,
  Btn,
  Slider,
  Tabs,
  ToggleRow,
  Stat,
  Notice,
  SectionLabel,
} from "@readrun/widgets/primitives";

export function StyleGuide() {
  const [sliderVal, setSliderVal] = useState(50);
  const [tab, setTab] = useState("a");
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Shell title="readrun primitives - style guide">
        <Sub>Every primitive rendered once in a single shell.</Sub>

        <SectionLabel>Buttons</SectionLabel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <Btn kind="primary">Primary</Btn>
          <Btn kind="ghost">Ghost</Btn>
          <Btn kind="tag">Tag</Btn>
          <Btn kind="ghost" active>Ghost active</Btn>
        </div>

        <SectionLabel>Slider</SectionLabel>
        <div style={{ maxWidth: 320, marginBottom: 20 }}>
          <Slider label="example slider" min={0} max={100} value={sliderVal} onChange={setSliderVal} />
        </div>

        <SectionLabel>Tabs</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          <Tabs
            value={tab}
            items={[
              { id: "a", label: "Alpha" },
              { id: "b", label: "Beta" },
              { id: "c", label: "Gamma" },
            ]}
            onChange={setTab}
          />
          <div style={{ fontSize: 11, color: "#64748b" }}>Selected: {tab}</div>
        </div>

        <SectionLabel>ToggleRow</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          <ToggleRow checked={checked} onChange={setChecked}>
            Toggle something on/off
          </ToggleRow>
        </div>

        <SectionLabel>Stat</SectionLabel>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
          <Stat label="value" value={sliderVal.toFixed(0)} />
          <Stat label="pi" value="3.14159" color="#4f46e5" />
          <Stat label="status" value="ok" color="#10b981" />
        </div>

        <SectionLabel>Notice</SectionLabel>
        <Notice>
          This is a <strong>notice</strong> — use it for tips, caveats, or contextual info.
        </Notice>

        <SectionLabel style={{ marginTop: 20 }}>Shell / Sub / Stage / Panel</SectionLabel>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <Shell title="Nested shell" meta={<Stat label="items" value="3" />}>
            <Sub>A subtitle lives here.</Sub>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Stage>
                <div style={{ padding: "16px 24px", fontSize: 11, color: "#64748b" }}>
                  Stage content
                </div>
              </Stage>
              <Panel>
                <div style={{ padding: "16px", fontSize: 11, color: "#64748b" }}>
                  Panel content
                </div>
              </Panel>
            </div>
          </Shell>
        </div>
      </Shell>
    </div>
  );
}
