import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  AUTH_COOKIE_NAME,
  BASIC_AUTH_REALM,
  NOINDEX_HEADER_VALUE,
  readPasswordAuthConfig,
  type PasswordAuthConfig,
  type PasswordAuthLookupWarning,
} from "./password-auth.ts";

const AUTH_FUNCTION_NAME = "_readrun_auth";

export type { PasswordAuthConfig } from "./password-auth.ts";
export { readPasswordAuthConfig } from "./password-auth.ts";

export function formatPasswordAuthLookupWarning(
  projectDir: string,
  warning: PasswordAuthLookupWarning,
): string {
  const contentPath = path.relative(projectDir, warning.contentPasswordFile) ||
    warning.contentPasswordFile;
  const projectPath = path.relative(projectDir, warning.projectPasswordFile) ||
    warning.projectPasswordFile;

  if (warning.kind === "subdirectory-both-present") {
    return `found both ${contentPath} and ${projectPath} for a subdirectory build; using ${contentPath}.`;
  }

  return `using repo-root ${projectPath} for a subdirectory build. Prefer ${contentPath}.`;
}

export function formatPasswordAuthPath(
  projectDir: string,
  auth: PasswordAuthConfig,
): string {
  return path.relative(projectDir, auth.passwordFile) || auth.passwordFile;
}

export async function writeVercelPasswordProtectedOutput(
  projectDir: string,
  outDir: string,
  auth: PasswordAuthConfig,
): Promise<void> {
  const outputRoot = path.join(projectDir, ".vercel", "output");
  const staticDir = path.join(outputRoot, "static");
  const functionDir = path.join(outputRoot, "functions", `${AUTH_FUNCTION_NAME}.func`);

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(functionDir, { recursive: true });
  await cp(outDir, staticDir, { recursive: true });
  await Bun.write(path.join(outputRoot, "config.json"), vercelOutputConfig());
  await Bun.write(path.join(functionDir, ".vc-config.json"), vercelFunctionConfig());
  await Bun.write(path.join(functionDir, "index.js"), vercelAuthMiddleware(auth));
}

function vercelOutputConfig(): string {
  return `${JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: "/(.*)",
          middlewarePath: AUTH_FUNCTION_NAME,
          middlewareRawSrc: ["/(.*)"],
          continue: true,
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function vercelFunctionConfig(): string {
  return `${JSON.stringify({ runtime: "edge", entrypoint: "index.js" }, null, 2)}\n`;
}

function vercelAuthMiddleware(auth: PasswordAuthConfig): string {
  return `const PASSWORDS = ${JSON.stringify(auth.passwords)};
const PASSWORD_HASHES = new Set(${JSON.stringify(auth.passwordHashes)});
const AUTH_COOKIE_NAME = ${JSON.stringify(AUTH_COOKIE_NAME)};
const BASIC_AUTH_REALM = ${JSON.stringify(BASIC_AUTH_REALM)};
const NOINDEX = ${JSON.stringify(NOINDEX_HEADER_VALUE)};

function appendNoIndex(response) {
  response.headers.set("X-Robots-Tag", NOINDEX);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function unauthorized() {
  return appendNoIndex(new Response("Authentication required\\n", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="' + BASIC_AUTH_REALM + '", charset="UTF-8"' },
  }));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeReturnTo(pathname) {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) return "/";
  return pathname;
}

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    if (trimmed.slice(0, separator) === name) return decodeURIComponent(trimmed.slice(separator + 1));
  }
  return null;
}

function readBasicPassword(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    return separator < 0 ? null : decoded.slice(separator + 1);
  } catch {
    return null;
  }
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function authCookie(hash) {
  return [AUTH_COOKIE_NAME + "=" + encodeURIComponent(hash), "Path=/", "HttpOnly", "SameSite=Lax", "Secure"].join("; ");
}

function clearAuthCookie() {
  return [AUTH_COOKIE_NAME + "=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", "Secure"].join("; ");
}

function loginPageHtml(returnTo, message) {
  const flash = message ? '<p class="auth-card__message">' + escapeHtml(message) + '</p>' : "";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Site password</title><style>' +
    ':root{color-scheme:light;--rr-bg:#fff;--rr-panel:#f6f8fa;--rr-border:#d0d7de;--rr-text:#1f2328;--rr-muted:#656d76;--rr-link:#0969da}' +
    '@media (prefers-color-scheme:dark){:root{color-scheme:dark;--rr-bg:#0d1117;--rr-panel:#161b22;--rr-border:#30363d;--rr-text:#e6edf3;--rr-muted:#8b949e;--rr-link:#58a6ff}}' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1rem;background:var(--rr-bg);color:var(--rr-text);font-family:Inter,system-ui,sans-serif;line-height:1.5}' +
    '.auth-card{width:min(28rem,calc(100vw - 2rem));padding:1.25rem;border:1px solid var(--rr-border);background:var(--rr-panel)}h1{margin:0 0 .5rem;font-size:1.35rem}p{margin:0 0 1rem;color:var(--rr-muted)}label{display:block;margin-bottom:.5rem}input{width:100%;margin-top:.35rem;border:1px solid var(--rr-border);background:var(--rr-bg);color:var(--rr-text);padding:.65rem .75rem;font:inherit}button{width:100%;border:1px solid var(--rr-link);background:var(--rr-link);color:#fff;padding:.65rem .75rem;font:inherit;font-weight:600;cursor:pointer}.auth-card__message{color:#cf222e}' +
    '</style></head><body><main class="auth-card"><h1>This site is password protected</h1><p>Enter the shared site password to continue.</p>' + flash +
    '<form method="post" action="/__readrun/login"><input type="hidden" name="return_to" value="' + escapeHtml(returnTo) + '">' +
    '<label>Password<input type="password" name="password" autocomplete="current-password" autofocus required></label><button type="submit">Continue</button></form></main></body></html>';
}

function htmlResponse(html) {
  return appendNoIndex(new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  }));
}

function redirectResponse(location, setCookie) {
  const response = new Response(null, { status: 302, headers: { Location: location } });
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return appendNoIndex(response);
}

async function authenticate(request) {
  const cookieHash = readCookie(request.headers.get("cookie"), AUTH_COOKIE_NAME);
  if (cookieHash && PASSWORD_HASHES.has(cookieHash)) return true;
  const basicPassword = readBasicPassword(request.headers.get("authorization"));
  return basicPassword ? PASSWORDS.includes(basicPassword) : false;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const returnTo = sanitizeReturnTo(url.pathname + url.search);

  if (url.pathname === "/__readrun/logout") {
    return redirectResponse("/", clearAuthCookie());
  }

  if (url.pathname === "/__readrun/login") {
    if (request.method === "POST") {
      const form = await request.formData();
      const password = String(form.get("password") ?? "");
      const next = sanitizeReturnTo(String(form.get("return_to") ?? "/"));
      if (PASSWORDS.includes(password)) {
        return redirectResponse(next, authCookie(await sha256Hex(password)));
      }
      return htmlResponse(loginPageHtml(next, "Incorrect password. Try again."));
    }
    return htmlResponse(loginPageHtml(sanitizeReturnTo(url.searchParams.get("return_to") || "/")));
  }

  if (await authenticate(request)) {
    const response = new Response();
    response.headers.set("x-middleware-next", "1");
    return appendNoIndex(response);
  }

  if (request.headers.has("authorization") || (request.method !== "GET" && request.method !== "HEAD")) {
    return unauthorized();
  }

  return htmlResponse(loginPageHtml(returnTo));
}
`;
}
