# Project layout

This page explains the main folders in the readrun source repo.

```text
readrun/
  docs/                  built-in docs content
  src/
    cli.ts               command entrypoint
    application/         command contracts, ports, use cases
    domain/              project, navigation, page, route, and validation logic
    infrastructure/      runtime, filesystem, deploy, and execution adapters
    presentation/        shell rendering, client, styles, viewers
    shared/              cross-layer config and path helpers
    widgets/             in-repo @readrun/widgets toolkit
```

## `docs/`

The `docs/` folder is the built-in project served by `rr docs`. It is also
normal readrun content, so it demonstrates the same authoring features users
can apply in their own folders.

The docs project uses `.readrun/navigation.yaml` to curate the sidebar and
keeps `.readrun/ignore` as a working example of project-level exclusions.

## `src/application/commands/`

Command modules implement the user-facing CLI behavior:

- Serving and watching content
- Static builds
- Deployment config generation
- Validation
- Widget bundling
- Project initialization and cleanup helpers

`src/cli.ts` wires those commands into the command-line interface.

Commands stay as the CLI composition root. Rendering itself consumes one
immutable project snapshot, so serve, validate, and static build paths share
the same discovered pages, navigation, routes, and assets.

## `src/domain/`

Domain modules decide what exists in a project:

- Markdown page discovery
- Frontmatter parsing
- Bracket block parsing
- Known block and viewer metadata
- Navigation config handling
- Validation rules
- Navigation tree construction

This layer should not depend on browser APIs.

## `src/presentation/`

Presentation modules turn parsed content into HTML and client-side behavior.
They render markdown, shell UI, viewers, client hydration, and generated CSS.

## `src/infrastructure/`

Infrastructure modules connect application/domain work to delivery:

- The local dev server
- Watch/reload behavior
- Pruned filesystem discovery (ignored, generated, hidden, and dependency
  directories are skipped before their children are read)
- Static site artifact writing and shared build orchestration
- Shared client bundle assets
- Search index output

This layer is where serve mode and build mode share output behavior. `rr build`
writes its default output to `dist/`; `rr deploy` creates a `site/` deployment
workspace containing its generated package manifest, lockfile, locally
installed dependencies, and static output at `site/dist/`. Its `.gitignore`
excludes `node_modules/` and `dist/`; generated hosts install with the frozen
lockfile. Repository host configuration such as
`.github/workflows/deploy.yml`, `vercel.json`, and `netlify.toml` stays at the
repository root. Password-protected Vercel builds additionally write
`.vercel/output/` at the root.

## `src/widgets/`

`src/widgets/` is the implementation of the in-repo `@readrun/widgets`
toolkit. It is not an external package.

User-authored widget sources live in a content folder at:

```text
<content>/.readrun/widgets/*.tsx
```

Bundled widget outputs are generated into:

```text
<content>/.readrun/.widgets-out/*.jsx
```

Those generated `.jsx` files are then mounted by the normal readrun JSX
runtime.
