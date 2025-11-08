#!/bin/bash
# Resculance Production Deployment Preparation Script
# This script creates a production-ready ZIP package for deployment

echo "🚀 Preparing Resculance for Production Deployment..."

# Set variables
PROJECT_NAME="resculance"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="${PROJECT_NAME}_deploy_${TIMESTAMP}.zip"
TARGET_DIR="/PROJECTS"
TEMP_DIR="resculance_temp"

# Create temporary directory
echo "📁 Creating temporary build directory..."
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy backend files (excluding node_modules)
echo "📦 Copying backend files..."
rsync -av --exclude='node_modules' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.git' \
  --exclude='dist' \
  src/ $TEMP_DIR/src/
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null || true

# Copy frontend files (excluding node_modules)
echo "📦 Copying frontend files..."
rsync -av --exclude='node_modules' \
  --exclude='.env' \
  --exclude='dist' \
  --exclude='.git' \
  frontend/ $TEMP_DIR/frontend/

# Copy configuration files
echo "📝 Copying configuration files..."
cp .env.example $TEMP_DIR/
cp README.md $TEMP_DIR/
cp -r scripts $TEMP_DIR/ 2>/dev/null || true

# Create deployment README
cat > $TEMP_DIR/DEPLOYMENT.md << 'EOF'
# Resculance Deployment Guide

## Prerequisites
- Node.js >= 16.0.0
- MySQL >= 8.0
- PM2 (for production process management)

## Installation Steps

### 1. Backend Setup
```bash
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
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in frontend/dist/
```

### 3. aaPanel Configuration

#### Backend (Node.js)
1. In aaPanel, go to "Website" → "Node Project"
2. Click "Add Node Project"
3. Configure:
   - Project Path: `/www/wwwroot/resculance.gapsheight.com`
   - Startup File: `src/server.js`
   - Port: 5001 (or your preferred port)
   - Domain: `resculance.gapsheight.com`
   - Node Version: 16.x or higher

4. Set environment variables in aaPanel:
   - `NODE_ENV=production`
   - `PORT=5001`
   - `DB_HOST=localhost`
   - `DB_USER=your_db_user`
   - `DB_PASSWORD=your_db_password`
   - `DB_NAME=resculance_db`
   - `JWT_SECRET=your_secure_jwt_secret`

#### Frontend (Static Files)
1. Upload `frontend/dist/` contents to `/www/wwwroot/resculance.gapsheight.com/public`
2. Configure Nginx reverse proxy in aaPanel:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /socket.io {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 4. SSL Certificate
1. In aaPanel, go to your website settings
2. Click "SSL" tab
3. Use Let's Encrypt to generate a free SSL certificate
4. Enable "Force HTTPS"

### 5. Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'resculance_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON resculance_db.* TO 'resculance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6. Start Application
```bash
# Using PM2 (recommended)
cd /www/wwwroot/resculance.gapsheight.com
pm2 start src/server.js --name resculance-api
pm2 save
pm2 startup

# Or use aaPanel's Node Project manager
```

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
- Check PM2 logs: `pm2 logs resculance-api`
- Check Nginx logs: `/www/wwwlogs/resculance.gapsheight.com.error.log`
- Verify database connection in `.env`
- Ensure all ports are open in firewall

## Support
For issues, contact: support@gapsheight.com
EOF

# Create .htaccess for PHP fallback (if needed)
cat > $TEMP_DIR/frontend/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# Create production .env.example
cat > $TEMP_DIR/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=5001

# Database Configuration
DB_HOST=localhost
DB_USER=resculance_user
DB_PASSWORD=your_secure_password
DB_NAME=resculance_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_change_this
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://resculance.gapsheight.com

# Socket.IO
SOCKET_IO_ORIGINS=https://resculance.gapsheight.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOF

# Create ZIP archive
echo "📦 Creating ZIP archive..."
cd $TEMP_DIR
zip -r "../$ZIP_NAME" . -x "*.git*" "*.DS_Store"
cd ..

# Move to target directory
echo "📤 Moving ZIP to target directory..."
mkdir -p $TARGET_DIR
mv "$ZIP_NAME" "$TARGET_DIR/"

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $TEMP_DIR

echo "✅ Deployment package created successfully!"
echo "📦 Location: $TARGET_DIR/$ZIP_NAME"
echo ""
echo "Next steps:"
echo "1. Upload $ZIP_NAME to your server"
echo "2. Extract: unzip $ZIP_NAME"
echo "3. Follow instructions in DEPLOYMENT.md"
echo "4. Remember to install node_modules: npm install (backend & frontend)"
EOF