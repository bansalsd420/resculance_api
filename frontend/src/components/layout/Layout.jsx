import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { useState, useEffect } from 'react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];

    const roleBasedItems = {
      superadmin: [
        { path: '/organizations', label: 'Organizations', icon: '🏢' },
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/ambulances', label: 'Ambulances', icon: '🚑' },
        { path: '/patients', label: 'Patients', icon: '🏥' },
        { path: '/collaborations', label: 'Collaborations', icon: '🤝' },
      ],
      hospital_admin: [
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/patients', label: 'Patients', icon: '🏥' },
        { path: '/collaborations', label: 'Requests', icon: '🤝' },
      ],
      fleet_admin: [
        { path: '/ambulances', label: 'Ambulances', icon: '🚑' },
        { path: '/users', label: 'Staff', icon: '👥' },
        { path: '/collaborations', label: 'Requests', icon: '🤝' },
      ],
      hospital_doctor: [
        { path: '/patients', label: 'Patients', icon: '🏥' },
        { path: '/collaborations', label: 'Requests', icon: '🤝' },
      ],
      hospital_paramedic: [
        { path: '/patients', label: 'Patients', icon: '🏥' },
      ],
      fleet_doctor: [
        { path: '/ambulances', label: 'Ambulances', icon: '🚑' },
        { path: '/patients', label: 'Patients', icon: '🏥' },
      ],
      fleet_paramedic: [
        { path: '/ambulances', label: 'My Ambulance', icon: '🚑' },
        { path: '/patients', label: 'Patients', icon: '🏥' },
      ],
    };

    return [...baseItems, ...(roleBasedItems[user?.role] || [])];
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Medical Dashboard Sidebar */}
      <aside className="sidebar w-80 flex flex-col">
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <span>🚑</span>
            </div>
            <div>
              <h1 className="sidebar-title">RESCULANCE</h1>
              <p className="sidebar-subtitle">Emergency Operations</p>
            </div>
          </div>
          <div className="sidebar-badge">
            {user?.role?.replace('_', ' ')}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 overflow-y-auto">
          {getNavigationItems().map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="sidebar-user-avatar">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full mb-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <Button 
            onClick={handleLogout} 
            variant="danger" 
            className="w-full justify-center"
          >
            <span>🚪</span>
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
