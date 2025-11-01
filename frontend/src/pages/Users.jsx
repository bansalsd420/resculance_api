import { useState, useEffect } from 'react';
import { userService, organizationService } from '../services/api.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/Form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: '',
    organizationId: '',
  });

  useEffect(() => {
    loadUsers();
    if (currentUser.role === 'superadmin') {
      loadOrganizations();
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData };
      if (currentUser.role !== 'superadmin') {
        dataToSubmit.organizationId = currentUser.organizationId;
      }
      await userService.create(dataToSubmit);
      toast.success('User created successfully!');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phoneNumber: '', role: '', organizationId: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await userService.approve(id);
      toast.success('User approved!');
      loadUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await userService.reject(id);
      toast.success('User rejected!');
      loadUsers();
    } catch (error) {
      console.error('Failed to reject user:', error);
    }
  };

  const getRoleOptions = () => {
    if (currentUser.role === 'superadmin') {
      return [
        { value: 'hospital_admin', label: 'Hospital Admin' },
        { value: 'hospital_doctor', label: 'Hospital Doctor' },
        { value: 'hospital_paramedic', label: 'Hospital Paramedic' },
        { value: 'fleet_admin', label: 'Fleet Admin' },
        { value: 'fleet_doctor', label: 'Fleet Doctor' },
        { value: 'fleet_paramedic', label: 'Fleet Paramedic' },
      ];
    } else if (currentUser.role.includes('hospital')) {
      return [
        { value: 'hospital_doctor', label: 'Doctor' },
        { value: 'hospital_paramedic', label: 'Paramedic' },
      ];
    } else if (currentUser.role.includes('fleet')) {
      return [
        { value: 'fleet_doctor', label: 'Doctor' },
        { value: 'fleet_paramedic', label: 'Paramedic' },
      ];
    }
    return [];
  };

  const filteredUsers = users.filter(user => {
    if (filters.role !== 'all' && !user.role?.includes(filters.role)) return false;
    if (filters.status !== 'all' && user.status !== filters.status) return false;
    if (filters.search && !user.name?.toLowerCase().includes(filters.search.toLowerCase()) && 
        !user.email?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending_approval').length,
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phoneNumber', title: 'Phone' },
    { key: 'role', title: 'Role', render: (role) => role?.replace('_', ' ') },
    { 
      key: 'status', 
      title: 'Status',
      render: (status) => {
        const statusConfig = {
          active: { class: 'badge-success', icon: '✓', label: 'Active' },
          pending_approval: { class: 'badge-warning', icon: '⏳', label: 'Pending' },
          suspended: { class: 'badge-danger', icon: '⊗', label: 'Suspended' },
          inactive: { class: 'badge-gray', icon: '○', label: 'Inactive' },
        };
        const config = statusConfig[status] || statusConfig.inactive;
        return (
          <span className={`badge ${config.class} flex items-center gap-1`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        row.status === 'pending_approval' && (
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={() => handleApprove(row.id)}>
              ✓ Approve
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleReject(row.id)}>
              ✗ Reject
            </Button>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="text-4xl">👥</span>
            User Management
          </h1>
          <p className="page-subtitle">Manage medical staff and system users</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="lg">
          <span>+</span>
          <span>Create User</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.total}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registered accounts</div>
            </div>
            <div className="text-5xl">👨‍⚕️</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Active Users</div>
              <div className="stat-value text-emerald-600 dark:text-emerald-400">{stats.active}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently active</div>
            </div>
            <div className="text-5xl">✓</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value text-amber-600 dark:text-amber-400">{stats.pending}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting review</div>
            </div>
            <div className="text-5xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Search Users</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="search-input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">Filter by Role</label>
              <select
                className="select"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="all">All Roles</option>
                <option value="hospital">Hospital Staff</option>
                <option value="fleet">Fleet Staff</option>
                <option value="admin">Admins</option>
                <option value="doctor">Doctors</option>
                <option value="paramedic">Paramedics</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Filter by Status</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending_approval">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="card-header">
          <h3 className="card-title">
            <span>📋</span>
            <span>Users List ({filteredUsers.length})</span>
          </h3>
        </div>
        {loading ? (
          <div className="card-body">
            <div className="text-center py-12">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">No users found</h3>
            <p className="empty-state-description">
              {filters.search || filters.role !== 'all' || filters.status !== 'all'
                ? 'No users match your filters. Try adjusting your search.'
                : 'Get started by creating your first user.'}
            </p>
            {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
              <Button
                variant="secondary"
                onClick={() => setFilters({ role: 'all', status: 'all', search: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <Table columns={columns} data={filteredUsers} />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create User"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={getRoleOptions()}
            required
          />

          {currentUser.role === 'superadmin' && (
            <Select
              label="Organization"
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              options={organizations.map(org => ({ value: org.id, label: org.name }))}
              required
            />
          )}

          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">
              Create
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
