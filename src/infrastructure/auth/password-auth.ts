import path from "node:path";

export const PASSWORD_PLACEHOLDER = "PUT-PASSWORD-HERE";
export const PASSWORD_FILE = path.join(".readrun", "pw.txt");
export const AUTH_COOKIE_NAME = "__readrun_auth";
export const BASIC_AUTH_REALM = "Site password (username: reader)";
export const NOINDEX_HEADER_VALUE =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "qwerty",
  "letmein",
  "changeme",
  "secret",
  "shared-password",
  "readrun",
]);

export interface PasswordAuthConfig {
  passwordFile: string;
  passwords: string[];
  passwordHashes: string[];
  lookupWarnings?: PasswordAuthLookupWarning[];
}

export interface PasswordAuthLookupWarning {
  kind: "subdirectory-both-present" | "subdirectory-root-fallback";
  contentPasswordFile: string;
  projectPasswordFile: string;
}

export interface PasswordAuthLookupOptions {
  contentDir: string;
  projectDir: string;
}

export interface PasswordFileIssue {
  severity: "error" | "warning";
  message: string;
  line?: number;
}

export interface PasswordFileInspection {
  passwords: string[];
  issues: PasswordFileIssue[];
}

export function getPasswordFileCandidates(
  options: PasswordAuthLookupOptions,
): string[] {
  const projectPasswordFile = path.join(options.projectDir, PASSWORD_FILE);
  const contentPasswordFile = path.join(options.contentDir, PASSWORD_FILE);
  const candidates = path.resolve(options.contentDir) === path.resolve(options.projectDir)
    ? [projectPasswordFile]
    : [contentPasswordFile, projectPasswordFile];
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = path.resolve(candidate);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function inspectPasswordFile(
  passwordFile: string,
): Promise<PasswordFileInspection | null> {
  const file = Bun.file(passwordFile);
  if (!(await file.exists())) {
    return null;
  }

  return inspectPasswordText(await file.text());
}

export async function readPasswordAuthConfig(
  options: PasswordAuthLookupOptions,
): Promise<PasswordAuthConfig | null> {
  for (const passwordFile of getPasswordFileCandidates(options)) {
    const inspection = await inspectPasswordFile(passwordFile);
    if (!inspection) {
      continue;
    }

    const error = inspection.issues.find((issue) => issue.severity === "error");
    if (error) {
      const line = error.line ? ` (line ${error.line})` : "";
      throw new Error(
        `Password protection is enabled by ${passwordFile}, but ${error.message}${line}.`,
      );
    }

    return {
      passwordFile,
      passwords: inspection.passwords,
      passwordHashes: await Promise.all(inspection.passwords.map(sha256Hex)),
      lookupWarnings: await getPasswordAuthLookupWarnings(options, passwordFile),
    };
  }

  return null;
}

export function inspectPasswordText(text: string): PasswordFileInspection {
  const passwords: string[] = [];
  const issues: PasswordFileIssue[] = [];
  const seen = new Set<string>();

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const password = rawLine.trim();
    const line = index + 1;

    if (!password) {
      continue;
    }

    if (password === PASSWORD_PLACEHOLDER) {
      issues.push({
        severity: "error",
        line,
        message: `password file still contains '${PASSWORD_PLACEHOLDER}'`,
      });
      continue;
    }

    if (seen.has(password)) {
      issues.push({ severity: "warning", line, message: "duplicate password line" });
      continue;
    }

    seen.add(password);
    passwords.push(password);
    issues.push(...inspectPasswordStrength(password, line));
  }

  if (passwords.length === 0) {
    issues.push({ severity: "error", message: "password file is empty" });
  }

  return { passwords, issues };
}

export function inspectPasswordStrength(
  password: string,
  line?: number,
): PasswordFileIssue[] {
  const issues: PasswordFileIssue[] = [];
  const lower = password.toLowerCase();

  if (password.length < 8) {
    issues.push({ severity: "warning", line, message: "password is shorter than 8 characters" });
  }

  if (COMMON_PASSWORDS.has(lower)) {
    issues.push({
      severity: "warning",
      line,
      message: "password matches a common or placeholder-like value",
    });
  }

  if (/^[a-z]+$/i.test(password) || /^\d+$/.test(password)) {
    issues.push({ severity: "warning", line, message: "password uses only one character class" });
  }

  return issues;
}

export function formatPasswordFileIssue(issue: PasswordFileIssue): string {
  return issue.line ? `line ${issue.line}: ${issue.message}` : issue.message;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function readBasicPassword(header: string | null): string | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    return separator < 0 ? null : decoded.slice(separator + 1);
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      continue;
    }
    if (trimmed.slice(0, separator) === name) {
      return decodeURIComponent(trimmed.slice(separator + 1));
    }
  }

  return null;
}

export function buildAuthCookie(hash: string, secure: boolean): string {
  return [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(hash)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function clearAuthCookie(secure: boolean): string {
  return [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function appendNoIndex(response: Response): Response {
  response.headers.set("X-Robots-Tag", NOINDEX_HEADER_VALUE);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function unauthorizedBasicResponse(): Response {
  return appendNoIndex(
    new Response("Authentication required\n", {
      status: 401,
      headers: {
        "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
      },
    }),
  );
}

export function sanitizeReturnPath(pathname: string): string {
  return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
}

export function loginPageHtml(options: {
  returnTo: string;
  message?: string;
  headline?: string;
}): string {
  const message = options.message
    ? `<p class="auth-card__message">${escapeHtml(options.message)}</p>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Site password</title><style>
:root{color-scheme:light;--rr-bg:#fff;--rr-panel:#f6f8fa;--rr-border:#d0d7de;--rr-text:#1f2328;--rr-muted:#656d76;--rr-link:#0969da}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--rr-bg:#0d1117;--rr-panel:#161b22;--rr-border:#30363d;--rr-text:#e6edf3;--rr-muted:#8b949e;--rr-link:#58a6ff}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1rem;background:var(--rr-bg);color:var(--rr-text);font-family:Inter,system-ui,sans-serif;line-height:1.5}
.auth-card{width:min(28rem,calc(100vw - 2rem));padding:1.25rem;border:1px solid var(--rr-border);background:var(--rr-panel)}h1{margin:0 0 .5rem;font-size:1.35rem}p{margin:0 0 1rem;color:var(--rr-muted)}label{display:block;margin-bottom:.5rem}input{width:100%;margin-top:.35rem;border:1px solid var(--rr-border);background:var(--rr-bg);color:var(--rr-text);padding:.65rem .75rem;font:inherit}button{width:100%;border:1px solid var(--rr-link);background:var(--rr-link);color:#fff;padding:.65rem .75rem;font:inherit;font-weight:600;cursor:pointer}.auth-card__message{color:#cf222e}
</style></head><body><main class="auth-card"><h1>${escapeHtml(options.headline ?? "This site is password protected")}</h1><p>Enter the shared site password to continue.</p>${message}<form method="post" action="/__readrun/login"><input type="hidden" name="return_to" value="${escapeHtml(options.returnTo)}"><label>Password<input type="password" name="password" autocomplete="current-password" autofocus required></label><button type="submit">Continue</button></form></main></body></html>`;
}

async function getPasswordAuthLookupWarnings(
  options: PasswordAuthLookupOptions,
  selectedPasswordFile: string,
): Promise<PasswordAuthLookupWarning[]> {
  if (path.resolve(options.contentDir) === path.resolve(options.projectDir)) {
    return [];
  }

  const contentPasswordFile = path.join(options.contentDir, PASSWORD_FILE);
  const projectPasswordFile = path.join(options.projectDir, PASSWORD_FILE);
  const selected = path.resolve(selectedPasswordFile);

  if (
    selected === path.resolve(contentPasswordFile) &&
    await Bun.file(projectPasswordFile).exists()
  ) {
    return [{ kind: "subdirectory-both-present", contentPasswordFile, projectPasswordFile }];
  }

  if (selected === path.resolve(projectPasswordFile)) {
    return [{ kind: "subdirectory-root-fallback", contentPasswordFile, projectPasswordFile }];
  }

  return [];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
