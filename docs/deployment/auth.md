# Deployment Auth

ReadRun supports a simple shared-password gate for Vercel builds.

## How it works

If `rr deploy` finds a tracked password file named `.readrun/pw.txt`, and the
target is Vercel, it emits a Vercel Build Output API deployment with auth
middleware and a password-only login page.

**`rr deploy` prepares the build output only — it does not publish to Vercel.**
To push the generated `.vercel/output/` live, run:

```bash
vercel deploy --prebuilt --prod
```

Or if Vercel Git integration is set up, commit and push the repo — Vercel
rebuilds from the commit automatically.

### Quick start

```bash
mkdir -p .readrun
printf 'shared-password\n' > .readrun/pw.txt
rr deploy vercel my-notes/
vercel deploy --prebuilt --prod
```

Password file lookup order:

1. `<repository>/.readrun/pw.txt` where the build command is run
2. `<content-root>/.readrun/pw.txt`

This supports repositories where the content root is a subfolder, for example:

```bash
rr deploy vercel wiki/
```

with the password stored at repository root:

```text
.readrun/pw.txt
wiki/
```

The password file can contain one password per line. Any listed password is
accepted. Empty files and the placeholder `PUT-PASSWORD-HERE` are rejected.
`rr validate` also warns on weak passwords, and `rr auth rotate` generates a
fresh random file for you.

## Generated output

For `rr deploy`, the normal static output folder is written to `site/dist/`;
the generated `site/` package and lockfile are used for both local and frozen
host installs.
When password protection is enabled for Vercel, ReadRun also writes the
prebuilt Vercel output at the repository root:

```text
.vercel/output/
  config.json
  static/                         # copy of the built static site
  functions/_readrun_auth.func/
    .vc-config.json
    index.js                      # login + cookie auth middleware
```

Vercel deploys `.vercel/output/` as a prebuilt deployment (whether deployed
via `vercel deploy --prebuilt` or rebuilt from a Git commit). The middleware
runs before static files are served.

## Login behaviour

The browser shows a small password-only login page instead of the built-in
Basic Auth prompt. After a correct password is entered, the middleware sets an
HTTP-only cookie and serves the site.

For scripts, API clients, or password-manager workflows, the middleware also
accepts HTTP Basic Auth with username `reader` and any password listed in
`.readrun/pw.txt`.

The middleware protects every route, including:

- rendered pages
- `_readrun/search-index.json`
- `_readrun/client.js`
- `_readrun/client.css`
- `_readrun/assets/*`
- generated tag pages
- `robots.txt`

This matters because the search index and assets can reveal private content.

## Build failures

If `.readrun/pw.txt` exists but is empty or still contains the placeholder
`PUT-PASSWORD-HERE`, the build fails. This avoids accidentally deploying a site
that looks configured but has no real password. `rr validate` reports the same
configuration errors earlier and also warns on short/common passwords.

If `.readrun/pw.txt` exists for a non-Vercel deploy, ReadRun prints a warning.
Plain static output, GitHub Pages, and other static-only hosts cannot enforce a
password gate because they do not run middleware.

## Security notes

Basic Auth is a pragmatic shared-password gate, not an identity system.

- Use HTTPS. Vercel production deployments use HTTPS by default.
- Anyone with the password can share it.
- Rotate the password with `rr auth rotate` (or by editing `.readrun/pw.txt`) and redeploy.
- The password is not written into client HTML, JavaScript, CSS, or search
  indexes, but it is included in the server-side Vercel middleware bundle so
  the deployment can check requests.
