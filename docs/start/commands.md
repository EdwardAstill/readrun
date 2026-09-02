# Commands reference

```text
rr serve|docs|docs-wiki|web|init|validate|build|deploy|auth rotate|widgets-build|new|today|clean|doctor
```

## Server options

These options apply to `rr serve`, `rr docs`, and `rr docs-wiki`.

```
--port=<n>     Port (default: 3001)
--host=<name>  Hostname (default: 127.0.0.1)
--no-open      Run only the HTTP server; do not open a window
```

---

## `rr`

With no arguments, serves the current working directory.

```bash
cd my-notes/
rr
```

Equivalent to `rr serve .`

By default, normal serve-family commands open exactly one native readrun window
and keep the local server alive until that window closes. Closing the window
stops the server. Use `--no-open` when you want a server without a window.

---

## `rr <folder|file.md>`

If the argument is a folder or `.md` file, acts like `rr serve <path>`.

```bash
rr my-notes/
rr my-notes/guide.md
```

---

## `rr serve [path]`

Serve a folder or `.md` file with runnable blocks.
The dev server watches the source folder and reloads the open readrun window on
changes.

`rr serve` always serves source content without password gating. Password
protection is generated only for Vercel builds that include `.readrun/pw.txt`.

```bash
rr serve                 # serve cwd
rr serve my-notes/       # serve a folder
rr serve guide.md        # serve a single file
```

---

## `rr docs`

Serve the built-in readrun docs project (the `docs/` folder).

```bash
rr docs
```

This opens the documentation in the same single native window used by `rr .`.

---

## `rr web <folder|file.md|docs>`

Serve content in the default external browser instead of the native window.
The exact `docs` token selects readrun's built-in documentation; use `./docs`
to select a folder named `docs` relative to the current directory.

```bash
rr web .
rr web docs
rr web ./notes
```

Browser mode keeps serving until you press Ctrl-C. It does not stop when an
external browser tab closes.

---

## `rr docs-wiki`

Serve the built-in `docs/` content with wiki navigation.

```bash
rr docs-wiki
```

---

## `rr init [folder]`

Scaffold the base `.readrun/` structure in a folder. Idempotent — safe to re-run.

```bash
rr init my-notes/
```

Creates:
```
my-notes/.readrun/
  assets/
  widgets/
  ignore               # plain-text glob patterns
```

Then choose one navigation mode:

```text
.readrun/navigation.yaml   # authored tree mode
.readrun/entry.txt         # wiki mode
```

---

## `rr validate [folder]`

Check content and `.readrun/` for issues.
Source widgets are bundled first so their generated JSX references can be
validated.

```bash
rr validate my-notes/
rr validate my-notes/ --strict   # treat warnings as failures
```

Checks for:
- Unclosed block syntax
- Legacy `:::` block syntax
- Missing file references in `[python=...]`, `[jsx=...]`, viewer blocks
- Unknown block names
- Malformed frontmatter YAML
- Navigation/entry mode conflicts
- Viewer block extension mismatches
- Missing required attributes (e.g. `muted` with `autoplay` on video)
- Invalid `.readrun/pw.txt` files (empty or placeholder values)
- Weak password warnings for `.readrun/pw.txt`

---

## `rr build <folder> [--platform=<target>] [--out=<folder>] [--project-root=<folder>]`

Build a static site from a content folder. The content folder is required.

```bash
rr build my-notes/
rr build docs/ --platform=github
rr build my-notes/ --out=site
rr build my-notes/ --output=site    # alias for --out
rr build docs/ --project-root=..    # use a parent repo for platform metadata
```

`--platform` may be `github`, `vercel`, or `netlify`; omit it for plain static
output. The default output folder is `./dist`.

The output folder is replaced on each build so removed pages cannot survive as
stale files. readrun refuses an output path that contains the source folder or
the current working directory.

If `.readrun/pw.txt` exists and `--platform=vercel` is used, `rr build` also
writes `.vercel/output/` for password-protected prebuilt Vercel deploys.

`--project-root=<folder>` sets the repository root used for repository-level
configuration and platform metadata. It does not change the default output
folder. Deploy-generated `site/package.json` scripts run from `site/` with
`--project-root=..`, so GitHub base-path detection, password lookup, and Vercel
auth output continue to use the repository root.

---

## `rr deploy <github|vercel|netlify> [folder]`

Build the static site from a folder in a repository-root `site/` deployment
workspace and write host configuration at the git repository root. Must be
run from inside a git repo. The folder defaults to the current directory.

`rr deploy` generates `site/package.json` and `site/.gitignore`, installs its
dependencies locally, and writes the static site to `site/dist/`. The install
creates `site/bun.lock` and `site/node_modules/`; the latter and `site/dist/`
are ignored by `site/.gitignore`. Generated host configuration installs from
this lockfile with `--frozen-lockfile`. This layout is specific to `rr deploy`;
`rr build` still defaults to `./dist`.

**`rr deploy` only prepares local build output and config — it does not
publish your site.** You must push the generated files to your host
separately (see platform notes below).

```bash
rr deploy github docs/    # builds docs/ → site/dist/, writes .github/workflows/deploy.yml
rr deploy vercel .        # builds . → site/dist/, writes vercel.json
rr deploy netlify notes/  # builds notes/ → site/dist/, writes netlify.toml
rr deploy github --force   # overwrite existing config files
```

The content folder must be inside the git repository. Before changing files,
`rr deploy` checks for conflicting host config and deployment output; use
`--force` only when you intend to replace that generated deployment scaffold.

For GitHub Pages, commit the generated workflow, push to `main`, and configure
Pages to use **GitHub Actions** as the source if the repository is not already
set that way.

For Vercel, `rr deploy` writes the repository-root `vercel.json` configured
to build from `site/`. To push live after building:

- **Manual CLI:** run `vercel deploy --prebuilt --prod` from the repo root
  (uploads the generated `.vercel/output/` directory, including auth middleware)
- **Git integration:** commit and push the repo; Vercel rebuilds from the commit

For Vercel password protection, add a tracked `.readrun/pw.txt` in the
repository root or content root before deploying:

```bash
mkdir -p .readrun
printf 'shared-password\n' > .readrun/pw.txt
rr deploy vercel my-notes/
vercel deploy --prebuilt --prod
```

When `.readrun/pw.txt` exists, `rr deploy` emits `.vercel/output/` with a
password-only login page backed by Vercel middleware. The site sets an auth
cookie after login and also accepts HTTP Basic Auth with username `reader` for
scripts or password-manager workflows. `pw.txt` may contain multiple passwords,
one per line. Empty files and the placeholder `PUT-PASSWORD-HERE` fail the
build so a site is not deployed accidentally without auth.

---

## `rr auth rotate [path] [--length=<n>]`

Generate a new random `.readrun/pw.txt` and print the password once.

```bash
rr auth rotate
rr auth rotate my-notes/ --length=32
```

---

## `rr widgets-build [path]`

Bundle every `.tsx` widget in `<path>/.readrun/widgets/` to
`.readrun/.widgets-out/<name>.jsx`.

`rr serve`, `rr docs`, `rr validate`, `rr build`, and `rr deploy` run this
automatically before loading the project; use this command when you want to
compile widgets directly.

```bash
rr widgets-build my-notes/
```

---

## `rr new <path>`

Scaffold a new Markdown page with a starter template.

```bash
rr new my-notes/guides/getting-started.md
rr new my-notes/guides/topic --title="Topic" --force
```

---

## `rr today [path] [--folder=<subfolder>]`

Open or create today's daily note. Creates `journal/YYYY-MM-DD.md` if missing.

```bash
rr today                                 # creates journal/YYYY-MM-DD.md
rr today my-notes/ --folder=diary        # creates my-notes/diary/YYYY-MM-DD.md
```

---

## `rr clean [path] [--out=<folder>] [--dry-run]`

Remove the built output folder and generated widget output
(`.readrun/.widgets-out`). The output folder defaults to `./dist`; override it
with `--out=<folder>`. `--dry-run` lists what would be removed without deleting.

```bash
rr clean my-notes/
rr clean my-notes/ --out=site --dry-run
```

---

## `rr doctor`

Check environment: Bun runtime, built-in docs path, and user config path.

```bash
rr doctor
```
