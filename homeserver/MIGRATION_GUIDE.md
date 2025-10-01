# Migration Guide - Old Scripts to New Wizard

## What Changed?

All separate scripts have been **consolidated into one unified wizard**: `homeserver.sh`

## Old Scripts → New Commands

| Old Script | New Command | What It Does |
|------------|-------------|--------------|
| `./start.sh` | `./homeserver.sh start` | Start services |
| `./start.sh wizard` | `./homeserver.sh setup` | Setup wizard |
| `./install-arch.sh` | `./homeserver.sh install` | Install on Arch |
| `./restart-clean.sh` | `./homeserver.sh restart` | Clean restart |
| `./cleanup.sh` | `./homeserver.sh` → option 8 | Cleanup |
| `./setup-session.sh` | (automatic) | Session setup |

## Quick Migration

**If you were using:**
```bash
./start.sh wizard
```

**Now use:**
```bash
./homeserver.sh setup
```

**If you were using:**
```bash
./restart-clean.sh
```

**Now use:**
```bash
./homeserver.sh restart
```

## Benefits of the New Wizard

✅ **One script instead of 5+**
✅ **Interactive menu for all operations**
✅ **Built-in troubleshooting**
✅ **Command-line mode for automation**
✅ **Automatic environment setup**
✅ **Better error handling**

## File Structure Now

```
homeserver/
├── homeserver.sh          ⭐ THE ONLY SCRIPT YOU NEED
├── podman-compose.yml     (unchanged)
├── .env                   (unchanged)
├── env.example           (unchanged)
└── Documentation:
    ├── README.md          (updated)
    ├── START_HERE.md      (updated)
    ├── QUICK_START.md     (updated)
    ├── ARCH_LINUX_SETUP.md
    ├── TROUBLESHOOTING.md
    ├── PORT_CONFLICTS.md
    ├── DBUS_FIX.md
    └── FIX_SUMMARY.md
```

## What Was Removed

The following scripts were **removed** (functionality moved to `homeserver.sh`):
- ❌ `start.sh`
- ❌ `install-arch.sh`
- ❌ `restart-clean.sh`
- ❌ `cleanup.sh`
- ❌ `setup-session.sh`

## All Commands Still Work

Everything you could do before, you can still do - just with one script:

```bash
# Interactive mode (recommended)
./homeserver.sh

# Command line mode
./homeserver.sh setup      # First time setup
./homeserver.sh install    # Install on Arch
./homeserver.sh start      # Start services
./homeserver.sh stop       # Stop services
./homeserver.sh restart    # Clean restart
./homeserver.sh status     # Show status
./homeserver.sh logs       # View logs
./homeserver.sh logs NAME  # View specific logs
```

## Your Data is Safe

All your existing configuration and data is **unchanged**:
- `.env` file - untouched
- Service config directories - untouched
- Media files - untouched
- Container volumes - untouched

## Next Steps

1. **Delete old scripts if you saved them elsewhere**
   ```bash
   # They're already removed from the repo
   ```

2. **Use the new wizard**
   ```bash
   ./homeserver.sh
   ```

3. **Read START_HERE.md** for the simplified guide

That's it! Everything is simpler now.
