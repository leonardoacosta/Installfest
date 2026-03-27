# Proposal: Add Smart az CLI Wrapper

## Change ID
`add-smart-az-wrapper`

## Summary
Create a smart `az` CLI wrapper at `~/.local/bin/az` that routes all Azure CLI traffic through the CloudPC SOCKS5 tunnel (proxychains4) for CAE compliance, auto-detects which Azure identity to use based on the API being called (O365 for Graph API, BBAdmin for everything else), and maintains separate login sessions per identity via `AZURE_CONFIG_DIR` — no switching, no races.

## Context
- Extends: `docs/cloudpc-proxy-setup.md` (existing SOCKS5 tunnel + proxychains documentation)
- Depends on: `cloudpc-tunnel.service` (systemd user service, already deployed), `proxychains-ng` (already installed via `scripts/install-arch.sh`), proxychains config at `~/.config/proxychains/proxychains.conf` (already deployed by chezmoi)
- Related: `dot_local/bin/edge-proxied`, `dot_local/bin/teams-proxied` (existing proxychains wrapper scripts)

## Motivation
Azure CLI commands must originate from CloudPC's IP to pass Microsoft Conditional Access Evaluation (CAE). Currently, every `az` invocation requires manually wrapping with `proxychains4` and manually setting `AZURE_CONFIG_DIR` depending on which identity the command needs. This is error-prone: forgetting the proxy silently fails CAE, and forgetting to switch identity causes auth errors or accidental cross-tenant operations.

Two distinct Azure identities are needed because the user has two separate Azure AD accounts in different tenants — O365 (leonardo.acosta@bridgespecialty.com) for Microsoft Graph API access (Teams, Outlook, Calendar, Mail) and BBAdmin (BBAdminLAcosta@bbins.com) for Azure Resource Management and Azure DevOps. A single wrapper that inspects the subcommand/arguments and selects the right identity + proxy eliminates all manual ceremony.

## Requirements

### Req-1: Dual identity with separate config directories
Two Azure identities, each with its own `AZURE_CONFIG_DIR` so login sessions are fully isolated:

| Identity | Config Dir | Used For |
|----------|-----------|----------|
| O365 (leonardo.acosta@bridgespecialty.com) | `~/.azure-o365` | Graph API: Teams, Outlook, Calendar, Mail |
| BBAdmin (BBAdminLAcosta@bbins.com) | `~/.azure-bbadmin` | Azure Resource Management, ADO, PIM |

`AZURE_CONFIG_DIR` is officially supported by the Azure CLI. Separate directories mean both identities can be logged in simultaneously with no switching or race conditions.

### Req-2: Auto-detection of identity from subcommand/arguments
The wrapper inspects the full argument string to select the identity:

**O365 identity** (Graph API):
- `az rest --resource https://graph.microsoft.com*`
- `az rest --url https://graph.microsoft.com/*`

**BBAdmin identity** (default — everything else):
- `az devops *`, `az pipelines *`, `az boards *`, `az repos *` (ADO)
- `az group *`, `az vm *`, `az webapp *`, `az storage *`, `az keyvault *` (ARM)
- `az rest --url https://management.azure.com/*`
- `az rest --url https://dev.azure.com/*`
- `az account *`, `az login *` (session management)
- Any unrecognized command

### Req-3: Explicit override flags
Two custom flags that force a specific identity regardless of auto-detection:
- `--as-o365` — force O365 identity
- `--as-admin` — force BBAdmin identity

Both flags are stripped from the argument list before passing to the real `az` binary. The flags override auto-detection when present.

### Req-4: SOCKS5 proxy routing
All `az` invocations are wrapped with `proxychains4 -q -f "$HOME/.config/proxychains/proxychains.conf"` to route through the CloudPC tunnel at `localhost:1080`. The `-q` flag suppresses proxychains output for clean az output. The real az binary is called at `/usr/bin/az` (bypassing the wrapper in PATH).

### Req-5: Setup script
`scripts/setup-az-wrapper.sh` automates first-time setup:
1. Create `~/.azure-bbadmin` and `~/.azure-o365` directories
2. Deploy the wrapper to `~/.local/bin/az` (or verify chezmoi has deployed it)
3. Verify proxychains config exists at `~/.config/proxychains/proxychains.conf`
4. Verify SOCKS tunnel is running (`pgrep -f "ssh.*-D.*1080.*cloudpc"`)
5. Prompt for BBAdmin login via device code flow
6. Prompt for O365 login via device code flow
7. Verify both identities work (`az account show` with each config dir)

### Req-6: Chezmoi integration
The wrapper is deployed as `dot_local/bin/az` in the chezmoi source directory so it is available on any machine after `chezmoi apply`. No templating needed — the script is platform-agnostic (uses `$HOME` and POSIX sh).

### Req-7: Documentation update
Add an "az CLI Wrapper" section to `docs/cloudpc-proxy-setup.md` documenting the dual-identity setup, detection logic, override flags, and one-time login procedure.

## Scope
- **IN**: az wrapper script, setup script, chezmoi template (`dot_local/bin/az`), documentation update
- **OUT**: Nova fleet service changes (they benefit automatically from the wrapper being in PATH), macOS ProxyBridge setup (separate concern), PySocks/HTTPS_PROXY native approach (does not work), changes to existing proxychains config

## Impact
| Area | Change |
|------|--------|
| `dot_local/bin/az` | New — chezmoi-managed smart az wrapper |
| `scripts/setup-az-wrapper.sh` | New — first-time setup + login script |
| `docs/cloudpc-proxy-setup.md` | Modified — add az wrapper documentation section |

## Risks
| Risk | Mitigation |
|------|-----------|
| SOCKS tunnel not running when az is called | Wrapper does not pre-check tunnel — proxychains will fail with a clear error. The tunnel is a systemd service with auto-restart. |
| Identity detection misroutes a command | BBAdmin is the safe default (more privileged). Override flags (`--as-o365`, `--as-admin`) provide escape hatch. Detection logic is simple string matching — easy to extend. |
| `/usr/bin/az` path differs on some systems | Arch Linux installs az to `/usr/bin/az`. If path changes, wrapper needs one-line update. Setup script verifies the real binary exists. |
| Tokens expire in one config dir | Standard `az login` behavior — re-run `az login --as-o365` or `az login --as-admin` to refresh. Each config dir manages its own token cache independently. |
| `sed` argument stripping edge case with quoted args | The `--as-o365`/`--as-admin` flags are standalone (no values), so simple `sed` substitution is safe. No risk of stripping partial matches since the flag names are unique. |

## Dependencies
- `cloudpc-tunnel.service` — SOCKS5 tunnel must be running (already deployed)
- `proxychains-ng` — must be installed (already installed via `scripts/install-arch.sh`)
- `~/.config/proxychains/proxychains.conf` — must exist (already deployed by chezmoi)
- Azure CLI (`/usr/bin/az`) — must be installed (already installed via `scripts/install-arch.sh`)
