# Byparr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Network Mode**: service:gluetun (shares Gluetun's network)
- **No Direct IP**: Uses Gluetun's IP (172.21.0.2)
- **No Port Mappings**: Internal service only
- **VPN Protection**: All traffic through Gluetun
- **Purpose**: Cloudflare bypass for Prowlarr

## 2. Optimal Network Placement
**Recommended Zone**: Download VLAN (through VPN)
- Must remain behind Gluetun VPN
- No direct external access needed
- Works as middleware for Prowlarr
- Handles Cloudflare challenges

## 3. Reverse Proxy Requirements
**Not Applicable**:
- Internal service only
- No web interface
- Accessed only by Prowlarr
- API-only service

## 4. Security Considerations for External Exposure
**Security Requirements**:
- **Never expose to internet**
- Runs behind VPN only
- No authentication (relies on network isolation)
- Only accessible from Prowlarr
- Minimal attack surface

## 5. Port Management and Conflicts
**Ports Used**:
- 8191/tcp: API endpoint (internal)
- Accessed through Gluetun network

**No port conflicts** - Internal service

## 6. DNS and Service Discovery
**DNS Configuration**:
- No DNS requirements
- Prowlarr connects via container name
- Resolution handled by Docker

## 7. VLAN Segmentation Recommendations
**Network Isolation**:
- Inherits Gluetun's placement
- No direct VLAN assignment
- Isolated in download network

## 8. Firewall Rules Required
**No Direct Rules**:
- Traffic controlled by Gluetun
- Internal container communication only
- No external access required

## 9. Inter-Service Communication Requirements
**Service Integration**:
- **Prowlarr**: Primary consumer
- **Gluetun**: Network provider

**Integration Flow**:
1. Prowlarr encounters Cloudflare
2. Sends request to Byparr
3. Byparr solves challenge
4. Returns cookies/tokens
5. Prowlarr retries with solution

## 10. Performance Optimization
**Configuration**:
```yaml
Environment:
  - LOG_LEVEL=info
  - SOLVER_TIMEOUT=60
  - MAX_CONCURRENT=5
  - CACHE_DURATION=3600
```

**Resource Recommendations**:
- Memory: 256-512MB
- CPU: 1 core
- Network: Minimal
- Storage: <100MB

## Solution Caching
**Cache Management**:
- Cache Cloudflare tokens
- Reduce solve requests
- Improve response time
- Lower resource usage

## Browser Engine
**Headless Browser**:
- Chromium-based
- JavaScript execution
- Cookie handling
- Challenge solving

## Integration Configuration
**Prowlarr Settings**:
```yaml
FlareSolverr/Byparr:
  - Host: gluetun
  - Port: 8191
  - Timeout: 60000ms
  - Max Timeout: 120000ms
```

## Monitoring Points
- Challenge solve rate
- Response times
- Memory usage
- Failed attempts
- Cache hit rate

## Troubleshooting
**Common Issues**:
1. **High memory usage**: Browser instances
2. **Slow responses**: Complex challenges
3. **Failures**: Cloudflare updates
4. **Timeouts**: Increase solver timeout

## Resource Management
**Browser Lifecycle**:
- Create on demand
- Reuse when possible
- Cleanup after timeout
- Memory limits enforced

## Update Strategy
- Regular image updates
- Monitor for solver updates
- Test with Prowlarr
- Cloudflare changes adaptation

## Alternative Solutions
**If Byparr fails**:
- FlareSolverr (older alternative)
- Manual cookie import
- Different indexers
- Proxy rotation

## Migration Notes
1. Deploy with Gluetun
2. No configuration needed
3. Update Prowlarr settings
4. Test with CF-protected site
5. Monitor solve success
6. Adjust timeouts if needed
7. Check memory usage
8. Document in Prowlarr