#!/bin/bash

# PSU Bill Deployment Script
set -e

# Load SSH credentials from .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -E '^(SSH_USER|SSH_HOST|SSH_PORT)=' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Configuration
REMOTE_USER="${SSH_USER}"
REMOTE_HOST="${SSH_HOST}"
REMOTE_PORT="${SSH_PORT:-22}"
APP_DIR="/var/www/psu-bill"
SERVICE_NAME="web-bill.service"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== PSU Bill Deployment ===${NC}\n"

# Build locally
echo -e "${YELLOW}Building application...${NC}"
npm install
node node_modules/prisma/build/index.js generate
npm run build
echo -e "${GREEN}✓ Build completed${NC}\n"

# Upload files
echo -e "${YELLOW}Uploading to server...${NC}"
tar -czf .next.tar.gz .next/
tar -czf prisma.tar.gz prisma/
tar -czf public.tar.gz public/
scp -P $REMOTE_PORT .next.tar.gz prisma.tar.gz public.tar.gz package*.json $REMOTE_USER@$REMOTE_HOST:$APP_DIR/
rm .next.tar.gz prisma.tar.gz public.tar.gz

# Deploy on server
echo -e "${GREEN}✓ Files uploaded${NC}\n"
echo -e "${YELLOW}Deploying on server...${NC}"
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << 'EOF'
    cd /var/www/psu-bill

    # Extract files
    tar -xzf .next.tar.gz && rm .next.tar.gz
    tar -xzf prisma.tar.gz && rm prisma.tar.gz
    tar -xzf public.tar.gz && rm public.tar.gz

    # Fix permissions and install
    sudo chown -R www-data:www-data /var/www/.npm 2>/dev/null || true
    npm install --production
    npm install --save-dev typescript
    npx prisma generate

    # Restart service
    sudo systemctl restart web-bill.service
    sleep 2
    sudo systemctl status web-bill.service --no-pager -l
EOF

echo -e "\n${GREEN}=== Deployment completed ===${NC}"
