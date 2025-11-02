import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  UserSquare2,
  Plus,
  Edit,
  Trash2,
  Search,
  Activity,
  Heart,
  Thermometer,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { ToastContainer } from '../../components/ui/Toast';
import { patientService } from '../../services';
import { useToast } from '../../hooks/useToast';

const patientSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email'),
  address: yup.string().required('Address is required'),
  emergencyContactName: yup.string().required('Emergency contact name is required'),
  emergencyContactPhone: yup.string().required('Emergency contact phone is required'),
  emergencyContactRelation: yup.string().required('Relation is required'),
});

const vitalSignsSchema = yup.object({
  heartRate: yup.number().required('Heart rate is required').positive(),
  bloodPressureSystolic: yup.number().required('Systolic BP is required').positive(),
  bloodPressureDiastolic: yup.number().required('Diastolic BP is required').positive(),
  temperature: yup.number().required('Temperature is required').positive(),
  oxygenSaturation: yup.number().required('Oxygen saturation is required').min(0).max(100),
  respiratoryRate: yup.number().required('Respiratory rate is required').positive(),
});

export const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalSigns, setVitalSigns] = useState([]);
  const [sessions, setSessions] = useState([]);
  const { toasts, toast, removeToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(patientSchema),
  });

  const {
    register: registerVitals,
    handleSubmit: handleSubmitVitals,
    reset: resetVitals,
    formState: { errors: vitalsErrors },
  } = useForm({
    resolver: yupResolver(vitalSignsSchema),
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll();
      // API returns { success: true, data: { patients: [...] } }
      setPatients(response.data?.data?.patients || response.data?.patients || response.data || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalSigns = async (patientId) => {
    try {
      const response = await patientService.getVitalSigns(patientId);
      // Backend: { success: true, data: { vitalSigns: [...], sessionId } }
      const vitals = response.data?.data?.vitalSigns || response.data?.vitalSigns || response.data || [];
      setVitalSigns(vitals);
    } catch (error) {
      console.error('Failed to fetch vital signs:', error);
      toast.error('Failed to load vital signs');
      setVitalSigns([]);
    }
  };

  const fetchSessions = async (patientId) => {
    try {
      const response = await patientService.getSessions(patientId);
      // Backend returns sessions array directly or nested in .data
      const sessionsData = response.data?.data?.sessions || response.data?.sessions || response.data || [];
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
      setSessions([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (editingPatient) {
        await patientService.update(editingPatient.id, data);
        toast.success('Patient updated successfully');
      } else {
        await patientService.create(data);
        toast.success('Patient created successfully');
      }
      await fetchPatients();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save patient:', error);
      toast.error(editingPatient ? 'Failed to update patient' : 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVitals = async (data) => {
    try {
      setLoading(true);
      await patientService.addVitalSigns(selectedPatient.id, data);
      toast.success('Vital signs added successfully');
      await fetchVitalSigns(selectedPatient.id);
      resetVitals();
    } catch (error) {
      console.error('Failed to save vital signs:', error);
      toast.error('Failed to add vital signs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    reset(patient);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientService.delete(id);
        toast.success('Patient deleted successfully');
        await fetchPatients();
      } catch (error) {
        console.error('Failed to delete patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    await fetchVitalSigns(patient.id);
    await fetchSessions(patient.id);
    setShowVitalsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    reset();
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchQuery) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      header: 'Patient Name',
      accessor: 'name',
      render: (patient) => (
        <div>
          <div className="font-medium">
            {patient.firstName || patient.first_name} {patient.lastName || patient.last_name}
          </div>
          <div className="text-sm text-secondary">{patient.email || patient.contact_phone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Age/Gender',
      accessor: 'age',
      render: (patient) => {
        const dob = patient.dateOfBirth || patient.date_of_birth;
        const age = dob
          ? new Date().getFullYear() - new Date(dob).getFullYear()
          : patient.age || 'N/A';
        return `${age} / ${patient.gender || 'N/A'}`;
      },
    },
    {
      header: 'Blood Group',
      accessor: 'bloodGroup',
      render: (patient) => (
        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          {patient.bloodGroup || patient.blood_group || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (patient) => patient.phone || patient.contact_phone || 'N/A',
    },
    {
      header: 'Emergency Contact',
      accessor: 'emergency',
      render: (patient) => (
        <div>
          <div className="font-medium text-sm">
            {patient.emergencyContactName || patient.emergency_contact_name || 'N/A'}
          </div>
          <div className="text-xs text-secondary">
            {patient.emergencyContactPhone || patient.emergency_contact_phone || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (patient) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(patient)}
          >
            <Activity className="w-4 h-4 mr-1" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(patient)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(patient.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Patients Management</h1>
          <p className="text-secondary">Manage patient records and medical history</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <UserSquare2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Total Patients</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Active Sessions</p>
              <p className="text-2xl font-bold">
                {Array.isArray(sessions) ? sessions.filter(s => s.status === 'active').length : 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Critical Cases</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-secondary">Pending Reviews</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* Patients Table */}
      <Card>
        <div className="p-6">
          <Table
            columns={columns}
            data={filteredPatients}
            loading={loading}
            onRowClick={handleViewDetails}
          />
        </div>
      </Card>

      {/* Add/Edit Patient Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
            />
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && (
                <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
              )}
            </div>
            <Input
              label="Phone"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
          />

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4">Emergency Contact</h3>
            <div className="space-y-4">
              <Input
                label="Contact Name"
                {...register('emergencyContactName')}
                error={errors.emergencyContactName?.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  {...register('emergencyContactPhone')}
                  error={errors.emergencyContactPhone?.message}
                />
                <Input
                  label="Relation"
                  {...register('emergencyContactRelation')}
                  error={errors.emergencyContactRelation?.message}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-semibold mb-4">Medical Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Medical History</label>
                <textarea
                  {...register('medicalHistory')}
                  rows="3"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter medical history..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Allergies</label>
                <textarea
                  {...register('allergies')}
                  rows="2"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter allergies..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Medications</label>
                <textarea
                  {...register('currentMedications')}
                  rows="2"
                  className="w-full px-4 py-2 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter current medications..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingPatient ? 'Update Patient' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Details & Vitals Modal */}
      <Modal
        isOpen={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        title={`${selectedPatient?.firstName} ${selectedPatient?.lastName} - Details`}
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-background-card rounded-2xl">
              <div>
                <p className="text-sm text-secondary">Blood Group</p>
                <p className="font-semibold">{selectedPatient.bloodGroup}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Age/Gender</p>
                <p className="font-semibold">
                  {new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} / {selectedPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary">Phone</p>
                <p className="font-semibold">{selectedPatient.phone}</p>
              </div>
            </div>

            {/* Add Vital Signs */}
            <div className="border border-border rounded-2xl p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Add Vital Signs
              </h3>
              <form onSubmit={handleSubmitVitals(onSubmitVitals)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Heart Rate (bpm)"
                    type="number"
                    {...registerVitals('heartRate')}
                    error={vitalsErrors.heartRate?.message}
                  />
                  <Input
                    label="Systolic BP (mmHg)"
                    type="number"
                    {...registerVitals('bloodPressureSystolic')}
                    error={vitalsErrors.bloodPressureSystolic?.message}
                  />
                  <Input
                    label="Diastolic BP (mmHg)"
                    type="number"
                    {...registerVitals('bloodPressureDiastolic')}
                    error={vitalsErrors.bloodPressureDiastolic?.message}
                  />
                  <Input
                    label="Temperature (°F)"
                    type="number"
                    step="0.1"
                    {...registerVitals('temperature')}
                    error={vitalsErrors.temperature?.message}
                  />
                  <Input
                    label="Oxygen Sat. (%)"
                    type="number"
                    {...registerVitals('oxygenSaturation')}
                    error={vitalsErrors.oxygenSaturation?.message}
                  />
                  <Input
                    label="Resp. Rate (bpm)"
                    type="number"
                    {...registerVitals('respiratoryRate')}
                    error={vitalsErrors.respiratoryRate?.message}
                  />
                </div>
                <Button type="submit" loading={loading}>
                  Save Vital Signs
                </Button>
              </form>
            </div>

            {/* Vital Signs History */}
            <div>
              <h3 className="font-semibold mb-4">Vital Signs History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vitalSigns.length === 0 ? (
                  <p className="text-secondary text-center py-8">No vital signs recorded yet</p>
                ) : (
                  vitalSigns.map((vital, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-2xl hover:bg-background-card transition-colors"
                    >
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-secondary">HR</p>
                          <p className="font-semibold">{vital.heartRate} bpm</p>
                        </div>
                        <div>
                          <p className="text-secondary">BP</p>
                          <p className="font-semibold">
                            {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          </p>
                        </div>
                        <div>
                          <p className="text-secondary">Temp</p>
                          <p className="font-semibold">{vital.temperature}°F</p>
                        </div>
                        <div>
                          <p className="text-secondary">SpO2</p>
                          <p className="font-semibold">{vital.oxygenSaturation}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-secondary mt-2">
                        {new Date(vital.recordedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sessions History */}
            <div>
              <h3 className="font-semibold mb-4">Ambulance Sessions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-secondary text-center py-8">No sessions found</p>
                ) : (
                  sessions.map((session, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-2xl hover:bg-background-card transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{session.chiefComplaint}</p>
                          <p className="text-sm text-secondary mt-1">
                            Pickup: {session.pickupLocation}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            session.status === 'active'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-2">
                        {new Date(session.startTime).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
