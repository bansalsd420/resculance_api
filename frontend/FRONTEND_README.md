# RESCULANCE Frontend

React-based frontend for the RESCULANCE Emergency Response Management System.

## Features

- ✅ **Authentication**: Login with JWT tokens and automatic refresh
- ✅ **Role-Based Access**: 7 different user roles with appropriate permissions
- ✅ **Organizations Management**: Create and manage hospitals and fleet owners
- ✅ **User Management**: Create, approve, and assign users
- ✅ **Ambulance Management**: Track ambulances, assign staff, manage status
- ✅ **Patient Management**: Create patients, onboard to ambulances, record vital signs
- ✅ **Collaboration Requests**: Hospital-Fleet collaboration workflow
- ✅ **Real-Time Updates**: Socket.IO integration for live data
- ✅ **Minimalistic Design**: Black and white theme with Tailwind CSS
- ✅ **Responsive UI**: Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** with Vite
- **React Router** for routing
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **React Hook Form** for form handling
- **React Toastify** for notifications
- **Leaflet** for maps integration

## Installation & Setup

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

The app will be available at `http://localhost:5173`

## Default Login

- Email: `superadmin@resculance.com`
- Password: `Admin@123`

## Environment Variables

Create a `.env` file:

\`\`\`env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
\`\`\`

## Project Structure

\`\`\`
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts
├── pages/           # Page components
├── services/        # API services
├── utils/           # Utilities
└── styles.css       # Global styles
\`\`\`

## Build for Production

\`\`\`bash
npm run build
\`\`\`
