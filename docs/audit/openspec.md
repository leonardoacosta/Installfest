# OpenSpec Audit

> Adversarial assessment of the OpenSpec change management system in the `if` (Installfest) dotfiles repository.
> Generated: 2026-03-25

**Health Score: POOR**

---

## 1. Current Setup

### Directory Structure

```
openspec/
└── changes/
    └── archive/
        └── 2026-02-10-fix-zsh-startup-perf/
            ├── proposal.md    (70 lines)
            └── tasks.md       (26 lines)
```

### Related Files Outside `openspec/`

| File | Lines | Purpose |
|------|------:|---------|
| `AGENTS.md` (repo root) | 18 | OpenSpec instruction block (references missing `openspec/AGENTS.md`) |
| `CLAUDE.md` lines 1-18 | 18 | OpenSpec `<!-- OPENSPEC:START -->` managed block |
| `CLAUDE.md` line 125 | 1 | "Use `/openspec:proposal` for structural changes" |
| `README.md` line 291 | 1 | Broken link to `openspec/specs/mac-development-environment/spec.md` |

**Total living footprint: 4 files, ~135 lines of content, 2 surviving archive files.**

### Missing Files (Broken References)

| Reference Location | Target | Exists? |
|-------------------|--------|---------|
| `CLAUDE.md` line 6 | `@/openspec/AGENTS.md` | **No** -- deleted in commit `09a54dd` (2026-01-26) |
| `CLAUDE.md` line 11 | `@/openspec/AGENTS.md` | **No** -- same |
| `AGENTS.md` line 6 | `@/openspec/AGENTS.md` | **No** -- same |
| `AGENTS.md` line 11 | `@/openspec/AGENTS.md` | **No** -- same |
| `README.md` line 291 | `openspec/specs/mac-development-environment/spec.md` | **No** -- directory `openspec/specs/` was deleted in commit `95fa015` (2025-12-05) |

These are not soft failures. Both `CLAUDE.md` and `AGENTS.md` instruct AI assistants to "Always open `@/openspec/AGENTS.md`" when handling planning or proposal requests. The file does not exist. Every AI session that mentions "plan" or "proposal" will hit a missing-file error as its first action.

---

## 2. Intent Analysis

### What OpenSpec Was Designed For Here

Based on git history analysis (132 files added, 130 deleted across 32 commits):

**Phase 1 (Dec 2-6, 2025):** OpenSpec was adopted when this repository was a fundamentally different project -- a combined dotfiles + homelab infrastructure + Better-T-Stack monorepo. The deleted `openspec/project.md` described Docker Compose stacks, tRPC routers, Playwright test servers, Next.js apps, and PostgreSQL databases. At that scale, spec-driven development was defensible. Nine separate proposals were created in four days, covering:

- Documentation structure refactoring
- Homelab server unification into a monorepo
- Unified design system implementation
- Automated deployment systems
- OpenSpec sync tooling
- Spec lifecycle management
- Work queue and session management
- Worker coordination
- Work dashboard

**Phase 2 (Dec 6, 2025 - Jan 26, 2026):** The repository was dramatically restructured. The homelab infrastructure, Better-T-Stack monorepo, and all web applications were removed. What remained was a pure dotfiles/config repository. During the Jan 26 consolidation (`09a54dd`), 130 OpenSpec files were deleted -- including `openspec/AGENTS.md` and `openspec/project.md`. The CLAUDE.md and AGENTS.md instruction blocks were not updated to reflect this deletion.

**Phase 3 (Feb 10, 2026):** One final proposal (`fix-zsh-startup-perf`) was created and executed. This is the only OpenSpec usage in the post-restructuring era. It was a well-executed, focused change that improved shell startup by 55%.

**Phase 4 (Feb 10, 2026 - present):** Zero OpenSpec activity for 43 days. Nine commits were made during this period without any OpenSpec involvement. The system is dormant.

### Verdict

OpenSpec was brought in for a different repository. The repository shrank by approximately 90% in scope. The change management infrastructure was not right-sized to match.

---

## 3. Cross-Domain Interactions

| Interaction | Status | Impact |
|-------------|--------|--------|
| `CLAUDE.md` <-> `openspec/AGENTS.md` | **Broken** | AI assistants told to open a nonexistent file on every planning request |
| `AGENTS.md` <-> `openspec/AGENTS.md` | **Broken** | Duplicate broken reference at repo root |
| `README.md` <-> `openspec/specs/` | **Broken** | Documentation links to nonexistent spec directory |
| `CLAUDE.md` line 125 <-> `/openspec:proposal` | **Orphaned** | References an OpenSpec slash command that requires the missing `AGENTS.md` to function |
| `openspec/` <-> rest of repo | **Inert** | The surviving archive has zero influence on any configuration, script, or install flow |

The OpenSpec system has no functional integration with the current repository. Every cross-reference is either broken or orphaned.

---

## 4. Best Practices Audit

### What the Industry Says

**OpenSpec's own positioning** ([openspec.dev](https://openspec.dev/), [GitHub](https://github.com/Fission-AI/OpenSpec)) is "brownfield-first" -- designed for mature codebases where understanding the existing system is the hard part. Its three-phase state machine (proposal -> apply -> archive) and delta markers (ADDED/MODIFIED/REMOVED) are targeted at multi-file, multi-contributor projects where AI agents need guardrails against scope creep.

**For dotfiles specifically**, the ecosystem consensus ([dotfiles.github.io](https://dotfiles.github.io/), [ArchWiki](https://wiki.archlinux.org/title/Dotfiles), [chezmoi docs](https://www.chezmoi.io/)) is overwhelmingly: keep it simple. The most popular dotfiles repos (mathiasbynens/dotfiles at 30K+ stars, holman/dotfiles at 7K+) use plain git commit messages for change tracking. No specification layer exists in any mainstream dotfiles repo.

**ADRs (Architecture Decision Records)** ([adr.github.io](https://adr.github.io/), [Martin Fowler](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html)) are the lightweight alternative for recording significant decisions. Even ADRs are rarely used in personal config repos -- they shine in team environments where decisions need to survive personnel turnover.

**RFCs** ([Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/rfcs-and-design-docs)) are for proposals that need team feedback. A single-person dotfiles repo has no audience for an RFC process.

### The Overhead Question

The `fix-zsh-startup-perf` proposal is 70 lines of Markdown specifying a change that could be described in a 2-line commit message:

```
perf(zsh): eliminate double-sourcing, 55% faster startup

Strip .zshenv to env-vars only, move all tool inits to .zshrc functions.
```

The proposal adds: Context section, Motivation section, Requirements list, IN/OUT scope, Impact table, Risks table, Success Criteria. For a personal shell config change, this is ceremony without audience. There is no reviewer, no approver, no team to align. The spec was written by an AI and consumed by the same AI.

---

## 5. Tool Choices

### OpenSpec vs Alternatives for This Repository

| Tool | Overhead | Audience | Fit for Personal Dotfiles |
|------|----------|----------|---------------------------|
| **OpenSpec** (current) | High -- proposal.md, tasks.md, design.md, delta specs per change | Teams, multi-contributor AI-assisted projects | **Poor** -- designed for brownfield codebases with multiple capabilities |
| **ADRs** (MADR format) | Medium -- one file per decision in `docs/decisions/` | Teams, future self | **Fair** -- useful for non-obvious decisions (why Ghostty over WezTerm, why Starship over p10k) |
| **Conventional Commits** | Minimal -- structured commit messages | Anyone reading git log | **Good** -- already partially in use (`perf(zsh):`, `feat(ghostty):`) |
| **CHANGELOG.md** | Low -- append-only log of notable changes | Users of the dotfiles | **Fair** -- useful for multi-machine setups where you need to know what changed |
| **TODO.md** | Minimal -- flat list of planned work | Self | **Good** -- simple, zero infrastructure |
| **Nothing** | Zero | N/A | **Good** -- git history is the record |

### Recommendation

Conventional commits (already in use) plus an optional `docs/decisions/` directory for genuinely non-obvious choices is the right weight class for this repository. OpenSpec is two weight classes above what is needed.

---

## 6. Configuration Quality

### Broken Configuration

| Issue | Severity | File:Line |
|-------|----------|-----------|
| `AGENTS.md` references nonexistent `openspec/AGENTS.md` | **Critical** | `AGENTS.md:6`, `AGENTS.md:11` |
| `CLAUDE.md` references nonexistent `openspec/AGENTS.md` | **Critical** | `CLAUDE.md:6`, `CLAUDE.md:11` |
| `README.md` links to nonexistent `openspec/specs/mac-development-environment/spec.md` | **Moderate** | `README.md:291` |
| `CLAUDE.md` references `/openspec:proposal` command that depends on missing infrastructure | **Moderate** | `CLAUDE.md:125` |
| `openspec/project.md` was deleted but CLAUDE.md still lists `openspec/` in directory structure | **Low** | `CLAUDE.md:63` |

### Stale Configuration

The `<!-- OPENSPEC:START -->` managed block in CLAUDE.md (lines 1-18) was designed to be updated by `openspec update`. With `openspec/AGENTS.md` deleted, the managed block is frozen in a state that references infrastructure that no longer exists. The comment "Keep this managed block so 'openspec update' can refresh the instructions" (line 16) describes a capability that cannot function.

---

## 7. Architecture Assessment

### What Survives

The `openspec/` directory contains exactly one archived proposal in a deeply nested path:

```
openspec/changes/archive/2026-02-10-fix-zsh-startup-perf/
```

This is a 4-level directory hierarchy to store 96 lines of Markdown that document a completed change. The archive serves no operational purpose -- it is not referenced by any script, configuration, or documentation. It is a historical artifact.

### Structural Mismatch

OpenSpec's architecture assumes:

1. A `project.md` that describes the system's capabilities -- **deleted**
2. An `AGENTS.md` that teaches AI assistants the workflow -- **deleted**
3. A `specs/` directory with living capability specifications -- **deleted, never recreated**
4. A `changes/` directory for active proposals -- **empty** (only archive remains)
5. Validation tooling (`openspec validate`) -- **no evidence of installation**

What remains is a skeleton with no organs. The framework's core files are gone, but the instructions pointing to them persist.

---

## 8. Missing Capabilities

If OpenSpec were to be retained (which this audit does not recommend), the following would be required:

| Missing | Required For | Effort |
|---------|-------------|--------|
| `openspec/AGENTS.md` | AI assistant workflow guidance | Rewrite from scratch (old version described a different repo) |
| `openspec/project.md` | System capability inventory | Rewrite from scratch (old version referenced homelab/monorepo) |
| `openspec/specs/` directory | Living specifications | Create from scratch for current domains (zsh, ghostty, tmux, ssh-mesh, etc.) |
| OpenSpec CLI or validation tooling | `openspec validate`, `openspec list` | Install npm package or equivalent |
| Updated CLAUDE.md instructions | Accurate AI guidance | Rewrite managed block |
| Updated AGENTS.md | Accurate AI guidance | Rewrite or remove |

This is essentially a full reinstallation of OpenSpec, not a repair. The effort is disproportionate to the value for a personal dotfiles repo.

---

## 9. Redundancies

| Redundancy | Files | Assessment |
|------------|-------|------------|
| `AGENTS.md` duplicates `CLAUDE.md` OpenSpec block | `AGENTS.md` (18 lines) mirrors `CLAUDE.md` lines 1-18 | Both contain identical broken references. `AGENTS.md` at repo root appears to be an OpenSpec convention, but it adds nothing beyond what CLAUDE.md already provides to Claude Code. |
| `CLAUDE.md` line 63 lists `openspec/` in directory structure | `CLAUDE.md:63` | Describes a directory that functionally contains nothing (only a deeply nested archive). Misleads AI assistants into thinking it is an active system. |
| `CLAUDE.md` line 125 references `/openspec:proposal` | `CLAUDE.md:125` | References a workflow that depends on deleted infrastructure. |

---

## 10. Ambiguities

| Ambiguity | Question | Impact |
|-----------|----------|--------|
| Is OpenSpec intended to be active? | The infrastructure is 90% deleted but the instructions remain. Is this intentional abandonment-in-progress or an oversight? | AI assistants cannot determine whether to use OpenSpec or ignore it. |
| What triggers an OpenSpec proposal vs a direct commit? | CLAUDE.md line 125 says "Use `/openspec:proposal` for structural changes." Nine commits since Feb 10 (including SSH hardening, Ghostty config, Raycast shortcuts) were made without proposals. Where is the line? | Inconsistent enforcement suggests the rule is aspirational, not practiced. |
| Should AGENTS.md exist at repo root? | It is a standard OpenSpec convention but duplicates CLAUDE.md content. With OpenSpec infrastructure deleted, it serves no purpose. | Noise for any tool (not just Claude) that reads repo-root Markdown files. |
| Is the archive valuable? | The `fix-zsh-startup-perf` archive documents a completed change. Is this historical record worth preserving? | 96 lines of archive vs. the commit message + git diff which contain the same information. |

---

## 11. Recommendations

### Primary Recommendation: Remove OpenSpec

**Rationale:** OpenSpec was adopted for a repository that no longer exists. The current `if` repository is a personal dotfiles/config repo with ~115 files and ~12K lines. It has a single contributor. The spec-driven development overhead is not justified -- it was never justified for the current shape of the repo, only for the previous homelab-monorepo shape.

**Actions:**

1. **Delete `openspec/` directory entirely.** The archive is preserved in git history (`8231adc`) if ever needed.

2. **Delete `AGENTS.md` from repo root.** It contains only the broken OpenSpec instruction block.

3. **Remove the `<!-- OPENSPEC:START -->` block from `CLAUDE.md`** (lines 1-18). Replace with nothing -- the CLAUDE.md content below it (lines 20-125) is already a complete, well-structured project guide.

4. **Remove line 125 from `CLAUDE.md`** ("OpenSpec Changes: Use `/openspec:proposal` for structural changes").

5. **Remove line 63 from `CLAUDE.md`** (the `openspec/` entry in the directory structure listing).

6. **Fix `README.md` line 291.** Remove the broken link to `openspec/specs/mac-development-environment/spec.md`.

### If OpenSpec Must Be Retained

If there is a deliberate intention to keep spec-driven development for this repo (perhaps for cross-machine migration planning or major restructuring), then at minimum:

1. Recreate `openspec/AGENTS.md` with instructions accurate to the current dotfiles-only repository.
2. Recreate `openspec/project.md` describing the actual domains (zsh, ghostty, tmux, starship, ssh-mesh, etc.).
3. Install the OpenSpec CLI tooling.
4. Update all broken references in CLAUDE.md, AGENTS.md, and README.md.
5. Define a clear threshold for when a proposal is required vs. when a direct commit suffices. Currently 100% of changes since the restructuring have bypassed the spec process.

### Lightweight Alternative (if decision-tracking is valued)

If the goal is to record *why* certain decisions were made (rather than *what* was changed), adopt a minimal ADR practice:

```
docs/decisions/
  0001-ghostty-over-wezterm-primary.md
  0002-starship-over-p10k.md
  0003-tailscale-ssh-mesh.md
```

Use the [MADR 4.0](https://adr.github.io/madr/) short format (title, context, decision, consequences -- ~20 lines each). No tooling required. Git is the workflow.

---

## Summary

| Aspect | Rating | Notes |
|--------|--------|-------|
| Current Setup | POOR | 4 broken references, deleted core files, skeleton directory |
| Active Usage | POOR | Zero activity in 43 days, 1 use in 3.5 months since restructuring |
| Fit for Repository | POOR | Designed for multi-contributor brownfield; this is single-user config files |
| Configuration Quality | CRITICAL | Every AI-facing instruction references nonexistent files |
| Architecture | POOR | Core files deleted, framework cannot function |
| Value Delivered | LOW | One successful proposal that could have been a commit message |

**Overall Health Score: POOR**

The OpenSpec system in this repository is not merely underutilized -- it is structurally broken. Its core files were deleted during a repository restructuring but its instructions were left behind, creating a persistent source of confusion for AI assistants. The recommended action is complete removal.

---

## Sources

- [OpenSpec - Fission-AI on GitHub](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec - Spec-Driven Development Framework](https://openspec.dev/)
- [OpenSpec Deep Dive - Architecture & Practice](https://redreamality.com/garden/notes/openspec-guide/)
- [Spec-Driven Development with OpenSpec](https://intent-driven.dev/blog/2025/11/09/spec-driven-development-openspec-source-truth/)
- [Agentic Coding: SDD Tool Comparison](https://pub.spillwave.com/agentic-coding-gsd-vs-spec-kit-vs-openspec-vs-taskmaster-ai-where-sdd-tools-diverge-0414dcb97e46)
- [6 Best Spec-Driven Development Tools (2026)](https://www.augmentcode.com/tools/best-spec-driven-development-tools)
- [Architecture Decision Records](https://adr.github.io/)
- [Martin Fowler - ADR](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html)
- [MADR - Markdown ADRs](https://github.com/adr/madr)
- [RFC vs ADR - When to Use Each](https://medium.com/@jashan.pj/rfc-vs-adr-why-developers-should-care-about-both-db886d40de9e)
- [Pragmatic Engineer - RFCs and Design Docs](https://newsletter.pragmaticengineer.com/p/rfcs-and-design-docs)
- [Lightweight ADR](https://www.practicalengineering.management/p/lightweight-adr)
- [dotfiles.github.io](https://dotfiles.github.io/)
- [ArchWiki - Dotfiles](https://wiki.archlinux.org/title/Dotfiles)
- [chezmoi - Why Use chezmoi](https://www.chezmoi.io/why-use-chezmoi/)
- [Atlassian - Dotfiles in Bare Git Repo](https://www.atlassian.com/git/tutorials/dotfiles)
