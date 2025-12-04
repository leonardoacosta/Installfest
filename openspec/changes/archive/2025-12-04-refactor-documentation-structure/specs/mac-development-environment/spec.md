# Mac Development Environment Specification

## ADDED Requirements

### Requirement: Interactive Installation Wizard
Mac setup SHALL provide an interactive installation script that automates environment configuration.

#### Scenario: Running mac setup installer
- **WHEN** user runs mac/install.sh
- **THEN** interactive installer SHALL prompt for confirmation
- **AND** installs Xcode CLI tools, Homebrew, system packages
- **AND** applies macOS defaults and creates dotfile symlinks

### Requirement: Homebrew Package Management
Mac setup SHALL install and configure Homebrew with specified packages from Brewfile.

#### Scenario: Installing Homebrew packages
- **WHEN** installer runs scripts/brew-install.sh
- **THEN** Homebrew SHALL be installed if not present
- **AND** packages from homebrew/Brewfile SHALL be installed
- **AND** cask applications are installed

### Requirement: Dotfile Symlink Management
Mac setup SHALL create symlinks for dotfiles to appropriate home directory locations.

#### Scenario: Creating dotfile symlinks
- **WHEN** installer runs scripts/symlinks.sh --create
- **THEN** symlinks SHALL be created for: zsh/.zshrc, wezterm/wezterm.lua, starship/starship.toml
- **AND** existing files are backed up before overwriting

#### Scenario: Removing dotfile symlinks
- **WHEN** user runs scripts/symlinks.sh --delete
- **THEN** all symlinks created by install SHALL be removed
- **AND** environment returns to pre-install state

### Requirement: macOS System Defaults
Mac setup SHALL apply macOS system defaults for improved developer experience.

#### Scenario: Applying macOS defaults
- **WHEN** installer runs scripts/osx-defaults.sh
- **THEN** system preferences SHALL be configured
- **AND** includes: keyboard settings, trackpad, Finder, Dock customizations
- **AND** settings take effect after restart

### Requirement: Shell Configuration
Zsh SHALL be configured with custom plugins, aliases, and prompt.

#### Scenario: Loading Zsh configuration
- **WHEN** user opens new terminal after install
- **THEN** zsh/.zshrc SHALL be loaded
- **AND** Starship prompt is active
- **AND** custom aliases and functions are available

### Requirement: Terminal Emulator Configuration
WezTerm SHALL be configured as the primary terminal emulator with custom settings.

#### Scenario: Loading WezTerm configuration
- **WHEN** WezTerm is launched
- **THEN** wezterm/wezterm.lua configuration SHALL be applied
- **AND** custom key bindings, colors, and font settings are active
