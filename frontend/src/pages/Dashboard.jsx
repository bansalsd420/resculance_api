import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user.role === 'superadmin' && (
          <>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Organizations</div>
              <div className="text-3xl font-bold">{stats.organizations}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Total Users</div>
              <div className="text-3xl font-bold">{stats.users}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Ambulances</div>
              <div className="text-3xl font-bold">{stats.activeAmbulances}/{stats.ambulances}</div>
              <div className="text-xs text-gray-500 mt-1">Active / Total</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Patients</div>
              <div className="text-3xl font-bold">{stats.patients}</div>
            </Card>
          </>
        )}

        {user.role.includes('hospital') && (
          <>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Staff Members</div>
              <div className="text-3xl font-bold">{stats.users}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Total Patients</div>
              <div className="text-3xl font-bold">{stats.patients}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Active Sessions</div>
              <div className="text-3xl font-bold">{stats.activeSessions}</div>
            </Card>
          </>
        )}

        {user.role.includes('fleet') && (
          <>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Ambulances</div>
              <div className="text-3xl font-bold">{stats.activeAmbulances}/{stats.ambulances}</div>
              <div className="text-xs text-gray-500 mt-1">Active / Total</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Staff Members</div>
              <div className="text-3xl font-bold">{stats.users}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 mb-2">Patients Served</div>
              <div className="text-3xl font-bold">{stats.patients}</div>
            </Card>
          </>
        )}
      </div>

      <Card title="Welcome">
        <p className="text-gray-700">
          Welcome to RESCULANCE Emergency Response Management System.
          Use the sidebar to navigate through different sections.
        </p>
      </Card>
    </div>
  );
};
