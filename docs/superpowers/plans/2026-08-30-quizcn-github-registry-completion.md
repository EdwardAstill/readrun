# Quizcn GitHub Registry Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release quizcn exclusively as a tag-pinned GitHub shadcn registry item, install that exact source into ReadRun, remove ReadRun's superseded quiz implementation, and finish both handoffs with verified evidence.

**Architecture:** `EdwardAstill/quizcn` remains the canonical implementation and exposes one root `registry.json` item named `quiz`. Consumers use `bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0`, which copies canonical source into their repository and installs only its declared third-party dependencies. ReadRun commits that installed source under `src/presentation/components/quiz/`, keeps its transport/rich-text/mount adapter, and has no quizcn npm or Git dependency.

**Tech Stack:** Bun 1.4, TypeScript 5.9, React 19, `@shadcn/react`, Tailwind CSS 4, shadcn CLI GitHub registries, Bun test, Git/GitHub.

**Spec:** `docs/superpowers/specs/2026-08-25-quizcn-standalone-design.md`

## Global Constraints

- Use `/home/eastill/projects/quizcn/.worktrees/standalone-completion` on `codex/standalone-completion` for quizcn changes and `/home/eastill/projects/readrun/.worktrees/quizcn-standalone` on `codex/quizcn-standalone` for ReadRun changes.
- Do not create another ReadRun worktree. Both named paths are already isolated linked worktrees.
- Use Bun commands only; do not use Node, npm, pnpm, Yarn, Vite, Jest, or Vitest.
- Quizcn is not published as an npm package and must remain `private: true`.
- Quizcn's public distribution is exactly one GitHub shadcn item, `EdwardAstill/quizcn/quiz`, backed by canonical relative-import source files.
- The immutable first release ref is `v0.1.0`. Never force-push, reuse, or move that tag.
- The user has authorized a fast-forward push of the verified quizcn release commit to `EdwardAstill/quizcn` `main` and creation/push of `v0.1.0`.
- Abort the release if remote `main` is not an ancestor of the local release candidate or if `v0.1.0` already exists locally or remotely.
- ReadRun must not fetch quizcn during normal install, test, serve, or build; the shadcn source is installed once and committed.
- ReadRun retains `[quiz]` parsing, source diagnostics, rendered payload transport, trusted HTML/math rendering, island discovery, payload-error rendering, root lifecycle, and the transport adapter.
- Quizcn retains grading, session state, UI, feedback, results, restart, keyboard, focus, and accessibility behavior.
- Preserve the established shadcn semantic tokens and rounded corner radius scale.
- Quizcn must contain no ReadRun import, type, runtime, trusted HTML, math-rendering, or theme dependency.
- Do not edit generated `dist/`, `examples/dist/`, `public/r/`, fixture-generated source, or `node_modules/` as source.
- The existing uncommitted ReadRun `package.json` and `bun.lock` entries for the removed local tarball are temporary Task 7 evidence. Replace them; never commit that file dependency.
- Implement executable changes test-first. Every task receives an independent review gate before the next task begins.

## Starting State

- Quizcn feature HEAD: `e1e224a` (`fix: compare registry files byte for byte`), with a clean worktree.
- Public quizcn `main`: `18cc14a`; no public npm package and no `v0.1.0` tag exist.
- ReadRun feature HEAD: `6a6fe93`; adapter/mount integration is committed, while only `package.json` and `bun.lock` are dirty with the temporary `@quizcn/react` tarball dependency.
- Tasks 1–7 of `2026-08-25-quizcn-standalone.md` are complete. This plan supersedes its npm-oriented Tasks 8–10.

---

### Task 1: Prepare a registry-only quizcn release candidate

**Repository:** quizcn

**Files:**

- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `README.md`
- Modify: `registry.json`
- Modify: `.gitignore`
- Rename and modify: `scripts/build.ts` → `scripts/verify-registry.ts`
- Rename and modify: `test/build.test.ts` → `test/registry-fixture.test.ts`
- Create: `test/distribution.test.ts`
- Delete: `tsconfig.build.json`
- Delete: `fixtures/package-consumer/app.tsx`
- Delete: `fixtures/package-consumer/index.html`
- Delete: `fixtures/package-consumer/package.json`
- Delete: `fixtures/package-consumer/quiz.test.tsx`
- Delete: `fixtures/package-consumer/tsconfig.json`
- Verify unchanged canonical payload: `src/Quiz.tsx`, `src/QuizStep.tsx`, `src/QuizResults.tsx`, `src/Questionnaire.tsx`, `src/primitives.tsx`, `src/model.ts`, `src/grading.ts`, `src/session.ts`, `src/validation.ts`, `src/cn.ts`, `src/styles.css`

**Interfaces:**

- Consumes: the existing root `registry.json`, canonical `src/` files, shared `runQuizContract`, and local registry-consumer fixture.
- Produces: a private Bun project with `bun run check`, `bun run fixture:registry`, and `bun run fixture:registry:public`; the latter accepts the immutable GitHub item address through `--source`.

- [ ] **Step 1: Write the registry-only distribution test**

Create `test/distribution.test.ts` with assertions that fail against the current npm-oriented metadata:

```ts
import { expect, test } from "bun:test";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

test("quizcn is a private GitHub registry project, not a publishable package", async () => {
  const packageJson = await Bun.file(path.join(root, "package.json")).json();
  const registry = await Bun.file(path.join(root, "registry.json")).json();
  const readme = await Bun.file(path.join(root, "README.md")).text();

  expect(packageJson.name).toBe("quizcn");
  expect(packageJson.private).toBe(true);
  for (const field of ["main", "types", "exports", "files", "sideEffects", "peerDependencies"]) {
    expect(packageJson[field]).toBeUndefined();
  }
  expect(packageJson.scripts["fixture:package"]).toBeUndefined();
  expect(packageJson.scripts["fixture:registry:public"]).toContain(
    "EdwardAstill/quizcn/quiz#v0.1.0",
  );
  expect(registry.homepage).toBe("https://github.com/EdwardAstill/quizcn");
  expect(registry.items.map((item: { name: string }) => item.name)).toEqual(["quiz"]);
  expect(readme).toContain("EdwardAstill/quizcn/quiz#v0.1.0");
  expect(readme).not.toContain("@quizcn/react");
  expect(readme).not.toContain("bun add quizcn");
});
```

- [ ] **Step 2: Run the focused test and confirm the expected RED state**

Run:

```bash
bun test test/distribution.test.ts
```

Expected: FAIL because the current project is named `@quizcn/react`, exposes package entry points, documents npm installation, and still uses the provisional `owner/quizcn` registry owner.

- [ ] **Step 3: Replace npm-package metadata with private project metadata**

Set the leading `package.json` fields to:

```json
{
  "name": "quizcn",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.4.0"
}
```

Remove `version`, `main`, `types`, `exports`, `files`, `sideEffects`, and `peerDependencies`. Keep runtime libraries used by canonical source in `dependencies`, including React and React DOM:

```json
"dependencies": {
  "@shadcn/react": "^0.3.0",
  "clsx": "^2.1.1",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwind-merge": "^3.6.0"
}
```

Remove the now-duplicate `react` and `react-dom` entries from `devDependencies` while retaining their type packages and the test/build tooling.

Use these scripts:

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "test": "bun test ./test",
  "build": "bun build ./examples/index.html --outdir ./examples/dist",
  "registry:build": "bunx shadcn@latest registry validate ./registry.json && bunx shadcn@latest build ./registry.json --output ./public/r",
  "fixture:registry": "bun scripts/verify-registry.ts",
  "fixture:registry:public": "bun scripts/verify-registry.ts --source EdwardAstill/quizcn/quiz#v0.1.0",
  "check": "bun run typecheck && bun run test && bun run build && bun run registry:build && bun run fixture:registry"
}
```

Run `bun install` after editing so `bun.lock` exactly reflects the private project dependency graph.

- [ ] **Step 4: Reduce the verification script to registry behavior**

Rename `scripts/build.ts` to `scripts/verify-registry.ts`. Remove package bundling, declaration output, pack-file assertions, tarball fixture installation, `dist` handling, and the `--fixture` branch.

Retain `bytesEqual`, registry fixture cleanup, shared contract-file copying, dependency checks, canonical byte comparisons, semantic style/radius checks, one-React-installation proof, typecheck, Tailwind build, and behavior tests. Resolve the install source with this exact boundary:

```ts
const localRegistrySource = "../../public/r/quiz.json";

function registrySource(): string {
  const index = Bun.argv.indexOf("--source");
  if (index === -1) return localRegistrySource;
  const source = Bun.argv[index + 1];
  if (!source) throw new Error("--source requires a registry item address");
  return source;
}
```

Use `registrySource()` in both shadcn invocations:

```ts
const source = registrySource();
runCommand(["bunx", "shadcn@latest", "add", source, "--dry-run"], fixture);
runCommand(["bunx", "shadcn@latest", "add", source, "--yes"], fixture);
```

Require `public/r/quiz.json` only when `source === localRegistrySource`. Keep the fixture's original `package.json` restoration in `finally` for both local and public modes.

- [ ] **Step 5: Preserve the raw-byte regression test under its registry name**

Rename `test/build.test.ts` to `test/registry-fixture.test.ts` and update only its import:

```ts
import { bytesEqual } from "../scripts/verify-registry";
```

Keep the invalid UTF-8 regression assertion unchanged.

- [ ] **Step 6: Delete package-only files and ignore rules**

Delete `tsconfig.build.json` and the five tracked `fixtures/package-consumer/` files. Remove these package-only lines from `.gitignore`:

```gitignore
*.tgz
fixtures/package-consumer/bun.lock
fixtures/package-consumer/test/
```

Retain ignore rules for generated `dist/`, `public/r/`, and registry fixture output.

- [ ] **Step 7: Finalize GitHub registry metadata and documentation**

Change `registry.json` to:

```json
"name": "quizcn",
"homepage": "https://github.com/EdwardAstill/quizcn"
```

Keep exactly one item named `quiz`, all eleven canonical file mappings, all five runtime dependency declarations, explicit `@components/quiz/*` targets, and no registry dependencies.

Rewrite `README.md` around this install command:

```bash
bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0
```

Show source imports after installation rather than package imports:

```tsx
import { Quiz } from "@/components/quiz/Quiz";
import type { QuizDefinition, QuizResult } from "@/components/quiz/model";
import "@/components/quiz/styles.css";
```

Explain that the command copies editable source and may add React, `@shadcn/react`, `clsx`, and `tailwind-merge`; quizcn itself is not installed from npm. Keep the answer-visibility warning and the `examples/basic.tsx` pointer.

- [ ] **Step 8: Run focused GREEN verification**

Run:

```bash
bun test test/distribution.test.ts test/registry-fixture.test.ts
bun run registry:build
bun run fixture:registry
```

Expected: all tests pass; the local fixture installs all eleven files, matches them byte-for-byte with `src/`, compiles, and passes the shared quiz behavior contract.

- [ ] **Step 9: Run the full quizcn release-candidate checks**

Run:

```bash
bun install --frozen-lockfile
bun run check
rg -n "@quizcn/react|fixture:package|package-consumer|bun pm pack|owner/quizcn" package.json README.md registry.json scripts fixtures src
rg -ni "readrun|dangerouslySetInnerHTML|renderPageMath|RenderedRichText" src test
git diff --check
git status --short
```

Expected: `bun run check` passes; both searches return no matches; only intentional Task 1 source changes are present.

- [ ] **Step 10: Commit the registry-only release candidate**

```bash
git add .gitignore README.md bun.lock package.json registry.json scripts src test fixtures tsconfig.build.json
git commit -m "chore: prepare quizcn GitHub registry release"
```

Expected: the commit contains no generated fixture/build output and the worktree is clean.

---

### Task 2: Publish and verify the immutable GitHub release

**Repository:** quizcn

**Files:**

- No source change expected.
- Record execution evidence in the active SDD task report and ledger.

**Interfaces:**

- Consumes: the reviewed clean Task 1 release-candidate commit and `bun run fixture:registry:public`.
- Produces: public `main` at the release commit, immutable public tag `v0.1.0`, and passing fresh installs from both the full commit SHA and tag.

- [ ] **Step 1: Re-run the reviewed candidate before any external change**

```bash
bun install --frozen-lockfile
bun run check
git diff --check
git status --short
```

Expected: all checks pass and the quizcn worktree is clean.

- [ ] **Step 2: Fetch and prove the release is a safe fast-forward**

Run read-only checks first:

```bash
git fetch origin
git merge-base --is-ancestor origin/main HEAD
git ls-remote --tags origin refs/tags/v0.1.0
git tag --list v0.1.0
```

Expected: `origin/main` is an ancestor of `HEAD`; both tag queries print nothing. Stop without pushing if either condition is false.

- [ ] **Step 3: Fast-forward the public default branch**

```bash
git push origin HEAD:main
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

Expected: the remote `refs/heads/main` SHA equals the full local `HEAD` SHA. Do not use `--force` or a refspec containing `+`.

- [ ] **Step 4: Verify the public commit before assigning the immutable tag**

Set a task-specific shell variable and install directly from the public commit:

```bash
quizcn_release_sha=$(git rev-parse HEAD)
bun scripts/verify-registry.ts --source "EdwardAstill/quizcn/quiz#$quizcn_release_sha"
```

Expected: the fresh registry fixture installs the public commit, matches all eleven canonical files byte-for-byte, typechecks, builds, and passes the shared behavior contract.

- [ ] **Step 5: Create and push the immutable tag**

```bash
git tag -a v0.1.0 -m "quizcn v0.1.0"
git push origin refs/tags/v0.1.0
```

Expected: one new annotated tag is pushed. Never recreate or move it.

- [ ] **Step 6: Verify the tag-pinned consumer**

```bash
bun run fixture:registry:public
git ls-remote origin refs/tags/v0.1.0 'refs/tags/v0.1.0^{}'
git rev-parse HEAD
```

Expected: the public tag fixture passes, and the peeled annotated-tag SHA equals the release commit SHA.

- [ ] **Step 7: Fast-forward the clean local main checkout**

In `/home/eastill/projects/quizcn`, run:

```bash
git status --short
git merge --ff-only codex/standalone-completion
git status --short --branch
```

Expected: the root checkout remains clean and local `main` now points to the released commit.

---

### Task 3: Install the tagged registry source into ReadRun and remove duplicate ownership

**Repository:** readrun

**Files:**

- Create: `components.json`
- Modify: `tsconfig.json`
- Modify: `package.json`
- Modify: `bun.lock`
- Create from registry: `src/presentation/components/quiz/Questionnaire.tsx`
- Create from registry: `src/presentation/components/quiz/Quiz.tsx`
- Create from registry: `src/presentation/components/quiz/QuizResults.tsx`
- Create from registry: `src/presentation/components/quiz/QuizStep.tsx`
- Create from registry: `src/presentation/components/quiz/cn.ts`
- Create from registry: `src/presentation/components/quiz/grading.ts`
- Create from registry: `src/presentation/components/quiz/model.ts`
- Create from registry: `src/presentation/components/quiz/primitives.tsx`
- Create from registry: `src/presentation/components/quiz/session.ts`
- Create from registry: `src/presentation/components/quiz/styles.css`
- Create from registry: `src/presentation/components/quiz/validation.ts`
- Create: `src/presentation/components/quiz/ORIGIN.md`
- Create: `src/presentation/quiz/registry-source.test.ts`
- Modify: `src/presentation/quiz/mount.tsx`
- Modify: `src/presentation/quiz/adapter.tsx`
- Modify: `src/presentation/quiz/adapter.test.tsx`
- Modify: `src/presentation/quiz/model.ts`
- Modify: `src/presentation/quiz/render.ts`
- Modify: `src/presentation/quiz/render.test.ts`
- Modify: `src/presentation/quiz/runtime.ts`
- Modify: `src/presentation/quiz/runtime.test.ts`
- Modify: `src/domain/quiz/model.ts`
- Modify: `src/presentation/components/ui/index.ts`
- Delete: `src/domain/quiz/grading.ts`
- Delete: `src/domain/quiz/grading.test.ts`
- Delete: `src/presentation/quiz/session.ts`
- Delete: `src/presentation/quiz/session.test.ts`
- Delete: `src/presentation/quiz/QuizIsland.tsx`
- Delete: `src/presentation/quiz/QuizIsland.test.tsx`
- Delete: `src/presentation/quiz/QuizStep.tsx`
- Delete: `src/presentation/quiz/QuizResults.tsx`
- Delete: `src/presentation/components/ui/Questionnaire.tsx`
- Delete: `src/presentation/components/ui/Questionnaire.test.tsx`

**Interfaces:**

- Consumes: `EdwardAstill/quizcn/quiz#v0.1.0`; local `Quiz`, `QuizDefinition`, `QuizItem`, and `QuizChoice` from the installed source; existing `toQuizDefinition(payload)` and `mountQuizIslands(root?)` boundaries.
- Produces: a network-independent ReadRun checkout whose quiz island imports only committed local registry files and whose legacy quiz behavior modules no longer exist.

- [ ] **Step 1: Write the registry provenance test**

Create `src/presentation/quiz/registry-source.test.ts`:

```ts
import { expect, test } from "bun:test";
import path from "node:path";

const root = path.resolve(import.meta.dir, "../../..");
const installed = path.join(root, "src/presentation/components/quiz");
const expectedFiles = [
  "Questionnaire.tsx",
  "Quiz.tsx",
  "QuizResults.tsx",
  "QuizStep.tsx",
  "cn.ts",
  "grading.ts",
  "model.ts",
  "primitives.tsx",
  "session.ts",
  "styles.css",
  "validation.ts",
];

test("ReadRun commits the tag-pinned quizcn registry source", async () => {
  const packageJson = await Bun.file(path.join(root, "package.json")).json();
  const mount = await Bun.file(path.join(root, "src/presentation/quiz/mount.tsx")).text();
  const adapter = await Bun.file(path.join(root, "src/presentation/quiz/adapter.tsx")).text();
  const origin = await Bun.file(path.join(installed, "ORIGIN.md")).text();

  expect(packageJson.dependencies?.["@quizcn/react"]).toBeUndefined();
  expect(mount).toContain("../components/quiz/Quiz.tsx");
  expect(mount).toContain("../components/quiz/styles.css");
  expect(adapter).toContain("../components/quiz/model.ts");
  expect(origin).toContain("EdwardAstill/quizcn/quiz#v0.1.0");
  for (const filename of expectedFiles) {
    expect(await Bun.file(path.join(installed, filename)).exists()).toBe(true);
  }
});
```

- [ ] **Step 2: Run the provenance test and confirm the expected RED state**

```bash
bun test src/presentation/quiz/registry-source.test.ts
```

Expected: FAIL because no committed registry source or origin note exists and the temporary `@quizcn/react` tarball dependency/imports remain.

- [ ] **Step 3: Configure ReadRun as a shadcn consumer**

Add this path mapping to the existing `tsconfig.json` `paths` object without changing the `@readrun/widgets` mappings:

```json
"@/*": ["src/*"]
```

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/presentation/components/quiz/styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/presentation/components",
    "utils": "@/presentation/components/ui/cn",
    "ui": "@/presentation/components/ui",
    "lib": "@/shared",
    "hooks": "@/presentation/client"
  }
}
```

- [ ] **Step 4: Remove the temporary tarball reference and install the public registry item**

Remove only the `@quizcn/react` entry from `package.json`, then run `bun install` so its tarball resolution and integrity entry disappear from `bun.lock`.

Install the released source:

```bash
bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0 --yes
```

Expected: exactly eleven upstream files are written beneath `src/presentation/components/quiz/`; the existing compatible React, `@shadcn/react`, `clsx`, and `tailwind-merge` dependencies remain in `package.json`/`bun.lock`; no `@quizcn/react` entry remains.

Prove that the installed payload is the released canonical source, excluding the consumer-owned provenance note:

```bash
quizcn_release_root=/home/eastill/projects/quizcn
for quizcn_file in Questionnaire.tsx Quiz.tsx QuizResults.tsx QuizStep.tsx cn.ts grading.ts model.ts primitives.tsx session.ts styles.css validation.ts; do
  cmp "$quizcn_release_root/src/$quizcn_file" "src/presentation/components/quiz/$quizcn_file"
done
```

Expected: every comparison exits successfully with no output.

- [ ] **Step 5: Record immutable source provenance**

Create `src/presentation/components/quiz/ORIGIN.md`:

````markdown
# Quizcn source

These component files were installed from the immutable GitHub shadcn item:

`EdwardAstill/quizcn/quiz#v0.1.0`

To review an update before applying it:

```bash
bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0 --dry-run
```

Generic quiz behavior changes belong in `EdwardAstill/quizcn` first. Release a
new immutable tag, update the address above, reinstall with `--overwrite`, and
review the copied source diff before committing it to ReadRun.
````

- [ ] **Step 6: Switch the adapter and mount to local source imports**

In `adapter.tsx`, replace the package type import with:

```ts
import type {
  QuizChoice,
  QuizDefinition,
  QuizItem,
} from "../components/quiz/model.ts";
```

In `mount.tsx`, replace both package imports with:

```ts
import { Quiz } from "../components/quiz/Quiz.tsx";
import "../components/quiz/styles.css";
```

Do not alter host discovery, payload parsing/error fallback, identifier prefixes, mounted flags, rendering, or disposal.

- [ ] **Step 7: Run the new source and existing integration contracts GREEN**

```bash
bun test src/presentation/quiz/registry-source.test.ts src/presentation/quiz/adapter.test.tsx src/presentation/quiz/mount.test.tsx
bun run typecheck
```

Expected: four tests pass from committed local source before any legacy module is deleted.

- [ ] **Step 8: Write the legacy-ownership RED assertion**

Add this test to `registry-source.test.ts`:

```ts
test("ReadRun owns transport and mounting, not a second quiz implementation", async () => {
  const removed = [
    "src/domain/quiz/grading.ts",
    "src/domain/quiz/grading.test.ts",
    "src/presentation/quiz/session.ts",
    "src/presentation/quiz/session.test.ts",
    "src/presentation/quiz/QuizIsland.tsx",
    "src/presentation/quiz/QuizIsland.test.tsx",
    "src/presentation/quiz/QuizStep.tsx",
    "src/presentation/quiz/QuizResults.tsx",
    "src/presentation/components/ui/Questionnaire.tsx",
    "src/presentation/components/ui/Questionnaire.test.tsx",
  ];
  for (const relativePath of removed) {
    expect(await Bun.file(path.join(root, relativePath)).exists()).toBe(false);
  }

  const domainModel = await Bun.file(path.join(root, "src/domain/quiz/model.ts")).text();
  const uiIndex = await Bun.file(
    path.join(root, "src/presentation/components/ui/index.ts"),
  ).text();
  expect(domainModel).not.toContain("SubmittedAnswer");
  expect(domainModel).not.toContain("GradeResult");
  expect(uiIndex).not.toContain("Questionnaire");
});
```

Run:

```bash
bun test src/presentation/quiz/registry-source.test.ts
```

Expected: FAIL because all ten legacy files and their model/index exports still exist.

- [ ] **Step 9: Delete only superseded behavior and exports**

Delete the ten files named in the RED assertion. Remove `SubmittedAnswer` and `GradeResult` from `src/domain/quiz/model.ts`. Remove only this export from `src/presentation/components/ui/index.ts`:

```ts
export * from "./Questionnaire.tsx";
```

Keep parser, legacy parser, author validation, rendered transport, runtime parser, `QuizBlock`, `ReadRunRichText`, adapter, mount, and all of their tests.

- [ ] **Step 10: Remove the redundant true/false transport field test-first**

Add a true/false case to `render.test.ts` and assert that correctness remains represented by choice flags while `correctAnswer` does not cross the browser transport:

```ts
const rendered = renderQuizDefinition(
  {
    schemaVersion: 1,
    id: "truth",
    source,
    items: [
      {
        type: "truefalse",
        id: "truth-1",
        prompt: rich("True or false?"),
        choices: [
          { id: "true", content: rich("True"), correct: true },
          { id: "false", content: rich("False"), correct: false },
        ],
        correctAnswer: true,
        source,
      },
    ],
  },
  {
    instanceId: "truth-1",
    richText: { block: (value) => value, inline: (value) => value },
  },
);
const item = rendered.items[0];
if (item?.type !== "truefalse") throw new Error("Expected true/false");
expect(item.choices.map((choice) => choice.correct)).toEqual([true, false]);
expect("correctAnswer" in item).toBe(false);
```

Add a compatibility case to `runtime.test.ts` showing that an old schema-1 payload containing an extra `correctAnswer` field is accepted but normalized without it:

```ts
const legacyTrueFalsePayload = {
  schemaVersion: 1,
  instanceId: "legacy-truth-1",
  id: "legacy-truth",
  title: "Legacy truth",
  items: [
    {
      type: "truefalse",
      id: "truth-1",
      prompt: { html: "True or false?", text: "True or false?" },
      choices: [
        { id: "true", content: { html: "True", text: "True" }, correct: true },
        { id: "false", content: { html: "False", text: "False" }, correct: false },
      ],
      correctAnswer: true,
    },
  ],
};
const parsed = parseQuizPayload(JSON.stringify(legacyTrueFalsePayload));
const item = parsed.items[0];
if (item?.type !== "truefalse") throw new Error("Expected true/false");
expect("correctAnswer" in item).toBe(false);
```

Run the focused tests. Expected: FAIL until the rendered/runtime transport type and constructors stop returning `correctAnswer`.

- [ ] **Step 11: Simplify the schema-1 transport without changing the author model**

Remove `correctAnswer` only from `RenderedTrueFalse` in `src/presentation/quiz/model.ts`, the true/false result in `render.ts`, and the true/false requirement/result in `runtime.ts`. Keep `TrueFalseDefinition.correctAnswer` in `src/domain/quiz/model.ts` for parser diagnostics. Keep `schemaVersion: 1`; removing the emitted field is backward compatible because the parser already ignores unknown object properties.

Remove `correctAnswer` from the adapter test's transport fixture. Retain this existing adapter assertion:

```ts
expect("correctAnswer" in truth).toBe(false);
```

- [ ] **Step 12: Run focused ownership and behavior checks**

```bash
bun test src/presentation/quiz/registry-source.test.ts src/presentation/quiz/render.test.ts src/presentation/quiz/runtime.test.ts src/presentation/quiz/adapter.test.tsx src/presentation/quiz/mount.test.tsx
rg -n "gradeAnswer|scoreQuiz|createQuizSession|reduceQuizSession|QuizIsland|Questionnaire" src --glob '!presentation/components/quiz/**' --glob '!presentation/quiz/registry-source.test.ts'
rg -n "@quizcn/react|quizcn-react-0.0.0.tgz|standalone-completion" package.json bun.lock src components.json --glob '!presentation/quiz/registry-source.test.ts'
```

Expected: focused tests pass and both searches return no matches.

- [ ] **Step 13: Run the full ReadRun verification**

```bash
bun install --frozen-lockfile
bun run typecheck
bun test ./src --parallel
bun run validate:docs
bun run build:docs
bun run check
git diff --check
git status --short
```

Expected: all checks pass; generated `dist/` remains ignored; status contains only intentional Task 3 changes.

- [ ] **Step 14: Commit the vendored registry integration**

```bash
git add components.json package.json bun.lock tsconfig.json src
git commit -m "refactor: vendor quizcn registry source"
```

Expected: no local tarball path is committed and the ReadRun worktree is clean.

---

### Task 4: Complete clean-room verification, review, and handoff

**Repositories:** quizcn and readrun

**Files:**

- Modify: `docs/superpowers/2026-08-26-quizcn-standalone-handoff.md`
- Modify: `/home/eastill/projects/quizcn-standalone-handoff.md`
- Modify only if final verified behavior changed: `docs/authoring/quiz-format.md`

**Interfaces:**

- Consumes: public quizcn `v0.1.0`, the committed ReadRun source snapshot, and both repositories' complete test/build commands.
- Produces: fresh-install evidence, clean whole-branch reviews, accurate tracked/external handoffs, and clean worktrees ready for branch integration.

- [ ] **Step 1: Verify quizcn from a fresh public tag clone**

Create a narrowly scoped temporary directory:

```bash
quizcn_verify_root=$(mktemp -d)
git clone --depth 1 --branch v0.1.0 https://github.com/EdwardAstill/quizcn.git "$quizcn_verify_root/quizcn"
cd "$quizcn_verify_root/quizcn"
bun install --frozen-lockfile
bun run check
git status --short
```

Expected: the tag clone installs cleanly, passes source/example/local-registry checks, and stays clean. Remove only `$quizcn_verify_root` after recording the result.

- [ ] **Step 2: Verify ReadRun from a clean archive of its committed HEAD**

From the ReadRun feature worktree:

```bash
readrun_verify_root=$(mktemp -d)
mkdir "$readrun_verify_root/readrun"
git archive HEAD | tar -x -C "$readrun_verify_root/readrun"
cd "$readrun_verify_root/readrun"
bun install --frozen-lockfile
bun run check
bun run build:docs
```

Expected: the archive installs and passes without the quizcn repository, a registry fetch, a tarball, or any sibling path. Remove only `$readrun_verify_root` after recording the result.

- [ ] **Step 3: Prove the development and static quiz pages**

In the ReadRun feature worktree, start:

```bash
bun src/cli.ts serve docs --no-open --port 43179
```

In a separate command session, fetch `http://localhost:43179/authoring/quiz-format/` and its referenced client JavaScript/CSS. Assert HTTP 200, two quiz island hosts, two JSON payloads, both documented quiz titles, quiz component code in the client bundle, and `.cn-questionnaire` styles in CSS. Stop the server cleanly.

Inspect the static output from `bun run build:docs` for the same two hosts/payloads and component styles under `dist/authoring/quiz-format/`. Do not edit `dist/`.

- [ ] **Step 4: Run cross-repository ownership searches**

Quizcn:

```bash
rg -ni "readrun|RenderedRichText|dangerouslySetInnerHTML|renderPageMath" src test
rg -n "@quizcn/react|package-consumer|fixture:package|bun pm pack" package.json README.md registry.json scripts fixtures src
```

ReadRun:

```bash
rg -n "@quizcn/react|quizcn-react-0.0.0.tgz|standalone-completion" package.json bun.lock src components.json --glob '!presentation/quiz/registry-source.test.ts'
rg -n "gradeAnswer|scoreQuiz|createQuizSession|reduceQuizSession|QuizIsland" src --glob '!presentation/components/quiz/**' --glob '!presentation/quiz/registry-source.test.ts'
```

Expected: all four searches return no matches.

- [ ] **Step 5: Request whole-branch reviews before claiming completion**

Review quizcn from public baseline `18cc14a` through the release commit. Review ReadRun from `746005d` through current `HEAD`, including the registry-only design/plan, Task 7 adapter, installed source boundary, legacy deletions, tests, and ownership searches.

Reviewers must verify:

- the GitHub registry item references canonical source and declares complete dependencies;
- no npm publication path remains;
- public tag/source and local main identify the same release commit;
- ReadRun imports committed local source and has no hidden local/network dependency;
- trusted HTML/math stays entirely in ReadRun;
- quiz behavior/accessibility remains in quizcn;
- generated output and unrelated code are absent from both diffs;
- tests exercise package removal, public registry installation, instance isolation, focus, payload errors, rich text/math, all item types, grading, restart, and accessibility.

If a review reports a real issue, add a focused failing test, apply one scoped fix wave in the owning repository, rerun that repository's full checks, and request a focused re-review before proceeding.

- [ ] **Step 6: Update both handoffs with final evidence**

Update `docs/superpowers/2026-08-26-quizcn-standalone-handoff.md` and `/home/eastill/projects/quizcn-standalone-handoff.md` so both state:

- npm publication was deliberately removed;
- the supported install command is `bunx shadcn@latest add EdwardAstill/quizcn/quiz#v0.1.0`;
- the exact quizcn release SHA and ReadRun final SHA;
- the public tag/main verification results;
- focused and full test/build counts;
- fresh clone/archive results;
- development/static page proof;
- final review verdicts and any deferred minor findings;
- ReadRun branch integration status.

Replace stale statements that Tasks 8–10 are blocked or that an npm login/package identity is required. Do not claim ReadRun is merged or pushed unless that action has actually occurred.

- [ ] **Step 7: Commit the tracked completion handoff**

```bash
git add docs/superpowers/2026-08-26-quizcn-standalone-handoff.md
git commit -m "docs: complete quizcn standalone handoff"
```

The external `/home/eastill/projects/quizcn-standalone-handoff.md` remains outside this Git repository but must contain the same final facts.

- [ ] **Step 8: Run final evidence commands immediately before completion**

Quizcn:

```bash
bun install --frozen-lockfile
bun run check
git diff --check
git status --short --branch
git ls-remote origin refs/heads/main refs/tags/v0.1.0 'refs/tags/v0.1.0^{}'
```

ReadRun:

```bash
bun install --frozen-lockfile
bun run check
bun run build:docs
git diff --check
git status --short --branch
```

Expected: all commands pass, quizcn `main` and peeled `v0.1.0` point to the release commit, and both worktrees are clean.

- [ ] **Step 9: Preserve final rulings and finish the branch**

Before deleting any ignored SDD workspace, collect every ledger line containing `Ruling:` into the final report. Then invoke `superpowers:finishing-a-development-branch` and present the supported ReadRun integration options without assuming merge/push authority.
