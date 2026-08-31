import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScientificCalculatorToolkit } from "./ScientificCalculatorToolkit.tsx";

test("hosts only the scientific calculator body", () => {
  const html = renderToStaticMarkup(<ScientificCalculatorToolkit />);

  expect(html).toContain('aria-label="Scientific calculator"');
  expect(html).toContain("Calculator expression");
  expect(html).not.toContain(">Graphing<");
  expect(html).not.toContain(">Tools<");
});
