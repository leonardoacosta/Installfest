# Tailscale Routes Restoration System - Setup Guide

## Overview

This system automatically restores Tailscale IP routes and iptables rules after Docker restarts, preventing the "deleted IP rules" issue when running Tailscale and AdGuard Home together.

**Implementation:** Solution #4 from `TAILSCALE-ADGUARD-IPTABLES-ISSUE.md`

---

## Architecture

### Components

1. **Restoration Script** (`/usr/local/bin/restore-tailscale-routes.sh`)
   - Detects Tailscale IP address and interface
   - Restores IP routes for advertised subnets
   - Restores iptables MASQUERADE rules
   - Enables IP forwarding
   - Logs all actions to `/var/log/tailscale-routes-restore.log`

2. **Systemd Service** (`restore-tailscale-routes.service`)
   - Runs the restoration script
   - Executes after Docker and network are online
   - Can be triggered manually or automatically

3. **Systemd Path Unit** (`restore-tailscale-routes.path`)
   - Monitors `/var/run/docker.sock` for changes
   - Auto-triggers restoration when Docker events occur
   - Ensures routes persist across container restarts

4. **CI/CD Integration** (`scripts/deploy-ci-streamlined.sh`)
   - Automatically installs/updates all components
   - Runs during every deployment
   - Verifies configuration on each CI/CD run

---

## How It Works

### Normal Operation Flow

```
1. Docker container restarts
   ↓
2. Path unit detects docker.sock change
   ↓
3. Service unit triggers
   ↓
4. Restoration script runs:
   - Waits for Tailscale to be ready (up to 30 seconds)
   - Gets Tailscale IP (e.g., 100.x.x.x)
   - Gets Tailscale interface (tailscale0)
   - Adds IP routes: 172.20.0.0/16 and 172.21.0.0/16
   - Adds iptables MASQUERADE rule
   - Enables IP forwarding
   ↓
5. Logs success to /var/log/tailscale-routes-restore.log
```

### CI/CD Deployment Flow

```
1. GitHub Actions triggers deployment
   ↓
2. deploy-ci-streamlined.sh runs
   ↓
3. setup_tailscale_routes_restoration() function:
   - Checks if script exists in /usr/local/bin
   - Checks if systemd units exist
   - Compares with source files
   - Installs/updates if different
   - Reloads systemd if changes made
   - Enables services
   - Starts path monitoring
   - Triggers immediate restoration
   ↓
4. System ready for Docker restarts
```

---

## Installation

### Automatic Installation (Recommended)

The system installs automatically during CI/CD deployments:

```bash
# Just push your code
git add -A
git commit -m "Deploy with Tailscale routes restoration"
git push

# GitHub Actions will:
# 1. Deploy homelab
# 2. Install restoration system
# 3. Start monitoring
```

### Manual Installation

If you need to install manually:

```bash
# SSH to your server
ssh nyaptor@192.168.1.14

# Navigate to homelab directory
cd ~/homelab

# Run deployment script
./scripts/deploy-ci-streamlined.sh
```

The `setup_tailscale_routes_restoration()` function handles everything automatically.

---

## Verification

### Check Installation Status

```bash
# Check if script is installed
ls -lh /usr/local/bin/restore-tailscale-routes.sh

# Check if systemd units are installed
systemctl status restore-tailscale-routes.service
systemctl status restore-tailscale-routes.path

# Check if services are enabled
systemctl is-enabled restore-tailscale-routes.service
systemctl is-enabled restore-tailscale-routes.path

# Check if path monitoring is active
systemctl is-active restore-tailscale-routes.path
```

### Check Routes

```bash
# View all IP routes
ip route show

# Check specific Tailscale routes
ip route show 172.20.0.0/16
ip route show 172.21.0.0/16

# Should show something like:
# 172.20.0.0/16 via 100.x.x.x dev tailscale0
```

### Check iptables Rules

```bash
# View NAT rules
sudo iptables -t nat -L POSTROUTING -v -n

# Should include:
# MASQUERADE  all  --  *  tailscale0  0.0.0.0/0  0.0.0.0/0
```

### Check Logs

```bash
# View restoration log
sudo cat /var/log/tailscale-routes-restore.log

# Watch logs in real-time
sudo tail -f /var/log/tailscale-routes-restore.log

# View systemd journal
sudo journalctl -u restore-tailscale-routes.service -f
```

---

## Testing

### Test Automatic Restoration

```bash
# Restart a Docker container and watch routes restore
docker restart jellyfin

# Check logs immediately
sudo tail -20 /var/log/tailscale-routes-restore.log

# Verify routes exist
ip route show | grep tailscale
```

### Test Manual Trigger

```bash
# Manually trigger restoration
sudo systemctl start restore-tailscale-routes.service

# Check status
systemctl status restore-tailscale-routes.service

# View output
sudo journalctl -u restore-tailscale-routes.service -n 50
```

### Test Route Deletion and Recovery

```bash
# Delete a route (simulate the problem)
sudo ip route del 172.20.0.0/16

# Verify it's gone
ip route show 172.20.0.0/16  # Should be empty

# Restart a container to trigger restoration
docker restart adguardhome

# Wait a few seconds, then check
sleep 5
ip route show 172.20.0.0/16  # Should be back!
```

---

## Configuration

### Environment Variables

The restoration script uses these environment variables (configured in systemd service):

| Variable | Default | Description |
|----------|---------|-------------|
| `TS_ROUTES` | `172.20.0.0/16,172.21.0.0/16` | Comma-separated list of subnets to route |
| `PATH` | Standard system paths | Search path for commands |

### Modifying Subnets

To change which subnets are restored, edit the systemd service:

```bash
# Edit service file
sudo nano /etc/systemd/system/restore-tailscale-routes.service

# Find the Environment line:
Environment="TS_ROUTES=172.20.0.0/16,172.21.0.0/16"

# Change to your subnets, e.g.:
Environment="TS_ROUTES=172.20.0.0/16,172.21.0.0/16,10.0.0.0/24"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart restore-tailscale-routes.service
```

**Or** modify in the source and redeploy:

```bash
# Edit systemd/restore-tailscale-routes.service in your repo
nano ~/homelab/systemd/restore-tailscale-routes.service

# Commit and push
git commit -am "Update Tailscale routes"
git push

# CI/CD will update automatically
```

---

## Troubleshooting

### Issue: Routes Not Restored

**Symptoms:** IP routes missing after Docker restart

**Diagnosis:**
```bash
# Check if path unit is running
systemctl status restore-tailscale-routes.path

# Check logs
sudo journalctl -u restore-tailscale-routes.service -n 100
```

**Solutions:**
```bash
# Restart path monitoring
sudo systemctl restart restore-tailscale-routes.path

# Manually trigger restoration
sudo systemctl start restore-tailscale-routes.service

# Check for errors
systemctl status restore-tailscale-routes.service
```

---

### Issue: "Tailscale not running" Error

**Symptoms:** Log shows "Tailscale is not running after 30 seconds"

**Diagnosis:**
```bash
# Check if Tailscale is running
docker ps | grep tailscale  # If Docker
sudo systemctl status tailscaled  # If host-level

# Check Tailscale status
tailscale status  # Host-level
docker exec tailscale tailscale status  # Docker
```

**Solutions:**
```bash
# If Docker Tailscale is stopped
docker start tailscale

# If host-level Tailscale is stopped
sudo systemctl start tailscaled

# Verify and trigger restoration
sudo systemctl start restore-tailscale-routes.service
```

---

### Issue: Permission Denied Errors

**Symptoms:** Script fails with permission errors

**Diagnosis:**
```bash
# Check script permissions
ls -l /usr/local/bin/restore-tailscale-routes.sh

# Check if running as root
sudo journalctl -u restore-tailscale-routes.service | grep EUID
```

**Solutions:**
```bash
# Fix script permissions
sudo chmod +x /usr/local/bin/restore-tailscale-routes.sh
sudo chown root:root /usr/local/bin/restore-tailscale-routes.sh

# The service should run as root (required for iptables)
# This is configured in the service unit file
```

---

### Issue: Path Unit Not Triggering

**Symptoms:** Routes don't restore automatically after container restarts

**Diagnosis:**
```bash
# Check if path unit is active
systemctl is-active restore-tailscale-routes.path

# Check path unit status
systemctl status restore-tailscale-routes.path

# Check Docker socket
ls -l /var/run/docker.sock
```

**Solutions:**
```bash
# Start path unit if not active
sudo systemctl start restore-tailscale-routes.path

# Enable if not enabled
sudo systemctl enable restore-tailscale-routes.path

# Restart path monitoring
sudo systemctl restart restore-tailscale-routes.path

# Verify it's monitoring
systemctl status restore-tailscale-routes.path
```

---

### Issue: iptables Rules Not Created

**Symptoms:** MASQUERADE rule missing from iptables

**Diagnosis:**
```bash
# Check current iptables
sudo iptables -t nat -L POSTROUTING -v -n | grep tailscale

# Check for iptables/nftables version mismatch
sudo update-alternatives --display iptables
```

**Solutions:**
```bash
# Ensure using correct iptables version
sudo update-alternatives --set iptables /usr/sbin/iptables-nft

# Manually trigger restoration
sudo systemctl start restore-tailscale-routes.service

# Check if rule was added
sudo iptables -t nat -L POSTROUTING -v -n | grep MASQUERADE
```

---

## Maintenance

### Updating the System

The system updates automatically during CI/CD deployments. The `setup_tailscale_routes_restoration()` function:

1. Compares source files with installed files
2. Updates if different
3. Reloads systemd
4. No manual intervention needed

### Viewing Logs

```bash
# Real-time log viewing
sudo tail -f /var/log/tailscale-routes-restore.log

# View last 50 lines
sudo tail -50 /var/log/tailscale-routes-restore.log

# View systemd journal
sudo journalctl -u restore-tailscale-routes.service -f

# View with timestamps
sudo journalctl -u restore-tailscale-routes.service --since "1 hour ago"
```

### Log Rotation

The log file `/var/log/tailscale-routes-restore.log` grows over time. Set up log rotation:

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/tailscale-routes > /dev/null <<'EOF'
/var/log/tailscale-routes-restore.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

# Test configuration
sudo logrotate -d /etc/logrotate.d/tailscale-routes

# Force rotation (if needed)
sudo logrotate -f /etc/logrotate.d/tailscale-routes
```

---

## Monitoring

### Create a Monitoring Script

```bash
#!/bin/bash
# /usr/local/bin/check-tailscale-routes.sh

# Check if expected routes exist
EXPECTED_ROUTES="172.20.0.0/16 172.21.0.0/16"

for route in $EXPECTED_ROUTES; do
    if ! ip route show "$route" | grep -q "via"; then
        echo "ERROR: Route $route is missing!"
        # Trigger restoration
        systemctl start restore-tailscale-routes.service
        exit 1
    fi
done

echo "✓ All Tailscale routes are present"
exit 0
```

### Add to Cron (Optional)

```bash
# Check routes every 5 minutes
echo "*/5 * * * * /usr/local/bin/check-tailscale-routes.sh >> /var/log/tailscale-routes-monitor.log 2>&1" | sudo crontab -
```

---

## Uninstallation

If you need to remove the system:

```bash
# Stop and disable services
sudo systemctl stop restore-tailscale-routes.path
sudo systemctl stop restore-tailscale-routes.service
sudo systemctl disable restore-tailscale-routes.path
sudo systemctl disable restore-tailscale-routes.service

# Remove systemd units
sudo rm /etc/systemd/system/restore-tailscale-routes.service
sudo rm /etc/systemd/system/restore-tailscale-routes.path

# Remove script
sudo rm /usr/local/bin/restore-tailscale-routes.sh

# Reload systemd
sudo systemctl daemon-reload

# Remove logs (optional)
sudo rm /var/log/tailscale-routes-restore.log
```

---

## Performance Impact

### Resource Usage

- **CPU:** Negligible (script runs only when triggered, completes in <1 second)
- **Memory:** <5MB for script execution
- **Disk:** Log file grows ~1KB per restoration event
- **Network:** No network overhead

### Timing

- **Restoration Time:** <1 second typical
- **Trigger Delay:** 0-5 seconds after Docker event
- **Startup Impact:** Minimal (runs after services start)

---

## Security Considerations

### Required Permissions

The restoration script needs:
- **Root access** (for iptables and ip route commands)
- **NET_ADMIN capability** (to modify network configuration)
- **Docker socket read** (to detect container events via path unit)

### Security Measures

✅ **Script ownership:** Root-only (prevents unauthorized modification)
✅ **Minimal scope:** Only modifies Tailscale-related rules
✅ **Logging:** All actions logged for audit trail
✅ **Systemd sandboxing:** PrivateTmp=yes prevents temp file attacks
✅ **No network access:** Script operates entirely locally

---

## Integration with Other Systems

### Alerting

Send notifications when restoration fails:

```bash
# Add to /usr/local/bin/restore-tailscale-routes.sh (before exit 1)
# Requires mail or curl for webhooks

# Example: Send to webhook
curl -X POST https://your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{"text":"Tailscale routes restoration failed!"}'
```

### Monitoring Stack

Integrate with Prometheus/Grafana:

```bash
# Export metrics from log file
# Add to your metrics exporter or create a simple one
grep -c "Restoration complete" /var/log/tailscale-routes-restore.log
```

---

## FAQ

### Q: Does this work with userspace Tailscale?

**A:** The script detects userspace mode and skips route/iptables restoration (not needed in userspace mode). It will log a warning but won't fail.

### Q: What happens if Tailscale isn't running?

**A:** The script waits up to 30 seconds for Tailscale to start, then exits with a warning. The path unit will retry on the next Docker event.

### Q: Can I disable auto-triggering?

**A:** Yes, stop/disable the path unit:
```bash
sudo systemctl stop restore-tailscale-routes.path
sudo systemctl disable restore-tailscale-routes.path
```
You can still manually trigger: `sudo systemctl start restore-tailscale-routes.service`

### Q: Does this interfere with Tailscale updates?

**A:** No. The script only restores routes/rules, it doesn't modify Tailscale configuration. Updates work normally.

### Q: Can I use this with multiple Tailscale instances?

**A:** The current version supports one Tailscale instance (host-level or Docker). Multiple instances would require script modifications.

---

## Related Documentation

- **Problem Analysis:** `docs/TAILSCALE-ADGUARD-IPTABLES-ISSUE.md`
- **Alternative Solutions:** See Solutions 1-3 in the issue document
- **CI/CD Integration:** `scripts/deploy-ci-streamlined.sh`
- **Common Utils:** `scripts/common-utils.sh`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial implementation with CI/CD integration |

---

## Support

If you encounter issues:

1. Check logs: `/var/log/tailscale-routes-restore.log`
2. Check service status: `systemctl status restore-tailscale-routes.service`
3. Verify Tailscale is running: `tailscale status`
4. Review troubleshooting section above
5. Check main documentation: `TAILSCALE-ADGUARD-IPTABLES-ISSUE.md`

---

**Last Updated:** 2025-10-30
**Maintained By:** Homelab CI/CD Pipeline
**Auto-Updates:** Yes (via deployment script)
