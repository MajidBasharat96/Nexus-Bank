#!/bin/bash
# NexusBank - Quick Start Script
# Runs full stack with Docker Compose

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     NexusBank Core Banking System         ║${NC}"
echo -e "${CYAN}║     Enterprise v1.0 - Quick Start         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check requirements
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required. Install from https://docker.com${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required.${NC}"; exit 1; }

echo -e "${YELLOW}► Setting up environment...${NC}"

# Copy env files if not exist
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo -e "${GREEN}✓ Created backend/.env (review and update secrets!)${NC}"
fi

# Update .env with docker compose values
sed -i.bak 's/DB_HOST=localhost/DB_HOST=postgres/' backend/.env 2>/dev/null || true
sed -i.bak 's/DB_USER=postgres/DB_USER=nexusbank_user/' backend/.env 2>/dev/null || true
sed -i.bak 's/DB_PASSWORD=password/DB_PASSWORD=NexusBank@Secure2024/' backend/.env 2>/dev/null || true
sed -i.bak 's/REDIS_PASSWORD=/REDIS_PASSWORD=NexusRedis@2024/' backend/.env 2>/dev/null || true
rm -f backend/.env.bak

echo -e "${YELLOW}► Building and starting services...${NC}"
echo ""

# Start services
docker compose up -d --build

echo ""
echo -e "${YELLOW}► Waiting for services to be ready...${NC}"
sleep 15

# Health check
MAX_TRIES=30
TRIES=0
while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
    break
  fi
  TRIES=$((TRIES+1))
  echo "  Waiting... ($TRIES/$MAX_TRIES)"
  sleep 3
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 NexusBank is LIVE!                            ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:  http://localhost:80                   ║${NC}"
echo -e "${GREEN}║  Backend:   http://localhost:3000                 ║${NC}"
echo -e "${GREEN}║  API Docs:  http://localhost:3000/api/docs        ║${NC}"
echo -e "${GREEN}║  Health:    http://localhost:3000/health          ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Default Login:                                   ║${NC}"
echo -e "${GREEN}║  Username:  admin                                 ║${NC}"
echo -e "${GREEN}║  Password:  Admin@NexusBank123                    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Logs: docker compose logs -f backend${NC}"
echo -e "${YELLOW}Stop: docker compose down${NC}"
echo ""
