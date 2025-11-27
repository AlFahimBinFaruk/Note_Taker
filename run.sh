#!/bin/bash

# Script to start all Docker containers in services directory
# Usage: ./run.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$SCRIPT_DIR/services"

# Get command argument (default to 'up' if not provided)
COMMAND=${1:-up}

CURRENT_CONTEXT=$(docker context ls | grep '*' | awk '{print $1}')
echo "🐳 Using Docker context: $CURRENT_CONTEXT"

echo "🚀 Starting all services..."
echo "================================"

# Define service order (infrastructure first, then dependent services)
SERVICES=(
    "rabbitmq"
    "monitoring"
    "user-management"
    "note-management"
    "request-tracker"
    "service-discovery"
)

# Function to start a service
start_service() {
    local service=$1
    local service_path="$SERVICES_DIR/$service"
    
    if [ ! -f "$service_path/docker-compose.yml" ]; then
        echo "⚠️  Skipping $service: docker-compose.yml not found"
        return
    fi
    
    echo ""
    echo "📦 Starting $service..."
    cd "$service_path"
    
    if docker compose up -d --build; then
        echo "✅ $service started successfully"
    else
        echo "❌ Failed to start $service"
        return 1
    fi
}


# Function to stop a service
stop_service() {
    local service=$1
    local service_path="$SERVICES_DIR/$service"
    
    if [ ! -f "$service_path/docker-compose.yml" ]; then
        echo "⚠️  Skipping $service: docker-compose.yml not found"
        return
    fi
    
    echo ""
    echo "🛑 Stopping $service..."
    cd "$service_path"
    
    if docker compose down; then
        echo "✅ $service stopped successfully"
    else
        echo "❌ Failed to stop $service"
        return 1
    fi
}

# Execute based on command
case "$COMMAND" in
    up)
        echo "🚀 Starting all services..."
        echo "================================"
        for service in "${SERVICES[@]}"; do
            start_service "$service" || echo "⚠️  Continuing with other services..."
        done
        echo ""
        echo "================================"
        echo "✨ All services started!"
        ;;
    down)
        echo "🛑 Stopping all services..."
        echo "================================"
        # Reverse order for shutdown (dependent services first)
        for ((idx=${#SERVICES[@]}-1 ; idx>=0 ; idx--)); do
            stop_service "${SERVICES[idx]}" || echo "⚠️  Continuing with other services..."
        done
        echo ""
        echo "================================"
        echo "✨ All services stopped!"
        ;;
    *)
        echo "❌ Invalid command: $COMMAND"
        echo "Usage: ./run.sh [up|down]"
        exit 1
        ;;
esac