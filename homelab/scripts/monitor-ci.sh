#!/bin/bash
# CI/CD Homelab Monitoring Script
# This script is executed by the GitHub Actions runner to monitor homelab services

set -uo pipefail

# Get script directory and source common utilities
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common-utils.sh"

# Configuration from environment variables
DEPLOY_PATH="${HOMELAB_PATH:-$HOME/homelab}"
DEPLOY_PATH="${DEPLOY_PATH/#\~/$HOME}"  # Expand tilde
VERBOSE="${VERBOSE:-false}"
FAILED_SERVICES=""
ALL_HEALTHY=true
ALERT_THRESHOLD="${ALERT_THRESHOLD:-3}"
HEALTH_HISTORY_DIR="/tmp/health_history"

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

# Parse and output health check results for GitHub Actions
output_health_results() {
    # Parse results
    source /tmp/health_status || true

    # Output for GitHub Actions
    echo "status=${status:-unknown}" >> $GITHUB_OUTPUT
    echo "failed_services=${failed_services:-unknown}" >> $GITHUB_OUTPUT

    # Clean up
    rm -f /tmp/health_status

    # Exit with appropriate code and user-friendly message
    if [ "${status:-unknown}" = "success" ]; then
        echo "✅ All health checks passed"
        exit 0
    elif [ "${status:-unknown}" = "warning" ]; then
        echo "⚠️ Health checks passed with warnings"
        exit 0
    else
        echo "❌ Health checks failed"
        exit 1
    fi
}

# Update health check history
update_health_history() {
    local status="$1"
    local failed_services="$2"

    mkdir -p "$HEALTH_HISTORY_DIR"

    # Append to history
    echo "$(date -Iseconds),${status},${failed_services}" >> "$HEALTH_HISTORY_DIR/history.csv"

    # Keep only last 100 entries
    tail -n 100 "$HEALTH_HISTORY_DIR/history.csv" > "$HEALTH_HISTORY_DIR/history.tmp"
    mv "$HEALTH_HISTORY_DIR/history.tmp" "$HEALTH_HISTORY_DIR/history.csv"

    # Count consecutive failures
    CONSECUTIVE_FAILURES=$(tail -n "$ALERT_THRESHOLD" "$HEALTH_HISTORY_DIR/history.csv" | grep -c "failure" || true)

    # Output for GitHub Actions
    if [ -n "${GITHUB_ENV:-}" ]; then
        echo "consecutive_failures=$CONSECUTIVE_FAILURES" >> "$GITHUB_ENV"
    fi

    log "Consecutive failures: $CONSECUTIVE_FAILURES"
}

# Send alert notification via GitHub API
send_alert() {
    local failed_services="$1"

    if [ -z "${GITHUB_REPOSITORY:-}" ]; then
        warning "Not running in GitHub Actions, skipping alert"
        return 0
    fi

    # This outputs JSON that can be consumed by github-script
    cat > /tmp/alert_data.json << EOF
{
  "failed_services": "${failed_services}",
  "timestamp": "$(date -Iseconds)",
  "consecutive_failures": "${CONSECUTIVE_FAILURES:-0}"
}
EOF

    log "Alert data prepared: /tmp/alert_data.json"
}

# Close alert notification via GitHub API
close_alert() {
    if [ -z "${GITHUB_REPOSITORY:-}" ]; then
        warning "Not running in GitHub Actions, skipping alert closure"
        return 0
    fi

    # Signal that alerts should be closed
    echo "close_alerts=true" > /tmp/close_alerts_flag
    log "Alert closure flag set"
}

# Main function
main() {
    check_container_runtime

    # Determine mode from first argument
    MODE="${1:-health-check}"

    case "$MODE" in
        health-check)
            perform_health_check
            # If running in CI (GitHub Actions), output results
            if [ -n "${GITHUB_OUTPUT:-}" ]; then
                output_health_results
            fi
            ;;
        metrics)
            collect_metrics
            ;;
        update-history)
            # Usage: monitor-ci.sh update-history <status> <failed_services>
            update_health_history "${2:-unknown}" "${3:-}"
            ;;
        send-alert)
            # Usage: monitor-ci.sh send-alert <failed_services>
            send_alert "${2:-}"
            ;;
        close-alert)
            close_alert
            ;;
        *)
            error "Unknown mode: $MODE"
            echo "Usage: $0 [health-check|metrics|update-history|send-alert|close-alert]"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"