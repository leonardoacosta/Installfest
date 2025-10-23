# Ollama + WebUI - Networking Analysis

## 1. Current Network Configuration Analysis
### Ollama (LLM Server)
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.11 (static)
- **Port Mappings**: 11434:11434 (API)
- **Environment**: OLLAMA_ORIGINS=* (security concern)
- **Health Check**: Configured

### Open-WebUI
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.12 (static)
- **Port Mappings**: 8081:8080 (Web Interface)
- **Dependency**: Ollama service (with health check)

## 2. Optimal Network Placement
**Recommended Zone**: Internal Services VLAN (Trusted)
- Should be on internal compute VLAN (e.g., VLAN 50)
- CPU/GPU intensive - consider placement near compute resources
- Should NOT be exposed externally without authentication
- WebUI can be in DMZ if needed for external access

## 3. Reverse Proxy Requirements
**Configuration**:
### Ollama API
- Internal only: `http://ollama.local:11434`
- Not recommended for external exposure

### Open-WebUI
- Primary URL: `https://ai.domain.com`
- Internal URL: `https://ollama-ui.local`
- WebSocket Support: REQUIRED
- Headers Required:
  ```
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  Upgrade (for WebSocket)
  Connection (for WebSocket)
  Content-Type
  ```
- Large body size limit needed (for model uploads)
- Timeout adjustments for long-running queries

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- Change OLLAMA_ORIGINS from * to specific origins
- Implement strong authentication on WebUI
- Rate limiting on API endpoints (prevent abuse)
- Token-based authentication for API
- Monitor for resource exhaustion attacks
- Implement request size limits
- Log all model queries for audit
- Consider VPN-only access for sensitive deployments
- Sanitize user inputs to prevent prompt injection

## 5. Port Management and Conflicts
**Required Ports**:
### Ollama
- 11434/tcp: API endpoint (unique, no conflicts)

### Open-WebUI
- 8080/tcp: Web interface (internal)
- Can be remapped to avoid conflicts

**Potential Conflicts**:
- Port 8080 commonly used (qBittorrent in this setup)
- Solution: Already remapped to 8081

## 6. DNS and Service Discovery
**DNS Requirements**:
- Local DNS entries:
  - `ollama.local` → 172.20.0.11
  - `ollama-ui.local` → 172.20.0.12
- Service discovery not required
- API endpoint discovery through configuration

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 50 (Compute)**: Ollama server placement
- **VLAN 20 (Users)**: WebUI access
- **VLAN 10 (Management)**: Admin access

**Inter-VLAN Rules**:
- WebUI → Ollama API: Allow (port 11434)
- Users → WebUI: Allow (port 8081)
- Ollama → Internet: Allow (for model downloads)
- External → Ollama API: Deny

## 8. Firewall Rules Required
**Inbound Rules**:
```
# WebUI from Users VLAN
Allow TCP 8081 from 192.168.20.0/24 to Open-WebUI

# API access from WebUI only
Allow TCP 11434 from Open-WebUI to Ollama

# Block direct API access from other sources
Deny TCP 11434 from Any to Ollama

# Admin access from Management
Allow TCP 8081 from 192.168.10.0/24 to Open-WebUI
```

**Outbound Rules**:
```
# Model downloads from Ollama
Allow TCP 443 from Ollama to Any

# WebUI to Ollama API
Allow TCP 11434 from Open-WebUI to Ollama

# DNS
Allow UDP 53 from Both to DNS_Server
```

## 9. Inter-Service Communication Requirements
**Direct Communication Needs**:
- **Open-WebUI → Ollama**: API calls (port 11434)
- **Home Assistant**: Potential integration for AI assistant
- **Monitoring**: Metrics export to Prometheus
- **Storage**: Access to model storage volume

**Resource Sharing**:
- GPU passthrough if available
- Shared model storage volume
- Memory and CPU resource coordination

## 10. Performance Optimization
**Network Optimizations**:
- Keep Ollama and WebUI on same network segment
- Minimize latency between components
- Implement response caching where appropriate
- Use HTTP/2 for API communications
- Enable compression for API responses
- Implement connection pooling

**Resource Recommendations**:
### Ollama Server
- Network bandwidth: 10-100 Mbps (model downloads)
- API latency: <100ms local
- Concurrent requests: 1-5 (CPU limited)
- Memory: 8-32GB depending on models
- Storage: 10-100GB for models
- CPU: 4-8 cores minimum
- GPU: Recommended for large models

### Open-WebUI
- Network bandwidth: 1-10 Mbps
- Concurrent users: 5-20
- Memory: 512MB-1GB
- CPU: 1-2 cores

## GPU Considerations
**If using GPU acceleration**:
- Ensure proper device passthrough
- Monitor GPU memory usage
- Implement request queuing
- Consider model quantization for efficiency

## Monitoring Requirements
- API response times
- Model loading times
- Queue depth
- Resource utilization (CPU/GPU/Memory)
- Failed requests
- Token usage per user

## Migration Notes
1. Secure Ollama API (remove OLLAMA_ORIGINS=*)
2. Implement authentication on WebUI
3. Move to compute VLAN for better resource access
4. Configure reverse proxy with proper timeouts
5. Set up monitoring for resource usage
6. Implement rate limiting
7. Document available models
8. Set up automated model updates
9. Configure backup for user data
10. Test GPU acceleration if available