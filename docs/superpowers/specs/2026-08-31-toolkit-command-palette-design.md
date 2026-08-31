# Toolkit Command Palette Design

**Status:** Approved in chat; pending written-spec review

## Purpose

Add an in-app command palette and a small floating toolkit workspace to
readrun. The first toolkits are a persistent browser-Python terminal and a
scientific calculator derived from OpenMirai. The calculator is maintained in
its own public sibling repository and consumed by readrun from an immutable
GitHub release.

This feature belongs to the browser application rather than the `rr` CLI. It
must behave the same in `rr serve` and static output from `rr build`.

## Goals

- Make `Ctrl+K` on Windows/Linux and `Cmd+K` on macOS open one in-app command
  palette.
- Preserve site search and page search as actions in that palette.
- Add commands that open or raise a Python terminal and a scientific
  calculator.
- Let both toolkits remain open, move, resize, minimize, and restore
  independently.
- Preserve toolkit state across readrun's in-app page navigation.
- Run the terminal with browser Pyodide so it works on local and static sites.
- Maintain the calculator as a focused public project named
  `EdwardAstill/sci-calc-widget`.
- Keep readrun installable without a sibling checkout by consuming a tagged
  GitHub dependency.
- Document controls, runtime behavior, limitations, attribution, and the
  possible future use of a persistent local `uv` process.

## Non-goals

- Add new `rr` CLI commands.
- Add graphing, statistics, or OpenMirai's general math-tools modes.
- Support arbitrary third-party toolkits or a user-authored plugin API in this
  release.
- Persist open windows, calculator state, Python variables, or terminal history
  across a full browser reload.
- Run terminal commands through the existing local `uv` endpoint.
- Add a server-side persistent Python process, terminal interrupt protocol, or
  process isolation.
- Execute Python in a web worker in the first release.
- Support interactive standard input through Python `input()`.
- Render rich notebook output, generated-file downloads, or matplotlib figures
  in the terminal transcript. Existing executable Markdown blocks retain their
  current rich-output behavior.
- Publish `sci-calc-widget` to npm in its first release.
- Dynamically fetch calculator source or UI assets at browser runtime.

## Repository ownership

The feature spans two public repositories with one-way dependency ownership:

```text
/home/eastill/projects/sci-calc-widget
  GitHub: EdwardAstill/sci-calc-widget
  scientific expression engine
  scientific calculator React component
  calculator keyboard and accessibility behavior
  calculator-scoped styles
  upstream attribution and MIT notices
  package build and calculator tests

/home/eastill/projects/readrun
  command palette
  toolkit registry and floating-window workspace
  browser-Python terminal and Pyodide session adapter
  calculator host window
  readrun lifecycle integration
  toolkit documentation and integration tests
```

`sci-calc-widget` must not import readrun modules or depend on readrun runtime
state. Readrun may import only the package's public exports.

## Upstream source and licensing

`sci-calc-widget` starts from the MIT-licensed OpenMirai Scientific Calculator
release `v0.2.0`, Git commit
`9c565f689e9910a1f224bdce944cd237930fd25d`:

```text
https://github.com/openmirai/mirai-scientific-calculator
```

Create the sibling as a GitHub fork named `sci-calc-widget`. If GitHub does not
allow that custom fork name, create `EdwardAstill/sci-calc-widget` as a public
repository and configure OpenMirai as its `upstream` Git remote. In either
case, its default branch is simplified into the focused package described
here. It retains:

- the complete OpenMirai MIT license and copyright notice;
- an `ORIGIN.md` recording the upstream repository, release, commit, retained
  source areas, and material adaptations;
- source-level attribution on substantially derived engine or UI files; and
- a README acknowledgement and link to the original project.

Readrun's `docs/toolkits.md` links to both the sibling and OpenMirai. Readrun
does not copy OpenMirai source directly.

## `sci-calc-widget` scope

The sibling is reduced from OpenMirai's monorepo to one Bun-based package:

```text
sci-calc-widget/
  AGENTS.md
  LICENSE
  ORIGIN.md
  README.md
  package.json
  bun.lock
  tsconfig.json
  src/
    index.ts
    ScientificCalculator.tsx
    calculator-engine.ts
    calculator-keypad.tsx
    calculator-keypad-config.ts
    calculator-history.tsx
    calculator.css
  test/
    calculator-engine.test.ts
    ScientificCalculator.test.tsx
    package-exports.test.ts
  dist/
    index.js
    index.d.ts
    calculator.css
```

The exact split may introduce smaller internal files when a retained upstream
file has more than one responsibility, but the public surface remains one
component export. The fork removes OpenMirai's web showcase, registry builder,
graphing, statistics, tools, settings dialog, fullscreen shell, extension
registry, pnpm workspace, and unrelated shadcn primitives.

The retained scientific behavior includes:

- arithmetic, parentheses, percentages, fractions, absolute values, and sign
  inversion;
- powers, roots, factorials, scientific notation, constants `pi` and `e`, and
  answer memory;
- trigonometric and inverse-trigonometric functions;
- logarithmic and exponential functions;
- degree and radian modes;
- variables and reusable function definitions retained by the OpenMirai
  scientific engine;
- history, undo, redo, delete, and clear behavior; and
- focused calculator keyboard entry.

## Calculator package contract

The package is named `sci-calc-widget`, uses ESM, and exposes compiled output:

```json
{
  "name": "sci-calc-widget",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/calculator.css"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

Its initial public React API is intentionally small:

```tsx
export type ScientificAngleMode = "degrees" | "radians";

export interface ScientificCalculatorProps {
  className?: string;
  defaultAngleMode?: ScientificAngleMode;
  autoFocus?: boolean;
}

export function ScientificCalculator(
  props: ScientificCalculatorProps,
): React.JSX.Element;
```

History, memory, expressions, and angle mode are uncontrolled component state.
Readrun does not need callbacks or controlled state in the first release. The
window owns close, minimize, resize, and title controls; the calculator package
does not duplicate them.

The package has no readrun dependency, no runtime Tailwind dependency, and no
global CSS reset. Its exported stylesheet is scoped under a single calculator
root class and uses semantic CSS custom properties with fallbacks. This keeps
the OpenMirai visual character while allowing readrun themes to supply color,
font, border, and radius values. Controls preserve the established rounded
corner scale.

The committed `dist/` output is generated from `src/`, is verified against a
clean build, and allows Bun to install the package directly from GitHub without
running dependency lifecycle scripts.

## Calculator release and readrun dependency

The first sibling release is committed, tagged `v0.1.0`, and pushed before
readrun adds the dependency:

```json
{
  "dependencies": {
    "sci-calc-widget": "github:EdwardAstill/sci-calc-widget#v0.1.0"
  }
}
```

`bun.lock` resolves the tag to its immutable commit. Subsequent calculator
changes are released under new tags; readrun updates the declared tag and lock
file in an explicit integration change. A moving branch is never used for a
committed readrun dependency.

## Readrun toolkit registry

Readrun owns a small closed registry for its built-in toolkit commands. The
registry gives command-palette and window-workspace code one shared source of
identity and labels:

```ts
export type ToolkitId = "python-terminal" | "scientific-calculator";

export interface ToolkitDefinition {
  id: ToolkitId;
  title: string;
  description: string;
  defaultSize: { width: number; height: number };
  render: () => React.JSX.Element;
}
```

This is an internal registry, not an extension API. Adding a third built-in
toolkit later requires a code change and tests.

## Command palette

`Ctrl+K` on Windows/Linux and `Cmd+K` on macOS opens a new
`command-palette-overlay`. It replaces the current direct use of that shortcut
for site search but does not remove either search overlay.

The initial command catalog is:

1. Open Python Terminal
2. Open Scientific Calculator
3. Search Site
4. Search Page

The existing reusable search-palette control supplies filtering, arrow-key
movement, Enter selection, and Escape dismissal. Toolkit selection closes the
palette and opens, restores, or raises the corresponding window. Search Site
and Search Page close the palette and then open the existing overlay. Opening
the palette from an editable terminal or calculator field remains supported.

The existing `s` page-search shortcut and `?` shortcuts overlay remain
unchanged. The shortcuts documentation gains the platform command-palette
binding.

## Floating toolkit workspace

The workspace mounts inside readrun's application-scoped shell island, not the
page-scoped lifecycle. Client-side navigation can replace page content without
unmounting toolkit state.

Each toolkit has at most one window. Window state contains:

```ts
interface ToolkitWindowState {
  id: ToolkitId;
  open: boolean;
  minimized: boolean;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
}
```

Opening a closed toolkit creates it at a viewport-bounded default offset.
Opening an existing toolkit restores it if minimized and brings it to the
front. Pointer interaction with a window also raises it. A title-bar drag moves
the window; visible resize handles change its dimensions. Move and resize
operations clamp the window to the usable viewport and enforce toolkit-specific
minimum dimensions.

The title-bar window menu provides keyboard Move and Resize actions. While one
of those actions is active, arrow keys change the position or dimensions by 10
pixels, Shift+Arrow uses a 1-pixel increment, Enter accepts the result, and
Escape restores the rectangle from before the keyboard operation. This is the
non-pointer equivalent of dragging and resizing.

Minimizing preserves the mounted toolkit state. Closing unmounts that toolkit,
removes its window state, and destroys its calculator or terminal session.
Readrun displays minimized-tool buttons in a compact workspace shelf so a
minimized window remains discoverable without reopening the command palette.

State is in memory for the current application shell only. Client-side page
navigation preserves it; a full browser reload resets all windows and toolkit
contents. No toolkit state is written to `localStorage` or `sessionStorage`.

On narrow viewports, an open toolkit uses a bounded near-full-screen layout.
Edges that touch the viewport remain flush, while exposed corners retain
readrun's radius scale. Mobile layout does not retain an off-screen desktop
rectangle.

## Python terminal session

The terminal always uses Pyodide, regardless of the user's local-Python
setting. It lazy-loads the same Pyodide engine and package installer used by
executable Markdown blocks, so static builds require no Python server.

The terminal has its own Python globals dictionary within the shared Pyodide
instance. It shares loaded packages and the virtual filesystem with executable
blocks, but terminal variable definitions do not enter the page-block global
namespace. Closing or resetting the terminal replaces only the terminal
dictionary and cannot reset Python state owned by Markdown blocks.

The input is a multiline text area with these bindings:

- Enter executes the current command.
- Shift+Enter inserts a newline.
- Up and Down recall older or newer commands when the caret is at the relevant
  input boundary.

Commands are queued and executed sequentially. The transcript records the
submitted source, captured standard output, captured standard error, expression
results using Python `repr`, and tracebacks as text. Content is rendered with
text nodes rather than trusted HTML.

An AST-based adapter distinguishes an expression from statements. Expressions
are evaluated and display their non-`None` result. Statements execute in the
same terminal dictionary. Imports use readrun's existing import-to-package
mapping and best-effort micropip installation before execution.

Terminal actions behave as follows:

- **Clear Output** removes transcript entries but retains variables, imports,
  and command history.
- **Reset Session** replaces the terminal globals dictionary and clears the
  transcript and command history.
- **Close** performs the same session cleanup and unmounts the terminal.

While Pyodide loads, input is disabled and the window shows loading status. A
load failure leaves the terminal open with the error and a Retry action. A
Python exception appends a traceback and leaves the session usable.

Because the first release uses the existing main-thread Pyodide runtime, a
long-running or infinite command can block the browser tab and cannot be
interrupted from the terminal. This limitation is explicit in the UI help and
documentation.

## Calculator hosting

Readrun imports the component and stylesheet only through public package
exports:

```tsx
import { ScientificCalculator } from "sci-calc-widget";
import "sci-calc-widget/styles.css";
```

The calculator toolkit window renders the component with `autoFocus` when it is
first opened. Calculator keyboard handling is scoped to focus within its
window, so it does not capture page-reading shortcuts or terminal input.
Minimizing and in-app navigation preserve its mounted history, memory, current
expression, undo stack, and degree/radian selection. Closing resets those
values through normal React unmounting.

The package supplies the calculator body only. Readrun supplies the window
title and all window-management controls.

## Overlay, focus, and keyboard behavior

The command palette participates in readrun's existing single-active-overlay
store. Floating toolkit windows do not: they are modeless workspace surfaces
that may coexist with content and with one another.

When the palette opens, focus moves to its filter input. Dismissing it restores
focus to the element that invoked it. Selecting a toolkit moves focus to the
toolkit's primary input after the palette closes. Window title bars and every
minimize, restore, close, and reset control have accessible names.

Toolkit windows use `role="dialog"`, an accessible title, and
`aria-modal="false"`. Focus is not trapped inside a toolkit window. The window
menu exposes keyboard Move and Resize modes; title-bar controls and the
minimized-tool shelf keep raise, minimize, restore, and close actions keyboard
accessible.

Escape closes the active command or search overlay. Escape does not close or
reset a floating toolkit. Existing input-editing guards continue to prevent
single-key page shortcuts from firing while users type.

## Failure behavior

- An unknown command identifier is ignored without opening a window.
- A missing toolkit definition fails visibly in development and leaves the
  palette usable.
- Window rectangles are normalized after viewport resize so a window cannot
  become permanently unreachable.
- Pyodide load and package-install failures appear in the terminal transcript
  with retry guidance.
- Calculator arithmetic and parse errors remain inside the calculator display
  and do not throw through the readrun application shell.
- If the GitHub calculator dependency cannot be resolved, `bun install` fails
  at development/build time; readrun never falls back to a runtime iframe or
  CDN calculator.

## Documentation

Create top-level `docs/toolkits.md` and add it to
`docs/.readrun/navigation.yaml` under **Start Here**, after Commands. Add a
matching link to `docs/README.md`.

The page covers:

- opening and filtering the command palette;
- opening, raising, moving, resizing, minimizing, restoring, and closing
  toolkit windows;
- terminal execution, multiline input, history, clear/reset semantics,
  Pyodide loading, package installation, and static-build support;
- calculator scientific features and keyboard focus behavior;
- the state retained across in-app navigation and the state reset by close or
  reload;
- OpenMirai and `sci-calc-widget` attribution; and
- current limitations.

The future-work section records one concrete investigation: provide an optional
persistent local `uv` Python process with an explicit lifecycle and isolation
model, while preserving Pyodide as the static-build path. This is documentation
only in the first release.

## Testing

### `sci-calc-widget`

Use `bun test` for engine and React behavior. Tests cover arithmetic,
precedence, parentheses, powers, roots, factorial, fractions, constants,
trigonometry in both angle modes, inverse functions, logarithms, variables,
function definitions, invalid expressions, history, memory, undo/redo, clear,
keyboard input, focus scoping, and accessible control names.

The package verification sequence is:

```text
bun test
bun run typecheck
bun run build
bun run verify:dist
```

`verify:dist` builds into a temporary directory, compares it with committed
`dist/`, and imports the public JavaScript and stylesheet exports from a clean
consumer fixture.

### readrun

Write tests before each production behavior. Coverage includes:

- command catalog labels, filtering, keyboard selection, and dispatch;
- `Ctrl/Cmd+K` opening the command palette from reading and editable contexts;
- Search Site and Search Page delegation to their existing overlays;
- one-window-per-toolkit opening, restoring, raising, minimizing, and closing;
- viewport clamping, minimum sizes, resize normalization, and responsive window
  layout;
- application-scope persistence across simulated page navigation;
- terminal command queueing, expression and statement display, history,
  isolated globals, clear, reset, close cleanup, loading errors, retries, and
  Python exceptions;
- calculator mounting, stylesheet inclusion, focus scoping, and state retention
  while minimized; and
- server-rendered shell hosts for the palette and workspace.

After focused tests pass, run:

```text
bun run typecheck
bun run test
bun run validate:docs
bun run build:docs
```

Finally serve the docs locally and perform a browser smoke test that opens both
toolkits, runs two dependent Python commands across an in-app page navigation,
uses a scientific calculation in degree and radian modes, and exercises move,
resize, minimize, restore, close, and command-palette search actions.

## Delivery order

1. Create and simplify the public `EdwardAstill/sci-calc-widget` fork locally
   at `/home/eastill/projects/sci-calc-widget`.
2. Verify, commit, push, and tag its `v0.1.0` release.
3. Add the tagged GitHub dependency to readrun.
4. Implement readrun's command palette, toolkit workspace, Python terminal,
   calculator host, and documentation.
5. Run repository-level and browser verification in both development and
   static-build paths.

Readrun cannot merge a dependency reference before the corresponding public
calculator tag exists.

## Success criteria

- A clean readrun checkout installs the calculator from its public tagged
  GitHub remote with `bun install`.
- `Ctrl/Cmd+K` opens the command palette without removing site or page search.
- Both toolkits can be open simultaneously and managed independently.
- Toolkits retain state across in-app page navigation and reset on close or
  full reload.
- The terminal executes persistent, isolated Pyodide commands and reports
  output and errors safely.
- The calculator exposes the approved OpenMirai scientific feature set without
  graphing, statistics, or tools modes.
- The docs page is reachable through curated navigation and records persistent
  local `uv` execution as future work.
- Both repositories pass their complete verification commands, and the docs
  browser smoke test passes against served and static output.
