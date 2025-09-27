# 🚀 Backend Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] Environment variables configured (`.env.production`)
- [x] MongoDB connection string updated
- [x] PM2 ecosystem configuration created
- [x] Nginx configuration template ready
- [x] Deployment script created (`deploy.sh`)
- [x] Local testing completed
- [x] Dependencies verified
- [x] ENS routes handled gracefully
- [x] MongoDB deprecation warnings fixed
- [x] CORS configured for frontend domain
- [x] Git ignore file created

## 🚀 Deployment Steps

### 1. Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Clone Repository
```bash
git clone https://github.com/your-username/upal.git
cd upal/server
```

### 3. Run Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Configure Nginx
```bash
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/upal-api
sudo ln -s /etc/nginx/sites-available/upal-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configure DNS
In your domain registrar:
- Add A Record: `api` → Your EC2 Public IP

### 6. Configure Security Groups
In AWS Console:
- Add Custom TCP Rule: Port 3001, Source: 0.0.0.0/0
- Add HTTP Rule: Port 80, Source: 0.0.0.0/0

## 🧪 Testing Commands

```bash
# Health check
curl http://api.upal.rizzmo.site/api/health

# Send OTP test
curl -X POST http://api.upal.rizzmo.site/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"5555555555","name":"Test","password":"test123"}'

# Check PM2 status
pm2 status

# View logs
pm2 logs upal-backend
```

## 📊 Monitoring

- PM2 Dashboard: `pm2 monit`
- Error Logs: `tail -f logs/err.log`
- Nginx Logs: `sudo tail -f /var/log/nginx/error.log`

## 🔧 Troubleshooting

- Port conflicts: Check with `sudo lsof -i :3001`
- MongoDB connection: Verify MONGO_URI in `.env`
- DNS issues: Use EC2 public IP temporarily
- CORS errors: Check frontend domain in CORS config

Your backend is now ready for deployment! 🎉