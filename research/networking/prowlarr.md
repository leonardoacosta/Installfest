# Prowlarr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Network Mode**: service:gluetun (shares Gluetun's network)
- **No Direct IP**: Uses Gluetun's IP (172.21.0.2)
- **Port Access**: Through Gluetun's port 9696
- **VPN Protection**: All indexer queries through VPN
- **Dependency**: Gluetun health check required

## 2. Optimal Network Placement
**Recommended Zone**: Download VLAN (through VPN)
- Must remain behind VPN for indexer access
- Protects against ISP monitoring
- Hides indexer queries
- Prevents DMCA issues

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://prowlarr.domain.com` (internal only)
- **Internal access only recommended**
- API access for arr apps required
- Headers Required:
  ```nginx
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  X-Api-Key (for API calls)
  ```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **Should NOT be exposed externally**
- API key authentication required
- IP whitelisting for API access
- Behind VPN for all indexer queries
- Rate limiting on searches
- Monitor for excessive API usage
- Log all indexer access

**Indexer Security**:
- Use HTTPS indexers when possible
- Rotate indexer API keys
- Monitor for indexer bans
- Use FlareSolverr/Byparr for Cloudflare

## 5. Port Management and Conflicts
**Ports Used**:
- 9696/tcp: WebUI and API (through Gluetun)

**API Endpoints**:
- `/api/v1/indexer`: Indexer management
- `/api/v1/search`: Search queries
- `/api/v1/history`: Search history

## 6. DNS and Service Discovery
**DNS Configuration**:
- Uses Gluetun's VPN DNS
- Prevents DNS leaks for indexer queries
- Critical for privacy

## 7. VLAN Segmentation Recommendations
**Network Isolation**:
- Shares Gluetun's VLAN placement
- No direct network assignment
- Accessed through VPN container

## 8. Firewall Rules Required
**Controlled by Gluetun**:
- No direct firewall rules needed
- All traffic routed through VPN
- API access through Gluetun's ports

## 9. Inter-Service Communication Requirements
**Service Integrations**:
- **Radarr**: Movie indexer searches
- **Sonarr**: TV show indexer searches
- **Lidarr**: Music indexer searches
- **Readarr**: Book indexer searches
- **qBittorrent**: Sends torrents
- **NZBGet**: Sends NZB files
- **Byparr**: Cloudflare bypass

**App Sync Configuration**:
```yaml
# Prowlarr syncs to all arr apps
Apps:
  - Radarr (via API)
  - Sonarr (via API)
  - Lidarr (via API)
  - Readarr (via API)
```

## 10. Performance Optimization
**Search Optimizations**:
- Cache search results
- Limit concurrent indexer queries
- Use indexer priorities
- Disable slow/unreliable indexers
- Implement search rate limits

**Indexer Management**:
```yaml
Indexer Settings:
  - Query Limit: 100/day
  - Grab Limit: 100/day
  - Minimum Seeders: 1
  - Search Priority: 25
  - RSS Sync Interval: 30 min
```

**Resource Recommendations**:
- Network bandwidth: 1-10 Mbps
- Memory: 256-512MB
- CPU: 1 core
- Storage: 100MB-1GB for database

## Indexer Configuration
**Types of Indexers**:
1. **Public**: No authentication (use VPN)
2. **Semi-Private**: Registration required
3. **Private**: Invitation only
4. **Usenet**: NZB indexers

**Cloudflare Protection**:
```yaml
# Use with Byparr
FlareSolverr/Byparr Integration:
  Host: gluetun
  Port: 8191
  Request Timeout: 60000
```

## API Security
**API Key Management**:
```nginx
# Nginx config for API protection
location /api {
    if ($http_x_api_key != "YOUR_API_KEY") {
        return 403;
    }
    proxy_pass http://gluetun:9696;
}
```

## Monitoring and Alerts
**Key Metrics**:
- Indexer response times
- Failed searches
- Rate limit hits
- API usage per app
- Indexer availability
- VPN connection status

**Health Checks**:
- Test each indexer regularly
- Alert on indexer failures
- Monitor search success rate

## Database Management
**SQLite Optimization**:
```sql
-- Regular maintenance
VACUUM;
REINDEX;
ANALYZE;
```

**Backup Strategy**:
- Daily database backups
- Configuration export
- Indexer settings backup

## Integration Examples
**Radarr Configuration**:
```json
{
  "name": "Prowlarr",
  "fields": [
    {
      "name": "baseUrl",
      "value": "http://gluetun:9696"
    },
    {
      "name": "apiKey",
      "value": "YOUR_PROWLARR_API_KEY"
    },
    {
      "name": "syncCategories",
      "value": [2000, 2010, 2020]
    }
  ]
}
```

## Troubleshooting Guide
**Common Issues**:
1. **Indexer timeouts**: Check VPN connection
2. **Cloudflare blocks**: Configure Byparr
3. **API sync failures**: Verify API keys
4. **Search failures**: Check rate limits
5. **Database locks**: Restart container

## Migration Notes
1. Export indexer configurations
2. Set up behind Gluetun VPN
3. Configure Byparr for Cloudflare
4. Import indexer settings
5. Generate new API key
6. Configure all arr app connections
7. Test each indexer through VPN
8. Set up sync profiles
9. Configure search priorities
10. Test full search workflow
11. Monitor indexer performance
12. Document API keys securely