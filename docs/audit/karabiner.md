# Karabiner-Elements Audit

> Adversarial audit of the Karabiner RDP keyboard remapping configuration.
> Scope: `karabiner/mac_osx_on_rdp.json` and its integration into the dotfiles ecosystem.
> Generated: 2026-03-25

**Health Score: POOR**

---

## 1. Current Setup

The configuration lives at `/Users/leonardoacosta/dev/if/karabiner/mac_osx_on_rdp.json` (1,115 lines). It is a Karabiner-Elements complex modifications file containing **22 rules** with **28 manipulators** total.

### Complete Rule Inventory

| # | Rule Description | From | To | Mechanism | Lines |
|---|-----------------|------|-----|-----------|-------|
| 0 | Cmd+Left/Right to Home/End | `left_command` + `left_arrow` | `home` | simultaneous | 8-92 |
| 1 | Cmd+Shift+Left/Right to Shift+Home/End | `command+shift` + arrows | `shift+home/end` | modifier | 94-177 |
| 2 | Cmd+Tab to Alt+Tab | `command+tab` | `option+tab` | modifier | 179-218 |
| 3 | Copy/Paste/Cut (Cmd+C/V/X to Ctrl+C/V/X) | `command` + `c/v/x` | `control` + `c/v/x` | modifier | 220-322 |
| 4 | Option+Left/Right to Ctrl+Left/Right (word nav) | `left_option` + arrows | `control` + arrows | modifier | 324-399 |
| 5 | Undo (Cmd+Z to Ctrl+Z) | `command+z` | `control+z` | modifier | 401-437 |
| 6 | Redo (Cmd+Shift+Z to Ctrl+Shift+Z) | `command+shift+z` | `left_control+left_shift+z` | modifier | 439-477 |
| 7 | Select-All (Cmd+A to Ctrl+A) | `command+a` | `control+a` | modifier | 479-518 |
| 8 | Save (Cmd+S to Ctrl+S) | `command+s` | `control+s` | modifier | 520-559 |
| 9 | New (Cmd+N to Ctrl+N) | `command+n` | `control+n` | modifier | 561-600 |
| 10 | Browser Reload (Cmd+R to F5, Cmd+Shift+R to Ctrl+F5) | `left_command+r` / `command+shift+r` | `f5` / `left_control+f5` | simultaneous + modifier | 602-674 |
| 11 | Browser Open Location (Cmd+L to Ctrl+L) | `command+l` | `control+l` | modifier | 676-712 |
| 12 | New Tab (Cmd+T to Ctrl+T) | `command+t` | `control+t` | modifier | 714-753 |
| 13 | Browser DevTools (Cmd+Shift+I to Ctrl+Shift+I) | `command+shift+i` | `control+shift+i` | modifier | 755-796 |
| 14 | Find (Cmd+F to Ctrl+F) | `left_command+f` | `control+f` | modifier | 798-837 |
| 15 | Open (Cmd+O to Ctrl+O) | `left_command+o` | `control+o` | modifier | 839-878 |
| 16 | Close Window (Cmd+W to Ctrl+W) | `left_command+w` | `control+w` | modifier | 880-919 |
| 17 | Fn+Space to Switch Input (Shift+Alt) | `fn+spacebar` | `left_option+left_shift` | modifier | 921-957 |
| 18 | Cmd+Space to Switch Input (Shift+Alt) | `command+spacebar` | `left_option+left_shift` | modifier | 959-995 |
| 19 | Cmd+Space to Switch Input (Shift+Ctrl) | `command+spacebar` | `left_control+left_shift` | modifier | 997-1033 |
| 20 | Quit Application (Cmd+Q to Alt+F4) | `command+q` | `option+f4` | modifier | 1035-1071 |
| 21 | Code Comment (Cmd+/ to Ctrl+/) | `command+slash` | `control+slash` | modifier | 1073-1113 |

### Active vs. Available

Of the 22 rules defined in the file, **only 1 rule is actually enabled** in `~/.config/karabiner/karabiner.json` -- the Copy/Paste/Cut rule (Rule 3). The other 21 rules are available for import but have not been enabled by the user.

---

## 2. Intent Analysis

The intent is clear and well-defined: **allow a macOS user to use familiar Mac keyboard shortcuts when connected to a Windows machine via RDP** (or other remote desktop clients). The config targets the same muscle-memory problem from the opposite direction as `windows/mac-keyboard.ahk`.

This is a real, common pain point. When RDPing from Mac to Windows, Cmd+C does nothing useful because the RDP client passes `Cmd` through and Windows expects `Ctrl`. Karabiner intercepts at the macOS level, converting Cmd-based shortcuts to Ctrl-based ones only when the RDP app is frontmost.

The coverage addresses the most critical shortcuts: clipboard operations, navigation, undo/redo, browser shortcuts, app switching, and quit. The approach of using `frontmost_application_if` conditions is the canonical Karabiner pattern for app-specific remapping.

---

## 3. Cross-Domain Interactions

### Integration with `windows/mac-keyboard.ahk`

These two files solve the **same problem from opposite directions**:
- **Karabiner** (macOS side): "I'm on a Mac, RDPing to Windows. Make my Mac shortcuts work in Windows."
- **AHK** (Windows side): "I have a Mac keyboard connected to Windows via Synergy. Make Mac keys work natively in Windows."

They are **not redundant** -- they serve different physical setups. But they should be **symmetric** in coverage, and they are not (see Section 9).

### Integration with Brewfile

Karabiner-Elements is correctly listed in `homebrew/Brewfile` at line 64:
```
cask "karabiner-elements"
```

### Integration with symlinks.conf

**NOT INTEGRATED.** Karabiner is absent from `scripts/symlinks.conf`. The `karabiner/` directory is not symlinked to `~/.config/karabiner/`. The README documents a manual copy operation instead of a symlink, which means the repo config and the installed config can drift silently.

Currently, the repo file and the installed file (`~/.config/karabiner/assets/complex_modifications/mac_osx_on_rdp.json`) are byte-identical (43,914 bytes each), but this is coincidental -- no mechanism keeps them in sync.

### Integration with install.sh

**NOT INTEGRATED.** The installer does not reference Karabiner at all. There is no step to copy or symlink the Karabiner config during installation.

### Integration with Ghostty/WezTerm/tmux

No interaction. Karabiner operates at the macOS input layer, below the terminal emulator. The RDP condition ensures no interference with normal terminal usage.

---

## 4. Best Practices Audit

### Evaluated Against Karabiner Documentation and Community Patterns

| Practice | Status | Detail |
|----------|--------|--------|
| App-specific conditions via `frontmost_application_if` | GOOD | Correctly scoped to RDP apps only |
| Modifier-based `from` for standard shortcuts | GOOD | Most rules use the reliable modifier approach |
| `simultaneous` for Cmd+key | PROBLEMATIC | 3 manipulators use `simultaneous` -- unreliable (see below) |
| Manipulator evaluation priority awareness | FAILED | Duplicate `from` triggers cause silent rule shadowing |
| DRY conditions | FAILED | Same 7-element `bundle_identifiers` array repeated 28 times |
| Consistent modifier naming | FAILED | Mixes `command` and `left_command` inconsistently |
| `optional` modifier usage | INCONSISTENT | Some rules pass through Shift via `optional: ["any"]`, others don't |
| Description accuracy | MINOR ISSUE | Rule 20 has typo: "Alf+F4" instead of "Alt+F4" |

### The `simultaneous` Problem

Rules 0 and 10 use `simultaneous` (pressing `left_command` and a key at the same time within 500ms) instead of the standard modifier approach. This is **less reliable** than modifier-based matching:

1. **Timing-dependent**: Requires both keys pressed within the threshold. If the user holds Cmd then presses Left Arrow (normal modifier usage), it may not trigger.
2. **500ms threshold is very loose**: The default is 50ms. A 500ms threshold means almost any key pressed within half a second of Cmd will be captured.
3. **Inconsistent with other rules**: Rules 1 (Cmd+Shift+Left/Right) use the standard modifier approach for the same key. A user pressing Cmd+Left might trigger Rule 0's simultaneous match sometimes and fail other times, while Cmd+Shift+Left always works via Rule 1.

The upstream `varp/karabiner-rdp` uses this same approach, but it is a known limitation of the original config. A modifier-based approach would be more reliable.

Sources:
- [Karabiner from.simultaneous documentation](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/from/simultaneous/)
- [Karabiner complex modifications best practices](https://karabiner-elements.pqrs.org/docs/manual/configuration/configure-complex-modifications/)
- [Simultaneous keybindings reliability discussion](https://nethumlamahewage.medium.com/simultaneous-keybindings-with-karabiner-elements-ddeb3c4a6eaa)

---

## 5. Tool Choices

### Karabiner-Elements: The Right Tool

For macOS-level keyboard remapping scoped to specific applications, Karabiner-Elements is the correct and essentially only serious choice:

| Alternative | Viable? | Why / Why Not |
|-------------|---------|---------------|
| **Karabiner-Elements** | YES | Purpose-built for low-level macOS keyboard remapping. Open-source, free, actively maintained. The only tool with `frontmost_application_if` conditions for app-specific remapping. |
| **BetterTouchTool** | Partial | Can remap keys per-app, but primarily a gesture/automation tool. Paid ($10+). Overkill for pure keyboard remapping. |
| **Hammerspoon** | Partial | Lua-scripted macOS automation. Can intercept keys but lacks Karabiner's kernel-level interception and per-app conditions. More complex for this use case. |
| **Keyboard Maestro** | No | Macro automation tool, not a keyboard remapper. Wrong abstraction level. Paid ($36). |
| **Microsoft RDP built-in** | No | Microsoft Remote Desktop has a "forward keyboard shortcuts" option but it sends Mac shortcuts to Windows raw -- it doesn't translate Cmd to Ctrl. |

**Verdict**: Karabiner-Elements is the right tool. No change recommended.

Sources:
- [Karabiner-Elements](https://karabiner-elements.pqrs.org/)
- [AlternativeTo: Karabiner alternatives](https://alternativeto.net/software/karabiner-elements/?platform=mac)
- [Mac Automation Showdown: BTT vs KM vs Karabiner](https://blog.apps.deals/2025-04-23-mac-automation-showdown)

---

## 6. Configuration Quality

### BUG: Duplicate Cmd+Space Rules (Rules 18 and 19)

**This is the most critical issue in the file.**

Rules 18 and 19 have **identical `from` triggers and identical conditions**:

```
Rule 18: Cmd+Space -> Left Shift + Left Alt    (lines 959-995)
Rule 19: Cmd+Space -> Left Shift + Left Ctrl   (lines 997-1033)
```

Per [Karabiner's documented evaluation priority](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-evaluation-priority/): "The manipulators are evaluated from the top to the bottom and the input event is manipulated only the first matched manipulator."

**Rule 19 is dead code.** It will never fire because Rule 18 matches first. The `Shift+Ctrl` variant for input switching is unreachable.

This appears to be an **upstream bug in varp/karabiner-rdp** -- both rules exist in the original repo with the same structure. The intent was likely to offer the user a choice (some Windows systems use `Shift+Alt` for input switching, others use `Shift+Ctrl`), but Karabiner does not support "pick one" -- both rules get imported and the first one wins silently.

**Fix**: Delete Rule 19 (or Rule 18) and keep only the one matching the target Windows input switching configuration.

### Inconsistent Modifier Naming

The file inconsistently uses `"command"` (generic, matches both left and right) and `"left_command"` (matches only left Cmd):

| Pattern | Rules Using It |
|---------|---------------|
| `"command"` (generic) | 1 (left manip), 2, 3, 5, 6, 7, 8, 9, 10 (shift+r manip), 11, 12, 13, 18, 19, 20, 21 |
| `"left_command"` (left only) | 1 (right manip), 14, 15, 16 |
| `"left_option"` (left only) | 4 |

This means:
- Cmd+F (Rule 14) only works with **left** Cmd. Right Cmd+F does nothing.
- Cmd+C (Rule 3) works with **either** Cmd key.
- Within Rule 1 itself, the left-arrow manipulator uses `"command"` but the right-arrow manipulator uses `"left_command"` -- so `Cmd+Shift+Left` works with both Cmd keys but `Cmd+Shift+Right` only works with left Cmd.

This is almost certainly unintentional.

### Inconsistent `optional` Modifier Pass-Through

Some rules use `"optional": ["any"]` (passes through additional modifiers like Shift), others use `"optional": ["shift"]` (only passes Shift), and others have no optional modifiers at all:

| Optional Setting | Rules | Implication |
|-----------------|-------|-------------|
| `["any"]` | 7 (select-all), 8 (save), 9 (new), 12 (tab), 13 (devtools), 14 (find), 15 (open), 16 (close), 21 (comment) | Cmd+Shift+A, Cmd+Shift+S, etc. all work |
| `["shift"]` | 2 (tab), 4 (option+arrows) | Only Shift passes through |
| None | 3 (copy/paste/cut), 5 (undo), 11 (address bar), 18/19 (input switch), 20 (quit) | No modifiers pass through |

This means `Cmd+Shift+C` does NOT work (no optional on Rule 3), but `Cmd+Shift+F` DOES work (optional: any on Rule 14). This is inconsistent. In Windows, Ctrl+Shift+C is a common shortcut (e.g., "Copy as path" in File Explorer, copy formatted in some apps).

### Typo in Rule Description

Rule 20 (line 1036): `"Cmd+q to Alf+F4"` should be `"Cmd+q to Alt+F4"`.

### `set_variable` Side Effect in Navigation Rules

Rules 0 and 1 set a variable `win_used_in_combination_with` to `true` after firing, but **nothing in the configuration ever reads this variable**. It is set but never consumed. This appears to be leftover scaffolding from the upstream project, possibly intended for a "Win key alone = Start Menu" feature that was never implemented.

---

## 7. Architecture Assessment

### File Origin

This is a **third-party configuration from [varp/karabiner-rdp](https://github.com/varp/karabiner-rdp)**, adopted with no local modifications. The file in the repo is byte-identical to the upstream version. The README at `karabiner/README.md` correctly attributes the source.

The upstream repo has modest activity (issues opened as recently as June 2025) but the core JSON file has not been significantly updated. It is a community-contributed Karabiner config, not an official Karabiner-Elements distribution.

### File Management

Karabiner-Elements manages its own config at `~/.config/karabiner/karabiner.json`. Complex modification JSON files in `~/.config/karabiner/assets/complex_modifications/` are **import sources** -- the user imports individual rules from these files into `karabiner.json` via the Karabiner UI.

This means:
1. The JSON file in the repo is a **template/source**, not the live config.
2. Editing the repo file does NOT change active behavior -- the user must re-import rules.
3. The actual active rules are in `~/.config/karabiner/karabiner.json`, which is auto-managed by Karabiner-Elements and should NOT be version-controlled (it changes on every UI interaction).

This architecture is correct. The repo should contain the complex modification source files, and `karabiner.json` should be excluded from version control.

### Structural Bloat

The file is **1,115 lines and 43,914 bytes** for 22 rules. This is entirely due to the repeated `bundle_identifiers` array. The same 7-element regex array is copy-pasted into every single one of the 28 manipulators (28 x 7 = 196 regex strings). Karabiner's JSON format does not support shared condition definitions ([open feature request #3496](https://github.com/pqrs-org/Karabiner-Elements/issues/3496)), so this duplication is technically unavoidable within the JSON format itself.

However, the file could be **generated from a more compact source** (e.g., a YAML or TOML template that injects the app list) to make maintenance easier. Adding a new RDP app currently requires editing 28 locations.

---

## 8. Missing Capabilities

### Shortcuts Present in AHK but Missing from Karabiner

The AHK file (`windows/mac-keyboard.ahk`) maps 35 shortcuts that the Karabiner config does not cover. The most impactful missing mappings:

| Missing Shortcut | Mac Action | Windows Equivalent | Impact |
|-----------------|------------|-------------------|--------|
| `Cmd+Up/Down` | Top/Bottom of document | `Ctrl+Home/End` | **High** -- common text navigation |
| `Cmd+Shift+Up/Down` | Select to top/bottom | `Ctrl+Shift+Home/End` | **High** -- common text selection |
| `Cmd+Backspace` | Delete to line start | `Shift+Home, Del` | **Medium** -- text editing |
| `Cmd+1-9` | Switch to tab N | `Ctrl+1-9` | **Medium** -- browser/editor tab switching |
| `Opt+Backspace` | Delete word backward | `Ctrl+Backspace` | **Medium** -- text editing |
| `Opt+Shift+Left/Right` | Select word left/right | `Ctrl+Shift+Left/Right` | **Medium** -- text selection |
| `Cmd+P` | Quick Open / Print | `Ctrl+P` | **Medium** -- universal shortcut |
| `Cmd+Shift+T` | Reopen closed tab | `Ctrl+Shift+T` | **Medium** -- browser |
| `Cmd+Shift+Tab` | Previous tab | `Shift+Alt+Tab` | **Low** -- app switching |
| `Cmd+D` | Select next occurrence | `Ctrl+D` | **Low** -- VS Code specific |
| `Cmd+B` | Toggle sidebar | `Ctrl+B` | **Low** -- VS Code specific |
| `Cmd+Shift+3/4/5` | Screenshots | `Win+Shift+S` | **Low** -- screenshots inside RDP |
| `Cmd+H` | Find & Replace | `Ctrl+H` | **Low** |
| `Cmd+I` | Italic / Info | `Ctrl+I` | **Low** |
| `Cmd+Space` | Launcher (Raycast) | Various | Conflated with input switching (see Section 6) |

### Shortcuts in Karabiner but Missing from AHK

| Shortcut | Karabiner Maps To | Notes |
|----------|-------------------|-------|
| `Cmd+O` (Open) | `Ctrl+O` | AHK doesn't have this; minor gap |
| `Cmd+Shift+I` (DevTools) | `Ctrl+Shift+I` | AHK maps `Cmd+I` to `Ctrl+I` but doesn't have the Shift variant explicitly |

---

## 9. Redundancies

### Karabiner vs. AHK: Not Redundant, But Asymmetric

These serve **different physical setups** and are NOT redundant:

| Scenario | Tool | Direction |
|----------|------|-----------|
| Mac user RDPs to Windows PC | Karabiner (`mac_osx_on_rdp.json`) | Mac keyboard -> Mac shortcuts -> intercept on Mac -> send Windows-compatible keys over RDP |
| Mac keyboard connected to Windows via Synergy | AHK (`mac-keyboard.ahk`) | Mac keyboard -> Synergy sends Win/Alt -> AHK intercepts on Windows -> translates to Ctrl-based shortcuts |

However, the **coverage asymmetry is significant**. The AHK file maps ~55 shortcuts. The Karabiner file maps ~26 (28 manipulators minus the 2 dead Cmd+Space duplicates). The AHK file is roughly **2x more comprehensive**.

### Behavioral Differences

Three shortcuts behave differently between the two configs:

| Shortcut | Karabiner (RDP) | AHK (Synergy) | Notes |
|----------|-----------------|---------------|-------|
| `Cmd+R` | `F5` | `Ctrl+R` | Both reload a browser page, but via different keys. `F5` is more universal on Windows. Karabiner is arguably better here. |
| `Cmd+Shift+R` | `Ctrl+F5` (hard refresh) | `Ctrl+Shift+R` | Both trigger hard refresh in Chrome. `Ctrl+F5` is more broadly compatible. Karabiner is better. |
| `Cmd+Shift+Z` | `Ctrl+Shift+Z` | `Ctrl+Y` | Both are redo. `Ctrl+Y` is the traditional Windows redo; `Ctrl+Shift+Z` is the modern cross-platform redo (works in Adobe, VS Code, etc.). Neither is universally correct. |
| `Cmd+Space` | `Shift+Alt` (input switch) | `Alt+Space` (Raycast) | **Fundamentally different intent.** Karabiner maps to Windows input language switching. AHK maps to Raycast launcher. This reflects different use cases for the same shortcut. |

---

## 10. Ambiguities

### 1. Which Cmd+Space Behavior is Desired?

Three rules map space-related shortcuts:
- Rule 17: `Fn+Space` -> `Shift+Alt` (input switching)
- Rule 18: `Cmd+Space` -> `Shift+Alt` (input switching)
- Rule 19: `Cmd+Space` -> `Shift+Ctrl` (input switching) -- **dead code**

But on macOS, `Cmd+Space` is Spotlight/Raycast. Should this map to:
- Windows input switching (`Shift+Alt`) -- current behavior?
- Windows search (`Win+S`)?
- A launcher like PowerToys Run?

The AHK file maps `Cmd+Space` to `Alt+Space` (Raycast on Windows). This suggests the user's intent is **launcher**, not input switching. The Karabiner config may have the wrong mapping entirely.

### 2. Should `simultaneous` Rules Be Converted to Modifier Rules?

Rules 0 and 10 use `simultaneous` instead of modifier-based matching. Is this intentional (some specific Karabiner/RDP interaction requires it) or a quirk of the upstream config? The modifier approach is more reliable and consistent with the other 25 manipulators.

### 3. Is `left_command` vs `command` Intentional?

Rules 14-16 use `left_command` while most other rules use `command`. Is there a reason only Find, Open, and Close Window should be restricted to the left Cmd key? Almost certainly not -- this is an upstream inconsistency.

### 4. Only 1 of 22 Rules Enabled

The user's `karabiner.json` only has the Copy/Paste/Cut rule enabled. Are the other 21 rules unwanted, or did the user simply not finish importing them? This is a significant gap -- having the config in the repo but not activated means the setup is incomplete.

---

## 11. Recommendations

### Critical (Fix Now)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| C1 | **Dead Rule 19** (Cmd+Space -> Shift+Ctrl) is unreachable due to identical trigger in Rule 18 | Delete Rule 19 from `mac_osx_on_rdp.json`. Decide whether Cmd+Space should map to input switching or a launcher. | 5 min |
| C2 | **Only 1 of 22 rules enabled** in `karabiner.json` | Import and enable the remaining desired rules via Karabiner-Elements UI, or document that only Copy/Paste/Cut is needed | 10 min |
| C3 | **Config not in symlinks.conf** -- Karabiner is installed via Brewfile but config is orphaned | Add to `scripts/symlinks.conf`: `karabiner/mac_osx_on_rdp.json:$HOME/.config/karabiner/assets/complex_modifications/mac_osx_on_rdp.json` | 5 min |

### Important (Should Fix)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| I1 | **Inconsistent modifier naming** (`command` vs `left_command`) causes right-Cmd to fail for Find/Open/Close | Standardize all rules to use `"command"` (generic) unless left-only is explicitly desired | 15 min |
| I2 | **`simultaneous` approach for Rules 0 and 10** is unreliable compared to modifier approach | Convert `simultaneous` manipulators to standard `"from": {"key_code": "...", "modifiers": {"mandatory": ["command"]}}` format | 20 min |
| I3 | **Missing high-impact shortcuts**: Cmd+Up/Down (document top/bottom), Cmd+Shift+Up/Down (select to top/bottom), Cmd+Backspace (delete to line start) | Add manipulators for these common navigation shortcuts | 30 min |
| I4 | **Inconsistent `optional` modifier pass-through** -- Cmd+Shift+C doesn't work but Cmd+Shift+F does | Audit all rules and add `"optional": ["any"]` to clipboard rules and others where Shift variants exist in Windows | 20 min |

### Minor (Polish)

| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| M1 | **Typo** in Rule 20 description: "Alf+F4" | Change to "Alt+F4" | 1 min |
| M2 | **Unused `win_used_in_combination_with` variable** in Rules 0 and 1 | Remove `set_variable` blocks from these manipulators | 5 min |
| M3 | **Missing tab-switching shortcuts** (Cmd+1-9, Cmd+Shift+T) | Add if tab switching via RDP is needed | 15 min |
| M4 | **Consider a generator script** for the JSON to avoid 28x duplication of `bundle_identifiers` | Create a small Python/Node script that generates the JSON from a compact YAML source | 1-2 hr |
| M5 | **Cmd+Space intent mismatch** with AHK file -- consider whether launcher (Win+S or Alt+Space) is more useful than input switching | Change Rule 18 target based on actual Windows-side setup | 5 min |

### Summary

The Karabiner config is a **functional but poorly maintained third-party import** with a dead rule, inconsistent modifiers, missing shortcuts, and no integration into the dotfiles deployment pipeline. It works for the single rule that is actually enabled (Copy/Paste/Cut), but the other 21 rules are sitting unused and several contain bugs that would surface if enabled.

The most impactful fix is C3 (adding to `symlinks.conf`) combined with C2 (enabling the rules the user actually wants). The config itself needs a cleanup pass (I1-I4) to fix the inconsistencies inherited from upstream, and the coverage gap versus the AHK file (Section 8) should be addressed if RDP usage is frequent.

---

## Sources

- [Karabiner-Elements Documentation](https://karabiner-elements.pqrs.org/docs/)
- [Karabiner complex modifications manipulator evaluation priority](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-evaluation-priority/)
- [Karabiner from.simultaneous documentation](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/from/simultaneous/)
- [Karabiner frontmost_application_if conditions](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/conditions/frontmost-application/)
- [Karabiner complex modifications community rules](https://ke-complex-modifications.pqrs.org/)
- [varp/karabiner-rdp on GitHub](https://github.com/varp/karabiner-rdp)
- [Karabiner bundle_identifiers lists feature request #3496](https://github.com/pqrs-org/Karabiner-Elements/issues/3496)
- [Karabiner DRY conditions feature request #2774](https://github.com/pqrs-org/Karabiner-Elements/issues/2774)
- [AlternativeTo: Karabiner alternatives](https://alternativeto.net/software/karabiner-elements/?platform=mac)
- [Mac Automation Showdown: BTT vs Keyboard Maestro vs Karabiner](https://blog.apps.deals/2025-04-23-mac-automation-showdown)
- [Karabiner Elements alternatives 2025](https://topalter.com/best-karabiner-elements-alternatives)
