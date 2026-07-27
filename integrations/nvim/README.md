# Neovim integration

`readrun.lua` adds preview and build commands for Markdown buffers. Load it from
your Neovim config:

```lua
dofile("/path/to/readrun/integrations/nvim/readrun.lua")
```

The integration uses `rr` from `PATH`, then `READRUN_BIN`, then the CLI in this
repository when Bun is available.

| Command | Action |
| --- | --- |
| `:Readrun [path]` | Serve a path or the current Markdown buffer |
| `:ReadrunStop` | Stop the managed server |
| `:ReadrunOpen` | Reopen the current preview URL |
| `:ReadrunBuild [path]` | Build a static site |

Markdown buffers also receive `<leader>Rp`, `<leader>Rq`, `<leader>Ro`, and
`<leader>Rb` mappings for those actions.
