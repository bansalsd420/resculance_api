import { useState, useEffect } from 'react';
import useWithGlobalLoader from '../../hooks/useWithGlobalLoader';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Select from '../../components/ui/Select';
import {
  Activity,
  Ambulance as AmbulanceIcon,
  Eye,
  UserPlus,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { patientService, ambulanceService, organizationService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [ambulances, setAmbulances] = useState([]);
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [orgTypeFilter, setOrgTypeFilter] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgInfo, setSelectedOrgInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [destinationHospitalId, setDestinationHospitalId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const runWithLoader = useWithGlobalLoader();

  useEffect(() => {
    fetchOrganizations();
    fetchHospitals();
  }, []);

  useEffect(() => {
    // Fetch ambulances and patients when organization is selected
    const doFetch = async () => {
      setAmbulances([]);
      setPatients([]);
      await runWithLoader(async () => {
        if (user?.role === 'superadmin') {
          if (selectedOrgId) {
            await fetchAmbulances();
            await fetchPatients();
          }
        } else {
          await fetchAmbulances();
          await fetchPatients();
        }
      }, 'Loading ambulances...');
    };

    doFetch().catch((err) => {
      console.error('Error fetching data', err);
    });
  }, [selectedOrgId, user]);

  const fetchOrganizations = async () => {
    try {
      const resp = await organizationService.getAll();
      const raw = resp.data?.data?.organizations || resp.data?.organizations || resp.data || [];
      const normalized = raw.map(org => ({
        ...org,
        type: (org.type || '').toString().toLowerCase(),
        name: org.name || org.organization_name,
        code: org.code || org.organization_code
      }));
      setOrganizations(normalized);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const fetchHospitals = async () => {
    try {
      const resp = await organizationService.getAll({ type: 'HOSPITAL' });
      const raw = resp.data?.data?.organizations || resp.data?.organizations || resp.data || [];
      setHospitals(raw);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const fetchAmbulances = async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.role === 'superadmin') {
        if (selectedOrgId) params.organizationId = selectedOrgId;
        else return; // Don't fetch if superadmin hasn't selected org
      } else {
        params.organizationId = user?.organizationId;
      }

      const response = await ambulanceService.getAll(params);
      const ambulancesData = response.data?.data?.ambulances || response.data?.ambulances || response.data || [];
      
      // Fetch active sessions for each ambulance to determine onboarding status
      const ambulancesWithSessions = await Promise.all(
        ambulancesData.map(async (amb) => {
          try {
            const sessionsResp = await patientService.getAllSessions({ ambulanceId: amb.id, status: 'active' });
            const sessions = sessionsResp.data?.data?.sessions || sessionsResp.data?.sessions || [];
            return {
              ...amb,
              activeSession: sessions.length > 0 ? sessions[0] : null,
              hasActiveOnboarding: sessions.length > 0
            };
          } catch (err) {
            console.error(`Failed to fetch sessions for ambulance ${amb.id}`, err);
            return { ...amb, activeSession: null, hasActiveOnboarding: false };
          }
        })
      );

      setAmbulances(ambulancesWithSessions);
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
      toast.error('Failed to load ambulances');
      setAmbulances([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const params = {};
      if (user?.role === 'superadmin') {
        if (selectedOrgId) params.organizationId = selectedOrgId;
        else return;
      } else {
        params.organizationId = user?.organizationId;
      }

      const response = await patientService.getAll(params);
      const patientsData = response.data?.data?.patients || response.data?.patients || response.data || [];
      
      // Filter out patients that are currently onboarded (have active sessions)
      const patientsWithStatus = await Promise.all(
        patientsData.map(async (patient) => {
          try {
            const sessionsResp = await patientService.getSessions(patient.id);
            const sessions = sessionsResp.data?.data?.sessions || sessionsResp.data?.sessions || [];
            const hasActiveSessions = sessions.some(s => s.status === 'active');
            return {
              ...patient,
              isOnboarded: hasActiveSessions
            };
          } catch (err) {
            return { ...patient, isOnboarded: false };
          }
        })
      );

      setPatients(patientsWithStatus);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleOpenPatientModal = (ambulance) => {
    setSelectedAmbulance(ambulance);
    setSelectedPatient(null);
    setDestinationHospitalId('');
    setShowPatientModal(true);
  };

  const handleClosePatientModal = () => {
    setShowPatientModal(false);
    setSelectedAmbulance(null);
    setSelectedPatient(null);
    setDestinationHospitalId('');
  };

  const handleOnboardPatient = async () => {
    if (!selectedPatient || !selectedAmbulance || !destinationHospitalId) {
      toast.error('Please select a patient and destination hospital');
      return;
    }

    setSubmitting(true);
    try {
      const orgIdForOnboard = user?.role === 'superadmin' ? selectedOrgId : user?.organizationId;
      
      await patientService.onboard(selectedPatient, {
        ambulanceId: selectedAmbulance.id,
        destinationHospitalId: destinationHospitalId,
        organizationId: orgIdForOnboard,
      });
      
      toast.success('Patient onboarded successfully');
      handleClosePatientModal();
      await fetchAmbulances();
      await fetchPatients();
    } catch (error) {
      console.error('Failed to onboard patient:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to onboard patient';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewOnboarding = (ambulance) => {
    if (ambulance.activeSession) {
      navigate(`/onboarding/${ambulance.activeSession.id}`);
    } else {
      toast.info('No active onboarding for this ambulance');
    }
  };

  // Filter patients that are not currently onboarded
  const availablePatients = patients.filter(p => !p.isOnboarded);
  
  // Filter ambulances based on search
  const filteredAmbulances = ambulances.filter(amb => 
    (amb.registration_number || amb.vehicleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (amb.vehicle_model || amb.vehicleModel || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Ambulance',
      accessor: 'registration_number',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <AmbulanceIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{row.registration_number || row.vehicleNumber || 'N/A'}</p>
            <p className="text-sm text-secondary">{row.vehicle_model || row.vehicleModel}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'vehicle_type',
      render: (row) => (
        <span className="text-sm">{row.vehicle_type || row.vehicleType}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'available' ? 'bg-blue-100 text-blue-800' :
          row.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status || 'Unknown'}
        </span>
      ),
    },
    {
      header: 'Onboarding Status',
      render: (row) => (
        <div>
          {row.hasActiveOnboarding ? (
            <span className="text-sm text-green-600 font-medium">Active Onboarding</span>
          ) : (
            <span className="text-sm text-gray-500">No Active Onboarding</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => handleOpenPatientModal(row)}
            disabled={row.hasActiveOnboarding}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Onboard Patient
          </Button>
          {row.hasActiveOnboarding && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => handleViewOnboarding(row)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold mt-5 mb-2">Patient Onboarding</h1>
        <p className="text-secondary">Select an ambulance and onboard patients</p>
      </div>

      {/* Organization Selector (for superadmin) */}
      {user?.role === 'superadmin' && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Type</label>
              <Select
                isClearable
                value={orgTypeFilter ? { value: orgTypeFilter, label: orgTypeFilter === 'hospital' ? 'Hospital' : 'Fleet Owner' } : null}
                onChange={(opt) => {
                  const v = opt?.value || '';
                  setOrgTypeFilter(v);
                  setSelectedOrgId(null);
                  setSelectedOrgInfo(null);
                }}
                options={[
                  { value: 'hospital', label: 'Hospital' },
                  { value: 'fleet_owner', label: 'Fleet Owner' }
                ]}
                placeholder="Select organization type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Organization</label>
              <Select
                isDisabled={!orgTypeFilter}
                isClearable
                placeholder={orgTypeFilter ? 'Select an organization' : 'Select a type first'}
                options={organizations
                  .filter(o => !orgTypeFilter || o.type === orgTypeFilter)
                  .map(o => ({ value: o.id, label: `${o.name} (${o.code})` }))}
                value={selectedOrgId ? {
                  value: selectedOrgId,
                  label: `${selectedOrgInfo?.name || ''} (${selectedOrgInfo?.code || ''})`
                } : null}
                onChange={(opt) => {
                  if (opt) {
                    setSelectedOrgId(opt.value);
                    const info = organizations.find(o => o.id === opt.value) || null;
                    setSelectedOrgInfo(info);
                  } else {
                    setSelectedOrgId(null);
                    setSelectedOrgInfo(null);
                  }
                }}
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      {((user?.role === 'superadmin' && selectedOrgId) || user?.role !== 'superadmin') && (
        <>
          <Card>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Search ambulances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12"
                />
              </div>
            </div>
          </Card>

          {/* Ambulances Table */}
          {loading ? (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-secondary">Loading ambulances...</p>
            </Card>
          ) : filteredAmbulances.length === 0 ? (
            <Card className="p-8 text-center">
              <AmbulanceIcon className="w-12 h-12 mx-auto mb-4 text-secondary opacity-50" />
              <p className="text-secondary">No ambulances found</p>
            </Card>
          ) : (
            <Table columns={columns} data={filteredAmbulances} />
          )}
        </>
      )}

      {/* Patient Selection Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={handleClosePatientModal}
        title="Onboard Patient"
        footer={
          <>
            <Button variant="secondary" onClick={handleClosePatientModal}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={handleOnboardPatient}>
              Onboard Patient
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Ambulance:</strong> {selectedAmbulance?.registration_number || selectedAmbulance?.vehicleNumber || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Patient *</label>
            <Select
              placeholder="Select a patient to onboard"
              options={availablePatients.map(p => ({
                value: p.id,
                label: `${p.firstName || p.first_name} ${p.lastName || p.last_name} - ${p.phone}`
              }))}
              value={selectedPatient ? {
                value: selectedPatient,
                label: availablePatients.find(p => p.id === selectedPatient)
                  ? `${availablePatients.find(p => p.id === selectedPatient)?.firstName || availablePatients.find(p => p.id === selectedPatient)?.first_name} ${availablePatients.find(p => p.id === selectedPatient)?.lastName || availablePatients.find(p => p.id === selectedPatient)?.last_name}`
                  : ''
              } : null}
              onChange={(opt) => setSelectedPatient(opt?.value || null)}
              classNamePrefix="react-select"
            />
            {availablePatients.length === 0 && (
              <p className="mt-2 text-sm text-yellow-600">
                No available patients. All patients are currently onboarded.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Destination Hospital *</label>
            <Select
              placeholder="Select destination hospital"
              options={hospitals.map(h => ({
                value: h.id,
                label: `${h.name} - ${h.city || 'N/A'}, ${h.state || 'N/A'}`
              }))}
              value={destinationHospitalId ? {
                value: destinationHospitalId,
                label: hospitals.find(h => h.id === destinationHospitalId)?.name || ''
              } : null}
              onChange={(opt) => setDestinationHospitalId(opt?.value || '')}
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Onboarding;
