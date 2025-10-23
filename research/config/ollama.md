# Ollama + WebUI Configuration Research

## Service Overview
Ollama is a local LLM runtime that allows you to run large language models locally, paired with Open WebUI (formerly Ollama WebUI) for a ChatGPT-like interface.

## 1. Environment Variables and Purposes

### Ollama Service
```yaml
# Core Configuration
OLLAMA_HOST: "0.0.0.0"                   # Bind address
OLLAMA_PORT: "11434"                      # API port
OLLAMA_MODELS: "/root/.ollama/models"     # Models directory
OLLAMA_KEEP_ALIVE: "5m"                   # Model keep-alive duration

# GPU Configuration
CUDA_VISIBLE_DEVICES: "0"                 # GPU device selection
OLLAMA_NUM_GPU: "1"                       # Number of GPUs to use
OLLAMA_GPU_LAYERS: "35"                   # Layers to offload to GPU

# Performance
OLLAMA_NUM_PARALLEL: "2"                  # Parallel request handling
OLLAMA_MAX_LOADED_MODELS: "2"            # Max models in memory
OLLAMA_PREALLOCATE: "true"               # Preallocate memory
OLLAMA_FLASH_ATTENTION: "true"           # Enable flash attention

# Network
OLLAMA_ORIGINS: "*"                       # CORS origins
OLLAMA_PROXY: ""                          # HTTP proxy
```

### Open WebUI
```yaml
# Core Configuration
WEBUI_PORT: "8080"                        # Web interface port
WEBUI_HOST: "0.0.0.0"                    # Bind address
OLLAMA_API_BASE_URL: "http://ollama:11434/api"  # Ollama API URL

# Authentication
WEBUI_AUTH: "true"                        # Enable authentication
WEBUI_AUTH_TRUSTED_EMAIL_HEADER: ""      # SSO header
ENABLE_SIGNUP: "false"                    # Allow new signups
DEFAULT_USER_ROLE: "user"                 # Default role

# Database
DATABASE_URL: "sqlite:////app/backend/data/webui.db"
# Or PostgreSQL:
# DATABASE_URL: "postgresql://user:pass@postgres/openwebui"

# Features
ENABLE_RAG: "true"                        # Retrieval Augmented Generation
ENABLE_IMAGE_GENERATION: "false"          # Image generation
ENABLE_ADMIN_EXPORT: "true"              # Admin data export
ENABLE_MODEL_FILTER: "true"              # Model filtering
DEFAULT_MODELS: "llama2,mistral"         # Default available models

# Security
JWT_SECRET_KEY: "${JWT_SECRET_KEY}"      # JWT signing key
WEBUI_SECRET_KEY: "${WEBUI_SECRET_KEY}"  # App secret key
SESSION_TIMEOUT: "86400"                  # Session timeout in seconds
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets
secrets:
  ollama_api_key:
    file: ./secrets/ollama/api_key.txt
  webui_jwt_secret:
    file: ./secrets/webui/jwt_secret.txt
  webui_admin_password:
    file: ./secrets/webui/admin_password.txt

# Environment references
environment:
  - OLLAMA_API_KEY_FILE=/run/secrets/ollama_api_key
  - JWT_SECRET_KEY_FILE=/run/secrets/webui_jwt_secret
  - ADMIN_PASSWORD_FILE=/run/secrets/webui_admin_password

# Vault integration for API keys
VAULT_ENABLED: "true"
VAULT_ADDR: "http://vaultwarden:80"
VAULT_PATH: "secret/ollama"
```

## 3. Volume Mounts and Data Persistence

```yaml
# Ollama volumes
volumes:
  # Models storage (can be very large)
  - ./models/ollama:/root/.ollama/models:rw

  # Configuration
  - ./config/ollama:/root/.ollama:rw

  # GPU access
  devices:
    - /dev/dri:/dev/dri

  # For NVIDIA GPUs
  runtime: nvidia
  environment:
    - NVIDIA_VISIBLE_DEVICES=all
    - NVIDIA_DRIVER_CAPABILITIES=compute,utility

# WebUI volumes
volumes:
  # Database and user data
  - ./data/webui:/app/backend/data:rw

  # Static files and uploads
  - ./uploads/webui:/app/backend/static/uploads:rw

  # Custom models config
  - ./config/webui/models.json:/app/backend/data/models.json:rw

  # Logs
  - ./logs/webui:/app/logs:rw
```

## 4. Health Check Configuration

```yaml
# Ollama healthcheck
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:11434/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# WebUI healthcheck
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s

# API endpoints
/api/tags           # List models
/api/generate       # Generate completion
/api/embeddings     # Generate embeddings
/health            # Health status
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/ollama/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup models (can be very large)
echo "Backing up models (this may take a while)..."
rsync -av --progress /root/.ollama/models/ "$BACKUP_DIR/models/"

# Backup WebUI data
tar -czf "$BACKUP_DIR/webui_data.tar.gz" \
  /app/backend/data/ \
  /app/backend/static/uploads/

# Export model list
docker exec ollama ollama list > "$BACKUP_DIR/model_list.txt"

# Backup configurations
cp -r /root/.ollama/*.json "$BACKUP_DIR/config/"

# Restore Script
restore_ollama() {
  RESTORE_FROM="$1"

  # Stop services
  docker-compose down ollama webui

  # Restore models
  rsync -av --progress "$RESTORE_FROM/models/" /root/.ollama/models/

  # Restore WebUI data
  tar -xzf "$RESTORE_FROM/webui_data.tar.gz" -C /

  # Restart services
  docker-compose up -d ollama webui

  # Re-pull any missing models
  while read model; do
    docker exec ollama ollama pull "$model"
  done < "$RESTORE_FROM/model_list.txt"
}
```

## 6. Service Dependencies and Startup Order

```yaml
# Ollama service
ollama:
  depends_on:
    - nvidia-driver  # If using GPU
  restart: unless-stopped

# WebUI service
webui:
  depends_on:
    ollama:
      condition: service_healthy
    postgres:  # If using PostgreSQL
      condition: service_healthy
  links:
    - ollama:ollama

# Startup priority: 6 (after core services)
```

## 7. Resource Limits and Quotas

```yaml
# Ollama (GPU-intensive)
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 16384M  # Depends on model size
    reservations:
      cpus: '2.0'
      memory: 8192M
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]

# WebUI (lighter resource usage)
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1024M
    reservations:
      cpus: '0.5'
      memory: 512M

# Shared memory for model loading
shm_size: '8gb'
```

## 8. Logging Configuration

```yaml
# Ollama logging
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "10"
    labels: "service=ollama"

environment:
  - OLLAMA_DEBUG=false
  - OLLAMA_LOG_LEVEL=info

# WebUI logging
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"
    labels: "service=webui"

# Application logging
LOG_LEVEL: "INFO"
LOG_FORMAT: "json"
LOG_FILE: "/app/logs/webui.log"
```

## 9. Update and Maintenance Strategy

```yaml
# Update strategy
labels:
  - "com.centurylinklabs.watchtower.enable=false"  # Manual updates

# Model update script
update_models: |
  #!/bin/bash
  # Update specific models
  docker exec ollama ollama pull llama2:latest
  docker exec ollama ollama pull mistral:latest
  docker exec ollama ollama pull codellama:latest

  # Remove old versions
  docker exec ollama ollama rm llama2:old

  # List all models
  docker exec ollama ollama list

# Container update procedure
update_containers: |
  # Backup first
  ./backup_ollama.sh

  # Pull new images
  docker pull ollama/ollama:latest
  docker pull ghcr.io/open-webui/open-webui:latest

  # Update containers
  docker-compose down ollama webui
  docker-compose up -d ollama webui

  # Verify services
  curl http://localhost:11434/
  curl http://localhost:8080/health
```

## 10. Configuration File Templates

### Ollama Modelfile
```dockerfile
# Modelfile for custom model
FROM llama2

# Set parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 256
PARAMETER stop "</s>"

# Set system message
SYSTEM """
You are a helpful assistant specialized in DevOps and Docker.
Provide clear, concise, and accurate technical information.
"""

# Add custom prompts
TEMPLATE """
{{ .System }}
User: {{ .Prompt }}
Assistant:
"""
```

### WebUI Configuration
```json
{
  "models": {
    "filter": {
      "enabled": true,
      "list": ["llama2", "mistral", "codellama"]
    },
    "default": "llama2",
    "parameters": {
      "temperature": 0.7,
      "top_p": 0.9,
      "max_tokens": 2048,
      "stream": true
    }
  },
  "ui": {
    "theme": "dark",
    "language": "en",
    "title": "Local AI Assistant",
    "show_model_selector": true
  },
  "features": {
    "rag": {
      "enabled": true,
      "chunk_size": 1000,
      "chunk_overlap": 200
    },
    "web_search": false,
    "image_generation": false,
    "voice": {
      "stt": false,
      "tts": false
    }
  },
  "security": {
    "auth_required": true,
    "registration_enabled": false,
    "api_key_required": true,
    "rate_limiting": {
      "enabled": true,
      "requests_per_minute": 60
    }
  }
}
```

### docker-compose.yml
```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    runtime: nvidia
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
      - OLLAMA_KEEP_ALIVE=5m
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility
    volumes:
      - ./models/ollama:/root/.ollama
      - ./config/ollama:/config
    devices:
      - /dev/dri:/dev/dri
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  webui:
    image: ghcr.io/open-webui/open-webui:latest
    container_name: open-webui
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - OLLAMA_API_BASE_URL=http://ollama:11434/api
      - WEBUI_AUTH=false
      - WEBUI_NAME=Local AI
    volumes:
      - ./data/webui:/app/backend/data
      - ./uploads/webui:/app/backend/static/uploads
    depends_on:
      - ollama
```

## Security Considerations

1. **API Authentication**: Enable API key requirements
2. **Network Isolation**: Run in isolated network
3. **Model Access Control**: Limit model availability
4. **Data Privacy**: All processing is local
5. **Rate Limiting**: Implement request limits
6. **SSL/TLS**: Use reverse proxy for HTTPS

## Integration Points

- **RAG Systems**: Document indexing and retrieval
- **Home Assistant**: Voice assistant integration
- **VS Code**: Code completion via Continue
- **APIs**: REST API for external applications
- **Grafana**: Performance monitoring

## Performance Optimization

1. **GPU Optimization**:
   - Use appropriate GPU layers offloading
   - Enable flash attention for supported models
   - Optimize batch sizes

2. **Memory Management**:
   - Limit concurrent models
   - Set appropriate keep-alive times
   - Use model quantization (4-bit, 8-bit)

3. **Caching**:
   - Enable prompt caching
   - Implement response caching for common queries

## Troubleshooting Guide

Common issues:
- **GPU not detected**: Check NVIDIA driver and runtime
- **Out of memory**: Reduce model size or use quantization
- **Slow inference**: Increase GPU layers, check CPU bottleneck
- **Model download fails**: Check disk space and network
- **WebUI connection error**: Verify Ollama API URL and CORS settings