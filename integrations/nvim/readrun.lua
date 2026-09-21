-- Readrun desktop preview, with source scrolling tied to the originating window.

local state = { job_id = nil, port = nil, path = nil, url = nil }
local generation = 0

-- Called through Neovim's local RPC socket. Never select another buffer/window.
_G.ReadrunScroll = function(session, line)
  if not state.session or session ~= state.session or not state.win or not vim.api.nvim_win_is_valid(state.win)
    or vim.api.nvim_win_get_buf(state.win) ~= state.buf then return 0 end
  if type(line) ~= "number" or line < 1 or line ~= math.floor(line) then return 0 end
  line = math.min(line, vim.api.nvim_buf_line_count(state.buf))
  vim.api.nvim_win_call(state.win, function()
    vim.api.nvim_win_set_cursor(state.win, { line, 0 })
    vim.cmd("normal! zvzt")
  end)
  return 1
end

local function bundled_cli()
  local source = debug.getinfo(1, "S").source
  if source:sub(1, 1) ~= "@" then return nil end

  local integration_dir = vim.fn.fnamemodify(source:sub(2), ":p:h")
  return vim.fn.fnamemodify(integration_dir .. "/../../src/cli.ts", ":p")
end

local function bin_cmd()
  if vim.env.READRUN_BIN and #vim.env.READRUN_BIN > 0 then
    return { vim.env.READRUN_BIN }
  end
  if vim.fn.executable("rr") == 1 then
    return { "rr" }
  end
  local fallback = bundled_cli()
  if fallback and vim.fn.executable("bun") == 1 and vim.fn.filereadable(fallback) == 1 then
    return { "bun", fallback }
  end
  return nil
end

local function notify(msg, level)
  vim.notify("[readrun] " .. msg, level or vim.log.levels.INFO)
end

local function send_buffer()
  if not state.job_id or not state.session or not vim.api.nvim_buf_is_valid(state.buf)
    or vim.api.nvim_buf_get_name(state.buf) ~= state.path then return end
  local source = vim.NIL
  if vim.bo[state.buf].modified then
    source = table.concat(vim.api.nvim_buf_get_lines(state.buf, 0, -1, false), "\n")
    if vim.bo[state.buf].endofline then source = source .. "\n" end
  end
  local message = vim.json.encode({ type = "buffer", source = source }) .. "\n"
  if message == state.last_source then return end
  if pcall(vim.fn.chansend, state.job_id, message) then state.last_source = message end
end

vim.api.nvim_create_autocmd({ "TextChanged", "TextChangedI", "TextChangedP", "BufWritePost", "BufEnter" }, {
  callback = function(args)
    if args.buf ~= state.buf or not state.session then return end
    state.change_id = (state.change_id or 0) + 1
    local change_id, session = state.change_id, state.session
    vim.defer_fn(function()
      if state.session == session and state.change_id == change_id then send_buffer() end
    end, 120)
  end,
})

local function resolve_target(arg)
  if arg and #arg > 0 then
    return vim.fn.fnamemodify(arg, ":p")
  end
  local buf_name = vim.api.nvim_buf_get_name(0)
  if buf_name ~= "" and vim.fn.filereadable(buf_name) == 1 then
    if vim.bo.filetype == "markdown" or buf_name:match("%.md$") then
      return buf_name
    end
  end
  return vim.fn.getcwd()
end

local function stop_server(silent)
  state.session = nil
  if state.job_id then
    pcall(vim.fn.jobstop, state.job_id)
    state.job_id = nil
    if not silent then notify("server stopped") end
  elseif not silent then
    notify("no server running", vim.log.levels.WARN)
  end
  state.url = nil
end

local function start_server(target)
  local cmd = bin_cmd()
  if not cmd then
    notify("readrun not found (need `rr` on PATH or bun + cli.ts)", vim.log.levels.ERROR)
    return
  end

  if state.job_id then stop_server(true) end

  local port = state.port or 7700
  local launch = vim.list_extend(
    vim.deepcopy(cmd),
    { "serve", target, "--port", tostring(port) }
  )
  local env = { READRUN_NVIM_SERVER = "", READRUN_NVIM_SESSION = "" }
  generation = generation + 1
  local session = tostring(vim.fn.getpid()) .. "-" .. tostring(generation)
  if target == vim.api.nvim_buf_get_name(0) and vim.bo.filetype == "markdown" then
    if vim.v.servername == "" then vim.fn.serverstart() end
    state.win, state.buf, state.session = vim.api.nvim_get_current_win(), vim.api.nvim_get_current_buf(), session
    env.READRUN_NVIM_SERVER = vim.v.servername
    env.READRUN_NVIM_SESSION = session
    env.READRUN_NVIM_BIN = vim.v.progpath
    env.READRUN_NVIM_LINE = tostring(vim.fn.line("w0"))
  end

  local opened = false
  state.last_source = nil
  state.path = target
  state.port = port
  state.url = "http://localhost:" .. port .. "/"

  local function on_output(_, data)
    if not data then return end
    for _, line in ipairs(data) do
      if line and #line > 0 then
        local url = line:match("https?://%S+")
        if url and not opened then
          opened = true
          state.url = url
          notify("serving " .. target .. " at " .. url)
        end
      end
    end
  end

  state.job_id = vim.fn.jobstart(launch, {
    env = env,
    on_stdout = on_output,
    on_stderr = on_output,
    on_exit = function(job, code)
      if state.job_id ~= job then return end
      state.job_id = nil
      state.session = nil
      if code ~= 0 and code ~= nil then
        notify("server exited (code " .. tostring(code) .. ")", vim.log.levels.WARN)
      end
    end,
  })

  if state.job_id <= 0 then
    notify("failed to launch readrun", vim.log.levels.ERROR)
    state.job_id = nil
    return
  end

  notify("starting on port " .. port .. " (target: " .. target .. ")")
  send_buffer()
end

local function build_target(arg)
  local cmd = bin_cmd()
  if not cmd then
    notify("readrun not found", vim.log.levels.ERROR)
    return
  end
  local target = resolve_target(arg)
  if vim.fn.filereadable(target) == 1 then
    target = vim.fn.fnamemodify(target, ":p:h")
  end
  local launch = vim.list_extend(vim.deepcopy(cmd), { "build", target })
  notify("building " .. target .. "...")
  vim.fn.jobstart(launch, {
    on_exit = function(_, code)
      if code == 0 then notify("build complete")
      else notify("build failed (code " .. tostring(code) .. ")", vim.log.levels.ERROR) end
    end,
  })
end

vim.api.nvim_create_user_command("Readrun", function(opts)
  start_server(resolve_target(opts.args))
end, { nargs = "?", complete = "file", desc = "Serve markdown via readrun" })

vim.api.nvim_create_user_command("ReadrunStop", function()
  stop_server(false)
end, { desc = "Stop readrun server" })

vim.api.nvim_create_user_command("ReadrunOpen", function()
  if state.path then start_server(state.path)
  else notify("no server running", vim.log.levels.WARN) end
end, { desc = "Reopen readrun desktop preview" })

vim.api.nvim_create_user_command("ReadrunBuild", function(opts)
  build_target(opts.args)
end, { nargs = "?", complete = "file", desc = "Build static site via readrun" })

vim.api.nvim_create_autocmd("VimLeavePre", {
  callback = function() stop_server(true) end,
})

vim.api.nvim_create_autocmd("FileType", {
  pattern = "markdown",
  callback = function(args)
    vim.keymap.set("n", "<leader>R", "<cmd>Readrun<cr>", {
      buffer = args.buf, desc = "Readrun: preview", silent = true, nowait = true,
    })
  end,
})
