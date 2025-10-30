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

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'phoneNumber', title: 'Phone' },
    { key: 'role', title: 'Role', render: (role) => role?.replace('_', ' ') },
    { 
      key: 'status', 
      title: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'active' ? 'bg-green-100 text-green-800' :
          status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        row.status === 'pending_approval' && (
          <div className="flex gap-2">
            <Button variant="success" className="text-xs py-1 px-2" onClick={() => handleApprove(row.id)}>
              Approve
            </Button>
            <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleReject(row.id)}>
              Reject
            </Button>
          </div>
        )
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setShowModal(true)}>
          + Create User
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table columns={columns} data={users} />
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
