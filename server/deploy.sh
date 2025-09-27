#!/bin/bash

# Deployment script for EC2
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Create logs directory
mkdir -p logs

# Copy production environment
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo -e "${GREEN}Production environment configured${NC}"
else
    echo -e "${RED}Warning: .env.production not found${NC}"
fi

# Start application with PM2
echo -e "${YELLOW}Starting application...${NC}"
pm2 start ecosystem.config.js --env production

# Setup PM2 startup
pm2 startup
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}Check status with: pm2 status${NC}"
echo -e "${GREEN}View logs with: pm2 logs upal-backend${NC}"