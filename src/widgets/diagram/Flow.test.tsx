import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Flow } from "./Flow";

describe("Flow", () => {
  it("renders manually positioned nodes and their routed edge", () => {
    const html = renderToStaticMarkup(
      <Flow
        nodes={[
          { id: "start", label: "Start", x: 0, y: 0 },
          { id: "finish", label: "Finish", x: 200, y: 0, shape: "circle" },
        ]}
        edges={[{ id: "start-finish", from: "start", to: "finish" }]}
        layout="manual"
        width={400}
        height={200}
      />,
    );

    expect(html).toContain('viewBox="0 0 400 200"');
    expect(html).toContain('transform="translate(200, 20) scale(1)"');
    expect(html).toContain('d="M 50 0 L 150 0"');
    expect(html).toContain("Start");
    expect(html).toContain("Finish");
    expect(html).toContain("<circle");
  });

  it("keeps custom node and edge renderers intact", () => {
    const html = renderToStaticMarkup(
      <Flow
        nodes={[
          { id: "a", x: 0, y: 0 },
          { id: "b", x: 100, y: 0 },
        ]}
        edges={[{ id: "a-b", from: "a", to: "b" }]}
        layout="manual"
        width={300}
        height={150}
        draggable={false}
        renderNode={(node) => <g data-custom-node={node.id} />}
        renderEdge={(path, edge) => (
          <path key={edge.id} data-custom-edge={edge.id} d={path} />
        )}
      />,
    );

    expect(html).toContain('data-custom-node="a"');
    expect(html).toContain('data-custom-node="b"');
    expect(html).toContain('data-custom-edge="a-b"');
    expect(html).not.toContain("drag nodes");
  });
});
