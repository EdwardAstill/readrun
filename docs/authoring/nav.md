# Navigation

Readrun has two navigation modes:

- **Tree mode** uses the filesystem by default, or `.readrun/navigation.yaml` when you want an authored sidebar.
- **Wiki mode** uses `.readrun/entry.txt` only to choose the first page shown at `/`; the sidebar remains a plain all-pages wiki list.

Open **Files** in the reader toolbar to show the left-side workspace drawer.
It uses a server-rendered adaptation of [edcn Tree](https://github.com/EdwardAstill/edcn/tree/main/registry/tree),
with the current document marked and its folders expanded. The drawer works in
both the desktop app and browser; **b** opens the native file picker on desktop,
or the drawer in the browser. Open a folder with `rr ./notes` to include its
documents; `rr page.md` only indexes that file.

Single-click a folder to expand or collapse it. Press `Cmd+K` / `Ctrl+K` and
choose **Search Site** for the searchable file browser:

- **Folders** searches filenames, paths, and page text through an expandable folder tree, with a content preview beside it.
- **WikiLinks** searches the outgoing WikiLinks in the open note. Its current column lists linked notes and the right column previews the selected note; there is no parent column.

Use the arrow keys to select a result, then Enter or **Open** to read it. Selecting a result only changes its preview. Wiki projects start in WikiLinks search; both choices are available in every project.

## Pinned search

Above the tree there's a search input. Typing highlights matching labels, dims non-matches, and expands matching branches without reordering the tree. Clearing the query restores your expansion state. The search palette and this pinned input are independent.

## Focus mode

**Double-click any folder** to focus the sidebar on it. The folder's siblings, ancestors, and even the folder row itself disappear; only its descendants remain. A breadcrumb appears above the tree showing the current scope:

```
all  ›  courses  ›  ai            ×
```

- Click any segment in the breadcrumb to widen back one or more levels.
- Click `all` (left) or `×` (right) to widen fully.
- Focus persists across page loads in `localStorage` — useful when reading a long course.

Focus mode is purely a sidebar view filter. The page you're reading does not change when you focus or widen, and links inside the focused scope still work normally.

## Tabs and links

Local document links open and select workspace tabs. Ctrl-click / Cmd-click
keeps the destination inside readrun instead of opening a browser tab. An
already-open document is selected rather than duplicated. Same-page anchors,
external links, explicit browser targets, and downloads retain native behavior.

Switching tabs preserves each document's scroll position and interactive state.
Use Alt+Down / Alt+Up to switch, Alt+W to close, Alt+F to float, and Alt+D to dock.

## Project files

Use these project files instead of frontmatter-driven or virtual sidebar placement:

- `.readrun/navigation.yaml` for authored tree navigation
- `.readrun/entry.txt` for wiki first-page selection
- `.readrun/ignore` for hidden files and folders

Only one navigation mode file should exist in a project at a time.

## Keyboard

| Action | Shortcut |
|---|---|
| Open the search palette | `Cmd+K` / `Ctrl+K` |
| Focus a folder | Double-click on its name |
| Widen back | Click any breadcrumb segment, or click `×` |
| Move through visible tree items | Up / Down, Home / End |
| Collapse / expand a folder | Left / Right |
| Open a file or toggle a folder | Enter / Space |
| Close the Files drawer | Escape or its Close button |
