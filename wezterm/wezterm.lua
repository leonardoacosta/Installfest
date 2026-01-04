local wezterm = require("wezterm")
local mux = wezterm.mux

wezterm.on('gui-startup', function(window)
  local tab, pane, window = mux.spawn_window({
    cmd = "wezterm",
    args = {
      "start",
      "--layout",
      "side-by-side",
      "--layout-direction",
      "vertical",
      "--layout-mode",
      "split-vertical",
    }
  })
  local gui_window = window:gui_window();
  gui_window:maximize()
end)

local config = {}

-- Enable OSC 52 clipboard (for tmux over SSH)
config.enable_csi_u_key_encoding = true

config.native_macos_fullscreen_mode = true
config.automatically_reload_config = true
config.enable_tab_bar = false
config.window_close_confirmation = "NeverPrompt"
config.font = wezterm.font("GeistMono Nerd Font Mono", { weight = "thin" })
config.color_scheme = 'VisiBlue (terminal.sexy)'
config.window_decorations = "RESIZE" -- disable title bar, but allow resizing  
config.window_background_opacity = 0.70
config.window_padding = {
    left = 3,
    right = 3,
    top = 0,
    bottom = 0,
}
-- config.background = {
--     {
--         -- source = {
--         --     File = "/Users/leonardoacosta/Documents/background.jpeg",
--         --     },
--         --     width = "100%",
--         --     height = "100%",
--         --     opacity = 1,
--         -- },
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