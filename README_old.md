# RESCULANCE - Smart Ambulance Management Platform 🚑# RESCULANCE - Smart Ambulance Management Platform



[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)

[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)

[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6+-black.svg)](https://socket.io/)[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)



> **RESCULANCE** is a comprehensive emergency medical services management platform that connects hospitals, fleet owners, ambulances, and medical personnel in real-time for faster emergency response.**RESCULANCE** is a comprehensive emergency medical services management platform that connects hospitals, fleet owners, ambulances, and medical personnel in real-time.



---## 🚀 Quick Start



## 📑 Table of Contents### Prerequisites

- Node.js >= 16.0.0

- [Quick Start](#-quick-start)- MySQL >= 8.0

- [Features](#-features)- npm >= 8.0.0

- [Installation](#-installation)

- [Configuration](#-configuration)### Backend Setup

- [API Documentation](#-api-documentation)```bash

- [WebSocket Events](#-websocket-events)# Install dependencies

- [User Roles](#-user-roles--permissions)npm install

- [Database Schema](#-database-schema)

- [Frontend Application](#-frontend-application)# Configure environment

- [Security](#-security-features)cp .env.example .env

- [Testing](#-testing)# Edit .env with your database credentials

- [Deployment](#-deployment)

- [Troubleshooting](#-troubleshooting)# Run migrations and seed data

npm run migrate

---npm run seed



## 🚀 Quick Start# Start development server

npm run dev

```bash```

# 1. Install backend dependencies

npm installBackend runs at: **http://localhost:5001**



# 2. Setup environment### Frontend Setup

cp .env.example .env```bash

# Edit .env with your database credentialscd frontend

npm install

# 3. Create database and run migrations

npm run migrate# Configure environment

npm run seedcp .env.example .env

# Edit .env with API URL

# 4. Start backend server

npm run devnpm run dev

```

# 5. In a new terminal, setup frontend

cd frontendFrontend runs at: **http://localhost:5173**

npm install

cp .env.example .env### Default Login

npm run dev- **Email:** `superadmin@resculance.com`

```- **Password:** `Admin@123`



**Default Login:**## 📚 Documentation

- **Email:** `superadmin@resculance.com`

- **Password:** `Admin@123`For complete API documentation, setup guides, and deployment instructions, see:



**Servers:****[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Comprehensive guide covering:

- **Backend:** http://localhost:5001- All API endpoints with examples

- **Frontend:** http://localhost:5173- WebSocket events

- Database schema

---- Frontend integration

- Deployment guide

## ✨ Features- Troubleshooting



### Core Capabilities## ✨ Key Features

- 🏥 **Multi-Organization Management** - Separate workflows for Hospitals and Fleet Owners

- 👥 **Role-Based Access Control** - 9 distinct roles with granular permissions- **Multi-Organization Management** - Hospitals & Fleet Owners

- 🚑 **Ambulance Fleet Management** - Complete lifecycle management with approval workflows- **Role-Based Access Control** - 9 distinct user roles

- 📊 **Real-Time Patient Monitoring** - Live vital signs tracking (Heart Rate, BP, SpO2, Temp)- **Real-Time Patient Monitoring** - Vital signs tracking via WebSocket

- 📍 **GPS Tracking** - Real-time ambulance location updates- **GPS Ambulance Tracking** - Live location updates

- 🤝 **Collaboration System** - Fleet owners can provide ambulances to hospitals- **Collaboration System** - Hospital-Fleet owner coordination

- 💬 **Communication Hub** - Text, audio, and video communication between doctors and paramedics- **Audit Logging** - Complete compliance tracking

- 🔐 **Data Privacy** - Selective data hiding for sensitive patient information

- 📝 **Audit Logging** - Complete activity tracking for compliance## 🏗️ Architecture

- 🔄 **Session Management** - Patient onboarding, monitoring, and offboarding workflows

### Backend

### Technical Features- **Framework:** Node.js + Express.js

- RESTful API with 49+ endpoints- **Database:** MySQL 8.0+

- WebSocket support via Socket.IO for real-time updates- **Real-time:** Socket.IO

- JWT authentication with access and refresh tokens- **Authentication:** JWT (Access & Refresh tokens)

- Input validation using express-validator- **Security:** bcrypt, helmet, rate limiting

- Rate limiting (100 req/15 min)

- CORS protection with configurable origins### Frontend

- SQL injection prevention via parameterized queries- **Framework:** React 19+ with Vite

- **Styling:** Tailwind CSS

---- **State Management:** Context API

- **Routing:** React Router v7

## 📋 System Requirements- **API Client:** Axios with interceptors

- **Real-time:** Socket.IO Client

### Prerequisites

- **Node.js** >= 16.0.0## 🗂️ Project Structure

- **npm** >= 8.0.0

- **MySQL** >= 8.0```

resculance_api/

---├── src/                        # Backend source code

│   ├── config/                 # Configuration files

## 📦 Installation│   ├── controllers/            # Request handlers

│   ├── middleware/             # Auth, validation, error handling

### Backend Setup│   ├── models/                 # Database models

│   ├── routes/                 # API routes

```bash│   ├── socket/                 # WebSocket handlers

# Install dependencies│   ├── database/               # Migrations & seeds

npm install│   └── server.js               # Entry point

├── frontend/                   # React application

# Dependencies installed:│   ├── src/

# - express (v4.18.2) - Web framework│   │   ├── components/         # Reusable UI components

# - mysql2 (v3.6.0) - MySQL client│   │   ├── contexts/           # React Context providers

# - socket.io (v4.6.0) - WebSocket support│   │   ├── pages/              # Route pages

# - jsonwebtoken (v9.0.2) - JWT authentication│   │   ├── services/           # API & Socket services

# - bcrypt (v5.1.1) - Password hashing│   │   └── utils/              # Helper functions

# - express-validator (v7.0.1) - Input validation│   └── public/                 # Static assets

# - helmet (v7.1.0) - Security headers├── .env.example               # Environment template

# - cors (v2.8.5) - CORS middleware├── package.json               # Backend dependencies

```└── API_DOCUMENTATION.md       # Complete API docs

```

### Frontend Setup

## 🔐 User Roles

```bash

cd frontend| Role | Organization | Permissions |

npm install|------|-------------|-------------|

| `superadmin` | System | Full system access |

# Dependencies installed:| `hospital_admin` | Hospital | Manage hospital & staff |

# - react (v19.1.0) - UI library| `hospital_staff` | Hospital | Limited operations |

# - vite (v7.1.3) - Build tool| `hospital_doctor` | Hospital | Patient care & monitoring |

# - tailwindcss (v3.4.17) - CSS framework| `hospital_paramedic` | Hospital | Vital signs entry |

# - axios (v1.13.0) - HTTP client| `fleet_admin` | Fleet | Manage fleet & staff |

# - socket.io-client (v4.8.1) - WebSocket client| `fleet_staff` | Fleet | Limited operations |

# - react-toastify (v11.0.3) - Notifications| `fleet_doctor` | Fleet | Patient care in ambulance |

```| `fleet_paramedic` | Fleet | Ambulance operations |



---## 🛠️ Development Scripts



## ⚙️ Configuration### Backend

```bash

### Backend Environment Variablesnpm run dev        # Start with nodemon (auto-reload)

npm start          # Start production server

Create `.env` file in the project root:npm run migrate    # Run database migrations

npm run seed       # Seed initial data

```env```

# Server Configuration

NODE_ENV=development### Frontend

PORT=5001```bash

npm run dev        # Start dev server (Vite HMR)

# Database Configurationnpm run build      # Build for production

DB_HOST=localhostnpm run preview    # Preview production build

DB_PORT=3306npm run lint       # Run ESLint

DB_USER=root```

DB_PASSWORD=your_mysql_password

DB_NAME=resculance_db## 📡 API Endpoints Overview



# JWT Configuration### Authentication

JWT_SECRET=your_super_secret_jwt_key_change_this_32_chars_minimum- `POST /api/v1/auth/register` - Register new user

JWT_REFRESH_SECRET=your_refresh_token_secret_32_chars_minimum- `POST /api/v1/auth/login` - User login

JWT_EXPIRE=7d- `POST /api/v1/auth/refresh-token` - Refresh access token

JWT_REFRESH_EXPIRE=30d- `GET /api/v1/auth/profile` - Get user profile

- `PUT /api/v1/auth/change-password` - Change password

# CORS Configuration

CORS_ORIGIN=http://localhost:5173### Organizations (49 total endpoints)

- CRUD operations for hospitals & fleet owners

# Rate Limiting- User management within organizations

RATE_LIMIT_WINDOW_MS=900000- Ambulance fleet management

RATE_LIMIT_MAX_REQUESTS=100- Patient records & sessions

```- Real-time vital signs monitoring

- Collaboration requests

### Frontend Environment Variables

**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference.**

Create `.env` file in the `frontend` directory:

## 🌐 WebSocket Events

```env

# API ConfigurationReal-time communication for:

VITE_API_BASE_URL=http://localhost:5001/api/v1- Location tracking (`location_update`)

VITE_SOCKET_URL=http://localhost:5001- Vital signs (`vital_update`)

```- Messaging (`message`)

- Audio/Video calls (`call_request`, `video_request`)

---- Emergency alerts (`emergency_alert`)

- Patient status (`patient_onboarded`, `patient_offboarded`)

## 🗄️ Database Setup

## 🚀 Deployment

### Step 1: Create Database

### Production Build

```sql

-- Connect to MySQL**Backend:**

mysql -u root -p```bash

npm install --production

-- Create databaseNODE_ENV=production node src/server.js

CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;```

```

**Frontend:**

### Step 2: Run Migrations```bash

cd frontend

```bashnpm run build

npm run migrate# Serve the 'dist' folder with Nginx/Apache

``````



This creates 12+ tables including organizations, users, ambulances, patients, patient_sessions, vital_signs, communications, collaboration_requests, audit_logs, and refresh_tokens.### Environment Variables



### Step 3: Seed Initial Data**Backend:**

- `NODE_ENV=production`

```bash- `JWT_SECRET` - Strong secret (32+ characters)

npm run seed- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Production database

```- `CORS_ORIGIN` - Production frontend URL



Creates superadmin user:**Frontend:**

- Email: `superadmin@resculance.com`- `VITE_API_BASE_URL` - Production API URL

- Password: `Admin@123`- `VITE_SOCKET_URL` - Production Socket.IO URL

- ⚠️ **Change immediately after first login!**

**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete deployment guide.**

---

## 🔒 Security Features

## 🎬 Running the Application

- ✅ JWT-based authentication with refresh tokens

### Development Mode- ✅ Password hashing with bcrypt

- ✅ Role-based access control (RBAC)

**Backend (with auto-reload):**- ✅ Rate limiting (100 requests/15 minutes)

```bash- ✅ CORS protection

npm run dev- ✅ SQL injection prevention (parameterized queries)

# Server runs at http://localhost:5001- ✅ Helmet.js security headers

```- ✅ Input validation & sanitization

- ✅ Audit logging for compliance

**Frontend (with HMR):**

```bash## 📊 Database

cd frontend

npm run dev**MySQL 8.0+** with the following tables:

# App runs at http://localhost:5173- Organizations

```- Users

- Ambulances

### Production Mode- Patients

- Patient Sessions

**Backend:**- Vital Signs

```bash- Communications

NODE_ENV=production npm start- Collaboration Requests

```- Audit Logs



**Frontend:****See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema reference.**

```bash

cd frontend## 🤝 Contributing

npm run build

# Serve the 'dist' folder with Nginx/Apache1. Fork the repository

```2. Create a feature branch (`git checkout -b feature/amazing-feature`)

3. Commit your changes (`git commit -m 'Add amazing feature'`)

---4. Push to the branch (`git push origin feature/amazing-feature`)

5. Open a Pull Request

## 📡 API Documentation

## 🐛 Troubleshooting

### Base URL

```Common issues and solutions are documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#troubleshooting).

http://localhost:5001/api/v1

```## 📝 License



### AuthenticationISC License - See LICENSE file for details

Include JWT token in the Authorization header:

## 👥 Team

```http

Authorization: Bearer <your_access_token>**RESCULANCE Team** - Emergency Response Management System

```

## 📞 Support

### Main Endpoint Categories

For issues or questions:

#### 1. Authentication (`/auth`)- Open an issue on GitHub

- `POST /auth/register` - Register new user- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

- `POST /auth/login` - User login- Review existing documentation files

- `POST /auth/refresh-token` - Refresh access token

- `GET /auth/profile` - Get current user profile---

- `PUT /auth/change-password` - Change password

**Version:** 1.0.0  

#### 2. Organizations (`/organizations`)**Last Updated:** November 2025 - Smart Ambulance Management Platform

- `POST /organizations` - Create organization (Superadmin)

- `GET /organizations` - List all organizationsA comprehensive Node.js REST API with real-time communication capabilities for managing ambulance operations, connecting hospitals, fleet owners, doctors, paramedics, and patients.

- `GET /organizations/:id` - Get organization details

- `PUT /organizations/:id` - Update organization## 🚀 Features

- `DELETE /organizations/:id` - Delete organization

- `PATCH /organizations/:id/suspend` - Suspend organization- **Multi-Organization Support**: Hospitals and Fleet Owners with independent management

- `PATCH /organizations/:id/activate` - Activate organization- **Role-Based Access Control (RBAC)**: 9 different user roles with granular permissions

- **Ambulance Management**: Complete lifecycle management with approval workflows

#### 3. Users (`/users`)- **Patient Sessions**: Real-time patient onboarding, monitoring, and offboarding

- `POST /users` - Create user (Admins)- **Smart Device Integration**: Support for medical devices (ECG, BP monitors, pulse oximeters, etc.)

- `GET /users` - List users- **Real-Time Dashboard**: Socket.IO powered live updates for vital signs and location

- `GET /users/:id` - Get user details- **Communication Hub**: Text, audio, and video communication between doctors and paramedics

- `PUT /users/:id` - Update user- **Collaboration System**: Fleet owners can provide ambulances to hospitals

- `PATCH /users/:id/approve` - Approve user- **Audit Logging**: Complete activity tracking for accountability

- `PATCH /users/:id/reject` - Reject user- **Data Privacy**: Selective data hiding for sensitive patient information

- `PATCH /users/:id/suspend` - Suspend user

- `DELETE /users/:id` - Delete user## 📋 Prerequisites



#### 4. Ambulances (`/ambulances`)Before you begin, ensure you have the following installed:

- `POST /ambulances` - Create ambulance- **Node.js** (v16.0.0 or higher)

- `GET /ambulances` - List ambulances- **npm** (v8.0.0 or higher)

- `GET /ambulances/my-ambulances` - Get user's ambulances- **MySQL** (v8.0 or higher)

- `GET /ambulances/:id` - Get ambulance details

- `PUT /ambulances/:id` - Update ambulance## 🛠️ Installation

- `PATCH /ambulances/:id/approve` - Approve ambulance (Superadmin)

- `POST /ambulances/:id/assign-user` - Assign staff### 1. Clone the repository (or navigate to project directory)

- `DELETE /ambulances/:id/unassign-user/:userId` - Unassign staff

- `PATCH /ambulances/:id/location` - Update location```powershell

cd "d:\Projects\RESCULANCE API"

#### 5. Patients (`/patients`)```

- `POST /patients` - Create patient

- `GET /patients` - List patients### 2. Install dependencies

- `GET /patients/code/:code` - Get patient by code

- `GET /patients/:id` - Get patient details```powershell

- `PUT /patients/:id` - Update patientnpm install

- `PATCH /patients/:id/hide-data` - Hide patient data```

- `PATCH /patients/:id/unhide-data` - Unhide patient data

### 3. Set up environment variables

#### 6. Patient Sessions (`/patients/*`)

- `POST /patients/onboard` - Onboard patient to ambulanceCopy the `.env.example` file to create your `.env` file:

- `PATCH /sessions/:sessionId/offboard` - Offboard patient

- `GET /sessions` - List sessions```powershell

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
