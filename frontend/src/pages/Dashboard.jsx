import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import { organizationService, userService, ambulanceService, patientService } from '../services/api.service';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    organizations: 0,
    users: 0,
    ambulances: 0,
    patients: 0,
    activeAmbulances: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const promises = [];
      
      if (user.role === 'superadmin') {
        promises.push(
          organizationService.getAll(),
          userService.getAll(),
          ambulanceService.getAll(),
          patientService.getAll()
        );
      } else if (user.role.includes('hospital')) {
        promises.push(
          userService.getAll(),
          patientService.getAll()
        );
      } else if (user.role.includes('fleet')) {
        promises.push(
          ambulanceService.getAll(),
          userService.getAll(),
          patientService.getAll()
        );
      }

      const results = await Promise.all(promises);
      
      if (user.role === 'superadmin') {
        const [orgs, users, ambulances, patients] = results;
        setStats({
          organizations: orgs.data.length,
          users: users.data.length,
          ambulances: ambulances.data.length,
          activeAmbulances: ambulances.data.filter(a => a.status === 'active').length,
          patients: patients.data.length,
          activeSessions: 0,
        });
      } else if (user.role.includes('hospital')) {
        const [users, patients] = results;
        setStats({
          users: users.data.length,
          patients: patients.data.length,
          activeSessions: 0,
        });
      } else if (user.role.includes('fleet')) {
        const [ambulances, users, patients] = results;
        setStats({
          ambulances: ambulances.data.length,
          activeAmbulances: ambulances.data.filter(a => a.status === 'active').length,
          users: users.data.length,
          patients: patients.data.length,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  const StatCard = ({ icon, label, value, subtitle, bgColor = 'bg-blue-500' }) => (
    <div className="stat-card">
      <div className={`stat-card-icon ${bgColor}`}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
        {user.role === 'superadmin' && (
          <>
            <StatCard
              icon="🏢"
              label="Organizations"
              value={stats.organizations}
              subtitle="Total organizations"
              bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon="👥"
              label="Total Users"
              value={stats.users}
              subtitle="Across all organizations"
              bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon="🚑"
              label="Ambulances"
              value={`${stats.activeAmbulances}/${stats.ambulances}`}
              subtitle="Active / Total"
              bgColor="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon="🏥"
              label="Patients"
              value={stats.patients}
              subtitle="Total patients"
              bgColor="bg-gradient-to-br from-red-500 to-red-600"
            />
          </>
        )}

        {user.role.includes('hospital') && (
          <>
            <StatCard
              icon="👥"
              label="Staff Members"
              value={stats.users}
              subtitle="Total staff"
              bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon="🏥"
              label="Total Patients"
              value={stats.patients}
              subtitle="All patients"
              bgColor="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon="📊"
              label="Active Sessions"
              value={stats.activeSessions}
              subtitle="Currently active"
              bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </>
        )}

        {user.role.includes('fleet') && (
          <>
            <StatCard
              icon="🚑"
              label="Ambulances"
              value={`${stats.activeAmbulances}/${stats.ambulances}`}
              subtitle="Active / Total"
              bgColor="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon="👥"
              label="Staff Members"
              value={stats.users}
              subtitle="Total staff"
              bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon="🏥"
              label="Patients Served"
              value={stats.patients}
              subtitle="Total patients"
              bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </>
        )}
      </div>

      {/* Welcome Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl flex items-center justify-center text-4xl shadow-xl">
              👋
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">Welcome to RESCULANCE</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Emergency Response Management System - Your comprehensive platform for managing emergency medical services.
                Use the sidebar navigation to access different sections and manage your operations efficiently.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-700">System Operational</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold">
                  <span>Role:</span>
                  <span className="text-gray-900">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user.role === 'superadmin' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/organizations" className="quick-action-card group">
                <div className="quick-action-icon">🏢</div>
                <div className="quick-action-title">Manage Organizations</div>
                <div className="quick-action-description">Create and manage organizations</div>
              </a>
              <a href="/users" className="quick-action-card group">
                <div className="quick-action-icon">👥</div>
                <div className="quick-action-title">Manage Users</div>
                <div className="quick-action-description">View and approve users</div>
              </a>
              <a href="/ambulances" className="quick-action-card group">
                <div className="quick-action-icon">🚑</div>
                <div className="quick-action-title">Manage Ambulances</div>
                <div className="quick-action-description">Track and manage fleet</div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
