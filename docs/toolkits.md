# Toolkits

readrun includes two browser-based tools: a persistent Python terminal and a
scientific calculator. They open in modeless windows, so you can keep reading
and navigating while a tool remains available.

## Open a toolkit

Press **Ctrl+K** on Windows or Linux, or **Cmd+K** on macOS, to open the command
palette. The shortcut also works while an editable field is focused. Type to
filter the four initial commands:

- **Open Python Terminal**
- **Open Scientific Calculator**
- **Search Site**
- **Search Page**

Choose a command with the pointer, or use the arrow keys and Enter. The existing
**s** shortcut still opens page search when focus is not in an editable field.

## Manage windows

Opening an existing toolkit restores and raises its current window instead of
creating a duplicate. Drag the title bar to move a wide-screen window. Resize it
from the visible right, bottom, or bottom-right edge handles.

Use the title-bar controls to minimize or close a toolkit. Minimized tools stay
mounted on the restore shelf, so their current contents remain intact.
Right-click anywhere on a toolkit window to expose a **Close** action. When no
modal overlay is open, Escape closes the topmost visible toolkit.

On screens narrower than 640 pixels, a toolkit becomes a top-inset surface that
is flush with the side and bottom viewport edges. Its exposed top corners retain
readrun's standard rounded shape.

## Python Terminal

The terminal runs Python in the browser through readrun's shared Pyodide engine.
Each terminal session has its own persistent globals, while loaded packages and
the virtual filesystem remain shared with executable Markdown blocks.

- Press Enter to submit a command and Shift+Enter to insert a newline.
- At the start or end of the editor, Up and Down move through command history.
- Commands run sequentially, including commands submitted while another command
  is still running.
- Standard output, standard error, expression results, and tracebacks appear as
  text in submission order.
- Imported packages are detected and installed through the existing Pyodide
  package path when possible.
- **Clear Output** removes the transcript but keeps globals and history.
- **Reset Session** clears the transcript, history, and isolated Python globals.

Closing the window disposes its isolated session; reopening starts fresh. The
terminal is included in generated static sites as well as the development
server.

## Scientific Calculator

The calculator provides arithmetic and scientific functions, structured
fractions and roots, powers, constants, and list-statistics functions from its
scientific keypad. It supports degree and radian angle modes, reusable history,
variable and function definitions, exact-fraction display, and undo and redo.

Keyboard input is scoped to the calculator's focused expression field, so
typing elsewhere on the page does not change an open calculation.

## State and limitations

Toolkit windows and their contents survive readrun's in-app navigation because
the application shell stays mounted. Minimizing also preserves the mounted
tool. Closing a toolkit or fully reloading the page resets its state. readrun
does not persist toolkit state in local storage or session storage.

Python currently runs on the browser's main thread. A long-running command can
block the interface, and this release has no interrupt control, `input()`
support, rich figure output, or generated-file downloads.

## Attribution

The calculator is provided by
[sci-calc-widget](https://github.com/EdwardAstill/sci-calc-widget), a focused
downstream package based on
[OpenMirai Scientific Calculator](https://github.com/openmirai/mirai-scientific-calculator)
v0.2.0. The original and downstream work are distributed under the MIT License;
the package repository preserves the source attribution and license details.

## Future investigation: local uv sessions

A future release may investigate an optional persistent local Python process
managed with `uv`. Any such design needs explicit startup and shutdown,
per-session isolation, and reliable error recovery. Pyodide would remain the
execution path for generated static sites. This is an investigation only; the
current release does not start or expose a local Python server.
