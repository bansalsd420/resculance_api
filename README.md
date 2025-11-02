# 🚑 Resculance - Smart Ambulance Management Platform

> **Modern Medical Dashboard for Real-Time Ambulance Management & Patient Care**

A comprehensive healthcare platform connecting ambulances, hospitals, and fleet owners for efficient emergency response. Built with React, Node.js, and MySQL.[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)



---[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)



## 🎯 **Core Features**[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)



### **🏥 Organization Management**[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6+-black.svg)](https://socket.io/)[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

- Multi-type organization support (Hospitals & Fleet Owners)

- Organization collaboration and networking

- Real-time status tracking (Active/Suspended)

- Advanced filtering and search capabilities

> **Resculance** is a comprehensive emergency medical services management platform that connects hospitals, fleet owners, ambulances, and medical personnel in real-time for faster emergency response.

### **🚑 Ambulance Fleet Management**

- Real-time GPS tracking with map integration

- Device status monitoring (Stethoscope, Ventilator, Defibrillator, etc.)---## 🚀 Quick Start

- Ambulance availability and assignment tracking

- Equipment inventory management



### **👤 Patient Management**## 📑 Table of Contents### Prerequisites

- Patient registration and session tracking

- Vital signs monitoring (Heart Rate, SpO2, BP, Temperature)- Node.js >= 16.0.0

- Medical history and emergency contacts

- Real-time patient status updates- [Quick Start](#-quick-start)- MySQL >= 8.0



### **🤝 Collaboration System**- [Features](#-features)- npm >= 8.0.0

- Inter-organization collaboration requests

- Hospital network integration- [Installation](#-installation)

- Emergency response coordination

- Communication channels (Chat, Video, CCTV feeds)- [Configuration](#-configuration)### Backend Setup



### **👥 User Management**- [API Documentation](#-api-documentation)```bash

- Role-based access control (Superadmin, Hospital Admin, Fleet Owner, Driver, Paramedic)

- User authentication with JWT tokens- [WebSocket Events](#-websocket-events)# Install dependencies

- Audit logging for all user actions

- User status management- [User Roles](#-user-roles--permissions)npm install



---- [Database Schema](#-database-schema)



## 🚀 **Quick Start**- [Frontend Application](#-frontend-application)# Configure environment



### **Prerequisites**- [Security](#-security-features)cp .env.example .env

```bash

Node.js >= 16.x- [Testing](#-testing)# Edit .env with your database credentials

MySQL >= 8.0

npm >= 8.x- [Deployment](#-deployment)

```

- [Troubleshooting](#-troubleshooting)# Run migrations and seed data

### **1. Clone & Install**

```bashnpm run migrate

git clone <repository-url>

cd resculance_api---npm run seed



# Install backend dependencies

npm install

## 🚀 Quick Start# Start development server

# Install frontend dependencies

cd frontendnpm run dev

npm install

cd ..```bash```

```

# 1. Install backend dependencies

### **2. Database Setup**

```bashnpm installBackend runs at: **http://localhost:5001**

# Configure MySQL connection in src/config/database.js

# Default credentials: root / Shreshthra@432



# Run migrations# 2. Setup environment### Frontend Setup

npm run migrate

cp .env.example .env```bash

# Seed default data (creates superadmin user)

npm run seed# Edit .env with your database credentialscd frontend

```

npm install

### **3. Start Servers**

# 3. Create database and run migrations

**Backend (Port 5001):**

```bashnpm run migrate# Configure environment

PORT=5001 node src/server.js

```npm run seedcp .env.example .env



**Frontend (Port 5173):**# Edit .env with API URL

```bash

cd frontend# 4. Start backend server

npm run dev

```npm run devnpm run dev



### **4. Default Login**```

```

Email: superadmin@resculance.com# 5. In a new terminal, setup frontend

Password: Admin@123

```cd frontendFrontend runs at: **http://localhost:5173**



---npm install



## 📡 **API Endpoints**cp .env.example .env### Default Login



### **Authentication**npm run dev- **Email:** `superadmin@resculance.com`

```http

POST   /api/auth/login           # User login```- **Password:** `Admin@123`

POST   /api/auth/logout          # User logout

GET    /api/auth/me              # Get current user

POST   /api/auth/refresh-token   # Refresh JWT token

```**Default Login:**## 📚 Documentation



### **Users**- **Email:** `superadmin@resculance.com`

```http

GET    /api/users                # List all users- **Password:** `Admin@123`For complete API documentation, setup guides, and deployment instructions, see:

POST   /api/users                # Create new user

GET    /api/users/:id            # Get user by ID

PUT    /api/users/:id            # Update user

DELETE /api/users/:id            # Delete user**Servers:****[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Comprehensive guide covering:

PATCH  /api/users/:id/status     # Suspend/Activate user

```- **Backend:** http://localhost:5001- All API endpoints with examples



### **Organizations**- **Frontend:** http://localhost:5173- WebSocket events

```http

GET    /api/organizations        # List all organizations- Database schema

POST   /api/organizations        # Create organization

GET    /api/organizations/:id    # Get organization details---- Frontend integration

PUT    /api/organizations/:id    # Update organization

DELETE /api/organizations/:id    # Delete organization- Deployment guide

PATCH  /api/organizations/:id/status  # Suspend/Activate

```## ✨ Features- Troubleshooting



### **Ambulances**

```http

GET    /api/ambulances           # List all ambulances### Core Capabilities## ✨ Key Features

POST   /api/ambulances           # Register ambulance

GET    /api/ambulances/:id       # Get ambulance details- 🏥 **Multi-Organization Management** - Separate workflows for Hospitals and Fleet Owners

PUT    /api/ambulances/:id       # Update ambulance

DELETE /api/ambulances/:id       # Delete ambulance- 👥 **Role-Based Access Control** - 9 distinct roles with granular permissions- **Multi-Organization Management** - Hospitals & Fleet Owners

PATCH  /api/ambulances/:id/availability  # Set availability

```- 🚑 **Ambulance Fleet Management** - Complete lifecycle management with approval workflows- **Role-Based Access Control** - 9 distinct user roles



### **Patients**- 📊 **Real-Time Patient Monitoring** - Live vital signs tracking (Heart Rate, BP, SpO2, Temp)- **Real-Time Patient Monitoring** - Vital signs tracking via WebSocket

```http

GET    /api/patients             # List all patients- 📍 **GPS Tracking** - Real-time ambulance location updates- **GPS Ambulance Tracking** - Live location updates

POST   /api/patients             # Register patient

GET    /api/patients/:id         # Get patient details- 🤝 **Collaboration System** - Fleet owners can provide ambulances to hospitals- **Collaboration System** - Hospital-Fleet owner coordination

PUT    /api/patients/:id         # Update patient

DELETE /api/patients/:id         # Delete patient- 💬 **Communication Hub** - Text, audio, and video communication between doctors and paramedics- **Audit Logging** - Complete compliance tracking

POST   /api/patients/:id/session # Create patient session

GET    /api/patients/sessions/:sessionId  # Get session details- 🔐 **Data Privacy** - Selective data hiding for sensitive patient information

POST   /api/patients/sessions/:sessionId/vitals  # Add vital signs

```- 📝 **Audit Logging** - Complete activity tracking for compliance## 🏗️ Architecture



### **Collaborations**- 🔄 **Session Management** - Patient onboarding, monitoring, and offboarding workflows

```http

GET    /api/collaborations       # List collaborations### Backend

POST   /api/collaborations       # Create collaboration request

GET    /api/collaborations/:id   # Get collaboration details### Technical Features- **Framework:** Node.js + Express.js

PATCH  /api/collaborations/:id/status  # Approve/Reject/Cancel

```- RESTful API with 49+ endpoints- **Database:** MySQL 8.0+



---- WebSocket support via Socket.IO for real-time updates- **Real-time:** Socket.IO



## 🎨 **Medical Dashboard Design**- JWT authentication with access and refresh tokens- **Authentication:** JWT (Access & Refresh tokens)



### **Color Palette**- Input validation using express-validator- **Security:** bcrypt, helmet, rate limiting

```css

Primary:   #0ea5e9 (Cyan)    - Actions, links, active states- Rate limiting (100 req/15 min)

Slate:     #1e293b → #94a3b8 - Base colors, backgrounds

Success:   #22c55e            - Success states, active status- CORS protection with configurable origins### Frontend

Warning:   #f97316            - Warning states, pending actions

Danger:    #ef4444            - Error states, critical alerts- SQL injection prevention via parameterized queries- **Framework:** React 19+ with Vite

Info:      #3b82f6            - Information, neutral states

```- **Styling:** Tailwind CSS



### **Design Features**---- **State Management:** Context API

- **Dark Mode Support** - Automatic theme switching with localStorage

- **Pulse Animations** - Live status indicators with smooth animations- **Routing:** React Router v7

- **Gradient Cards** - Medical metric cards with gradient backgrounds

- **Status Badges** - Color-coded badges for various states## 📋 System Requirements- **API Client:** Axios with interceptors

- **Responsive Tables** - Mobile-friendly data tables

- **Modal Dialogs** - Smooth modal animations- **Real-time:** Socket.IO Client

- **Loading States** - Skeleton loaders and spinners

- **Empty States** - Informative empty state designs### Prerequisites



### **UI Components**- **Node.js** >= 16.0.0## 🗂️ Project Structure

- Clean medical-themed buttons (Primary, Secondary, Success, Danger, Warning)

- Form inputs with validation states- **npm** >= 8.0.0

- Data tables with hover effects and sorting

- Modal dialogs with backdrop blur- **MySQL** >= 8.0```

- Status badges with pulse animations

- Metric cards with icons and gradientsresculance_api/

- Sidebar navigation with active states

- Loading overlays and spinners---├── src/                        # Backend source code



---│   ├── config/                 # Configuration files



## 🗄️ **Database Schema**## 📦 Installation│   ├── controllers/            # Request handlers



### **Core Tables**│   ├── middleware/             # Auth, validation, error handling



**users** - System users### Backend Setup│   ├── models/                 # Database models

```sql

id, organizationId, email, password, firstName, lastName, │   ├── routes/                 # API routes

phoneNumber, role, status, createdAt, updatedAt

``````bash│   ├── socket/                 # WebSocket handlers



**organizations** - Hospitals & Fleet Owners# Install dependencies│   ├── database/               # Migrations & seeds

```sql

id, name, type, address, phoneNumber, email, licenseNumber,npm install│   └── server.js               # Entry point

status, createdAt, updatedAt

```├── frontend/                   # React application



**ambulances** - Ambulance fleet# Dependencies installed:│   ├── src/

```sql

id, organizationId, vehicleNumber, driverName, driverPhone,# - express (v4.18.2) - Web framework│   │   ├── components/         # Reusable UI components

deviceStatus, gpsEnabled, availability, status, createdAt

```# - mysql2 (v3.6.0) - MySQL client│   │   ├── contexts/           # React Context providers



**patients** - Patient records# - socket.io (v4.6.0) - WebSocket support│   │   ├── pages/              # Route pages

```sql

id, firstName, lastName, dob, gender, bloodGroup, phoneNumber,# - jsonwebtoken (v9.0.2) - JWT authentication│   │   ├── services/           # API & Socket services

emergencyContact, address, status, createdAt

```# - bcrypt (v5.1.1) - Password hashing│   │   └── utils/              # Helper functions



**patient_sessions** - Active patient sessions# - express-validator (v7.0.1) - Input validation│   └── public/                 # Static assets

```sql

id, patientId, ambulanceId, pickupLocation, dropLocation,# - helmet (v7.1.0) - Security headers├── .env.example               # Environment template

sessionStatus, startTime, endTime, createdAt

```# - cors (v2.8.5) - CORS middleware├── package.json               # Backend dependencies



**vital_signs** - Patient vitals```└── API_DOCUMENTATION.md       # Complete API docs

```sql

id, sessionId, heartRate, bloodPressure, oxygenLevel, ```

temperature, recordedAt, recordedBy

```### Frontend Setup



**collaboration_requests** - Organization collaborations## 🔐 User Roles

```sql

id, requestingOrgId, targetOrgId, collaborationType,```bash

status, requestedAt, respondedAt

```cd frontend| Role | Organization | Permissions |



### **Relationships**npm install|------|-------------|-------------|

```

users → organizations (Many-to-One)| `superadmin` | System | Full system access |

ambulances → organizations (Many-to-One)

patient_sessions → patients (Many-to-One)# Dependencies installed:| `hospital_admin` | Hospital | Manage hospital & staff |

patient_sessions → ambulances (Many-to-One)

vital_signs → patient_sessions (Many-to-One)# - react (v19.1.0) - UI library| `hospital_staff` | Hospital | Limited operations |

collaboration_requests → organizations (Many-to-Many)

```# - vite (v7.1.3) - Build tool| `hospital_doctor` | Hospital | Patient care & monitoring |



---# - tailwindcss (v3.4.17) - CSS framework| `hospital_paramedic` | Hospital | Vital signs entry |



## 🔐 **Security Features**# - axios (v1.13.0) - HTTP client| `fleet_admin` | Fleet | Manage fleet & staff |



### **Authentication**# - socket.io-client (v4.8.1) - WebSocket client| `fleet_staff` | Fleet | Limited operations |

- JWT token-based authentication

- Secure password hashing with bcrypt (10 rounds)# - react-toastify (v11.0.3) - Notifications| `fleet_doctor` | Fleet | Patient care in ambulance |

- Token refresh mechanism

- Protected route middleware```| `fleet_paramedic` | Fleet | Ambulance operations |



### **Authorization**

- Role-based access control (RBAC)

- Organization-level data isolation---## 🛠️ Development Scripts

- User action auditing

- Status-based access restrictions



### **Validation**## ⚙️ Configuration### Backend

- Input sanitization with express-validator

- SQL injection prevention```bash

- XSS protection

- Request rate limiting### Backend Environment Variablesnpm run dev        # Start with nodemon (auto-reload)



### **Audit Trail**npm start          # Start production server

- User action logging

- IP address trackingCreate `.env` file in the project root:npm run migrate    # Run database migrations

- Timestamp recording

- Change historynpm run seed       # Seed initial data



---```env```



## 🧪 **Testing**# Server Configuration



### **API Testing**NODE_ENV=development### Frontend

Import `Resculance_API.postman_collection.json` into Postman for complete API testing.

PORT=5001```bash

**Test Scenarios:**

1. Login with superadmin credentialsnpm run dev        # Start dev server (Vite HMR)

2. Create hospital organization

3. Create fleet owner organization# Database Configurationnpm run build      # Build for production

4. Register ambulance under fleet owner

5. Create patient recordDB_HOST=localhostnpm run preview    # Preview production build

6. Start patient session

7. Record vital signsDB_PORT=3306npm run lint       # Run ESLint

8. Create collaboration request

9. Approve/reject collaborationDB_USER=root```



### **Manual Testing**DB_PASSWORD=your_mysql_password

```bash

# Test backend healthDB_NAME=resculance_db## 📡 API Endpoints Overview

curl http://localhost:5001/api/



# Test login

curl -X POST http://localhost:5001/api/auth/login \# JWT Configuration### Authentication

  -H "Content-Type: application/json" \

  -d '{"email":"superadmin@resculance.com","password":"Admin@123"}'JWT_SECRET=your_super_secret_jwt_key_change_this_32_chars_minimum- `POST /api/v1/auth/register` - Register new user

```

JWT_REFRESH_SECRET=your_refresh_token_secret_32_chars_minimum- `POST /api/v1/auth/login` - User login

---

JWT_EXPIRE=7d- `POST /api/v1/auth/refresh-token` - Refresh access token

## 📦 **Tech Stack**

JWT_REFRESH_EXPIRE=30d- `GET /api/v1/auth/profile` - Get user profile

### **Backend**

- **Node.js 16+** - Runtime environment- `PUT /api/v1/auth/change-password` - Change password

- **Express.js 4.18** - Web framework

- **MySQL 8.0** - Database# CORS Configuration

- **JWT** - Authentication

- **bcrypt** - Password hashingCORS_ORIGIN=http://localhost:5173### Organizations (49 total endpoints)

- **express-validator** - Input validation

- **Socket.IO** - Real-time communication- CRUD operations for hospitals & fleet owners



### **Frontend**# Rate Limiting- User management within organizations

- **React 19.1** - UI library

- **Vite 7.1** - Build toolRATE_LIMIT_WINDOW_MS=900000- Ambulance fleet management

- **Tailwind CSS 3.4** - Styling framework

- **React Router 7.1** - NavigationRATE_LIMIT_MAX_REQUESTS=100- Patient records & sessions

- **Axios** - HTTP client

- **Leaflet** - Map integration```- Real-time vital signs monitoring

- **Socket.IO Client** - WebSocket client

- Collaboration requests

---

### Frontend Environment Variables

## 🌐 **Real-Time Features**

**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference.**

### **WebSocket Events**

```javascriptCreate `.env` file in the `frontend` directory:

// Patient Session Updates

socket.on('session:created', (data) => {})## 🌐 WebSocket Events

socket.on('session:updated', (data) => {})

socket.on('vitals:updated', (data) => {})```env



// Ambulance Tracking# API ConfigurationReal-time communication for:

socket.on('ambulance:location', (data) => {})

socket.on('ambulance:status', (data) => {})VITE_API_BASE_URL=http://localhost:5001/api/v1- Location tracking (`location_update`)



// Collaboration UpdatesVITE_SOCKET_URL=http://localhost:5001- Vital signs (`vital_update`)

socket.on('collaboration:request', (data) => {})

socket.on('collaboration:response', (data) => {})```- Messaging (`message`)

```

- Audio/Video calls (`call_request`, `video_request`)

### **Live Dashboard Features**

- Real-time ambulance GPS tracking on map---- Emergency alerts (`emergency_alert`)

- Live vital signs monitoring

- CCTV feed integration (4 camera grids)- Patient status (`patient_onboarded`, `patient_offboarded`)

- Hospital network status

- Communication channels (Chat + Video)## 🗄️ Database Setup

- Device status indicators

## 🚀 Deployment

---

### Step 1: Create Database

## 📱 **Frontend Pages**

### Production Build

### **/login** - Authentication

- Email/password login form```sql

- Remember me checkbox

- JWT token storage-- Connect to MySQL**Backend:**

- Redirect to dashboard on success

mysql -u root -p```bash

### **/dashboard** - Main Dashboard

- Statistics cards (Total organizations, ambulances, active sessions)npm install --production

- Recent activity timeline

- Quick actions-- Create databaseNODE_ENV=production node src/server.js

- System health indicators

CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;```

### **/organizations** - Organization Management

- List view with filters (Type, Status, Search)```

- Create/Edit/Delete operations

- Suspend/Activate toggle**Frontend:**

- Collaboration initiation

### Step 2: Run Migrations```bash

### **/users** - User Management

- User list with role filterscd frontend

- Create/Edit/Delete users

- Role assignment```bashnpm run build

- Status management

npm run migrate# Serve the 'dist' folder with Nginx/Apache

### **/ambulances** - Fleet Management

- Ambulance list with availability filters``````

- Device status indicators

- GPS tracking

- Assignment management

This creates 12+ tables including organizations, users, ambulances, patients, patient_sessions, vital_signs, communications, collaboration_requests, audit_logs, and refresh_tokens.### Environment Variables

### **/patients** - Patient Records

- Patient list with search

- Session history

- Vital signs chart### Step 3: Seed Initial Data**Backend:**

- Emergency contacts

- `NODE_ENV=production`

### **/collaborations** - Collaboration Requests

- Pending requests```bash- `JWT_SECRET` - Strong secret (32+ characters)

- Approved collaborations

- Request/Approve/Reject actionsnpm run seed- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Production database

- Collaboration history

```- `CORS_ORIGIN` - Production frontend URL

---



## 🔧 **Configuration**

Creates superadmin user:**Frontend:**

### **Environment Variables**

Create `.env` file in root:- Email: `superadmin@resculance.com`- `VITE_API_BASE_URL` - Production API URL

```env

PORT=5001- Password: `Admin@123`- `VITE_SOCKET_URL` - Production Socket.IO URL

NODE_ENV=development

- ⚠️ **Change immediately after first login!**

# Database

DB_HOST=localhost**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete deployment guide.**

DB_USER=root

DB_PASSWORD=Shreshthra@432---

DB_NAME=resculance_db

## 🔒 Security Features

# JWT

JWT_SECRET=your-secret-key-here## 🎬 Running the Application

JWT_EXPIRY=24h

JWT_REFRESH_EXPIRY=7d- ✅ JWT-based authentication with refresh tokens



# Frontend URL (for CORS)### Development Mode- ✅ Password hashing with bcrypt

FRONTEND_URL=http://localhost:5173

```- ✅ Role-based access control (RBAC)



### **Database Configuration****Backend (with auto-reload):**- ✅ Rate limiting (100 requests/15 minutes)

Edit `src/config/database.js`:

```javascript```bash- ✅ CORS protection

const pool = mysql.createPool({

  host: process.env.DB_HOST || 'localhost',npm run dev- ✅ SQL injection prevention (parameterized queries)

  user: process.env.DB_USER || 'root',

  password: process.env.DB_PASSWORD,# Server runs at http://localhost:5001- ✅ Helmet.js security headers

  database: process.env.DB_NAME || 'resculance_db',

  waitForConnections: true,```- ✅ Input validation & sanitization

  connectionLimit: 10,

  queueLimit: 0- ✅ Audit logging for compliance

});

```**Frontend (with HMR):**



---```bash## 📊 Database



## 📊 **User Roles & Permissions**cd frontend



### **Superadmin**npm run dev**MySQL 8.0+** with the following tables:

- Full system access

- Manage all organizations# App runs at http://localhost:5173- Organizations

- Manage all users

- View all data```- Users

- System configuration

- Ambulances

### **Hospital Admin**

- Manage own organization### Production Mode- Patients

- Manage organization users

- View collaboration requests- Patient Sessions

- Access patient records

- Communication access**Backend:**- Vital Signs



### **Fleet Owner**```bash- Communications

- Manage own organization

- Manage ambulancesNODE_ENV=production npm start- Collaboration Requests

- Assign drivers/paramedics

- Track ambulance locations```- Audit Logs

- View assigned sessions



### **Driver**

- View assigned ambulance**Frontend:****See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema reference.**

- Update ambulance location

- Update device status```bash

- View assigned sessions

- Basic patient infocd frontend## 🤝 Contributing



### **Paramedic**npm run build

- View patient sessions

- Record vital signs# Serve the 'dist' folder with Nginx/Apache1. Fork the repository

- Update patient status

- Communication access```2. Create a feature branch (`git checkout -b feature/amazing-feature`)

- Device management

3. Commit your changes (`git commit -m 'Add amazing feature'`)

---

---4. Push to the branch (`git push origin feature/amazing-feature`)

## 🐛 **Troubleshooting**

5. Open a Pull Request

### **Backend Issues**

## 📡 API Documentation

**Server won't start:**

```bash## 🐛 Troubleshooting

# Check if port 5001 is in use

lsof -i :5001### Base URL

# Kill process if needed

kill -9 <PID>```Common issues and solutions are documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#troubleshooting).

```

http://localhost:5001/api/v1

**Database connection error:**

```bash```## 📝 License

# Verify MySQL is running

mysql -u root -p

# Check database exists

SHOW DATABASES;### AuthenticationISC License - See LICENSE file for details

# Re-run migrations if needed

npm run migrateInclude JWT token in the Authorization header:

```

## 👥 Team

### **Frontend Issues**

```http

**Build errors:**

```bashAuthorization: Bearer <your_access_token>**RESCULANCE Team** - Emergency Response Management System

cd frontend

rm -rf node_modules package-lock.json```

npm install

```## 📞 Support



**API connection issues:**### Main Endpoint Categories

- Verify backend is running on port 5001

- Check browser console for CORS errorsFor issues or questions:

- Ensure `frontend/src/utils/api.js` has correct base URL

#### 1. Authentication (`/auth`)- Open an issue on GitHub

### **Common Errors**

- `POST /auth/register` - Register new user- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

**"ValidationError: .withMessage() after sanitizer"**

- Fixed in `src/middleware/validation.js`- `POST /auth/login` - User login- Review existing documentation files

- Ensure .withMessage() is before .normalizeEmail()

- `POST /auth/refresh-token` - Refresh access token

**"Token expired"**

- Re-login to get new JWT token- `GET /auth/profile` - Get current user profile---

- Check JWT_EXPIRY in configuration

- `PUT /auth/change-password` - Change password

**"Organization not found"**

- Ensure organizations are created before other entities**Version:** 1.0.0  

- Check organizationId in requests

#### 2. Organizations (`/organizations`)**Last Updated:** November 2025 - Smart Ambulance Management Platform

---

- `POST /organizations` - Create organization (Superadmin)

## 🚀 **Deployment**

- `GET /organizations` - List all organizationsA comprehensive Node.js REST API with real-time communication capabilities for managing ambulance operations, connecting hospitals, fleet owners, doctors, paramedics, and patients.

### **Production Build**

- `GET /organizations/:id` - Get organization details

**Frontend:**

```bash- `PUT /organizations/:id` - Update organization## 🚀 Features

cd frontend

npm run build- `DELETE /organizations/:id` - Delete organization

# Build output in frontend/dist

```- `PATCH /organizations/:id/suspend` - Suspend organization- **Multi-Organization Support**: Hospitals and Fleet Owners with independent management



**Backend:**- `PATCH /organizations/:id/activate` - Activate organization- **Role-Based Access Control (RBAC)**: 9 different user roles with granular permissions

```bash

# Set NODE_ENV to production- **Ambulance Management**: Complete lifecycle management with approval workflows

export NODE_ENV=production

# Use PM2 for process management#### 3. Users (`/users`)- **Patient Sessions**: Real-time patient onboarding, monitoring, and offboarding

npm install -g pm2

pm2 start src/server.js --name resculance-api- `POST /users` - Create user (Admins)- **Smart Device Integration**: Support for medical devices (ECG, BP monitors, pulse oximeters, etc.)

```

- `GET /users` - List users- **Real-Time Dashboard**: Socket.IO powered live updates for vital signs and location

### **Nginx Configuration**

```nginx- `GET /users/:id` - Get user details- **Communication Hub**: Text, audio, and video communication between doctors and paramedics

server {

    listen 80;- `PUT /users/:id` - Update user- **Collaboration System**: Fleet owners can provide ambulances to hospitals

    server_name your-domain.com;

- `PATCH /users/:id/approve` - Approve user- **Audit Logging**: Complete activity tracking for accountability

    # Frontend

    location / {- `PATCH /users/:id/reject` - Reject user- **Data Privacy**: Selective data hiding for sensitive patient information

        root /var/www/resculance/frontend/dist;

        try_files $uri /index.html;- `PATCH /users/:id/suspend` - Suspend user

    }

- `DELETE /users/:id` - Delete user## 📋 Prerequisites

    # Backend API

    location /api {

        proxy_pass http://localhost:5001;

        proxy_http_version 1.1;#### 4. Ambulances (`/ambulances`)Before you begin, ensure you have the following installed:

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection 'upgrade';- `POST /ambulances` - Create ambulance- **Node.js** (v16.0.0 or higher)

        proxy_set_header Host $host;

        proxy_cache_bypass $http_upgrade;- `GET /ambulances` - List ambulances- **npm** (v8.0.0 or higher)

    }

- `GET /ambulances/my-ambulances` - Get user's ambulances- **MySQL** (v8.0 or higher)

    # WebSocket

    location /socket.io {- `GET /ambulances/:id` - Get ambulance details

        proxy_pass http://localhost:5001;

        proxy_http_version 1.1;- `PUT /ambulances/:id` - Update ambulance## 🛠️ Installation

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";- `PATCH /ambulances/:id/approve` - Approve ambulance (Superadmin)

    }

}- `POST /ambulances/:id/assign-user` - Assign staff### 1. Clone the repository (or navigate to project directory)

```

- `DELETE /ambulances/:id/unassign-user/:userId` - Unassign staff

---

- `PATCH /ambulances/:id/location` - Update location```powershell

## 📄 **License**

cd "d:\Projects\RESCULANCE API"

Copyright © 2025 Resculance India. All rights reserved.

#### 5. Patients (`/patients`)```

---

- `POST /patients` - Create patient

## 👥 **Support**

- `GET /patients` - List patients### 2. Install dependencies

For issues and feature requests:

- Email: support@resculance.com- `GET /patients/code/:code` - Get patient by code

- Documentation: See individual API endpoint documentation in Postman collection

- `GET /patients/:id` - Get patient details```powershell

---

- `PUT /patients/:id` - Update patientnpm install

## 🔄 **Version History**

- `PATCH /patients/:id/hide-data` - Hide patient data```

### **v1.0.0** - Current

- ✅ Complete CRUD for all entities- `PATCH /patients/:id/unhide-data` - Unhide patient data

- ✅ Real-time WebSocket communication

- ✅ Medical dashboard UI theme### 3. Set up environment variables

- ✅ Dark mode support

- ✅ Role-based access control#### 6. Patient Sessions (`/patients/*`)

- ✅ Audit logging

- ✅ Mobile-responsive design- `POST /patients/onboard` - Onboard patient to ambulanceCopy the `.env.example` file to create your `.env` file:

- ✅ API documentation in Postman

- `PATCH /sessions/:sessionId/offboard` - Offboard patient

---

- `GET /sessions` - List sessions```powershell

**Built with ❤️ for Emergency Medical Services in India**

- `GET /sessions/:sessionId` - Get session detailsCopy-Item .env.example .env

- `POST /sessions/:sessionId/vitals` - Add vital signs```

- `GET /sessions/:sessionId/vitals` - Get vital signs

- `POST /sessions/:sessionId/communications` - Log communicationThen edit the `.env` file with your configuration:



#### 7. Collaborations (`/collaborations`)```env

- `POST /collaborations` - Create collaboration request (Hospital)# Database Configuration

- `GET /collaborations` - List requestsDB_HOST=localhost

- `GET /collaborations/:id` - Get request detailsDB_PORT=3306

- `PATCH /collaborations/:id/accept` - Accept request (Fleet)DB_USER=root

- `PATCH /collaborations/:id/reject` - Reject request (Fleet)DB_PASSWORD=your_mysql_password

- `PATCH /collaborations/:id/cancel` - Cancel request (Hospital)DB_NAME=resculance_db



### Request Example# JWT Configuration

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

#### LoginJWT_EXPIRE=7d

```bash

curl -X POST http://localhost:5001/api/v1/auth/login \# Other settings (review .env.example for all options)

  -H "Content-Type: application/json" \```

  -d '{

    "email": "superadmin@resculance.com",### 4. Create the database

    "password": "Admin@123"

  }'Open MySQL and create the database:

```

```sql

**Response:**CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

```json```

{

  "success": true,### 5. Run database migrations

  "data": {

    "user": {```powershell

      "id": 1,npm run migrate

      "name": "Super Admin",```

      "email": "superadmin@resculance.com",

      "role": "superadmin"### 6. Seed initial data (creates superadmin)

    },

    "accessToken": "eyJhbGciOiJIUzI1NiIs...",```powershell

    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."npm run seed

  }```

}

```**Default Superadmin Credentials:**

- Email: `superadmin@resculance.com`

---- Password: `Admin@123`



## 🔌 WebSocket Events⚠️ **IMPORTANT**: Change this password immediately after first login!



### Connection## 🚀 Running the Application



```javascript### Development Mode (with auto-reload)

import io from 'socket.io-client';

```powershell

const socket = io('http://localhost:5001', {npm run dev

  auth: { token: 'your_jwt_access_token' }```

});

```### Production Mode



### Client → Server Events```powershell

npm start

| Event | Payload | Description |```

|-------|---------|-------------|

| `join_ambulance` | `{ ambulanceId }` | Join ambulance room |The server will start on `http://localhost:5000` (or your configured PORT).

| `leave_ambulance` | `{ ambulanceId }` | Leave ambulance room |

| `join_session` | `{ sessionId }` | Join patient session room |## 📚 API Documentation

| `leave_session` | `{ sessionId }` | Leave session room |

| `location_update` | `{ ambulanceId, latitude, longitude }` | Update ambulance location |### Base URL

| `vital_update` | `{ sessionId, vitalSigns }` | Send vital signs |

| `message` | `{ sessionId, message }` | Send text message |```

| `call_request` | `{ sessionId, callerId }` | Initiate audio call |http://localhost:5000/api/v1

| `video_request` | `{ sessionId, callerId }` | Initiate video call |```

| `emergency_alert` | `{ sessionId, alertType, message }` | Send emergency alert |

### Authentication

### Server → Client Events

Most endpoints require authentication. Include the JWT token in the Authorization header:

| Event | Payload | Description |

|-------|---------|-------------|```

| `joined_ambulance` | `{ ambulanceId }` | Confirmation of joining ambulance |Authorization: Bearer <your_jwt_token>

| `joined_session` | `{ sessionId }` | Confirmation of joining session |```

| `location_update` | `{ ambulanceId, location }` | Real-time location update |

| `vital_update` | `{ sessionId, vitalSigns }` | Real-time vital signs |### Main Endpoints

| `message` | `{ sessionId, sender, message }` | Receive message |

| `call_request` | `{ sessionId, callerId }` | Incoming call |#### Authentication

| `video_request` | `{ sessionId, callerId }` | Incoming video call |- `POST /auth/register` - Register new user

| `patient_onboarded` | `{ sessionId, patientId }` | Patient onboarded notification |- `POST /auth/login` - Login

| `patient_offboarded` | `{ sessionId }` | Patient offboarded notification |- `GET /auth/profile` - Get current user profile

| `emergency_alert` | `{ sessionId, alertType, message }` | Emergency alert |- `PUT /auth/profile` - Update profile

| `error` | `{ message }` | Error notification |- `PUT /auth/change-password` - Change password

- `POST /auth/refresh-token` - Refresh access token

---

#### Organizations

## 👥 User Roles & Permissions- `POST /organizations` - Create organization (Superadmin only)

- `GET /organizations` - List all organizations

### Role Hierarchy- `GET /organizations/:id` - Get organization details

- `PUT /organizations/:id` - Update organization

| Role | Organization | Description |- `DELETE /organizations/:id` - Delete organization

|------|-------------|-------------|- `PATCH /organizations/:id/suspend` - Suspend organization

| **superadmin** | System | Complete system access |- `PATCH /organizations/:id/activate` - Activate organization

| **hospital_admin** | Hospital | Manage hospital operations |

| **hospital_staff** | Hospital | Limited hospital operations |#### Users

| **hospital_doctor** | Hospital | Patient care & monitoring |- `POST /users` - Create user (Admin only)

| **hospital_paramedic** | Hospital | Vital signs & field operations |- `GET /users` - List users

| **fleet_admin** | Fleet Owner | Manage fleet operations |- `GET /users/:id` - Get user details

| **fleet_staff** | Fleet Owner | Limited fleet operations |- `PUT /users/:id` - Update user

| **fleet_doctor** | Fleet Owner | Patient care in ambulance |- `PATCH /users/:id/approve` - Approve user (Admin only)

| **fleet_paramedic** | Fleet Owner | Ambulance operations |- `PATCH /users/:id/suspend` - Suspend user

- `DELETE /users/:id` - Delete user

### Permission Matrix

#### Ambulances

| Action | Superadmin | Hospital Admin | Fleet Admin | Doctor | Paramedic |- `POST /ambulances` - Create ambulance

|--------|------------|----------------|-------------|--------|-----------|- `GET /ambulances` - List ambulances

| Create Organization | ✅ | ❌ | ❌ | ❌ | ❌ |- `GET /ambulances/my-ambulances` - Get ambulances mapped to current user

| Manage Users | ✅ | ✅ (own org) | ✅ (own org) | ❌ | ❌ |- `GET /ambulances/:id` - Get ambulance details

| Approve Ambulances | ✅ | ❌ | ❌ | ❌ | ❌ |- `PUT /ambulances/:id` - Update ambulance

| Create Ambulances | ✅ | ❌ | ✅ | ❌ | ❌ |- `PATCH /ambulances/:id/approve` - Approve ambulance (Superadmin only)

| Onboard Patient | ✅ | ✅ | ❌ | ❌ | ✅ |- `POST /ambulances/:id/assign-user` - Assign doctor/paramedic to ambulance

| Record Vital Signs | ✅ | ❌ | ❌ | ✅ | ✅ |- `DELETE /ambulances/:id/unassign-user/:userId` - Unassign user

| Hide Patient Data | ✅ | ✅ | ❌ | ❌ | ❌ |- `GET /ambulances/:id/assigned-users` - Get assigned users

| Make Calls | ✅ | ❌ | ❌ | ✅ | ✅ |- `PATCH /ambulances/:id/location` - Update ambulance location

| Update Location | ✅ | ❌ | ❌ | ❌ | ✅ |- `DELETE /ambulances/:id` - Delete ambulance



---#### Patients

- `POST /patients` - Create patient

## 🗄️ Database Schema- `GET /patients` - List patients

- `GET /patients/code/:code` - Get patient by code

### Key Tables- `PUT /patients/:id` - Update patient

- `PATCH /patients/:id/hide-data` - Hide patient data

#### `organizations`- `PATCH /patients/:id/unhide-data` - Unhide patient data

Stores hospitals and fleet owners.

#### Patient Sessions

| Column | Type | Description |- `POST /patients/onboard` - Onboard patient to ambulance

|--------|------|-------------|- `PATCH /patients/sessions/:sessionId/offboard` - Offboard patient

| id | INT (PK) | Auto-increment ID |- `GET /patients/sessions` - List patient sessions

| code | VARCHAR(20) | Unique organization code |- `GET /patients/sessions/:sessionId` - Get session details

| name | VARCHAR(255) | Organization name |- `POST /patients/sessions/:sessionId/vitals` - Add vital signs

| type | ENUM | 'hospital' or 'fleet_owner' |- `POST /patients/sessions/:sessionId/communications` - Log communication

| status | ENUM | 'active', 'suspended', 'inactive' |

#### Collaboration Requests

#### `users`- `POST /collaborations` - Create collaboration request (Hospital)

All user accounts with roles.- `GET /collaborations` - List collaboration requests

- `GET /collaborations/:id` - Get request details

| Column | Type | Description |- `PATCH /collaborations/:id/accept` - Accept request (Fleet Owner)

|--------|------|-------------|- `PATCH /collaborations/:id/reject` - Reject request (Fleet Owner)

| id | INT (PK) | Auto-increment ID |- `PATCH /collaborations/:id/cancel` - Cancel request (Hospital)

| organization_id | INT (FK) | Organization reference |

| name | VARCHAR(255) | User's full name |## 🔌 WebSocket Events (Socket.IO)

| email | VARCHAR(255) | Unique email |

| password | VARCHAR(255) | Hashed password (bcrypt) |Connect to Socket.IO with authentication token:

| role | ENUM | User role (9 types) |

| status | ENUM | 'pending_approval', 'active', 'suspended', 'rejected' |```javascript

const socket = io('http://localhost:5000', {

#### `ambulances`  auth: { token: 'your_jwt_token' }

Ambulance fleet.});

```

| Column | Type | Description |

|--------|------|-------------|### Available Events

| id | INT (PK) | Auto-increment ID |

| organization_id | INT (FK) | Fleet owner reference |#### Client → Server

| registration_number | VARCHAR(50) | Unique registration |- `join_ambulance` - Join ambulance room

| type | ENUM | 'BLS', 'ALS', 'ICU' |- `leave_ambulance` - Leave ambulance room

| status | ENUM | 'pending_approval', 'active', 'en_route', 'inactive' |- `join_session` - Join patient session room

| current_lat | DECIMAL | Current latitude |- `leave_session` - Leave session room

| current_lng | DECIMAL | Current longitude |- `vital_update` - Send vital signs update

- `location_update` - Send ambulance location

#### `patients`- `message` - Send text message

Patient master data.- `call_request` - Initiate audio call

- `call_answer` - Answer call

| Column | Type | Description |- `call_end` - End call

|--------|------|-------------|- `video_request` - Initiate video call

| id | INT (PK) | Auto-increment ID |- `video_answer` - Answer video call

| code | VARCHAR(20) | Unique patient code |- `video_end` - End video call

| name | VARCHAR(255) | Patient name |- `emergency_alert` - Send emergency alert

| age | INT | Patient age |

| gender | ENUM | 'male', 'female', 'other' |#### Server → Client

| emergency_type | VARCHAR(100) | Type of emergency |- `joined_ambulance` - Confirmation of joining ambulance room

| data_hidden | BOOLEAN | Privacy flag |- `joined_session` - Confirmation of joining session room

- `vital_update` - Real-time vital signs updates

#### `patient_sessions`- `location_update` - Real-time location updates

Active/historical patient trips.- `message` - Receive messages

- `call_request` - Incoming call request

| Column | Type | Description |- `call_answer` - Call answered/rejected

|--------|------|-------------|- `call_end` - Call ended

| id | INT (PK) | Auto-increment ID |- `video_request` - Incoming video call

| patient_id | INT (FK) | Patient reference |- `video_answer` - Video call answered/rejected

| ambulance_id | INT (FK) | Ambulance reference |- `video_end` - Video call ended

| status | ENUM | 'onboarded', 'in_transit', 'delivered', 'cancelled' |- `patient_onboarded` - Patient onboarded notification

| pickup_lat | DECIMAL | Pickup latitude |- `patient_offboarded` - Patient offboarded notification

| destination_lat | DECIMAL | Destination latitude |- `emergency_alert` - Emergency alert notification

| onboarded_at | DATETIME | Onboarding timestamp |

## 👥 User Roles & Permissions

#### `vital_signs`

Real-time patient vital signs.### Superadmin

- Complete system access

| Column | Type | Description |- Create/manage all organizations

|--------|------|-------------|- Approve ambulances and users

| id | INT (PK) | Auto-increment ID |- Global monitoring

| session_id | INT (FK) | Patient session reference |

| heart_rate | INT | Beats per minute |### Hospital Admin

| systolic_bp | INT | Systolic blood pressure |- Manage hospital users

| diastolic_bp | INT | Diastolic blood pressure |- Create/manage ambulances

| spo2 | DECIMAL | Oxygen saturation (%) |- Onboard patients

| temperature | DECIMAL | Body temperature (°F) |- Manage data visibility

| recorded_at | DATETIME | Recording timestamp |

### Hospital Staff

#### `communications`- Same as Hospital Admin except user management

Chat, call, and video logs.

### Hospital Doctor

| Column | Type | Description |- View ambulance dashboards (when patient onboarded)

|--------|------|-------------|- Access patient data

| id | INT (PK) | Auto-increment ID |- Communicate with paramedics

| session_id | INT (FK) | Patient session reference |

| sender_id | INT (FK) | User who sent |### Hospital Paramedic

| type | ENUM | 'text', 'audio_call', 'video_call' |- Access ambulance dashboards anytime

| message | TEXT | Message content |- Onboard patients

| duration | INT | Call duration (seconds) |- Update vital signs

- Communicate with doctors

---

### Fleet Admin

## 💻 Frontend Application- Manage fleet users

- Create/manage ambulances

### Tech Stack- Accept/reject collaboration requests

- **React 19.1.0** - UI library- Control ambulance assignments

- **Vite 7.1.3** - Build tool with HMR

- **Tailwind CSS 3.4.17** - Utility-first CSS### Fleet Staff

- **React Router 7.9.0** - Client-side routing- Similar to Fleet Admin except user management

- **Axios 1.13.0** - HTTP client

- **Socket.IO Client 4.8.1** - WebSocket client### Fleet Doctor & Fleet Paramedic

- **React Toastify 11.0.3** - Toast notifications- Same functions as hospital counterparts within fleet context



### Project Structure## 🗄️ Database Schema



```The system uses MySQL with the following main tables:

frontend/

├── src/- `organizations` - Hospitals and Fleet Owners

│   ├── components/- `users` - All user accounts with roles

│   │   ├── common/           # Reusable components (Button, Card, Table, etc.)- `ambulances` - Ambulance fleet

│   │   ├── layout/           # Layout components (Sidebar, Header)- `smart_devices` - Medical devices in ambulances

│   │   └── auth/             # Auth components (ProtectedRoute)- `ambulance_user_mappings` - Doctor/Paramedic assignments

│   ├── contexts/- `patients` - Patient master data

│   │   └── AuthContext.jsx   # Authentication context- `patient_sessions` - Active/historical patient trips

│   ├── pages/- `vital_signs` - Real-time vital signs data

│   │   ├── Login.jsx         # Login page- `communications` - Chat/call/video logs

│   │   ├── Dashboard.jsx     # Dashboard with stats- `collaboration_requests` - Fleet-Hospital collaborations

│   │   ├── Organizations.jsx # Organizations management- `audit_logs` - Activity tracking

│   │   ├── Users.jsx         # Users management- `refresh_tokens` - JWT refresh tokens

│   │   ├── Ambulances.jsx    # Ambulances management

│   │   ├── Patients.jsx      # Patients management## 🔒 Security Features

│   │   └── Collaborations.jsx# Collaboration requests

│   ├── services/- JWT-based authentication with refresh tokens

│   │   ├── api.service.js    # API service layer- Password hashing with bcrypt

│   │   └── socket.service.js # Socket.IO service- Role-based access control (RBAC)

│   ├── utils/- Organization-level data isolation

│   │   └── api.js            # Axios instance with interceptors- Rate limiting

│   └── App.jsx               # Main app component- Helmet.js security headers

└── public/                   # Static assets- CORS protection

```- SQL injection prevention (parameterized queries)

- Audit logging for accountability

### Key Features

## 📊 Health Check

- **Authentication Flow** - Login with JWT token storage

- **Automatic Token Refresh** - On 401 errorsCheck if the API is running:

- **Protected Routes** - Role-based access control

- **Real-time Updates** - WebSocket integration```

- **Responsive Design** - Mobile-first approachGET http://localhost:5000/health

- **Toast Notifications** - User feedback```

- **Form Validation** - Error handling

Response:

---```json

{

## 🔒 Security Features  "status": "OK",

  "message": "RESCULANCE API is running",

### Implemented Security Measures  "timestamp": "2025-10-30T12:00:00.000Z"

}

- ✅ **JWT Tokens** - Access (7d) and Refresh (30d) tokens```

- ✅ **Password Hashing** - bcrypt with salt rounds (10)

- ✅ **Role-Based Access Control** - 9 distinct roles## 🧪 Testing

- ✅ **Rate Limiting** - 100 requests per 15 minutes

- ✅ **CORS Protection** - Configurable allowed originsYou can test the API using:

- ✅ **Helmet.js** - Security headers (CSP, HSTS, etc.)- **Postman** - Import endpoints and test

- ✅ **SQL Injection Prevention** - Parameterized queries only- **Thunder Client** (VS Code Extension)

- ✅ **Input Validation** - express-validator for all inputs- **curl** commands

- ✅ **Audit Logging** - All actions logged

- ✅ **Environment Variables** - Sensitive config in .envExample login request:



---```powershell

curl -X POST http://localhost:5000/api/v1/auth/login `

## 🧪 Testing  -H "Content-Type: application/json" `

  -d '{"email":"superadmin@resculance.com","password":"Admin@123"}'

### Manual Testing```



Use the provided test script:## 📁 Project Structure



```bash```

# Run comprehensive API testsRESCULANCE API/

chmod +x test-apis.sh├── src/

./test-apis.sh│   ├── config/

```│   │   ├── database.js        # Database connection

│   │   └── constants.js       # System constants

This tests:│   ├── controllers/           # Request handlers

- ✅ Login authentication│   │   ├── authController.js

- ✅ Get user profile│   │   ├── organizationController.js

- ✅ Organizations CRUD│   │   ├── userController.js

- ✅ Users CRUD│   │   ├── ambulanceController.js

- ✅ Ambulances CRUD│   │   ├── patientController.js

- ✅ Patients CRUD│   │   └── collaborationController.js

│   ├── database/

### Testing with cURL│   │   ├── migrate.js         # Database migrations

│   │   └── seed.js            # Initial data seeding

```bash│   ├── middleware/

# Test Login│   │   ├── auth.js            # Authentication & authorization

curl -X POST http://localhost:5001/api/v1/auth/login \│   │   ├── validation.js      # Input validation

  -H "Content-Type: application/json" \│   │   ├── errorHandler.js    # Error handling

  -d '{"email":"superadmin@resculance.com","password":"Admin@123"}'│   │   └── audit.js           # Audit logging

│   ├── models/                # Database models

# Test with Token│   │   ├── Organization.js

TOKEN="your_access_token"│   │   ├── User.js

curl -X GET http://localhost:5001/api/v1/auth/profile \│   │   ├── Ambulance.js

  -H "Authorization: Bearer $TOKEN"│   │   ├── Patient.js

```│   │   ├── PatientSession.js

│   │   ├── CollaborationRequest.js

---│   │   ├── VitalSign.js

│   │   └── Communication.js

## 🚀 Deployment│   ├── routes/                # API routes

│   │   ├── index.js

### Production Checklist│   │   ├── authRoutes.js

- [ ] Change default superadmin password│   │   ├── organizationRoutes.js

- [ ] Set strong JWT_SECRET (32+ characters)│   │   ├── userRoutes.js

- [ ] Enable HTTPS (SSL/TLS)│   │   ├── ambulanceRoutes.js

- [ ] Configure firewall rules│   │   ├── patientRoutes.js

- [ ] Set up database backups│   │   └── collaborationRoutes.js

- [ ] Configure proper CORS origins│   ├── socket/

- [ ] Set up monitoring and alerts│   │   └── socketHandler.js   # WebSocket handlers

- [ ] Implement log rotation│   └── server.js              # Main application entry

- [ ] Regular security audits├── .env.example               # Environment template

├── .gitignore

### Backend Deployment with PM2├── package.json

└── README.md

```bash```

# Install PM2

npm install -g pm2## 🐛 Troubleshooting



# Start application### Database Connection Failed

pm2 start src/server.js --name resculance-api- Verify MySQL is running

- Check credentials in `.env`

# Enable auto-restart on reboot- Ensure database exists

pm2 startup

pm2 save### Port Already in Use

- Change PORT in `.env`

# Monitor logs- Or stop the process using port 5000

pm2 logs resculance-api

```### JWT Token Errors

- Ensure JWT_SECRET is set in `.env`

### Frontend Deployment- Check token expiry time

- Verify token format in Authorization header

```bash

# Build for production## 🚀 Deployment

cd frontend

npm run build### Production Checklist

1. Change all default passwords

# Output in 'dist' folder - serve with Nginx/Apache2. Set strong JWT_SECRET

```3. Enable HTTPS

4. Configure CORS properly

### Nginx Configuration5. Set NODE_ENV=production

6. Use environment-specific database

```nginx7. Enable proper logging

server {8. Set up monitoring

    listen 80;9. Configure firewall rules

    server_name app.resculance.com;10. Regular backups



    root /var/www/resculance-frontend/dist;## 📝 License

    index index.html;

ISC

    location / {

        try_files $uri $uri/ /index.html;## 👨‍💻 Support

    }

For issues and questions:

    # API proxy- Create an issue in the repository

    location /api/ {- Contact: support@resculance.com

        proxy_pass http://localhost:5001;

        proxy_http_version 1.1;## 🎯 Future Enhancements

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection 'upgrade';- Mobile app integration

        proxy_set_header Host $host;- Advanced analytics dashboard

        proxy_cache_bypass $http_upgrade;- ML-based emergency prediction

    }- Multi-language support

- Offline mode with sync

    # Socket.IO proxy- Integration with hospital EMR systems

    location /socket.io/ {- Real-time traffic routing

        proxy_pass http://localhost:5001;- Automated ambulance dispatch

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;---

        proxy_set_header Connection 'upgrade';

    }**Built with ❤️ for saving lives**

}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solutions:**
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

#### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5001`

**Solutions:**
- Find process: `lsof -ti:5001`
- Kill process: `kill -9 $(lsof -ti:5001)`
- Or change PORT in `.env`

#### JWT Token Errors
**Error:** `JsonWebTokenError` or `TokenExpiredError`

**Solutions:**
- Ensure JWT_SECRET is set in `.env`
- Check token format: `Bearer <token>`
- Refresh token if expired
- Clear localStorage and re-login

#### CORS Errors
**Error:** `Access-Control-Allow-Origin` blocked

**Solutions:**
- Add frontend URL to CORS_ORIGIN in `.env`
- For multiple origins: `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`

#### Frontend Not Connecting
**Error:** Network errors or 404

**Solutions:**
- Verify backend is running
- Check VITE_API_BASE_URL in `frontend/.env`
- Check browser console for errors

---

## 📁 Project Structure

```
resculance_api/
├── src/                      # Backend source code
│   ├── config/               # Database & constants
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth, validation, error handling
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── socket/               # WebSocket handlers
│   ├── database/             # Migrations & seeds
│   └── server.js             # Entry point
├── frontend/                 # React application
│   ├── src/                  # Frontend source code
│   └── public/               # Static assets
├── .env.example              # Environment template
├── test-apis.sh              # API testing script
├── package.json              # Backend dependencies
└── README.md                 # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

ISC License

---

## 📞 Support

- **Issues:** GitHub Issues
- **Email:** support@resculance.com

---

**Built with ❤️ for saving lives**

*Version 1.0.0 - November 2025*

**RESCULANCE** - Smart Ambulance Management Platform
