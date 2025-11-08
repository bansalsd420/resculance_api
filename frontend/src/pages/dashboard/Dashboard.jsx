import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Ambulance, Users, Activity, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { dashboardService } from '../../services';
import { useToast } from '../../hooks/useToast';
import getErrorMessage from '../../utils/getErrorMessage';

const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colors = {
    primary: 'bg-black',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-secondary text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold font-display mb-2">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`${colors[color]} w-12 h-12 rounded-2xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // Global cache reset handler
  useEffect(() => {
    const handler = async () => {
      try {
        await fetchStats();
      } catch (err) {
        console.error('Global reset handler failed for dashboard', err);
      } finally {
        window.dispatchEvent(new CustomEvent('global:cache-reset-done', { detail: { page: 'dashboard' } }));
      }
    };
    window.addEventListener('global:cache-reset', handler);
    return () => window.removeEventListener('global:cache-reset', handler);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
  const msg = getErrorMessage(error, 'Failed to load dashboard statistics');
  toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
  <h1 className="text-3xl font-display font-bold mt-5 mb-2">
          Welcome back, {user?.firstName} {user?.lastName}! 👋
        </h1>
        <p className="text-secondary">
          Here's what's happening with your Resculance platform today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'superadmin' && (
          <>
            <StatCard
              title="Total Organizations"
              value={loading ? '...' : stats.totalOrganizations || 0}
              icon={Building2}
              color="primary"
            />
            <StatCard
              title="Total Hospitals"
              value={loading ? '...' : stats.totalHospitals || 0}
              icon={Building2}
              color="success"
            />
            <StatCard
              title="Total Fleets"
              value={loading ? '...' : stats.totalFleets || 0}
              icon={Building2}
              color="info"
            />
          </>
        )}
        <StatCard
          title={user?.role === 'superadmin' ? 'Total Users' : 'Team Members'}
          value={loading ? '...' : stats.totalUsers || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Ambulances"
          value={loading ? '...' : stats.totalAmbulances || 0}
          icon={Ambulance}
          color="success"
        />
        <StatCard
          title="Active Trips"
          value={loading ? '...' : stats.activeTrips || 0}
          icon={Activity}
          color="warning"
        />
        <StatCard
          title="Total Patients"
          value={loading ? '...' : stats.totalPatients || 0}
          icon={Users}
          color="info"
        />
        <StatCard
          title="Collaborations"
          value={loading ? '...' : stats.totalCollaborations || 0}
          icon={Building2}
          color="success"
        />
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <h3 className="text-xl font-display font-semibold mb-4">System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-background rounded-xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-2xl font-bold mb-1">{loading ? '...' : stats.activeTrips || 0}</h4>
            <p className="text-secondary text-sm">Active Emergency Trips</p>
          </div>
          <div className="text-center p-4 bg-background rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ambulance className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-2xl font-bold mb-1">{loading ? '...' : stats.totalAmbulances || 0}</h4>
            <p className="text-secondary text-sm">Available Ambulances</p>
          </div>
          <div className="text-center p-4 bg-background rounded-xl">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-2xl font-bold mb-1">{loading ? '...' : stats.totalPatients || 0}</h4>
            <p className="text-secondary text-sm">Total Patients Served</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
