import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">RESCULANCE</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.role?.replace('_', ' ').toUpperCase()}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
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

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>
          <Button onClick={handleLogout} variant="secondary" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
