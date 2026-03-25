# Dotfiles Ecosystem Overview (March 2026)

A landscape survey of dotfiles management, dev environment tooling, cross-platform strategies, and
related infrastructure. This is a general ecosystem report — not a comparison against any specific
setup.

---

## 1. Dotfiles Managers

### Comparison Table

| Tool | Approach | Templates | Secrets | Platform | Complexity | Community | Maturity |
|------|----------|-----------|---------|----------|------------|-----------|----------|
| **chezmoi** | Source-of-truth dir, apply command | Go `text/template` with OS/arch/hostname vars | age, GPG, 1Password, Bitwarden, Doppler, AWS/Azure/GCP KMS, macOS Keychain, GNOME Keyring, + many more | macOS, Linux, Windows, FreeBSD | Medium | ~13K+ GitHub stars; most active community | High — v2.70.0, actively maintained |
| **GNU Stow** | Symlink farm manager | None | None | macOS, Linux | Low | Mature GNU project, modest GitHub presence | High — decades old, stable |
| **yadm** | Bare git repo wrapper | Jinja2-like (alternate files via `##os.Linux`) | git-crypt, GPG, transcrypt | macOS, Linux | Low-Medium | ~6.2K GitHub stars | High — stable, slower development |
| **Bare git repo** | Manual `git --work-tree=$HOME` alias | None | Manual (git-crypt or external) | Any | Low | N/A (pattern, not a tool) | N/A |
| **Nix Home Manager** | Declarative Nix expressions | Nix language (full programming language) | agenix, sops-nix | NixOS, macOS (nix-darwin), Linux | High | ~7K+ GitHub stars; active Nix community | Medium — flakes still experimental |
| **Ansible** | Playbooks with roles/tasks | Jinja2 | Ansible Vault | Any (SSH target) | High | Massive (Red Hat backed) | High |
| **rcm** | `rcup`/`lsrc` CLI, tag-based organization | None (directory-based overrides) | None | macOS, Linux | Low | ~3K GitHub stars (thoughtbot) | High — stable, minimal updates |
| **Dotbot** | YAML config, symlink + shell commands | None (conditional via `if` key) | None | macOS, Linux, Windows | Low | ~7.8K GitHub stars | High — simple and stable |

### Key Findings

**chezmoi is the clear frontrunner** in 2025-2026. It combines the broadest feature set (templates,
secrets, scripts, one-liner bootstrap) with active maintenance and strong documentation. Its Go
template system handles cross-platform differences natively, and its password manager integrations
are unmatched — supporting 15+ secret backends out of the box.
([chezmoi.io](https://www.chezmoi.io/why-use-chezmoi/),
[chezmoi comparison table](https://www.chezmoi.io/comparison-table/))

**GNU Stow remains popular** for its simplicity. It does one thing (symlinks) and does it well.
Developers who want minimal tooling and don't need templates or secrets still gravitate here.
([dotfiles.github.io](https://dotfiles.github.io/utilities/))

**yadm** occupies a middle ground — feels like plain Git (low learning curve) but adds alternate
files and encryption. Its main limitation is that OS-specific file placement (same file, different
paths on different OSes) is clunky compared to chezmoi templates.
([yadm.io](https://yadm.io/),
[BigGo community discussion](https://biggo.com/news/202412191324_dotfile-management-tools-comparison))

**Nix Home Manager** represents the declarative extreme. Configurations are immutable and
reproducible, with zero drift. However, the learning curve is steep, the ecosystem is complex, and
several prominent developers have publicly abandoned it for dotfile management in 2025-2026, finding
the cons outweigh the pros for this specific use case. A hybrid approach — Nix for package
management, chezmoi for dotfiles — is gaining traction.
([Home Manager on NixOS Wiki](https://nixos.wiki/wiki/Home_Manager),
[jade.fyi](https://jade.fyi/blog/use-nix-less/),
[DevOps Toolbox on X](https://x.com/devopstoolbox/status/1867984607435530716))

**Ansible** is best suited for full machine provisioning rather than pure dotfile management. It
excels when you need to install packages, configure services, AND manage dotfiles in one workflow.
Overkill for dotfiles alone.
([Ansible dotfiles guide](https://medium.com/espinola-designs/manage-your-dotfiles-with-ansible-6dbedd5532bb))

**Dotbot** is lightweight and popular for simple setups — YAML config for symlinks and shell
commands. No templating or secrets, but its `if` conditional key enables basic cross-platform support.
([Dotbot on GitHub](https://github.com/anishathalye/dotbot))

---

## 2. Shell Frameworks & Plugin Managers

### Comparison Table

| Tool | Type | Speed | Plugin Ecosystem | Config Format | Maintenance | Notes |
|------|------|-------|------------------|---------------|-------------|-------|
| **Oh My Zsh** | Framework | Slow (2s+ startup typical) | 300+ plugins, 150+ themes | `.zshrc` sourcing | Active | Best for beginners; largest community |
| **Prezto** | Framework | Moderate | Smaller than OMZ | `.zpreztorc` | Moderate | Lighter OMZ alternative |
| **zinit** | Plugin manager | Fast (sub-100ms with Turbo) | Any GitHub repo | `.zshrc` declarative | Active (zdharma-continuum) | Only manager with Turbo deferred loading |
| **sheldon** | Plugin manager | Fast | Any GitHub repo | TOML | Active | Written in Rust; simple config |
| **antidote** | Plugin manager | Fast | Any GitHub repo | Plain text bundle file | Active | Spiritual successor to antibody |
| **zap** | Plugin manager | Fast | Any GitHub repo | `.zshrc` function calls | Active | Minimal, ~100 lines of Zsh |
| **zsh4humans** | Framework | Fast (instant prompt) | Curated set | `.zshrc` | Low | By romkatv (p10k author); opinionated |
| **zimfw** | Framework + manager | Fast | Modules system | `.zimrc` | Active | Balances speed and features |

### Key Findings

**The "framework vs plugin manager" split is real.** Oh My Zsh is a monolithic framework that
bundles everything. Plugin managers (zinit, sheldon, antidote) let you pick individual plugins from
any source. The trend is moving toward plugin managers for performance-conscious users.
([Slant comparison](https://www.slant.co/versus/17393/24969/~oh-my-zsh_vs_zinit),
[zinit review](https://makerstack.co/reviews/zinit-review/))

**zinit's Turbo mode is the performance benchmark.** It defers plugin loading until after the prompt
appears, achieving 50-80% faster startup. A typical zinit config starts in under 100ms while loading
the same plugins that make Oh My Zsh take 2+ seconds. No other manager offers equivalent deferred
loading.
([zinit on GitHub](https://github.com/zdharma-continuum/zinit),
[zsh plugin manager benchmark](https://github.com/rossmacarthur/zsh-plugin-manager-benchmark))

**sheldon and antidote are the "simple and fast" options.** Both load quickly and use clean config
formats. sheldon (Rust, TOML) appeals to developers who want explicit configuration. antidote
(plain text bundle file) appeals to those who want minimal ceremony.
([Slant: 9 Best plugin managers for ZSH](https://www.slant.co/topics/3265/~best-plugin-managers-for-zsh))

**Oh My Zsh is not dying but is losing mindshare** among power users. Its strength remains
onboarding — a beginner can get a productive shell in minutes. But its monolithic nature and startup
overhead push experienced users toward leaner setups.
([bitdoze.com](https://www.bitdoze.com/best-oh-my-zsh-plugins/))

### Shell Prompt Landscape

| Prompt | Shell Support | Speed | Status |
|--------|--------------|-------|--------|
| **Starship** | Bash, Zsh, Fish, PowerShell, Elvish, Nu, + more | ~20ms | Active, cross-shell standard |
| **Powerlevel10k** | Zsh only | ~10ms | **Life support** — maintainer stepped back |
| **Oh My Posh** | Bash, Zsh, Fish, PowerShell, Cmd | Fast | Active, strong Windows/PowerShell roots |

**Starship is winning the prompt war.** Cross-shell support (12+ shells), active maintenance, and
Rust performance make it the default recommendation in 2026. Powerlevel10k is faster for Zsh but
its maintainer has declared the project on "life support," triggering a migration wave to Starship.
([hashir.blog](https://hashir.blog/2025/06/powerlevel10k-is-on-life-support-hello-starship/),
[bulimov.me](https://bulimov.me/post/2025/05/11/powerlevel10k-to-starship/),
[starship.rs](https://starship.rs/))

---

## 3. Cross-Platform Strategies

### Approach Comparison

| Strategy | Complexity | Flexibility | Reproducibility | Best For |
|----------|-----------|-------------|-----------------|----------|
| **chezmoi templates** | Medium | High — per-file OS/arch conditionals | High | Most developers; macOS + Linux |
| **Conditional symlinks** (Stow/manual) | Low | Medium — directory-per-OS | Medium | Simple two-platform setups |
| **Nix (nix-darwin + home-manager)** | High | Very high — full declarative | Very high | Nix enthusiasts; reproducibility maximalists |
| **Ansible playbooks** | High | Very high — full automation | High | DevOps-oriented; machine provisioning |
| **OS-specific directories** | Low | Medium — split by platform | Low | Manual/minimal setups |
| **Dotbot `if` conditionals** | Low | Limited — boolean conditions only | Medium | Simple conditional linking |

### Key Findings

**The dominant pattern is "shared core + platform overrides."** Most successful cross-platform
dotfiles repos use a shared base configuration with OS-specific layers applied via templates,
conditionals, or separate directories. The `uname -s` check (Darwin vs Linux) is nearly universal.
([brianschiller.com](https://brianschiller.com/blog/2024/08/05/cross-platform-dotbot/),
[calvin.me](https://calvin.me/cross-platform-dotfiles/))

**chezmoi templates are the most ergonomic solution** for cross-platform. Go templates with
built-in `.chezmoi.os`, `.chezmoi.arch`, and `.chezmoi.hostname` variables handle the common cases
without external tooling.
([chezmoi.io](https://www.chezmoi.io/what-does-chezmoi-do/))

**Windows support remains the hardest problem.** WSL blurs the line — many developers treat Windows
as "Linux via WSL" and only manage WSL dotfiles. Native Windows config (PowerShell profile,
Windows Terminal settings) requires separate handling. Tools like chezmoi and Rotz (Rust,
cross-platform) have the best Windows support.
([Rotz](https://volllly.github.io/rotz/),
[nijho.lt](https://www.nijho.lt/post/dotfiles/))

**The hybrid Nix approach is emerging.** Use Nix/home-manager for package installation and
system-level config, but keep dotfiles in chezmoi or a simpler manager. This avoids the pain of
wrapping every config file in Nix syntax while still getting reproducible package management.
([jade.fyi](https://jade.fyi/blog/use-nix-less/),
[zaynetro.com](https://www.zaynetro.com/post/2024-you-dont-need-home-manager-nix))

---

## 4. Dev Environment as Code

### Tool Comparison

| Tool | Approach | Speed | Learning Curve | Reproducibility | Team Sharing | Platform |
|------|----------|-------|----------------|-----------------|--------------|----------|
| **mise** (ex-rtx) | Polyglot version manager + env + tasks | Fast (Rust) | Low | Good (`.mise.toml`) | Good | macOS, Linux |
| **asdf** | Plugin-based version manager | Moderate (shims) | Low | Good (`.tool-versions`) | Good | macOS, Linux |
| **Devbox** | Nix-powered isolated shells | Moderate | Low (hides Nix) | Excellent | Excellent (`devbox.json`) | macOS, Linux |
| **Nix Flakes** | Full declarative environments | Slow (first build) | Very high | Excellent | Excellent (`flake.nix`) | macOS, Linux |
| **Devcontainers** | Docker-based dev environments | Slow (container build) | Medium | Good (but Dockerfile drift) | Excellent | Any (Docker required) |
| **Homebrew** | System package manager | Fast | Very low | Poor (no lockfile) | Poor | macOS, Linux |

### Key Findings

**mise is replacing asdf.** Written in Rust, mise is a drop-in asdf replacement that adds
environment variable management, a task runner, and built-in support for popular languages (no
plugin system required for common tools). It directly modifies PATH instead of using shims,
resulting in measurably faster execution. mise reached maturity in 2025 and its creator has
signaled the feature set is now stable.
([mise.jdx.dev](https://mise.jdx.dev/),
[Better Stack comparison](https://betterstack.com/community/guides/scaling-nodejs/mise-vs-asdf/),
[mise 2025 roadmap](https://github.com/jdx/mise/discussions/4057))

**Devbox is the "Nix for humans" play.** It wraps Nix behind a `devbox.json` file, giving teams
reproducible environments without learning Nix syntax. It can also generate `devcontainer.json` for
VS Code integration. Devbox environments are more reproducible than Dockerfiles because Nix pins
exact package versions (even binary modification timestamps match).
([alan.norbauer.com](https://alan.norbauer.com/articles/devbox-intro/),
[Devbox intro on Medium](https://medium.com/vafion/devbox-a-user-friendly-approach-to-reproducible-development-environments-with-nix-83dbcd0ab8d8),
[Bunnyshell alternatives](https://www.bunnyshell.com/comparisons/devbox-alternatives/))

**Devcontainers are the enterprise standard** but have reproducibility issues. `apt-get install`
in a Dockerfile can break months later when upstream packages change. Devbox/Nix-based
environments don't have this problem. However, devcontainers integrate deeply with VS Code and
GitHub Codespaces, making them the path of least resistance for teams already in that ecosystem.
([dev.to reproducible environments](https://dev.to/khozaei/reproducible-dev-environments-10mk))

**Nix Flakes remain experimental** (as of March 2026) but are the gold standard for
reproducibility. The learning curve keeps adoption limited to enthusiasts and teams with dedicated
Nix expertise.
([NixOS & Flakes Book](https://nixos-and-flakes.thiscute.world/development/dev-environments))

---

## 5. Terminal & Multiplexer Trends

### Terminal Emulators

| Terminal | Language | GPU Accel | Platform | Multiplexing | Config | GitHub Stars (approx.) |
|----------|----------|-----------|----------|-------------|--------|----------------------|
| **Ghostty** | Zig | Yes | macOS, Linux | Tabs + splits (built-in) | Plain text | ~45K (launched Dec 2024) |
| **WezTerm** | Rust | Yes | macOS, Linux, Windows | Full built-in multiplexer | Lua scripting | ~18K |
| **Kitty** | C/Python | Yes | macOS, Linux | Tabs + splits | `.conf` file | ~25K |
| **Alacritty** | Rust | Yes | macOS, Linux, Windows | None (by design) | TOML | ~57K |
| **iTerm2** | Objective-C | No | macOS only | Tabs + splits | GUI | ~15K |

**Ghostty is the breakout story of 2025-2026.** Created by Mitchell Hashimoto (HashiCorp founder),
it accumulated 45K+ GitHub stars in just over a year. It uses native platform UI frameworks (Cocoa on
macOS, GTK on Linux) for a truly native feel, combined with GPU-accelerated rendering. Performance
benchmarks show it 2-5x faster than WezTerm in various scenarios.
([scopir.com comparison](https://scopir.com/posts/ghostty-vs-wezterm-2026/),
[calmops.com comparison](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/))

**WezTerm remains the power-user choice** for cross-platform work. Its Lua-scriptable configuration
enables complex workflows, and its built-in multiplexer can replace tmux entirely. It is the better
choice for multi-OS developers.
([WezTerm discussion](https://github.com/wezterm/wezterm/discussions/6520))

### Multiplexers

| Tool | Language | Learning Curve | Plugin System | Session Persistence | Collaboration |
|------|----------|---------------|---------------|--------------------:|---------------|
| **tmux** | C | High | Via config/scripts | Yes (detach/attach) | tmux sharing |
| **Zellij** | Rust | Low (discoverable UI) | WebAssembly plugins | Yes | Built-in web client |
| **Screen** | C | Medium | None | Yes | Basic |

**tmux is not going anywhere** but Zellij is gaining ground. tmux's ecosystem (tpm, tmuxinator,
extensive scripting) and decades of muscle memory keep it dominant among sysadmins and DevOps.
Zellij appeals to developers who want modern UX: floating panes, stacked layouts, discoverable
keybindings, and a WebAssembly plugin system.
([dasroot.net comparison](https://dasroot.net/posts/2026/02/terminal-multiplexers-tmux-vs-zellij-comparison/),
[roman.pt](https://roman.pt/posts/terminal-setup/))

**Zellij's web client is a differentiator.** It can share terminal sessions via a built-in web
server with authentication and HTTPS — no SSH required for collaborators.
([zellij.dev](https://zellij.dev/),
[zellij on GitHub](https://github.com/zellij-org/zellij))

**The "just use terminal tabs" camp is growing.** With Ghostty, WezTerm, and Kitty all offering
built-in splits and tabs, some developers are dropping tmux/Zellij entirely for local work, keeping
multiplexers only for remote sessions where detach/attach matters.
([spondicious.com](https://spondicious.com/blog/tmux_or_zellij/))

---

## 6. Remote Development Approaches

### Comparison Table

| Tool | Type | Latency | Offline Work | Cost | IDE Support | Setup Complexity |
|------|------|---------|--------------|------|-------------|-----------------|
| **Tailscale SSH** | Mesh VPN + SSH | Low (WireGuard) | Yes (if connected) | Free tier, then per-seat | Any SSH client | Low |
| **VS Code Remote-SSH** | SSH extension | Medium | No | Free | VS Code only | Low |
| **VS Code Tunnels** | Cloud relay | Medium-High | No | Free | VS Code / browser | Very low |
| **GitHub Codespaces** | Cloud VM | Medium | No | Per-hour billing | VS Code / JetBrains / browser | Very low |
| **Coder** | Self-hosted cloud dev | Low-Medium | No | Self-hosted (free OSS) | Any IDE | High |
| **JetBrains Gateway** | Remote IDE backend | Medium | No | JetBrains license | JetBrains IDEs | Medium |

### Key Findings

**Tailscale SSH is the darling of the indie/homelab community.** It eliminates SSH key management
entirely — authentication happens through your identity provider, and authorization through
centralized ACLs. No public ports, no key distribution, no `authorized_keys` maintenance. It
integrates cleanly with VS Code Remote-SSH and works across all platforms.
([Tailscale SSH docs](https://tailscale.com/docs/remote-code),
[oneuptime.com guide](https://oneuptime.com/blog/post/2026-01-27-tailscale-ssh/view))

**A common 2025-2026 remote dev stack** combines Tailscale for networking + Code-Server (browser
VS Code) or VS Code Remote-SSH for the IDE + Cloudflare Tunnel for sharing preview URLs with
teammates.
([zfir on Medium](https://zfir.medium.com/my-remote-dev-setup-2025-2026-3ea7a16337c4),
[alexjd.co.uk](https://www.alexjd.co.uk/posts/remote-development-tailscale))

**Tailscale + Claude Code for AI-assisted remote development** is an emerging pattern. Developers
SSH into powerful remote machines via Tailscale and run Claude Code there, getting AI assistance
on beefy hardware without local resource constraints.
([tsoporan.com](https://tsoporan.com/blog/remote-ai-development-claude-code-tailscale/))

**GitHub Codespaces** is the enterprise standard for cloud dev environments. In 2026, it added
workspace cloning, multi-repo orchestration, and AI-powered onboarding. However, integration with
JetBrains Gateway has lagged — the GitHub Codespaces plugin fails to keep pace with JetBrains IDE
updates.
([GitHub Codespaces review](https://www.linktly.com/infrastructure-software/githubcodespaces-review/),
[JetBrains Gateway issues](https://github.com/orgs/community/discussions/147971))

**Coder** fills the self-hosted niche. Organizations that can't use GitHub Codespaces (compliance,
air-gapped networks) deploy Coder for similar functionality on their own infrastructure.

---

## 7. Secrets in Dotfiles

### Comparison Table

| Tool | Encryption | Granularity | Key Management | Complexity | Chezmoi Integration |
|------|-----------|-------------|----------------|------------|-------------------|
| **age** | X25519 + ChaCha20-Poly1305 | Per-file | age keygen (local) | Very low | Native |
| **SOPS** | AES-256-GCM | Per-value (in YAML/JSON) | age, GPG, AWS/GCP/Azure KMS | Medium | Via templates |
| **1Password CLI** | 1Password vault | Per-secret | 1Password account | Low (if already using 1P) | Native (`onepasswordRead`) |
| **git-crypt** | AES-256 | Per-file (via `.gitattributes`) | GPG keys | Low | Manual |
| **GPG** | Various | Per-file | GPG keyring | High | Native in chezmoi |
| **Bitwarden CLI** | Bitwarden vault | Per-secret | Bitwarden account | Low | Native in chezmoi |
| **Doppler** | Cloud-hosted | Per-secret | Team/project scoped | Low | Via CLI in templates |

### Key Findings

**chezmoi + age is the emerging default** for individual developers. age is modern, simple (no GPG
keyring complexity), and has first-class chezmoi support. Encrypt individual sensitive files in
your source repo; they're decrypted at `chezmoi apply` time.
([chezmoi age docs](https://www.chezmoi.io/user-guide/encryption/age/),
[mikekasberg.com](https://www.mikekasberg.com/blog/2026/01/31/dotfiles-secrets-in-chezmoi.html))

**1Password CLI is the "zero disk exposure" option.** Secrets never touch disk — chezmoi templates
call `op read` at apply time, pulling secrets directly from 1Password vaults. Ideal if you already
use 1Password.
([chezmoi 1Password docs](https://www.chezmoi.io/user-guide/password-managers/1password/),
[zenn.dev guide](https://zenn.dev/massy22/articles/e88ed6f3137253?locale=en))

**SOPS shines for structured secrets** (YAML/JSON config files). Unlike git-crypt or age which
encrypt entire files, SOPS encrypts individual values within a file, leaving keys and structure
visible. This makes diffs meaningful and code review possible.
([paulocurado.com](https://paulocurado.com/blog/managing-secrets-with-sops-age-and-1password/),
[technotim.com](https://technotim.com/posts/secret-encryption-sops/))

**git-crypt is simple but limited.** It encrypts transparently on push/decrypt on pull via
`.gitattributes` patterns. The downside: all-or-nothing access (if you can decrypt one file, you
can decrypt all), and GPG key management adds friction.
([opensource.com](https://opensource.com/article/19/2/secrets-management-tools-git))

**Best practice consensus:** Never store plaintext secrets in version control. Encrypt at rest
using age or SOPS. Verify before every commit with pre-commit hooks. For team environments, use a
secrets manager (1Password, Doppler, Vault) rather than file-level encryption.
([dotfiles.io guide](https://dotfiles.io/en/guides/secret-management/))

---

## 8. Notable Dotfiles Repos & Patterns

### Influential Repositories

| Repo | Stars | Notable For |
|------|-------|-------------|
| [mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles) | ~30K+ | Legendary macOS defaults script; rsync-based bootstrap |
| [holman/dotfiles](https://github.com/holman/dotfiles) | ~7K+ | Topical organization pattern; auto-sourcing `.zsh` files |
| [paulirish/dotfiles](https://github.com/paulirish/dotfiles) | ~4K+ | Fish shell config; web developer focus |
| [thoughtbot/dotfiles](https://github.com/thoughtbot/rcm) | ~3K+ | rcm tool; tag-based organization |
| [webpro/awesome-dotfiles](https://github.com/webpro/awesome-dotfiles) | ~9K+ | Curated resource list |
| [fufexan/dotfiles](https://github.com/fufexan/dotfiles) | Growing | NixOS + Home Manager reference implementation |

### Patterns Worth Noting

**Topical organization** (holman pattern): Group files by topic (`git/`, `ruby/`, `zsh/`) rather
than by target location. Each topic directory contains its own aliases, completions, and config
files. Files named `*.zsh` are auto-sourced.
([holman/dotfiles](https://github.com/holman/dotfiles))

**Bootstrap scripts:** Most popular repos include a one-command bootstrap that installs
dependencies, creates symlinks, and configures the system. chezmoi's `chezmoi init --apply` is the
modern equivalent.
([dotfiles.github.io](https://dotfiles.github.io/))

**The macOS defaults script** (popularized by mathiasbynens) remains a staple. It sets hundreds of
macOS system preferences via `defaults write` commands. Nearly every macOS dotfiles repo forks or
adapts this pattern.
([mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles))

**Modular shell config** is now standard: `.zshenv` for environment variables only (all shells),
`.zshrc` for interactive config, with platform-specific files sourced conditionally.
([ArchWiki dotfiles](https://wiki.archlinux.org/title/Dotfiles),
[dotfiles.github.io](https://dotfiles.github.io/))

---

## 9. Key Takeaways & Trends

### What the Ecosystem Has Converged On

1. **chezmoi is the de facto standard** for dotfiles management. It handles templates, secrets,
   cross-platform, and bootstrap in one tool. If you're starting fresh in 2026, this is the default
   recommendation.

2. **Starship has won the prompt war.** Cross-shell, fast, actively maintained. Powerlevel10k's
   move to life support accelerated the migration.

3. **mise is replacing asdf** as the polyglot version manager. Faster (Rust), broader scope (env
   vars + tasks), and reaching maturity.

4. **Tailscale SSH is the remote access standard** for individuals and small teams. Zero key
   management, zero public ports, works everywhere.

5. **age is the modern encryption choice** over GPG for dotfiles secrets. Simpler key management,
   native chezmoi integration.

### Emerging Trends

1. **Hybrid Nix adoption.** Use Nix for reproducible package installation, but keep dotfiles in
   simpler tools (chezmoi, Stow). Full Nix Home Manager for dotfiles is losing appeal outside the
   NixOS community due to complexity.

2. **Ghostty as the terminal to watch.** 45K stars in one year, native feel on macOS, GPU
   acceleration. WezTerm remains stronger for cross-platform and scripting.

3. **Zellij gaining on tmux.** WebAssembly plugins, web client, discoverable UI. tmux holds firm
   for scripting and remote sessions, but Zellij is the choice for developers prioritizing UX.

4. **Devbox as "Nix for teams."** Wraps Nix complexity behind JSON config. Bridges the gap between
   "I want reproducibility" and "I don't want to learn Nix."

5. **AI-assisted remote dev.** Tailscale SSH + Claude Code on remote machines is an emerging
   pattern — SSH into powerful hardware, run AI tools there.

6. **Terminal emulators absorbing multiplexer features.** Ghostty, WezTerm, and Kitty all offer
   splits and tabs, reducing the need for tmux/Zellij in local-only workflows.

### What's Dying or Declining

1. **Powerlevel10k** — maintainer stepped back; community migrating to Starship.

2. **Oh My Zsh as the default** — still fine for beginners, but experienced users consistently move
   to lighter plugin managers (zinit, sheldon, antidote) for performance.

3. **GPG for dotfiles encryption** — age is simpler and just as secure for personal use. GPG's
   complexity is no longer justified for most developers.

4. **asdf** — mise is a strict superset with better performance. asdf's shim-based approach adds
   measurable overhead.

5. **Full Nix Home Manager for dotfiles** — the "Nixify everything" temptation leads to fighting
   Nix more than necessary. The hybrid approach (Nix for packages, simpler tools for dotfiles) is
   gaining ground.

6. **Manual SSH key management** — Tailscale SSH, 1Password SSH agent, and similar tools are
   eliminating the need to manually distribute and manage SSH keys.

---

## Sources

### Dotfiles Managers
- [chezmoi.io — Why use chezmoi?](https://www.chezmoi.io/why-use-chezmoi/)
- [chezmoi.io — Comparison table](https://www.chezmoi.io/comparison-table/)
- [dotfiles.github.io — Utilities](https://dotfiles.github.io/utilities/)
- [yadm.io](https://yadm.io/)
- [BigGo — Dotfile Management Tools Battle](https://biggo.com/news/202412191324_dotfile-management-tools-comparison)
- [GBergatto — Exploring Tools for Managing Your Dotfiles](https://gbergatto.github.io/posts/tools-managing-dotfiles/)
- [Hacker News — Better Dotfiles](https://news.ycombinator.com/item?id=41453264)

### Shell Frameworks
- [Slant — Oh My Zsh vs Zinit](https://www.slant.co/versus/17393/24969/~oh-my-zsh_vs_zinit)
- [zinit on GitHub](https://github.com/zdharma-continuum/zinit)
- [zsh-plugin-manager-benchmark](https://github.com/rossmacarthur/zsh-plugin-manager-benchmark)
- [MakerStack — zinit review](https://makerstack.co/reviews/zinit-review/)
- [Slant — 9 Best plugin managers for ZSH](https://www.slant.co/topics/3265/~best-plugin-managers-for-zsh)
- [hashir.blog — Powerlevel10k is on Life Support](https://hashir.blog/2025/06/powerlevel10k-is-on-life-support-hello-starship/)
- [bulimov.me — p10k to Starship](https://bulimov.me/post/2025/05/11/powerlevel10k-to-starship/)

### Cross-Platform
- [brianschiller.com — Cross-platform dotfiles with Dotbot](https://brianschiller.com/blog/2024/08/05/cross-platform-dotbot/)
- [calvin.me — Cross-Platform Dotfiles](https://calvin.me/cross-platform-dotfiles/)
- [nijho.lt — Open-sourcing my dotfiles](https://www.nijho.lt/post/dotfiles/)
- [Rotz](https://volllly.github.io/rotz/)

### Dev Environment
- [mise.jdx.dev](https://mise.jdx.dev/)
- [Better Stack — mise vs asdf](https://betterstack.com/community/guides/scaling-nodejs/mise-vs-asdf/)
- [alan.norbauer.com — Devbox intro](https://alan.norbauer.com/articles/devbox-intro/)
- [NixOS & Flakes Book — Dev Environments](https://nixos-and-flakes.thiscute.world/development/dev-environments)
- [Bunnyshell — Devbox Alternatives](https://www.bunnyshell.com/comparisons/devbox-alternatives/)

### Terminal & Multiplexer
- [scopir.com — Ghostty vs WezTerm 2026](https://scopir.com/posts/ghostty-vs-wezterm-2026/)
- [calmops.com — Modern Terminal Emulators 2026](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/)
- [dasroot.net — tmux vs Zellij](https://dasroot.net/posts/2026/02/terminal-multiplexers-tmux-vs-zellij-comparison/)
- [zellij.dev](https://zellij.dev/)
- [roman.pt — Terminal Setup](https://roman.pt/posts/terminal-setup/)

### Remote Development
- [Tailscale SSH docs](https://tailscale.com/docs/remote-code)
- [tsoporan.com — Remote AI Coding with Tailscale SSH](https://tsoporan.com/blog/remote-ai-development-claude-code-tailscale/)
- [zfir on Medium — Remote Dev Setup 2025-2026](https://zfir.medium.com/my-remote-dev-setup-2025-2026-3ea7a16337c4)

### Secrets
- [chezmoi.io — age encryption](https://www.chezmoi.io/user-guide/encryption/age/)
- [chezmoi.io — 1Password](https://www.chezmoi.io/user-guide/password-managers/1password/)
- [dotfiles.io — Secret Management Best Practices](https://dotfiles.io/en/guides/secret-management/)
- [mikekasberg.com — Dotfiles Secrets in Chezmoi](https://www.mikekasberg.com/blog/2026/01/31/dotfiles-secrets-in-chezmoi.html)
- [paulocurado.com — SOPS, AGE, and 1Password](https://paulocurado.com/blog/managing-secrets-with-sops-age-and-1password/)

### Notable Repos & Best Practices
- [dotfiles.github.io](https://dotfiles.github.io/)
- [mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles)
- [holman/dotfiles](https://github.com/holman/dotfiles)
- [webpro/awesome-dotfiles](https://github.com/webpro/awesome-dotfiles)
- [ArchWiki — Dotfiles](https://wiki.archlinux.org/title/Dotfiles)
- [Nix Home Manager](https://nixos.wiki/wiki/Home_Manager)
- [jade.fyi — You don't have to use Nix for dotfiles](https://jade.fyi/blog/use-nix-less/)
