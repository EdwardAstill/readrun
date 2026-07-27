# Navigation

Readrun has two navigation modes:

- **Tree mode** uses the filesystem by default, or `.readrun/navigation.yaml` when you want an authored sidebar.
- **Wiki mode** uses `.readrun/entry.txt` only to choose the first page shown at `/`; the sidebar remains a plain all-pages wiki list.

Single-click a folder to expand or collapse it in tree mode. The full site search palette (`Cmd+K` / `Ctrl+K`) covers every page.

## Pinned search

Above the tree there's a search input. Typing in it reorders matching items toward the top of the tree, dims non-matches, and highlights the matched substring. Empty search restores the natural order. The search palette and this pinned input are independent — use whichever fits.

## Focus mode

**Double-click any folder** to focus the sidebar on it. The folder's siblings, ancestors, and even the folder row itself disappear; only its descendants remain. A breadcrumb appears above the tree showing the current scope:

```
all  ›  courses  ›  ai            ×
```

- Click any segment in the breadcrumb to widen back one or more levels.
- Click `all` (left) or `×` (right) to widen fully.
- Focus persists across page loads in `localStorage` — useful when reading a long course.

Focus mode is purely a sidebar view filter. The page you're reading does not change when you focus or widen, and links inside the focused scope still work normally.

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
