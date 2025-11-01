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
          patientService.getAll(),
          patientService.getSessions({ status: 'onboarded' })
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
          organizations: orgs.data?.organizations?.length || orgs.data?.pagination?.total || 0,
          users: users.data?.users?.length || users.data?.pagination?.total || 0,
          ambulances: ambulances.data?.ambulances?.length || ambulances.data?.pagination?.total || 0,
          activeAmbulances: ambulances.data?.ambulances?.filter(a => a.status === 'active' || a.status === 'en_route').length || 0,
          patients: patients.data?.patients?.length || patients.data?.pagination?.total || 0,
          activeSessions: 0,
        });
      } else if (user.role.includes('hospital')) {
        const [users, patients, sessions] = results;
        setStats({
          users: users.data?.users?.length || users.data?.pagination?.total || 0,
          patients: patients.data?.patients?.length || patients.data?.pagination?.total || 0,
          activeSessions: sessions.data?.sessions?.length || sessions.data?.pagination?.total || 0,
        });
      } else if (user.role.includes('fleet')) {
        const [ambulances, users, patients] = results;
        setStats({
          ambulances: ambulances.data?.ambulances?.length || ambulances.data?.pagination?.total || 0,
          activeAmbulances: ambulances.data?.ambulances?.filter(a => a.status === 'active' || a.status === 'en_route').length || 0,
          users: users.data?.users?.length || users.data?.pagination?.total || 0,
          patients: patients.data?.patients?.length || patients.data?.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Don't show error toast here as api.js already handles it
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

  const StatCard = ({ icon, label, value, subtitle, color = 'cyan' }) => {
    const colorClasses = {
      cyan: 'from-cyan-500 to-cyan-600',
      purple: 'from-purple-500 to-purple-600',
      emerald: 'from-emerald-500 to-emerald-600',
      red: 'from-red-500 to-red-600',
      blue: 'from-blue-500 to-blue-600',
      amber: 'from-amber-500 to-amber-600',
    };

    return (
      <div className="metric-card relative overflow-hidden group cursor-pointer">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg mb-3 transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>}
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Live Status */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="text-4xl">🏥</span>
            Emergency Operations Dashboard
          </h1>
          <p className="page-subtitle">Real-time emergency response monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot"></span>
            System Active
          </span>
          <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
            {user?.role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'superadmin' && (
          <>
            <StatCard
              icon="🏢"
              label="Organizations"
              value={stats.organizations}
              subtitle="Total registered"
              color="cyan"
            />
            <StatCard
              icon="👥"
              label="Total Users"
              value={stats.users}
              subtitle="All system users"
              color="purple"
            />
            <StatCard
              icon="🚑"
              label="Ambulances"
              value={`${stats.activeAmbulances}/${stats.ambulances}`}
              subtitle="Active / Total fleet"
              color="emerald"
            />
            <StatCard
              icon="❤️"
              label="Patients"
              value={stats.patients}
              subtitle="Total served"
              color="red"
            />
          </>
        )}

        {user.role.includes('hospital') && (
          <>
            <StatCard
              icon="👨‍⚕️"
              label="Medical Staff"
              value={stats.users}
              subtitle="Total staff members"
              color="cyan"
            />
            <StatCard
              icon="❤️"
              label="Total Patients"
              value={stats.patients}
              subtitle="All patient records"
              color="emerald"
            />
            <StatCard
              icon="📊"
              label="Active Sessions"
              value={stats.activeSessions}
              subtitle="Currently onboarded"
              color="purple"
            />
            <StatCard
              icon="🚨"
              label="Emergency"
              value="0"
              subtitle="Critical alerts"
              color="red"
            />
          </>
        )}

        {user.role.includes('fleet') && (
          <>
            <StatCard
              icon="🚑"
              label="Fleet Status"
              value={`${stats.activeAmbulances}/${stats.ambulances}`}
              subtitle="Active ambulances"
              color="emerald"
            />
            <StatCard
              icon="�"
              label="Drivers & Medics"
              value={stats.users}
              subtitle="Total staff"
              color="cyan"
            />
            <StatCard
              icon="❤️"
              label="Patients Served"
              value={stats.patients}
              subtitle="Total transported"
              color="purple"
            />
            <StatCard
              icon="📍"
              label="En Route"
              value={stats.activeAmbulances}
              subtitle="Active missions"
              color="amber"
            />
          </>
        )}
      </div>

      {/* Welcome Card - Medical Dashboard Style */}
      <div className="card animate-slide-up">
        <div className="card-body">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-4xl shadow-xl transform hover:scale-105 transition-transform">
              �
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">RESCULANCE Emergency Response</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Real-time emergency medical services management platform. Monitor ambulance fleet, track patient vitals, 
                coordinate with hospitals, and manage emergency response operations efficiently.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot"></span>
                  <span className="text-emerald-700 dark:text-emerald-300">GPS Tracking Active</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full pulse-dot"></span>
                  <span className="text-blue-700 dark:text-blue-300">WebSocket Connected</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span>🔐</span>
                  <span>Logged in as {user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Medical Style */}
      {user.role === 'superadmin' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="card-title">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/organizations" className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="text-4xl mb-3">🏢</div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1 text-lg">Manage Organizations</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Register hospitals & fleet owners</div>
              </a>
              <a href="/users" className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="text-4xl mb-3">👥</div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1 text-lg">Manage Users</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">View and manage user accounts</div>
              </a>
              <a href="/ambulances" className="group p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="text-4xl mb-3">🚑</div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1 text-lg">Manage Fleet</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Track ambulances & equipment</div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
