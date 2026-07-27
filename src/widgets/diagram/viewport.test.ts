import { describe, expect, it } from "bun:test";
import type { SVGMatrixLike } from "../interaction/coords";
import { clientToFlow, panFromPointer, zoomFromWheel } from "./viewport";

function scaledCtm(scale: number, translateX: number, translateY: number): SVGMatrixLike {
  const forward: SVGMatrixLike = {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: translateX,
    f: translateY,
    inverse() {
      return {
        a: 1 / scale,
        b: 0,
        c: 0,
        d: 1 / scale,
        e: -translateX / scale,
        f: -translateY / scale,
        inverse: () => forward,
      };
    },
  };
  return forward;
}

describe("Flow viewport coordinates", () => {
  it("converts client coordinates through the SVG and inner transforms", () => {
    const target = { getScreenCTM: () => scaledCtm(2, 100, 40) };

    expect(
      clientToFlow(target, 500, 280, 100, 20, {
        panX: 20,
        panY: 10,
        zoom: 2,
      }),
    ).toEqual({ x: 40, y: 45 });
  });

  it("returns null when the SVG is detached", () => {
    const target = { getScreenCTM: () => null };
    expect(
      clientToFlow(target, 100, 100, 0, 0, { panX: 0, panY: 0, zoom: 1 }),
    ).toBeNull();
  });

  it("pans by the pointer delta without changing zoom", () => {
    expect(
      panFromPointer(
        { panX: 10, panY: -5, zoom: 1.5 },
        { x: 20, y: 30 },
        { x: 45, y: 18 },
      ),
    ).toEqual({ panX: 35, panY: -17, zoom: 1.5 });
  });

  it("clamps wheel zoom to the supported range", () => {
    expect(zoomFromWheel(1, -500)).toBe(1.5);
    expect(zoomFromWheel(2.5, -500)).toBe(3);
    expect(zoomFromWheel(1, 2_000)).toBe(0.25);
  });
});
