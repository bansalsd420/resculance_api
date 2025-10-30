import { useState, useEffect } from 'react';
import { ambulanceService, organizationService, userService } from '../services/api.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/Form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export const Ambulances = () => {
  const { user: currentUser } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: '',
    organizationId: '',
  });
  const [assignData, setAssignData] = useState({
    userId: '',
  });

  useEffect(() => {
    loadAmbulances();
    loadUsers();
    if (currentUser.role === 'superadmin') {
      loadOrganizations();
    }
  }, []);

  const loadAmbulances = async () => {
    try {
      setLoading(true);
      const response = await ambulanceService.getAll();
      setAmbulances(response.data);
    } catch (error) {
      console.error('Failed to load ambulances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationService.getAll();
      setOrganizations(response.data.filter(org => org.type === 'FLEET_OWNER'));
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData };
      if (currentUser.role !== 'superadmin') {
        dataToSubmit.organizationId = currentUser.organizationId;
      }
      await ambulanceService.create(dataToSubmit);
      toast.success('Ambulance created successfully!');
      setShowModal(false);
      setFormData({ vehicleNumber: '', type: '', organizationId: '' });
      loadAmbulances();
    } catch (error) {
      console.error('Failed to create ambulance:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await ambulanceService.approve(id);
      toast.success('Ambulance approved!');
      loadAmbulances();
    } catch (error) {
      console.error('Failed to approve ambulance:', error);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    try {
      await ambulanceService.assignStaff(selectedAmbulance.id, assignData);
      toast.success('Staff assigned successfully!');
      setShowAssignModal(false);
      setAssignData({ userId: '' });
      loadAmbulances();
    } catch (error) {
      console.error('Failed to assign staff:', error);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'registrationNumber', title: 'Registration' },
    { key: 'type', title: 'Type' },
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
        <div className="flex gap-2">
          {row.status === 'pending_approval' && (
            <Button variant="success" className="text-xs py-1 px-2" onClick={() => handleApprove(row.id)}>
              Approve
            </Button>
          )}
          {row.status === 'active' && (
            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => {
              setSelectedAmbulance(row);
              setShowAssignModal(true);
            }}>
              Assign Staff
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ambulances</h1>
        <Button onClick={() => setShowModal(true)}>
          + Create Ambulance
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table columns={columns} data={ambulances} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Ambulance">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Vehicle Number"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'BLS', label: 'BLS - Basic Life Support' },
              { value: 'ALS', label: 'ALS - Advanced Life Support' },
              { value: 'ICU', label: 'ICU - Intensive Care Unit' },
            ]}
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
            <Button type="submit" variant="primary" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Staff">
        <form onSubmit={handleAssignStaff} className="space-y-4">
          <Select
            label="Staff Member"
            value={assignData.userId}
            onChange={(e) => setAssignData({ userId: e.target.value })}
            options={users.filter(u => u.role?.includes('doctor') || u.role?.includes('paramedic')).map(u => ({ 
              value: u.id, 
              label: `${u.name} (${u.role})` 
            }))}
            required
          />

          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Assign</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
