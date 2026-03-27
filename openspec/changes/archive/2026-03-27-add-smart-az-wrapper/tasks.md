# Implementation Tasks

## Phase 1: az Wrapper Script

- [x] [1.1] Create `dot_local/bin/az` — POSIX sh wrapper script. Default `AZURE_CONFIG_DIR="$HOME/.azure-bbadmin"`. Case statement on `"$*"` to detect `graph.microsoft.com` (switch to `~/.azure-o365`), `--as-o365` (switch to `~/.azure-o365`), `--as-admin` (explicit BBAdmin, no-op since default). Strip `--as-o365` and `--as-admin` flags from args via sed before passing to real binary. Export `AZURE_CONFIG_DIR`. Exec through `proxychains4 -q -f "$HOME/.config/proxychains/proxychains.conf" /usr/bin/az $ARGS`. Mark executable. [owner:devops-engineer]

- [x] [1.2] Create `scripts/setup-az-wrapper.sh` — setup script that: (a) creates `~/.azure-bbadmin` and `~/.azure-o365` directories, (b) verifies `/usr/bin/az` exists, (c) verifies `~/.config/proxychains/proxychains.conf` exists, (d) verifies SOCKS tunnel is running via `pgrep -f "ssh.*-D.*1080.*cloudpc"` (warn if not), (e) runs BBAdmin login: `AZURE_CONFIG_DIR=~/.azure-bbadmin proxychains4 -q -f ~/.config/proxychains/proxychains.conf /usr/bin/az login --use-device-code` with prompt "Sign in as BBAdminLAcosta@bbins.com", (f) runs O365 login: `AZURE_CONFIG_DIR=~/.azure-o365 proxychains4 -q -f ~/.config/proxychains/proxychains.conf /usr/bin/az login --use-device-code` with prompt "Sign in as leonardo.acosta@bridgespecialty.com", (g) verifies both identities with `az account show` using each config dir, (h) prints summary. Mark executable. [owner:devops-engineer]

## Phase 2: Documentation

- [x] [2.1] Update `docs/cloudpc-proxy-setup.md` — add a new "## az CLI Wrapper" section after the existing "Adding More Apps" section. Document: dual-identity architecture table (O365 vs BBAdmin with config dirs and use cases), auto-detection logic (which subcommands route to which identity), override flags (`--as-o365`, `--as-admin`), one-time setup instructions (`scripts/setup-az-wrapper.sh` or manual login commands), verification commands (`az account show --as-o365`, `az account show --as-admin`), and how the wrapper chains with proxychains for CAE compliance. [owner:devops-engineer]

## Phase 3: Verification

- [x] [3.1] Verify wrapper deployment: run `chezmoi apply --dry-run` to confirm `dot_local/bin/az` would deploy to `~/.local/bin/az`. Verify the deployed wrapper has execute permission. Verify `which az` resolves to `~/.local/bin/az` (not `/usr/bin/az`). [owner:devops-engineer]

- [x] [3.2] Verify identity detection: test that `az rest --url https://graph.microsoft.com/v1.0/me` selects O365 config dir, `az devops project list` selects BBAdmin config dir, `az vm list --as-o365` selects O365 config dir (override), and that `--as-o365`/`--as-admin` flags are stripped from the args passed to `/usr/bin/az`. [owner:devops-engineer]

---

## Validation Gates

| Phase | Gate |
|-------|------|
| 1 Wrapper | `sh -n dot_local/bin/az` passes (syntax check). `sh -n scripts/setup-az-wrapper.sh` passes. Wrapper correctly routes `graph.microsoft.com` args to O365 config dir and defaults to BBAdmin for all other commands. |
| 2 Docs | `docs/cloudpc-proxy-setup.md` renders valid markdown. New section covers dual identity, detection logic, overrides, setup, and verification. |
| 3 Verify | `which az` returns `~/.local/bin/az`. Identity auto-detection produces correct `AZURE_CONFIG_DIR` for Graph API vs ARM/ADO commands. Override flags work and are stripped cleanly. |
