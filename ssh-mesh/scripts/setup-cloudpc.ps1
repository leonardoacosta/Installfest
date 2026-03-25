# SSH Mesh Setup Script for CloudPC (Windows)
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup-cloudpc.ps1

$ErrorActionPreference = "Stop"

Write-Output "=== SSH Mesh Setup for CloudPC ==="
Write-Output ""

# SSH Key (shared across all machines)
$publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFqT0bMXcrQGgWvYoLg66dCCvhgAPx1rmrJmzGpMeFVR"

# Private key content (base64 encoded for safe transport)
# IMPORTANT: In production, transfer this securely - do not commit to public repos
$privateKeyContent = @"
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBak9GzF3K0BoFr2KC4OunQgr4YAD8da5qyZsxqTHhVUQAAAIiVkaYjlZGm
IwAAAAtzc2gtZWQyNTUxOQAAACBak9GzF3K0BoFr2KC4OunQgr4YAD8da5qyZsxqTHhVUQ
AAAED7bQKoVlJnRh+I/kWO0jJRFyK04tJYG1n/H2O0F0VZ3VqT0bMXcrQGgWvYoLg66dCC
vhgAPx1rmrJmzGpMeFVRAAAAAAECAwQF
-----END OPENSSH PRIVATE KEY-----
"@

# SSH Config for outbound connections
$sshConfig = @"
# SSH Config for CloudPC
Host homelab
    HostName 100.94.11.104
    User nyaptor
    IdentityFile ~/.ssh/id_ed25519

Host mac
    HostName 100.91.88.16
    User leonardoacosta
    IdentityFile ~/.ssh/id_ed25519
"@

# Paths - Windows has two potential users
$paths = @(
    @{
        Name = "leo (SSH login user)"
        SshDir = "C:\Users\leo\.ssh"
        AuthKeys = "C:\Users\leo\.ssh\authorized_keys"
    },
    @{
        Name = "LeonardoAcosta (AzureAD user)"
        SshDir = "C:\Users\LeonardoAcosta\.ssh"
        AuthKeys = "C:\Users\LeonardoAcosta\.ssh\authorized_keys"
        Config = "C:\Users\LeonardoAcosta\.ssh\config"
        PrivateKey = "C:\Users\LeonardoAcosta\.ssh\id_ed25519"
        PublicKey = "C:\Users\LeonardoAcosta\.ssh\id_ed25519.pub"
    }
)

# Admin authorized_keys (required for admin users on Windows)
$adminAuthKeys = "C:\ProgramData\ssh\administrators_authorized_keys"

foreach ($path in $paths) {
    Write-Output "Processing: $($path.Name)"

    # Create .ssh directory
    if (-not (Test-Path $path.SshDir)) {
        New-Item -ItemType Directory -Force -Path $path.SshDir | Out-Null
        Write-Output "  Created: $($path.SshDir)"
    }

    # Handle existing authorized_keys
    if (Test-Path $path.AuthKeys) {
        takeown /f $path.AuthKeys 2>$null | Out-Null
        Remove-Item $path.AuthKeys -Force -ErrorAction SilentlyContinue
    }

    # Write authorized_keys
    Set-Content -Path $path.AuthKeys -Value $publicKey -Force
    Write-Output "  Created: $($path.AuthKeys)"

    # For LeonardoAcosta, also set up outbound SSH
    if ($path.Config) {
        Set-Content -Path $path.Config -Value $sshConfig -Force
        Write-Output "  Created: $($path.Config)"
    }
    if ($path.PrivateKey) {
        Set-Content -Path $path.PrivateKey -Value $privateKeyContent -Force -NoNewline
        Write-Output "  Created: $($path.PrivateKey)"
    }
    if ($path.PublicKey) {
        Set-Content -Path $path.PublicKey -Value $publicKey -Force
        Write-Output "  Created: $($path.PublicKey)"
    }
}

# Setup admin authorized_keys
Write-Output ""
Write-Output "Setting up administrator authorized_keys..."

# Create ProgramData\ssh if needed
$sshProgramData = "C:\ProgramData\ssh"
if (-not (Test-Path $sshProgramData)) {
    New-Item -ItemType Directory -Force -Path $sshProgramData | Out-Null
}

# Handle existing admin authorized_keys
if (Test-Path $adminAuthKeys) {
    takeown /f $adminAuthKeys 2>$null | Out-Null
    Remove-Item $adminAuthKeys -Force -ErrorAction SilentlyContinue
}

# Write admin authorized_keys
Set-Content -Path $adminAuthKeys -Value $publicKey -Force

# Set correct permissions (critical for Windows OpenSSH)
Write-Output "Setting permissions on admin authorized_keys..."
icacls $adminAuthKeys /inheritance:r /grant "SYSTEM:F" /grant "Administrators:F" | Out-Null

Write-Output ""
Write-Output "=== Setup Complete ==="
Write-Output ""
Write-Output "Test inbound connections from Mac or Homelab:"
Write-Output "  ssh cloudpc"
Write-Output ""
Write-Output "Test outbound connections (run as LeonardoAcosta):"
Write-Output "  ssh homelab"
Write-Output "  ssh mac"
