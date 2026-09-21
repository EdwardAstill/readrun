# Neovim integration

`readrun.lua` adds preview and build commands for Markdown buffers. Load it from
your Neovim config:

```lua
dofile("/path/to/readrun/integrations/nvim/readrun.lua")
```

The integration uses `READRUN_BIN`, then `rr` from `PATH`, then the CLI in this
repository when Bun is available.

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

| Command | Action |
| --- | --- |
| `:Readrun [path]` | Preview a path or the current Markdown buffer |
| `:ReadrunStop` | Stop the managed server |
| `:ReadrunOpen` | Restart the last desktop preview |
| `:ReadrunBuild [path]` | Build a static site |

In Markdown buffers, `<leader>R` opens the preview directly (Space, Shift+R
with a Space leader). There is no Readrun shortcut submenu.
