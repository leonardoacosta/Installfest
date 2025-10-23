# Samba Configuration Research

## Service Overview
Samba provides SMB/CIFS file sharing services for network storage access across different operating systems.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"
PUID: "1000"
PGID: "1000"
WORKGROUP: "WORKGROUP"
SERVER_STRING: "Homelab NAS"
NETBIOS_NAME: "HOMELAB"

# Security
SMB_USER: "${SMB_USER}"
SMB_PASSWORD: "${SMB_PASSWORD}"
SECURITY: "user"
MAP_TO_GUEST: "never"

# Performance
SMB_PROTOCOL_MIN: "SMB2"
SMB_PROTOCOL_MAX: "SMB3"
AIO_READ_SIZE: "16384"
AIO_WRITE_SIZE: "16384"
SOCKET_OPTIONS: "TCP_NODELAY IPTOS_LOWDELAY"
```

## 2. Secrets Management Strategy

```yaml
secrets:
  samba_users:
    file: ./secrets/samba/users.txt
  samba_admin_password:
    file: ./secrets/samba/admin_password.txt

environment:
  - SMB_USERS_FILE=/run/secrets/samba_users
  - ADMIN_PASSWORD_FILE=/run/secrets/samba_admin_password
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/samba:/config:rw
  - /mnt/storage:/storage:rw
  - /mnt/media:/media:rw
  - /mnt/backups:/backups:rw
  - ./logs/samba:/var/log/samba:rw

ports:
  - "445:445/tcp"    # SMB
  - "139:139/tcp"    # NetBIOS
  - "137:137/udp"    # NetBIOS
  - "138:138/udp"    # NetBIOS
```

## 4. Configuration File Template

```ini
# smb.conf
[global]
workgroup = WORKGROUP
server string = Homelab NAS
netbios name = HOMELAB
security = user
map to guest = never
dns proxy = no
server min protocol = SMB2
server max protocol = SMB3

# Performance
socket options = TCP_NODELAY IPTOS_LOWDELAY
read raw = yes
write raw = yes
oplocks = yes
max xmit = 65535
dead time = 15
getwd cache = yes

# Security
encrypt passwords = yes
passdb backend = tdbsam
obey pam restrictions = yes
unix password sync = yes
passwd program = /usr/bin/passwd %u
pam password change = yes
server signing = mandatory
client signing = mandatory

# Shares
[storage]
path = /storage
browseable = yes
writable = yes
valid users = @users
create mask = 0664
directory mask = 0775

[media]
path = /media
browseable = yes
read only = yes
guest ok = no
valid users = @media

[backups]
path = /backups
browseable = yes
writable = yes
valid users = @backup
create mask = 0660
directory mask = 0770
```

## Security & Performance

- Use SMB3 with encryption
- Implement user/group permissions
- Enable oplocks for performance
- Use dedicated backup share
- Regular permission audits