# Toolkit Command Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Create the public scientific-calculator sibling package and add a unified in-app command palette, independently managed floating Python terminal and scientific calculator, and toolkit documentation to readrun.

**Architecture:** The standalone sci-calc-widget repository owns a simplified, self-contained derivative of OpenMirai's scientific engine and React UI, releases compiled ESM/types/scoped CSS from an immutable GitHub tag, and has no readrun dependency. Readrun consumes that tag, owns modeless window state and command dispatch, and runs an isolated persistent terminal namespace inside its existing browser Pyodide singleton.

**Tech Stack:** Bun 1.4, TypeScript 5.9, React 19, Bun test, happy-dom, Pyodide 0.27.7, Base UI/shadcn primitives in readrun, scoped CSS in sci-calc-widget, Git, and GitHub.

**Spec:** docs/superpowers/specs/2026-08-31-toolkit-command-palette-design.md

## Global Constraints

- Use /home/eastill/projects/sci-calc-widget for the sibling checkout and /home/eastill/projects/readrun for readrun.
- At execution time, use superpowers:using-git-worktrees before executable changes. Use a sci-calc-widget branch named codex/scientific-only and a readrun branch named codex/toolkit-command-palette.
- Use Bun commands only. Do not introduce npm, pnpm, Yarn, Vite, Jest, or Vitest.
- Seed sci-calc-widget from OpenMirai release v0.2.0: annotated tag object 9c565f689e9910a1f224bdce944cd237930fd25d, source commit 1162e48c0bc489106d6480d1d7562597fcd48044.
- Create public repository EdwardAstill/sci-calc-widget as a standalone downstream repository with OpenMirai configured as the upstream Git remote. Do not inherit or push OpenMirai's tags.
- Preserve the complete OpenMirai MIT license, add ORIGIN.md, and retain source-level attribution on substantially derived files.
- The initial sci-calc-widget release is v0.1.0. Never move, reuse, or force-push that tag.
- sci-calc-widget exports compiled JavaScript, declaration files, and scoped CSS. Commit dist so GitHub dependency installation never needs a lifecycle build.
- React 19 and React DOM 19 are peer dependencies. Do not bundle a second React copy.
- Retain only the scientific calculator UI and the engine helpers it uses, including list-statistics functions inside the scientific keypad. Remove graphing mode, dedicated Statistics mode, Tools mode, showcase, extension registry, fullscreen shell, settings dialog, and pnpm workspace machinery.
- Readrun's committed dependency is exactly github:EdwardAstill/sci-calc-widget#v0.1.0, resolved in bun.lock.
- Ctrl+K and Cmd+K open the command palette even from editable fields. The existing s page-search shortcut and ? shortcuts dialog remain.
- Toolkit state survives in-app navigation and resets on close or full reload. Do not use localStorage or sessionStorage.
- The terminal always uses Pyodide, owns an isolated globals dictionary, and shares only the loaded engine, packages, and virtual filesystem with executable Markdown blocks.
- Do not add local-uv terminal execution, workers, interruption, input(), rich figures, or generated-file downloads in this release.
- Preserve readrun's shadcn radius scale. A surface touching a viewport edge stays flush and rounds only exposed corners.
- Implement every executable behavior test-first: write one focused test, run it and confirm the expected failure, add minimal production code, then re-run focused and affected tests.
- Do not edit readrun dist/ or generated .readrun/.widgets-out/ output as source.
- Preserve unrelated user changes in both repositories.

---

## Repository and file map

### sci-calc-widget

- **src/calculator-engine.ts** — OpenMirai-derived expression parser, evaluator, formatting, answer memory, definitions, and angle modes.
- **src/calculator-statistics.ts** — only the list-statistics helpers imported by the scientific engine.
- **src/ScientificCalculator.tsx** — public uncontrolled calculator composition and angle/answer/definition state.
- **src/calculator-mode.tsx** — expression editing, evaluation, history, fraction display, undo, and redo.
- **src/calculator-keypad.tsx** — tablist and six-column scientific keypad.
- **src/calculator-keypad-config.ts** — key definitions and examples.
- **src/calculator-key-label.tsx** — structured fraction/root/superscript labels.
- **src/calculator-sidebar.tsx** — definitions, history, and examples.
- **src/calculator-controls.tsx** — private native button/input/tab wrappers used only by the calculator.
- **src/calculator.css** — fully scoped calculator presentation with no reset or Tailwind dependency.
- **src/index.ts** — public component and prop/type exports only.
- **scripts/build.ts** — deterministic ESM/declaration/CSS build.
- **scripts/verify-dist.ts** — rebuild-and-compare plus clean-consumer export verification.
- **test/calculator-engine.test.ts** — upstream scientific engine contract converted to Bun test.
- **test/ScientificCalculator.test.tsx** — scientific-only interaction, keyboard, focus, and accessibility contract.
- **test/package-exports.test.ts** — package metadata and built export behavior.

### readrun

- **src/presentation/client/toolkits/types.ts** — toolkit/window IDs and public internal contracts.
- **src/presentation/client/toolkits/window-state.ts** — pure rectangle constraints and window reducer.
- **src/presentation/client/toolkits/FloatingToolkitWindow.tsx** — pointer and keyboard window chrome.
- **src/presentation/client/toolkits/ToolkitWorkspace.tsx** — window rendering and minimized shelf.
- **src/presentation/client/toolkits/terminal-session.ts** — queued terminal controller and transcript/history state.
- **src/presentation/client/toolkits/PythonTerminal.tsx** — terminal transcript, editor, loading, retry, clear, and reset UI.
- **src/presentation/client/toolkits/ScientificCalculatorToolkit.tsx** — sci-calc-widget host.
- **src/presentation/client/toolkits/registry.tsx** — closed two-toolkit definition registry.
- **src/presentation/client/execution/pyodide.ts** — shared Pyodide load/package behavior plus isolated terminal execution adapter.
- **src/presentation/client/islands/CommandPaletteIsland.tsx** — four-command filtering and dispatch.
- **src/presentation/client/islands/ShellDialogsIsland.tsx** — application-level command palette and toolkit workspace owner.
- **src/presentation/client/overlay.ts** — command-palette overlay ID.
- **src/presentation/client/shortcuts.ts** and **ShortcutsIsland.tsx** — retain dispatch and show the platform palette binding.
- **docs/toolkits.md**, **docs/.readrun/navigation.yaml**, and **docs/README.md** — user documentation and navigation.

---

### Task 1: Create the downstream sci-calc-widget repository and focused package boundary

**Repository:** sci-calc-widget

**Files:**

- Create remote: EdwardAstill/sci-calc-widget
- Create local checkout: /home/eastill/projects/sci-calc-widget
- Create: AGENTS.md
- Create: ORIGIN.md
- Create: README.md
- Replace: package.json
- Create: tsconfig.json
- Create: tsconfig.build.json
- Create: .gitignore
- Create: test/package-exports.test.ts
- Preserve: LICENSE
- Remove from the focused branch: apps/, packages/, docs/, registry.json, pnpm-lock.yaml, pnpm-workspace.yaml, Vite/Wrangler/release scripts, and unrelated root configuration

**Interfaces:**

- Consumes: OpenMirai v0.2.0 and its MIT license/history.
- Produces: a public downstream Git repository with OpenMirai as upstream, Bun package metadata for sci-calc-widget@0.1.0, and no inherited upstream tags on origin.

- [ ] **Step 1: Verify names and remotes before creating external state**

Run:

~~~~bash
test ! -e /home/eastill/projects/sci-calc-widget
gh auth status
gh repo view EdwardAstill/sci-calc-widget
~~~~

Expected: the path check succeeds, GitHub authentication reports EdwardAstill, and repo view fails only because the repository does not exist. If either target exists, stop and inspect it; do not overwrite or repurpose it.

- [ ] **Step 2: Create the public remote and preserve upstream history**

Run:

~~~~bash
gh repo create EdwardAstill/sci-calc-widget --public --description "A focused scientific calculator widget for React"
git clone --no-tags https://github.com/openmirai/mirai-scientific-calculator.git /home/eastill/projects/sci-calc-widget
git -C /home/eastill/projects/sci-calc-widget remote rename origin upstream
git -C /home/eastill/projects/sci-calc-widget remote add origin https://github.com/EdwardAstill/sci-calc-widget.git
git -C /home/eastill/projects/sci-calc-widget push -u origin main
git -C /home/eastill/projects/sci-calc-widget fetch upstream refs/tags/v0.2.0:refs/tags/openmirai-v0.2.0
git -C /home/eastill/projects/sci-calc-widget rev-parse openmirai-v0.2.0^{}
~~~~

Expected: the last command prints 1162e48c0bc489106d6480d1d7562597fcd48044. The new origin contains main but no OpenMirai release tags.

- [ ] **Step 3: Enter an isolated sci-calc-widget worktree**

Use superpowers:using-git-worktrees to create:

~~~~text
/home/eastill/projects/sci-calc-widget/.worktrees/scientific-only
branch: codex/scientific-only
base: origin/main
~~~~

Expected: the worktree is clean and git merge-base --is-ancestor origin/main HEAD exits zero.

- [ ] **Step 4: Write the failing focused-package metadata test**

Create **test/package-exports.test.ts**:

~~~~ts
import { expect, test } from "bun:test";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

test("defines one publishable GitHub package with compiled exports", async () => {
  const pkg = await Bun.file(path.join(root, "package.json")).json();

  expect(pkg.name).toBe("sci-calc-widget");
  expect(pkg.version).toBe("0.1.0");
  expect(pkg.packageManager).toBe("bun@1.4.0");
  expect(pkg.workspaces).toBeUndefined();
  expect(pkg.exports).toEqual({
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
    "./styles.css": "./dist/calculator.css",
  });
  expect(pkg.peerDependencies).toEqual({
    react: "^19.0.0",
    "react-dom": "^19.0.0",
  });
  expect(pkg.dependencies).toBeUndefined();
});

test("records the exact OpenMirai source release", async () => {
  const origin = await Bun.file(path.join(root, "ORIGIN.md")).text();

  expect(origin).toContain("openmirai/mirai-scientific-calculator");
  expect(origin).toContain("v0.2.0");
  expect(origin).toContain("1162e48c0bc489106d6480d1d7562597fcd48044");
});
~~~~

Run:

~~~~bash
bun test test/package-exports.test.ts
~~~~

Expected: FAIL because the upstream monorepo metadata is private/workspace-based and ORIGIN.md does not exist.

- [ ] **Step 5: Replace the root with the focused Bun package metadata**

Set **package.json** to this boundary before adding source:

~~~~json
{
  "name": "sci-calc-widget",
  "version": "0.1.0",
  "description": "A focused scientific calculator widget for React.",
  "license": "MIT",
  "type": "module",
  "packageManager": "bun@1.4.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./dist/calculator.css"
  },
  "files": [
    "dist",
    "LICENSE",
    "ORIGIN.md",
    "README.md"
  ],
  "sideEffects": [
    "./dist/calculator.css"
  ],
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/bun": "^1.4.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "happy-dom": "^20.11.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.9.3"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "bun test ./test",
    "build": "bun scripts/build.ts",
    "verify:dist": "bun scripts/verify-dist.ts",
    "check": "bun run typecheck && bun run test && bun run build && bun run verify:dist"
  }
}
~~~~

Create **ORIGIN.md** with the exact upstream URL, v0.2.0 annotated-tag object, source commit, retained scientific files, removed modes, and a statement that calculator-statistics.ts remains only because the scientific keypad calls list-statistics functions. Keep OpenMirai's LICENSE unchanged. Write README.md around the eventual component and CSS imports, but do not claim the build is available before Task 4.

Create **AGENTS.md** with the Bun commands, test-first requirement, source/dist rule, upstream attribution rule, and instruction not to restore removed OpenMirai modes. Configure **tsconfig.json** for React JSX, strict ESM, DOM libraries, and no emit; configure **tsconfig.build.json** to emit declarations from src/ to dist/ with rootDir src.

- [ ] **Step 6: Remove the unrelated monorepo surface and install the focused dependencies**

Remove only the paths enumerated in this task, leaving LICENSE, Git history, and the new focused files. Add .gitignore entries for node_modules/, .worktrees/, coverage/, and temporary verification directories; do not ignore dist/.

Run:

~~~~bash
bun install
bun test test/package-exports.test.ts
git diff --check
~~~~

Expected: both metadata tests pass and the diff has no whitespace errors.

- [ ] **Step 7: Commit the repository boundary**

Run:

~~~~bash
git add -A
git commit -m "chore: focus OpenMirai fork on scientific calculator"
~~~~

Expected: the commit preserves LICENSE and ORIGIN.md and contains no generated dependency directory.

---

### Task 2: Port and verify the scientific expression engine

**Repository:** sci-calc-widget

**Files:**

- Create: src/calculator-engine.ts
- Create: src/calculator-statistics.ts
- Create: test/calculator-engine.test.ts

**Interfaces:**

- Consumes: OpenMirai v0.2.0 calculator-engine.ts, statistics.ts, and calculator-engine.test.ts.
- Produces: internal CalculatorEngine, AngleMode, NumberFormatOptions, completeExpression, formatExpressionInput, and evaluateExpression; the package root does not expose these internals.

- [ ] **Step 1: Port the full engine contract before implementation**

Create **test/calculator-engine.test.ts** from:

~~~~text
openmirai-v0.2.0:packages/calculator-core/src/mirai-calculator/__tests__/calculator-engine.test.ts
~~~~

Change only the test import to bun:test and the source import to ../src/calculator-engine.ts. Retain the literal upstream cases for arithmetic, implicit multiplication, parenthesis completion, keyboard formatting, DEG/RAD trig, inverse trig, powers, roots, factorial, logarithms, list statistics, variables/functions, Ans, domains, fractions, number formatting, cancellation, huge angles, expression limits, cache bounds, precedence, comparisons, and circular definitions.

The leading import must be:

~~~~ts
import { describe, expect, it } from "bun:test";
import {
  CalculatorEngine,
  completeExpression,
  evaluateExpression,
  factorial,
  formatExpressionInput,
} from "../src/calculator-engine.ts";
~~~~

Run:

~~~~bash
bun test test/calculator-engine.test.ts
~~~~

Expected: FAIL because calculator-engine.ts does not exist.

- [ ] **Step 2: Port the exact engine implementation and its one internal dependency**

Extract these upstream files from openmirai-v0.2.0:

~~~~text
packages/calculator-core/src/mirai-calculator/calculator-engine.ts
  -> src/calculator-engine.ts
packages/calculator-core/src/mirai-calculator/statistics.ts
  -> src/calculator-statistics.ts
~~~~

Change the engine's first import to:

~~~~ts
import {
  calculateStatistics,
  correlation,
  covariance,
  quantile,
} from "./calculator-statistics.ts";
~~~~

Keep the upstream parser limits, numeric-stability behavior, and comments. Add an attribution comment to both files naming the upstream release and ORIGIN.md. Do not copy graphing, statistics-mode data/view code, or tools.ts.

- [ ] **Step 3: Run the engine RED-to-GREEN boundary**

Run:

~~~~bash
bun test test/calculator-engine.test.ts
bun run typecheck
~~~~

Expected: the complete engine contract passes and TypeScript reports no error.

- [ ] **Step 4: Commit the verified engine**

Run:

~~~~bash
git add src/calculator-engine.ts src/calculator-statistics.ts test/calculator-engine.test.ts
git commit -m "feat: port scientific calculator engine"
~~~~

---

### Task 3: Adapt the OpenMirai scientific UI into one self-contained component

**Repository:** sci-calc-widget

**Files:**

- Create: src/ScientificCalculator.tsx
- Create: src/calculator-mode.tsx
- Create: src/calculator-keypad.tsx
- Create: src/calculator-keypad-config.ts
- Create: src/calculator-key-label.tsx
- Create: src/calculator-sidebar.tsx
- Create: src/calculator-controls.tsx
- Create: src/calculator.css
- Create: src/index.ts
- Create: test/happy-dom.ts
- Create: test/ScientificCalculator.test.tsx

**Interfaces:**

- Consumes: CalculatorEngine and OpenMirai v0.2.0 scientific-mode, keypad, key config, key label, sidebar, and scientific-only UI tests.
- Produces: ScientificCalculator(props), ScientificCalculatorProps, and ScientificAngleMode with no window, theme, graphing, dedicated statistics, or tools shell.

- [ ] **Step 1: Install a real DOM test harness and write the failing component contract**

Create **test/happy-dom.ts** by adapting readrun's src/test/happy-dom.ts without readrun imports.

Create **test/ScientificCalculator.test.tsx** with real DOM interactions:

~~~~tsx
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScientificCalculator } from "../src/ScientificCalculator.tsx";
import { installHappyDom } from "./happy-dom.ts";

let restoreDom: () => void;

beforeEach(() => {
  restoreDom = installHappyDom();
});

afterEach(() => {
  cleanup();
  restoreDom();
});

describe("ScientificCalculator", () => {
  test("evaluates keypad input and retains one history entry", async () => {
    const user = userEvent.setup({ document });
    const view = render(<ScientificCalculator />);

    await user.click(view.getByRole("button", { name: "7" }));
    await user.click(view.getByRole("button", { name: "Multiply" }));
    await user.click(view.getByRole("button", { name: "8" }));
    await user.click(view.getByRole("button", { name: "Equals" }));
    await user.click(view.getByRole("button", { name: "Equals" }));

    expect((view.getByLabelText("Calculator expression") as HTMLInputElement).value)
      .toBe("7×8");
    expect(view.getAllByText("56")).toHaveLength(2);
    expect(view.getAllByText("7×8")).toHaveLength(1);
  });

  test("switches angle mode without rendering another calculator mode", async () => {
    const user = userEvent.setup({ document });
    const view = render(<ScientificCalculator defaultAngleMode="degrees" />);

    const input = view.getByLabelText("Calculator expression");
    await user.type(input, "sin(30)");
    expect(view.getByLabelText("Calculator result").textContent).toContain("0.5");

    await user.click(view.getByRole("button", { name: "Radians" }));
    expect(view.getByLabelText("Calculator result").textContent).not.toContain("0.5");
    expect(view.queryByRole("button", { name: "Graphing" })).toBeNull();
    expect(view.queryByRole("button", { name: "Tools" })).toBeNull();
  });

  test("keeps keyboard input scoped to the focused calculator", async () => {
    const user = userEvent.setup({ document });
    const view = render(
      <div>
        <input aria-label="Outside" />
        <ScientificCalculator autoFocus />
      </div>,
    );

    await user.keyboard("2^10{Enter}");
    expect(view.getByText("1,024")).toBeTruthy();

    await user.click(view.getByLabelText("Outside"));
    await user.keyboard("999");
    expect((view.getByLabelText("Calculator expression") as HTMLInputElement).value)
      .not.toBe("999");
  });

  test("exposes labelled scientific controls", () => {
    const view = render(<ScientificCalculator />);

    expect(view.getByRole("application", { name: "Scientific calculator" })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Trig" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Backspace" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Undo expression edit" })).toBeTruthy();
  });
});
~~~~

Run:

~~~~bash
bun test test/ScientificCalculator.test.tsx
~~~~

Expected: FAIL because ScientificCalculator.tsx does not exist.

- [ ] **Step 2: Build the scientific-only wrapper state**

Create **src/ScientificCalculator.tsx** around the ported calculator-mode:

~~~~tsx
import { useMemo, useState } from "react";
import {
  CalculatorEngine,
  type AngleMode,
  type NumberFormatOptions,
} from "./calculator-engine.ts";
import { CalculatorMode } from "./calculator-mode.tsx";

export type ScientificAngleMode = AngleMode;

const DEFAULT_FORMAT_OPTIONS = {
  notation: "auto",
  decimals: "auto",
  significantFigures: 12,
  thousandsSeparator: true,
} satisfies NumberFormatOptions;

export interface ScientificCalculatorProps {
  className?: string;
  defaultAngleMode?: ScientificAngleMode;
  autoFocus?: boolean;
}

export function ScientificCalculator({
  className,
  defaultAngleMode = "degrees",
  autoFocus = false,
}: ScientificCalculatorProps): React.JSX.Element {
  const [angleMode, setAngleMode] = useState<ScientificAngleMode>(defaultAngleMode);
  const [ans, setAns] = useState(0);
  const [definitions, setDefinitions] = useState<string[]>([]);
  const engine = useMemo(
    () => new CalculatorEngine({ angleMode, ans, definitions }),
    [angleMode, ans, definitions],
  );

  return (
    <section
      className={["sci-calc-widget", className].filter(Boolean).join(" ")}
      role="application"
      aria-label="Scientific calculator"
    >
      <header className="sci-calc-widget__header">
        <h2>Scientific</h2>
        <div aria-label="Angle mode" role="group">
          {(["degrees", "radians"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={angleMode === mode}
              onClick={() => setAngleMode(mode)}
            >
              {mode === "degrees" ? "Degrees" : "Radians"}
            </button>
          ))}
        </div>
      </header>
      <CalculatorMode
        engine={engine}
        definitions={definitions}
        onDefinitionsChange={setDefinitions}
        onAnsChange={setAns}
        formatOptions={DEFAULT_FORMAT_OPTIONS}
        autoFocus={autoFocus}
      />
    </section>
  );
}
~~~~

- [ ] **Step 3: Port the five scientific presentation files and remove host dependencies**

Port these exact upstream sources from openmirai-v0.2.0:

~~~~text
modes/scientific-mode.tsx          -> src/calculator-mode.tsx
modes/scientific-keypad.tsx        -> src/calculator-keypad.tsx
modes/scientific-keypad-config.ts  -> src/calculator-keypad-config.ts
modes/scientific-key-label.tsx     -> src/calculator-key-label.tsx
modes/scientific-sidebar.tsx       -> src/calculator-sidebar.tsx
calculator-empty-state-action.tsx  -> inline inside calculator-sidebar.tsx
~~~~

Make these explicit adaptations:

- Rename ScientificMode to CalculatorMode and add autoFocus to its props/input.
- Import engine symbols only from ./calculator-engine.ts.
- Replace @/ aliases with relative imports.
- Replace lucide icons with labelled inline SVG components in calculator-controls.tsx.
- Replace shadcn Button/Input/Tabs/ScrollArea with private native wrappers from calculator-controls.tsx.
- Keep Basic, Functions, Trig, Stats, and Variables keypad tabs. Stats here means list-statistics functions inside scientific mode, not the removed Statistics mode.
- Add aria-label="Calculator result" to the live-result element.
- Keep history capped at 40 entries and undo capped at 50 entries.
- Keep Enter evaluation on the expression input; add no document-level key listener.
- Remove text that promises graph reuse and change it to "Reusable in calculations."

The private control boundary is:

~~~~tsx
export function CalculatorButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "default" | "operator" | "primary" | "ghost";
  },
): React.JSX.Element;

export function CalculatorInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.JSX.Element;

export interface CalculatorTabsProps<T extends string> {
  value: T;
  labels: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}
~~~~

- [ ] **Step 4: Add scoped presentation without a global reset**

Create **src/calculator.css** using only selectors rooted at .sci-calc-widget. Include the approved responsive two-column scientific layout, compact header, expression/result display, five horizontally scrollable tabs, six-column keypad, definition/history sidebar, focus rings, disabled state, and a one-column layout below 700px.

Start with these semantic variables and never target html, body, *, or unscoped button/input selectors:

~~~~css
.sci-calc-widget {
  --scw-background: var(--background, #ffffff);
  --scw-foreground: var(--foreground, #18181b);
  --scw-muted: var(--muted, #f4f4f5);
  --scw-muted-foreground: var(--muted-foreground, #71717a);
  --scw-primary: var(--primary, #18181b);
  --scw-primary-foreground: var(--primary-foreground, #fafafa);
  --scw-border: var(--border, #e4e4e7);
  --scw-destructive: var(--destructive, #dc2626);
  --scw-ring: var(--ring, #71717a);
  --scw-radius: var(--radius, 0.625rem);
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--scw-radius);
  background: var(--scw-background);
  color: var(--scw-foreground);
}

.sci-calc-widget__layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1.65fr) minmax(18.75rem, 0.85fr);
}

.sci-calc-widget__keypad {
  display: grid;
  min-height: 15.375rem;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 0.5rem;
  padding: 1rem;
}

@media (max-width: 699px) {
  .sci-calc-widget__layout {
    grid-template-columns: minmax(0, 1fr);
    overflow-y: auto;
  }
}
~~~~

Translate the retained OpenMirai visual states into named classes rather than copying Tailwind utility strings. Key buttons must remain rounded, not square.

- [ ] **Step 5: Run the component contract and complete the upstream scientific cases**

Create **src/index.ts** only after ScientificCalculator.tsx exists, keeping the package root intentionally narrow:

~~~~ts
export {
  ScientificCalculator,
  type ScientificAngleMode,
  type ScientificCalculatorProps,
} from "./ScientificCalculator.tsx";
~~~~

Run:

~~~~bash
bun test test/ScientificCalculator.test.tsx
~~~~

Expected: the four focused tests pass.

Then port the remaining scientific-only OpenMirai cases for completed parentheses, live alias formatting, structured key labels, narrow-tab overflow, absolute values, definition row identity, history reuse, fraction toggle, undo/redo, and invalid-expression display into the same test file. Replace Vitest/Jest-DOM-only matchers with Bun expect assertions against DOM properties, attributes, and textContent; do not add Jest-DOM. Do not port tests for theme switching, hide/show, fullscreen, graphing, dedicated Statistics mode, or Tools mode.

Run:

~~~~bash
bun test test/ScientificCalculator.test.tsx test/calculator-engine.test.ts
bun run typecheck
~~~~

Expected: all retained scientific tests pass and the package typechecks.

- [ ] **Step 6: Commit the scientific-only component**

Run:

~~~~bash
git add src test
git commit -m "feat: add standalone scientific calculator widget"
~~~~

---

### Task 4: Build, verify, publish, and tag sci-calc-widget v0.1.0

**Repository:** sci-calc-widget

**Files:**

- Create: scripts/build.ts
- Create: scripts/verify-dist.ts
- Modify: test/package-exports.test.ts
- Generate and commit: dist/index.js
- Generate and commit: dist/index.d.ts and supporting declaration files
- Generate and commit: dist/calculator.css
- Modify: README.md
- Modify: bun.lock

**Interfaces:**

- Consumes: the verified source component, React 19 peer contract, and scoped CSS.
- Produces: immutable public tag v0.1.0 installable through github:EdwardAstill/sci-calc-widget#v0.1.0 with no build hook.

- [ ] **Step 1: Extend the package test to require real compiled exports**

Append to **test/package-exports.test.ts**:

~~~~ts
import { pathToFileURL } from "node:url";

test("loads the built React export and scoped stylesheet", async () => {
  const entry = path.join(root, "dist", "index.js");
  const styles = path.join(root, "dist", "calculator.css");
  const declarations = path.join(root, "dist", "index.d.ts");

  expect(await Bun.file(entry).exists()).toBe(true);
  expect(await Bun.file(styles).exists()).toBe(true);
  expect(await Bun.file(declarations).exists()).toBe(true);

  const exports = await import(pathToFileURL(entry).href);
  expect(typeof exports.ScientificCalculator).toBe("function");

  const css = await Bun.file(styles).text();
  expect(css).toContain(".sci-calc-widget");
  expect(css).not.toMatch(/(^|})\s*(html|body|\*)\s*\{/m);
});
~~~~

Run:

~~~~bash
bun test test/package-exports.test.ts
~~~~

Expected: FAIL because dist does not exist.

- [ ] **Step 2: Implement the deterministic package build**

Create **scripts/build.ts** with an optional --outdir argument and this build boundary:

~~~~ts
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const outdirArg = Bun.argv.indexOf("--outdir");
const projectRoot = path.resolve(import.meta.dir, "..");
const defaultOutdir = path.join(projectRoot, "dist");
const outdir = path.resolve(
  outdirArg >= 0 ? Bun.argv[outdirArg + 1] ?? defaultOutdir : defaultOutdir,
);

const verificationPrefix = path.join(tmpdir(), "sci-calc-widget-verify-");
if (outdir !== defaultOutdir && !outdir.startsWith(verificationPrefix)) {
  throw new Error(`Refusing unsafe build output: ${outdir}`);
}

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const build = await Bun.build({
  entrypoints: [path.resolve("src/index.ts")],
  outdir,
  target: "browser",
  format: "esm",
  splitting: false,
  minify: false,
  external: ["react", "react-dom"],
  naming: "index.js",
});

if (!build.success) {
  throw new Error(build.logs.map(String).join("\n"));
}

const declarations = Bun.spawn(
  [
    "bunx",
    "tsc",
    "-p",
    "tsconfig.build.json",
    "--outDir",
    outdir,
  ],
  { stdout: "inherit", stderr: "inherit" },
);

if ((await declarations.exited) !== 0) {
  throw new Error("Declaration build failed");
}

await Bun.write(
  path.join(outdir, "calculator.css"),
  Bun.file("src/calculator.css"),
);
~~~~

Configure **tsconfig.build.json** with declaration true, emitDeclarationOnly true, rootDir src, and outDir dist so src/index.ts emits dist/index.d.ts.

Run:

~~~~bash
bun run build
bun test test/package-exports.test.ts
~~~~

Expected: the built-export test passes.

- [ ] **Step 3: Add clean rebuild and consumer verification**

Create **scripts/verify-dist.ts** to:

1. create a temporary directory with mkdtemp(path.join(tmpdir(), "sci-calc-widget-verify-")) from node:fs/promises and node:os;
2. run bun scripts/build.ts --outdir followed by that directory;
3. recursively compare the temporary file names and bytes with committed dist;
4. create a consumer subdirectory whose package.json depends on sci-calc-widget through file: pointing at the repository root and React 19;
5. run bun install, bundle a consumer TSX file importing ScientificCalculator and sci-calc-widget/styles.css, and assert the bundle emits JavaScript and CSS; and
6. fail with the first differing or missing path; and
7. remove only the mkdtemp-created verification directory in a finally block after confirming it is beneath tmpdir().

The consumer source is:

~~~~tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScientificCalculator } from "sci-calc-widget";
import "sci-calc-widget/styles.css";

const html = renderToStaticMarkup(<ScientificCalculator />);
if (!html.includes('aria-label="Scientific calculator"')) {
  throw new Error("Scientific calculator export did not render");
}
~~~~

Do not delete or rewrite the repository's committed dist during verification.

- [ ] **Step 4: Run the complete sibling verification before release**

Run:

~~~~bash
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build
bun run verify:dist
git diff --check
git status --short
~~~~

Expected: all commands pass; status contains only intended source, script, README, lockfile, and dist changes.

- [ ] **Step 5: Commit the release candidate**

Run:

~~~~bash
git add README.md bun.lock package.json scripts src test dist tsconfig.json tsconfig.build.json
git commit -m "chore: prepare sci-calc-widget v0.1.0"
~~~~

Expected: the worktree is clean after the commit.

- [ ] **Step 6: Prove the public update is safe before pushing**

Run:

~~~~bash
git fetch origin
git merge-base --is-ancestor origin/main HEAD
git ls-remote --tags origin refs/tags/v0.1.0
~~~~

Expected: the ancestor command exits zero and the tag lookup prints nothing. If not, stop; never force-push or move an existing tag.

- [ ] **Step 7: Push main and the immutable release tag**

Run:

~~~~bash
git push origin HEAD:main
git tag -a v0.1.0 -m "sci-calc-widget v0.1.0"
git push origin v0.1.0
~~~~

Expected: origin/main points at the verified release commit and the new annotated tag resolves to that commit.

- [ ] **Step 8: Verify a clean install from the public tag**

In a fresh temporary directory, create:

~~~~json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sci-calc-widget": "github:EdwardAstill/sci-calc-widget#v0.1.0"
  }
}
~~~~

Run bun install, then run the same server-render and CSS bundle consumer from Step 3.

Expected: installation, import, render, and CSS bundle all pass without a sibling checkout or lifecycle build.

---

### Task 5: Add the tagged calculator dependency and readrun host component

**Repository:** readrun

**Files:**

- Modify: package.json
- Modify: bun.lock
- Create: src/presentation/client/toolkits/ScientificCalculatorToolkit.tsx
- Create: src/presentation/client/toolkits/ScientificCalculatorToolkit.test.tsx
- Modify: src/presentation/client/main.tsx

**Interfaces:**

- Consumes: public sci-calc-widget v0.1.0.
- Produces: ScientificCalculatorToolkit() and bundled package CSS; it does not yet open a floating window.

- [ ] **Step 1: Enter an isolated readrun worktree**

Use superpowers:using-git-worktrees to create:

~~~~text
/home/eastill/projects/readrun/.worktrees/toolkit-command-palette
branch: codex/toolkit-command-palette
base: main containing the approved design and this plan
~~~~

Expected: the worktree is clean and includes both planning documents.

- [ ] **Step 2: Add the exact public GitHub dependency**

Set the package dependency to:

~~~~json
"sci-calc-widget": "github:EdwardAstill/sci-calc-widget#v0.1.0"
~~~~

Run:

~~~~bash
bun install
bun pm ls sci-calc-widget
~~~~

Expected: Bun resolves v0.1.0 to the released Git commit and updates bun.lock. No file: dependency appears in package.json or bun.lock.

- [ ] **Step 3: Write the failing readrun host test**

Create **src/presentation/client/toolkits/ScientificCalculatorToolkit.test.tsx**:

~~~~tsx
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScientificCalculatorToolkit } from "./ScientificCalculatorToolkit.tsx";

test("hosts only the scientific calculator body", () => {
  const html = renderToStaticMarkup(<ScientificCalculatorToolkit />);

  expect(html).toContain('aria-label="Scientific calculator"');
  expect(html).toContain("Calculator expression");
  expect(html).not.toContain(">Graphing<");
  expect(html).not.toContain(">Tools<");
});
~~~~

Run:

~~~~bash
bun test src/presentation/client/toolkits/ScientificCalculatorToolkit.test.tsx
~~~~

Expected: FAIL because the host component does not exist.

- [ ] **Step 4: Implement the minimal calculator host and stylesheet import**

Create **ScientificCalculatorToolkit.tsx**:

~~~~tsx
import type React from "react";
import { ScientificCalculator } from "sci-calc-widget";

export function ScientificCalculatorToolkit(): React.JSX.Element {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ScientificCalculator autoFocus />
    </div>
  );
}
~~~~

Import the package stylesheet once from **src/presentation/client/main.tsx**:

~~~~ts
import "sci-calc-widget/styles.css";
~~~~

Run:

~~~~bash
bun test src/presentation/client/toolkits/ScientificCalculatorToolkit.test.tsx
bun run typecheck
~~~~

Expected: both pass.

- [ ] **Step 5: Verify readrun's client bundle consumes JavaScript and CSS exports**

Run:

~~~~bash
bun test src/infrastructure/runtime/server.test.ts
bun run build:docs
rg -n "sci-calc-widget" package.json bun.lock
~~~~

Expected: server/client bundle tests and the docs build pass; package.json contains the tag and bun.lock contains its resolved commit.

- [ ] **Step 6: Commit the dependency boundary**

Run:

~~~~bash
git add package.json bun.lock src/presentation/client/main.tsx src/presentation/client/toolkits
git commit -m "feat: add scientific calculator dependency"
~~~~

---

### Task 6: Implement pure floating-window state and viewport constraints

**Repository:** readrun

**Files:**

- Create: src/presentation/client/toolkits/types.ts
- Create: src/presentation/client/toolkits/window-state.ts
- Create: src/presentation/client/toolkits/window-state.test.ts

**Interfaces:**

- Produces:
  - ToolkitId = "python-terminal" | "scientific-calculator"
  - WindowRect, ViewportSize, ToolkitSize, ToolkitDefinition
  - ToolkitWorkspaceState and ToolkitWindowAction
  - createToolkitWorkspaceState()
  - clampWindowRect(rect, viewport, minimum)
  - reduceToolkitWindows(state, action)

- [ ] **Step 1: Write reducer and geometry tests with literal expected rectangles**

Create **window-state.test.ts**:

~~~~ts
import { describe, expect, test } from "bun:test";
import {
  clampWindowRect,
  createToolkitWorkspaceState,
  reduceToolkitWindows,
} from "./window-state.ts";
import type { ToolkitDefinition } from "./types.ts";

const terminal: ToolkitDefinition = {
  id: "python-terminal",
  title: "Python Terminal",
  description: "Run browser Python",
  defaultSize: { width: 640, height: 420 },
  minimumSize: { width: 360, height: 240 },
  render: () => null,
};

const viewport = { width: 1000, height: 700 };

describe("floating toolkit state", () => {
  test("opens one bounded window and raises rather than duplicates it", () => {
    let state = createToolkitWorkspaceState();
    state = reduceToolkitWindows(state, {
      type: "open",
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "open",
      definition: terminal,
      viewport,
    });

    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]).toMatchObject({
      id: "python-terminal",
      minimized: false,
      rect: { x: 24, y: 24, width: 640, height: 420 },
      zIndex: 2,
    });
  });

  test("minimizes, restores, and removes a window", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "minimize",
      id: "python-terminal",
    });
    expect(state.windows[0]?.minimized).toBe(true);

    state = reduceToolkitWindows(state, {
      type: "open",
      definition: terminal,
      viewport,
    });
    expect(state.windows[0]?.minimized).toBe(false);

    state = reduceToolkitWindows(state, {
      type: "close",
      id: "python-terminal",
    });
    expect(state.windows).toEqual([]);
  });

  test("clamps movement and size to the usable viewport", () => {
    expect(
      clampWindowRect(
        { x: 900, y: -20, width: 1200, height: 100 },
        viewport,
        terminal.minimumSize,
      ),
    ).toEqual({ x: 0, y: 0, width: 1000, height: 240 });
  });

  test("normalizes every open window after viewport shrink", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "set-rect",
      id: "python-terminal",
      rect: { x: 600, y: 400, width: 400, height: 300 },
      viewport,
      minimumSize: terminal.minimumSize,
    });
    state = reduceToolkitWindows(state, {
      type: "normalize",
      viewport: { width: 500, height: 360 },
      definitions: [terminal],
    });

    expect(state.windows[0]?.rect).toEqual({
      x: 100,
      y: 60,
      width: 400,
      height: 300,
    });
  });
});
~~~~

Run:

~~~~bash
bun test src/presentation/client/toolkits/window-state.test.ts
~~~~

Expected: FAIL because the types and reducer do not exist.

- [ ] **Step 2: Define focused toolkit and window contracts**

Create **types.ts**:

~~~~ts
import type React from "react";

export type ToolkitId = "python-terminal" | "scientific-calculator";

export interface ToolkitSize {
  width: number;
  height: number;
}

export interface WindowRect extends ToolkitSize {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ToolkitDefinition {
  id: ToolkitId;
  title: string;
  description: string;
  defaultSize: ToolkitSize;
  minimumSize: ToolkitSize;
  render: () => React.ReactNode;
}

export interface ToolkitWindowState {
  id: ToolkitId;
  minimized: boolean;
  rect: WindowRect;
  zIndex: number;
}

export interface ToolkitWorkspaceState {
  windows: ToolkitWindowState[];
  nextZIndex: number;
}
~~~~

- [ ] **Step 3: Implement the minimal pure reducer**

In **window-state.ts**, implement the action union and reducer:

~~~~ts
export type ToolkitWindowAction =
  | { type: "open"; definition: ToolkitDefinition; viewport: ViewportSize }
  | { type: "raise"; id: ToolkitId }
  | { type: "minimize"; id: ToolkitId }
  | { type: "close"; id: ToolkitId }
  | {
      type: "set-rect";
      id: ToolkitId;
      rect: WindowRect;
      viewport: ViewportSize;
      minimumSize: ToolkitSize;
    }
  | {
      type: "normalize";
      viewport: ViewportSize;
      definitions: readonly ToolkitDefinition[];
    };
~~~~

Use 24-pixel staggered defaults, cap width/height at the viewport, enforce minimums only when the viewport can contain them, and clamp x/y so the full rectangle remains reachable. Opening an existing window sets minimized false and consumes exactly one new z-index. Closing removes it. Normalize looks up each definition by ID and clamps its rectangle without changing z-order.

- [ ] **Step 4: Run focused and affected tests**

Run:

~~~~bash
bun test src/presentation/client/toolkits/window-state.test.ts
bun run typecheck
~~~~

Expected: all pass.

- [ ] **Step 5: Commit window state**

Run:

~~~~bash
git add src/presentation/client/toolkits/types.ts src/presentation/client/toolkits/window-state.ts src/presentation/client/toolkits/window-state.test.ts
git commit -m "feat: add floating toolkit window state"
~~~~

---

### Task 7: Build accessible draggable, resizable toolkit windows and minimized shelf

**Repository:** readrun

**Files:**

- Create: src/presentation/client/toolkits/FloatingToolkitWindow.tsx
- Create: src/presentation/client/toolkits/ToolkitWorkspace.tsx
- Create: src/presentation/client/toolkits/FloatingToolkitWindow.test.tsx
- Modify: src/test/happy-dom.ts

**Interfaces:**

- Consumes: ToolkitDefinition, ToolkitWindowState, ToolkitWindowAction, and reducer state from Task 6.
- Produces:
  - FloatingToolkitWindow(props)
  - ToolkitWorkspace({ definitions, state, dispatch })
  - pointer move/resize plus keyboard Move/Resize modes

- [ ] **Step 1: Add PointerEvent to the shared DOM harness and write failing window interactions**

Add window.PointerEvent to the values installed by **src/test/happy-dom.ts**.

Create **FloatingToolkitWindow.test.tsx** with installHappyDom, React act, createRoot, and raw DOM queries, matching the repository's existing client-test style. Do not add Testing Library to readrun. Render a ToolkitWorkspace with a definition whose render function returns an input labelled "Tool input". Add small local clickLabel and pressKey helpers that click `[aria-label="..."]` elements and dispatch bubbling KeyboardEvent objects to document.activeElement. Cover:

~~~~tsx
test("renders a labelled modeless window and a keyboard restore shelf", async () => {
  // Render one open terminal window through the real reducer.
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  const input = document.querySelector('[aria-label="Tool input"]');
  const titleId = dialog?.getAttribute("aria-labelledby");
  expect(dialog?.getAttribute("aria-modal")).toBe("false");
  expect(document.getElementById(titleId ?? "")?.textContent).toBe("Python Terminal");

  await clickLabel("Minimize Python Terminal");
  expect(dialog?.hidden).toBe(true);
  expect(document.querySelector('[aria-label="Tool input"]')).toBe(input);
  expect(document.querySelector('[aria-label="Restore Python Terminal"]')).toBeTruthy();

  await clickLabel("Restore Python Terminal");
  expect(dialog?.hidden).toBe(false);
  expect(document.querySelector('[aria-label="Tool input"]')).toBe(input);
});

test("moves and resizes with the keyboard window menu", async () => {
  // Open the title-bar menu and select Move.
  await clickLabel("Window actions for Python Terminal");
  await clickMenuItem("Move");
  await pressKeys("ArrowRight", "ArrowDown", "Enter");
  expect(readInlineRect()).toMatchObject({ x: 34, y: 34 });

  await clickLabel("Window actions for Python Terminal");
  await clickMenuItem("Resize");
  await pressKeys(
    { key: "ArrowRight", shiftKey: true },
    { key: "ArrowDown", shiftKey: true },
    "Enter",
  );
  expect(readInlineRect()).toMatchObject({ width: 641, height: 421 });
});

test("Escape cancels a keyboard transform without closing the toolkit", async () => {
  // Enter Move, press Right, then Escape.
  expect(readInlineRect()).toMatchObject({ x: 24, y: 24 });
  expect(document.querySelector('[role="dialog"]')).toBeTruthy();
});

test("drags the title bar and resizes from the southeast handle", async () => {
  await pointerSequence("Move Python Terminal", {
    start: { x: 100, y: 100 },
    end: { x: 140, y: 125 },
  });
  expect(readInlineRect()).toMatchObject({ x: 64, y: 49 });

  await pointerSequence("Resize Python Terminal", {
    start: { x: 500, y: 400 },
    end: { x: 530, y: 420 },
  });
  expect(readInlineRect()).toMatchObject({ width: 670, height: 440 });
});

test("switches to a bounded compact surface on a narrow viewport", async () => {
  setViewport(500, 720);
  await dispatchWindowResize();
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  expect(dialog?.dataset.compact).toBe("true");
  expect(readInlineRect().width).toBeLessThanOrEqual(500);
});
~~~~

Implement readInlineRect in the test by parsing data-x, data-y, data-width, and data-height attributes on the real dialog. pointerSequence dispatches pointerdown, pointermove, and pointerup with one pointerId against the labelled title bar or southeast handle. The helpers must wrap state-changing events in act. Do not assert a fake component or mock callback.

Run:

~~~~bash
bun test src/presentation/client/toolkits/FloatingToolkitWindow.test.tsx
~~~~

Expected: FAIL because the workspace components do not exist.

- [ ] **Step 2: Implement the floating window chrome**

Define **FloatingToolkitWindowProps**:

~~~~ts
export interface FloatingToolkitWindowProps {
  definition: ToolkitDefinition;
  windowState: ToolkitWindowState;
  compact: boolean;
  viewport: ViewportSize;
  dispatch: React.Dispatch<ToolkitWindowAction>;
}
~~~~

Render:

- a fixed role="dialog" surface with aria-modal="false" and aria-labelledby;
- a rounded title bar with title, Window actions dropdown, Minimize, and Close;
- child content that stays mounted while minimized so calculator and terminal state survive;
- accessible east, south, and southeast pointer resize handles, with the southeast handle labelled **Resize {title}**;
- data rectangle attributes for observable behavior; and
- compact mode using inset: 0, width/height auto, flush viewport edges, and rounded exposed top corners.

Use existing readrun Button and DropdownMenu primitives. Do not wrap the window in Modal or the overlay store.

The draggable title bar is labelled **Move {title}**. Ignore a title-bar pointerdown originating from a button, input, menu item, or resize handle. Otherwise pointer behavior captures the starting rectangle and pointer coordinates, applies deltas through clampWindowRect, and dispatches set-rect. Pointer interaction first dispatches raise.

- [ ] **Step 3: Implement keyboard Move and Resize modes**

The Window actions dropdown has menu items Move, Resize, Minimize, and Close. Selecting Move or Resize:

1. stores the current rectangle;
2. focuses a title-bar element with tabIndex -1;
3. sets a local mode; and
4. announces "Move mode" or "Resize mode" through a polite live region.

While active:

- Arrow changes x/y or width/height by 10;
- Shift+Arrow changes it by 1;
- Enter accepts and exits;
- Escape dispatches the stored rectangle and exits; and
- no action closes the dialog.

- [ ] **Step 4: Implement ToolkitWorkspace and the minimized shelf**

ToolkitWorkspace receives the registry definitions, reducer state, and dispatch. It:

- listens for window resize and dispatches normalize;
- calculates compact as viewport width below 640;
- renders every window by definition ID, setting the dialog hidden, inert, and inline `display: none` while minimized instead of unmounting its child;
- renders a fixed rounded shelf only when at least one window is minimized; and
- restores a minimized toolkit by dispatching open with its definition/current viewport.

If a state ID has no definition, log one development console error and omit that window without breaking the other toolkit.

- [ ] **Step 5: Run window UI and state verification**

Run:

~~~~bash
bun test src/presentation/client/toolkits/FloatingToolkitWindow.test.tsx src/presentation/client/toolkits/window-state.test.ts
bun run typecheck
~~~~

Expected: all tests pass with no React act warnings.

- [ ] **Step 6: Commit the floating workspace**

Run:

~~~~bash
git add src/test/happy-dom.ts src/presentation/client/toolkits
git commit -m "feat: add floating toolkit workspace"
~~~~

---

### Task 8: Add an isolated Pyodide terminal adapter and queued session controller

**Repository:** readrun

**Files:**

- Create: src/presentation/client/toolkits/terminal-session.ts
- Create: src/presentation/client/toolkits/terminal-session.test.ts
- Modify: src/presentation/client/execution/pyodide.ts

**Interfaces:**

- Produces:
  - TerminalExecution
  - TerminalPythonRuntime with prepare(), execute(sessionId, source), reset(sessionId)
  - TerminalTranscriptEntry and TerminalSessionSnapshot
  - TerminalSession class with subscribe, getSnapshot, prepare, retry, submit, clearOutput, reset, previousCommand, nextCommand, dispose
  - pyodideTerminalRuntime

- [ ] **Step 1: Write the failing controller tests against a stateful in-memory runtime**

Create **terminal-session.test.ts**. Use a small in-memory runtime that recognizes "x = 3", "x", "print(x)", and "raise" and keeps a Map per session ID. It is a deterministic implementation of the TerminalPythonRuntime contract, not a call-count mock.

Cover:

~~~~ts
test("queues dependent commands and records output in submission order", async () => {
  const session = new TerminalSession(memoryRuntime(), "terminal-test");
  await session.prepare();

  const first = session.submit("x = 3");
  const second = session.submit("print(x)");
  await Promise.all([first, second]);

  expect(session.getSnapshot().entries).toEqual([
    {
      id: 1,
      source: "x = 3",
      stdout: "",
      stderr: "",
      result: null,
      error: null,
    },
    {
      id: 2,
      source: "print(x)",
      stdout: "3\n",
      stderr: "",
      result: null,
      error: null,
    },
  ]);
});

test("clear keeps history and runtime state while reset removes both", async () => {
  const session = new TerminalSession(memoryRuntime(), "terminal-test");
  await session.prepare();
  await session.submit("x = 3");
  session.clearOutput();
  expect(session.previousCommand()).toBe("x = 3");
  await session.submit("x");
  expect(session.getSnapshot().entries[0]?.result).toBe("3");

  await session.reset();
  expect(session.getSnapshot().entries).toEqual([]);
  expect(session.previousCommand()).toBe("");
});

test("keeps session namespaces isolated while sharing one runtime", async () => {
  const runtime = memoryRuntime();
  const first = new TerminalSession(runtime, "terminal-one");
  const second = new TerminalSession(runtime, "terminal-two");
  await Promise.all([first.prepare(), second.prepare()]);

  await first.submit("x = 3");
  await second.submit("x");
  expect(second.getSnapshot().entries[0]?.error).toContain("not defined");

  await first.submit("x");
  expect(first.getSnapshot().entries.at(-1)?.result).toBe("3");
});

test("reports prepare failure and succeeds through retry", async () => {
  const runtime = failsPreparationOnce();
  const session = new TerminalSession(runtime, "terminal-test");
  await session.prepare();
  expect(session.getSnapshot().status).toBe("error");
  expect(session.getSnapshot().loadError).toContain("offline");

  await session.retry();
  expect(session.getSnapshot().status).toBe("ready");
});

test("an execution error does not poison the command queue", async () => {
  const session = new TerminalSession(memoryRuntime(), "terminal-test");
  await session.prepare();
  await session.submit("raise");
  await session.submit("x = 3");
  expect(session.getSnapshot().entries.map((entry) => entry.error)).toEqual([
    "Traceback: boom",
    null,
  ]);
});

test("turns a rejected execution into a transcript error and remains usable", async () => {
  const session = new TerminalSession(rejectsExecutionOnce(), "terminal-test");
  await session.prepare();
  await session.submit("import unavailable_package");
  await session.submit("x = 3");

  expect(session.getSnapshot().entries[0]?.error).toContain("package install failed");
  expect(session.getSnapshot().entries[1]?.error).toBeNull();
});
~~~~

Run:

~~~~bash
bun test src/presentation/client/toolkits/terminal-session.test.ts
~~~~

Expected: FAIL because TerminalSession and its contracts do not exist.

- [ ] **Step 2: Implement the observable queued TerminalSession**

Use these exact shapes:

~~~~ts
export interface TerminalExecution {
  stdout: string;
  stderr: string;
  result: string | null;
  error: string | null;
}

export interface TerminalPythonRuntime {
  prepare(): Promise<void>;
  execute(sessionId: string, source: string): Promise<TerminalExecution>;
  reset(sessionId: string): Promise<void>;
}

export interface TerminalTranscriptEntry extends TerminalExecution {
  id: number;
  source: string;
}

export interface TerminalSessionSnapshot {
  status: "loading" | "ready" | "running" | "error";
  loadError: string | null;
  entries: readonly TerminalTranscriptEntry[];
}
~~~~

TerminalSession must replace its immutable snapshot before notifying listeners so React useSyncExternalStore can observe changes. submit ignores whitespace-only input, appends history once, chains execution onto a private Promise, and keeps the chain alive after errors. If runtime.execute rejects, convert the Error message/stack to that command's error field instead of rejecting the public queue. previousCommand/nextCommand return strings and clamp at draft/history boundaries. reset waits for queued work, calls runtime.reset, and clears entries/history. dispose calls reset once and prevents further notification.

- [ ] **Step 3: Run the controller RED-to-GREEN cycle**

Run:

~~~~bash
bun test src/presentation/client/toolkits/terminal-session.test.ts
~~~~

Expected: all controller tests pass.

- [ ] **Step 4: Add the isolated terminal bootstrap to the existing Pyodide module**

Extend the private Pyodide interface only as needed; retain the one existing loader and package installer. Add a terminal-support initialization guard and bootstrap this Python behavior once:

~~~~python
import ast as _rr_ast
import contextlib as _rr_contextlib
import io as _rr_io
import json as _rr_json
import traceback as _rr_traceback

_readrun_terminal_sessions = {}

def _readrun_terminal_globals(session_id):
    return _readrun_terminal_sessions.setdefault(
        session_id,
        {"__builtins__": __builtins__, "__name__": "__readrun_terminal__"},
    )

def _readrun_terminal_execute(session_id, source):
    namespace = _readrun_terminal_globals(session_id)
    stdout = _rr_io.StringIO()
    stderr = _rr_io.StringIO()
    result = None
    error = None
    try:
        module = _rr_ast.parse(source, mode="exec")
        with _rr_contextlib.redirect_stdout(stdout), _rr_contextlib.redirect_stderr(stderr):
            if module.body and isinstance(module.body[-1], _rr_ast.Expr):
                prefix = _rr_ast.Module(body=module.body[:-1], type_ignores=[])
                if prefix.body:
                    exec(compile(prefix, "<readrun-terminal>", "exec"), namespace, namespace)
                expression = _rr_ast.Expression(module.body[-1].value)
                value = eval(
                    compile(expression, "<readrun-terminal>", "eval"),
                    namespace,
                    namespace,
                )
                if value is not None:
                    result = repr(value)
            else:
                exec(compile(module, "<readrun-terminal>", "exec"), namespace, namespace)
    except BaseException:
        error = _rr_traceback.format_exc()
    return _rr_json.dumps({
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "result": result,
        "error": error,
    })

def _readrun_terminal_reset(session_id):
    _readrun_terminal_sessions.pop(session_id, None)
~~~~

Before execute, use the existing import parser and installPackages for imports in the submitted source. Pass session ID and source as JSON-escaped string literals, call the Python helper, parse its JSON string, and return TerminalExecution. reset removes only that session dictionary. It must not replace the Pyodide singleton, sys.modules, page globals, or virtual filesystem.

Export:

~~~~ts
export const pyodideTerminalRuntime: TerminalPythonRuntime = {
  prepare: async () => {
    await loadPyodideRuntime();
    await ensureTerminalSupport();
  },
  execute: runPyodideTerminal,
  reset: resetPyodideTerminal,
};
~~~~

- [ ] **Step 5: Run affected execution and controller tests**

Run:

~~~~bash
bun test src/presentation/client/toolkits/terminal-session.test.ts
bun test src/presentation/client/execution
bun run typecheck
~~~~

Expected: all pass. Existing executable-block behavior remains unchanged.

- [ ] **Step 6: Commit the terminal runtime boundary**

Run:

~~~~bash
git add src/presentation/client/execution/pyodide.ts src/presentation/client/toolkits/terminal-session.ts src/presentation/client/toolkits/terminal-session.test.ts
git commit -m "feat: add persistent Pyodide terminal sessions"
~~~~

---

### Task 9: Build the floating Python terminal interface

**Repository:** readrun

**Files:**

- Create: src/presentation/client/toolkits/PythonTerminal.tsx
- Create: src/presentation/client/toolkits/PythonTerminal.test.tsx

**Interfaces:**

- Consumes: TerminalSession, TerminalPythonRuntime, and pyodideTerminalRuntime.
- Produces: PythonTerminal({ runtime?, sessionId?, autoFocus? }) with a text-only transcript and no document-level key handler.

- [ ] **Step 1: Write the failing terminal UI tests with an injected runtime**

Create **PythonTerminal.test.tsx** with installHappyDom, createRoot, act, and the same stateful in-memory runtime used by the controller tests. Use raw DOM queries rather than adding Testing Library. Add a local setTextareaValue helper that calls the native HTMLTextAreaElement value setter and dispatches a bubbling input event.

Cover these observable behaviors:

~~~~tsx
test("loads, executes dependent commands, and renders output as text", async () => {
  await renderTerminal(memoryRuntime());
  const input = terminalInput();

  await submit(input, "x = 7");
  await submit(input, "print(x * 6)");

  expect(document.querySelector("[data-terminal-transcript]")?.textContent)
    .toContain("42");
  expect(input.disabled).toBe(false);
});

test("inserts a newline for Shift+Enter and recalls boundary history", async () => {
  await renderTerminal(memoryRuntime());
  const input = terminalInput();

  setTextareaValue(input, "for value in [1, 2]:");
  await keydown(input, "Enter", { shiftKey: true });
  expect(input.value).toBe("for value in [1, 2]:\n");

  await submit(input, "x = 7");
  input.setSelectionRange(0, 0);
  await keydown(input, "ArrowUp");
  expect(input.value).toBe("x = 7");
});

test("clear preserves state and history while reset removes both", async () => {
  await renderTerminal(memoryRuntime());
  await submit(terminalInput(), "x = 7");
  await clickLabel("Clear Output");
  expect(document.querySelector("[data-terminal-entry]")).toBeNull();

  await submit(terminalInput(), "x");
  expect(document.body.textContent).toContain("7");
  await clickLabel("Reset Session");
  expect(document.querySelector("[data-terminal-entry]")).toBeNull();
});

test("shows a preparation failure and retries in place", async () => {
  await renderTerminal(failsPreparationOnce());
  expect(document.querySelector('[role="alert"]')?.textContent).toContain("offline");
  await clickLabel("Retry Python runtime");
  expect(terminalInput().disabled).toBe(false);
});
~~~~

Also assert that a source string such as `<img src=x onerror=alert(1)>` appears literally in textContent and never creates an img element.

Run:

~~~~bash
bun test src/presentation/client/toolkits/PythonTerminal.test.tsx
~~~~

Expected: FAIL because PythonTerminal.tsx does not exist.

- [ ] **Step 2: Implement the session-backed terminal component**

Use this boundary:

~~~~ts
export interface PythonTerminalProps {
  runtime?: TerminalPythonRuntime;
  sessionId?: string;
  autoFocus?: boolean;
}
~~~~

Construct exactly one TerminalSession per mounted component with useRef, subscribe through useSyncExternalStore using getSnapshot for both the client and server snapshot, call prepare in an effect, and call dispose from that effect's cleanup. Default runtime to pyodideTerminalRuntime and sessionId to "python-terminal".

Render:

- a compact toolbar with **Clear Output** and **Reset Session** rounded buttons;
- a status line for loading or running;
- a role="alert" load-error block with **Retry Python runtime**;
- a scrollable aria-live="polite" transcript marked data-terminal-transcript;
- each submitted source, stdout, stderr, result, and traceback through React text children inside pre elements marked data-terminal-entry; and
- a multiline textarea labelled **Python terminal input**, marked data-toolkit-primary-input, plus a **Run Python command** button.

The textarea is disabled only while loading or after a load failure. Enter submits and clears it, Shift+Enter is left to the browser, Up recalls history only with selectionStart/selectionEnd at zero, and Down recalls newer history only with both at value.length. Empty submissions do nothing. Focus the textarea after preparation when autoFocus is true. Scroll the transcript to the last entry after each immutable snapshot change.

Include visible help text: "Python runs in this browser. Long-running commands cannot be interrupted." Do not use dangerouslySetInnerHTML.

- [ ] **Step 3: Run the terminal UI RED-to-GREEN cycle**

Run:

~~~~bash
bun test src/presentation/client/toolkits/PythonTerminal.test.tsx src/presentation/client/toolkits/terminal-session.test.ts
bun run typecheck
~~~~

Expected: all tests pass without fetching Pyodide because the UI test injects its deterministic runtime.

- [ ] **Step 4: Commit the terminal interface**

Run:

~~~~bash
git add src/presentation/client/toolkits/PythonTerminal.tsx src/presentation/client/toolkits/PythonTerminal.test.tsx
git commit -m "feat: add floating Python terminal interface"
~~~~

---

### Task 10: Define the closed built-in toolkit registry

**Repository:** readrun

**Files:**

- Create: src/presentation/client/toolkits/registry.tsx
- Create: src/presentation/client/toolkits/registry.test.tsx

**Interfaces:**

- Consumes: PythonTerminal and ScientificCalculatorToolkit.
- Produces: TOOLKIT_DEFINITIONS and getToolkitDefinition(id); this remains an internal two-item registry, not a plugin API.

- [ ] **Step 1: Write the failing exact-registry test**

Create **registry.test.tsx**:

~~~~tsx
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getToolkitDefinition,
  TOOLKIT_DEFINITIONS,
} from "./registry.tsx";

test("registers exactly the two approved built-in toolkits", () => {
  expect(TOOLKIT_DEFINITIONS.map(({ id, title, description }) => ({
    id,
    title,
    description,
  }))).toEqual([
    {
      id: "python-terminal",
      title: "Python Terminal",
      description: "Run persistent Python commands in this browser.",
    },
    {
      id: "scientific-calculator",
      title: "Scientific Calculator",
      description: "Open the scientific calculator.",
    },
  ]);
});

test("renders each toolkit through its definition", () => {
  const terminal = getToolkitDefinition("python-terminal");
  const calculator = getToolkitDefinition("scientific-calculator");

  expect(renderToStaticMarkup(terminal!.render())).toContain("Python terminal input");
  expect(renderToStaticMarkup(calculator!.render())).toContain("Scientific calculator");
  expect(getToolkitDefinition("missing" as never)).toBeUndefined();
});
~~~~

Run:

~~~~bash
bun test src/presentation/client/toolkits/registry.test.tsx
~~~~

Expected: FAIL because registry.tsx does not exist.

- [ ] **Step 2: Implement the literal two-toolkit registry**

Create **registry.tsx** with these immutable definitions:

~~~~tsx
export const TOOLKIT_DEFINITIONS = [
  {
    id: "python-terminal",
    title: "Python Terminal",
    description: "Run persistent Python commands in this browser.",
    defaultSize: { width: 640, height: 420 },
    minimumSize: { width: 360, height: 240 },
    render: () => <PythonTerminal autoFocus />,
  },
  {
    id: "scientific-calculator",
    title: "Scientific Calculator",
    description: "Open the scientific calculator.",
    defaultSize: { width: 900, height: 620 },
    minimumSize: { width: 600, height: 420 },
    render: () => <ScientificCalculatorToolkit />,
  },
] as const satisfies readonly ToolkitDefinition[];
~~~~

getToolkitDefinition accepts a ToolkitId and returns the matching definition or undefined. Add no dynamic registration, configuration file, or third-party loading.

- [ ] **Step 3: Verify and commit the registry**

Run:

~~~~bash
bun test src/presentation/client/toolkits/registry.test.tsx
bun run typecheck
git add src/presentation/client/toolkits/registry.tsx src/presentation/client/toolkits/registry.test.tsx
git commit -m "feat: register built-in toolkits"
~~~~

Expected: the test and typecheck pass, and the commit contains only the registry boundary.

---

### Task 11: Add the command palette and connect it to the application shell

**Repository:** readrun

**Files:**

- Create: src/presentation/client/islands/CommandPaletteIsland.tsx
- Create: src/presentation/client/islands/CommandPaletteIsland.test.tsx
- Create: src/presentation/client/islands/ShellDialogsIsland.test.tsx
- Modify: src/presentation/client/islands/ShellDialogsIsland.tsx
- Modify: src/presentation/client/overlay.ts
- Modify: src/presentation/client/overlay.test.ts
- Modify: src/presentation/client/shortcuts.ts
- Modify: src/presentation/client/islands/ShortcutsIsland.tsx
- Modify: src/presentation/client/islands/ShortcutsIsland.test.tsx if present; otherwise create it

**Interfaces:**

- Consumes: SearchPalette, overlay store, toolkit registry, window reducer, and ToolkitWorkspace.
- Produces: a four-command catalog; Ctrl/Cmd+K shell binding; toolkit open/restore/raise; and Search Site/Search Page delegation.

- [ ] **Step 1: Add a failing overlay-ID assertion**

Extend **overlay.test.ts** to assert `isOverlayId("command-palette-overlay")` is true and that openOverlay/closeOverlay notify for the new ID.

Run:

~~~~bash
bun test src/presentation/client/overlay.test.ts
~~~~

Expected: FAIL because the overlay ID is absent.

Add `"command-palette-overlay"` to OVERLAY_IDS in **overlay.ts**, rerun the test, and confirm it passes.

- [ ] **Step 2: Write the failing command catalog, filtering, keyboard, and dispatch tests**

Create **CommandPaletteIsland.test.tsx** using installHappyDom, createRoot, act, raw DOM queries, and closeAllOverlays cleanup. Cover:

~~~~ts
test("publishes and filters the four approved commands", () => {
  expect(COMMAND_PALETTE_COMMANDS.map((command) => command.title)).toEqual([
    "Open Python Terminal",
    "Open Scientific Calculator",
    "Search Site",
    "Search Page",
  ]);
  expect(filterCommandPaletteCommands("python").map((item) => item.id))
    .toEqual(["open-python-terminal"]);
  expect(filterCommandPaletteCommands("search").map((item) => item.id))
    .toEqual(["search-site", "search-page"]);
});

test("selects a filtered toolkit command with the keyboard", async () => {
  const opened: ToolkitId[] = [];
  await renderPalette({ onOpenToolkit: (id) => opened.push(id) });
  const input = document.querySelector<HTMLInputElement>(
    '[aria-label="Command palette"]',
  )!;
  await setInputValue(input, "calculator");
  await keydown(input, "ArrowDown");
  await keydown(input, "Enter");
  expect(opened).toEqual(["scientific-calculator"]);
});

test("delegates search commands to their existing overlays", async () => {
  await renderPalette({ onOpenToolkit: () => undefined });
  await clickText("Search Site");
  expect(getActiveOverlay()).toBe("site-search-overlay");

  openOverlay("command-palette-overlay");
  await clickText("Search Page");
  expect(getActiveOverlay()).toBe("page-search-overlay");
});
~~~~

Run:

~~~~bash
bun test src/presentation/client/islands/CommandPaletteIsland.test.tsx
~~~~

Expected: FAIL because the command-palette module does not exist.

- [ ] **Step 3: Implement the command palette over SearchPalette**

Create the literal command list in **CommandPaletteIsland.tsx**:

~~~~ts
export type CommandPaletteCommand = SearchPaletteItem &
  (
    | { toolkitId: ToolkitId; overlayId?: never }
    | { toolkitId?: never; overlayId: "site-search-overlay" | "page-search-overlay" }
  );
~~~~

The titles and IDs are exactly those asserted in Step 2. Subtitles come from the toolkit descriptions or identify the search scope. filterCommandPaletteCommands lowercases and trims the query, then matches title and subtitle. The component resets its query whenever open changes from true to false.

Render the existing SearchPalette with id="command-palette-overlay", ariaLabel="Command palette", placeholder="Type a command...", and emptyLabel="No matching commands". SearchPalette closes itself before invoking onSelect; the selection handler then calls onOpenToolkit for toolkit commands or openOverlay for search commands. Unknown IDs do nothing.

Run the focused palette test and confirm it passes.

- [ ] **Step 4: Write the failing application-shell lifecycle test**

Create **ShellDialogsIsland.test.tsx** with a real application-shell host and an injected `toolkitDefinitions` prop. Supply a deterministic terminal definition whose render function returns an uncontrolled textarea marked data-toolkit-primary-input. Cover:

1. dispatch Ctrl+K from document body and Cmd+K from an editable input; each opens command-palette-overlay and prevents the default;
2. selecting **Open Python Terminal** opens one modeless window and focuses its textarea;
3. reopening the same command restores/raises the same DOM node instead of duplicating it;
4. changing the textarea value, minimizing it, and dispatching `readrun:remount` preserves that same mounted node and value;
5. closing and reopening creates a new node with its initial value; and
6. injecting the real scientific-calculator definition, entering `7×8`, minimizing/restoring, and navigating preserves the same calculator expression input and its value; and
7. the shell still renders SiteSearchIsland only when searchEnabled is true.

Run:

~~~~bash
bun test src/presentation/client/islands/ShellDialogsIsland.test.tsx
~~~~

Expected: FAIL because ShellDialogsIsland does not own toolkit state or the new palette.

- [ ] **Step 5: Integrate the reducer, palette, workspace, and focus handoff**

Extend ShellDialogsIslandProps with:

~~~~ts
toolkitDefinitions?: readonly ToolkitDefinition[];
~~~~

Default it to TOOLKIT_DEFINITIONS. In **ShellDialogsIsland.tsx**:

- create the toolkit reducer once with createToolkitWorkspaceState;
- change the existing Ctrl/Cmd+K handler to open command-palette-overlay even when searchEnabled is false and even when the event target is editable;
- dispatch open with the selected definition and current `window.innerWidth`/`innerHeight`;
- after selection, use requestAnimationFrame to focus the first `[data-toolkit-primary-input]`, textarea, or input inside that toolkit's `[data-toolkit-id]` window;
- render CommandPaletteIsland from activeOverlay state;
- render ToolkitWorkspace outside the overlay store so windows remain modeless;
- preserve the existing page/site-search custom events and window.openSiteSearch compatibility; and
- ignore a toolkit ID missing from the injected registry after one development console error.

Do not add a readrun:remount listener to toolkit state: application-scoped ShellDialogsIsland remains mounted by the existing lifecycle, which is the persistence mechanism.

Run:

~~~~bash
bun test src/presentation/client/islands/ShellDialogsIsland.test.tsx src/presentation/client/islands/CommandPaletteIsland.test.tsx
~~~~

Expected: both pass with no duplicate-window or act warnings.

- [ ] **Step 6: Document the platform shortcut in the shortcuts overlay**

Export this display-only constant from **shortcuts.ts** without adding it to SHORTCUT_BINDINGS or the single-key dispatcher:

~~~~ts
export const COMMAND_PALETTE_SHORTCUT = "Ctrl/Cmd+K";
~~~~

Add a **Command palette** row at the top of the existing Commands section in ShortcutsIsland and render the binding through formatBinding. Write or extend **ShortcutsIsland.test.tsx** with installHappyDom and a real React root, open the island, and assert document.body contains both "Command palette" and "Ctrl/Cmd+K". Existing `s` and `?` rows remain unchanged.

- [ ] **Step 7: Run the complete shell and keyboard boundary**

Run:

~~~~bash
bun test src/presentation/client/overlay.test.ts src/presentation/client/shortcuts.test.ts src/presentation/client/islands/CommandPaletteIsland.test.tsx src/presentation/client/islands/ShellDialogsIsland.test.tsx src/presentation/client/islands/ShortcutsIsland.test.tsx src/presentation/client/toolkits
bun run typecheck
bun run build:docs
~~~~

Expected: all tests, typecheck, and client/docs bundle pass. Ctrl/Cmd+K has exactly one shell handler; `s`, `?`, Escape, and window keyboard modes retain their prior behavior.

- [ ] **Step 8: Commit the shell integration**

Run:

~~~~bash
git add src/presentation/client/overlay.ts src/presentation/client/overlay.test.ts src/presentation/client/shortcuts.ts src/presentation/client/islands src/presentation/client/toolkits
git commit -m "feat: add toolkit command palette"
~~~~

---

### Task 12: Document toolkits and complete cross-repository verification

**Repository:** readrun and sci-calc-widget

**Files:**

- Create: docs/toolkits.md
- Modify: docs/.readrun/navigation.yaml
- Modify: docs/README.md

**Interfaces:**

- Produces: a discoverable Toolkit documentation page and final evidence that both development and static paths satisfy the approved design.

- [ ] **Step 1: Write the toolkit documentation page**

Create **docs/toolkits.md** with these concrete sections:

- **Open a toolkit** — Ctrl+K/Cmd+K, filtering, the four initial commands, and the retained `s` page-search shortcut;
- **Manage windows** — open/raise, drag, visible resize handles, keyboard Move/Resize with 10-pixel and Shift 1-pixel steps, minimize/restore shelf, close, and narrow-screen behavior;
- **Python Terminal** — Pyodide/browser execution, Enter versus Shift+Enter, boundary Up/Down history, sequential queue, stdout/stderr/results/tracebacks, automatic package installation, Clear Output versus Reset Session, close cleanup, and static-build support;
- **Scientific Calculator** — approved arithmetic/scientific/list-statistics features, degree/radian mode, history/definitions/undo, and focused keyboard behavior;
- **State and limitations** — in-app-navigation retention, close/reload reset, main-thread blocking and no interrupt/input/rich output, and no storage persistence;
- **Attribution** — links to `https://github.com/EdwardAstill/sci-calc-widget` and `https://github.com/openmirai/mirai-scientific-calculator`, the OpenMirai v0.2.0 basis, and MIT licensing; and
- **Future investigation: local uv sessions** — documentation only: investigate an optional persistent local `uv` Python process with explicit startup/shutdown, isolation, error recovery, and Pyodide retained for static output.

Do not describe this as an `rr` CLI command, a plugin API, or an already-implemented local Python server.

- [ ] **Step 2: Make the page discoverable**

Add `Toolkits: toolkits.md` immediately after Commands in **docs/.readrun/navigation.yaml**. Add a **Toolkits** link immediately after Commands in the Documentation list in **docs/README.md**.

Run:

~~~~bash
bun run validate:docs
~~~~

Expected: strict validation exits zero with no orphan, missing-target, or navigation warnings.

- [ ] **Step 3: Commit the documentation**

Run:

~~~~bash
git add docs/toolkits.md docs/.readrun/navigation.yaml docs/README.md
git commit -m "docs: add toolkit guide"
~~~~

- [ ] **Step 4: Run the complete automated verification in both repositories**

In **/home/eastill/projects/sci-calc-widget/.worktrees/scientific-only** run:

~~~~bash
bun install --frozen-lockfile
bun run check
git diff --check
git status --short
~~~~

Expected: every check passes and the released worktree is clean.

In **/home/eastill/projects/readrun/.worktrees/toolkit-command-palette** run:

~~~~bash
bun install --frozen-lockfile
bun run check
bun run build:docs
git diff --check
git status --short
~~~~

Expected: typecheck, all tests, strict docs validation, and docs build pass; the feature worktree is clean. Inspect bun.lock and confirm sci-calc-widget resolves the public v0.1.0 Git dependency, never a file path.

- [ ] **Step 5: Smoke-test the served docs in a real browser**

Read and use the browser:control-in-app-browser skill for this local UI verification. Start readrun in a PTY:

~~~~bash
bun src/cli.ts serve docs --no-open --port 4173
~~~~

Open `http://127.0.0.1:4173` and verify:

1. Ctrl/Cmd+K opens the command palette from page content and from an editable toolkit input.
2. Filtering and selecting all four commands works; Search Site and Search Page open their existing interfaces.
3. Python Terminal accepts `x = 7`, then after an in-app navigation accepts `x * 6` and displays `42`.
4. Scientific Calculator evaluates `sin(30)` as `0.5` in degrees and `sin(pi/2)` as `1` in radians.
5. Both windows coexist; pointer drag, pointer resize, keyboard Move/Resize, minimize, restore, raise, and close behave independently.
6. Minimize and in-app navigation retain each toolkit's contents; close and reopen reset them.
7. Focus returns on palette dismissal, toolkit selection focuses its primary input, Escape does not close a floating window, and rounded exposed corners match the existing shell.

Record any console error or failed network request. Stop the server cleanly after the checks.

- [ ] **Step 6: Smoke-test generated static output**

Serve the already-generated **dist/** on a different port:

~~~~bash
bunx serve dist -l 4174
~~~~

Open `http://127.0.0.1:4174`, repeat command-palette opening, both toolkit launches, one Python expression, one degree-mode calculation, and an in-app navigation. Confirm the calculator has no runtime GitHub/CDN request and Pyodide loads through the existing static runtime path. Stop the server cleanly.

If either browser pass reveals a defect, use superpowers:systematic-debugging, add a reproducing test, make the smallest fix, rerun the focused test and Steps 4–6, and commit the fix with a focused message.

- [ ] **Step 7: Review the branch without merging it automatically**

Use superpowers:requesting-code-review against the complete readrun branch and address verified findings. Then use superpowers:verification-before-completion and superpowers:finishing-a-development-branch. Present the user with the verified branch/repository status and integration choices; do not merge, delete worktrees, or create a readrun pull request without their selection.

---

## Final acceptance checklist

- [ ] EdwardAstill/sci-calc-widget is public, preserves OpenMirai attribution/history, and has an immutable verified v0.1.0 tag.
- [ ] A clean readrun install resolves sci-calc-widget from that tag without a sibling checkout.
- [ ] The palette contains exactly the two toolkit and two search commands and opens from editable fields.
- [ ] Each toolkit has one independently movable, resizable, minimizable, restorable, and closable modeless window.
- [ ] Minimize and in-app navigation preserve mounted toolkit state; close and reload reset it.
- [ ] Terminal commands are queued, persistent inside one isolated Pyodide namespace, safely text-rendered, and reset without altering executable-block globals.
- [ ] The scientific calculator keeps the approved scientific keypad features and contains no graphing, dedicated Statistics, or Tools mode.
- [ ] Toolkit docs are in curated navigation and describe the optional persistent local uv process only as future work.
- [ ] Both repository check suites and served/static browser smoke tests pass with recorded evidence.
