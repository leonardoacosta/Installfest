local wezterm = require("wezterm")
local mux = wezterm.mux
local act = wezterm.action

wezterm.on('gui-startup', function(window)
  local tab, pane, window = mux.spawn_window({
    -- cmd = "wezterm",
    -- args = {
    --   "start",
    --   "--layout",
    --   "side-by-side",
    --   "--layout-direction",
    --   "vertical",
    --   "--layout-mode",
    --   "split-vertical",
    -- }
  })
  local gui_window = window:gui_window();
  gui_window:maximize()
end)

local config = {}

-- Appearance
config.native_macos_fullscreen_mode = true
config.automatically_reload_config = true
config.enable_tab_bar = false  -- tmux handles tabs
config.window_close_confirmation = "NeverPrompt"
config.font = wezterm.font("GeistMono Nerd Font Mono", { weight = "DemiBold" })
config.color_scheme = 'VisiBlue (terminal.sexy)'
config.window_decorations = "RESIZE"
config.window_background_opacity = 0.90
config.window_padding = {
    left = 3,
    right = 3,
    top = 0,
    bottom = 0,
}

-- =============================================================================
-- Keybindings for tmux integration
-- These send custom escape sequences that tmux binds via user-keys
-- =============================================================================
config.keys = {
    -- Cmd+T: New tmux window (like browser new tab)
    { key = "t", mods = "CMD", action = act.SendString("\x1b[84;CMD~") },

    -- Cmd+W: Close current pane/window (smart close)
    { key = "w", mods = "CMD", action = act.SendString("\x1b[87;CMD~") },

    -- Cmd+1-9: Switch to tmux window 1-9
    { key = "1", mods = "CMD", action = act.SendString("\x1b[49;CMD~") },
    { key = "2", mods = "CMD", action = act.SendString("\x1b[50;CMD~") },
    { key = "3", mods = "CMD", action = act.SendString("\x1b[51;CMD~") },
    { key = "4", mods = "CMD", action = act.SendString("\x1b[52;CMD~") },
    { key = "5", mods = "CMD", action = act.SendString("\x1b[53;CMD~") },
    { key = "6", mods = "CMD", action = act.SendString("\x1b[54;CMD~") },
    { key = "7", mods = "CMD", action = act.SendString("\x1b[55;CMD~") },
    { key = "8", mods = "CMD", action = act.SendString("\x1b[56;CMD~") },
    { key = "9", mods = "CMD", action = act.SendString("\x1b[57;CMD~") },

    -- Cmd+Shift+[: Previous window
    { key = "[", mods = "CMD|SHIFT", action = act.SendString("\x1b[91;CMS~") },

    -- Cmd+Shift+]: Next window
    { key = "]", mods = "CMD|SHIFT", action = act.SendString("\x1b[93;CMS~") },

    -- Cmd+D: Split pane vertically (iTerm2 style)
    { key = "d", mods = "CMD", action = act.SendString("\x1b[68;CMD~") },

    -- Cmd+Shift+D: Split pane horizontally (iTerm2 style)
    { key = "d", mods = "CMD|SHIFT", action = act.SendString("\x1b[68;CMS~") },

    -- Cmd+K: Clear scrollback
    { key = "k", mods = "CMD", action = act.SendString("\x1b[75;CMD~") },

    -- Preserve Cmd+C/V for copy/paste in WezTerm (don't send to tmux)
    { key = "c", mods = "CMD", action = act.CopyTo("Clipboard") },
    { key = "v", mods = "CMD", action = act.PasteFrom("Clipboard") },

    -- Cmd+N: New WezTerm window (not tmux)
    { key = "n", mods = "CMD", action = act.SpawnWindow },

    -- Cmd+Q: Quit WezTerm
    { key = "q", mods = "CMD", action = act.QuitApplication },

    -- =========================================================================
    -- Text Editing - macOS standard keybindings
    -- =========================================================================

    -- Option+Left: Move word backward (sends ESC b)
    { key = "LeftArrow", mods = "OPT", action = act.SendString("\x1bb") },

    -- Option+Right: Move word forward (sends ESC f)
    { key = "RightArrow", mods = "OPT", action = act.SendString("\x1bf") },

    -- Option+Backspace: Delete word backward (sends ESC + backspace)
    { key = "Backspace", mods = "OPT", action = act.SendString("\x1b\x7f") },

    -- Cmd+Left: Go to beginning of line (sends Ctrl+A)
    { key = "LeftArrow", mods = "CMD", action = act.SendString("\x01") },

    -- Cmd+Right: Go to end of line (sends Ctrl+E)
    { key = "RightArrow", mods = "CMD", action = act.SendString("\x05") },

    -- Cmd+Backspace: Delete to beginning of line (sends Ctrl+U)
    { key = "Backspace", mods = "CMD", action = act.SendString("\x15") },

    -- Cmd+Shift+Left: Select to beginning of line (tmux copy mode)
    { key = "LeftArrow", mods = "CMD|SHIFT", action = act.SendString("\x1b[60;CMS~") },

    -- Cmd+Shift+Right: Select to end of line (tmux copy mode)
    { key = "RightArrow", mods = "CMD|SHIFT", action = act.SendString("\x1b[62;CMS~") },

    -- Option+Shift+Left: Select word backward (tmux copy mode)
    { key = "LeftArrow", mods = "OPT|SHIFT", action = act.SendString("\x1b[60;OMS~") },

    -- Option+Shift+Right: Select word forward (tmux copy mode)
    { key = "RightArrow", mods = "OPT|SHIFT", action = act.SendString("\x1b[62;OMS~") },
}

-- config.background = {
--     {
--         source = {
--             File = "/Users/leonardoacosta/Documents/background.jpeg",
--             },
--             width = "100%",
--             height = "100%",
--             opacity = 1,
--         },
--         {
--             source = {
--                 Color = "#000000",
--             },
--             width = "100%",
--             height = "100%",
--             opacity = 0.90,
--         },
--     }

return config
