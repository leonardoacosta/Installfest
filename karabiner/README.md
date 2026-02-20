# Karabiner RDP Configuration

Mac OSX keyboard shortcuts for Remote Desktop sessions. Translates macOS shortcuts to their Windows PC equivalents.

## Source

Based on [varp/karabiner-rdp](https://github.com/varp/karabiner-rdp)

## Overview

This configuration automatically translates macOS keyboard shortcuts to Windows equivalents when using Remote Desktop applications:

- **Microsoft Remote Desktop** (all variants)
- **TeamViewer**
- **VMware Horizon**
- **Thinomenon Remote Desktop Connection**

## Key Mappings

### Navigation
- `Cmd+Left/Right` → `Home/End`
- `Cmd+Shift+Left/Right` → `Shift+Home/End`
- `Option+Left/Right` → `Ctrl+Left/Right` (word navigation)

### Common Operations
- `Cmd+C/V/X` → `Ctrl+C/V/X` (copy/paste/cut)
- `Cmd+Z` → `Ctrl+Z` (undo)
- `Cmd+Shift+Z` → `Ctrl+Shift+Z` (redo)
- `Cmd+A` → `Ctrl+A` (select all)
- `Cmd+S` → `Ctrl+S` (save)
- `Cmd+Tab` → `Alt+Tab` (window switching)

### Application Functions
- `Cmd+Q` → `Alt+F4` (quit)
- `Cmd+N/O/W` → `Ctrl+N/O/W` (new/open/close)
- `Cmd+F` → `Ctrl+F` (find)
- `Cmd+/` → `Ctrl+/` (comment code)

### Browser-Specific
- `Cmd+R` → `F5` (reload)
- `Cmd+Shift+R` → `Ctrl+F5` (hard refresh)
- `Cmd+L` → `Ctrl+L` (address bar)
- `Cmd+T` → `Ctrl+T` (new tab)
- `Cmd+Shift+I` → `Ctrl+Shift+I` (developer tools)

### Input Method Switching
- `Fn+Space` → `Shift+Alt`
- `Cmd+Space` → `Shift+Alt` (or `Shift+Ctrl`)

## Installation

### Prerequisites

Ensure [Karabiner-Elements](https://karabiner-elements.pqrs.org/) is installed:

```bash
brew install --cask karabiner-elements
```

### Import Configuration

#### Automatic Import (if Karabiner is installed)

Run this command from the repository root:

```bash
open "karabiner://karabiner/assets/complex_modifications/import?url=$(python3 -c "import urllib.parse; import os; print(urllib.parse.quote('file://' + os.getcwd() + '/karabiner/mac_osx_on_rdp.json'))")"
```

This will:
1. Generate the proper Karabiner import URL
2. Open Karabiner-Elements
3. Prompt you to import the configuration

#### Manual Import (alternative method)

If the automatic import doesn't work:

1. Copy `karabiner/mac_osx_on_rdp.json` to:
   ```
   ~/.config/karabiner/assets/complex_modifications/
   ```
2. Open **Karabiner-Elements** preferences
3. Navigate to **Complex Modifications** tab
4. Click **Add rule**
5. You should see "Mac OSX Style Shortcuts for RDP sessions" in the list

**Command:**
```bash
mkdir -p ~/.config/karabiner/assets/complex_modifications/
cp karabiner/mac_osx_on_rdp.json ~/.config/karabiner/assets/complex_modifications/
```

### Enable Rules

1. Open **Karabiner-Elements** preferences
2. Navigate to **Complex Modifications** tab
3. Click **Add rule**
4. Enable the desired shortcut mappings

## Notes

- Shortcuts only activate when Remote Desktop applications are in focus
- All shortcuts are context-aware and won't interfere with normal macOS usage
- Some input method switching shortcuts may conflict with macOS settings
