# RESCULANCE API - Smart Ambulance Management Platform

A comprehensive Node.js REST API with real-time communication capabilities for managing ambulance operations, connecting hospitals, fleet owners, doctors, paramedics, and patients.

## 🚀 Features

- **Multi-Organization Support**: Hospitals and Fleet Owners with independent management
- **Role-Based Access Control (RBAC)**: 9 different user roles with granular permissions
- **Ambulance Management**: Complete lifecycle management with approval workflows
- **Patient Sessions**: Real-time patient onboarding, monitoring, and offboarding
- **Smart Device Integration**: Support for medical devices (ECG, BP monitors, pulse oximeters, etc.)
- **Real-Time Dashboard**: Socket.IO powered live updates for vital signs and location
- **Communication Hub**: Text, audio, and video communication between doctors and paramedics
- **Collaboration System**: Fleet owners can provide ambulances to hospitals
- **Audit Logging**: Complete activity tracking for accountability
- **Data Privacy**: Selective data hiding for sensitive patient information

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MySQL** (v8.0 or higher)

## 🛠️ Installation

### 1. Clone the repository (or navigate to project directory)

```powershell
cd "d:\Projects\RESCULANCE API"
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Set up environment variables

Copy the `.env.example` file to create your `.env` file:

```powershell
Copy-Item .env.example .env
```

Then edit the `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=resculance_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Other settings (review .env.example for all options)
```

### 4. Create the database

Open MySQL and create the database:

```sql
CREATE DATABASE resculance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run database migrations

```powershell
npm run migrate
```

### 6. Seed initial data (creates superadmin)

```powershell
npm run seed
```

**Default Superadmin Credentials:**
- Email: `superadmin@resculance.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 🚀 Running the Application

### Development Mode (with auto-reload)

```powershell
npm run dev
```

### Production Mode

```powershell
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password
- `POST /auth/refresh-token` - Refresh access token

#### Organizations
- `POST /organizations` - Create organization (Superadmin only)
- `GET /organizations` - List all organizations
- `GET /organizations/:id` - Get organization details
- `PUT /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization
- `PATCH /organizations/:id/suspend` - Suspend organization
- `PATCH /organizations/:id/activate` - Activate organization

#### Users
- `POST /users` - Create user (Admin only)
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `PATCH /users/:id/approve` - Approve user (Admin only)
- `PATCH /users/:id/suspend` - Suspend user
- `DELETE /users/:id` - Delete user

#### Ambulances
- `POST /ambulances` - Create ambulance
- `GET /ambulances` - List ambulances
- `GET /ambulances/my-ambulances` - Get ambulances mapped to current user
- `GET /ambulances/:id` - Get ambulance details
- `PUT /ambulances/:id` - Update ambulance
- `PATCH /ambulances/:id/approve` - Approve ambulance (Superadmin only)
- `POST /ambulances/:id/assign-user` - Assign doctor/paramedic to ambulance
- `DELETE /ambulances/:id/unassign-user/:userId` - Unassign user
- `GET /ambulances/:id/assigned-users` - Get assigned users
- `PATCH /ambulances/:id/location` - Update ambulance location
- `DELETE /ambulances/:id` - Delete ambulance

#### Patients
- `POST /patients` - Create patient
- `GET /patients` - List patients
- `GET /patients/code/:code` - Get patient by code
- `PUT /patients/:id` - Update patient
- `PATCH /patients/:id/hide-data` - Hide patient data
- `PATCH /patients/:id/unhide-data` - Unhide patient data

#### Patient Sessions
- `POST /patients/onboard` - Onboard patient to ambulance
- `PATCH /patients/sessions/:sessionId/offboard` - Offboard patient
- `GET /patients/sessions` - List patient sessions
- `GET /patients/sessions/:sessionId` - Get session details
- `POST /patients/sessions/:sessionId/vitals` - Add vital signs
- `POST /patients/sessions/:sessionId/communications` - Log communication

#### Collaboration Requests
- `POST /collaborations` - Create collaboration request (Hospital)
- `GET /collaborations` - List collaboration requests
- `GET /collaborations/:id` - Get request details
- `PATCH /collaborations/:id/accept` - Accept request (Fleet Owner)
- `PATCH /collaborations/:id/reject` - Reject request (Fleet Owner)
- `PATCH /collaborations/:id/cancel` - Cancel request (Hospital)

## 🔌 WebSocket Events (Socket.IO)

Connect to Socket.IO with authentication token:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'your_jwt_token' }
});
```

### Available Events

#### Client → Server
- `join_ambulance` - Join ambulance room
- `leave_ambulance` - Leave ambulance room
- `join_session` - Join patient session room
- `leave_session` - Leave session room
- `vital_update` - Send vital signs update
- `location_update` - Send ambulance location
- `message` - Send text message
- `call_request` - Initiate audio call
- `call_answer` - Answer call
- `call_end` - End call
- `video_request` - Initiate video call
- `video_answer` - Answer video call
- `video_end` - End video call
- `emergency_alert` - Send emergency alert

#### Server → Client
- `joined_ambulance` - Confirmation of joining ambulance room
- `joined_session` - Confirmation of joining session room
- `vital_update` - Real-time vital signs updates
- `location_update` - Real-time location updates
- `message` - Receive messages
- `call_request` - Incoming call request
- `call_answer` - Call answered/rejected
- `call_end` - Call ended
- `video_request` - Incoming video call
- `video_answer` - Video call answered/rejected
- `video_end` - Video call ended
- `patient_onboarded` - Patient onboarded notification
- `patient_offboarded` - Patient offboarded notification
- `emergency_alert` - Emergency alert notification

## 👥 User Roles & Permissions

### Superadmin
- Complete system access
- Create/manage all organizations
- Approve ambulances and users
- Global monitoring

### Hospital Admin
- Manage hospital users
- Create/manage ambulances
- Onboard patients
- Manage data visibility

### Hospital Staff
- Same as Hospital Admin except user management

### Hospital Doctor
- View ambulance dashboards (when patient onboarded)
- Access patient data
- Communicate with paramedics

### Hospital Paramedic
- Access ambulance dashboards anytime
- Onboard patients
- Update vital signs
- Communicate with doctors

### Fleet Admin
- Manage fleet users
- Create/manage ambulances
- Accept/reject collaboration requests
- Control ambulance assignments

### Fleet Staff
- Similar to Fleet Admin except user management

### Fleet Doctor & Fleet Paramedic
- Same functions as hospital counterparts within fleet context

## 🗄️ Database Schema

The system uses MySQL with the following main tables:

- `organizations` - Hospitals and Fleet Owners
- `users` - All user accounts with roles
- `ambulances` - Ambulance fleet
- `smart_devices` - Medical devices in ambulances
- `ambulance_user_mappings` - Doctor/Paramedic assignments
- `patients` - Patient master data
- `patient_sessions` - Active/historical patient trips
- `vital_signs` - Real-time vital signs data
- `communications` - Chat/call/video logs
- `collaboration_requests` - Fleet-Hospital collaborations
- `audit_logs` - Activity tracking
- `refresh_tokens` - JWT refresh tokens

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Organization-level data isolation
- Rate limiting
- Helmet.js security headers
- CORS protection
- SQL injection prevention (parameterized queries)
- Audit logging for accountability

## 📊 Health Check

Check if the API is running:

```
GET http://localhost:5000/health
```

Response:
```json
{
  "status": "OK",
  "message": "RESCULANCE API is running",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

## 🧪 Testing

You can test the API using:
- **Postman** - Import endpoints and test
- **Thunder Client** (VS Code Extension)
- **curl** commands

Example login request:

```powershell
curl -X POST http://localhost:5000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"superadmin@resculance.com","password":"Admin@123"}'
```

## 📁 Project Structure

```
RESCULANCE API/
├── src/
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   └── constants.js       # System constants
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── organizationController.js
│   │   ├── userController.js
│   │   ├── ambulanceController.js
│   │   ├── patientController.js
│   │   └── collaborationController.js
│   ├── database/
│   │   ├── migrate.js         # Database migrations
│   │   └── seed.js            # Initial data seeding
│   ├── middleware/
│   │   ├── auth.js            # Authentication & authorization
│   │   ├── validation.js      # Input validation
│   │   ├── errorHandler.js    # Error handling
│   │   └── audit.js           # Audit logging
│   ├── models/                # Database models
│   │   ├── Organization.js
│   │   ├── User.js
│   │   ├── Ambulance.js
│   │   ├── Patient.js
│   │   ├── PatientSession.js
│   │   ├── CollaborationRequest.js
│   │   ├── VitalSign.js
│   │   └── Communication.js
│   ├── routes/                # API routes
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── organizationRoutes.js
│   │   ├── userRoutes.js
│   │   ├── ambulanceRoutes.js
│   │   ├── patientRoutes.js
│   │   └── collaborationRoutes.js
│   ├── socket/
│   │   └── socketHandler.js   # WebSocket handlers
│   └── server.js              # Main application entry
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Or stop the process using port 5000

### JWT Token Errors
- Ensure JWT_SECRET is set in `.env`
- Check token expiry time
- Verify token format in Authorization header

## 🚀 Deployment

### Production Checklist
1. Change all default passwords
2. Set strong JWT_SECRET
3. Enable HTTPS
4. Configure CORS properly
5. Set NODE_ENV=production
6. Use environment-specific database
7. Enable proper logging
8. Set up monitoring
9. Configure firewall rules
10. Regular backups

## 📝 License

ISC

## 👨‍💻 Support

For issues and questions:
- Create an issue in the repository
- Contact: support@resculance.com

## 🎯 Future Enhancements

- Mobile app integration
- Advanced analytics dashboard
- ML-based emergency prediction
- Multi-language support
- Offline mode with sync
- Integration with hospital EMR systems
- Real-time traffic routing
- Automated ambulance dispatch

---

**Built with ❤️ for saving lives**
