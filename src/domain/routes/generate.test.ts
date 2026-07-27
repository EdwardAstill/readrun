import { expect, test } from "bun:test";

import { detectRouteCollisions } from "./generate.ts";
import type { SiteRoute } from "./model.ts";

test("route collision detection treats case-distinct page routes as distinct", () => {
  const issues = detectRouteCollisions([
    pageRoute("/ANALYSIS/"),
    pageRoute("/analysis/"),
  ]);

  expect(issues).toEqual([]);
});

test("route collision detection still reports exact duplicate routes", () => {
  const issues = detectRouteCollisions([
    pageRoute("/analysis/"),
    pageRoute("/analysis"),
  ]);

  expect(issues).toHaveLength(1);
  expect(issues[0]?.code).toBe("route.collision");
});

function pageRoute(url: string): SiteRoute {
  return {
    kind: "page",
    url,
    page: {
      url,
      relPath: `${url.replace(/^\/|\/$/g, "")}.md`,
      title: url,
    },
  };
}
