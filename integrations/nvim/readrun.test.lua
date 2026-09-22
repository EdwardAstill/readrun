-- nvim --headless -u NONE -l integrations/nvim/readrun.test.lua
local launches = {}
local stopped = {}
local messages = {}
vim.g.mapleader = " "
vim.env.HYPRLAND_INSTANCE_SIGNATURE = "readrun-test"
vim.env.READRUN_BIN = "/test/rr"
vim.fn.jobstart = function(command, options)
  launches[#launches + 1] = { command = command, options = options }
  return #launches
end
vim.fn.jobstop = function(job) stopped[job] = true end
vim.fn.chansend = function(job, message)
  messages[#messages + 1] = { job = job, value = vim.json.decode(message) }
  return #message
end
vim.system = function() error("Preview must not reposition the desktop window") end
vim.notify = function() end

dofile("integrations/nvim/readrun.lua")
local filename = vim.fn.tempname() .. ".md"
local lines = {}
for i = 1, 200 do lines[i] = "Line " .. i end
vim.fn.writefile(lines, filename)
vim.cmd.edit(filename)
vim.bo.filetype = "markdown"
assert(vim.fn.maparg(" R", "n", false, true).nowait == 1)
for _, suffix in ipairs({ "p", "q", "o", "b" }) do
  assert(vim.fn.maparg(" R" .. suffix, "n") == "", "Readrun submenu still exists")
end
vim.api.nvim_feedkeys(" R", "xt", false)
local first = launches[1]
assert(not vim.tbl_contains(first.command, "--floating"))
assert(not vim.tbl_contains(first.command, "--no-open"))
assert(messages[#messages].value.source == vim.NIL, "Saved buffers should use the file on disk")
vim.api.nvim_buf_set_lines(0, 10, 11, false, { "Unsaved typing" })
vim.api.nvim_exec_autocmds("TextChangedI", { buffer = 0 })
assert(vim.wait(1000, function() return type(messages[#messages].value.source) == "string" end))
assert(messages[#messages].value.source:find("Unsaved typing", 1, true))
assert(vim.fn.readfile(filename)[11] == "Line 11", "Preview saved unsaved changes to disk")
vim.cmd.write()
assert(vim.wait(1000, function() return messages[#messages].value.source == vim.NIL end), "Saving must release the in-memory preview")
local session = first.options.env.READRUN_NVIM_SESSION
assert(ReadrunScroll(session, 70) == 1)
assert(vim.fn.line(".") == 70)
assert(vim.fn.line("w0") == 70)
assert(ReadrunScroll("wrong-session", 80) == 0)
assert(vim.fn.line(".") == 70)

vim.g.readrun_floating = true
vim.cmd.Readrun()
assert(stopped[1])
local second = launches[2]
assert(vim.tbl_contains(second.command, "--floating"))
first.options.on_exit(1, 0)
assert(ReadrunScroll(second.options.env.READRUN_NVIM_SESSION, 90) == 1)
assert(ReadrunScroll(session, 10) == 0)
vim.cmd.enew()
assert(ReadrunScroll(second.options.env.READRUN_NVIM_SESSION, 30) == 0)
assert(vim.fn.line(".") == 1)
vim.cmd.ReadrunStop()
assert(stopped[2])
vim.fn.delete(filename)
print("Readrun Neovim integration passed")
