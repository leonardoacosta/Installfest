# SSH Mesh Audit

> Adversarial security and architecture audit of `ssh-mesh/`
> Generated: 2026-03-25
> Health Score: **CRITICAL**

---

## 1. Current Setup

A 3-machine mesh network connecting Mac (macbook-pro), Homelab (omarchy/Arch Linux), and CloudPC
(346-CPC-QJXVZ/Windows 11) using a single shared ED25519 keypair distributed to all machines. All
inter-machine traffic routes over Tailscale except Mac-to-Homelab which has smart LAN/Tailscale
fallback routing.

### File Inventory

| File | Lines | Purpose |
|------|------:|---------|
| `ssh-mesh/README.md` | 228 | Documentation: topology, setup, troubleshooting |
| `ssh-mesh/configs/mac.config` | 33 | SSH client config for Mac with LAN probe + Tailscale fallback |
| `ssh-mesh/configs/homelab.config` | 13 | SSH client config for Homelab (Tailscale only) |
| `ssh-mesh/configs/cloudpc.config` | 13 | SSH client config for CloudPC (Tailscale only) |
| `ssh-mesh/keys/id_ed25519` | 7 | Shared private key (gitignored, exists on disk) |
| `ssh-mesh/keys/id_ed25519.pub` | 1 | Shared public key (gitignored, exists on disk) |
| `ssh-mesh/scripts/setup-mac.sh` | 48 | Mac setup: copies keys + config, adds to agent |
| `ssh-mesh/scripts/setup-homelab.sh` | 51 | Homelab setup: copies keys + config + authorized_keys |
| `ssh-mesh/scripts/setup-cloudpc.ps1` | 124 | CloudPC setup: hardcoded key material, multi-user auth |
| `ssh-mesh/scripts/deploy-to-homelab.sh` | 32 | Mac-to-Homelab deployment via scp |
| `ssh-mesh/scripts/fetch-all-cloudpc.sh` | 34 | Git fetch across CloudPC repos (bash/WSL) |
| `ssh-mesh/scripts/fetch-all-cloudpc.ps1` | 36 | Git fetch across CloudPC repos (PowerShell native) |
| `ssh-mesh/scripts/remote/cmux-bridge/` | ~320 | Rust HTTP-to-cmux proxy for remote terminal control |

---

## 2. Intent Analysis

**Goal:** Passwordless SSH between 3 personal machines over a Tailscale overlay network, enabling:
- Remote development via Cursor SSH Remote (Mac to Homelab, Mac to CloudPC)
- Terminal multiplexer orchestration via cmux-bridge (remote hook/attention/notify)
- Git repo synchronization on CloudPC (fetch-all scripts)
- Image transfer for Claude Code workflows (raycast-scripts/img.sh)

**Machine roles:**

| Machine | Role | Accepts Inbound SSH | Initiates Outbound SSH |
|---------|------|---------------------|----------------------|
| Mac | Primary workstation, orchestrator | No (README says N/A) | Yes (to Homelab, CloudPC) |
| Homelab | Dev server, build machine | Yes | Yes (to CloudPC, Mac) |
| CloudPC | Windows dev environment (.NET, Azure) | Yes | Yes (to Homelab, Mac) |

**Tailscale dependency:** CloudPC has no LAN connectivity to the other machines -- it is remote-only
and reachable exclusively via Tailscale. Mac and Homelab share a LAN (192.168.1.x) with Tailscale
as fallback.

---

## 3. Cross-Domain Interactions

| Source Domain | Target Domain | Interaction | Mechanism | Fragility |
|---------------|---------------|-------------|-----------|-----------|
| `ssh-mesh/configs/` | `raycast-scripts/*.sh` | Raycast scripts depend on `homelab` and `cloudpc` Host aliases defined in SSH config | Host alias resolution | **Medium** -- if config not installed or host alias renamed, 30+ Raycast scripts break silently |
| `ssh-mesh/configs/mac.config` | `ghostty/cmux-workspaces.sh` | cmux launcher SSHes to `homelab` using the Host alias | SSH connection | **Medium** -- LAN probe failure could delay workspace creation |
| `ssh-mesh/scripts/remote/cmux-bridge/` | `launchd/com.leonardoacosta.cmux-bridge.plist` | LaunchAgent runs the compiled cmux-bridge binary | Binary path reference | **Low** -- plist points to `~/.claude/scripts/bin/cmux-bridge`, not the source |
| `ssh-mesh/configs/mac.config` | `wezterm/wezterm.lua` | WezTerm SSH domains likely reference the same host aliases | SSH config | **Low** -- WezTerm reads system `~/.ssh/config` |
| `ssh-mesh/scripts/setup-cloudpc.ps1` | `windows/setup.ps1` | **OVERLAP** -- both configure OpenSSH on CloudPC | Duplicate SSH setup | **High** -- conflicting configurations, see Section 10 |
| `ssh-mesh/keys/` | `ssh-mesh/scripts/setup-cloudpc.ps1` | Private key exists in both gitignored directory AND hardcoded in tracked script | Credential duplication | **CRITICAL** -- see Section 6 |
| `raycast-scripts/img.sh` | `ssh-mesh/configs/mac.config` | Image paste uses `homelab.tail296462.ts.net` (FQDN), not the `homelab` alias | Hardcoded Tailscale FQDN | **Medium** -- bypasses smart LAN routing |

---

## 4. Best Practices Audit

Best practice findings sourced from web research on SSH security hardening (2025-2026).

### 4.1 Key Management

| Practice | Status | Finding |
|----------|--------|---------|
| Per-machine key pairs | **FAIL** | Single shared key across all 3 machines. Compromise of any machine compromises all. |
| Key passphrase protection | **FAIL** | Private key header is `openssh-key-v1....none....none` -- no passphrase. |
| Key rotation policy | **FAIL** | No rotation policy documented. README says "consider rotating keys periodically" but no schedule, no tooling. |
| Keys excluded from version control | **PARTIAL** | `ssh-mesh/keys/` is gitignored, but the full private key is hardcoded in `setup-cloudpc.ps1` which IS tracked in a PUBLIC repo. |
| Least-privilege key usage | **FAIL** | Same key used for Git signing (windows/setup.ps1 line 494), SSH auth, and authorized_keys. No separation of concerns. |

### 4.2 Server-Side Hardening

| Practice | Status | Finding |
|----------|--------|---------|
| `PermitRootLogin no` | **ABSENT** | No sshd_config management for Homelab anywhere in the repo. |
| `MaxAuthTries` set low (3-4) | **ABSENT** | Not configured on any machine. |
| `PasswordAuthentication no` | **PARTIAL** | Configured in `windows/setup.ps1` for CloudPC. Not managed for Homelab. |
| `AllowUsers` / `AllowGroups` | **ABSENT** | No user allowlisting on any machine. |
| `LoginGraceTime` reduced | **ABSENT** | Default (120s) assumed on all machines. |
| `MaxSessions` limited | **ABSENT** | No session limit configured. |
| `MaxStartups` rate limiting | **ABSENT** | No connection rate limiting. |
| Fail2ban or equivalent | **ABSENT** | No brute-force protection on any machine. |
| SSH audit tool (`ssh-audit`) | **ABSENT** | No evidence of cipher/kex auditing. |

### 4.3 Client-Side Configuration

| Practice | Status | Finding |
|----------|--------|---------|
| `ServerAliveInterval` / `ServerAliveCountMax` | **PARTIAL** | Mac config has 30s/3 (good). Homelab and CloudPC configs have NONE. |
| `ConnectTimeout` | **PARTIAL** | Mac config has 10s. Homelab and CloudPC configs have NONE. |
| `ConnectionAttempts` | **PARTIAL** | Mac config has 2. Homelab and CloudPC configs have NONE. |
| `AddKeysToAgent` | **PARTIAL** | Mac config has it. Homelab and CloudPC configs do not. |
| `HostKeyAlgorithms` restricted | **ABSENT** | No algorithm restrictions on any client config. |
| `StrictHostKeyChecking` | **ABSENT** | Not explicitly set (defaults to `ask`). |
| `HashKnownHosts` | **ABSENT** | Not explicitly set. |

### 4.4 Tailscale SSH

| Practice | Status | Finding |
|----------|--------|---------|
| Use Tailscale SSH (eliminate keys entirely) | **NOT USED** | Tailscale is used purely as a VPN tunnel. SSH key management is entirely manual. Tailscale SSH would eliminate key distribution, authorized_keys maintenance, and key rotation entirely by delegating auth to the identity provider. |
| Tailscale ACLs for SSH restriction | **UNKNOWN** | No ACL configuration present in this repo. Tailscale admin console not auditable from here. |
| Check mode for privileged access | **NOT USED** | No re-authentication enforcement for sensitive connections. |

---

## 5. Tool Choices

### Current Approach: Manual SSH Config + Tailscale VPN

The setup uses Tailscale purely as a WireGuard tunnel, then layers traditional SSH key
authentication on top. This is the "Tailscale as dumb pipe" pattern.

### Assessment

| Approach | Complexity | Key Management | Auth Flexibility | Audit Trail | Fit |
|----------|-----------|----------------|-----------------|-------------|-----|
| **Current (manual SSH + Tailscale VPN)** | Low | Manual -- full burden on user | Static keys only | None | Acceptable for 3 machines, but fragile |
| **Tailscale SSH** | Very low | Eliminated entirely | SSO/MFA via identity provider | Session recording available | **Recommended** -- eliminates the biggest security gaps |
| **SSH Certificate Authority** | Medium | Centralized CA signs short-lived certs | Time-bounded access | Cert expiry = forced rotation | Overkill for 3 personal machines |
| **1Password SSH Agent** | Low | Keys in vault, never on disk | Biometric unlock per use | 1Password audit log | Good if already using 1Password |

**Recommendation:** Tailscale SSH is the clear winner here. The ecosystem overview already
identifies it as "the remote access standard for individuals and small teams." It would eliminate:
- The shared key problem
- The key rotation problem
- The hardcoded credential problem
- The authorized_keys maintenance problem
- The missing sshd_config hardening problem (Tailscale SSH doesn't use sshd)

The main tradeoff is that Tailscale SSH requires Tailscale to be running and connected. For
Mac-to-Homelab on LAN, the smart routing probe would need to be rethought -- but since Tailscale
uses DERP relays as fallback, connectivity is robust even without LAN.

---

## 6. Configuration Quality

### CRITICAL: Private Key Exposed in Public Repository

**File:** `/Users/leonardoacosta/dev/if/ssh-mesh/scripts/setup-cloudpc.ps1`, lines 14-22

The full ED25519 private key is hardcoded as a string literal in `setup-cloudpc.ps1`. This file is
tracked in git (`git ls-files` confirms it) and the repository is PUBLIC on GitHub
(`leonardoacosta/Installfest`, visibility: PUBLIC). The key has no passphrase (`none` in the
openssh-key-v1 header).

**Impact:** Anyone with internet access can extract this private key, and it grants SSH access to
both the Homelab and CloudPC. The key was introduced in commit `78bc732d` ("chore: cleanup automate
dir and add ssh-mesh config"). Even if removed now, it persists in git history.

**This alone warrants the CRITICAL health score.** The key must be considered fully compromised.

### Mac SSH Config: LAN Probe Reliability

**File:** `/Users/leonardoacosta/dev/if/ssh-mesh/configs/mac.config`, line 6

```
Match host homelab exec "bash -c 'exec 3<>/dev/tcp/192.168.1.100/22' 2>/dev/null & pid=$!; sleep 0.5; kill $pid 2>/dev/null && exit 1; wait $pid 2>/dev/null"
```

**Analysis:**
- The probe spawns a background bash process, sleeps 0.5s, then kills it. If the kill succeeds
  (process still running = port unreachable), it exits 1 (use Tailscale). If the process already
  exited (port reachable), kill fails, and it exits 0 (use LAN).
- The logic is correct but inverted from what you'd expect -- `kill succeeding` means failure, which
  is confusing for maintenance.
- The 0.5s sleep adds latency to every `ssh homelab` invocation, even when LAN is available (it
  must wait for the sleep to complete before proceeding).
- If the homelab is powered off, the probe takes 0.5s to fail, then SSH tries the Tailscale address
  which will also timeout. Total wait: 0.5s + ConnectTimeout (10s) = 10.5s.
- **Edge case:** If the homelab's sshd is down but the machine is up (port 22 closed), the probe
  correctly falls back to Tailscale -- but Tailscale would also fail since sshd is down. The probe
  doesn't distinguish "machine up, sshd down" from "machine unreachable."

### Homelab and CloudPC Configs: Missing Global Settings

**Files:**
- `/Users/leonardoacosta/dev/if/ssh-mesh/configs/homelab.config`
- `/Users/leonardoacosta/dev/if/ssh-mesh/configs/cloudpc.config`

These configs have only Host entries with no global `Host *` block. They lack:
- `ServerAliveInterval` / `ServerAliveCountMax` (keepalive)
- `ConnectTimeout`
- `ConnectionAttempts`
- `AddKeysToAgent`
- `SetEnv TERM=xterm-256color`

The Mac config has all of these. This is an inconsistency that will cause silent connection drops on
Homelab-to-CloudPC and CloudPC-to-Homelab connections, especially over Tailscale where path changes
can interrupt connections.

### setup-mac.sh: Config Overwrite Without Merge

**File:** `/Users/leonardoacosta/dev/if/ssh-mesh/scripts/setup-mac.sh`, line 35

```bash
cp "$MESH_DIR/configs/mac.config" ~/.ssh/config
```

This unconditionally overwrites `~/.ssh/config`. If the user has added any custom Host entries
(GitHub, work servers, etc.), they are destroyed. The backup on line 29 mitigates data loss but
the user must manually merge afterward. A safer approach would append or use an `Include`
directive.

### setup-homelab.sh: authorized_keys Overwrite

**File:** `/Users/leonardoacosta/dev/if/ssh-mesh/scripts/setup-homelab.sh`, line 41

```bash
cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
```

This uses `>` (overwrite), not `>>` (append). If the Homelab has any other authorized keys
(from other users, services, or Tailscale SSH certificates), they are silently deleted.

---

## 7. Architecture Assessment

### What Works

1. **Tailscale as the network layer** is sound. WireGuard provides encryption in transit, NAT
   traversal, and stable addressing. The 100.x.x.x addresses are predictable and don't change.

2. **Mac smart routing** is a pragmatic optimization. LAN connections are lower latency than
   Tailscale DERP relays, and the `/dev/tcp` probe is more reliable than macOS `nc -w`.

3. **cmux-bridge** is well-designed. IP validation restricts to localhost + Tailscale CGNAT range
   (100.64.0.0/10). It's a minimal Rust binary with no authentication beyond network-level trust,
   which is acceptable given Tailscale's encryption layer.

4. **Separation of configs per machine** allows each machine to have only the Host entries it needs.

### What Does Not Work

1. **Single shared key is a fundamental architecture flaw.** The blast radius of any single machine
   compromise is total. There is no way to revoke access to one machine without rotating the key on
   all machines.

2. **No server-side hardening at all.** The Homelab sshd_config is never touched by any script.
   Default Arch Linux sshd allows root login, password authentication, and unlimited auth attempts.

3. **The CloudPC has a complex dual-user model** (`leo` for SSH, `LeonardoAcosta` for desktop) that
   creates confusion. Both `ssh-mesh/scripts/setup-cloudpc.ps1` and `windows/setup.ps1` touch SSH
   configuration, and they do different things (see Section 10).

4. **No configuration management.** SSH configs are copied once by setup scripts. There is no
   mechanism to detect drift, push updates, or verify that deployed configs match the repo.
   The configs are NOT in `scripts/symlinks.conf`, so the symlink system doesn't manage them.

5. **cmux-bridge source lives inside ssh-mesh/ but is unrelated to SSH.** It's an HTTP proxy for
   the cmux terminal. Its placement under `ssh-mesh/scripts/remote/` conflates SSH infrastructure
   with application-layer tooling. The compiled Rust `target/` directory (even with its own
   .gitignore) adds noise to the ssh-mesh directory tree.

---

## 8. Missing Capabilities

| Capability | Impact | Difficulty |
|------------|--------|------------|
| **Key rotation tooling** | No way to rotate the shared key across 3 machines. Manual process would require touching all 3 machines and updating authorized_keys on 2. | Medium |
| **sshd_config hardening for Homelab** | Default Arch Linux sshd is wide open. No PermitRootLogin, MaxAuthTries, AllowUsers, or rate limiting. | Low |
| **Connection health monitoring** | No way to know if Homelab or CloudPC sshd is down until a connection attempt fails. | Low |
| **SSH config drift detection** | Deployed `~/.ssh/config` on each machine may diverge from the repo versions. No validation mechanism. | Low |
| **Host key verification** | No `known_hosts` management. First connection to any machine is TOFU (Trust On First Use) with no pinning. | Medium |
| **Backup/recovery for SSH state** | If Homelab is reinstalled, the setup-homelab.sh script must be re-run from Mac. No self-healing. | Low |
| **Tailscale SSH integration** | Would eliminate key management, authorized_keys, and sshd hardening concerns entirely. | Low-Medium |
| **Firewall rules for Homelab sshd** | No iptables/nftables rules restricting SSH to Tailscale + LAN. sshd listens on all interfaces. | Low |

---

## 9. Redundancies

| Redundancy | Files | Nature |
|------------|-------|--------|
| **CloudPC SSH setup exists in two places** | `ssh-mesh/scripts/setup-cloudpc.ps1` and `windows/setup.ps1` (Install-OpenSSHServer function) | Both install and configure OpenSSH Server on CloudPC. `setup-cloudpc.ps1` focuses on key distribution; `windows/setup.ps1` focuses on sshd_config hardening. Running both could produce conflicting configurations. |
| **fetch-all-cloudpc in two languages** | `ssh-mesh/scripts/fetch-all-cloudpc.sh` (bash/WSL) and `ssh-mesh/scripts/fetch-all-cloudpc.ps1` (PowerShell) | Same functionality, two implementations. The .sh version uses WSL paths (`/mnt/c/...`), the .ps1 uses native Windows paths. Maintenance burden: changes must be mirrored. |
| **Private key stored in three forms** | `ssh-mesh/keys/id_ed25519` (gitignored file), `setup-cloudpc.ps1` (hardcoded string, git-tracked), and deployed to `~/.ssh/id_ed25519` on each machine | Three copies of the same secret. The gitignored copy is properly protected; the hardcoded copy is the security breach. |
| **Tailscale IP addresses duplicated** | `ssh-mesh/README.md`, `ssh-mesh/configs/*.config`, `raycast-scripts/img.sh` | Tailscale IPs are hardcoded in multiple places. If an IP changes (Tailscale re-authentication can assign new IPs), all must be updated. The configs use hostnames in some places (homelab.tail296462.ts.net) and raw IPs in others (100.83.148.5). |

---

## 10. Ambiguities

These are unclear aspects that I flag without guessing at the answer.

| Item | Question | Where |
|------|----------|-------|
| **Mac inbound SSH** | README says Mac "doesn't accept inbound" but Homelab and CloudPC configs both define a `Host mac` entry with Tailscale IP. Is inbound SSH to Mac intentionally disabled (no sshd running) or just undocumented? | `ssh-mesh/README.md` line 84, `ssh-mesh/configs/homelab.config` line 10 |
| **Which CloudPC setup script is canonical?** | `setup-cloudpc.ps1` does key distribution. `windows/setup.ps1` does sshd hardening. Are they meant to be run together? In what order? Do they conflict? | `ssh-mesh/scripts/setup-cloudpc.ps1`, `windows/setup.ps1` |
| **Key in setup-cloudpc.ps1 vs key on disk** | The base64 in the PowerShell script and the key in `ssh-mesh/keys/id_ed25519` -- are these the same key? The base64 headers match but the bodies could differ if the key was regenerated. | `setup-cloudpc.ps1` line 16, `ssh-mesh/keys/id_ed25519` |
| **cmux-bridge deployment** | The Rust source is in `ssh-mesh/scripts/remote/` but the LaunchAgent plist references `~/.claude/scripts/bin/cmux-bridge`. How does the compiled binary get from the source directory to the deploy path? Cross-compilation for Homelab (Linux) is also unclear. | `ssh-mesh/scripts/remote/cmux-bridge/`, `launchd/com.leonardoacosta.cmux-bridge.plist` |
| **cmux-bridge binding to 0.0.0.0** | The bridge binds to `0.0.0.0:10998` (all interfaces). This is partially mitigated by the IP allowlist (localhost + Tailscale CGNAT), but the bind address exposes the port on all network interfaces including LAN. Is this intentional? | `ssh-mesh/scripts/remote/cmux-bridge/src/main.rs` line 6 |
| **authorized_keys on Mac** | If Mac "doesn't accept inbound," why do Homelab and CloudPC have outbound config pointing to it? Can they actually SSH in? | `ssh-mesh/configs/homelab.config` line 10, `ssh-mesh/configs/cloudpc.config` line 10 |
| **Tailscale FQDN vs IP inconsistency** | Mac config uses `homelab.tail296462.ts.net` for the Tailscale fallback, but CloudPC config uses raw IP `100.94.11.104` for the same host. Why the inconsistency? FQDNs are more resilient to IP reassignment. | `ssh-mesh/configs/mac.config` line 13, `ssh-mesh/configs/cloudpc.config` line 5 |
| **fetch-all-cloudpc purpose** | These scripts fetch all git branches on CloudPC repos. When and why are they run? Are they triggered by SSH from Mac? Manually on CloudPC? Part of a sync workflow? | `ssh-mesh/scripts/fetch-all-cloudpc.sh`, `ssh-mesh/scripts/fetch-all-cloudpc.ps1` |

---

## 11. Recommendations

### CRITICAL

**C1. Rotate the SSH key immediately.**
The private key is exposed in a public GitHub repository (`leonardoacosta/Installfest`, commit
`78bc732d`). Even after removing it from the current tree, it persists in git history. The key must
be considered fully compromised. Generate new keys (per-machine -- see C2), deploy them, and remove
the old key from `authorized_keys` on all machines.

**C2. Remove the hardcoded private key from `setup-cloudpc.ps1`.**
File: `/Users/leonardoacosta/dev/if/ssh-mesh/scripts/setup-cloudpc.ps1`, lines 14-22.
After rotating keys, this entire `$privateKeyContent` block must be removed. The script should
prompt the user to transfer the key securely (e.g., via `scp` from Mac, or a secrets manager)
rather than embedding it in source. Consider using `git filter-repo` or BFG Repo-Cleaner to
expunge the key from git history entirely, then force-push.

**C3. Generate per-machine SSH keys.**
Replace the single shared key with one keypair per machine. Each machine's public key gets added to
`authorized_keys` on the machines it needs to access. This limits blast radius: compromise of the
CloudPC key only affects connections originating from CloudPC. The ecosystem overview itself notes
that "Manual SSH key management" is declining in favor of identity-based approaches.

### Important

**I1. Enable Tailscale SSH.**
This is the single highest-leverage improvement. Tailscale SSH eliminates:
- SSH key generation, distribution, and rotation
- `authorized_keys` file management
- sshd_config hardening (Tailscale SSH bypasses sshd)
- The entire `ssh-mesh/keys/` directory and all setup scripts

Configuration moves to Tailscale ACLs in the admin console. Authentication is via your identity
provider. Documentation: https://tailscale.com/docs/features/tailscale-ssh

**I2. Add passphrase protection to all SSH keys.**
If staying with manual keys (not Tailscale SSH), every private key must have a passphrase. Use
`ssh-keygen -p -f ~/.ssh/id_ed25519` to add a passphrase to existing keys. Combine with
`AddKeysToAgent yes` (already in Mac config) so the passphrase is entered once per session.

**I3. Harden Homelab sshd_config.**
No script in this repo touches the Homelab's sshd_config. At minimum, add to setup-homelab.sh or
create a dedicated hardening script:

```
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
AllowUsers nyaptor
LoginGraceTime 30
MaxSessions 3
MaxStartups 3:50:10
X11Forwarding no
```

**I4. Add keepalive and timeout settings to Homelab and CloudPC configs.**
Copy the `Host *` block from `mac.config` to `homelab.config` and `cloudpc.config`:

```
Host *
    ServerAliveInterval 30
    ServerAliveCountMax 3
    ConnectionAttempts 2
    ConnectTimeout 10
    AddKeysToAgent yes
    SetEnv TERM=xterm-256color
```

**I5. Resolve the CloudPC SSH setup overlap.**
`ssh-mesh/scripts/setup-cloudpc.ps1` and `windows/setup.ps1` both configure SSH on CloudPC. Either:
- Merge them: `windows/setup.ps1` already has a proper `Install-OpenSSHServer` function. Move key
  distribution logic there and delete `setup-cloudpc.ps1`.
- Or: Make `setup-cloudpc.ps1` call `windows/setup.ps1` for sshd setup, then handle key-specific
  steps only.

**I6. Use `Include` instead of overwriting `~/.ssh/config`.**
Change `setup-mac.sh` to install the mesh config as `~/.ssh/config.d/mesh.config` and add
`Include config.d/*` to the top of `~/.ssh/config`. This preserves user-added Host entries.

### Nice-to-Have

**N1. Use Tailscale MagicDNS hostnames consistently.**
Replace hardcoded Tailscale IPs (100.83.148.5, 100.94.11.104, 100.91.88.16) with MagicDNS
hostnames (homelab, cloudpc, macbook-pro) or Tailscale FQDNs throughout all configs. IPs can
change on re-authentication; hostnames are stable.

**N2. Consolidate fetch-all-cloudpc scripts.**
Maintain only the PowerShell version (native to CloudPC) and remove the bash/WSL version, or
vice versa. Two implementations of the same logic is maintenance overhead with no benefit.

**N3. Relocate cmux-bridge source.**
Move `ssh-mesh/scripts/remote/cmux-bridge/` to a top-level `cmux-bridge/` directory or into a
`services/` directory. It is an HTTP proxy for terminal orchestration, not SSH infrastructure.
Its presence in `ssh-mesh/` is misleading.

**N4. Add SSH config drift detection.**
A simple script that diffs deployed `~/.ssh/config` against the repo version on each machine
and reports discrepancies. Could be run by `deploy-to-homelab.sh` as a pre-flight check.

**N5. Pin host keys in `known_hosts`.**
After initial connection to each machine, export the host key fingerprints and distribute them.
This prevents MITM attacks on first connection (TOFU vulnerability).

**N6. Restrict cmux-bridge bind address.**
Change `BIND_ADDR` from `0.0.0.0:10998` to `127.0.0.1:10998` if only local access is needed.
If Tailscale peers need to reach it, keep `0.0.0.0` but add firewall rules to restrict port 10998
to Tailscale interface only, complementing the application-level IP check.

---

## Sources

### SSH Security Hardening
- [SSH Key Best Practices for 2025 - ED25519](https://www.brandonchecketts.com/archives/ssh-ed25519-key-best-practices-for-2025)
- [SSH Security in 2026: Keys, Fail2Ban, Hardening](https://www.hostiserver.com/community/articles/ssh-security-and-key-authentication)
- [SSH and SCP in 2026: Configuration, Security Hardening](https://dev.to/matheus_releaserun/ssh-and-scp-in-2026-configuration-security-hardening-and-advanced-tips-8nm)
- [SSH Hardening: Best Practices - Linuxize](https://linuxize.com/post/ssh-hardening-best-practices/)
- [Opinionated 2025 sshd_config Hardening](https://www.msbiro.net/posts/back-to-basics-sshd-hardening/)
- [HowTo: Harden SSH Daemon 2025](https://www.onlinehashcrack.com/guides/tutorials/howto-harden-ssh-daemon-2025-best-settings.php)
- [SSH Config: Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/ssh-config-complete-guide)

### Tailscale SSH
- [Tailscale SSH: Secure Remote Access Without Managing Keys](https://oneuptime.com/blog/post/2026-01-27-tailscale-ssh/view)
- [Tailscale SSH Docs](https://tailscale.com/docs/features/tailscale-ssh)
- [Protect your SSH servers using Tailscale](https://tailscale.com/docs/reference/ssh-over-tailscale)
- [SSH Security Best Practices - Tailscale](https://tailscale.com/learn/ssh-security-best-practices-protecting-your-remote-access-infrastructure)
- [Best practices to secure your tailnet](https://tailscale.com/docs/reference/best-practices/security)

### SSH Key Sharing Risks
- [Why I Run Multiple SSH Keys Instead of Just One](https://medium.com/@bornaly/why-i-run-multiple-ssh-keys-instead-of-just-one-2bc4065c5415)
- [SSH Key Compromise Risks and Countermeasures](https://sandflysecurity.com/blog/ssh-key-compromise-risks-and-countermeasures)
- [Untracked, Unrotated, Unsafe: State of SSH Key Management](https://visionspace.com/untracked-unrotated-unsafe-the-state-of-ssh-key-management/)

### Hardcoded Credentials
- [Hardcoded Secrets: The Unseen Security Risk](https://medium.com/@tolubanji/hardcoded-secrets-the-unseen-security-risk-lurking-in-your-code-102396345115)
- [Hardcoded and Embedded Credentials - BeyondTrust](https://www.beyondtrust.com/blog/entry/hardcoded-and-embedded-credentials-are-an-it-security-hazard-heres-what-you-need-to-know)
