# Bazarr Configuration Research

## Service Overview
Bazarr manages and automatically downloads subtitles for your movies and TV shows, integrating with Sonarr and Radarr.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
BAZARR_PORT: "6767"
BAZARR_API_KEY: "${BAZARR_API_KEY}"

# Subtitle Settings
SUBTITLE_LANGUAGES: "en,es,fr"
HEARING_IMPAIRED: "false"
MINIMUM_SCORE: "90"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/bazarr:/config:rw
  - /mnt/media/movies:/movies:rw
  - /mnt/media/tvshows:/tv:rw
  - ./logs/bazarr:/logs:rw

ports:
  - "6767:6767"
```

## 3. Configuration Templates

```python
# config.ini
[general]
ip = 0.0.0.0
port = 6767
base_url = /
path_mappings = []
use_sonarr = True
use_radarr = True
single_language = False
minimum_score = 90
minimum_score_movie = 70
use_embedded_subs = True
adaptive_searching = True
enabled_providers = opensubtitles,addic7ed,podnapisi,subscene

[sonarr]
ip = sonarr
port = 8989
base_url = /
ssl = False
apikey = ${SONARR_API_KEY}
full_update = Daily
only_monitored = True
series_sync = 60
episodes_sync = 60

[radarr]
ip = radarr
port = 7878
base_url = /
ssl = False
apikey = ${RADARR_API_KEY}
full_update = Daily
only_monitored = True
movies_sync = 60

[subliminal]
providers = opensubtitles,addic7ed,podnapisi,subscene,tvsubtitles

[opensubtitles]
username = ${OPENSUBTITLES_USER}
password = ${OPENSUBTITLES_PASS}
vip = False
```

## 4. Provider Configuration

```yaml
providers:
  - name: "OpenSubtitles"
    username: "${OPENSUBTITLES_USER}"
    password: "${OPENSUBTITLES_PASS}"
    languages: ["en", "es"]

  - name: "Subscene"
    languages: ["en"]

anti_captcha:
  provider: "anti-captcha"
  api_key: "${ANTICAPTCHA_KEY}"
```

## Security & Performance

- API key authentication
- Provider rate limiting
- Subtitle validation
- Language preferences
- Embedded subtitle extraction
- Cache management