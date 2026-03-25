# Design: Adopt Doppler + chezmoi

## chezmoi Source Directory Layout

```
if/                                     # chezmoi source root
├── .chezmoi.toml.tmpl                  # Machine-specific data (OS, hostname, theme)
├── .chezmoiignore                      # Platform-specific file ignores
├── .chezmoiexternal.toml               # External dependencies (if any)
├── dot_zshenv.tmpl                     # → ~/.zshenv (templated per machine)
├── dot_zshrc                           # → ~/.zshrc
├── dot_zsh/                            # → ~/.zsh/
│   ├── rc/
│   │   ├── shared.zsh
│   │   ├── darwin.zsh
│   │   └── linux.zsh
│   ├── functions/
│   │   ├── setup-completions.zsh
│   │   ├── load-plugins.zsh
│   │   ├── load-tools.zsh
│   │   └── init-starship.zsh
│   └── completions/
├── dot_config/
│   ├── ghostty/
│   │   └── config.tmpl                 # → ~/.config/ghostty/config (theme templated)
│   ├── tmux/
│   │   ├── tmux.conf                   # → ~/.config/tmux/tmux.conf
│   │   └── one-hunter-vercel-theme.conf
│   ├── starship/
│   │   └── starship.toml.tmpl          # → ~/.config/starship/starship.toml (palette templated)
│   └── karabiner/
│       └── assets/complex_modifications/
│           └── mac_osx_on_rdp.json     # → ~/.config/karabiner/...
├── dot_mise.toml                       # → ~/.mise.toml (cross-platform tool versions)
├── run_once_install-packages.sh.tmpl   # Platform-conditional package install
├── run_once_install-arch.sh.tmpl       # Arch-specific bootstrap
├── run_onchange_raycast.sh.tmpl        # Regenerate Raycast scripts on projects.toml change
├── projects.toml                       # Single project registry (NOT deployed to ~)
├── scripts/                            # Repo utilities (NOT deployed to ~)
│   ├── cmux-workspaces.sh
│   ├── cmux-debug.sh
│   ├── mux-remote.sh
│   ├── generate-raycast.sh
│   └── rotate-keys.sh
├── homebrew/
│   └── Brewfile                        # Curated package manifest
├── ssh-mesh/                           # Reference docs + configs
│   ├── README.md
│   ├── configs/
│   └── scripts/
├── launchd/                            # LaunchAgent plists (chezmoi-managed)
├── windows/                            # Manual (not chezmoi-managed)
│   ├── setup.ps1
│   ├── install.cmd
│   └── mac-keyboard.ahk
├── raycast-scripts/                    # Generated (by run_onchange_raycast.sh)
│   ├── local/
│   └── ...
└── docs/
    └── audit/
```

## chezmoi Data Model (.chezmoi.toml.tmpl)

```toml
{{ $hostname := .chezmoi.hostname -}}

[data]
  theme = "nord"

  # Machine-specific
  {{ if eq $hostname "macbook-pro" -}}
  machine = "mac"
  ssh_user = "leonardoacosta"
  {{ else if eq $hostname "omarchy" -}}
  machine = "homelab"
  ssh_user = "nyaptor"
  {{ else -}}
  machine = "unknown"
  ssh_user = "{{ .chezmoi.username }}"
  {{ end -}}
```

## Theme Switching Architecture

Theme data flows from chezmoi → config files:

```
.chezmoi.toml.tmpl          (theme = "nord")
        │
        ├── starship.toml.tmpl    →  palette = "{{ .theme }}"
        ├── ghostty/config.tmpl   →  theme = {{ if eq .theme "nord" }}Nord{{ else }}Vercel{{ end }}
        └── tmux.conf             →  source-file ~/.config/tmux/{{ .theme }}-theme.conf
```

Switching theme: edit `.chezmoi.toml.tmpl` → `chezmoi apply` → all tools update.

## Doppler Integration

```
Doppler (homelab/prd)
        │
        ├── OPENAI_API_KEY
        ├── ANTHROPIC_API_KEY
        ├── ELEVENLABS_API_KEY
        └── ... (all secrets from ~/.env)

Usage:
  doppler run -- <command>          # inject secrets for one command
  eval $(doppler secrets download --no-file --format env)  # shell session
```

## projects.toml Schema

```toml
[meta]
default_ssh_host = "homelab"
default_ssh_user = "nyaptor"

[[projects]]
code = "oo"
name = "Otaku Odyssey"
category = "client"       # client | personal | b-and-b
icon = "👘"
path = "dev/oo"
tiers = ["remote", "local"]  # which Raycast script tiers to generate

[[projects]]
code = "cl"
name = "Central Leo"
category = "personal"
icon = "🦁"
path = "dev/cl"
tiers = ["remote", "local"]
```

## Phase Ordering Rationale

1. **Dead code first** — reduces noise for all subsequent phases
2. **Security second** — key rotation doesn't depend on anything else
3. **Doppler + mise third** — installs tools needed before chezmoi templates can reference them
4. **chezmoi fourth** — the big structural migration, benefits from clean starting state
5. **Theme system fifth** — depends on chezmoi being in place
6. **Project registry sixth** — independent but benefits from chezmoi run_onchange
7. **Documentation last** — reflects the final state of everything above
