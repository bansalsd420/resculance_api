import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  Ambulance,
  UserSquare2,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/organizations', icon: Building2, label: 'Organizations' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/ambulances', icon: Ambulance, label: 'Ambulances' },
    { path: '/patients', icon: UserSquare2, label: 'Patients' },
    { path: '/trips', icon: Activity, label: 'Trips' },
    { path: '/collaborations', icon: Building2, label: 'Partnerships' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight">Resculance</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section - Logout */}
          <div className="p-4 border-t border-gray-100">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

const Topbar = ({ toggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // TODO: Implement actual dark mode with context/theme provider
  };

  const quickActions = [
    { label: 'New User', path: '/users', icon: Users },
    { label: 'New Ambulance', path: '/ambulances', icon: Ambulance },
    { label: 'New Patient', path: '/patients', icon: UserSquare2 },
    { label: 'New Trip', path: '/trips', icon: Activity },
  ];

  const notifications = [
    { id: 1, title: 'New collaboration request', message: 'Apollo Hospitals sent a request', time: '5 min ago', unread: true },
    { id: 2, title: 'Trip completed', message: 'AMB-001 completed trip #TR-1234', time: '1 hour ago', unread: true },
    { id: 3, title: 'Ambulance maintenance', message: 'AMB-005 scheduled for maintenance', time: '2 hours ago', unread: false },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Welcome Message */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.firstName || 'User'}
            </h2>
            <p className="text-sm text-gray-500">
              Have a nice day at work! 🎯
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Add Button */}
          <div className="relative">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>

            {/* Quick Actions Dropdown */}
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Quick Actions</p>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        onClick={() => setShowQuickActions(false)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <button className="text-xs text-teal-600 hover:text-teal-700">Mark all read</button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                        notif.unread ? 'bg-teal-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.unread && <span className="w-2 h-2 bg-teal-500 rounded-full mt-2" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 text-center">
                  <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <div className="w-5 h-5 rounded-full bg-yellow-400" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-800" />
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=14b8a6&color=fff&bold=true`}
                alt="Profile"
                className="w-10 h-10 rounded-full ring-2 ring-gray-100"
              />
            </button>

            {/* Profile dropdown */}
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-teal-600 mt-1">{user?.role}</p>
                </div>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600 border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
