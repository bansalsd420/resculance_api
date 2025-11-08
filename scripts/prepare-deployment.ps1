# Resculance Production Deployment Preparation Script (PowerShell)
# This script creates a production-ready ZIP package for deployment

Write-Host "🚀 Preparing Resculance for Production Deployment..." -ForegroundColor Green

# Set variables
$ProjectName = "resculance"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ZipName = "${ProjectName}_deploy_${Timestamp}.zip"
$TargetDir = "D:\PROJECTS"
$TempDir = "resculance_temp"

# Create temporary directory
Write-Host "📁 Creating temporary build directory..." -ForegroundColor Cyan
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy backend files (excluding node_modules)
Write-Host "📦 Copying backend files..." -ForegroundColor Cyan
$BackendExclude = @('node_modules', '.env', '*.log', '.git', 'dist')
Copy-Item -Path "src" -Destination "$TempDir\src" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$TempDir\" -Force
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination "$TempDir\" -Force
}

# Copy frontend files (excluding node_modules)
Write-Host "📦 Copying frontend files..." -ForegroundColor Cyan
Copy-Item -Path "frontend" -Destination "$TempDir\frontend" -Recurse -Force -Exclude $BackendExclude

# Copy configuration files
Write-Host "📝 Copying configuration files..." -ForegroundColor Cyan
if (Test-Path ".env.example") {
    Copy-Item -Path ".env.example" -Destination "$TempDir\" -Force
}
Copy-Item -Path "README.md" -Destination "$TempDir\" -Force
if (Test-Path "scripts") {
    Copy-Item -Path "scripts" -Destination "$TempDir\scripts" -Recurse -Force
}

# Create deployment README
$DeploymentMD = @"
# Resculance Deployment Guide

## Prerequisites
- Node.js >= 16.0.0
- MySQL >= 8.0
- PM2 (for production process management)

## Installation Steps

### 1. Backend Setup
``````bash
cd /path/to/resculance

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Run database migrations
npm run migrate

# Seed initial data (creates superadmin user)
npm run seed
``````

### 2. Frontend Setup
``````bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in frontend/dist/
``````

### 3. aaPanel Configuration

#### Backend (Node.js)
1. In aaPanel, go to "Website" → "Node Project"
2. Click "Add Node Project"
3. Configure:
   - Project Path: ``/www/wwwroot/resculance.gapsheight.com``
   - Startup File: ``src/server.js``
   - Port: 5001 (or your preferred port)
   - Domain: ``resculance.gapsheight.com``
   - Node Version: 16.x or higher

4. Set environment variables in aaPanel:
   - ``NODE_ENV=production``
   - ``PORT=5001``
   - ``DB_HOST=localhost``
   - ``DB_USER=your_db_user``
   - ``DB_PASSWORD=your_db_password``
   - ``DB_NAME=resculance_db``
   - ``JWT_SECRET=your_secure_jwt_secret``

#### Frontend (Static Files)
1. Upload ``frontend/dist/`` contents to ``/www/wwwroot/resculance.gapsheight.com/public``
2. Configure Nginx reverse proxy in aaPanel:

``````nginx
location / {
    try_files `$uri `$uri/ /index.html;
}

location /api {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade `$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host `$host;
    proxy_cache_bypass `$http_upgrade;
    proxy_set_header X-Real-IP `$remote_addr;
    proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
}

location /socket.io {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade `$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host `$host;
    proxy_cache_bypass `$http_upgrade;
}
``````

### 4. SSL Certificate
1. In aaPanel, go to your website settings
2. Click "SSL" tab
3. Use Let's Encrypt to generate a free SSL certificate
4. Enable "Force HTTPS"

### 5. Database Setup
``````bash
# Create database
mysql -u root -p
CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'resculance_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON resculance_db.* TO 'resculance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
``````

### 6. Start Application
``````bash
# Using PM2 (recommended)
cd /www/wwwroot/resculance.gapsheight.com
pm2 start src/server.js --name resculance-api
pm2 save
pm2 startup

# Or use aaPanel's Node Project manager
``````

## Default Credentials
After running seed:
- Email: superadmin@resculance.com
- Password: Super@123

**⚠️ IMPORTANT: Change the superadmin password immediately after first login!**

## Post-Deployment Checklist
- [ ] Update frontend API base URL to production domain
- [ ] Test all authentication flows
- [ ] Verify database migrations
- [ ] Test WebSocket connections
- [ ] Check CORS settings
- [ ] Enable application monitoring
- [ ] Set up automated backups
- [ ] Configure log rotation

## Troubleshooting
- Check PM2 logs: ``pm2 logs resculance-api``
- Check Nginx logs: ``/www/wwwlogs/resculance.gapsheight.com.error.log``
- Verify database connection in ``.env``
- Ensure all ports are open in firewall

## Support
For issues, contact: support@gapsheight.com
"@

Set-Content -Path "$TempDir\DEPLOYMENT.md" -Value $DeploymentMD

# Create ZIP archive
Write-Host "📦 Creating ZIP archive..." -ForegroundColor Cyan
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipName -Force

# Move to target directory
Write-Host "📤 Moving ZIP to target directory..." -ForegroundColor Cyan
if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir | Out-Null
}
Move-Item -Path $ZipName -Destination "$TargetDir\$ZipName" -Force

# Cleanup
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $TempDir

Write-Host ""
Write-Host "✅ Deployment package created successfully!" -ForegroundColor Green
Write-Host "📦 Location: $TargetDir\$ZipName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload $ZipName to your server"
Write-Host "2. Extract the ZIP file"
Write-Host "3. Follow instructions in DEPLOYMENT.md"
Write-Host "4. Remember to install node_modules for both backend and frontend"
