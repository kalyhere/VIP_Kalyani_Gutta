#!/bin/bash

echo "🚀 Starting AIMMS Backend Services..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker not found! Make sure you're in a Codespace or have Docker installed."
    exit 1
fi

print_success "Docker is available"

# Start PostgreSQL container
print_status "Starting PostgreSQL container..."
if docker ps | grep -q postgres-dev; then
    print_success "PostgreSQL already running"
else
    # Stop any existing container first
    docker stop postgres-dev 2>/dev/null || true
    docker rm postgres-dev 2>/dev/null || true
    
    # Start new container
    docker run -d \
        --name postgres-dev \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=aimms_web \
        -p 5432:5432 \
        postgres:15-alpine
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to start..."
    for i in {1..30}; do
        if docker exec postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    print_success "PostgreSQL is ready"
fi

# Microsoft PostgreSQL extension handles database UI - no additional containers needed

# Show status
echo ""
echo "🎉 Services Status:"
echo "📱 API Server: Run 'make run' to start FastAPI"
echo "🗄️ PostgreSQL: Running on port 5432"
echo "💻 Database UI: Microsoft PostgreSQL extension"
echo ""
echo "🔑 Test Login Credentials:"
echo "   Admin:    admin    / password"
echo "   Faculty:  faculty  / password"
echo "   Student:  student  / password"
echo ""
echo "🔗 Database Connection (in PostgreSQL extension):"
echo "   Host: localhost"
echo "   Username: postgres"
echo "   Password: postgres"
echo "   Database: aimms_web"
echo "   Port: 5432"
echo ""

# Test connections
print_status "Testing connections..."

if docker exec postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL connection: OK"
else
    print_error "PostgreSQL connection: FAILED"
fi

# Microsoft PostgreSQL extension will handle database UI - no additional tests needed

print_success "Setup complete! 🚀" 