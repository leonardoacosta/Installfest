-- WezTerm configuration for Windows (WSL2 + Synergy Mac keyboard)
--
-- Key difference from mac config:
--   Mac uses CMD modifier (native). On Windows with Synergy + AHK,
--   Cmd presses arrive as CTRL (remapped by AHK). So this config
--   uses CTRL for most bindings, matching what AHK sends.
--
--   For tmux integration, we use CTRL (since AHK converts Cmd→Ctrl).
--   WezTerm intercepts CTRL combos and sends tmux escape sequences.

local wezterm = require("wezterm")
local mux = wezterm.mux
local act = wezterm.action

wezterm.on('gui-startup', function(window)
  local tab, pane, window = mux.spawn_window({})
  local gui_window = window:gui_window()
  gui_window:maximize()
end)

local config = {}

-- Default program: launch WSL2 Arch with zsh
config.default_prog = { "wsl.exe", "-d", "Arch", "--cd", "~" }

-- Appearance (matches Mac config)
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
--
-- On Mac:  CMD+key → WezTerm intercepts → sends tmux escape sequence
-- On Win:  Cmd press → Synergy sends Win → AHK remaps to Ctrl → WezTerm intercepts
--
-- So we bind CTRL+key here (which is what arrives after AHK remapping).
-- Some conflicts with terminal Ctrl codes are handled by using CTRL|SHIFT.
-- =============================================================================
config.keys = {
    -- Ctrl+T: New tmux window
    { key = "t", mods = "CTRL", action = act.SendString("\x1b[84;CMD~") },

    -- Ctrl+W: Close current pane/window
    { key = "w", mods = "CTRL", action = act.SendString("\x1b[87;CMD~") },

    -- Ctrl+1-9: Switch to tmux window 1-9
    { key = "1", mods = "CTRL", action = act.SendString("\x1b[49;CMD~") },
    { key = "2", mods = "CTRL", action = act.SendString("\x1b[50;CMD~") },
    { key = "3", mods = "CTRL", action = act.SendString("\x1b[51;CMD~") },
    { key = "4", mods = "CTRL", action = act.SendString("\x1b[52;CMD~") },
    { key = "5", mods = "CTRL", action = act.SendString("\x1b[53;CMD~") },
    { key = "6", mods = "CTRL", action = act.SendString("\x1b[54;CMD~") },
    { key = "7", mods = "CTRL", action = act.SendString("\x1b[55;CMD~") },
    { key = "8", mods = "CTRL", action = act.SendString("\x1b[56;CMD~") },
    { key = "9", mods = "CTRL", action = act.SendString("\x1b[57;CMD~") },

    -- Ctrl+Shift+[: Previous window
    { key = "[", mods = "CTRL|SHIFT", action = act.SendString("\x1b[91;CMS~") },

    -- Ctrl+Shift+]: Next window
    { key = "]", mods = "CTRL|SHIFT", action = act.SendString("\x1b[93;CMS~") },

    -- Ctrl+D: Split pane vertically (conflicts with EOF - use Ctrl+Shift+D instead)
    -- Keep Ctrl+D as EOF for terminal, use Ctrl+Shift+D for vertical split
    { key = "d", mods = "CTRL|SHIFT", action = act.SendString("\x1b[68;CMD~") },

    -- Ctrl+Alt+D: Split pane horizontally
    { key = "d", mods = "CTRL|ALT", action = act.SendString("\x1b[68;CMS~") },

    -- Ctrl+K: Clear scrollback
    { key = "k", mods = "CTRL", action = act.SendString("\x1b[75;CMD~") },

    -- Copy/Paste: Ctrl+C/V handled natively by WezTerm on Windows
    -- WezTerm auto-detects: Ctrl+C copies if selection exists, sends SIGINT otherwise
    { key = "c", mods = "CTRL|SHIFT", action = act.CopyTo("Clipboard") },
    { key = "v", mods = "CTRL|SHIFT", action = act.PasteFrom("Clipboard") },

    -- Ctrl+N: New WezTerm window
    { key = "n", mods = "CTRL", action = act.SpawnWindow },

    -- Ctrl+Q: Quit WezTerm
    { key = "q", mods = "CTRL", action = act.QuitApplication },

    -- =========================================================================
    -- Text Editing - mapped to match Mac muscle memory
    -- AHK handles OS-level remapping. These handle terminal-level.
    -- =========================================================================

    -- Alt+Left: Move word backward (sends ESC b)
    { key = "LeftArrow", mods = "ALT", action = act.SendString("\x1bb") },

    -- Alt+Right: Move word forward (sends ESC f)
    { key = "RightArrow", mods = "ALT", action = act.SendString("\x1bf") },

    -- Alt+Backspace: Delete word backward (sends ESC + backspace)
    { key = "Backspace", mods = "ALT", action = act.SendString("\x1b\x7f") },

    -- Home/End: Beginning/end of line (Ctrl+A / Ctrl+E)
    -- AHK converts Cmd+Left/Right → Home/End at OS level
    -- In terminal, Home/End should send Ctrl+A/Ctrl+E
    { key = "Home", mods = "NONE", action = act.SendString("\x01") },
    { key = "End", mods = "NONE", action = act.SendString("\x05") },

    -- Shift+Home/End: Select to line boundaries in tmux copy mode
    { key = "Home", mods = "SHIFT", action = act.SendString("\x1b[60;CMS~") },
    { key = "End", mods = "SHIFT", action = act.SendString("\x1b[62;CMS~") },

    -- Alt+Shift+Left/Right: Select word in tmux copy mode
    { key = "LeftArrow", mods = "ALT|SHIFT", action = act.SendString("\x1b[60;OMS~") },
    { key = "RightArrow", mods = "ALT|SHIFT", action = act.SendString("\x1b[62;OMS~") },
}

return config
