# Proposal: Fix ZSH Startup Performance

## Change ID

`fix-zsh-startup-perf`

## Summary

Eliminate shell startup performance penalty caused by double/triple sourcing of configuration files and tool initializations. Clean separation between `.zshenv` (environment variables) and `.zshrc` (interactive setup).

## Context

- **Related**: Architecture review identified critical issues
- **Extends**: Existing `zsh/` configuration structure
- **Impact**: Every shell startup currently runs expensive inits 2-3x

## Motivation

Current `.zshenv` and `.zshrc` both source the same files (`shared.zsh`, `darwin.zsh`/`linux.zsh`), causing:

- `compinit` called 2x (expensive completion system init)
- `starship init` called 2x (subprocess spawn)
- `zoxide init` called 2x (eval overhead)
- `load-plugins.zsh` sourced 2x (syntax highlighting loaded twice)

This doubles shell startup time unnecessarily.

## Requirements

1. **Clean separation**: `.zshenv` sets environment variables ONLY
2. **Single init point**: All tool inits happen in `.zshrc` via `functions/`
3. **Strip shared.zsh**: Remove tool inits, keep only `setopt` and aliases
4. **Update CLAUDE.md**: Document actual repository structure

## Scope

### IN

- Restructure `.zshenv` to env-vars only
- Restructure `.zshrc` as single source of interactive setup
- Clean `shared.zsh` of all tool initializations
- Update `CLAUDE.md` to reflect actual directory structure

### OUT

- Adding new features
- Changing tool configurations
- Modifying platform-specific files beyond sourcing changes

## Impact

| Area | Change |
|------|--------|
| zsh/.zshenv | Strip to DOTFILES, PATH, exports only |
| zsh/.zshrc | Remains interactive entry point |
| zsh/rc/shared.zsh | Remove lines 46, 52, 59-78 (tool inits) |
| CLAUDE.md | Rewrite to match actual structure |

## Risks

| Risk | Mitigation |
|------|------------|
| Non-interactive scripts may need tools | Test with `zsh -c "command"` |
| Platform files may have deps on shared | Audit darwin.zsh, linux.zsh first |

## Success Criteria

- Shell startup time reduced by ~50%
- No double `eval` calls visible in `zsh -xv` trace
- CLAUDE.md accurately describes repo structure
