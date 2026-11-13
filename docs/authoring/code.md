# Code

readrun supports regular display-only code fences and executable code blocks.
This page focuses on how readrun executes Python and resolves imports, not on
Python syntax itself. Use normal Markdown fences when you only want to show
code. Use `[python]` blocks when readers should be able to run Python in the
page.

## How Python runs

Python has two execution modes:

- **Local uv:** when `uv` is installed and the local server allows execution,
  **Settings → Run Python locally** is enabled by default. Each run starts a
  fresh Python process in a temporary directory, so variables are not shared
  between blocks. This runs native code on your machine; only run trusted code.
- **Browser Pyodide:** turn off **Run Python locally**, or use a static site.
  readrun downloads CPython/WebAssembly from a CDN on the first run, then loads
  packages as needed. Your local Python installation is not used.

In Pyodide mode, blocks in one open document share a session: run earlier
blocks first to make their variables and imports available. Switching or
rearranging tabs preserves that session; other document tabs have independent
sessions. Closing or fully reloading the document resets it.

Files in `.readrun/assets/data/` are copied into Pyodide's virtual filesystem
when Python starts. In local uv mode (**Run Python locally**), the same data files
are also copied into the temporary working directory as `data/**`. Files
created by Python in any mode exist only in the session; readrun detects new
files and shows download links for them.

Local execution is unavailable on static builds. If `uv` is not installed,
the **Run Python locally** switch stays locked and Python uses Pyodide.

Click **Run** to execute a block. While it is loading or running, the button
is disabled; failures appear in the output. Expanded code views keep live
interactive output rather than a static copy. Rerunning JSX remounts the
component and resets its state.

## Import methods

Python's import syntax is the same in readrun as it is in normal Python:

```python
import math
import numpy as np
from statistics import mean
from sklearn.linear_model import LinearRegression
```

The runtime choice controls how dependencies are installed:

| Import type | Pyodide mode | Local uv mode |
| --- | --- | --- |
| Standard library, such as `math`, `json`, `pathlib` | Works without install | Works without install |
| Pyodide-supported package, such as `numpy` or `pandas` | Auto-installed from imports | Installed by `uv` from imports |
| Import name differs from package name, such as `PIL` | Uses built-in mappings | Uses the same mappings |
| Native/compiled package not built for Pyodide | Usually fails | Use local uv |
| GitHub, direct URL, or pinned dependency | Not supported by auto-detection | Use inline uv script metadata |
| Dynamic import, such as `__import__("numpy")` | Not detected | Not detected |

readrun detects one package per import line. Prefer one dependency per line:

```python
import numpy as np
import pandas as pd
```

Avoid compact multi-import dependency lines when you want automatic installs:

```python
import numpy, pandas  # only the first package is detected
```

For exact dependency declarations in local uv mode, use inline script metadata.
This is the right place for version pins, GitHub packages, and direct package
URLs. When a block has inline script metadata, list every non-standard-library
dependency in that metadata block.

## When to use local uv

Use Pyodide mode when the page should work from a static build or when the
package is available in Pyodide. Use local uv when you are authoring locally
and need native Python behavior:

- a package has compiled native wheels but no Pyodide/wasm wheel
- a package comes from GitHub or another direct URL
- a package needs system behavior that Pyodide cannot provide
- you want faster native execution during local development

For example, `mapbox_earcut` is a compiled triangulation library. It does not
install in Pyodide, but it works when the page is served with `rr serve`, `uv`
is installed, and **Run Python locally** is enabled:

[python]
import numpy as np
import mapbox_earcut as earcut

vertices = np.array(
    [
        [0.0, 0.0],
        [2.0, 0.0],
        [2.0, 1.0],
        [0.0, 1.0],
    ],
    dtype=np.float64,
)
ring_ends = np.array([len(vertices)], dtype=np.uint32)
triangles = earcut.triangulate_float64(vertices, ring_ends)

print("triangle indices:", triangles.reshape(-1, 3).tolist())
[/python]

`uv` can also install a package directly from GitHub. In readrun, declare that
kind of dependency with inline script metadata. You do not need a shebang here:
readrun writes the block to a temporary `.py` file and runs it with `uv`.

[python]

# /// script

# dependencies = [

# "sampleproject @ git+<https://github.com/pypa/sampleproject.git>"

# ]

# ///

from sample.simple import add_one

print("from a GitHub dependency:", add_one(41))
[/python]

## Pyodide package detection

In Pyodide mode, readrun scans Python blocks for import statements
such as `import numpy as np` or `from pandas import DataFrame`. It installs the
detected package into Pyodide with `micropip` before the block runs.

Common scientific packages such as `numpy`, `pandas`, `matplotlib`, `scipy`,
and `scikit-learn` are available this way. Pure-Python packages from PyPI can
also work. Packages that need native system libraries or compiled extensions
must already be available for Pyodide; otherwise they will fail to install in
the browser.

Some packages have different import names and package names. readrun includes
common mappings such as `PIL` to `pillow`, `cv2` to `opencv-python`, and
`sklearn` to `scikit-learn`.

Import scanning is intentionally simple. Prefer normal import lines:

```python
import numpy as np
from sklearn.linear_model import LinearRegression
```

Dynamic imports such as `__import__("numpy")` are not detected automatically.
Keep dependencies as normal import lines when you want readrun to install them.

## Regular code blocks

Use a fenced code block when the code should be displayed but not executed:

```python
# Display only: no Run button
print("This example is not executable")
```

Use runnable blocks when the output matters:

```md
[python]
print("This one gets a Run button")
[/python]
```
