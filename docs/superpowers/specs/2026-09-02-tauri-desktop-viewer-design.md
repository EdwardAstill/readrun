# Tauri desktop viewer design

## Goal

Open readrun content in one native desktop window without launching an external
browser. The existing `rr` command remains the entry point:

- `rr .` opens the current folder.
- `rr <folder>` opens that folder through the existing implicit `serve` route.
- `rr docs` opens readrun's built-in documentation.
- `--no-open` continues to run only the HTTP server.

This first version targets source checkouts and intentionally does not add an
installer, folder picker, bundled Bun sidecar, or a second rendering pipeline.

## Architecture

The existing Bun CLI continues to own content discovery, widget building, the
HTTP server, and its lifecycle. When a serve-family command starts without
`--no-open`, the CLI launches a small Tauri executable and passes the resolved
loopback URL as its only application argument.

The Tauri executable is a generic viewer. It validates that the supplied URL is
HTTP and loopback-only, creates one native webview window for that URL, and
exits when the window closes. It contains no readrun content logic and exposes
no Tauri commands to the loaded page.

For the initial source-build workflow, the CLI starts the viewer with Cargo
from the checked-in `src-tauri/` project. Cargo's build cache makes subsequent
launches fast. Packaging a precompiled viewer can replace this launch adapter
later without changing the server or viewer contract.

## Process and data flow

1. The existing command resolves the content folder and starts `startServer`
   on loopback.
2. The server returns its actual host and selected port.
3. The CLI constructs the page URL, prints the existing status messages, and
   invokes the desktop-launch adapter.
4. The adapter runs the Tauri project with the URL argument and waits for it to
   exit.
5. Tauri validates the URL and creates exactly one window.
6. When that window closes, the desktop child exits. The CLI stops its file
   watcher and HTTP server, then exits.

`--no-open` skips steps 3 through 6 after the status messages and preserves the
current long-running server behavior.

## Components and changes

### Tauri shell

Add a minimal Tauri v2 project under `src-tauri/` containing:

- `Cargo.toml` and `build.rs`;
- `tauri.conf.json` with no default window and no bundled frontend;
- one Rust entry point that validates the URL and builds the main window.

The window uses standard decorations, is resizable, and starts at a practical
desktop size. No plugins or JavaScript API permissions are needed.

### Desktop launch adapter

Add a small TypeScript adapter responsible only for locating the checked-in
Tauri manifest, spawning Cargo with the loopback URL, and returning the child
exit status. Process creation is injectable so command behavior can be tested
without opening a real window.

### Serve command lifecycle

Change the serve-family orchestration so the server handle is stopped in a
`finally` block after the desktop viewer exits or fails. Browser-specific
opening helpers are removed from this path. The headless `--no-open` path does
not stop immediately and therefore continues to keep the CLI alive.

Add Bun scripts for checking and building the Rust viewer. Do not introduce a
second JavaScript frontend or Vite.

## Errors and shutdown

- If Cargo or the Tauri viewer cannot start, print a concise command error,
  stop the readrun server, and exit non-zero. Do not fall back to an external
  browser.
- If the viewer exits unsuccessfully, report its status and stop the server.
- Reject missing, malformed, non-HTTP, or non-loopback viewer URLs before
  creating a window.
- Closing the native window is the normal shutdown path and must release the
  server port.
- On terminal interruption, the launch adapter terminates the desktop child
  and stops the readrun server before exiting.

## Security

The viewer accepts only `http://localhost`, `http://127.0.0.0/8`, and
`http://[::1]` URLs. It does not grant the loaded page shell, filesystem, or
other Tauri capabilities. The server remains loopback-bound for the native app
flow.

## Testing and verification

- Bun unit tests cover the desktop command construction, one launch per serve
  command, successful cleanup, and cleanup after launch failure.
- Existing server tests continue to cover page and asset responses.
- Rust unit tests cover accepted and rejected viewer URLs.
- `cargo check` verifies the Tauri project.
- The existing `bun run check` suite must remain green.
- A manual smoke test runs `rr docs`, confirms one native window renders the
  documentation, closes it, and confirms the server port is released.
- A second smoke test runs `rr .` from an arbitrary content folder and confirms
  that folder is shown.

## Deferred work

Precompiled viewer binaries, application installers, icons, code signing,
automatic updates, a bundled Bun sidecar, a folder picker, and native file
associations are explicitly outside this first implementation.
