#!/bin/bash
# CI/CD Homelab Monitoring Script
# This script is executed by the GitHub Actions runner to monitor homelab services

set -uo pipefail

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LIB_DIR="$SCRIPT_DIR/../lib"

# Source homelab libraries
source "$LIB_DIR/colors.sh"
source "$LIB_DIR/logging.sh"
source "$LIB_DIR/docker.sh"

# Configuration from environment variables
DEPLOY_PATH="${HOMELAB_PATH/#\~/$HOME}"
VERBOSE="${VERBOSE:-false}"
FAILED_SERVICES=""
ALL_HEALTHY=true

# Health check function
perform_health_check() {
    log "Starting health check at $DEPLOY_PATH"

    # Navigate to deployment directory
    cd "$DEPLOY_PATH" 2>/dev/null || {
        error "Cannot access deployment directory: $DEPLOY_PATH"
        echo "status=failure" >> /tmp/health_status
        echo "failed_services=deployment_directory" >> /tmp/health_status
        exit 1
    }

    # Check if docker-compose file exists
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found"
        echo "status=failure" >> /tmp/health_status
        echo "failed_services=docker_compose_missing" >> /tmp/health_status
        exit 1
    fi

    # Check Docker daemon
    log "Checking Docker daemon"
    if ! docker info &>/dev/null; then
        error "Docker daemon is not running"
        echo "status=failure" >> /tmp/health_status
        echo "failed_services=docker_daemon" >> /tmp/health_status
        exit 1
    fi

    # Get list of all services
    SERVICES=$(compose_ps --services 2>/dev/null)

    if [ -z "$SERVICES" ]; then
        warning "No services found"
        echo "status=warning" >> /tmp/health_status
        echo "failed_services=no_services" >> /tmp/health_status
        exit 0
    fi

    log "Checking services: $(echo $SERVICES | tr '\n' ' ')"

    # Check each service
    for service in $SERVICES; do
        if [ "$VERBOSE" = "true" ]; then
            log "Checking service: $service"
        fi

        # Get container status
        CONTAINER_ID=$(compose_ps -q "$service" 2>/dev/null)

        if [ -z "$CONTAINER_ID" ]; then
            error "Service $service has no container"
            FAILED_SERVICES="$FAILED_SERVICES $service(no_container)"
            ALL_HEALTHY=false
            continue
        fi

        # Check if container is running
        STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_ID" 2>/dev/null)

        if [ "$STATUS" != "running" ]; then
            error "Service $service is not running (status: $STATUS)"
            FAILED_SERVICES="$FAILED_SERVICES $service($STATUS)"
            ALL_HEALTHY=false
            continue
        fi

        # Check container health if defined
        HEALTH_STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null)

        if [ -n "$HEALTH_STATUS" ] && [ "$HEALTH_STATUS" != "null" ]; then
            if [ "$HEALTH_STATUS" != "healthy" ]; then
                warning "Service $service health: $HEALTH_STATUS"
                if [ "$HEALTH_STATUS" = "unhealthy" ]; then
                    FAILED_SERVICES="$FAILED_SERVICES $service(unhealthy)"
                    ALL_HEALTHY=false
                fi
            else
                if [ "$VERBOSE" = "true" ]; then
                    log "Service $service is healthy"
                fi
            fi
        else
            if [ "$VERBOSE" = "true" ]; then
                log "Service $service is running (no healthcheck defined)"
            fi
        fi

        # Check restart count (high restart count indicates issues)
        RESTART_COUNT=$(docker inspect -f '{{.RestartCount}}' "$CONTAINER_ID" 2>/dev/null)
        if [ "$RESTART_COUNT" -gt 5 ]; then
            warning "Service $service has high restart count: $RESTART_COUNT"
        fi
    done

    # Check disk space
    log "Checking disk space"
    DISK_USAGE=$(df "$DEPLOY_PATH" | awk 'NR==2 {print int($5)}')
    if [ "$DISK_USAGE" -gt 90 ]; then
        error "Disk usage critical: ${DISK_USAGE}%"
        FAILED_SERVICES="$FAILED_SERVICES disk_space(${DISK_USAGE}%)"
        ALL_HEALTHY=false
    elif [ "$DISK_USAGE" -gt 80 ]; then
        warning "Disk usage high: ${DISK_USAGE}%"
    fi

    # Check memory usage
    log "Checking memory usage"
    MEMORY_USAGE=$(free | awk 'NR==2 {print int($3/$2 * 100)}')
    if [ "$MEMORY_USAGE" -gt 90 ]; then
        warning "Memory usage high: ${MEMORY_USAGE}%"
    fi

    # Write results
    if [ "$ALL_HEALTHY" = true ]; then
        echo "status=success" >> /tmp/health_status
        echo "failed_services=" >> /tmp/health_status
        log "All services are healthy!"
    else
        echo "status=failure" >> /tmp/health_status
        echo "failed_services=${FAILED_SERVICES# }" >> /tmp/health_status
        echo "Failed services:${FAILED_SERVICES}"
    fi
}

# Metrics collection function
collect_metrics() {
    log "Collecting performance metrics"

    cd "$DEPLOY_PATH" 2>/dev/null || exit 1

    echo "=== System Metrics ==="
    echo "Timestamp: $(date -Iseconds)"

    echo -e "\n--- CPU Usage ---"
    top -bn1 | head -5

    echo -e "\n--- Memory Usage ---"
    free -h

    echo -e "\n--- Disk Usage ---"
    df -h "$DEPLOY_PATH"

    echo -e "\n--- Docker Statistics ---"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

    echo -e "\n--- Container Status ---"
    compose_ps

    echo -e "\n--- Network Connections ---"
    netstat -tuln | grep LISTEN | head -20
}

# Main function
main() {
    check_container_runtime
    check_compose

    # Determine mode from first argument
    MODE="${1:-health-check}"

    case "$MODE" in
        health-check)
            perform_health_check
            ;;
        metrics)
            collect_metrics
            ;;
        *)
            error "Unknown mode: $MODE"
            echo "Usage: $0 [health-check|metrics]"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
