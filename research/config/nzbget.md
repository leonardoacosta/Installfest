# NZBGet Configuration Research

## Service Overview
NZBGet is a high-performance Usenet downloader optimized for low-resource systems, providing automated downloading from Usenet servers.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
NZBGET_PORT: "6789"
NZBGET_USER: "admin"
NZBGET_PASS: "${NZBGET_PASSWORD}"

# Performance
ARTICLE_CACHE: "700"      # MB
WRITE_BUFFER: "1024"       # KB
PAR_THREADS: "4"
UNPACK_THREADS: "2"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/nzbget:/config:rw
  - /mnt/downloads:/downloads:rw
  - /mnt/downloads/intermediate:/intermediate:rw
  - ./logs/nzbget:/logs:rw

ports:
  - "6789:6789"
```

## 3. Configuration File Template

```conf
# nzbget.conf
MainDir=/downloads
DestDir=${MainDir}/completed
InterDir=/intermediate
NzbDir=${MainDir}/nzb
QueueDir=${MainDir}/queue
TempDir=${MainDir}/tmp
ScriptDir=${MainDir}/scripts
LogFile=/logs/nzbget.log
ConfigTemplate=/usr/share/nzbget/nzbget.conf

# News Servers
Server1.Active=yes
Server1.Name=Primary
Server1.Host=news.provider.com
Server1.Port=563
Server1.Username=${NEWS_USER}
Server1.Password=${NEWS_PASS}
Server1.Encryption=yes
Server1.Connections=20
Server1.Retention=3000

# Categories
Category1.Name=movies
Category1.DestDir=${DestDir}/movies
Category1.Aliases=movie*

Category2.Name=series
Category2.DestDir=${DestDir}/tv
Category2.Aliases=tv*, show*

Category3.Name=music
Category3.DestDir=${DestDir}/music
Category3.Aliases=audio*, music*

# Performance
ArticleCache=700
WriteBuffer=1024
CrcCheck=yes
DirectWrite=yes
ContinuePartial=yes
FlushQueue=yes
ReorderFiles=yes

# Post-Processing
ParCheck=auto
ParRepair=yes
ParScan=extended
ParQuick=yes
PostStrategy=balanced
UnpackCleanupDisk=yes
DirectUnpack=yes

# Security
ControlPort=6789
ControlUsername=admin
ControlPassword=${NZBGET_PASSWORD}
RestrictedUsername=guest
RestrictedPassword=${GUEST_PASSWORD}
AddUsername=
AddPassword=
SecureControl=no
SecureCert=/ssl/cert.pem
SecureKey=/ssl/key.pem
```

## 4. Post-Processing Scripts

```python
#!/usr/bin/env python3
# VideoSort.py - Post-processing script
import os
import sys
import shutil

# NZBGet passes parameters
nzb_name = os.environ.get('NZBPP_NZBNAME')
download_dir = os.environ.get('NZBPP_DIRECTORY')
category = os.environ.get('NZBPP_CATEGORY')

def sort_video():
    """Sort downloaded videos into appropriate folders"""
    if category == 'movies':
        dest = '/mnt/media/movies'
    elif category == 'series':
        dest = '/mnt/media/tvshows'
    else:
        return 93  # POSTPROCESS_NONE

    # Move files
    for file in os.listdir(download_dir):
        if file.endswith(('.mkv', '.mp4', '.avi')):
            shutil.move(
                os.path.join(download_dir, file),
                os.path.join(dest, file)
            )

    return 93  # POSTPROCESS_SUCCESS

if __name__ == '__main__':
    sys.exit(sort_video())
```

## 5. Integration with Arr Apps

```yaml
# Radarr/Sonarr configuration
download_client:
  type: "nzbget"
  name: "NZBGet"
  host: "nzbget"
  port: 6789
  username: "admin"
  password: "${NZBGET_PASSWORD}"
  use_ssl: false
  category: "movies"  # or "series"
  priority: 0
  client_priority: "normal"
```

## Security & Performance

- SSL/TLS for news server connections
- API key authentication
- Connection limit optimization
- Article cache tuning
- Parallel processing configuration
- Disk I/O optimization
- Failed download handling
- Duplicate detection