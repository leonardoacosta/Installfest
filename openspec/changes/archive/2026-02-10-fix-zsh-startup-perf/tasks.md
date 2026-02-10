# Implementation Tasks

## Shell Batch

- [x] [1.1] [P-1] Strip .zshenv to env-vars only (DOTFILES, PATH, theme exports) [owner:shell-engineer]
- [x] [1.2] [P-1] Remove tool inits from shared.zsh (compinit, starship, zoxide, fzf, plugins) [owner:shell-engineer]
- [x] [1.3] [P-2] Verify .zshrc sources functions/ in correct order [owner:shell-engineer]
- [x] [1.4] [P-3] Test shell startup with `time zsh -i -c exit` before/after [owner:shell-engineer]
  - Baseline: ~1.5s
  - After: ~0.68s (55% improvement)

## Docs Batch

- [x] [2.1] [P-1] Rewrite CLAUDE.md to match actual structure [owner:technical-writer]
- [x] [2.2] [P-2] Remove references to non-existent /mac, /homelab directories [owner:technical-writer]
  - Removed all /mac, /homelab, /homelab-services references
  - Documented actual structure: zsh/, homebrew/, starship/, wezterm/, etc.

## Validation Batch

- [x] [3.1] Test Darwin platform (macOS) [owner:shell-engineer]
  - Platform detected, starship/zoxide available, DOTFILES set
- [x] [3.2] Test Linux platform (Arch) [owner:shell-engineer]
  - Syntax validation passed (linux.zsh)
- [x] [3.3] Test non-interactive: `zsh -c "echo \$DOTFILES"` [owner:shell-engineer]
  - DOTFILES exported correctly, PATH includes claude bin
