# Getting Started

This page walks you through using readrun with your own Markdown notes.

## Install

```bash
bun install -g github:EdwardAstill/readrun
```

When working from a source checkout, link that checkout instead of installing a
second global copy:

```bash
bun install
bun link
```

## Start the dev server

Run `rr` with no arguments to serve the current folder:

```bash
cd your-notes-folder
rr
```

Or pass a path directly:

```bash
rr .                      # serve the current folder
rr ./my-notes             # serve a specific folder
rr intro.md               # open a single file
rr notes/lecture-1.md     # open a single file by path
```

When given a folder, readrun serves the whole directory. When given a `.md` file, it serves that file's folder and opens the browser directly on that page.

Open [http://localhost:3001](http://localhost:3001) and you'll see your notes rendered as a navigable website with a sidebar built from your folder structure.

## Try it without your own notes

If you just want to see what readrun does, serve the built-in docs project:

```bash
rr docs
```

To see the same source content with wiki navigation:

```bash
rr docs-wiki
```

## Deploy

From a git repo, build the static site and write the deploy config in one command:

```bash
rr deploy github docs/   # builds docs/ → dist/, writes .github/workflows/deploy.yml
rr deploy vercel .         # builds . → dist/, writes vercel.json
rr deploy netlify notes/  # builds notes/ → dist/, writes netlify.toml
```

The output goes to `dist/` at the git repo root. Everything runs in the browser — no server needed.

For simple private sharing on Vercel, add a repository-local password file before deploying:

```bash
mkdir -p .readrun
printf 'shared-password\n' > .readrun/pw.txt
rr deploy vercel .
```

When `.readrun/pw.txt` exists, ReadRun also emits `.vercel/output/` with login middleware protecting the site. Readers get a password-only login page, and `pw.txt` can contain multiple passwords (one per line).

## Adding runnable code

There are two ways to add executable code blocks.

### Inline code

Wrap code in bracket blocks and readers can run it inline:

[python]
print("Hello from readrun!")

for i in range(1, 6):
    print("*"* i)
[/python]

### File references

You can also keep code in separate files under `.readrun/assets/scripts/` and reference them by path:

```
[python=scripts/variables.py]
```

The code is loaded from `.readrun/assets/scripts/variables.py`, displayed on the page, and made runnable — exactly like an inline block. This keeps your markdown clean when scripts get longer.

[python=scripts/variables.py]

### JSX blocks

JSX blocks render directly in the page — no iframe, no run button. React and Tailwind are loaded automatically. Use the built-in `render()` helper to mount your component:

```
[jsx]
function App() {
  return <h1 className="text-2xl font-bold">Hello!</h1>;
}
render(<App />);
[/jsx]
```

Reference a `.jsx` file from `.readrun/assets/scripts/` the same way as any other file — it auto-renders on page load:

```
[jsx=scripts/counter.jsx]
```

[jsx=scripts/counter.jsx]

### Images

Place images in `.readrun/assets/images/` and reference them the same way:

```
[image=images/diagram.svg]
```

Here's the "how it works" diagram from the welcome page, embedded via `[image=images/how-it-works.svg]`:

[image=images/how-it-works.svg]

Images are embedded directly in the page. Click any image to enlarge it.

### Preloaded data assets

Files under `.readrun/assets/data/` are copied into Pyodide's filesystem when Python starts. This demo includes `.readrun/assets/data/student.json`:

[python]
import json

with open("data/student.json") as f:
    student = json.load(f)

print(student["name"], "is taking", student["course"])
print("Average score:", round(sum(student["scores"]) / len(student["scores"]), 1))
print(student["notes"])
[/python]

Standard markdown code blocks (triple backticks) are displayed but not runnable — useful for showing bash commands, config snippets, or code you don't want readers to execute.

## Links between pages

Standard Markdown links work as navigation. For example, [Code](../authoring/code.md) links to the authoring page for runnable Python. readrun rewrites `.md` links automatically so they work in the rendered site.

## Next steps

Head to [Code](../authoring/code.md) to learn how Python imports work, or go back to the [welcome page](../welcome.md).
