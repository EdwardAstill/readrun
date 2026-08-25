import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildStaticProject } from "../../infrastructure/runtime/project-build.ts";
import { runBuildCommand } from "./build.ts";

const tempDirs: string[] = [];

async function makeProject(): Promise<{ root: string; out: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "rr-build-command-test-"));
  tempDirs.push(root);
  await mkdir(path.join(root, ".readrun", "assets", "images"), { recursive: true });
  await Bun.write(path.join(root, "index.md"), "# Hello\n\nRendered paragraph.\n");
  await Bun.write(path.join(root, ".readrun", "assets", "images", "dot.svg"), "<svg />");
  return { root, out: path.join(root, "site") };
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runBuildCommand honors --output alias and emits rendered markdown", async () => {
  const project = await makeProject();

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "github",
  });

  const html = await Bun.file(path.join(project.out, "index.html")).text();
  const clientCss = await Bun.file(
    path.join(project.out, "_readrun", "client.css"),
  ).text();
  expect(html).toContain('<h1 id="hello">Hello</h1>');
  expect(html).not.toContain("# Hello");
  expect(html).not.toContain("cdn.jsdelivr.net/npm/katex");
  expect(html).not.toContain("fonts/KaTeX");
  expect(clientCss).toContain(".katex");
  expect(await Bun.file(path.join(project.out, ".nojekyll")).exists()).toBe(true);
  expect(
    await Bun.file(path.join(project.out, ".github", "workflows", "deploy.yml")).exists(),
  ).toBe(false);
  expect(await Bun.file(path.join(project.out, "_readrun", "assets", "images", "dot.svg")).exists()).toBe(true);
});

test("GitHub project builds prefix root-relative site URLs", async () => {
  const project = await makeProject();
  const projectDir = path.join(project.root, "readrun");
  await mkdir(projectDir, { recursive: true });
  await Bun.write(
    path.join(project.root, "index.md"),
    '# Hello\n\n[Other page](/other)\n\n<div data-model-src="/model.stl"></div>\n',
  );

  await buildStaticProject({
    contentDir: project.root,
    outDir: project.out,
    platform: "github",
    projectDir,
  });

  const html = await Bun.file(path.join(project.out, "index.html")).text();
  expect(html).toContain('href="/readrun/_readrun/client.css"');
  expect(html).toContain('src="/readrun/_readrun/client.js"');
  expect(html).toContain('href="/readrun/other"');
  expect(html).toContain('data-model-src="/readrun/model.stl"');

  const searchIndex = await Bun.file(
    path.join(project.out, "_readrun", "search-index.json"),
  ).json();
  expect(searchIndex[0]?.url).toBe("/readrun/");
});

test("runBuildCommand keeps repository deploy config out of every platform output", async () => {
  const platformOutputs = [
    { platform: "plain", siteFile: null },
    { platform: "github", siteFile: ".nojekyll" },
    { platform: "vercel", siteFile: null },
    { platform: "netlify", siteFile: null },
  ] as const;
  const repositoryConfigs = [
    path.join(".github", "workflows", "deploy.yml"),
    "vercel.json",
    "netlify.toml",
  ];

  for (const { platform, siteFile } of platformOutputs) {
    const project = await makeProject();
    await runBuildCommand({
      path: project.root,
      output: project.out,
      platform,
    });

    expect(await Bun.file(path.join(project.out, "index.html")).exists()).toBe(true);
    expect(await Bun.file(path.join(project.out, ".nojekyll")).exists()).toBe(
      siteFile === ".nojekyll",
    );
    for (const config of repositoryConfigs) {
      expect(await Bun.file(path.join(project.out, config)).exists()).toBe(false);
    }
  }
});

test("runBuildCommand removes stale platform-owned files from a reused output", async () => {
  const project = await makeProject();
  await mkdir(path.join(project.out, ".github", "workflows"), { recursive: true });
  await Bun.write(path.join(project.out, ".nojekyll"), "");
  await Bun.write(path.join(project.out, ".github", "workflows", "deploy.yml"), "old\n");
  await Bun.write(path.join(project.out, "vercel.json"), "{}\n");
  await Bun.write(path.join(project.out, "netlify.toml"), "old\n");

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "plain",
  });

  for (const relPath of [
    ".nojekyll",
    path.join(".github", "workflows", "deploy.yml"),
    "vercel.json",
    "netlify.toml",
  ]) {
    expect(await Bun.file(path.join(project.out, relPath)).exists()).toBe(false);
  }
});

test("runBuildCommand replaces stale site output", async () => {
  const project = await makeProject();
  await mkdir(path.join(project.out, "removed-page"), { recursive: true });
  await Bun.write(path.join(project.out, "removed-page", "index.html"), "stale\n");

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "plain",
  });

  expect(
    await Bun.file(path.join(project.out, "removed-page", "index.html")).exists(),
  ).toBe(false);
});

test("runBuildCommand refuses an output that contains the source", async () => {
  const project = await makeProject();

  await expect(runBuildCommand({
    path: project.root,
    output: project.root,
    platform: "plain",
  })).rejects.toThrow("contains the content folder");

  expect(await Bun.file(path.join(project.root, "index.md")).exists()).toBe(true);
});

test("static builds refuse an output that contains the working directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-build-safety-test-"));
  tempDirs.push(root);
  const contentDir = path.join(root, "content");
  const projectDir = path.join(root, "project");
  await mkdir(contentDir, { recursive: true });
  await mkdir(projectDir, { recursive: true });
  await Bun.write(path.join(contentDir, "index.md"), "# Safe source\n");
  await Bun.write(path.join(projectDir, "keep.txt"), "keep\n");

  await expect(buildStaticProject({
    contentDir,
    outDir: projectDir,
    platform: null,
    projectDir,
  })).rejects.toThrow("contains the working directory");

  expect(await Bun.file(path.join(projectDir, "keep.txt")).text()).toBe("keep\n");
});

test("runBuildCommand builds widgets before rendering markdown refs", async () => {
  const project = await makeProject();
  await mkdir(path.join(project.root, ".readrun", "widgets"), { recursive: true });
  await Bun.write(
    path.join(project.root, "index.md"),
    "# Widget\n\n[jsx=demo-widget.jsx]\n",
  );
  await Bun.write(
    path.join(project.root, ".readrun", "widgets", "demo-widget.tsx"),
    `import React from "react";

export function DemoWidget() {
  return <div>Widget ok</div>;
}
`,
  );

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "plain",
  });

  const generated = path.join(
    project.root,
    ".readrun",
    ".widgets-out",
    "demo-widget.jsx",
  );
  expect(await Bun.file(generated).exists()).toBe(true);

  const html = await Bun.file(path.join(project.out, "index.html")).text();
  expect(html).toContain('data-language="jsx"');
  expect(html).toContain("Widget ok");
});

test("runBuildCommand emits Pyodide data aliases from the discovered asset index", async () => {
  const project = await makeProject();
  const dataDir = path.join(project.root, ".readrun", "assets", "data");
  await mkdir(path.join(dataDir, "ignored"), { recursive: true });
  await Bun.write(path.join(dataDir, "input.txt"), "included\n");
  await Bun.write(path.join(dataDir, "ignored", "private.txt"), "ignored\n");
  await Bun.write(
    path.join(project.root, ".readrun", "ignore"),
    ".readrun/assets/data/ignored/**\n",
  );

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "plain",
  });

  expect(
    await Bun.file(path.join(project.out, "_readrun", "files", "input.txt")).exists(),
  ).toBe(true);
  expect(
    await Bun.file(
      path.join(project.out, "_readrun", "files", "ignored", "private.txt"),
    ).exists(),
  ).toBe(false);
});

test("static builds emit independent embedded quiz islands and no standalone quiz route", async () => {
  const project = await makeProject();
  await mkdir(path.join(project.root, ".readrun", "quizzes"), { recursive: true });
  await Bun.write(
    path.join(project.root, ".readrun", "quizzes", "ignored.quiz.md"),
    "# This is not a page\n",
  );
  await Bun.write(
    path.join(project.root, "index.md"),
    `# Embedded quizzes

Before the first quiz.

[quiz id=first]
[question type=single]
Choose <em>A</em>.
- [x] A
- [ ] B
[/question]
[/quiz]

Between the quizzes.

[quiz id=second]
[question type=freetext]
Type yes.
= yes
[/question]
[/quiz]

After the second quiz.
`,
  );

  await runBuildCommand({
    path: project.root,
    output: project.out,
    platform: "plain",
  });

  const html = await Bun.file(path.join(project.out, "index.html")).text();
  expect(html.match(/data-island="quiz"/g)).toHaveLength(2);
  expect(html).toContain('data-quiz-instance="page-first-1"');
  expect(html).toContain('data-quiz-instance="page-second-2"');
  expect(html).toContain("Before the first quiz.");
  expect(html).toContain("Between the quizzes.");
  expect(html).toContain("After the second quiz.");
  expect(html).toContain("\\u003cem>A\\u003c/em>");
  expect(html).toContain('src="/_readrun/client.js"');
  expect(
    await Bun.file(
      path.join(project.out, ".readrun", "quizzes", "ignored.quiz", "index.html"),
    ).exists(),
  ).toBe(false);
});
