import { useState, useEffect } from 'react';
import { collaborationService, organizationService, ambulanceService } from '../services/api.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Form';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

export const Collaborations = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    fleetOwnerId: '',
    patientName: '',
    patientAge: '',
    emergencyType: '',
    pickupLat: '',
    pickupLng: '',
    destinationLat: '',
    destinationLng: '',
    notes: '',
  });
  const [assignData, setAssignData] = useState({
    ambulanceId: '',
  });

  useEffect(() => {
    loadRequests();
    loadOrganizations();
    if (user.role.includes('fleet')) {
      loadAmbulances();
    }
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await collaborationService.getAll();
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
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

  const loadAmbulances = async () => {
    try {
      const response = await ambulanceService.getAll();
      setAmbulances(response.data.filter(a => a.status === 'active'));
    } catch (error) {
      console.error('Failed to load ambulances:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await collaborationService.create(formData);
      toast.success('Collaboration request created!');
      setShowModal(false);
      setFormData({ fleetOwnerId: '', patientName: '', patientAge: '', emergencyType: '', pickupLat: '', pickupLng: '', destinationLat: '', destinationLng: '', notes: '' });
      loadRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await collaborationService.updateStatus(id, status);
      toast.success(`Request ${status}!`);
      loadRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssignAmbulance = async (e) => {
    e.preventDefault();
    try {
      await collaborationService.assignAmbulance(selectedRequest.id, assignData.ambulanceId);
      toast.success('Ambulance assigned!');
      setShowAssignModal(false);
      setAssignData({ ambulanceId: '' });
      loadRequests();
    } catch (error) {
      console.error('Failed to assign ambulance:', error);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'patientName', title: 'Patient' },
    { key: 'emergencyType', title: 'Emergency' },
    { 
      key: 'status', 
      title: 'Status',
      render: (status) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'accepted' ? 'bg-green-100 text-green-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
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
          {row.status === 'pending' && user.role.includes('fleet') && (
            <>
              <Button variant="success" className="text-xs py-1 px-2" onClick={() => handleStatusUpdate(row.id, 'accepted')}>
                Accept
              </Button>
              <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleStatusUpdate(row.id, 'rejected')}>
                Reject
              </Button>
            </>
          )}
          {row.status === 'accepted' && user.role.includes('fleet') && !row.ambulanceId && (
            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => {
              setSelectedRequest(row);
              setShowAssignModal(true);
            }}>
              Assign Ambulance
            </Button>
          )}
          {row.status === 'accepted' && row.ambulanceId && (
            <Button variant="primary" className="text-xs py-1 px-2" onClick={() => handleStatusUpdate(row.id, 'completed')}>
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Collaboration Requests</h1>
        {user.role.includes('hospital') && (
          <Button onClick={() => setShowModal(true)}>
            + Create Request
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table columns={columns} data={requests} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Collaboration Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Fleet Owner" value={formData.fleetOwnerId} onChange={(e) => setFormData({ ...formData, fleetOwnerId: e.target.value })}
            options={organizations.map(org => ({ value: org.id, label: org.name }))} required />
          <Input label="Patient Name" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} required />
          <Input label="Patient Age" type="number" value={formData.patientAge} onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })} required />
          <Input label="Emergency Type" value={formData.emergencyType} onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })} required />
          <Input label="Pickup Latitude" type="number" step="any" value={formData.pickupLat} onChange={(e) => setFormData({ ...formData, pickupLat: e.target.value })} required />
          <Input label="Pickup Longitude" type="number" step="any" value={formData.pickupLng} onChange={(e) => setFormData({ ...formData, pickupLng: e.target.value })} required />
          <Input label="Destination Latitude" type="number" step="any" value={formData.destinationLat} onChange={(e) => setFormData({ ...formData, destinationLat: e.target.value })} required />
          <Input label="Destination Longitude" type="number" step="any" value={formData.destinationLng} onChange={(e) => setFormData({ ...formData, destinationLng: e.target.value })} required />
          <Textarea label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Ambulance">
        <form onSubmit={handleAssignAmbulance} className="space-y-4">
          <Select label="Ambulance" value={assignData.ambulanceId} onChange={(e) => setAssignData({ ambulanceId: e.target.value })}
            options={ambulances.map(a => ({ value: a.id, label: `${a.registrationNumber} (${a.type})` }))} required />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Assign</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
