import { mkdir, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export type DeployPlatform = "github" | "vercel" | "netlify";
export type BuildPlatform = DeployPlatform | null;

export interface ServerArgsValues {
  path?: string | null;
  port?: string | number | null;
  host?: string | null;
  "no-open"?: boolean | null;
}

export interface HttpOptions {
  port: number;
  host: string;
  noOpen: boolean;
}

export interface ServeContentTarget {
  contentDir: string;
  filePath?: string;
  openPath: string;
}

export class CommandError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
    this.name = "CommandError";
  }
}

export function serverArgsWithPort(defaultPort: string | number) {
  const port = String(defaultPort);

  return {
    port: {
      type: "string",
      default: port,
      description: `Port (default: ${port})`,
    },
    host: {
      type: "string",
      default: "localhost",
      description: "Hostname (default: localhost)",
    },
    "no-open": {
      type: "boolean",
      default: false,
      description: "Do not auto-open a browser",
    },
  } as const;
}

export const serverArgs = serverArgsWithPort(3001);

export function fail(message: string, exitCode = 1): never {
  throw new CommandError(message, exitCode);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function withCommandErrors<T>(
  work: () => Promise<T>,
): Promise<T | never> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof CommandError) {
      console.error(error.message);
      process.exit(error.exitCode);
    }

    console.error(errorMessage(error));
    process.exit(1);
  }
}

export function resolvePath(pathArg?: string | null): string {
  return path.resolve(process.cwd(), pathArg ?? ".");
}

export async function pathExists(pathArg: string): Promise<boolean> {
  try {
    await stat(pathArg);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(pathArg: string): Promise<void> {
  await mkdir(pathArg, { recursive: true });
}

export async function removePath(
  pathArg: string,
  options: { dryRun?: boolean } = {},
): Promise<boolean> {
  if (!(await pathExists(pathArg))) {
    return false;
  }

  if (!options.dryRun) {
    await rm(pathArg, { recursive: true, force: true });
  }

  return true;
}

export async function resolveExistingPath(
  pathArg?: string | null,
  missingMessage: (resolvedPath: string) => string = (resolvedPath) =>
    `Path not found: ${resolvedPath}`,
): Promise<string> {
  const resolvedPath = resolvePath(pathArg);

  if (!(await pathExists(resolvedPath))) {
    fail(missingMessage(resolvedPath));
  }

  return resolvedPath;
}

export async function resolveDirectory(
  pathArg?: string | null,
  messages: {
    missing?: (resolvedPath: string) => string;
    notDirectory?: (resolvedPath: string) => string;
  } = {},
): Promise<string> {
  const resolvedPath = resolvePath(pathArg);
  let stats: Awaited<ReturnType<typeof stat>>;

  try {
    stats = await stat(resolvedPath);
  } catch {
    fail(messages.missing?.(resolvedPath) ?? `Folder not found: ${resolvedPath}`);
  }

  if (!stats.isDirectory()) {
    fail(messages.notDirectory?.(resolvedPath) ?? `Not a folder: ${resolvedPath}`);
  }

  return resolvedPath;
}

export async function resolveServeContentTarget(
  pathArg?: string | null,
): Promise<ServeContentTarget> {
  const resolvedPath = resolvePath(pathArg);
  let stats: Awaited<ReturnType<typeof stat>>;

  try {
    stats = await stat(resolvedPath);
  } catch {
    fail(`Not a valid path: ${resolvedPath}`);
  }

  if (stats.isDirectory()) {
    return {
      contentDir: resolvedPath,
      openPath: "/",
    };
  }

  if (stats.isFile() && resolvedPath.endsWith(".md")) {
    const contentDir = path.dirname(resolvedPath);
    const relPath = path.relative(contentDir, resolvedPath);
    const openPath = `/${relPath.replace(/\\/g, "/").replace(/\.md$/i, "")}`;

    return {
      contentDir,
      filePath: resolvedPath,
      openPath,
    };
  }

  fail(`Not a folder or .md file: ${resolvedPath}`);
}

export function parsePort(raw: unknown, defaultValue = 3001): number {
  if (raw == null || raw === "") {
    return defaultValue;
  }

  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 65535) {
    fail(`Invalid port: ${raw}`);
  }

  return parsed;
}

export function parsePositiveInt(
  raw: unknown,
  label: string,
  defaultValue: number,
  minimum = 1,
): number {
  if (raw == null || raw === "") {
    return defaultValue;
  }

  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    fail(`Invalid ${label}: ${raw}`);
  }

  return parsed;
}

export function httpOptions(args: ServerArgsValues): HttpOptions {
  return {
    port: parsePort(args.port),
    host: args.host ?? "localhost",
    noOpen: Boolean(args["no-open"]),
  };
}

export function browserOpenCommand(
  url: string,
  platform: typeof process.platform = process.platform,
): string[] {
  if (platform === "darwin") {
    return ["open", url];
  }

  if (platform === "win32") {
    return ["cmd", "/c", "start", "", url];
  }

  return ["xdg-open", url];
}

export function openBrowser(url: string): void {
  try {
    Bun.spawn(browserOpenCommand(url), {
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    });
  } catch (error) {
    console.warn(`Could not auto-open browser: ${errorMessage(error)}`);
  }
}

export function parseDeployPlatform(raw: unknown): DeployPlatform {
  const value = String(raw ?? "").toLowerCase();

  if (value === "github" || value === "vercel" || value === "netlify") {
    return value;
  }

  fail(`Unknown platform: ${raw} (expected: github | vercel | netlify)`);
}

export function parseBuildPlatform(raw: unknown): BuildPlatform {
  if (raw == null || raw === "") {
    return null;
  }

  const value = String(raw).toLowerCase();
  if (value === "plain" || value === "none") {
    return null;
  }

  return parseDeployPlatform(value);
}

export function builtInDocsDir(): string {
  return path.resolve(import.meta.dirname, "../../../docs");
}

export function readrunConfigDir(): string {
  return path.join(homedir(), ".config", "readrun");
}

export function titleFromFileName(filePath: string): string {
  const stem = path.basename(filePath, path.extname(filePath));

  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}

export function todayIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function relativeToCwd(pathArg: string): string {
  const relativePath = path.relative(process.cwd(), pathArg);
  return relativePath === "" ? "." : relativePath;
}
