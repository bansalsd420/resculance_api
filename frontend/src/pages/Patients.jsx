import { useState, useEffect } from 'react';
import { patientService, ambulanceService } from '../services/api.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/Form';
import { toast } from 'react-toastify';

export const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNumber: '',
    address: '',
    emergencyType: '',
  });
  const [onboardData, setOnboardData] = useState({
    ambulanceId: '',
    pickupLat: '',
    pickupLng: '',
    destinationLat: '',
    destinationLng: '',
  });
  const [vitalsData, setVitalsData] = useState({
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    spo2: '',
    temperature: '',
    notes: '',
  });

  useEffect(() => {
    loadPatients();
    loadAmbulances();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
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
      await patientService.create(formData);
      toast.success('Patient created successfully!');
      setShowModal(false);
      setFormData({ name: '', age: '', gender: '', phoneNumber: '', address: '', emergencyType: '' });
      loadPatients();
    } catch (error) {
      console.error('Failed to create patient:', error);
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    try {
      await patientService.onboard(selectedPatient.id, onboardData);
      toast.success('Patient onboarded successfully!');
      setShowOnboardModal(false);
      setOnboardData({ ambulanceId: '', pickupLat: '', pickupLng: '', destinationLat: '', destinationLng: '' });
      loadPatients();
    } catch (error) {
      console.error('Failed to onboard patient:', error);
    }
  };

  const handleAddVitals = async (e) => {
    e.preventDefault();
    try {
      await patientService.addVitalSigns(selectedPatient.id, vitalsData);
      toast.success('Vital signs recorded!');
      setShowVitalsModal(false);
      setVitalsData({ heartRate: '', systolicBP: '', diastolicBP: '', spo2: '', temperature: '', notes: '' });
    } catch (error) {
      console.error('Failed to add vital signs:', error);
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name' },
    { key: 'age', title: 'Age' },
    { key: 'gender', title: 'Gender' },
    { key: 'emergencyType', title: 'Emergency Type' },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => {
            setSelectedPatient(row);
            setShowOnboardModal(true);
          }}>
            Onboard
          </Button>
          <Button variant="success" className="text-xs py-1 px-2" onClick={() => {
            setSelectedPatient(row);
            setShowVitalsModal(true);
          }}>
            Add Vitals
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Button onClick={() => setShowModal(true)}>
          + Create Patient
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table columns={columns} data={patients} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Patient">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} required />
          <Select label="Gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} required />
          <Input label="Phone Number" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required />
          <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
          <Input label="Emergency Type" value={formData.emergencyType} onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })} required />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} title="Onboard Patient">
        <form onSubmit={handleOnboard} className="space-y-4">
          <Select label="Ambulance" value={onboardData.ambulanceId} onChange={(e) => setOnboardData({ ...onboardData, ambulanceId: e.target.value })}
            options={ambulances.map(a => ({ value: a.id, label: `${a.registrationNumber} (${a.type})` }))} required />
          <Input label="Pickup Latitude" type="number" step="any" value={onboardData.pickupLat} onChange={(e) => setOnboardData({ ...onboardData, pickupLat: e.target.value })} required />
          <Input label="Pickup Longitude" type="number" step="any" value={onboardData.pickupLng} onChange={(e) => setOnboardData({ ...onboardData, pickupLng: e.target.value })} required />
          <Input label="Destination Latitude" type="number" step="any" value={onboardData.destinationLat} onChange={(e) => setOnboardData({ ...onboardData, destinationLat: e.target.value })} required />
          <Input label="Destination Longitude" type="number" step="any" value={onboardData.destinationLng} onChange={(e) => setOnboardData({ ...onboardData, destinationLng: e.target.value })} required />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Onboard</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowOnboardModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showVitalsModal} onClose={() => setShowVitalsModal(false)} title="Add Vital Signs">
        <form onSubmit={handleAddVitals} className="space-y-4">
          <Input label="Heart Rate (BPM)" type="number" value={vitalsData.heartRate} onChange={(e) => setVitalsData({ ...vitalsData, heartRate: e.target.value })} required />
          <Input label="Systolic BP" type="number" value={vitalsData.systolicBP} onChange={(e) => setVitalsData({ ...vitalsData, systolicBP: e.target.value })} required />
          <Input label="Diastolic BP" type="number" value={vitalsData.diastolicBP} onChange={(e) => setVitalsData({ ...vitalsData, diastolicBP: e.target.value })} required />
          <Input label="SpO2 (%)" type="number" value={vitalsData.spo2} onChange={(e) => setVitalsData({ ...vitalsData, spo2: e.target.value })} required />
          <Input label="Temperature (°F)" type="number" step="0.1" value={vitalsData.temperature} onChange={(e) => setVitalsData({ ...vitalsData, temperature: e.target.value })} required />
          <Textarea label="Notes" value={vitalsData.notes} onChange={(e) => setVitalsData({ ...vitalsData, notes: e.target.value })} />
          <div className="flex gap-4">
            <Button type="submit" variant="primary" className="flex-1">Record</Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowVitalsModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
