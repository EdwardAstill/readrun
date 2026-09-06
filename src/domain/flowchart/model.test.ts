import { expect, test } from "bun:test";
import { parseFlowchart } from "./model.ts";

const node = (id: string) => ({ id, position: { x: 0, y: 100 }, data: { label: id, description: "Details" } });
const graph = { nodes: [node("a"), node("b")], edges: [{ id: "ab", source: "a", target: "b", label: "Next" }] };

test("parses JSON nodes, card content, positions, and labelled edges", () => {
  expect(parseFlowchart(JSON.stringify(graph))).toEqual(graph);
  expect(parseFlowchart('{"nodes":[],"edges":[]}')).toEqual({ nodes: [], edges: [] });
});

test("rejects malformed graphs and broken references", () => {
  for (const value of [null, {}, { nodes: {}, edges: [] },
    { ...graph, nodes: [node("a"), node("a")] },
    { ...graph, nodes: [{ ...node("a"), position: { x: "0", y: 0 } }] },
    { ...graph, nodes: [{ ...node("a"), data: { label: 3 } }] },
    { ...graph, edges: [...graph.edges, ...graph.edges] },
    { ...graph, edges: [{ id: "bad", source: "a", target: "missing" }] },
  ]) expect(() => parseFlowchart(JSON.stringify(value))).toThrow();
  expect(() => parseFlowchart("not JSON")).toThrow();
});

test("preserves arrow and plain connections and rejects non-boolean arrow settings", () => {
  for (const arrow of [true, false]) {
    const mixed = { ...graph, edges: [{ ...graph.edges[0]!, arrow }] };
    expect(parseFlowchart(JSON.stringify(mixed))).toEqual(mixed);
  }
  for (const arrow of ["false", 0, null]) {
    expect(() => parseFlowchart(JSON.stringify({ ...graph, edges: [{ ...graph.edges[0]!, arrow }] }))).toThrow("arrow must be a boolean");
  }
});

test("discards executable and styling fields from JSON", () => {
  const parsed = parseFlowchart(JSON.stringify({ nodes: [{ ...node("a"), type: "html", style: { display: "none" }, data: { label: "<script>alert(1)</script>" } }], edges: [] }));
  expect(parsed.nodes[0]).not.toHaveProperty("type");
  expect(parsed.nodes[0]).not.toHaveProperty("style");
  expect(parsed.nodes[0]!.data.label).toBe("<script>alert(1)</script>");
});
