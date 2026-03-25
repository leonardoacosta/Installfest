# Audit: sync.sh -- Config Propagation System

> Adversarial audit of `/Users/leonardoacosta/dev/if/sync.sh`
> Generated: 2026-03-25
> Health Score: **CRITICAL**

---

## 1. Current Setup

### What sync.sh Claims To Do

`sync.sh` (314 lines) is a Bash script offering four commands:

| Command | Purpose | Lines |
|---------|---------|-------|
| `install [template]` | Create `.claude/` symlinks in a satellite project pointing back to central `if/` repo | 81-153 |
| `uninstall` | Remove symlinks, suggest manual backup restoration | 155-183 |
| `promote <file>` | Copy a file from a satellite project into the central `if/` repo | 185-233 |
| `status` | Report symlink health for the current project | 235-290 |

### What It Actually Symlinks (install command)

| Target in satellite project | Source in central repo |
|---|---|
| `.claude/agents` | `$INSTALLFEST_PATH/.claude/agents` |
| `.claude/commands` | `$INSTALLFEST_PATH/.claude/commands` |
| `.claude/skills` | `$INSTALLFEST_PATH/.claude/skills` |
| `CLAUDE.md` | `$INSTALLFEST_PATH/.claude/templates/$TEMPLATE/CLAUDE.md` |
| `.claude/settings.json` | Template-specific or central `settings.json` |

### Templates Declared

Three templates are declared at line 21: `minimal`, `t3-expo`, `dotnet`.

---

## 2. Intent Analysis

sync.sh was conceived as a centralized Claude Code configuration distribution system. The idea:
the `if/` dotfiles repo would be the single source of truth for agents, commands, skills, and
project templates. Satellite projects (oo, tc, tl, mv, ss, cl, cw, co, etc.) would run
`sync.sh install t3-expo` to get symlinks pointing back to `if/.claude/`, ensuring all projects
share the same AI assistant configuration.

The `promote` command was the reverse flow: when a satellite project develops a useful agent or
skill locally, `promote` copies it upstream to the central repo for redistribution.

**This intent is sound.** Central config management for AI tooling across 15+ projects is a real
need. The problem is that the implementation was abandoned mid-flight.

---

## 3. Cross-Domain Interactions

### With scripts/symlinks.sh and scripts/symlinks.conf

There are two independent symlink management systems in this repo:

| System | Manages | Mechanism | Status |
|--------|---------|-----------|--------|
| `scripts/symlinks.sh` + `scripts/symlinks.conf` | Dotfiles (zsh, starship, tmux, ghostty, launchd) | Read config file, create symlinks | **Active, used** |
| `sync.sh` | Claude Code config (agents, commands, skills, templates) | Hardcoded paths, create symlinks | **Dead code** |

These two systems do not know about each other. `symlinks.conf` does not reference `.claude/`
paths. `sync.sh` does not reference `symlinks.conf`. They are parallel, disconnected
implementations of the same pattern (symlink creation with backup).

### With ~/.claude/ (Global Claude Config)

The global `~/.claude/` directory contains the actual active agents (28), commands (18+), and
skills (22+). These are what satellite projects currently symlink to -- but they point to
`/home/nyaptor/.claude/` (the homelab path), NOT to the `if/` repo. Evidence from satellite
projects:

- `fp/.claude/agents` -> `/home/nyaptor/.claude/agents`
- `lv/.claude/agents` -> `/home/nyaptor/.claude/agents`
- `tc/.claude/agents` -> `/home/nyaptor/.claude/shared/agents`

sync.sh plays no role in creating these symlinks. The actual config propagation happens through
a completely different mechanism -- direct symlinks committed in each satellite project's
`.claude/` directory, pointing to the homelab's `~/.claude/` path.

### With install.sh

`install.sh` (the main interactive installer, line 170 of discovery.md) does NOT call `sync.sh`.
It uses `scripts/symlinks.sh` for dotfile setup. There is no integration point.

---

## 4. Best Practices Audit

### Industry Patterns for Config Distribution

The ecosystem overview (from the companion audit) identifies established approaches:

| Approach | How It Works | Tradeoffs |
|----------|-------------|-----------|
| **GNU Stow** | Mirror directory structure, `stow` creates symlinks | Battle-tested conflict detection, no templates, no custom logic |
| **chezmoi** | Source-of-truth dir with Go templates, `chezmoi apply` | Templates per OS/machine, secrets integration, external deps via `.chezmoiexternal.toml` |
| **Bare git repo** | `git --work-tree=$HOME` | Zero tooling, but no per-machine customization |
| **Custom scripts** | DIY (what sync.sh is) | Full control, but reinvents wheel, no conflict detection |

sync.sh is a custom script approach. The industry consensus per
[dotfiles.github.io](https://dotfiles.github.io/) and
[GNU Stow analysis](https://www.penkin.me/development/tools/productivity/configuration/2025/10/20/my-dotfiles-setup-with-gnu-stow.html)
is that custom symlink scripts are the most fragile option because they lack:

- Intelligent conflict detection (Stow's tree-folding algorithm)
- Dry-run mode (chezmoi's `chezmoi diff`)
- Declarative state management (what SHOULD be linked vs what IS linked)
- Idempotency guarantees

### Monorepo Config Sharing

For sharing configuration across multiple repositories, the
[monorepo best practices consensus](https://docs.gitscrum.com/en/best-practices/monorepo-management-strategies/)
favors symlinks over copies because they maintain instant consistency. However, symlinks that
cross machine boundaries (pointing to `/home/nyaptor/...` on macOS) are broken by definition --
they only work on the machine where the target exists.

**Sources:**
- [dotfiles.github.io](https://dotfiles.github.io/)
- [GNU Stow for dotfiles (2025)](https://www.penkin.me/development/tools/productivity/configuration/2025/10/20/my-dotfiles-setup-with-gnu-stow.html)
- [chezmoi external dependencies](https://stoeps.de/posts/2025/managing_external_dependencies_with_chezmoi/)
- [Monorepo management strategies 2026](https://docs.gitscrum.com/en/best-practices/monorepo-management-strategies/)
- [ArchWiki dotfiles](https://wiki.archlinux.org/title/Dotfiles)

---

## 5. Tool Choices

### sync.sh vs Alternatives

| Criterion | sync.sh | GNU Stow | chezmoi | Direct symlinks (current reality) |
|-----------|---------|----------|---------|----------------------------------|
| Conflict detection | None (line 73-74: `rm -rf` existing) | Tree-folding algorithm | Full diff view | None |
| Dry-run | No | `stow -n` | `chezmoi diff` | No |
| Template support | Template dirs (3 templates) | None | Go templates with OS/arch vars | None |
| Idempotent | Partially (re-running overwrites) | Yes | Yes | Yes (symlinks are idempotent) |
| Error recovery | `set -e` only | Automatic conflict rollback | Automatic | N/A |
| Cross-platform | Bash only | Perl (ubiquitous) | Go binary (all platforms) | OS-native |
| Learning curve | Low | Low | Medium | Zero |
| Dependencies | bash | perl | Go binary | None |

**Assessment:** sync.sh occupies a dead zone. It is too simple to compete with Stow or chezmoi
on reliability, yet too complex to justify over the direct-symlink approach that is actually
being used. The three templates (minimal, t3-expo, dotnet) suggest ambition toward chezmoi-like
functionality, but the implementation never matured.

---

## 6. Configuration Quality

### Hardcoded Counts (Lines 149-151)

```bash
echo "  Agents: linked to central repo (10 agents)"
echo "  Commands: linked to central repo (4 commands)"
echo "  Skills: linked to central repo (12 skills)"
```

These counts were accurate at creation time (commit `ff4d0eab`, Dec 6, 2025). The actual current
counts in `~/.claude/` are:

| Resource | Claimed by sync.sh | Actual in ~/.claude/ | Drift |
|----------|--------------------|---------------------|-------|
| Agents | 10 | 28 | 180% increase |
| Commands | 4 (line says 4, commit says 7) | 18+ dirs + files | 350%+ increase |
| Skills | 12 | 22+ | 83% increase |

These numbers are hardcoded strings, not computed. They were stale within weeks of creation and
are now wildly inaccurate.

### Broken Symlink in .claude/ (Line 0 -- pre-existing)

The `if` repo itself has a broken symlink:

```
.claude/helpers -> /home/nyaptor/.claude/shared/helpers
```

This points to a homelab path that does not exist on macOS. This is the same cross-machine
symlink pattern seen in satellite projects -- and it confirms that someone (or something) is
creating symlinks outside of sync.sh that point to homelab paths.

### set -e Without Error Handling (Line 5)

`set -e` causes the script to exit on any error, but there is no `trap` to clean up partial
state. If `create_symlink` fails mid-install (say, on the 3rd of 5 symlinks), the project is
left in a half-configured state with some symlinks created and some not. There is no rollback.

### rm -rf on Existing Targets (Lines 73-74)

```bash
if [ -e "$target" ] || [ -L "$target" ]; then
    rm -rf "$target"
fi
```

This silently destroys existing files/directories before creating symlinks. While
`backup_existing` (line 53-61) is called beforehand, it only backs up non-symlinks. If a
satellite project has a real `.claude/agents/` directory with custom agents, `backup_existing`
saves it -- but if the project already has a symlink pointing somewhere else, the old symlink
is destroyed without record.

### .swarm/ in .gitignore (Line 136)

```bash
echo ".swarm/" >> .gitignore
```

This adds `.swarm/` to the satellite project's `.gitignore`. There is no `.swarm/` directory
referenced anywhere else in the codebase. This appears to be a vestigial reference to an
abandoned feature (possibly Claude Code's experimental agent swarm). It should not be injected
into satellite projects' `.gitignore` files.

---

## 7. Architecture Assessment

### The Fundamental Problem: Abandoned Mid-Migration

The timeline tells the story:

| Date | Event | Commit |
|------|-------|--------|
| Dec 6, 2025 | sync.sh created with agents, commands, skills, templates in `if/.claude/` | `ff4d0eab` |
| Dec 24, 2025 | ALL agents, commands, skills, templates deleted from `if/.claude/` | `938d3097` |
| Dec 24, 2025 - present | sync.sh never updated | (no commits to sync.sh) |

The entire content that sync.sh was designed to distribute was removed 18 days after creation.
The config management system migrated to `~/.claude/` (the global Claude config directory, which
lives on the homelab at `/home/nyaptor/.claude/`). Satellite projects now symlink directly to
homelab paths. sync.sh was left behind as dead code.

### Architecture Mismatch

sync.sh assumes a hub-and-spoke model:

```
if/.claude/ (hub)
  |
  +-- satellite_1/.claude/ (symlinks to if/)
  +-- satellite_2/.claude/ (symlinks to if/)
  +-- satellite_3/.claude/ (symlinks to if/)
```

The actual architecture is:

```
~/.claude/ on homelab (/home/nyaptor/.claude/)
  |
  +-- satellite_1/.claude/ (symlinks committed in git, pointing to /home/nyaptor/.claude/)
  +-- satellite_2/.claude/ (symlinks committed in git, pointing to /home/nyaptor/.claude/)
  +-- if/.claude/helpers (also points to /home/nyaptor/.claude/shared/helpers -- broken on Mac)
```

These are fundamentally different architectures. sync.sh's model (dotfiles repo as config hub)
is actually more portable and correct -- symlinks to a path on the same machine are guaranteed
to resolve. The current architecture (symlinks to homelab paths) only works on the homelab
itself and produces broken symlinks on macOS.

---

## 8. Missing Capabilities

### No Dry-Run Mode

There is no `--dry-run` or `-n` flag. Running `sync.sh install` immediately creates symlinks
and modifies `.gitignore`. Users cannot preview what will change before committing to it. Both
GNU Stow (`stow -n`) and chezmoi (`chezmoi diff`) provide this.

### No Conflict Resolution

When a satellite project has local overrides (e.g., a custom agent in `.claude/agents/`),
sync.sh's approach is backup-then-destroy. There is no merge strategy, no "keep local" option,
no interactive conflict resolution. Compare to chezmoi which shows diffs and lets users choose.

### No Update/Pull Command

There is no way to check if the central config has changed and update satellites. `install` is
a one-shot operation. If the central repo adds a new agent, satellites do not learn about it
unless someone re-runs `install`. (Symlinks would automatically reflect changes to existing
files, but not new files added to the central directory -- however since the directories
themselves are symlinked, new files within them would be visible.)

### No Multi-Machine Awareness

sync.sh has no concept of machine identity. It cannot adjust behavior based on whether it is
running on macOS, the homelab, or CloudPC. The current satellite symlinks demonstrate a need
for machine-specific paths (`/home/nyaptor/` vs `$HOME/`), but sync.sh hardcodes
`$INSTALLFEST_PATH` which is always the local `if/` repo.

### No Validation of Symlink Health

The `status` command checks symlink existence but does not verify the targets are valid or
accessible. A symlink pointing to a deleted directory shows as "linked" but is functionally
broken.

---

## 9. Redundancies

### Two Symlink Systems

As documented in Section 3, `scripts/symlinks.sh` and `sync.sh` are parallel implementations
of symlink management with zero integration. Both:

- Create symlinks from a source to a target
- Back up existing files before overwriting
- Print colored status output
- Have a status/preview mode

The only difference: `symlinks.sh` reads from a declarative config file (`symlinks.conf`),
while `sync.sh` hardcodes paths. `symlinks.sh` is the more mature and actively-used system.

### backup_existing Duplicates symlinks.sh Logic

`sync.sh` lines 53-61 implement backup logic. `scripts/symlinks.sh` has its own backup logic.
Neither shares code with the other.

### Promote Command Duplicates Git Workflow

The `promote` command (lines 185-233) copies a file from a satellite project into the central
repo and prints git commands to commit it. This is literally what `cp` + `cd` + `git add` +
`git commit` does. The only value-add is the path resolution logic (lines 203-215) that maps
agents/commands/skills paths -- but this mapping is itself outdated since the target directories
no longer exist.

---

## 10. Ambiguities

### What Is INSTALLFEST_PATH?

Line 9: `INSTALLFEST_PATH="${INSTALLFEST_PATH:-$SCRIPT_DIR}"`

This defaults to the directory containing sync.sh (the `if/` repo root). But it can be
overridden via environment variable. The script does not document when or why you would override
this. Is this for testing? For running from a different location? For pointing at a different
config source? Unclear.

### Who Runs This Script?

sync.sh is designed to be run from within a satellite project (`cd ~/my-project &&
$INSTALLFEST_PATH/sync.sh install t3-expo`). But there is no evidence of any satellite project
ever having used it:

- No `.claude/.template` files found in any satellite project (the marker file sync.sh creates
  at line 142)
- Satellite project symlinks point to `/home/nyaptor/.claude/`, not to `if/.claude/`
- No references to sync.sh in satellite projects

### Template Completeness

The three declared templates (minimal, t3-expo, dotnet) were created and deleted within the same
month. It is unclear whether they were ever actually used on any project. The commit message for
deletion (`938d3097`) says "remove unused CLAUDE.md templates and settings for t3-expo" --
confirming they were never used.

### settings.local.json Purpose

Line 125-128 creates a `settings.local.json` with `{}` content. Line 132-138 adds it to
`.gitignore`. The intent (local overrides that are not committed) is reasonable, but there is no
documentation of what keys are valid in `settings.local.json` or how it interacts with the
symlinked `settings.json`. Claude Code does support `settings.local.json`, but sync.sh does not
explain this.

---

## 11. Recommendations

### Recommendation 1: Delete sync.sh (HIGH PRIORITY)

**Rationale:** sync.sh is dead code. Every path it references has been deleted. No satellite
project uses it. The actual config propagation mechanism is direct symlinks to `~/.claude/`
committed in each project's git repo. Keeping sync.sh creates confusion about which system is
authoritative.

**Action:** `rm sync.sh` and remove any references to it in `CLAUDE.md` and `README.md`.

### Recommendation 2: Fix the Broken Cross-Machine Symlinks (HIGH PRIORITY)

Satellite projects and the `if` repo itself contain symlinks pointing to `/home/nyaptor/.claude/`
which only resolves on the homelab. On macOS these are all broken:

- `if/.claude/helpers -> /home/nyaptor/.claude/shared/helpers` (BROKEN)
- `fp/.claude/agents -> /home/nyaptor/.claude/agents` (BROKEN on Mac)
- `lv/.claude/skills -> /home/nyaptor/.claude/skills` (BROKEN on Mac)

**Options:**
1. Use `$HOME/.claude/` as the symlink target (works on any machine where `~/.claude/` exists)
2. Use relative symlinks where possible
3. Use chezmoi templates to generate machine-specific symlinks

### Recommendation 3: Consolidate Into scripts/symlinks.sh (MEDIUM PRIORITY)

If Claude Code config distribution is still needed, add `.claude/` entries to
`scripts/symlinks.conf` rather than maintaining a separate script. `symlinks.sh` already handles
the create/delete/preview lifecycle and reads from a declarative config file.

Example addition to `symlinks.conf`:
```
$(pwd)/.claude/agents:$HOME/.claude/shared/agents
$(pwd)/.claude/commands:$HOME/.claude/shared/commands
$(pwd)/.claude/skills:$HOME/.claude/shared/skills
```

### Recommendation 4: If Rebuilding, Use chezmoi or Stow (LOW PRIORITY)

If a config distribution system is rebuilt from scratch, use an established tool rather than
a custom script:

- **GNU Stow** if you only need symlinks (zero templates, zero secrets)
- **chezmoi** if you need per-machine templates (the `/home/nyaptor/` vs `$HOME/` problem)

chezmoi's `.chezmoiexternal.toml` can pull config from external git repos, which is exactly
the hub-and-spoke model sync.sh was attempting. See
[chezmoi external dependencies](https://stoeps.de/posts/2025/managing_external_dependencies_with_chezmoi/).

### Recommendation 5: Document the Actual Config Architecture (LOW PRIORITY)

The real config propagation system (symlinks to `~/.claude/` committed in satellite repos) is
undocumented. There is no explanation of:

- Why symlinks point to homelab paths
- How to set up a new satellite project
- What happens when config changes centrally
- How macOS and homelab stay in sync

This knowledge appears to exist only in the person who set it up. A brief `docs/claude-config.md`
(or section in CLAUDE.md) explaining the actual architecture would prevent future confusion.

---

## Summary

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Functionality** | CRITICAL | All referenced paths deleted; script cannot execute successfully |
| **Error Handling** | POOR | `set -e` without trap; `rm -rf` without confirmation; no rollback |
| **Architecture Fit** | CRITICAL | Designed for a hub (if/.claude/) that no longer exists |
| **Code Quality** | FAIR | Clean Bash, good structure, colored output, backup logic -- but all moot |
| **Documentation** | POOR | Usage help exists but does not warn about missing prerequisites |
| **Maintainability** | CRITICAL | Hardcoded counts, no tests, no dry-run, 18 days of useful life |
| **Security** | FAIR | No secrets handling, but also no security risks beyond `rm -rf` |

**Overall Health Score: CRITICAL**

sync.sh is a well-structured but completely non-functional artifact. It was created on Dec 6,
2025, had its entire backing content deleted on Dec 24, 2025, and has been dead code for three
months. Every `install` invocation would fail at line 91 ("Template directory not found") because
`.claude/templates/` does not exist. The `status` command would report zero agents, commands,
and skills because those directories are also gone.

The most constructive action is deletion, paired with documenting the actual config propagation
mechanism that replaced it.
