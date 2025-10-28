#!/bin/bash
# Script to restart Traefik container with fixed SSL configuration

set -e

echo "=== Restarting Traefik with Fixed SSL Configuration ==="
echo

# Change to the homelab directory
cd "$(dirname "$0")"

# Validate docker-compose file
echo "Validating docker-compose configuration..."
docker compose config > /dev/null 2>&1 || {
    echo "Error: Invalid docker-compose configuration"
    exit 1
}

# Stop and remove Traefik container
echo "Stopping Traefik container..."
docker compose stop traefik
docker compose rm -f traefik

# Clear any cached configurations
echo "Clearing Traefik cache..."
rm -f ./traefik/logs/*.log 2>/dev/null || true

# Start Traefik container with new configuration
echo "Starting Traefik with updated configuration..."
docker compose up -d traefik

# Wait for container to be healthy
echo "Waiting for Traefik to become healthy..."
for i in {1..30}; do
    if docker compose ps traefik | grep -q "healthy"; then
        echo "✓ Traefik is now healthy!"
        break
    elif [ $i -eq 30 ]; then
        echo "⚠️  Traefik health check timeout. Checking logs..."
        docker compose logs traefik --tail 20
        exit 1
    fi
    echo -n "."
    sleep 2
done

echo
echo "=== Traefik Successfully Restarted ==="
echo

# Show container status
docker compose ps traefik

echo
echo "Configuration changes applied:"
echo "- Enabled built-in healthcheck ping endpoint"
echo "- Using Traefik's native healthcheck command"
echo "- Set insecureSkipVerify=true for internal SSL connections"
echo
echo "To view logs: docker compose logs traefik -f"