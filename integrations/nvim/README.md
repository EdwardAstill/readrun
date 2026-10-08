# Neovim integration

`readrun.lua` adds preview, build, and wikilink commands for Markdown buffers.
Load it from your Neovim config:

```lua
dofile("/path/to/readrun/integrations/nvim/readrun.lua")
```

The integration uses an explicit `READRUN_BIN` override, then the CLI beside
the integration when Bun is available, then `rr` from `PATH`. This keeps the
integration and CLI on the same version when loaded from a managed checkout.

`:Readrun` opens a normal desktop window, tiled alongside Neovim on Hyprland.
For the current Markdown buffer, it starts at the visible source line; scrolling
the preview moves that same Neovim window. Close the viewer to resume
editing there. Sync follows headings, code, and Readrun blocks, interpolating
within sections. It is preview-to-editor only, and stops affecting the editor if
you replace the originating buffer or close its window. Other files opened in
the preview do not move the original buffer. The preview updates while you type,
including unsaved changes; buffer contents stay in memory and are never saved by
Readrun. Saving with `:write` returns the preview to the file on disk. External
file changes update automatically when there are no unsaved preview edits.
File previews load just that document and its assets. Use `:Readrun .` to browse
the whole working folder.

| Command | Action |
| --- | --- |
| `:Readrun [path]` | Preview a path or the current Markdown buffer |
| `:ReadrunStop` | Stop the managed server |
| `:ReadrunOpen` | Restart the last desktop preview |
| `:ReadrunBuild [path]` | Build a static site |
| `:ReadrunFollowWikilink` | Follow the wikilink under the cursor, or use native `gf` |

In Markdown buffers, `<leader>R` opens the preview directly (Space, Shift+R
with a Space leader). There is no Readrun shortcut submenu.

`gf` follows Markdown wikilinks using Readrun's page index, including project
ignore rules, exact paths, title matches, ambiguity selection, and heading
anchors. Outside a wikilink it uses native `gf`. The content root is the nearest
ancestor containing `.readrun`; otherwise it uses cwd for files beneath cwd,
or the current file's folder. Dotfiles-specific fuzzy filename rules are not
part of Readrun resolution. Targets and anchor positions use saved files.

The editor calls the read-only JSON interface:

```bash
rr resolve-wikilink 'guide#installation|Install' --root /path/to/notes
```

The result has `status` (`resolved`, `ambiguous`, or `unresolved`), optional
`anchor`, and `candidates`, each with `file`, `relPath`, `title`, and an optional
one-based `line`. A missing or unsupported anchor leaves `line` absent. Resolving
does not serve the project, build widgets, execute page code, or write caches.
Use a Readrun release containing this command; the integration reports an error
if its CLI is unavailable or incompatible.
