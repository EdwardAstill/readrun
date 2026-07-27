import { constants } from "node:fs";
import { access, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export interface UvPythonFileOutput {
  name: string;
  data: number[];
  extension: string;
  isImage: boolean;
}

export interface RunUvPythonOptions {
  contentDir: string;
  code: string;
  packages?: string[];
  timeoutMs?: number;
  uvCommand?: string | string[];
}

export interface RunUvPythonResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  files: UvPythonFileOutput[];
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const SCRIPT_NAME = "__readrun_block.py";
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"]);

export async function isUvPythonAvailable(
  command?: string | string[],
): Promise<boolean> {
  const executable = uvCommandPrefix(command)[0];
  if (!executable) {
    return false;
  }

  if (isPathLikeCommand(executable)) {
    try {
      await access(executable, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  return Bun.which(executable) !== null;
}

export async function runUvPython(
  options: RunUvPythonOptions,
): Promise<RunUvPythonResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  validateTimeout(timeoutMs);

  const usesInlineMetadata = hasInlineScriptMetadata(options.code);
  const packages = usesInlineMetadata ? [] : uniquePackages(options.packages);
  const tempRoot = await mkdtemp(path.join(tmpdir(), "readrun-uv-python-"));
  const workDir = path.join(tempRoot, "work");
  const cacheDir = path.join(tempRoot, "uv-cache");
  const command = buildUvArgs(packages, SCRIPT_NAME, options.uvCommand, usesInlineMetadata);

  try {
    await mkdir(workDir, { recursive: true });
    await mkdir(cacheDir, { recursive: true });
    await Bun.write(path.join(workDir, SCRIPT_NAME), options.code);
    await copyDataAssets(options.contentDir, workDir);

    const before = await listFiles(workDir);
    let proc: ReturnType<typeof Bun.spawn>;
    try {
      proc = Bun.spawn(command, {
        cwd: workDir,
        stdout: "pipe",
        stderr: "pipe",
        detached: true,
        env: {
          ...Bun.env,
          UV_CACHE_DIR: cacheDir,
        },
      });
    } catch (error) {
      return {
        ok: false,
        stdout: "",
        stderr: "",
        exitCode: null,
        timedOut: false,
        files: [],
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }

    const stdoutPromise = readPipeText(proc.stdout);
    const stderrPromise = readPipeText(proc.stderr);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeout = setTimeout(() => {
        timedOut = true;
        killProcessGroup(proc);
        resolve(null);
      }, timeoutMs);
    });

    const exitCode = await Promise.race([proc.exited, timeoutPromise]);
    if (timeout) {
      clearTimeout(timeout);
    }
    if (timedOut) {
      try {
        await proc.exited;
      } catch {
        // Process cleanup is best effort after timeout.
      }
    }

    const [stdout, stderr, files] = await Promise.all([
      stdoutPromise,
      stderrPromise,
      collectGeneratedFiles(workDir, before),
    ]);
    const normalizedExitCode = timedOut ? null : exitCode;
    const ok = !timedOut && normalizedExitCode === 0;

    return {
      ok,
      stdout,
      stderr,
      exitCode: normalizedExitCode,
      timedOut,
      files,
      errorMessage: ok
        ? undefined
        : timedOut
          ? `Python execution timed out after ${timeoutMs}ms`
          : `Python exited with code ${normalizedExitCode}`,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

function uniquePackages(packages: string[] | undefined): string[] {
  return [...new Set((packages ?? []).map((pkg) => pkg.trim()).filter(Boolean))];
}

function uvCommandPrefix(command: string | string[] | undefined): string[] {
  return Array.isArray(command) ? command.filter(Boolean) : [command || "uv"];
}

function isPathLikeCommand(command: string): boolean {
  return command.includes("/") ||
    command.includes("\\") ||
    /^[A-Za-z]:[\\/]/.test(command);
}

function hasInlineScriptMetadata(code: string): boolean {
  return /^\s*#\s*\/\/\/\s*script\s*$/m.test(code);
}

function buildUvArgs(
  packages: string[],
  scriptName: string,
  uvCommand?: string | string[],
  usesInlineMetadata = false,
): string[] {
  const args = [...uvCommandPrefix(uvCommand), "run"];
  if (!usesInlineMetadata) {
    args.push("--isolated");
  }
  args.push("--no-project");
  for (const pkg of packages) {
    args.push("--with", pkg);
  }
  args.push(scriptName);
  return args;
}

function validateTimeout(timeoutMs: number): void {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive number");
  }
}

async function copyDataAssets(contentDir: string, workDir: string): Promise<void> {
  const dataRoot = path.join(contentDir, ".readrun", "assets", "data");
  const files = await listFiles(dataRoot);

  for (const relPath of files) {
    const source = path.join(dataRoot, ...relPath.split("/"));
    const target = path.join(workDir, "data", ...relPath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await Bun.write(target, await Bun.file(source).bytes());
  }
}

async function listFiles(root: string): Promise<Set<string>> {
  const files = new Set<string>();

  async function walk(dir: string, parts: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true }).catch(
      () => [] as Awaited<ReturnType<typeof readdir>>,
    );

    for (const entry of entries) {
      const name = String(entry.name);
      if (name === "__pycache__") {
        continue;
      }

      const nextParts = [...parts, name];
      const absolutePath = path.join(dir, name);
      if (entry.isDirectory()) {
        await walk(absolutePath, nextParts);
      } else if (entry.isFile()) {
        files.add(nextParts.join("/"));
      }
    }
  }

  await walk(root, []);
  return files;
}

async function collectGeneratedFiles(
  workDir: string,
  before: Set<string>,
): Promise<UvPythonFileOutput[]> {
  const after = await listFiles(workDir);
  const generated = [...after].filter((name) => !before.has(name)).sort();
  const files: UvPythonFileOutput[] = [];

  for (const name of generated) {
    try {
      const bytes = await Bun.file(path.join(workDir, ...name.split("/"))).bytes();
      const extension = extensionFor(name);
      files.push({
        name,
        data: [...bytes],
        extension,
        isImage: IMAGE_EXTENSIONS.has(extension),
      });
    } catch {
      // Ignore files that disappeared during collection.
    }
  }

  return files;
}

async function readPipeText(
  stream: ReadableStream<Uint8Array> | number | undefined | null,
): Promise<string> {
  if (!stream || typeof stream === "number") {
    return "";
  }

  try {
    return await new Response(stream).text();
  } catch {
    return "";
  }
}

function killProcessGroup(proc: ReturnType<typeof Bun.spawn>): void {
  if (process.platform !== "win32") {
    try {
      process.kill(-proc.pid, "SIGKILL");
      return;
    } catch {
      // Fall through to the direct child kill.
    }
  }

  try {
    proc.kill("SIGKILL");
  } catch {
    // Process may already have exited.
  }
}

function extensionFor(name: string): string {
  return path.extname(name).replace(/^\./, "").toLowerCase();
}
