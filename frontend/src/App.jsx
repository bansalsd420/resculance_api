import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/auth/Login';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { NotFound } from './pages/NotFound';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Organizations } from './pages/organizations/Organizations';
import { Users } from './pages/users/Users';
import { Ambulances } from './pages/ambulances/Ambulances';
import { Patients } from './pages/patients/Patients';
import { Onboarding } from './pages/onboarding/Onboarding';
import OnboardingDetail from './pages/onboarding/OnboardingDetailNew';
import { Collaborations } from './pages/collaborations/Collaborations';
import Activity from './pages/activity/Activity';
import { Settings } from './pages/settings/Settings';
import Notifications from './pages/notifications/Notifications';
import { useAuthStore } from './store/authStore';
import { PERMISSIONS } from './utils/permissions';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Register removed - users should be created by admins only */}

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ALL_ORGANIZATIONS}>
                <MainLayout>
                  <Organizations />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute 
                requiredPermissions={[PERMISSIONS.VIEW_ALL_USERS, PERMISSIONS.VIEW_OWN_ORG_USERS]}
              >
                <MainLayout>
                  <Users />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ambulances"
            element={
              <ProtectedRoute 
                requiredPermissions={[
                  PERMISSIONS.VIEW_ALL_AMBULANCES,
                  PERMISSIONS.VIEW_OWN_AMBULANCES,
                  PERMISSIONS.VIEW_ASSIGNED_AMBULANCES,
                  PERMISSIONS.VIEW_PARTNERED_AMBULANCES
                ]}
              >
                <MainLayout>
                  <Ambulances />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PATIENTS}>
                <MainLayout>
                  <Patients />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.ONBOARD_PATIENT}>
                <MainLayout>
                  <Onboarding />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/:sessionId"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.ONBOARD_PATIENT}>
                <MainLayout>
                  <OnboardingDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/collaborations"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_COLLABORATIONS}>
                <MainLayout>
                  <Collaborations />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ACTIVITY_LOGS}>
                <MainLayout>
                  <Activity />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
  );
}

export default App;
