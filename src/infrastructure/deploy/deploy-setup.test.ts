import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { deploymentFiles, setupDeployment } from "./deploy-setup.ts";
import {
  deploy,
  findGitRoot,
  installSiteDependencies,
  platformNextSteps,
  resolveReadrunDependency,
  type DeployDependencies,
  type SiteInstallOptions,
} from "./deploy.ts";

const localCliPath = path.resolve(import.meta.dir, "../../cli.ts");
const testReadrunDependency =
  "github:EdwardAstill/readrun#0123456789abcdef0123456789abcdef01234567";

function fakeInstaller(
  calls: SiteInstallOptions[] = [],
): DeployDependencies {
  return {
    async resolveReadrunDependency() {
      return testReadrunDependency;
    },
    async installSiteDependencies(options) {
      calls.push(options);
      await mkdir(path.join(options.siteDir, "node_modules", ".bin"), {
        recursive: true,
      });
      await Bun.write(
        path.join(options.siteDir, "node_modules", ".installed"),
        "test install\n",
      );
      await Bun.write(path.join(options.siteDir, "bun.lock"), "test lock\n");
    },
  };
}

test("deploymentFiles writes platform-specific build commands", () => {
  const githubFiles = deploymentFiles("github", "docs");
  const vercelFiles = deploymentFiles("vercel", "docs");
  const netlifyFiles = deploymentFiles("netlify", "docs");
  expect(githubFiles[0]?.content).toBe(vercelFiles[0]?.content);
  expect(vercelFiles[0]?.content).toBe(netlifyFiles[0]?.content);

  expect(githubFiles[0]?.content).toContain(
    '"build:github": "rr build docs --project-root=.. --platform=github"',
  );
  expect(deploymentFiles("vercel", ".")[0]?.content).toContain(
    '"build:vercel": "rr build . --project-root=.. --platform=vercel"',
  );
  expect(deploymentFiles("netlify", "notes")[0]?.content).toContain(
    '"build:netlify": "rr build notes --project-root=.. --platform=netlify"',
  );

  const vercelConfig = deploymentFiles("vercel", "../notes").find(
    (file) => file.path === "vercel.json",
  )?.content;
  expect(vercelConfig).toContain(
    '"installCommand": "bun install --cwd site --frozen-lockfile"',
  );
  expect(vercelConfig).toContain(
    '"buildCommand": "bun run --cwd site build:vercel"',
  );
  expect(vercelConfig).toContain('"outputDirectory": "site/dist"');

  const githubWorkflow = deploymentFiles("github", "../notes").find(
    (file) => file.path === ".github/workflows/deploy.yml",
  )?.content;
  expect(githubWorkflow).toContain("bun install --cwd site --frozen-lockfile");
  expect(githubWorkflow).toContain("bun run --cwd site build:github");
  expect(githubWorkflow).toContain("path: site/dist");

  const netlifyConfig = deploymentFiles("netlify", "../notes").find(
    (file) => file.path === "netlify.toml",
  )?.content;
  expect(netlifyConfig).toContain("bun install --cwd site --frozen-lockfile");
  expect(netlifyConfig).toContain("bun run --cwd site build:netlify");
  expect(netlifyConfig).toContain('publish = "site/dist"');
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
    expect(created.created).toEqual([
      "site/package.json",
      "site/.gitignore",
      "vercel.json",
    ]);

    await Bun.write(path.join(root, "site", "package.json"), "{}\n");
    await Bun.write(path.join(root, "vercel.json"), "{}\n");
    const protectedResult = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
    });
    expect(protectedResult.existing).toEqual([
      "site/package.json",
      "site/.gitignore",
      "vercel.json",
    ]);
    expect(await readFile(path.join(root, "site", "package.json"), "utf8")).toBe(
      "{}\n",
    );
    expect(await readFile(path.join(root, "vercel.json"), "utf8")).toBe("{}\n");

    const overwritten = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
      force: true,
    });
    expect(overwritten.existing).toEqual(["site/.gitignore"]);
    expect(overwritten.overwritten).toEqual(["site/package.json", "vercel.json"]);

    await Bun.write(
      path.join(root, "site", ".gitignore"),
      "# user rules\ncache/\nnode_modules/\n",
    );
    const merged = await setupDeployment({
      projectDir: root,
      contentDir,
      platform: "vercel",
    });
    expect(merged.existing).toEqual(["site/package.json", "vercel.json"]);
    expect(merged.overwritten).toEqual(["site/.gitignore"]);
    expect(await readFile(path.join(root, "site", ".gitignore"), "utf8")).toBe(
      "# user rules\ncache/\nnode_modules/\ndist/\n",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deploy writes artifacts to site/dist and config to the repository root", async () => {
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

      const result = await deploy(
        { contentDir, platform },
        root,
        fakeInstaller(),
      );

      expect(result.configCreated).toEqual([
        "site/package.json",
        "site/.gitignore",
        config,
      ]);
      expect(
        await Bun.file(path.join(root, "site", "dist", "index.html")).exists(),
      ).toBe(true);
      expect(result.outDir).toBe(path.join(root, "site", "dist"));
      expect(await Bun.file(path.join(root, config)).exists()).toBe(true);
      expect(
        await Bun.file(path.join(root, "site", "dist", ".nojekyll")).exists(),
      ).toBe(platform === "github");
      const sitePackage = JSON.parse(
        await readFile(path.join(root, "site", "package.json"), "utf8"),
      );
      expect(sitePackage.packageManager).toBe("bun@1.4.0");
      expect(sitePackage.dependencies.readrun).toBe(testReadrunDependency);
      expect(sitePackage.scripts.build).toBe(
        "rr build ../docs --project-root=..",
      );
      expect(sitePackage.scripts[`build:${platform}`]).toBe(
        `rr build ../docs --project-root=.. --platform=${platform}`,
      );
      expect(await readFile(path.join(root, "site", ".gitignore"), "utf8")).toBe(
        "node_modules/\ndist/\n",
      );
      expect(await Bun.file(path.join(root, "site", "bun.lock")).exists()).toBe(
        true,
      );
      expect(
        await Bun.file(
          path.join(root, "site", "node_modules", ".installed"),
        ).exists(),
      ).toBe(true);
      if (platform === "github") {
        const workflow = await readFile(
          path.join(root, ".github", "workflows", "deploy.yml"),
          "utf8",
        );
        expect(workflow).toContain("oven-sh/setup-bun@v2");
        expect(workflow).toContain("bun-version: 1.4.0");
        expect(workflow).not.toContain("setup-bun@v1");
      }
      expect(result.authOutputWritten).toBe(platform === "vercel");
      expect(
        await Bun.file(path.join(root, ".vercel", "output", "config.json")).exists(),
      ).toBe(platform === "vercel");
      expect(
        await Bun.file(
          path.join(root, "site", "dist", ".vercel", "output", "config.json"),
        ).exists(),
      ).toBe(false);
      if (platform === "vercel") {
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain("using repo-root");

        await rm(path.join(root, ".readrun", "pw.txt"));
        const unprotected = await deploy(
          { contentDir, platform },
          root,
          fakeInstaller(),
        );
        expect(unprotected.authOutputWritten).toBe(false);
        expect(
          await Bun.file(path.join(root, ".vercel", "output", "config.json")).exists(),
        ).toBe(false);
      }
      for (const repositoryConfig of repositoryConfigs) {
        expect(
          await Bun.file(path.join(root, "site", "dist", repositoryConfig)).exists(),
        ).toBe(false);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("deploy resolves and then freezes site dependency installs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-deploy-install-test-"));
  const calls: SiteInstallOptions[] = [];
  try {
    await mkdir(path.join(root, ".git"), { recursive: true });
    const contentDir = path.join(root, "docs");
    await mkdir(contentDir, { recursive: true });
    await Bun.write(path.join(contentDir, "index.md"), "# Install\n");

    await deploy({ contentDir, platform: "github" }, root, fakeInstaller(calls));
    await deploy({ contentDir, platform: "github" }, root, fakeInstaller(calls));
    await deploy(
      { contentDir, platform: "github", force: true },
      root,
      fakeInstaller(calls),
    );

    expect(calls.map(({ frozenLockfile }) => frozenLockfile)).toEqual([
      false,
      true,
      false,
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deploy rejects scaffold and output ownership conflicts before building", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-deploy-conflict-test-"));
  let installCalls = 0;
  try {
    await mkdir(path.join(root, ".git"), { recursive: true });
    const contentDir = path.join(root, "docs");
    await mkdir(contentDir, { recursive: true });
    await Bun.write(path.join(contentDir, "index.md"), "# Conflict\n");
    await mkdir(path.join(root, "site", "dist"), { recursive: true });
    await Bun.write(path.join(root, "site", "dist", "keep.txt"), "keep\n");
    await Bun.write(path.join(root, "site", "package.json"), "{}\n");

    const dependencies: DeployDependencies = {
      async installSiteDependencies() {
        installCalls += 1;
      },
    };
    await expect(
      deploy({ contentDir, platform: "github" }, root, dependencies),
    ).rejects.toThrow("site/package.json, site/dist");
    expect(installCalls).toBe(0);
    expect(await readFile(path.join(root, "site", "dist", "keep.txt"), "utf8")).toBe(
      "keep\n",
    );
    expect(
      await Bun.file(path.join(root, ".github", "workflows", "deploy.yml")).exists(),
    ).toBe(false);

    await deploy(
      { contentDir, platform: "github", force: true },
      root,
      fakeInstaller(),
    );
    expect(await Bun.file(path.join(root, "site", "dist", "keep.txt")).exists()).toBe(
      false,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deploy rejects content outside the repository and symlink escapes", async () => {
  const parent = await mkdtemp(path.join(tmpdir(), "rr-deploy-boundary-test-"));
  try {
    const root = path.join(parent, "repo");
    const outside = path.join(parent, "outside");
    await mkdir(path.join(root, ".git"), { recursive: true });
    await mkdir(outside, { recursive: true });
    await Bun.write(path.join(outside, "index.md"), "# Outside\n");

    await expect(
      deploy({ contentDir: outside, platform: "github" }, root, fakeInstaller()),
    ).rejects.toThrow("must be inside the git repository");

    const escaped = path.join(root, "escaped");
    await symlink(outside, escaped, "dir");
    await expect(
      deploy({ contentDir: escaped, platform: "github" }, root, fakeInstaller()),
    ).rejects.toThrow("must be inside the git repository");
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("generated GitHub and authenticated Vercel scripts run with repo project root", async () => {
  for (const platform of ["github", "vercel"] as const) {
    const root = await mkdtemp(path.join(tmpdir(), `rr-script-${platform}-test-`));
    try {
      await mkdir(path.join(root, ".git"), { recursive: true });
      const contentDir = path.join(root, "docs with 'quote");
      await mkdir(contentDir, { recursive: true });
      await Bun.write(path.join(contentDir, "index.md"), `# ${platform}\n`);
      if (platform === "vercel") {
        await mkdir(path.join(root, ".readrun"), { recursive: true });
        await Bun.write(path.join(root, ".readrun", "pw.txt"), "correct-horse-7\n");
      }

      await deploy({ contentDir, platform }, root, fakeInstaller());
      const binPath = path.join(root, "site", "node_modules", ".bin", "rr");
      await rm(binPath, { force: true });
      await symlink(localCliPath, binPath);
      await rm(path.join(root, "site", "dist"), { recursive: true, force: true });
      await rm(path.join(root, ".vercel", "output"), {
        recursive: true,
        force: true,
      });

      const subprocess = Bun.spawn(
        ["bun", "run", "--cwd", "site", `build:${platform}`],
        { cwd: root, stdout: "pipe", stderr: "pipe" },
      );
      const [exitCode, stdout, stderr] = await Promise.all([
        subprocess.exited,
        new Response(subprocess.stdout).text(),
        new Response(subprocess.stderr).text(),
      ]);
      if (exitCode !== 0) {
        throw new Error(`Generated ${platform} script failed:\n${stdout}\n${stderr}`);
      }

      const html = await readFile(path.join(root, "site", "dist", "index.html"), "utf8");
      if (platform === "github") {
        expect(html).toContain(`/${path.basename(root)}/`);
      } else {
        expect(
          await Bun.file(path.join(root, ".vercel", "output", "config.json")).exists(),
        ).toBe(true);
        expect(
          await Bun.file(
            path.join(root, "site", ".vercel", "output", "config.json"),
          ).exists(),
        ).toBe(false);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("deploy supports the repository root as content beside site output", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "rr-deploy-root-content-test-"));
  try {
    await mkdir(path.join(root, ".git"), { recursive: true });
    await Bun.write(path.join(root, "index.md"), "# Root content\n");

    await deploy(
      { contentDir: root, platform: "github" },
      root,
      fakeInstaller(),
    );

    const sitePackage = JSON.parse(
      await readFile(path.join(root, "site", "package.json"), "utf8"),
    );
    expect(sitePackage.scripts["build:github"]).toBe(
      "rr build .. --project-root=.. --platform=github",
    );
    expect(await Bun.file(path.join(root, "site", "dist", "index.html")).exists()).toBe(
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("installSiteDependencies creates a lock and accepts an offline frozen rerun", async () => {
  const siteDir = await mkdtemp(path.join(tmpdir(), "rr-site-install-test-"));
  try {
    await mkdir(path.join(siteDir, "fixture"), { recursive: true });
    await Bun.write(
      path.join(siteDir, "fixture", "package.json"),
      '{"name":"local-dependency","version":"1.0.0"}\n',
    );
    await Bun.write(
      path.join(siteDir, "package.json"),
      `${JSON.stringify({
        name: "installer-test",
        private: true,
        dependencies: { "local-dependency": "file:./fixture" },
        scripts: { postinstall: "touch postinstall-ran" },
      })}\n`,
    );

    await installSiteDependencies({ siteDir, frozenLockfile: false });
    expect(await Bun.file(path.join(siteDir, "bun.lock")).exists()).toBe(true);
    expect(await Bun.file(path.join(siteDir, "postinstall-ran")).exists()).toBe(false);

    await installSiteDependencies({ siteDir, frozenLockfile: true });
    expect(await Bun.file(path.join(siteDir, "bun.lock")).exists()).toBe(true);
  } finally {
    await rm(siteDir, { recursive: true, force: true });
  }
});

test("resolveReadrunDependency uses Bun Git tags and exact registry fallback", async () => {
  const packageRoot = await mkdtemp(path.join(tmpdir(), "rr-dependency-test-"));
  try {
    await Bun.write(
      path.join(packageRoot, ".bun-tag"),
      "EdwardAstill-readrun-deadbee\n",
    );
    expect(await resolveReadrunDependency(packageRoot)).toBe(
      "github:EdwardAstill/readrun#deadbee",
    );

    await rm(path.join(packageRoot, ".bun-tag"));
    expect(await resolveReadrunDependency(packageRoot)).toBe("0.1.0");
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("platformNextSteps directs password-protected Vercel to prebuilt deploy", () => {
  expect(platformNextSteps("vercel", true)).toContain(
    "vercel deploy --prebuilt --prod",
  );
  expect(platformNextSteps("vercel", false)).not.toContain("--prebuilt");
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
