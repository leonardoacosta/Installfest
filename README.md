# Mac Development Environment

## Overview

Automated macOS setup for development environment with dotfiles, Homebrew packages, and system configuration. Provides consistent development setup across machines with a single command.

## Setup

### Prerequisites

- macOS (tested on recent versions)
- Internet connection
- Administrator access

### Installation

```bash
cd mac
./install.sh
```

The installer will:

1. Install Xcode Command Line Tools
2. Install Homebrew package manager
3. Install packages from Brewfile
4. Apply macOS system defaults
5. Create symlinks for dotfiles

## Configuration

### Dotfile Structure

**Zsh Configuration:**

- Location: `zsh/.zshrc`
- Symlinked to: `~/.zshrc`
- Includes: aliases, functions, plugins

**WezTerm Terminal:**

- Location: `wezterm/wezterm.lua`
- Symlinked to: `~/.wezterm.lua`
- Features: custom key bindings, colors, fonts

**Starship Prompt:**

- Location: `starship/starship.toml`
- Symlinked to: `~/.config/starship.toml`
- Features: git status, language versions, command duration

**Raycast Scripts:**

- Location: `raycast-scripts/`
- Purpose: Automation scripts for Raycast app

### Homebrew Packages

Packages defined in `homebrew/Brewfile`:

**Development Tools:**

- Git, Node.js, Python, Go
- Docker, Docker Compose
- VS Code, JetBrains IDEs

**CLI Utilities:**

- tmux, neovim, fzf
- ripgrep, fd, bat
- jq, yq, httpie

**Applications:**

- Browsers (Chrome, Firefox)
- Communication (Slack, Discord)
- Productivity tools

**To customize:**
Edit `homebrew/Brewfile` and re-run installer.

### System Defaults

Applied by `scripts/osx-defaults.sh`:

**Keyboard:**

- Key repeat rate
- Delay until repeat

**Trackpad:**

- Tap to click
- Three finger drag

**Finder:**

- Show hidden files
- Show path bar
- Default view settings

**Dock:**

- Icon size
- Position
- Auto-hide behavior

## Usage

### Managing Dotfiles

**Creating Symlinks:**

```bash
cd mac
./scripts/symlinks.sh --create
```

**Removing Symlinks:**

```bash
cd mac
./scripts/symlinks.sh --delete
```

**Updating Dotfiles:**

1. Edit files in repository
2. Commit changes
3. Changes immediately active (symlinks)

### Installing Packages

**Add new package:**

1. Edit `homebrew/Brewfile`
2. Run: `brew bundle --file=homebrew/Brewfile`

**Update packages:**

```bash
brew update
brew upgrade
brew cleanup
```

### Applying System Defaults

```bash
cd mac
./scripts/osx-defaults.sh
```

Changes take effect after restart or logout/login.

### Component Scripts

**Install Prerequisites:**

```bash
./scripts/prerequisites.sh
```

Installs Xcode CLI tools and Homebrew.

**Install Brew Packages:**

```bash
./scripts/brew-install.sh
```

Installs packages from Brewfile.

**Apply macOS Defaults:**

```bash
./scripts/osx-defaults.sh
```

Configures system preferences.

**Manage Symlinks:**

```bash
./scripts/symlinks.sh --create  # Create dotfile symlinks
./scripts/symlinks.sh --delete  # Remove symlinks
```

## Troubleshooting

### Xcode CLI Tools Not Installing

```bash
# Remove existing installation
sudo rm -rf /Library/Developer/CommandLineTools

# Reinstall
xcode-select --install
```

### Homebrew Installation Fails

```bash
# Check Homebrew installation
which brew

# Reinstall Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew doctor
```

### Symlink Conflicts

```bash
# Check existing symlinks
ls -la ~ | grep "^l"

# Remove conflicting symlinks
rm ~/.zshrc
rm ~/.wezterm.lua

# Recreate symlinks
cd mac
./scripts/symlinks.sh --create
```

### System Defaults Not Applied

- Restart macOS after applying defaults
- Some settings require logout/login
- Check for macOS version compatibility

### Package Installation Fails

```bash
# Update Homebrew
brew update

# Check for issues
brew doctor

# View detailed error
brew install --verbose <package>

# Clean up and retry
brew cleanup
brew install <package>
```

## Best Practices

1. **Version Control Dotfiles**: Commit dotfile changes regularly
2. **Document Custom Aliases**: Comment complex aliases and functions
3. **Test Before Committing**: Test dotfile changes before committing
4. **Backup Before Updates**: Backup existing dotfiles before major changes
5. **Keep Brewfile Updated**: Document purpose of installed packages

## Customization

### Adding New Dotfiles

1. Create dotfile in appropriate directory (e.g., `zsh/`)
2. Add symlink logic to `scripts/symlinks.sh`
3. Test symlink creation/deletion
4. Update this documentation

### Custom Zsh Plugins

Add to `zsh/.zshrc`:

```bash
# Load custom plugins
source ~/.zsh/plugins/my-plugin.zsh
```

### Custom WezTerm Configuration

Edit `wezterm/wezterm.lua`:

```lua
-- Add custom key bindings
config.keys = {
  { key = 'K', mods = 'CMD', action = wezterm.action { ... } },
}
```

## References

- **OpenSpec Specification**: [openspec/specs/mac-development-environment/spec.md](../openspec/specs/mac-development-environment/spec.md)
- **Homebrew Documentation**: <https://docs.brew.sh/>
- **WezTerm Documentation**: <https://wezfurlong.org/wezterm/>
- **Starship Documentation**: <https://starship.rs/>
- **Related Files**:
  - [mac/install.sh](./install.sh) - Main installer
  - [homebrew/Brewfile](./homebrew/Brewfile) - Package list
  - [zsh/.zshrc](./zsh/.zshrc) - Zsh configuration
