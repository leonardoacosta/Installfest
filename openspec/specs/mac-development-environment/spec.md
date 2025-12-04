# mac-development-environment Specification

## Purpose

Automate macOS development environment setup with dotfiles, package management, system configuration, and terminal customization for consistent developer experience.

## Requirements

### Requirement: Automated Installation Process

The system SHALL provide automated installation via install.sh script.

#### Scenario: Initial installation
- **WHEN** user runs mac/install.sh
- **THEN** prerequisites script is executed first
- **AND** Homebrew packages are installed
- **AND** macOS defaults are applied
- **AND** dotfiles are symlinked
- **AND** progress is shown for each step

#### Scenario: Interactive prompts
- **WHEN** installation requires user input
- **THEN** clear prompts explain what is needed
- **AND** default values are suggested
- **AND** user can skip optional steps
- **AND** selections are remembered for future runs

### Requirement: Prerequisites Installation

The system SHALL install Xcode Command Line Tools and Homebrew.

#### Scenario: Xcode CLI tools check
- **WHEN** prerequisites script runs
- **THEN** checks if Xcode CLI tools are installed
- **AND** prompts installation if missing
- **AND** waits for installation to complete
- **AND** verifies installation success

#### Scenario: Homebrew installation
- **WHEN** Homebrew is not installed
- **THEN** downloads Homebrew install script
- **AND** executes installation with user confirmation
- **AND** adds Homebrew to PATH
- **AND** verifies brew command is available

### Requirement: Package Management

The system SHALL install development tools and applications via Homebrew.

#### Scenario: Brewfile installation
- **WHEN** brew-install.sh is executed
- **THEN** Brewfile is processed by Homebrew Bundle
- **AND** formulae (CLI tools) are installed
- **AND** casks (applications) are installed
- **AND** Mac App Store apps are installed (if mas configured)
- **AND** failures are logged but don't stop process

#### Scenario: Package categories
- **WHEN** Brewfile is processed
- **THEN** development tools are installed (git, node, python)
- **AND** terminal tools are installed (zsh, starship, eza, bat)
- **AND** applications are installed (WezTerm, VSCode, Docker)
- **AND** optional packages can be commented out
- **AND** custom taps can be added

### Requirement: macOS System Defaults

The system SHALL apply custom macOS system preferences.

#### Scenario: System defaults application
- **WHEN** osx-defaults.sh is executed
- **THEN** Dock settings are configured
- **AND** Finder preferences are set
- **AND** keyboard and trackpad settings are applied
- **AND** Safari and security settings are configured
- **AND** changes require logout to fully apply

#### Scenario: Preferences categories
- **WHEN** defaults are applied
- **THEN** Dock: position, size, auto-hide configured
- **AND** Finder: show hidden files, path bar enabled
- **AND** Keyboard: key repeat rate increased
- **AND** Trackpad: tap to click enabled
- **AND** Screenshots: save location customized

### Requirement: Dotfile Management

The system SHALL symlink dotfiles from repository to home directory.

#### Scenario: Create symlinks
- **WHEN** symlinks.sh --create is executed
- **THEN** .zshrc is symlinked to ~/
- **AND** .wezterm.lua is symlinked to ~/.config/wezterm/
- **AND** starship.toml is symlinked to ~/.config/
- **AND** existing files are backed up with .backup suffix
- **AND** symlinks point to repository files

#### Scenario: Delete symlinks
- **WHEN** symlinks.sh --delete is executed
- **THEN** all managed symlinks are removed
- **AND** backup files are restored if present
- **AND** config directories remain
- **AND** unmanaged files are not affected

### Requirement: Zsh Configuration

The system SHALL configure Zsh shell with plugins and customizations.

#### Scenario: Zsh setup
- **WHEN** .zshrc is loaded
- **THEN** Zsh plugins are sourced (if present)
- **AND** Starship prompt is initialized
- **AND** custom aliases are defined
- **AND** PATH is configured with Homebrew, local bins
- **AND** environment variables are set

#### Scenario: Shell customization
- **WHEN** user opens terminal
- **THEN** Starship prompt shows git status, language versions
- **AND** syntax highlighting works (if plugin installed)
- **AND** auto-completion is enhanced
- **AND** history search is available

### Requirement: WezTerm Terminal Configuration

The system SHALL configure WezTerm terminal emulator.

#### Scenario: WezTerm configuration
- **WHEN** .wezterm.lua is loaded
- **THEN** color scheme is applied
- **AND** font and size are configured
- **AND** key bindings are customized
- **AND** tab bar settings are applied
- **AND** window transparency is set (if configured)

#### Scenario: Configuration sync
- **WHEN** wezterm config in repository is updated
- **THEN** changes apply immediately (symlink)
- **AND** no manual copy needed
- **AND** configuration is version controlled
- **AND** changes can be reverted via git

### Requirement: Starship Prompt Configuration

The system SHALL configure Starship shell prompt.

#### Scenario: Starship setup
- **WHEN** starship.toml is loaded
- **THEN** prompt modules are configured
- **AND** git branch and status are shown
- **AND** language versions are displayed (node, python, rust)
- **AND** command duration is shown
- **AND** custom symbols and colors are applied

#### Scenario: Performance
- **WHEN** shell prompt is rendered
- **THEN** prompt appears in < 50ms
- **AND** git status updates quickly
- **AND** directory navigation is smooth
- **AND** no noticeable lag

### Requirement: Documentation and Maintenance

The system SHALL provide documentation for setup and maintenance.

#### Scenario: Setup documentation
- **WHEN** user needs to set up Mac environment
- **THEN** mac/README.md contains installation steps
- **AND** CLAUDE.md references Mac Setup section
- **AND** troubleshooting guide is available
- **AND** customization instructions are provided

#### Scenario: Updating packages
- **WHEN** user wants to update installed packages
- **THEN** brew update && brew upgrade updates all packages
- **AND** brew cleanup removes old versions
- **AND** Brewfile can be regenerated with brew bundle dump
- **AND** new packages can be added to Brewfile

### Requirement: Raycast Scripts Integration

The system SHALL provide Raycast automation scripts.

#### Scenario: Raycast scripts
- **WHEN** Raycast is installed
- **THEN** custom scripts are available in raycast-scripts/
- **AND** scripts can be triggered via Raycast
- **AND** script permissions are managed
- **AND** scripts integrate with system

## Related Documentation

- **Setup Guide**: `/mac/README.md` - Complete Mac setup documentation
- **Main Documentation**: `/CLAUDE.md` - Mac Setup section (lines 66-123)
- **Brewfile**: `mac/homebrew/Brewfile` - Package definitions
- **Zsh Config**: `mac/zsh/.zshrc` - Shell configuration
- **WezTerm Config**: `mac/wezterm/wezterm.lua` - Terminal configuration
- **Starship Config**: `mac/starship/starship.toml` - Prompt configuration
- **Scripts**: `mac/scripts/` - Installation and configuration scripts
