# Toolkits

readrun includes a browser-based scientific calculator. It opens in a modeless
window, so you can keep reading and navigating while it remains available.

## Open a toolkit

Press **Ctrl+K** on Windows or Linux, or **Cmd+K** on macOS, to open the command
palette. The shortcut also works while an editable field is focused. Type to
filter the three initial commands:

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

## Attribution

The calculator is provided by
[sci-calc-widget](https://github.com/EdwardAstill/sci-calc-widget), a focused
downstream package based on
[OpenMirai Scientific Calculator](https://github.com/openmirai/mirai-scientific-calculator)
v0.2.0. The original and downstream work are distributed under the MIT License;
the package repository preserves the source attribution and license details.
