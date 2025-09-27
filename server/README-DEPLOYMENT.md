# Upal Backend Deployment Guide

## 🚀 Quick Deployment

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Clone Repository
```bash
git clone https://github.com/your-username/upal.git
cd upal/server
```

### Step 3: Run Deployment Script
```bash
./deploy.sh
```

### Step 4: Configure Nginx
```bash
# Install Nginx
sudo apt install nginx

# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/upal-api

# Enable site
sudo ln -s /etc/nginx/sites-available/upal-api /etc/nginx/sites-enabled/

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Configure Security Group
In AWS Console, add these inbound rules:
- Custom TCP, Port 3001, Source: 0.0.0.0/0
- HTTP, Port 80, Source: 0.0.0.0/0

## 🧪 Testing

### Health Check
```bash
curl http://your-ec2-ip/api/health
curl http://api.upal.rizzmo.site/api/health
```

### API Endpoints
```bash
# Send OTP
curl -X POST http://api.upal.rizzmo.site/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","name":"Test","password":"test123"}'

# Check available routes
curl http://api.upal.rizzmo.site/nonexistent
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status                 # Check status
pm2 logs upal-backend      # View logs
pm2 restart upal-backend   # Restart app
pm2 monit                  # Real-time monitoring
```

### Log Files
- Error logs: `./logs/err.log`
- Output logs: `./logs/out.log`
- Combined logs: `./logs/combined.log`

## 🛠 Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in .env
2. **MongoDB connection**: Check MONGO_URI in .env
3. **DNS not resolving**: Wait for propagation or use IP

### Debug Commands
```bash
# Check what's running on port 3001
sudo lsof -i :3001

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check PM2 processes
pm2 list
```

## 📝 Environment Variables

Required in `.env`:
- `NODE_ENV=production`
- `PORT=3001`
- `MONGO_URI=mongodb://...`
- `JWT_SECRET=your-secret`
- `NAMESPACE_API_KEY=your-key`