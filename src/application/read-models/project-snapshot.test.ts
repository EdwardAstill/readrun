import { expect, test } from "bun:test";

import type { ContentFile, ContentSource } from "../ports/content-source.ts";
import { loadContentProjectSnapshot } from "./project-snapshot.ts";
import type { ContentProjectConfig } from "../../domain/project/model.ts";

test("uses README.md as the root route when a folder has no explicit index page", async () => {
  const snapshot = await snapshotFor({
    "README.md": "# Project notes",
    "guide.md": "# Guide",
  });

  expect(rootRouteRelPath(snapshot.routes)).toBe("README.md");
});

test("discovers PDFs as pages without reading them as text", async () => {
  const pdfFile = pageFile("slides/Week 1.pdf");
  const snapshot = await loadContentProjectSnapshot(
    {
      root: "/notes",
      config: {
        contentDir: "/notes",
        mode: "tree",
        treeSource: "filesystem",
        ignorePatterns: [],
        issues: [],
      } as ContentProjectConfig,
      files: [pdfFile],
    },
    {
      contentSource: {
        async listFiles() {
          return [pdfFile];
        },
        async readText() {
          throw new Error("PDF content must not be read as text");
        },
      },
    },
  );

  expect(snapshot.contentIndex.byRelPath.get("slides/Week 1.pdf")).toEqual(
    expect.objectContaining({
      kind: "pdf",
      title: "Week 1",
      url: "/slides/Week 1",
      sourceUrl: "/slides/Week 1.pdf",
    }),
  );
  expect(snapshot.routes).toContainEqual(
    expect.objectContaining({
      kind: "asset",
      url: "/slides/Week 1.pdf",
    }),
  );
});

test("uses conventional root landing names before falling back to the first page", async () => {
  const snapshot = await snapshotFor({
    "alpha.md": "# Alpha",
    "README.md": "# Project notes",
    "welcome.md": "# Welcome",
  });

  expect(rootRouteRelPath(snapshot.routes)).toBe("welcome.md");
});

test("keeps an explicit index.md page as the canonical root route", async () => {
  const snapshot = await snapshotFor({
    "index.md": "# Index",
    "welcome.md": "# Welcome",
  });

  expect(rootRouteRelPath(snapshot.routes)).toBe("index.md");
  expect(snapshot.routes.filter((route) => route.url === "/")).toHaveLength(1);
});

test("uses an authored navigation index before filesystem conventions", async () => {
  const snapshot = await snapshotFor(
    {
      "README.md": "# Project notes",
      "docs/home.md": "# Authored home",
    },
    {
      mode: "tree",
      treeSource: "navigation",
      navigationPath: ".readrun/navigation.yaml",
      navigationDocument: {
        index: { raw: "docs/home.md", path: "docs/home.md" },
        entries: [],
        issues: [],
      },
    },
  );

  expect(rootRouteRelPath(snapshot.routes)).toBe("docs/home.md");
});

test("falls back to the first page when no root convention exists", async () => {
  const snapshot = await snapshotFor({
    "zeta.md": "# Zeta",
    "alpha.md": "# Alpha",
  });

  expect(rootRouteRelPath(snapshot.routes)).toBe("alpha.md");
});

test("uses the wiki entry page as the root route", async () => {
  const snapshot = await snapshotFor(
    {
      "api-design.md": "# API Design",
      "index.md": "# JavaScript",
      "knowledge.md": "# Knowledge Map",
    },
    {
      mode: "wiki",
      entryPath: "knowledge.md",
    },
  );

  expect(rootRouteRelPath(snapshot.routes)).toBe("knowledge.md");
  expect(pageRouteRelPath(snapshot.routes, "/index/")).toBe("index.md");
});

test("resolves jsx executable refs from generated widget output", async () => {
  const snapshot = await loadContentProjectSnapshot(
    {
      root: "/notes",
      config: {
        contentDir: "/notes",
        mode: "tree",
        treeSource: "filesystem",
        ignorePatterns: [],
        issues: [],
      } as ContentProjectConfig,
      files: [pageFile("index.md")],
    },
    {
      contentSource: contentSource({
        "index.md": "# Widget\n\n[jsx=demo.jsx]\n",
        ".readrun/.widgets-out/demo.jsx": [
          "const points = [[1, 1, 1]];",
          "const selected = points[focusedId];",
          "render(<Demo />);",
        ].join("\n"),
      }),
    },
  );

  const page = snapshot.contentIndex.byRelPath.get("index.md");
  if (page?.kind !== "markdown") {
    throw new Error("Expected index.md to be a markdown page");
  }
  expect(page.body).toContain("const selected = points[focusedId]");
  expect(page.outboundLinks).toHaveLength(0);
	expect(snapshot.validation?.warnings).toHaveLength(0);
});

test("resolves output-only plot JSX refs from generated widget output", async () => {
	const snapshot = await loadContentProjectSnapshot(
		{
			root: "/notes",
			config: {
				contentDir: "/notes",
				mode: "tree",
				treeSource: "filesystem",
				ignorePatterns: [],
				issues: [],
			} as ContentProjectConfig,
			files: [pageFile("index.md")],
		},
		{
			contentSource: contentSource({
				"index.md": "# Plot\n\n[plot-jsx=heatmap-demo.jsx]\n",
				".readrun/.widgets-out/heatmap-demo.jsx": "render(<HeatmapDemo />);",
			}),
		},
	);

	const page = snapshot.contentIndex.byRelPath.get("index.md");
	if (page?.kind !== "markdown") {
		throw new Error("Expected index.md to be a markdown page");
	}
	expect(page.body).toContain("[plot-jsx]");
	expect(page.body).toContain("render(<HeatmapDemo />);");
	expect(snapshot.validation?.warnings).toHaveLength(0);
});

test("reports missing executable source references", async () => {
  const snapshot = await snapshotFor({
    "index.md": "# Missing\n\n[python=scripts/missing.py]\n",
  });

  expect(snapshot.validation?.warnings).toContainEqual(
    expect.objectContaining({
      code: "executable.ref.missing",
      position: expect.objectContaining({ relPath: "index.md", line: 3 }),
    }),
  );
});

test("does not resolve executable refs inside fenced code examples", async () => {
  const snapshot = await loadContentProjectSnapshot(
    {
      root: "/notes",
      config: {
        contentDir: "/notes",
        mode: "tree",
        treeSource: "filesystem",
        ignorePatterns: [],
        issues: [],
      } as ContentProjectConfig,
      files: [pageFile("index.md")],
    },
    {
      contentSource: contentSource({
        "index.md": "# Example\n\n```markdown\n[jsx=demo.jsx]\n```\n",
        ".readrun/.widgets-out/demo.jsx": "render(<Demo />);",
      }),
    },
  );

  const page = snapshot.contentIndex.byRelPath.get("index.md");
  if (page?.kind !== "markdown") {
    throw new Error("Expected index.md to be a markdown page");
  }
  expect(page.body).toContain("```markdown\n[jsx=demo.jsx]\n```");
  expect(page.body).not.toContain("render(<Demo />)");
});

function pageFile(relPath: string): ContentFile {
  return {
    filePath: `/notes/${relPath}`,
    relPath,
    mtimeMs: 0,
    decision: {
      relPath,
      public: true,
      kind: "page",
      reason: "supported-page",
    },
  };
}

async function snapshotFor(
  files: Record<string, string>,
  config: Partial<ContentProjectConfig> = {},
) {
  return loadContentProjectSnapshot(
    {
      root: "/notes",
      config: {
        contentDir: "/notes",
        mode: "tree",
        treeSource: "filesystem",
        ignorePatterns: [],
        issues: [],
        ...config,
      } as ContentProjectConfig,
      files: Object.keys(files).map(pageFile),
    },
    {
      contentSource: contentSource(files),
    },
  );
}

function rootRouteRelPath(routes: Awaited<ReturnType<typeof snapshotFor>>["routes"]) {
  return pageRouteRelPath(routes, "/");
}

function pageRouteRelPath(
  routes: Awaited<ReturnType<typeof snapshotFor>>["routes"],
  url: string,
) {
  const route = routes.find((route) => route.url === url);

  expect(route?.kind).toBe("page");
  return route?.kind === "page" ? route.page.relPath : null;
}

function contentSource(files: Record<string, string>): ContentSource {
  return {
    async listFiles() {
      return Object.keys(files).map(pageFile);
    },
    async readText(relPath) {
      const source = files[relPath];
      if (source == null) {
        throw new Error(`Missing fixture: ${relPath}`);
      }

      return source;
    },
  };
}
