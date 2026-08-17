# Block syntax reference

readrun extends Markdown with `[name]...[/name]` blocks for executable code,
file references, quizzes, and other interactive elements. Blocks are parsed
at build time and rendered as HTML.

## Open/close blocks

Containers with an opener `[name]` and closer `[/name]`. Content between them
is rendered according to the block type. Block names are explicit in the closer
so nesting is unambiguous.

```
[python]
print("hello")
[/python]
```

## Self-closing blocks

Short form `[name=path]` or `[name key=value]` that does not need a closer.

```
[upload label="Upload CSV" accept=.csv]
[include=partials/intro.md]
[stl=files/bracket.stl]
```

## Universal attributes

Any block can add these:

| Attribute | Effect |
|-----------|--------|
| `hidden` | Start collapsed. Reader clicks Show to reveal. |
| `editable` | Make the code block a live scratchpad (Python/JSX only). |

## Block reference

### Python (`[python]`)

Renders a runnable code block. Click Run to execute in the browser via
Pyodide. Output appears below the block. Python state persists across blocks
on the same page (like Jupyter cells).

For Python basics, imports, and package behavior, see [Code](./code.md).

```md
[python]
import pandas as pd
df = pd.read_csv("data.csv")
print(df.head())
[/python]
```

External file reference (canonical file lives in `.readrun/assets/scripts/`; legacy `.readrun/scripts/` is also supported):

```md
[python=scripts/plot.py]
```

### JSX / React (`[jsx]`)

Renders a React component. Auto-renders on page load — no Run button.
Call `render()` with your root element. Full Tailwind and `@readrun/widgets`
available.

```md
[jsx]
function Counter() {
  const [n, setN] = React.useState(0);
  return <button onClick={() => setN(n+1)}>Clicked {n}</button>;
}
render(<Counter />);
[/jsx]
```

External file reference:

```md
[jsx=scripts/chart.jsx]
```

### Quiz (`[quiz]`)

Embeds an interactive quiz directly in the note. Use `[info]` reading steps and
explicitly typed `[question]` blocks. See [Quizzes in notes](./quiz-format.md)
for the complete format, feedback behavior, math support, and migration guide.

```md
[quiz]
[question type=single]
What is the capital of France?

- [ ] London
- [x] Paris
- [ ] Berlin

[hint]
Think of the Eiffel Tower.
[/hint]

[explain]
Paris is the capital of France.
[/explain]
[/question]
[/quiz]
```

Question types:

| Type | Correct answer syntax | Matching |
|------|----------------------|----------|
| `single` | `- [x] Answer` | Exactly one checked choice |
| `multi` | `- [x] Answer` | Exact set of checked choices |
| `truefalse` | Checked `True` or `False` task-list choice | Boolean |
| `freetext` | `= answer` | Normalized exact text |

Sub-blocks:

- `[hint]...[/hint]` — shown before answering
- `[explain]...[/explain]` — shown after answering
- `[info]...[/info]` — reading-only content block

### File upload (`[upload]`)

Self-closing. Renders a file upload button that writes files into Pyodide's
virtual filesystem for use by subsequent Python blocks.

```md
[upload label="Upload CSV" accept=.csv rename=data.csv]
[upload label="Submit files" accept=.pdf multiple]
```

| Attribute | Default | Notes |
|-----------|---------|-------|
| `label` | "Upload" | Button text |
| `accept` | — | File picker filter, e.g. `.csv,.pdf` |
| `rename` | — | Save under this fixed name |
| `multiple` | false | Allow selecting multiple files |

### Include / Transclusion (`[include]`)

Self-closing. Embeds another markdown file inline at build time.

```md
[include=partials/intro.md]
[include=notes/topic.md#derivation]
```

### Query (`[query]`)

Self-closing. Renders a list of pages matching a frontmatter filter.

```md
[query tag=python]
[query folder=notes/math sort=updated limit=10]
```

### Raw / Verbatim (`[raw]`)

Displays block syntax literally without executing it. Useful for documenting
block syntax itself.

```md
[raw]
[jsx]
<Chart />
[/jsx]
[/raw]
```

### Image (`[image]`)

Self-closing image reference block. Images live anywhere under `.readrun/assets/`.

```md
[image=images/diagram.svg]
```

Images are embedded into the rendered page and open in the lightbox when clicked.

### Viewer blocks

Self-closing file reference blocks. Files live anywhere under `.readrun/assets/`.

| Block | File types | Description |
|-------|-----------|-------------|
| `[stl=models/file.stl]` | `.stl` | 3D mesh viewer (Three.js, lazy-loaded) |
| `[model=models/file.glb]` | `.glb`, `.gltf` | 3D scene viewer (Three.js, lazy-loaded) |
| `[csv=data/file.csv]` | `.csv` | Interactive table with sort, filter, pagination |
| `[pdf=docs/file.pdf]` | `.pdf` | Embedded PDF viewer |
| `[audio=media/file.mp3]` | `.mp3`, `.wav`, `.ogg`, `.m4a` | Audio player |
| `[video=media/file.mp4]` | `.mp4`, `.webm`, `.ogv` | Video player |

Common attributes: `height` (pixels, for stl/model), `loop` (audio/video), `muted` (video).

Three.js (~600KB) loads only on pages that contain `[stl=]` or `[model=]` blocks.

## Escape

Prefix a block opener with `\\` to render it literally:

```
\\[jsx] renders as [jsx]
```

Block syntax inside backtick code fences or inline code is never parsed.
