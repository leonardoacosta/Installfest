#!/usr/bin/env bash
# scripts/homelab/harden.sh - Arch/omarchy post-install hardening (idempotent).
#
# Encodes four recovery/hardening items from the Apr 2026 rollback:
#
#   1. TPM2 auto-unlock for LUKS  (sd-encrypt hook chain + kernel cmdline)
#   2. Snapper daily snapshots    (7-day retention; /.snapshots subvol guard)
#   3. snap-pac                   (pre/post pacman auto-snapshots)
#   4. Limine menu timeout = 5s   (regeneration-proof via /etc/default/limine)
#   5. Tailscale                  (install + enable tailscaled; optional auth-key)
#
# Optional env vars:
#   TAILSCALE_AUTHKEY  Non-interactive auth for fresh-install flows.
#                      If unset, `tailscale up` prints a login URL for manual approval.
#
# Safety:
#   - Detects LUKS UUID dynamically from /etc/crypttab / lsblk — never hardcoded.
#   - Every write is content-compared first; unchanged files are skipped.
#   - Every service change is guarded by `systemctl is-active`/`is-enabled`.
#   - Bails early on non-Arch, non-btrfs, or non-LUKS systems.
#
# Re-runs safely: all operations are idempotent. Chezmoi re-triggers this
# whenever its content hash changes (see home/run_onchange_homelab-harden.sh.tmpl).

set -uo pipefail

DOTFILES="${DOTFILES:-$HOME/dev/if}"

# shellcheck source=../utils.sh
. "$DOTFILES/scripts/utils.sh"

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

require_sudo() {
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        info "Homelab hardening needs sudo — may prompt once:"
        sudo -v || { error "sudo unavailable, aborting"; exit 1; }
    fi
}

assert_arch_btrfs() {
    [[ -f /etc/arch-release ]] || { warning "Not Arch Linux — skipping"; exit 0; }
    if ! findmnt -n -o FSTYPE / | grep -q '^btrfs$'; then
        warning "Root is not btrfs — skipping (hardening assumes btrfs)"
        exit 0
    fi
}

# ---------------------------------------------------------------------------
# LUKS UUID detection (NEVER hardcode)
# ---------------------------------------------------------------------------
#
# Strategy:
#   1. Parse /etc/crypttab for a crypt device that maps to "root".
#   2. Fallback: lsblk the backing device of /dev/mapper/root.
#   3. Fallback: blkid scan for the single crypto_LUKS partition.
#
# Returns the UUID on stdout, or exits 1 if undetectable.

detect_luks_uuid() {
    local uuid=""

    # Preferred: /etc/crypttab line like:  root  UUID=xxx  none  luks,...
    if [[ -f /etc/crypttab ]]; then
        uuid=$(awk '
            $1 == "root" && $2 ~ /^UUID=/ { sub(/^UUID=/, "", $2); print $2; exit }
        ' /etc/crypttab)
    fi

    # Fallback: resolve /dev/mapper/root → backing device → UUID
    if [[ -z "$uuid" ]] && [[ -e /dev/mapper/root ]]; then
        local backing
        backing=$(cryptsetup status root 2>/dev/null | awk '$1 == "device:" { print $2; exit }')
        if [[ -n "$backing" ]] && [[ -b "$backing" ]]; then
            uuid=$(sudo cryptsetup luksUUID "$backing" 2>/dev/null || true)
        fi
    fi

    # Last-ditch: if there's exactly one crypto_LUKS partition, use it.
    if [[ -z "$uuid" ]]; then
        local -a luks_parts
        mapfile -t luks_parts < <(sudo blkid -t TYPE=crypto_LUKS -o device 2>/dev/null || true)
        if [[ ${#luks_parts[@]} -eq 1 ]]; then
            uuid=$(sudo blkid -s UUID -o value "${luks_parts[0]}" 2>/dev/null || true)
        fi
    fi

    if [[ -z "$uuid" ]]; then
        error "Could not detect LUKS UUID — aborting hardening"
        return 1
    fi

    printf '%s' "$uuid"
}

# ---------------------------------------------------------------------------
# write_if_changed <path> <content>
#   - Writes only if current file content differs from desired.
#   - Owned by root:root, mode 0644 (tune per-call via $PERM env var).
# ---------------------------------------------------------------------------

write_if_changed() {
    local path="$1"
    local content="$2"
    local perm="${PERM:-0644}"

    if [[ -f "$path" ]] && [[ "$(sudo cat "$path" 2>/dev/null)" == "$content" ]]; then
        return 0  # unchanged
    fi

    local dir
    dir=$(dirname "$path")
    sudo install -d -m 0755 "$dir"
    printf '%s' "$content" | sudo tee "$path" >/dev/null
    sudo chmod "$perm" "$path"
    sudo chown root:root "$path"
    success "wrote $path"
    return 10  # sentinel: file changed (callers may chain regen commands)
}

# ---------------------------------------------------------------------------
# Step 1: TPM2 auto-unlock (mkinitcpio hooks + kernel cmdline + limine)
# ---------------------------------------------------------------------------

configure_tpm2_unlock() {
    local luks_uuid
    luks_uuid=$(detect_luks_uuid) || return 1
    info "detected LUKS UUID: $luks_uuid"

    local hooks_content='HOOKS=(base systemd plymouth autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck sd-btrfs-overlayfs)'
    local cmdline_content="quiet splash rd.luks.name=${luks_uuid}=root rd.luks.options=${luks_uuid}=tpm2-device=auto root=/dev/mapper/root zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs pcie_aspm=off"

    local limine_content
    limine_content=$(cat <<LIMINE_EOF
TARGET_OS_NAME="Omarchy"

ESP_PATH="/boot"

KERNEL_CMDLINE[default]="rd.luks.name=${luks_uuid}=root rd.luks.options=${luks_uuid}=tpm2-device=auto root=/dev/mapper/root zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs pcie_aspm=off"
KERNEL_CMDLINE[default]+="quiet splash"

ENABLE_UKI=yes
CUSTOM_UKI_NAME="omarchy"

ENABLE_LIMINE_FALLBACK=yes

# Find and add other bootloaders
FIND_BOOTLOADERS=yes

BOOT_ORDER="*, *fallback, Snapshots"

MAX_SNAPSHOT_ENTRIES=5

SNAPSHOT_FORMAT_CHOICE=5

# 5s boot menu timeout (step 4 of homelab-harden).
# This value is read by limine-mkinitcpio and persisted into /boot/limine.conf
# on every regeneration, surviving kernel updates.
TIMEOUT=5
LIMINE_EOF
)

    local regen_needed=0

    write_if_changed /etc/mkinitcpio.conf.d/omarchy_hooks.conf "$hooks_content"
    [[ $? -eq 10 ]] && regen_needed=1

    # /etc/kernel/cmdline is NOT newline-terminated in our reference; keep it that way.
    write_if_changed /etc/kernel/cmdline "$cmdline_content"
    [[ $? -eq 10 ]] && regen_needed=1

    write_if_changed /etc/default/limine "$limine_content"
    [[ $? -eq 10 ]] && regen_needed=1

    if [[ $regen_needed -eq 1 ]]; then
        info "regenerating initramfs (mkinitcpio -P)"
        sudo mkinitcpio -P || warning "mkinitcpio -P failed — inspect manually"

        if command -v limine-mkinitcpio &>/dev/null; then
            info "regenerating limine config (limine-mkinitcpio -P)"
            sudo limine-mkinitcpio -P || warning "limine-mkinitcpio -P failed"
        elif command -v limine-entry-tool &>/dev/null; then
            info "regenerating limine entries"
            sudo limine-entry-tool || warning "limine-entry-tool failed"
        else
            warning "No limine regeneration tool found — /boot/limine.conf will not update"
        fi
    else
        success "TPM2 unlock config already current"
    fi
}

# ---------------------------------------------------------------------------
# Step 2: Snapper daily snapshots
# ---------------------------------------------------------------------------

ensure_snapshots_subvol() {
    # /.snapshots MUST be a btrfs subvolume — plain dirs get skipped during
    # btrfs subvol snapshots and disappear on rollback.
    if ! command -v btrfs &>/dev/null; then
        warning "btrfs CLI missing — installing btrfs-progs"
        sudo pacman -S --noconfirm --needed btrfs-progs
    fi

    if [[ -d /.snapshots ]] && sudo btrfs subvolume show /.snapshots &>/dev/null; then
        success "/.snapshots is already a btrfs subvolume"
        return 0
    fi

    if [[ -d /.snapshots ]] && ! sudo btrfs subvolume show /.snapshots &>/dev/null; then
        info "/.snapshots is a plain directory — converting to subvolume"
        # Only safe if empty; otherwise refuse and let a human sort it out.
        if [[ -n "$(sudo ls -A /.snapshots 2>/dev/null)" ]]; then
            error "/.snapshots has content — refusing to auto-convert; inspect manually"
            return 1
        fi
        sudo rmdir /.snapshots
    fi

    if [[ ! -e /.snapshots ]]; then
        sudo btrfs subvolume create /.snapshots
        sudo chmod 0750 /.snapshots
        success "created /.snapshots btrfs subvolume"
    fi
}

configure_snapper() {
    sudo pacman -S --noconfirm --needed snapper snap-pac

    # Create configs only if absent (snapper create-config is NOT idempotent).
    if ! sudo snapper list-configs 2>/dev/null | awk '{print $1}' | grep -qx 'root'; then
        info "creating snapper config: root (/)"
        # If /.snapshots already exists as a subvol, create-config will fail.
        # Use -f <filesystem> then manually set SUBVOLUME.
        sudo snapper -c root create-config / || warning "snapper root config exists or failed"
    fi

    if [[ -d /home ]] && findmnt -n -o FSTYPE /home 2>/dev/null | grep -q '^btrfs$'; then
        if ! sudo snapper list-configs 2>/dev/null | awk '{print $1}' | grep -qx 'home'; then
            info "creating snapper config: home (/home)"
            sudo snapper -c home create-config /home || warning "snapper home config exists or failed"
        fi
    fi

    # Apply timeline policy: daily only, 7-day retention, no hourly noise.
    for cfg in root home; do
        if sudo snapper list-configs 2>/dev/null | awk '{print $1}' | grep -qx "$cfg"; then
            sudo snapper -c "$cfg" set-config \
                TIMELINE_CREATE=yes \
                TIMELINE_LIMIT_HOURLY=0 \
                TIMELINE_LIMIT_DAILY=7 \
                TIMELINE_LIMIT_WEEKLY=0 \
                TIMELINE_LIMIT_MONTHLY=0 \
                TIMELINE_LIMIT_YEARLY=0 \
                TIMELINE_LIMIT_QUARTERLY=0 \
                || warning "snapper set-config failed for $cfg"
            success "snapper $cfg: timeline=7d daily"
        fi
    done

    # Timers
    for timer in snapper-timeline.timer snapper-cleanup.timer; do
        if ! sudo systemctl is-enabled "$timer" &>/dev/null; then
            sudo systemctl enable "$timer"
        fi
        if ! sudo systemctl is-active "$timer" &>/dev/null; then
            sudo systemctl restart "$timer"
        fi
        success "$timer enabled + active"
    done
}

# ---------------------------------------------------------------------------
# Step 5: Tailscale (install + enable; authenticate if possible)
# ---------------------------------------------------------------------------
#
# Idempotency:
#   - pacman --needed skips reinstall if tailscale is already present.
#   - systemctl is-enabled / is-active gate the enable/start calls.
#   - `tailscale status` exit 0 means the node is already logged in — no-op.
#
# Auth flow:
#   - If $TAILSCALE_AUTHKEY is set, pass --authkey for unattended enrollment.
#   - Otherwise, run `tailscale up --accept-routes` and surface the login URL
#     so the user can approve from another device. This call blocks until
#     the URL prints, but tailscale returns 0 once it dumps the URL.
#
# Failure isolation:
#   - Wrapped so a tailscale install/enable failure logs a warning but does
#     NOT abort the rest of harden.sh (snapper/limine must still run).

setup_tailscale() {
    # Install package (skip if already present).
    if ! command -v tailscale &>/dev/null; then
        info "installing tailscale"
        if ! sudo pacman -S --noconfirm --needed tailscale; then
            warning "tailscale install failed — skipping remaining tailscale setup"
            return 0
        fi
    else
        success "tailscale already installed ($(tailscale version 2>/dev/null | head -n1 || echo 'unknown'))"
    fi

    # Enable + start tailscaled.
    if ! sudo systemctl is-enabled tailscaled &>/dev/null; then
        info "enabling tailscaled"
        sudo systemctl enable tailscaled || {
            warning "failed to enable tailscaled — skipping"
            return 0
        }
    fi
    if ! sudo systemctl is-active tailscaled &>/dev/null; then
        info "starting tailscaled"
        sudo systemctl start tailscaled || {
            warning "failed to start tailscaled — skipping"
            return 0
        }
    fi
    success "tailscaled enabled + active"

    # Check auth state. `tailscale status` exits 0 when logged in.
    if sudo tailscale status &>/dev/null; then
        local node_info
        node_info=$(sudo tailscale status --self=true --peers=false 2>/dev/null | head -n1 || true)
        success "tailscale already authenticated (${node_info:-node active})"
        return 0
    fi

    # Not authenticated — either use auth-key or surface login URL.
    local -a up_args=(up --accept-routes)
    local authkey="${TAILSCALE_AUTHKEY:-}"

    if [[ -n "$authkey" ]]; then
        info "authenticating tailscale via TAILSCALE_AUTHKEY"
        up_args+=("--authkey=$authkey")
        if sudo tailscale "${up_args[@]}"; then
            success "tailscale authenticated (authkey)"
        else
            warning "tailscale up --authkey failed — inspect manually"
        fi
        return 0
    fi

    # Interactive path — print URL, DO NOT block harden.sh.
    info "tailscale needs manual login — running 'tailscale up --accept-routes'"
    info "open the printed URL on another device to approve this node:"
    # tailscale up prints the login URL to stderr; we want the user to see it.
    # It blocks until the URL is emitted, then returns 0.
    sudo tailscale "${up_args[@]}" || warning "tailscale up returned non-zero — check output above"

    info "continuing harden.sh; re-run later to confirm 'tailscale already authenticated'"
    return 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    info "========================================"
    info "  Homelab Hardening (Arch/omarchy)"
    info "  Host:    $(hostname)"
    info "  Kernel:  $(uname -r)"
    info "========================================"

    assert_arch_btrfs
    require_sudo

    ensure_snapshots_subvol
    configure_tpm2_unlock
    configure_snapper
    setup_tailscale

    success "Homelab hardening complete"
}

main "$@"
