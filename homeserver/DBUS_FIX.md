# DBUS Session Bus Error - Quick Fix

## The Error You're Seeing

```
Failed to connect to user scope bus via local transport:
$DBUS_SESSION_BUS_ADDRESS and $XDG_RUNTIME_DIR not defined
```

## What It Means

You're running the install script via **SSH** or a **non-login shell**, which doesn't have the user session environment set up. This is **normal** and **safe to ignore**.

## Quick Fix (Choose One)

### Option 1: Ignore It (Recommended)

**Just continue** - the install script will keep going. Podman doesn't need the systemd socket to work.

The warning is harmless. Everything will work fine.

### Option 2: Set Environment (Current Session Only)

```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
./install-arch.sh
```

This sets the variable for your current terminal session.

### Option 3: Add to Shell Profile (Permanent)

```bash
# For bash users
echo 'export XDG_RUNTIME_DIR="/run/user/$(id -u)"' >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo 'export XDG_RUNTIME_DIR="/run/user/$(id -u)"' >> ~/.zshrc
source ~/.zshrc
```

This makes it permanent for all future sessions.

### Option 4: Use the Setup Script

```bash
./setup-session.sh
```

This script will:
- Set the environment variables
- Create missing directories
- Enable user lingering
- Test if Podman works

## What's Actually Happening

The install script tries to enable the **Podman socket** service using `systemctl --user`. This requires:
- `XDG_RUNTIME_DIR` - User runtime directory
- `DBUS_SESSION_BUS_ADDRESS` - Session bus location

When you're connected via SSH without a full login session, these aren't set automatically.

## Does This Break Anything?

**No.** Rootless Podman works perfectly fine without the socket service. The socket is optional and mainly used for:
- API access
- Integration with some tools
- Podman Desktop GUI

Your containers will run normally via `podman-compose`.

## After the Install

Once the install finishes, you can start your containers:

```bash
podman-compose up -d
```

No environment variables needed for this command.

## Testing

Check if Podman works:

```bash
podman ps
```

If this shows your containers (or shows nothing without errors), you're good to go!

## Related Warnings You Might See

### "Podman socket check failed (this is OK)"
- **Meaning:** The socket service isn't running
- **Impact:** None - containers work fine
- **Action:** Ignore it

### "Could not enable podman socket via systemctl --user"
- **Meaning:** Can't start socket without session bus
- **Impact:** None - socket is optional
- **Action:** Ignore it or use Option 2/3 above

## Summary

✅ **You can safely ignore this error**
✅ **Podman will work without the socket**
✅ **Your containers will run normally**

If you want to eliminate the warning, use **Option 3** to permanently set the environment variable.
