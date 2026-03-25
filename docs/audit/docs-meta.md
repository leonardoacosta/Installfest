# Documentation & Metadata Audit

> Domain: `README.md`, `CLAUDE.md`, `.gitignore`, `.vscode/settings.json`, `.claude/settings.json`,
> `.claude/settings.local.json`, `AGENTS.md`, `.cursorignore`
> Generated: 2026-03-25

**Health Score: POOR**

The documentation layer is substantially out of date. The README describes a repository that no
longer exists ("cd mac", WezTerm as primary terminal, tools not in Brewfile, broken internal links).
CLAUDE.md is closer to reality but still missing 5 top-level directories. The .gitignore carries 14
homelab service directory patterns from a different repo that have never existed here. The VS Code
settings configure a T3 monorepo (ESLint, Prettier, Tailwind, TypeScript SDK) that this dotfiles
repo is not.

---

## 1. Current Setup

### Files Inventoried

| File | Lines | Purpose | Last Modified |
|------|------:|---------|---------------|
| `README.md` | 298 | User-facing setup guide, installation, configuration, troubleshooting | 2025-02-10 |
| `CLAUDE.md` | 125 | Claude Code project guide: repo overview, directory structure, shell flow, commands | 2026-02-10 |
| `.gitignore` | 57 | Ignores secrets, service config dirs, caches, OS files, SSH keys | 2025-01-28 |
| `.vscode/settings.json` | 53 | VS Code settings (ESLint, Prettier, Tailwind, TypeScript, perf exclusions) | 2025-03-01 |
| `.claude/settings.json` | 24 | Claude Code hooks (beads flush on stop) and permissions (docker, git, bd) | 2026-02-28 |
| `.claude/settings.local.json` | 12 | Local Claude Code permissions (defaults read, notify, bash, git) | 2026-02-28 |
| `AGENTS.md` | 18 | OpenSpec agent instructions block (managed by `openspec update`) | 2025-12-05 |
| `.cursorignore` | 1 | Tells Cursor to ignore `env` directory | 2024-09-30 |

---

## 2. Intent Analysis

| File | Intended Audience | Actual Audience Match |
|------|-------------------|----------------------|
| `README.md` | New machine setup / future self | **Mismatch** -- instructions are wrong (cd mac, wrong tools, wrong paths). A user following this README would fail at step 1. |
| `CLAUDE.md` | Claude Code agents working in this repo | **Partial match** -- shell flow and key concepts are accurate. Directory structure is incomplete (missing 5 of 11 top-level dirs). |
| `.gitignore` | Git | **Mismatch** -- 14 of 16 specific directory patterns belong to a homelab docker-compose repo, not this dotfiles repo. |
| `.vscode/settings.json` | VS Code / Cursor | **Mismatch** -- configures ESLint, Prettier, Tailwind CSS, TypeScript SDK for a web development monorepo. This is a shell/dotfiles repo with zero JS/TS code. |
| `.claude/settings.json` | Claude Code | **Match** -- beads flush hook and permissions are appropriate. |
| `.claude/settings.local.json` | Claude Code (local) | **Match** -- additional permissions for local-only operations. |
| `AGENTS.md` | OpenSpec system | **Match** -- standard managed block. |
| `.cursorignore` | Cursor editor | **Minimal** -- only ignores `env` directory. |

---

## 3. Cross-Domain Interactions

### Documentation interdependencies

| From | To | Interaction | Status |
|------|----|-------------|--------|
| `README.md` | `install.sh` | README says `cd mac && ./install.sh` | **BROKEN** -- no `mac/` directory exists. Correct invocation is `./install.sh` from repo root. |
| `README.md` | `scripts/symlinks.sh` | README says `./scripts/symlinks.sh --create` from `mac/` subdir | **BROKEN** -- symlinks.sh is at `scripts/symlinks.sh` relative to repo root, not a `mac/` subdirectory. |
| `README.md` | `homebrew/Brewfile` | README claims Docker, neovim, fzf, ripgrep, fd, bat, jq, yq, httpie are in Brewfile | **WRONG** -- none of these are in the Brewfile. |
| `README.md` | `openspec/specs/mac-development-environment/spec.md` | References link at line 291 | **BROKEN** -- `openspec/specs/` directory does not exist. Only `openspec/changes/` exists. |
| `README.md` | `wezterm/wezterm.lua` | Claims WezTerm is primary terminal, symlinked to `~/.wezterm.lua` | **STALE** -- Ghostty is primary. Symlink target is `~/.config/wezterm/wezterm.lua`, not `~/.wezterm.lua`. WezTerm is commented out of Brewfile and symlinks.conf. |
| `CLAUDE.md` | Actual directory tree | Documents 8 top-level dirs + root files | **INCOMPLETE** -- missing `ghostty/`, `karabiner/`, `launchd/`, `windows/`, `docs/` directories. |
| `CLAUDE.md` | `scripts/` contents | Lists 6 scripts | **INCOMPLETE** -- missing `ani-cli.sh`, `dbpro.sh`, `mic-priority.sh`, `terminal.sh`, `utils.sh`, `youtube-transcript.sh` (6 more files). |
| `.gitignore` | Repo contents | 14 homelab service dirs (radarr, sonarr, etc.) | **WRONG REPO** -- none of these directories exist or have ever existed in this repo. |
| `.vscode/settings.json` | Repo contents | Configures `tailwindCSS.configFile: ./tooling/tailwind/web.ts` | **WRONG REPO** -- no `tooling/` directory, no `web.ts`, no TypeScript in this repo. |

---

## 4. Best Practices Audit

### README.md

Best practices for dotfiles READMEs recommend:
([How to Manage Dotfiles With Git](https://www.control-escape.com/linux/dotfiles/),
[dotfiles.github.io tips](https://dotfiles.github.io/tips/),
[How to Write a 4000 Stars README](https://www.daytona.io/dotfiles/how-to-write-4000-stars-github-readme-for-your-project))

| Best Practice | Status | Evidence |
|---------------|--------|----------|
| One-command bootstrap | FAIL | README says `cd mac && ./install.sh` -- the `mac/` directory does not exist |
| Accurate tool list | FAIL | Lists 9 tools not in Brewfile (Docker, neovim, fzf, ripgrep, fd, bat, jq, yq, httpie) |
| Current primary terminal | FAIL | Lists WezTerm; actual primary is Ghostty |
| Correct symlink paths | FAIL | Claims `~/.wezterm.lua`; actual target is `~/.config/wezterm/wezterm.lua` (and WezTerm is commented out of symlinks.conf anyway) |
| Platform scope documented | PARTIAL | Title says "Mac Development Environment"; repo actually supports macOS, Arch Linux, and Windows |
| Internal links work | FAIL | Link to `openspec/specs/mac-development-environment/spec.md` is broken (directory does not exist) |
| Avoids unnecessary length | FAIL | 298 lines, much of it wrong troubleshooting advice for a `mac/` subdirectory that does not exist |
| Mentions security considerations | PASS | Does not expose secrets |
| Quick-start section | FAIL | Quick-start instructions are wrong |

### .gitignore

Best practices for dotfiles .gitignore files recommend:
([Which Dotfiles Should You Commit to Git](https://blog.openreplay.com/dotfiles-commit-ignore/),
[dotfiles.github.io tips](https://dotfiles.github.io/tips/),
[How to manage dotfiles with git](https://pgaskin.net/posts/git-dotfiles/))

| Best Practice | Status | Evidence |
|---------------|--------|----------|
| Ignore secrets and keys | PASS | `.env`, `*.key`, `*.pem`, `*.crt`, `ssh-mesh/keys/` all covered |
| Ignore OS artifacts | PASS | `.DS_Store`, `Thumbs.db`, `desktop.ini` covered |
| Ignore editor artifacts | PASS | `.vscode/`, `.idea/`, `*.sublime-*` covered |
| Ignore cache/temp | PASS | `*/cache/`, `*/tmp/`, `*.tmp`, `*.swp` covered |
| Only include patterns that match | FAIL | 14 homelab service directories (radarr, sonarr, jellyseerr, etc.) have never existed in this repo |
| Consider allowlist approach | N/A | Not using bare repo; standard .gitignore is appropriate |
| No secrets in tracked files | WARN | `ssh-mesh/keys/id_ed25519` is gitignored by pattern but the file exists on disk per discovery.md |
| Duplicate patterns | WARN | `.env` appears on lines 2 and 6 (duplicate); `*~` appears on lines 38 and 55 (duplicate) |

### CLAUDE.md

| Best Practice | Status | Evidence |
|---------------|--------|----------|
| Accurate repo overview | PASS | "Personal dotfiles and development environment configuration for macOS and Arch Linux" is correct |
| Directory structure matches reality | FAIL | Missing ghostty/, karabiner/, launchd/, windows/, docs/ (5 of 11 top-level dirs missing) |
| Key concepts are useful | PASS | Shell flow diagram, platform detection, SSH mesh summary are accurate and helpful |
| Essential commands are correct | PASS | `./install.sh`, `scripts/symlinks.sh`, shell testing commands are all correct |
| Notes for Claude Code are actionable | PASS | Platform-awareness, no-duplicate-inits, symlinks, OpenSpec instructions are good |

---

## 5. Tool Choices

### .vscode/settings.json -- Wrong Project Configuration

This file configures:

| Setting | Value | Relevance to Dotfiles Repo |
|---------|-------|---------------------------|
| ESLint code actions on save | `source.fixAll.eslint: explicit` | **Irrelevant** -- no ESLint, no JS/TS |
| Prettier default formatter | `esbenp.prettier-vscode` | **Irrelevant** -- no JS/TS/JSON to format |
| Tailwind CSS class functions | `cva, cx, cn` | **Irrelevant** -- no Tailwind, no CSS |
| Tailwind config file | `./tooling/tailwind/web.ts` | **Broken** -- path does not exist |
| TypeScript SDK | `node_modules/typescript/lib` | **Irrelevant** -- no TypeScript, no node_modules |
| TypeScript auto-import exclusions | zod, next/router | **Irrelevant** -- no Next.js, no Zod |
| cSpell words | HMAC, POSTHOG, Vercel, homelab, Installfest | Only "homelab" and "Installfest" apply |
| Watcher exclusions | node_modules, .next, .turbo, .pnpm-store | **Irrelevant** -- none of these directories exist |
| Git disabled | `git.enabled: false` | **Reasonable** -- prevents VS Code from competing with command-line git |

**Verdict**: This is a copy-paste from a T3 monorepo project. Only `git.enabled: false`,
`git.autoRepositoryDetection: false`, and the cSpell words have any relevance here. The rest is
noise that could confuse contributors or cause VS Code extension errors when paths don't resolve.

### .claude/settings.json -- Appropriate

| Setting | Relevance |
|---------|-----------|
| Stop hook: beads flush | Appropriate for beads workflow |
| Permission: docker, docker-compose | Minor -- docker not used in this repo, but harmless |
| Permission: bd (beads) | Appropriate |
| Permission: git | Appropriate |

### .claude/settings.local.json -- Appropriate

All permissions are reasonable for local development operations.

### .cursorignore -- Minimal

Only ignores `env`. Could be expanded to match `.gitignore` patterns for better editor performance.

---

## 6. Configuration Quality

### README.md -- CRITICAL: 12 Factual Errors

| Line(s) | Claim | Reality | Severity |
|----------|-------|---------|----------|
| 1 | Title: "Mac Development Environment" | Repo supports macOS, Arch Linux, AND Windows | Medium |
| 17-18 | `cd mac && ./install.sh` | No `mac/` directory. Correct: `./install.sh` from repo root | **CRITICAL** |
| 41-44 | WezTerm is listed as primary terminal | Ghostty is primary (in Brewfile, in symlinks.conf, in active use). WezTerm is commented out of both. | High |
| 43 | WezTerm symlinked to `~/.wezterm.lua` | Actual symlink target is `~/.config/wezterm/wezterm.lua` (when it was active) | High |
| 63-64 | "Git, Node.js, Python, Go" in Brewfile | Brewfile has Node.js but NOT Python, Go, or Git (as brew formula) | High |
| 65 | "Docker, Docker Compose" in Brewfile | NOT in Brewfile. Docker is only in `install-arch.sh` (Linux) | High |
| 66 | "VS Code, JetBrains IDEs" in Brewfile | VS Code is commented out. No JetBrains IDEs in Brewfile. GitKraken is there (not JetBrains). | High |
| 69 | "tmux, neovim, fzf" in Brewfile | tmux is there. neovim and fzf are NOT in Brewfile. | High |
| 70 | "ripgrep, fd, bat" in Brewfile | NONE of these are in Brewfile | High |
| 71 | "jq, yq, httpie" in Brewfile | NONE of these are in Brewfile | High |
| 114-116, 222-225 | Commands reference `cd mac` subdir | No `mac/` directory exists | **CRITICAL** |
| 274-276 | Custom plugin example: `source ~/.zsh/plugins/my-plugin.zsh` | Plugins are loaded via `load-plugins.zsh` from Homebrew/system paths, not `~/.zsh/plugins/` | Medium |
| 291 | Link to `openspec/specs/mac-development-environment/spec.md` | `openspec/specs/` does not exist | Medium |

### CLAUDE.md -- 5 Missing Directories

The directory structure tree at lines 30-63 lists 8 top-level entries. The actual repo has 13
non-hidden top-level directories:

| Directory | In CLAUDE.md? |
|-----------|---------------|
| `zsh/` | Yes |
| `homebrew/` | Yes |
| `starship/` | Yes |
| `wezterm/` | Yes |
| `tmux/` | Yes |
| `ssh-mesh/` | Yes |
| `raycast-scripts/` | Yes |
| `scripts/` | Yes |
| `ghostty/` | **MISSING** |
| `karabiner/` | **MISSING** |
| `launchd/` | **MISSING** |
| `windows/` | **MISSING** |
| `docs/` | **MISSING** |

The `scripts/` listing is also incomplete -- it shows 6 files but 13 exist (missing `ani-cli.sh`,
`dbpro.sh`, `mic-priority.sh`, `terminal.sh`, `utils.sh`, `youtube-transcript.sh`).

CLAUDE.md does NOT list Ghostty as a terminal at all, which is a significant omission given Ghostty
is the primary terminal.

### .gitignore -- 14 Orphaned Patterns + 2 Duplicates

Lines 16-30 list homelab service directories:

```
adguardhome/
tailscale/state/
radarr/
sonarr/
lidarr/
bazarr/
prowlarr/
jellyseerr/
qbittorrent/
nzbget/
gluetun/
ollama_data/
ollama_webui_data/
flaresolverr/
samba/
```

None of these directories have ever existed in this repository. These patterns were likely copied
from a homelab docker-compose repository (the `hl` project). They are harmless but add noise and
suggest the .gitignore was not written for this repo.

Duplicates:
- `.env` appears on line 2 and line 6
- `*~` appears on line 38 and line 55

### .vscode/settings.json -- Wrong Project

As detailed in Section 5, this file configures ESLint, Prettier, Tailwind CSS, and TypeScript for a
web development monorepo. This is a dotfiles repo containing shell scripts, Lua configs, and TOML
files. The settings file is from a different project entirely.

---

## 7. Architecture Assessment

### Documentation Layering

The repo has a reasonable documentation architecture in principle:

```
README.md       -- User-facing: how to install and use
CLAUDE.md       -- AI-facing: how the repo is structured, for agent assistance
AGENTS.md       -- OpenSpec-facing: managed block for spec tooling
.gitignore      -- Git-facing: what to exclude
.vscode/        -- Editor-facing: workspace settings
.claude/        -- AI tool-facing: hooks and permissions
```

This separation of concerns is good. The problem is execution: README and CLAUDE.md have drifted
from reality, .gitignore and .vscode were imported from other repos, and nobody caught it because
dotfiles repos rarely get documentation reviews.

### CLAUDE.md as the Source of Truth

CLAUDE.md is the most accurate documentation file. Its shell configuration flow diagram, platform
detection pattern, and "Notes for Claude Code" section are all correct and useful. The main gap is
the incomplete directory structure. If only one file gets updated, it should be CLAUDE.md.

### README.md as a Liability

The README is currently net-negative. A new-machine setup following its instructions would:
1. Fail immediately (`cd mac` -- directory does not exist)
2. Set wrong expectations about installed tools (lists 9 tools not in Brewfile)
3. Reference the wrong terminal emulator (WezTerm instead of Ghostty)
4. Point to a broken internal link (openspec/specs/ does not exist)

A user would be better served by reading `install.sh` directly.

---

## 8. Missing Capabilities

| Capability | Needed? | Rationale |
|------------|---------|-----------|
| CHANGELOG | No | Personal dotfiles repo; git log is sufficient. |
| LICENSE | Optional | Not needed for private use. If ever made public, MIT or Unlicense would be standard. |
| Architecture diagram | Optional | The shell flow diagram in CLAUDE.md serves this purpose well. A visual of the SSH mesh topology already exists in `ssh-mesh/README.md`. |
| Contributing guide | No | Single-user repo. |
| `ssh-mesh/README.md` currency | Yes | The SSH mesh README is current and detailed (227 lines). It documents the 3-machine topology, connection matrix, setup instructions, and troubleshooting. **This is the best-maintained documentation in the repo.** |
| Ghostty documentation in README | Yes | Ghostty is the primary terminal but is not mentioned anywhere in README.md. |
| Windows documentation in README | Yes | Windows setup (`windows/setup.ps1`, 679 lines) is substantial but invisible from README.md. |
| `.shellcheckrc` | Optional | Would improve shell script linting. |
| `editorconfig` | Optional | Would standardize formatting across shell, Lua, TOML files. |

---

## 9. Redundancies

| Redundancy | Files | Impact |
|------------|-------|--------|
| `.env` in .gitignore | Lines 2 and 6 | Cosmetic -- duplicate pattern, no functional impact. |
| `*~` in .gitignore | Lines 38 and 55 | Cosmetic -- duplicate pattern. |
| AGENTS.md vs CLAUDE.md OpenSpec block | `AGENTS.md` lines 1-18, `CLAUDE.md` lines 1-17 | Both contain identical OpenSpec instruction blocks. AGENTS.md is the standalone file; CLAUDE.md embeds the same block. Only one is needed. |
| .vscode/settings.json | 53 lines of T3 monorepo config | **Entire file is redundant** for this repo. Only `git.enabled: false` and cSpell words are relevant. |
| README "Component Scripts" section | Lines 157-187 | Duplicates the same information already given in lines 114-153 (same scripts, same commands, slightly different formatting). |

---

## 10. Ambiguities

| Ambiguity | Location | Question |
|-----------|----------|----------|
| "cd mac" | README.md:17-18 | Was this repo previously organized under a `mac/` subdirectory? The command makes no sense with current structure. Likely a historical artifact from before a repo reorganization. |
| Homelab service dirs in .gitignore | .gitignore:16-30 | Were these dirs ever in this repo? Or was the .gitignore copied from the homelab project? Evidence suggests copy-paste: none of these dirs have ever existed here. |
| .vscode/settings.json origin | `.vscode/settings.json` | Was this file intentionally placed here, or was it accidentally committed from a VS Code profile sync? The Tailwind config path `./tooling/tailwind/web.ts` matches T3 Turbo monorepo structure used in oo/tc/tl/mv/ss projects. |
| WezTerm status | README.md, CLAUDE.md, symlinks.conf | WezTerm is documented as a primary tool but is commented out everywhere. Is it being kept for Windows-only use? The wezterm/ directory still exists at repo root. |
| .cursorignore scope | `.cursorignore` | Only ignores `env`. Should it also ignore `ssh-mesh/keys/`, `.DS_Store`, and other patterns from .gitignore? |
| `sync.sh` purpose | Root file, 313 lines | Neither README.md nor CLAUDE.md explain what sync.sh does (Claude Code config sync tool). CLAUDE.md lists it as "Sync/backup script" which undersells its actual purpose. |
| iTerm2 integration | `zsh/.zshrc:35` | Line 35 sources iTerm2 shell integration if present. iTerm2 is not in the Brewfile and not documented anywhere. Is this dead code or a fallback? |

---

## 11. Recommendations

### Priority 1: Fix README.md (CRITICAL)

The README is actively harmful. Every installation instruction fails. Recommended approach:

1. **Rewrite from scratch** rather than patching. The structural assumptions ("cd mac") permeate
   the entire document.
2. Key sections for new README:
   - One-command install: `./install.sh` (not `cd mac`)
   - Platform support: macOS, Arch Linux, Windows
   - Primary terminal: Ghostty (with WezTerm as Windows fallback)
   - Accurate Brewfile contents (or just say "see `homebrew/Brewfile`" instead of listing tools)
   - Remove the broken openspec link
   - Remove the duplicate "Component Scripts" section
3. Keep it short. The mathiasbynens/dotfiles README is 50 lines and has 30K stars. The current
   298-line README is too long AND wrong.

### Priority 2: Complete CLAUDE.md Directory Structure

Add the 5 missing directories to the tree:

```
ghostty/               # Ghostty terminal config + cmux workspace launcher
karabiner/             # Karabiner-Elements key remapping for RDP
launchd/               # macOS LaunchAgent plists (cmux-bridge, mic-priority)
windows/               # Windows dev environment setup (setup.ps1, WezTerm, AHK)
docs/                  # Audit and analysis documentation
```

Also add the missing scripts to the `scripts/` listing and mention Ghostty as the primary terminal.

### Priority 3: Clean .gitignore

Remove the 14 homelab service directory patterns (lines 16-30). Remove the duplicate `.env`
(line 2 or 6) and duplicate `*~` (line 38 or 55). Consider adding patterns actually relevant to
this repo:

```gitignore
# Rust build artifacts (cmux-bridge)
target/

# Docs audit output (optional, if you don't want to track)
# docs/audit/
```

### Priority 4: Replace .vscode/settings.json

Replace the T3 monorepo config with settings appropriate for a dotfiles repo:

```json
{
  "git.enabled": false,
  "git.autoRepositoryDetection": false,
  "cSpell.words": ["homelab", "Installfest", "cmux", "Ghostty", "Tailscale"],
  "files.associations": {
    "*.conf": "ini",
    "Brewfile": "ruby"
  },
  "editor.formatOnSave": false,
  "[shellscript]": {
    "editor.defaultFormatter": null
  }
}
```

### Priority 5: Minor Cleanups

- **Remove iTerm2 line** from `zsh/.zshrc:35` (or document why it exists)
- **Remove duplicate AGENTS.md** at repo root if CLAUDE.md already has the same OpenSpec block.
  Or keep AGENTS.md and remove the block from CLAUDE.md. Having both is redundant.
- **Expand .cursorignore** to match key .gitignore patterns (`ssh-mesh/keys/`, `*.key`, `*.pem`)
- **Document sync.sh** in CLAUDE.md (it is 313 lines and undocumented)

---

## Sources

- [How to Manage Dotfiles With Git -- Best Practices](https://www.control-escape.com/linux/dotfiles/)
- [Which Dotfiles Should You Commit to Git (and Which to Ignore)](https://blog.openreplay.com/dotfiles-commit-ignore/)
- [dotfiles.github.io -- Tips and Tricks](https://dotfiles.github.io/tips/)
- [How to Write a 4000 Stars GitHub README](https://www.daytona.io/dotfiles/how-to-write-4000-stars-github-readme-for-your-project)
- [How to manage dotfiles with git bare repo](https://pgaskin.net/posts/git-dotfiles/)
- [Manage Your Dotfiles Like a Superhero](https://www.jakewiesler.com/blog/managing-dotfiles)
- [Global Git Ignore -- DEV Community](https://dev.to/michaelcurrin/dotfiles-global-git-ignore-38ef)
- [dotfiles -- ArchWiki](https://wiki.archlinux.org/title/Dotfiles)
- [My dotfiles setup (Gordon Beeming, 2026)](https://gordonbeeming.com/blog/2026-03-10/my-dotfiles-setup-how-i-manage-my-dev-environment)
- [thoughtbot/dotfiles README](https://github.com/thoughtbot/dotfiles/blob/main/README.md)
- [spf13/dotfiles README](https://github.com/spf13/dotfiles/blob/main/README.md)
