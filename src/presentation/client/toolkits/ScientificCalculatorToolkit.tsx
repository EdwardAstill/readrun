import type React from "react";
import { ScientificCalculator } from "sci-calc-widget";

export function ScientificCalculatorToolkit(): React.JSX.Element {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ScientificCalculator autoFocus />
    </div>
  );
}
