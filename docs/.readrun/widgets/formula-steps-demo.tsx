import React, { useState } from "react";
import { Shell, Sub, Slider, FormulaSteps, SectionLabel } from "@readrun/widgets/primitives";

// Standard-normal quantile (Beasley-Springer-Moro rational approx, good enough for a demo).
function zq(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  const s = p < 0.5 ? -1 : 1;
  const q = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(q));
  return s * (t - (2.515517 + 0.802853 * t + 0.010328 * t * t) /
    (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t));
}

export function FormulaStepsDemo() {
  const [n, setN] = useState(40);
  const [p, setP] = useState(0.99);
  const [g, setG] = useState(0.95);

  const d = 1;
  const af = 1.85;
  const nu = n - d - 1;
  const zp = zq(p);
  const zgam = zq(g);
  const r = af / nu;
  const K = zp * Math.sqrt(1 + r) + zgam * Math.sqrt(r + (zp * zp * r) / (2 * nu));

  return (
    <Shell title="FormulaSteps">
      <Sub>
        Live derivation block — each step shows the expression on the left and the
        current value on the right. Drives any widget that teaches a closed-form formula.
      </Sub>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 380, flex: 1 }}>
          <FormulaSteps
            title="K_Owen tolerance factor"
            steps={[
              { label: "1.", expr: <>ā<sub>f</sub> (table, d = 1)</>, value: af.toFixed(2) },
              { label: "2.", expr: <>ν = n − d − 1</>, value: String(nu) },
              { label: "3.", expr: <>z<sub>p</sub> = Φ⁻¹(p)</>, value: zp.toFixed(3) },
              { label: "4.", expr: <>z<sub>γ</sub> = Φ⁻¹(γ)</>, value: zgam.toFixed(3) },
              {
                label: "5.",
                expr: (
                  <>
                    K ≈ z<sub>p</sub>·√(1 + ā<sub>f</sub>/ν) + z<sub>γ</sub>·√(ā<sub>f</sub>/ν + z<sub>p</sub>²·ā<sub>f</sub>/(2ν²))
                  </>
                ),
                value: K.toFixed(3),
              },
            ]}
          />
        </div>

        <div style={{ minWidth: 220 }}>
          <SectionLabel>Inputs</SectionLabel>
          <Slider label="n (sample size)" value={n} min={8} max={200} step={1} onChange={setN} />
          <Slider label="p (probability)" value={p} min={0.9} max={0.999} step={0.005} onChange={setP} />
          <Slider label="γ (confidence)" value={g} min={0.8} max={0.99} step={0.01} onChange={setG} />
        </div>
      </div>
    </Shell>
  );
}
