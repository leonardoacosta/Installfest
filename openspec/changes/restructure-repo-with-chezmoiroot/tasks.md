# Implementation Tasks

<!-- beads:epic:if-o5o -->

## Preparation Batch

- [x] [0.1] [P-1] Verify chezmoi version supports .chezmoi.workingTree — run `chezmoi doctor` and `chezmoi execute-template '{{ .chezmoi.workingTree }}'` [owner:general-purpose] [beads:if-j8j]
- [x] [0.2] [P-1] Snapshot current state — run `chezmoi diff > /tmp/pre-restructure.diff` and `chezmoi managed > /tmp/pre-managed.txt` for post-migration verification [owner:general-purpose] [beads:if-jf8]

## Migration Batch

- [ ] [1.1] [P-1] Create `home/` directory and move all chezmoi-managed items into it: dot_config/, dot_local/, dot_zsh/, private_dot_ssh/, Library/, dot_zshenv.tmpl, dot_zshrc, run_once_*.sh.tmpl, run_onchange_*.sh.tmpl, .chezmoi.toml.tmpl, .chezmoiignore [owner:general-purpose] [beads:if-stv]
- [ ] [1.2] [P-1] Create `.chezmoiroot` at repo root with content `home` [owner:general-purpose] [beads:if-7az]
- [ ] [1.3] [P-1] Create `platform/` directory and move homebrew/, windows/, raycast-scripts/ into it [owner:general-purpose] [beads:if-0jn]
- [ ] [1.4] [P-1] Move `projects.toml` into `home/` — required because `{{ include "projects.toml" }}` in templates resolves relative to chezmoi source dir (now `home/`); add to `.chezmoiignore` [owner:general-purpose] [beads:if-cbn]
- [ ] [1.5] [P-1] Update `home/.chezmoiignore` — remove entries for dirs now outside home/ (docs, scripts, ssh-mesh, windows, homebrew, raycast-scripts); add projects.toml; keep platform-conditional ignores [owner:general-purpose] [beads:if-rnt]

## Fix Batch

- [ ] [2.1] [P-1] Update `home/run_once_install-packages.sh.tmpl` — change `{{ .chezmoi.sourceDir }}` to `{{ .chezmoi.workingTree }}` [owner:general-purpose] [beads:if-pre]
- [ ] [2.2] [P-1] Update `home/run_onchange_set-git-hooks.sh.tmpl` — change `{{ .chezmoi.sourceDir }}` to `{{ .chezmoi.workingTree }}` [owner:general-purpose] [beads:if-o0a]
- [ ] [2.3] [P-1] Update `home/run_onchange_after_generate-raycast.sh.tmpl` — change `{{ .chezmoi.sourceDir }}` to `{{ .chezmoi.workingTree }}` for scripts/ path [owner:general-purpose] [beads:if-grm]
- [ ] [2.4] [P-1] Update scripts that consume `projects.toml` — `scripts/generate-raycast.sh`, `scripts/cmux-workspaces.sh`, `scripts/mux-remote.sh` may hardcode `$DOTFILES/projects.toml`; update to `$DOTFILES/home/projects.toml` [owner:general-purpose] [beads:if-dwx]

## Documentation Batch

- [ ] [3.1] [P-2] Update CLAUDE.md directory structure diagram to reflect home/ and platform/ layout [owner:general-purpose] [beads:if-lwc]
- [ ] [3.2] [P-2] Update README.md directory structure and path references [owner:general-purpose] [beads:if-7k0]

## Verification Batch

- [ ] [4.1] [P-1] Run `chezmoi diff` and compare with pre-restructure snapshot — must show zero drift [owner:general-purpose] [beads:if-0ed]
- [ ] [4.2] [P-1] Run `chezmoi managed` and compare with pre-managed.txt — same files listed [owner:general-purpose] [beads:if-8h9]
- [ ] [4.3] [P-1] Run `chezmoi apply --dry-run` — confirm no unexpected changes [owner:general-purpose] [beads:if-h0d]
- [ ] [4.4] [P-2] Verify `chezmoi edit ~/.zshrc` opens `home/dot_zshrc` [owner:general-purpose] [beads:if-urw]
