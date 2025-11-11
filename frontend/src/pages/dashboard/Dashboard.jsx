import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Ambulance, 
  Users, 
  Activity, 
  TrendingUp, 
  ArrowRight,
  Clock,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle,
  Truck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { dashboardService, activityService } from '../../services';
import { useToast } from '../../hooks/useToast';
import getErrorMessage from '../../utils/getErrorMessage';
import useWithGlobalLoader from '../../hooks/useWithGlobalLoader';

const QuickStatItem = ({ title, value, icon: Icon, color = 'primary', to }) => {
  const colorMap = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-cyan-600 dark:text-cyan-400',
    purple: 'text-purple-600 dark:text-purple-400',
    pink: 'text-pink-600 dark:text-pink-400',
    error: 'text-red-600 dark:text-red-400',
  };

  const ringMap = {
    primary: 'ring-blue-200/60 dark:ring-blue-900/30',
    success: 'ring-green-200/60 dark:ring-green-900/30',
    warning: 'ring-amber-200/60 dark:ring-amber-900/30',
    info: 'ring-cyan-200/60 dark:ring-cyan-900/30',
    purple: 'ring-purple-200/60 dark:ring-purple-900/30',
    pink: 'ring-pink-200/60 dark:ring-pink-900/30',
    error: 'ring-red-200/60 dark:ring-red-900/30',
  };

  const iconColor = colorMap[color] || colorMap.primary;
  const ringColor = ringMap[color] || ringMap.primary;

  const content = (
    <div className="p-3 rounded-lg bg-background dark:bg-gray-800 border border-border flex items-center justify-between transition-colors hover:shadow-sm cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-background-2 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 ring-2 ${ringColor}`}>
          <Icon className={`${iconColor} w-5 h-5`} />
        </div>
        <div>
          <p className="text-text-secondary text-xs font-medium">{title}</p>
          <h3 className="text-text text-lg font-semibold">{value}</h3>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-text-secondary" />
    </div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return <div>{content}</div>;
};

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const runWithLoader = useWithGlobalLoader();

  const timeAgo = (iso) => {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins>1?'s':''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours>1?'s':''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days>1?'s':''} ago`;
  };

  const getIconForActivity = (activity) => {
    if (!activity) return Building2;
    const key = String(activity).toLowerCase();
    if (key.includes('ambulance') || key.includes('dispatch')) return Ambulance;
    if (key.includes('user') || key.includes('register') || key.includes('invite')) return Users;
    if (key.includes('patient') || key.includes('onboard')) return Heart;
    if (key.includes('collaboration') || key.includes('approve') || key.includes('link')) return Building2;
    return MapPin;
  };

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    setLoadingActivities(true);
    try {
      const resp = await activityService.getAll({ page: 1, limit: 6 });
      const acts = resp.data?.activities || [];
      setRecentActivities(acts);
    } catch (err) {
      console.error('Failed to load recent activities', err);
    } finally {
      setLoadingActivities(false);
    }
  };

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
    setLoading(true);
    try {
      await runWithLoader(async () => {
        const response = await dashboardService.getStats();
        if (response.data?.success) {
          setStats(response.data.data);
        }
      }, 'Loading dashboard...');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const msg = getErrorMessage(error, 'Failed to load dashboard statistics');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-display font-bold text-text">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Here's your command center for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Left Sidebar - Slim Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="h-full p-4 space-y-3 overflow-y-auto">
            <div className="pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Quick Stats</h2>
            </div>
            
            <QuickStatItem
              title="Organizations"
              value={loading ? '...' : stats.totalOrganizations || 0}
              icon={Building2}
              color="primary"
              to="/organizations"
            />

            <QuickStatItem
              title="Hospitals"
              value={loading ? '...' : stats.totalHospitals || 0}
              icon={Building2}
              color="success"
              to="/organizations"
            />

            <QuickStatItem
              title="Fleets"
              value={loading ? '...' : stats.totalFleets || 0}
              icon={Truck}
              color="purple"
              to="/organizations"
            />

            <QuickStatItem
              title="Users"
              value={loading ? '...' : stats.totalUsers || 0}
              icon={Users}
              color="info"
              to="/users"
            />

            <QuickStatItem
              title="Ambulances"
              value={loading ? '...' : stats.totalAmbulances || 0}
              icon={Ambulance}
              color="success"
              to="/ambulances"
            />

            <QuickStatItem
              title="Patients"
              value={loading ? '...' : stats.totalPatients || 0}
              icon={Heart}
              color="pink"
              to="/patients"
            />

            <QuickStatItem
              title="Collaborations"
              value={loading ? '...' : stats.totalCollaborations || 0}
              icon={Activity}
              color="purple"
              to="/collaborations"
            />
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-6 overflow-y-auto pr-2"
        >
          {/* Active Operations - Highlight */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Active Operations
                </h2>
                <p className="text-sm text-text-secondary mt-1">Real-time emergency response status</p>
              </div>
              <Link 
                to="/sessions" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Active Trips</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold text-text">{loading ? '...' : stats.activeTrips || 0}</h3>
                  <span className="text-sm text-text-secondary">live now</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Available Units</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold text-text">{loading ? '...' : stats.totalAmbulances || 0}</h3>
                  <span className="text-sm text-text-secondary">ready</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Response Rate</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold text-green-600 dark:text-green-400">98%</h3>
                  <span className="text-sm text-text-secondary">avg</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Recent Activity
                </h3>
                <Link to="/activities" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">View all</Link>
              </div>
              <div className="space-y-3">
                {loadingActivities ? (
                  <div className="space-y-2">
                    {[1,2,3].map((n) => (
                      <div key={n} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 dark:bg-gray-800/40 animate-pulse">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 min-w-0">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (recentActivities.length > 0) ? (
                    recentActivities.map((act) => {
                      const Icon = getIconForActivity(act.activity);
                      return (
                        <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-background dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-lg bg-background-2 dark:bg-gray-800 flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-text-secondary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text">{act.activity || act.comments || 'Activity'}</p>
                            <p className="text-xs text-text-secondary truncate">{act.comments || (act.metadata && JSON.stringify(act.metadata)) || act.organization_name || ''}</p>
                            <p className="text-xs text-text-secondary mt-1">{timeAgo(act.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-text-secondary">No recent activity.</div>
                  )
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  to="/onboarding" 
                  className="p-4 rounded-xl bg-background dark:bg-gray-800 border border-border text-text transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg">Start Emergency Session</p>
                      <p className="text-sm text-text-secondary">Onboard patient & dispatch</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-text-secondary" />
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to="/patients" 
                    className="p-4 rounded-xl bg-background dark:bg-gray-800 border border-border text-text transition-all hover:shadow-sm flex flex-col items-start"
                  >
                    <Heart className="w-8 h-8 mb-2 text-pink-600 dark:text-pink-400" />
                    <p className="font-semibold text-sm">Add Patient</p>
                  </Link>

                  <Link 
                    to="/ambulances" 
                    className="p-4 rounded-xl bg-background dark:bg-gray-800 border border-border text-text transition-all hover:shadow-sm flex flex-col items-start"
                  >
                    <Ambulance className="w-8 h-8 mb-2 text-green-600 dark:text-green-400" />
                    <p className="font-semibold text-sm">Add Ambulance</p>
                  </Link>

                  <Link 
                    to="/users" 
                    className="p-4 rounded-xl bg-background dark:bg-gray-800 border border-border text-text transition-all hover:shadow-sm flex flex-col items-start"
                  >
                    <Users className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-sm">Invite User</p>
                  </Link>

                  <Link 
                    to="/collaborations" 
                    className="p-4 rounded-xl bg-background dark:bg-gray-800 border border-border text-text transition-all hover:shadow-sm flex flex-col items-start"
                  >
                    <Building2 className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
                    <p className="font-semibold text-sm">New Collaboration</p>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* System Health */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                System Health
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'API Status', value: 'Operational', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
                { label: 'Database', value: 'Healthy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
                { label: 'Socket.IO', value: 'Connected', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
                { label: 'Uptime', value: '99.9%', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} rounded-lg p-3 text-center`}>
                  <p className="text-xs text-text-secondary font-semibold mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
