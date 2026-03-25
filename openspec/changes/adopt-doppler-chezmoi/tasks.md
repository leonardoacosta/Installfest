# Implementation Tasks

<!-- beads:epic:TBD -->

## Phase 1: Dead Code Removal + Quick Fixes

- [x] [1.1] [P-1] Delete sync.sh (313 lines of dead code)
- [x] [1.2] [P-1] Delete wezterm/ directory and windows/wezterm-windows.lua
- [x] [1.3] [P-1] Remove WEZTERM_THEME export from zsh/.zshenv
- [x] [1.4] [P-1] Remove iTerm2 shell integration source line from zsh/.zshrc
- [x] [1.5] [P-1] Remove direnv references from zsh/functions/load-tools.zsh
- [x] [1.6] [P-1] Remove 14 orphaned homelab patterns + 2 duplicates from .gitignore
- [x] [1.7] [P-1] Replace .vscode/settings.json with shell-relevant config
- [x] [1.8] [P-1] Strip OpenSpec managed blocks from CLAUDE.md
- [x] [1.9] [P-1] Delete root AGENTS.md
- [x] [1.10] [P-1] Remove scrollback-limit line from ghostty/config (restores 10MB default)
- [x] [1.11] [P-1] Add `set -g set-clipboard on` to tmux/tmux.conf (OSC 52 clipboard)
- [x] [1.12] [P-1] Fix tmux.conf "Nord theme" comment → "One Hunter Vercel"
- [x] [1.13] [P-1] Change tmux status-interval from 1 to 15
- [x] [1.14] [P-1] Fix Starship docker_context: $path → $context, add compose.yml to detect_files, remove Dockerfile from detect_extensions
- [x] [1.15] [P-1] Add Starship [hostname] module with ssh_only = true
- [x] [1.16] [P-1] Delete orphaned onedark palette from starship.toml
- [x] [1.17] [P-1] Add setopt HIST_IGNORE_SPACE to zsh/rc/shared.zsh
- [x] [1.18] [P-2] Port 14 missing tmux keybindings from wezterm.lua to ghostty/config (Cmd+T/W/1-9/D/K/Shift+[/])
- [x] [1.19] [P-2] Fix Karabiner: delete duplicate Cmd+Space rule (rule 19), fix left_command → command inconsistency
- [x] [1.20] [P-2] Add Karabiner config to scripts/symlinks.conf
- [x] [1.21] [P-2] Extract cmux scripts from ghostty/ to scripts/ (cmux-workspaces.sh, cmux-debug.sh, mux-remote.sh)
- [x] [1.22] [P-2] Update mux alias in zsh/rc/shared.zsh to point to new scripts/ location
- [x] [1.23] [P-2] Fix mic-priority LaunchAgent: absolute paths in plist, create symlink, load with launchctl bootstrap
- [x] [1.24] [P-2] Consolidate LaunchAgent installation to one path (symlinks.conf, not install.sh)
- [x] [1.25] [P-2] Replace deprecated launchctl load with launchctl bootstrap in install.sh

## Phase 2: Security + SSH

- [ ] [2.1] [P-1] [user] Run ssh-mesh/scripts/rotate-keys.sh (generates new keys, deploys, scrubs history)
- [x] [2.2] [P-1] Merge ssh-mesh/scripts/setup-cloudpc.ps1 into windows/setup.ps1
- [x] [2.3] [P-1] Delete ssh-mesh/scripts/setup-cloudpc.ps1 after merge
- [x] [2.4] [P-1] chmod 600 ~/.env (interim until Doppler migration)
- [x] [2.5] [P-2] Add pre-commit hook for secret scanning (gitleaks or similar)
- [x] [2.6] [P-2] Add keepalive/timeout settings to homelab and cloudpc SSH configs

## Phase 3: Doppler + mise Adoption

- [x] [3.1] [P-1] brew install dopplerhq/cli/doppler && add to Brewfile
- [ ] [3.2] [P-1] [user] Migrate ~/.env secrets into Doppler homelab/prd config
- [x] [3.3] [P-1] Replace `source ~/.env` block in .zshrc with doppler-based loading
- [x] [3.4] [P-1] Delete USE_DOPPLER, DOPPLER_PROJECT, DOPPLER_CONFIG from .zshenv (Doppler CLI handles this)
- [x] [3.5] [P-1] brew install mise && add to Brewfile
- [x] [3.6] [P-1] Create .mise.toml with node, pnpm versions
- [x] [3.7] [P-1] Remove NVM sourcing from zsh/rc/darwin.zsh
- [x] [3.8] [P-1] Remove brew "node" and brew "nvm" from Brewfile
- [x] [3.9] [P-1] Update zsh/functions/load-tools.zsh: replace NVM init with mise activate
- [x] [3.10] [P-2] Regenerate Brewfile: brew bundle dump --describe, curate, add missing CLI tools
- [x] [3.11] [P-2] Add mise to scripts/install-arch.sh for Arch parity

## Phase 4: chezmoi Migration

- [ ] [4.1] [P-1] brew install chezmoi && add to Brewfile
- [ ] [4.2] [P-1] chezmoi init --source=. (initialize chezmoi in current repo)
- [ ] [4.3] [P-1] Create .chezmoi.toml.tmpl with machine-specific data (hostname, OS, theme)
- [ ] [4.4] [P-1] Convert zsh/.zshenv → dot_zshenv.tmpl (template machine-specific vars)
- [ ] [4.5] [P-1] Convert zsh/.zshrc → dot_zshrc
- [ ] [4.6] [P-1] Convert zsh/rc/ → dot_zsh/rc/ (shared.zsh, darwin.zsh, linux.zsh)
- [ ] [4.7] [P-1] Convert zsh/functions/ → dot_zsh/functions/
- [ ] [4.8] [P-1] Convert zsh/completions/ → dot_zsh/completions/
- [ ] [4.9] [P-1] Convert ghostty/config → dot_config/ghostty/config.tmpl (theme from chezmoi data)
- [ ] [4.10] [P-1] Convert tmux/tmux.conf → dot_config/tmux/tmux.conf
- [ ] [4.11] [P-1] Convert tmux/one-hunter-vercel-theme.conf → dot_config/tmux/one-hunter-vercel-theme.conf
- [ ] [4.12] [P-1] Convert starship/starship.toml → dot_config/starship/starship.toml.tmpl (palette from chezmoi data)
- [ ] [4.13] [P-1] Create .chezmoiignore with platform-specific ignores
- [ ] [4.14] [P-1] Delete scripts/symlinks.sh + scripts/symlinks.conf (chezmoi replaces both)
- [ ] [4.15] [P-1] Convert install.sh to chezmoi run_once_install-packages.sh.tmpl (platform-conditional)
- [ ] [4.16] [P-2] Create run_once_install-arch.sh.tmpl from scripts/install-arch.sh
- [ ] [4.17] [P-2] Move Karabiner config under chezmoi management (dot_config/karabiner/)
- [ ] [4.18] [P-2] Move LaunchAgent plists under chezmoi management
- [ ] [4.19] [P-2] Test chezmoi apply on Mac — verify all symlinks/files are correct
- [ ] [4.20] [P-2] Test chezmoi apply on Homelab (Arch) — verify cross-platform templates work
- [ ] [4.21] [P-2] Verify chezmoi diff and chezmoi verify work for drift detection

## Phase 5: Theme Switching System

- [ ] [5.1] [P-1] Define theme data in .chezmoi.toml.tmpl (theme name, palette values)
- [ ] [5.2] [P-1] Template starship.toml.tmpl to use {{ .theme }} for palette selection
- [ ] [5.3] [P-1] Template ghostty/config.tmpl to use theme from chezmoi data
- [ ] [5.4] [P-1] Template tmux theme sourcing to use chezmoi data
- [ ] [5.5] [P-2] Remove dead TMUX_THEME, STARSHIP_THEME, NVIM_THEME exports from .zshenv (replaced by chezmoi data)
- [ ] [5.6] [P-2] Test theme switching: change value in .chezmoi.toml, run chezmoi apply, verify all tools update

## Phase 6: Project Registry Consolidation

- [x] [6.1] [P-1] Create projects.toml at repo root with all project codes, names, categories, icons, paths, tiers
- [x] [6.2] [P-1] Write scripts/generate-raycast.sh (~50 lines) that reads projects.toml and emits per-project scripts
- [x] [6.3] [P-1] Generate Raycast scripts from projects.toml
- [x] [6.4] [P-1] Delete 60 hand-written Raycast scripts
- [ ] [6.5] [P-2] [deferred] Update scripts/cmux-workspaces.sh to read project registry from projects.toml
- [ ] [6.6] [P-2] [deferred] Update scripts/mux-remote.sh to read from projects.toml
- [ ] [6.7] [P-2] [deferred] Create chezmoi run_onchange for Raycast regeneration when projects.toml changes

## Phase 7: Documentation

- [ ] [7.1] [P-1] Rewrite README.md from scratch (fix 12 factual errors, document chezmoi workflow)
- [ ] [7.2] [P-1] Update CLAUDE.md directory structure (add 5 missing directories, reflect chezmoi layout)
- [ ] [7.3] [P-1] Clean .gitignore (remove homelab cruft, add chezmoi-specific ignores)
- [ ] [7.4] [P-2] Update ssh-mesh/README.md to reflect new key setup
- [ ] [7.5] [P-2] Delete openspec/ directory (this spec self-archives as the final act)
