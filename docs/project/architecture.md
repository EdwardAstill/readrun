# Architecture

readrun has one pipeline for development and static builds. Both paths discover
the same content project, construct the same immutable snapshot, and render the
same React document shell.

```text
Markdown + .readrun/
        │
        ▼
project config and scoped file discovery
        │
        ▼
pages + assets + navigation + validation
        │
        ▼
immutable project snapshot
        │
        ├── Bun development server + file watcher
        └── static artifact writer
                 │
                 ▼
       HTML + CSS + browser runtime
```

## Source layout

| Directory | Responsibility |
| --- | --- |
| `src/domain/` | Pure project, page, navigation, block, route, and validation rules |
| `src/application/` | CLI commands, use cases, ports, and project read models |
| `src/infrastructure/` | Filesystem, Bun server, builds, deployment, auth, and Python adapters |
| `src/presentation/` | React document shell, Markdown rendering, browser behavior, and styles |
| `src/widgets/` | The in-repo `@readrun/widgets` component and utility toolkit |
| `src/shared/` | Small path, config, HTML, and runtime helpers shared across layers |

`src/cli.ts` is the executable entry point. It registers each `rr` command and
maps a bare file or directory argument to `rr serve`.

## Project model

A content folder is resolved into one of two modes:

- Tree mode uses filesystem order or `.readrun/navigation.yaml`.
- Wiki mode uses `.readrun/entry.txt`, tags, backlinks, and a flat page index.

Discovery applies `.readrun/ignore`, excludes generated and hidden content,
parses frontmatter, resolves executable source references, indexes wikilinks,
and records assets. The result is a `ContentProjectSnapshot` containing all
pages, routes, navigation, assets, and validation state needed to render.

## Development runtime

`rr serve` starts one `Bun.serve()` instance. The server renders routes from the
current snapshot and watches the content root. A relevant file change builds a
new snapshot, swaps the route lookup atomically, and publishes a live-reload
event to the browser. The listening server does not restart.

The browser runtime owns behavior that cannot be expressed in server-rendered
HTML: client-side navigation, search dialogs, settings, executable blocks,
uploads, viewers, and live updates. Features register through a lifecycle that
disposes page-specific listeners before mounting a newly navigated page.

## Static builds

`rr build` runs the same widget build and discovery pipeline, renders every
route, bundles the browser client, copies scoped assets, and writes a static
site. Platform flags only add host-specific artifacts. `rr deploy` additionally
writes repository-level host configuration; it does not publish the site.

Python runs client-side through Pyodide, so ordinary static hosts do not need a
Python server. Vercel password protection is the exception: it adds generated
middleware around the static output.

## Widget pipeline

Project widgets live in `<content>/.readrun/widgets/*.tsx`. Before serve or
build, the widget bundler resolves imports from the in-repo
`@readrun/widgets/*` toolkit and writes generated JSX to
`.readrun/.widgets-out/`. Generated output is ignored by Git and can be removed
with `rr clean`.

## Boundaries

- Domain modules do not read files or depend on browser APIs.
- Application code coordinates work through small ports.
- Infrastructure owns I/O and host-specific behavior.
- Presentation consumes project models but does not own project discovery.
- `docs/` is real readrun content and serves as both documentation and an
  end-to-end example project.

These boundaries are enforced by TypeScript checks, unit and integration tests,
strict validation of `docs/`, and a complete docs build in CI.
