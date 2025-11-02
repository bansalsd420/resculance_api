#!/bin/bash

echo "🚀 Starting Complete Database Setup..."
echo ""

# Drop and recreate database
echo "📦 Dropping existing database..."
mysql -u root -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS $DB_NAME;"

echo "📦 Creating fresh database..."
mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo ""
echo "🔧 Running migrations..."
node src/database/migrate.js

echo ""
echo "🌱 Running comprehensive seed..."
node src/database/seedComprehensive.js

echo ""
echo "✅ Complete! Database is ready with comprehensive test data."
echo ""
echo "🔑 Login Credentials (password for all: Admin@123):"
echo "   Superadmin: superadmin@resculance.com"
echo "   Hospital Admin: admin@citygeneral.com"
echo "   Fleet Admin: admin@rapidresponse.com"
echo "   Doctor: doctor1@citygeneral.com"
echo "   Paramedic: paramedic1@citygeneral.com"
echo "   Driver: driver1@rapidresponse.com"
