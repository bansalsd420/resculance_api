import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, UserCheck, UserX, User, Ambulance as AmbulanceIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ToastContainer } from '../../components/ui/Toast';
import { useForm } from 'react-hook-form';
import { userService, organizationService, ambulanceService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentUser, setAssignmentUser] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const { user } = useAuthStore();
  const { toasts, toast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'DOCTOR', label: 'Doctors' },
    { id: 'PARAMEDIC', label: 'Paramedics' },
    { id: 'DRIVER', label: 'Drivers' },
    { id: 'pending', label: 'Pending Approval' },
  ];

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, [activeTab]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      setOrganizations(response.data?.data?.organizations || response.data?.organizations || response.data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') {
        if (activeTab === 'pending') {
          params.status = 'pending';
        } else {
          params.role = activeTab;
        }
      }
      
      const response = await userService.getAll(params);
      // API returns { success: true, data: { users: [...] } }
      setUsers(response.data?.data?.users || response.data?.users || response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await userService.approve(id);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    try {
      await userService.suspend(id);
      toast.success('User rejected successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast.error('Failed to reject user');
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      try {
        await userService.suspend(id);
        toast.success('User suspended successfully');
        fetchUsers();
      } catch (error) {
        console.error('Failed to suspend user:', error);
        toast.error('Failed to suspend user');
      }
    }
  };

  const handleOpenAssignmentModal = async (userData) => {
    setAssignmentUser(userData);
    
    try {
      // Fetch available ambulances from the same organization
      const ambulancesResponse = await ambulanceService.getAll({
        organizationId: userData.organization_id || userData.organizationId
      });
      const ambulances = ambulancesResponse.data?.data?.ambulances || ambulancesResponse.data?.ambulances || ambulancesResponse.data || [];
      setAvailableAmbulances(ambulances);
      
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
      toast.error('Failed to load ambulances for assignment');
      setAvailableAmbulances([]);
    }
    
    setIsAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setAssignmentUser(null);
    setAvailableAmbulances([]);
  };

  const handleAssignToAmbulance = async (ambulanceId) => {
    try {
      await ambulanceService.assign(ambulanceId, assignmentUser.id, assignmentUser.role);
      toast.success('User assigned to ambulance successfully');
      handleCloseAssignmentModal();
    } catch (error) {
      console.error('Failed to assign user to ambulance:', error);
      toast.error('Failed to assign user to ambulance');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'firstName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-sm text-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Organization',
      accessor: 'organization_name',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.organization_name || 'N/A'}</p>
          <p className="text-xs text-secondary">{row.organization_code || ''}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' ? (
            <>
              <Button size="sm" variant="success" onClick={() => handleApprove(row.id)}>
                <UserCheck className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleReject(row.id)}>
                <UserX className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
                Edit
              </Button>
              {(row.role === 'DOCTOR' || row.role === 'PARAMEDIC' || row.role === 'DRIVER') && (
                <Button size="sm" variant="success" onClick={() => handleOpenAssignmentModal(row)}>
                  <AmbulanceIcon className="w-4 h-4 mr-1" />
                  Assign Ambulance
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => handleDeactivate(row.id)}>
                Deactivate
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleOpenModal = (userData = null) => {
    setSelectedUser(userData);
    if (userData) {
      reset(userData);
    } else {
      // For non-superadmin, pre-fill organizationId
      const defaultData = user?.role === 'superadmin' ? {} : { organizationId: user?.organizationId };
      reset(defaultData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    reset({});
  };

  const onSubmit = async (data) => {
    try {
      // Ensure organizationId is set for non-superadmin
      const submitData = user?.role === 'superadmin' ? data : { ...data, organizationId: user?.organizationId };
      
      if (selectedUser) {
        await userService.update(selectedUser.id, submitData);
        toast.success('User updated successfully');
      } else {
        await userService.create(submitData);
        toast.success('User created successfully');
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error(selectedUser ? 'Failed to update user' : 'Failed to create user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">User Management</h1>
          <p className="text-secondary">Manage doctors, paramedics, drivers, and admins</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-primary text-white' : 'bg-background-card hover:bg-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Table columns={columns} data={filteredUsers} />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? 'Edit User' : 'Add User'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName', { required: 'First name is required' })}
              error={errors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...register('lastName', { required: 'Last name is required' })}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Input
              label="Phone"
              type="tel"
              {...register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Role *</label>
            <select {...register('role', { required: 'Role is required' })} className="input">
              <option value="">Select Role</option>
              <option value="HOSPITAL_ADMIN">Hospital Admin</option>
              <option value="FLEET_ADMIN">Fleet Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PARAMEDIC">Paramedic</option>
              <option value="DRIVER">Driver</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
          </div>

          {user?.role === 'superadmin' ? (
            <div>
              <label className="block text-sm font-medium text-text mb-2">Organization *</label>
              <select {...register('organizationId', { required: 'Organization is required' })} className="input">
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
              {errors.organizationId && <p className="mt-1 text-sm text-red-500">{errors.organizationId.message}</p>}
            </div>
          ) : null}

          {!selectedUser && (
            <Input
              label="Password"
              type="password"
              {...register('password', { required: !selectedUser && 'Password is required' })}
              error={errors.password?.message}
            />
          )}
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        title={`Assign ${assignmentUser?.firstName} ${assignmentUser?.lastName} to Ambulance`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-secondary">
            Select an ambulance to assign <strong>{assignmentUser?.firstName} {assignmentUser?.lastName}</strong> 
            ({assignmentUser?.role}) to:
          </p>
          
          {availableAmbulances.length === 0 ? (
            <p className="text-secondary text-center py-8">
              No ambulances available for assignment in this organization.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableAmbulances.map((ambulance) => (
                <div key={ambulance.id} className="flex items-center justify-between p-4 bg-background-card rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <AmbulanceIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{ambulance.registration_number || ambulance.vehicleNumber}</p>
                      <p className="text-sm text-secondary">{ambulance.vehicle_model || ambulance.vehicleModel}</p>
                      <p className="text-xs text-secondary">{ambulance.vehicle_type || ambulance.vehicleType}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleAssignToAmbulance(ambulance.id)}
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
