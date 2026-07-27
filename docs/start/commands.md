# Commands reference

```text
rr serve|docs|docs-wiki|init|validate|build|deploy|auth rotate|widgets-build|new|today|clean|doctor
```

## Server options

These options apply to `rr serve`, `rr docs`, and `rr docs-wiki`.

```
--port=<n>     Port (default: 3001)
--host=<name>  Hostname (default: localhost)
--no-open      Do not auto-open a browser
```

---

## `rr`

With no arguments, serves the current working directory.

```bash
cd my-notes/
rr
```

Equivalent to `rr serve .`

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
The dev server watches the source folder and reloads the browser on changes.

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

## `rr build <folder> [--platform=<target>] [--out=<folder>]`

Build a static site from a content folder. The content folder is required.

```bash
rr build my-notes/
rr build docs/ --platform=github
rr build my-notes/ --out=site
rr build my-notes/ --output=site    # alias for --out
```

`--platform` may be `github`, `vercel`, or `netlify`; omit it for plain static
output. The default output folder is `./dist`.

The output folder is replaced on each build so removed pages cannot survive as
stale files. readrun refuses an output path that contains the source folder or
the current working directory.

If `.readrun/pw.txt` exists and `--platform=vercel` is used, `rr build` also
writes `.vercel/output/` for password-protected prebuilt Vercel deploys.

---

## `rr deploy <github|vercel|netlify> [folder]`

Build the static site from a folder and write deployment config at the
git repository root. Must be run from inside a git repo. The folder defaults
to the current directory.

**`rr deploy` only prepares local build output and config — it does not
publish your site.** You must push the generated files to your host
separately (see platform notes below).

```bash
rr deploy github docs/    # builds docs/ → dist/, writes .github/workflows/deploy.yml
rr deploy vercel .          # builds . → dist/, writes vercel.json
rr deploy netlify notes/   # builds notes/ → dist/, writes netlify.toml
rr deploy github --force   # overwrite existing config files
```

For GitHub Pages, commit the generated workflow, push to `main`, and configure
Pages to use **GitHub Actions** as the source if the repository is not already
set that way.

For Vercel, `rr deploy` writes `vercel.json` configured with the correct build
command. To push live after building:

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
