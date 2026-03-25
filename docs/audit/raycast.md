# Raycast Scripts Audit

> Domain: `raycast-scripts/` (all tiers)
> Generated: 2026-03-25
> Health Score: **POOR**

---

## 1. Current Setup

### Script Counts

| Tier | Directory | Count | Purpose |
|------|-----------|------:|---------|
| Homelab SSH | `raycast-scripts/` (root) | 28 | Open project on homelab via `cursor --folder-uri` SSH Remote |
| Local | `raycast-scripts/local/` | 25 | Open project locally via `cursor ~/dev/<code>/` |
| CloudPC SSH | `raycast-scripts/cloudpc/` | 10 | Open project on Windows CloudPC via `cursor --folder-uri` SSH Remote |
| **Total** | | **63** | |

### Script Categories

| Category | Scripts | Examples |
|----------|---------|---------|
| Project launcher (homelab SSH) | 25 | `oo.sh`, `tc.sh`, `cl.sh` |
| Project launcher (local) | 22 | `local/oo.sh`, `local/tc.sh` |
| Project launcher (CloudPC SSH) | 9 | `cloudpc/cw.sh`, `cloudpc/ba.sh` |
| Dropdown picker | 2 | `open-project.sh`, `local/open-project.sh` |
| Root directory opener | 3 | `root.sh`, `local/root.sh`, `cloudpc/root.sh` |
| Utility | 1 | `img.sh` (clipboard image to homelab) |

### Pattern

Every project launcher script follows the identical pattern:

```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title <CODE>[l|c]
# @raycast.mode silent

# Optional parameters:
# @raycast.icon <EMOJI>
# [optional: @raycast.packageName <FULL_NAME>]

# Documentation:
# @raycast.description <FULL_NAME>
# @raycast.author leonardoacosta
# @raycast.authorURL https://raycast.com/leonardoacosta

cursor <PATH_EXPRESSION>
```

The only line that varies between scripts of the same tier is the project code, icon, and name. The
path expression is a mechanical function of tier + project code:

| Tier | Path Template |
|------|---------------|
| Homelab | `cursor --folder-uri "vscode-remote://ssh-remote+homelab/home/nyaptor/dev/<CODE>/"` |
| Local | `cursor ~/dev/<CODE>/` |
| CloudPC | `cursor --folder-uri "vscode-remote://ssh-remote+cloudpc/C:/Users/LeonardoAcosta/source/repos/<CODE>/"` |

Exceptions: `cc` maps to `~/.claude` (local), `/home/nyaptor/.claude` (homelab),
`/C:/Users/LeonardoAcosta/.claude/` (CloudPC). `root.sh` opens the home directory.

---

## 2. Intent Analysis

The intent is clear: provide a fast keyboard shortcut (via Raycast) to open any project in Cursor
IDE on any of three machines. The naming convention encodes the target:

- `oo` = Otaku Odyssey on homelab
- `ool` = Otaku Odyssey locally
- `ooc` = Otaku Odyssey on CloudPC (if it existed)

This is a "project launcher" pattern. The user types a 2-4 character code in Raycast and the
project opens immediately. The advantage over the dropdown picker (`open-project.sh`) is speed:
no second selection step.

---

## 3. Cross-Domain Interactions

| Domain | Interaction |
|--------|-------------|
| SSH Mesh (`ssh-mesh/`) | Homelab and CloudPC scripts depend on SSH host aliases (`homelab`, `cloudpc`) configured in `ssh-mesh/configs/mac.config`. If those aliases break, all remote Raycast scripts fail silently. |
| Ghostty/cmux (`ghostty/cmux-workspaces.sh`) | cmux-workspaces has its own project registry with categories, full names, and colors. This is a parallel source of truth that partially overlaps but does NOT match the Raycast scripts (see Section 9). |
| Symlinks (`scripts/symlinks.conf`) | Raycast scripts are NOT managed by the symlink system. They appear to be manually added to Raycast's script commands directory. |
| `.gitignore` | No raycast-specific ignores. All scripts are tracked. |

---

## 4. Best Practices Audit

### Raycast Script Command Best Practices (per Raycast docs and community)

| Practice | Status | Notes |
|----------|--------|-------|
| Use `schemaVersion 1` | PASS | All scripts use it |
| Use `mode silent` for non-output scripts | PASS | All launcher scripts use silent mode |
| ShellCheck compliance | UNTESTED | Scripts are trivial enough that ShellCheck would likely pass, but no evidence of ShellCheck being run |
| Meaningful `title` for search | MIXED | Two-letter codes (`oo`, `tc`) are fast to type but opaque to search; `description` compensates |
| Consistent metadata | FAIL | `packageName` is present on ~50% of scripts (see Section 6) |
| Use arguments for parameterization | PARTIAL | `open-project.sh` uses dropdown arguments correctly, but individual scripts ignore this capability |
| Avoid duplication | FAIL | 60+ scripts where 3 would suffice (see Section 9) |

### Cursor Remote SSH URI Scheme

The `vscode-remote://ssh-remote+<HOST>/<PATH>` URI scheme is the standard approach documented by
VS Code and works with Cursor. However, there is a known Cursor bug where `--folder-uri` does
nothing when Cursor is already running (the script hangs). This affects all remote scripts and has
no workaround in any of them.

Sources:
- [Raycast Script Commands repo](https://github.com/raycast/script-commands)
- [Raycast Script Commands manual](https://manual.raycast.com/script-commands)
- [Raycast arguments docs](https://github.com/raycast/script-commands/blob/master/documentation/ARGUMENTS.md)
- [Cursor --folder-uri bug report](https://forum.cursor.com/t/remote-workspace-folder-uri-vscode-remote-does-nothing-script-hangs-when-cursor-already-open/153009)

---

## 5. Tool Choices

### Raycast Script Commands vs Alternatives

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Raycast Script Commands** (current) | Fast invocation, native Raycast integration, simple bash | One file per action, no templating, manual metadata | Correct choice for the use case |
| Raycast Extension (TypeScript) | Rich UI, dynamic lists, search, icons | Overkill for `cursor <path>`; requires React/Node build | Not warranted |
| Alfred Workflows | Visual builder, branching logic | Requires Alfred Powerpack; less developer mindshare in 2026 | Not warranted (already on Raycast) |
| Shell aliases | Zero overhead, instant | No GUI discoverability, clutters `.zshrc` | Already have `mux` via cmux-workspaces |
| Quicklinks (Raycast built-in) | Zero code, URL-based | Cannot run CLI commands like `cursor` | Does not work for this use case |

**Verdict:** Raycast Script Commands are the right tool. The problem is not the tool choice but the
implementation pattern (1 file per project per tier instead of parameterized scripts).

---

## 6. Configuration Quality

### Metadata Inconsistencies

**`packageName` present on only ~50% of scripts.** Of the 60 project launcher scripts (excluding
`open-project.sh`, `root.sh`, `img.sh`), roughly half have `@raycast.packageName` and half omit
it. There is no pattern to which scripts have it -- it appears to depend on when the script was
created.

| Has `packageName` | Missing `packageName` |
|--------------------|-----------------------|
| `cl`, `ct`, `dc`, `la`, `fb`, `sc`, `lu`, `se`, `bo`, `co`, `cw`, `ba`, `ws`, `if`, `cx`, `lv` | `oo`, `tc`, `tl`, `mv`, `ss`, `cc`, `hl`, `nv`, `nx` |

**Icon inconsistencies across tiers:**

| Project | Root Icon | Local Icon | CloudPC Icon |
|---------|-----------|------------|--------------|
| `se` (Submission Engine) | `�` (broken) | `�` (broken) | (gear) |
| `dc` (DOC) | (folder) | N/A | (hospital) |
| `hl` (Home Lab) | (laptop) | (laptop) | N/A |

The `se.sh` icon is broken (renders as `�` replacement character) in both root and local tiers.
The CloudPC `dc.sh` has a completely different icon AND a different description ("Dental CRM")
from the root `dc.sh` ("DOC - Document OrganizationCentral").

**Description inconsistencies:**

| Script | Root Description | CloudPC Description |
|--------|-----------------|---------------------|
| `dc.sh` | "DOC - Document OrganizationCentral" | "Dental CRM (CloudPC)" |

These are supposed to be the same project. Either the name changed or the CloudPC version has the
wrong description.

**Trailing slash inconsistency on `hl.sh`:**

```
raycast-scripts/hl.sh: .../dev/hl"   (missing trailing slash)
raycast-scripts/oo.sh: .../dev/oo/"  (has trailing slash)
```

Most scripts include the trailing `/` but `hl.sh` omits it.

---

## 7. Architecture Assessment

### The Core Problem

This is a **configuration-as-code anti-pattern**. The scripts encode a project registry (name,
code, icon, paths per tier) but scatter it across 63 individual files instead of maintaining it as
structured data. The result:

1. **Adding a project requires creating 1-3 files** with manually-duplicated metadata
2. **Renaming a project requires editing 1-3 files** (and historically, errors propagate -- see bugs)
3. **There is no single source of truth** for the project list
4. **The `open-project.sh` dropdown duplicates the entire registry** as inline JSON in a metadata comment

### Parallel Registries (no single source of truth)

| Location | Projects Listed | Format |
|----------|---------------:|--------|
| `raycast-scripts/*.sh` (individual files) | 25 | One file per project |
| `raycast-scripts/local/*.sh` (individual files) | 22 | One file per project |
| `raycast-scripts/cloudpc/*.sh` (individual files) | 9 | One file per project |
| `raycast-scripts/open-project.sh` (dropdown JSON) | 25 | Inline JSON array |
| `raycast-scripts/local/open-project.sh` (dropdown JSON) | 23 | Inline JSON array |
| `ghostty/cmux-workspaces.sh` (PROJECTS associative array) | 22 | Bash associative array |
| `CLAUDE.md` project registry | 15 | Markdown text |

Each of these registries can (and does) drift from the others.

---

## 8. Missing Capabilities

### Projects in cmux-workspaces NOT in Raycast Scripts

| Code | Name | In cmux | In Raycast (root) | In Raycast (local) | In Raycast (cloudpc) |
|------|------|:-------:|:-----------------:|:------------------:|:-------------------:|
| `ew` | Enterprise Wiki | Yes | No | No | No |
| `ic` | Infrastructure as Code | Yes | No | No | No |

### Projects in Raycast NOT in cmux-workspaces

| Code | Name | In Raycast | In cmux |
|------|------|:----------:|:-------:|
| `la` | Leonardo Acosta | Yes | No |
| `ba` | B3 Admin | Yes | No |
| `bo` | B3 OWA | Yes | No |
| `nv` | Nova | Yes | No |
| `nx` | Nexus | Yes | No |
| `lu` | Look Up | Yes | No |
| `lv` | Las Vegas | Yes | No |
| `cx` | Cortex | Yes | No |
| `ct` | Civalent | Yes | No |

The two registries have significant divergence.

### Parity Gaps Across Tiers

| Code | Name | Homelab | Local | CloudPC |
|------|------|:-------:|:-----:|:-------:|
| `cl` | Central Leonard | Yes | Yes | No |
| `co` | Central Orchestration | Yes | Yes | No |
| `ct` | Civalent | Yes | Yes | No |
| `cx` | Cortex | Yes | Yes | No |
| `hl` | Home Lab | Yes | Yes | No |
| `if` | Installfest | Yes | Yes | No |
| `la` | Leonardo Acosta | Yes | Yes | No |
| `lu` | Look Up | Yes | No | No |
| `lv` | Las Vegas | Yes | Yes | No |
| `mv` | Modern Visa | Yes | Yes | No |
| `nv` | Nova | Yes | Yes | No |
| `nx` | Nexus | Yes | Yes | No |
| `oo` | Otaku Odyssey | Yes | Yes | No |
| `ss` | Styles by Silas | Yes | Yes | No |
| `tc` | Tribal Cities | Yes | Yes | No |
| `tl` | Tavern Ledger | Yes | Yes | No |

CloudPC has only 10 scripts (9 projects + root) while homelab has 25 projects. This may be
intentional (not all projects live on CloudPC), but there is no documentation of which projects
exist on which machines.

### No Error Handling

None of the scripts handle the case where:
- `cursor` is not installed or not in PATH
- The SSH host is unreachable
- The remote path does not exist
- Cursor is already running (known `--folder-uri` hang bug)

For a silent-mode script, failure is invisible to the user.

---

## 9. Redundancies

**This is the central finding of this audit.**

### Quantified Duplication

There are **60 project launcher scripts** (excluding `open-project.sh`, `root.sh`, `img.sh`) that
are structurally identical. They differ only in:

1. Project code (2 letters)
2. Project name (for description/packageName)
3. Icon emoji
4. Tier-specific path template

This is **~960 lines of shell script** (60 scripts x ~16 lines average) encoding what could be
expressed as a **~30-line data table + 1 parameterized script per tier** (or 1 script total with
a tier argument).

### Duplication Ratio

| Metric | Current | Minimal |
|--------|--------:|--------:|
| Files | 63 | 3-6 |
| Lines of code | ~1,020 | ~120 |
| Metadata headers duplicated | 60 | 0 |
| Places to update when adding a project | 1-3 files + 2 dropdown JSONs | 1 data file |
| Places to update when renaming | 1-3 files + 2 dropdown JSONs | 1 data file |

**Duplication factor: ~10x.**

### The `open-project.sh` Supersession Problem

`open-project.sh` (homelab) and `local/open-project.sh` (local) already implement a dropdown
picker that covers all projects. These two scripts, combined, **functionally replace all 47
individual homelab + local scripts**. The only advantage of individual scripts is skipping the
dropdown selection step (type `oo` vs type `open project` then select "Otaku Odyssey").

However, Raycast's dropdown pre-selects the last used option, meaning the dropdown approach is
nearly as fast for repeated use.

### Proposed Solution: Generator Script

A single `generate-raycast-scripts.sh` that reads from a project registry (TOML, JSON, or simple
TSV) and emits all scripts:

```bash
# projects.tsv -- single source of truth
# CODE  NAME                    ICON  HOMELAB  LOCAL  CLOUDPC
oo      Otaku Odyssey           eyes  yes      yes    no
tc      Tribal Cities           tent  yes      yes    no
cw      Central Wholesale       building yes   yes    yes
fb      Fireball                fire  yes      yes    yes
# ... etc
```

The generator would:
1. Read the registry
2. For each project + tier combination, emit a script with correct metadata and path
3. Regenerate `open-project.sh` dropdown JSON from the same data
4. Optionally validate that all projects in cmux-workspaces are accounted for

This reduces the maintenance surface from 63 files to 1 data file + 1 generator.

### Alternative: Eliminate Individual Scripts Entirely

If the 1-keystroke speed advantage is not critical, delete all individual scripts and keep only
`open-project.sh` (with a tier dropdown added as argument2). This reduces 63 files to 1.

---

## 10. Ambiguities

### Naming Conflicts

| Issue | Details |
|-------|---------|
| `dc` = "DOC" or "Dental CRM"? | Root says "DOC - Document OrganizationCentral", CloudPC says "Dental CRM" |
| `ct` = "Civilant" or "Civalent"? | `ct.sh` says "Civilant", `open-project.sh` dropdown says "Civilant", but `cx.sh` description says "Cortex" and cmux says "Civalent" -- the project page title appears to fluctuate |
| `root.sh` uses `code` not `cursor` | Root-tier `root.sh` opens VS Code, not Cursor. Is this intentional? |
| `local/root.sh` path is broken | Opens `~/home/nyaptor/` which does not exist on macOS (should be `~/` or `$HOME`) |

### Bugs Found

**BUG 1 -- `sc.sh` opens wrong project (BOTH tiers):**
- `raycast-scripts/sc.sh` (title "sc", description "Sales CRM") opens `/dev/se/` (Submission Engine) instead of `/dev/sc/`
- `raycast-scripts/local/sc.sh` (title "scl", description "Sales CRM") opens `~/dev/se/` instead of `~/dev/sc/`
- This means typing "sc" in Raycast opens Submission Engine, not Sales CRM

**BUG 2 -- `local/root.sh` has invalid path:**
- Opens `code --folder-uri "~/home/nyaptor/"` which is not a valid local macOS path
- Should be `code ~/` or `code $HOME/` or `cursor ~/dev/`
- Also uses `code` instead of `cursor` (unlike all other local scripts)

**BUG 3 -- `hl.sh` missing trailing slash:**
- Path is `.../dev/hl"` instead of `.../dev/hl/"` (inconsistent with all other scripts)
- May work but is inconsistent

**BUG 4 -- `se.sh` has broken icon:**
- Icon renders as `�` (Unicode replacement character) in both root and local tiers
- CloudPC tier correctly uses a gear emoji

---

## 11. Recommendations

### Priority 1: Fix Bugs (immediate)

1. **Fix `sc.sh` and `local/sc.sh`** -- change path from `/dev/se/` to `/dev/sc/`
2. **Fix `local/root.sh`** -- change path from `~/home/nyaptor/` to `~/` and consider changing `code` to `cursor`
3. **Fix `se.sh` and `local/se.sh`** -- replace broken icon with working emoji
4. **Fix `hl.sh`** -- add trailing slash for consistency

### Priority 2: Resolve Naming Conflicts (immediate)

1. Decide if `dc` = "DOC" or "Dental CRM" and make all tiers consistent
2. Decide canonical spelling: "Civilant" vs "Civalent" for `ct`
3. Decide if `root.sh` should use `cursor` or `code`

### Priority 3: Eliminate Duplication (medium-term)

**Option A: Generator script (recommended if individual scripts are valued)**

Create `raycast-scripts/generate.sh` that reads from a `projects.tsv` data file and generates
all per-project scripts. Run the generator whenever the project list changes. This preserves the
instant-type-code-and-go UX while centralizing the source of truth.

**Option B: Dropdown-only (recommended if simplicity is valued)**

Delete all individual project scripts. Enhance `open-project.sh` with a second dropdown argument
for tier (homelab/local/cloudpc). Result: 1 script replaces 63.

**Option C: Hybrid**

Keep `open-project.sh` as the primary interface. Keep individual scripts only for the 5-8 most
frequently used projects. Delete the rest.

### Priority 4: Unify Project Registries (medium-term)

The project list is currently scattered across 6+ locations. A single `projects.json` or
`projects.tsv` file should be the source of truth, consumed by:
- Raycast script generator
- cmux-workspaces.sh
- `open-project.sh` dropdown JSON
- CLAUDE.md project registry

### Priority 5: Add Minimal Error Handling (low priority)

For remote scripts, add a connectivity pre-check:

```bash
ssh -o ConnectTimeout=2 -o BatchMode=yes homelab true 2>/dev/null || {
  osascript -e 'display notification "Homelab unreachable" with title "Raycast"'
  exit 1
}
```

This prevents the silent failure mode where a script runs, nothing happens, and the user has no
feedback.

---

## Health Score: POOR

| Dimension | Rating | Rationale |
|-----------|--------|-----------|
| Functionality | GOOD | Scripts work (except 2 bugs) and serve their purpose |
| Maintainability | CRITICAL | 10x duplication, no source of truth, manual metadata |
| Consistency | POOR | Metadata fields, icons, names, and paths drift across tiers |
| Correctness | POOR | 2 path bugs actively sending users to wrong projects |
| Architecture | POOR | Configuration-as-code anti-pattern; data encoded as code |
| Error handling | CRITICAL | Zero error handling; all failures are silent |

**Overall: POOR.** The scripts work day-to-day but the architecture actively causes bugs (the
`sc.sh` -> `se/` path error is almost certainly a copy-paste mistake from the duplication pattern)
and makes maintenance error-prone. The `open-project.sh` dropdown scripts already prove the
parameterized approach works -- the individual scripts are redundant.

---

## Sources

- [Raycast Script Commands Repository](https://github.com/raycast/script-commands)
- [Raycast Script Commands Manual](https://manual.raycast.com/script-commands)
- [Raycast Script Command Arguments](https://github.com/raycast/script-commands/blob/master/documentation/ARGUMENTS.md)
- [Raycast Inputs for Script Commands](https://www.raycast.com/blog/inputs-for-script-commands)
- [Cursor --folder-uri Bug Report](https://forum.cursor.com/t/remote-workspace-folder-uri-vscode-remote-does-nothing-script-hangs-when-cursor-already-open/153009)
- [VS Code Remote SSH Documentation](https://code.visualstudio.com/docs/remote/ssh)
- [Raycast Extensions vs Alfred Workflows](https://www.techlila.com/raycast-extensions-vs-alfred-workflows/)
- [Raycast in 2026](https://dev.to/dharanidharan_d_tech/raycast-in-2026-the-mac-launcher-that-replaced-4-apps-in-my-dev-workflow-3pka)
