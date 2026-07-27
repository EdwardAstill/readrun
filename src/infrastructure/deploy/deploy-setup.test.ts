import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { deploymentFiles, setupDeployment } from "./deploy-setup.ts";
import { deploy, findGitRoot } from "./deploy.ts";

test("deploymentFiles writes platform-specific build commands", () => {
  expect(deploymentFiles("github", "docs")[0]?.content).toContain(
    "bunx rr build docs --platform=github",
  );
  expect(deploymentFiles("vercel", ".")[0]?.content).toContain(
    "bunx rr build . --platform=vercel",
  );
  expect(deploymentFiles("netlify", "notes")[0]?.content).toContain(
    "bunx rr build notes --platform=netlify",
  );
});

test("setupDeployment creates and protects existing config files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-deploy-setup-test-"));
  try {
    const contentDir = path.join(root, "docs");
    await mkdir(contentDir, { recursive: true });

    const created = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
    });
    expect(created.created).toEqual(["vercel.json"]);

    await Bun.write(path.join(root, "vercel.json"), "{}\n");
    const protectedResult = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
    });
    expect(protectedResult.existing).toEqual(["vercel.json"]);
    expect(await readFile(path.join(root, "vercel.json"), "utf8")).toBe("{}\n");

    const overwritten = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
      force: true,
    });
    expect(overwritten.overwritten).toEqual(["vercel.json"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deploy writes site artifacts to dist and config to the repository root", async () => {
  const platforms = [
    { platform: "github", config: path.join(".github", "workflows", "deploy.yml") },
    { platform: "vercel", config: "vercel.json" },
    { platform: "netlify", config: "netlify.toml" },
  ] as const;
  const repositoryConfigs = platforms.map(({ config }) => config);

  for (const { platform, config } of platforms) {
    const root = await mkdtemp(path.join(tmpdir(), `rr-deploy-${platform}-test-`));
    try {
      await mkdir(path.join(root, ".git"), { recursive: true });
      const contentDir = path.join(root, "docs");
      await mkdir(contentDir, { recursive: true });
      await Bun.write(path.join(contentDir, "index.md"), `# ${platform}\n`);
      if (platform === "vercel") {
        await mkdir(path.join(root, ".readrun"), { recursive: true });
        await Bun.write(path.join(root, ".readrun", "pw.txt"), "correct-horse-7\n");
      }

      const result = await deploy({ contentDir, platform }, root);

      expect(result.configCreated).toEqual([config]);
      expect(await Bun.file(path.join(root, "dist", "index.html")).exists()).toBe(true);
      expect(await Bun.file(path.join(root, config)).exists()).toBe(true);
      expect(await Bun.file(path.join(root, "dist", ".nojekyll")).exists()).toBe(
        platform === "github",
      );
      expect(result.authOutputWritten).toBe(platform === "vercel");
      expect(
        await Bun.file(path.join(root, ".vercel", "output", "config.json")).exists(),
      ).toBe(platform === "vercel");
      expect(
        await Bun.file(path.join(root, "dist", ".vercel", "output", "config.json")).exists(),
      ).toBe(false);
      if (platform === "vercel") {
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain("using repo-root");

        await rm(path.join(root, ".readrun", "pw.txt"));
        const unprotected = await deploy({ contentDir, platform }, root);
        expect(unprotected.authOutputWritten).toBe(false);
        expect(
          await Bun.file(path.join(root, ".vercel", "output", "config.json")).exists(),
        ).toBe(false);
      }
      for (const repositoryConfig of repositoryConfigs) {
        expect(
          await Bun.file(path.join(root, "dist", repositoryConfig)).exists(),
        ).toBe(false);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("findGitRoot walks up to repository root", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-git-root-test-"));
  try {
    await mkdir(path.join(root, ".git"), { recursive: true });
    await mkdir(path.join(root, "a", "b"), { recursive: true });
    expect(findGitRoot(path.join(root, "a", "b"))).toBe(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
