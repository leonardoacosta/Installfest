# Byparr Configuration Research

## Service Overview
Byparr (formerly FlareSolverr) is a proxy server to bypass Cloudflare and other anti-bot protections when accessing websites.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"
PORT: "8191"
HOST: "0.0.0.0"
LOG_LEVEL: "info"

# Browser Settings
HEADLESS: "true"
BROWSER_TIMEOUT: "40000"
TEST_URL: "https://www.google.com"

# Performance
MAX_SESSIONS: "10"
SESSION_TTL: "300000"
CAPTCHA_SOLVER: "none"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/byparr:/config:rw
  - ./logs/byparr:/logs:rw

ports:
  - "8191:8191"

tmpfs:
  - /tmp  # Browser cache in memory
```

## 3. Configuration Templates

```json
// Request format
{
  "cmd": "request.get",
  "url": "https://example.com",
  "maxTimeout": 60000,
  "session": "session-id",
  "proxy": {
    "url": "http://proxy:8080",
    "username": "user",
    "password": "pass"
  },
  "headers": {
    "User-Agent": "Mozilla/5.0..."
  }
}

// Session management
{
  "cmd": "sessions.create",
  "session": "session-id",
  "maxTimeout": 60000
}
```

## 4. Integration with Arr Apps

```yaml
# Prowlarr configuration
indexer_proxy:
  type: "flaresolverr"
  host: "byparr"
  port: 8191
  request_timeout: 60

# Rate limiting
rate_limits:
  requests_per_minute: 30
  concurrent_sessions: 5
  cooldown_period: 10
```

## Security & Performance

- Session management
- Memory optimization
- Request timeout configuration
- Proxy chain support
- Resource cleanup
- Error retry logic