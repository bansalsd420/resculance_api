# RESCULANCE - Complete Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Backend Setup
\`\`\`bash
# Install dependencies
npm install

# Start server (database already configured)
node src/server.js
\`\`\`
Backend runs at: **http://localhost:5000**

### 2. Frontend Setup
\`\`\`bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`
Frontend runs at: **http://localhost:5173**

### 3. Login
Open `http://localhost:5173` and login with:
- Email: **superadmin@resculance.com**
- Password: **Admin@123**

---

## ✅ Complete Feature List

### Organizations Management
- Create hospitals and fleet owners
- Auto-generated codes (HOSP-XXXX, FLEET-XXXX)

### User Management
- 7 user roles with permissions
- Approve/reject workflow
- Auto-generated usernames

### Ambulance Management
- Create ambulances (BLS/ALS/ICU types)
- Assign staff (doctors, paramedics)
- Real-time location tracking
- Status management

### Patient Management
- Create patient records
- Onboard to ambulances
- Record vital signs
- Add communication notes

### Collaboration Requests
- Hospital creates request to fleet
- Fleet accepts/rejects
- Assign ambulance
- Track lifecycle

---

## 🏗 Architecture

**Backend**: Node.js + Express + MySQL + Socket.IO
**Frontend**: React + Vite + Tailwind CSS + React Router

---

## 📱 User Interface

- **Minimalistic Design**: Black & white theme
- **Responsive**: Desktop, tablet, mobile
- **Components**: Modals, toasts, tables, forms
- **Navigation**: Sidebar with role-based menu

---

## 🧪 Testing

Run automated tests:
\`\`\`bash
.\\test-api.ps1
\`\`\`
Result: **24/24 tests passing**

---

## 📚 Documentation

- `README.md` - Main documentation
- `REACT_FRONTEND_GUIDE.md` - Frontend architecture
- `POSTMAN_GUIDE.md` - API documentation (49 endpoints)
- `API_ENDPOINTS.md` - Endpoint reference
- `frontend/FRONTEND_README.md` - Frontend setup

---

## 🔧 Troubleshooting

**Backend won't start**: Kill port 5000 processes
\`\`\`bash
Get-Process -Name node | Stop-Process -Force
\`\`\`

**Frontend errors**: Ensure backend is running on port 5000

---

**RESCULANCE** - Emergency Response Management System
GitHub: https://github.com/bansalsd420/resculance_api
