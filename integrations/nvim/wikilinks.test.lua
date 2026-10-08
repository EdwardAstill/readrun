-- nvim --headless -u NONE -i NONE -l integrations/nvim/wikilinks.test.lua
-- Exercise the editor bridge against the real CLI, without starting a preview.
vim.g.mapleader = " "
vim.opt.hidden = true
local root = vim.fn.tempname()
vim.fn.mkdir(root .. "/notes/.readrun", "p")
vim.fn.mkdir(root .. "/notes/nested", "p")
local cli = vim.fn.getcwd() .. "/src/cli.ts"
local wrapper = root .. "/rr"
vim.fn.writefile({ "#!/bin/sh", "exec " .. vim.fn.shellescape(vim.fn.exepath("bun")) .. " " .. vim.fn.shellescape(cli) .. ' "$@"' }, wrapper)
vim.fn.setfperm(wrapper, "rwx------")
vim.env.READRUN_BIN = wrapper
local notices = {}
vim.notify = function(message) notices[#notices + 1] = message end
vim.fn.jobstart = function() error("Resolving a link must not start a preview server") end
dofile("integrations/nvim/readrun.lua")
vim.fn.writefile({ "---", "title: Shared", "---", "# Alpha", "", "## Destination" }, root .. "/notes/a.md")
vim.fn.writefile({ "# Shared" }, root .. "/notes/nested/b.md")
vim.fn.writefile({ "[[a#destination|label]]", "[[Shared]]", "[[missing]]", "plain.txt", "[[a#missing]]" }, root .. "/notes/nested/source.md")
vim.fn.writefile({ "native gf target" }, root .. "/notes/nested/plain.txt")
vim.cmd.cd(root)
local function source(line)
  vim.cmd.edit(root .. "/notes/nested/source.md")
  vim.bo.filetype = "markdown"
  vim.api.nvim_win_set_cursor(0, { line, 3 })
end
source(1)
vim.api.nvim_feedkeys("gf", "xt", false)
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/a.md", "Root discovery must find ancestor .readrun")
assert(vim.fn.line(".") == 6, "Anchor should use the rendered source line")
source(2)
vim.ui.select = function(candidates, _, choose)
  assert(#candidates == 2, "Ambiguous title should preserve both pages")
  choose(candidates[2])
end
vim.cmd.ReadrunFollowWikilink()
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/nested/b.md")
source(3)
vim.cmd.ReadrunFollowWikilink()
assert(notices[#notices]:find("unresolved wikilink", 1, true))
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/nested/source.md")
source(4)
vim.api.nvim_feedkeys("gf", "xt", false)
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/nested/plain.txt", "Non-wikilinks must use native gf")
source(5)
vim.cmd.ReadrunFollowWikilink()
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/a.md")
assert(notices[#notices]:find("anchor not found", 1, true))
-- The integration and CLI must come from the same checkout, even with stale rr on PATH.
local old_path = vim.env.PATH
vim.fn.mkdir(root .. "/shadow", "p")
vim.fn.writefile({ "#!/bin/sh", "exit 77" }, root .. "/shadow/rr")
vim.fn.setfperm(root .. "/shadow/rr", "rwx------")
vim.env.PATH = root .. "/shadow:" .. old_path
vim.env.READRUN_BIN = nil
source(1)
vim.cmd.ReadrunFollowWikilink()
assert(vim.api.nvim_buf_get_name(0) == root .. "/notes/a.md", "Bundled CLI must take precedence over PATH rr")
vim.env.PATH = old_path
vim.env.READRUN_BIN = wrapper
source(1)
vim.fn.writefile({ "#!/bin/sh", "echo old-readrun >&2", "exit 1" }, wrapper)
vim.cmd.ReadrunFollowWikilink()
assert(notices[#notices]:find("install a Readrun version with resolve-wikilink", 1, true))
vim.fn.writefile({ "#!/bin/sh", "echo invalid-json" }, wrapper)
vim.cmd.ReadrunFollowWikilink()
assert(notices[#notices]:find("invalid resolve-wikilink response", 1, true))
vim.cmd.cd("/")
vim.fn.delete(root, "rf")
print("Readrun wikilink bridge passed")
