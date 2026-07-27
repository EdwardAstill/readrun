import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { runUvPython } from "./uv-python.ts";

const tempDirs: string[] = [];

async function makeTempRepo(files: Record<string, string> = {}): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "rr-uv-python-test-"));
  tempDirs.push(dir);
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(dir, relPath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await Bun.write(fullPath, content);
  }
  return dir;
}

async function makeFakeUv(dir: string): Promise<string> {
  const uv = path.join(dir, "uv");
  await Bun.write(
    uv,
    `#!/usr/bin/env bash
set -euo pipefail
script=""
for arg in "$@"; do
  case "$arg" in
    *.py) script="$arg" ;;
  esac
done
if grep -q "sleep" "$script"; then
  sleep 5
fi
if [ -f data/input.txt ]; then
  cat data/input.txt
fi
printf '42' > answer.txt
`,
  );
  await chmod(uv, 0o755);
  return uv;
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runUvPython exposes data assets and returns generated files", async () => {
  const dir = await makeTempRepo({
    ".readrun/assets/data/input.txt": "hello from data\n",
  });
  const fakeUv = await makeFakeUv(dir);

  const result = await runUvPython({
    contentDir: dir,
    uvCommand: fakeUv,
    packages: ["numpy", "numpy"],
    code: "print('ignored by fake uv')\n",
  });

  expect(result.ok).toBe(true);
  expect(result.stdout).toContain("hello from data");
  expect(result.files.map((file) => file.name)).toEqual(["answer.txt"]);
  expect(new TextDecoder().decode(new Uint8Array(result.files[0]!.data))).toBe("42");
});

test("runUvPython reports timeouts", async () => {
  const dir = await makeTempRepo();
  const fakeUv = await makeFakeUv(dir);

  const result = await runUvPython({
    contentDir: dir,
    uvCommand: fakeUv,
    timeoutMs: 100,
    code: "import time\ntime.sleep(5)\n",
  });

  expect(result.ok).toBe(false);
  expect(result.timedOut).toBe(true);
  expect(result.errorMessage).toContain("timed out");
});
