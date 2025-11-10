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
  Power,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { patientService, ambulanceService, organizationService, collaborationService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';

export const Onboarding = () => {
  const navigate = useNavigate();
  const [ambulances, setAmbulances] = useState([]);
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [partneredHospitals, setPartneredHospitals] = useState([]);
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

  // Offboard confirmation modal state
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState(null);

  // Determine if current context is hospital or fleet
  const isHospitalContext = user?.role === 'superadmin' 
    ? selectedOrgInfo?.type === 'hospital'
    : user?.organizationType === 'hospital';
  
  const isFleetContext = user?.role === 'superadmin'
    ? selectedOrgInfo?.type === 'fleet_owner'
    : user?.organizationType === 'fleet_owner';

  useEffect(() => {
    fetchOrganizations();
    fetchHospitals();
  }, []);

  // Offboard handler for table (must be top-level, not inside useEffect)
  const handleOffboardFromTable = async (row) => {
    setOffboardTarget(row);
    setShowOffboardModal(true);
  };

  const handleConfirmOffboard = async () => {
    if (!offboardTarget) return;
    
    const sessionId = offboardTarget.activeSession?.id;
    if (!sessionId) return;

    setSubmitting(true);
    try {
      await patientService.offboard(sessionId, { treatmentNotes: 'Patient offboarded from table view' });
      toast.success('Patient offboarded successfully');
      // Refresh ambulances and patients
      await fetchAmbulances();
      await fetchPatients();
    } catch (error) {
      console.error('Failed to offboard patient:', error);
      toast.error('Failed to offboard patient');
    } finally {
      setSubmitting(false);
      setShowOffboardModal(false);
      setOffboardTarget(null);
    }
  };

  const handleCancelOffboard = () => {
    setShowOffboardModal(false);
    setOffboardTarget(null);
  };

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
            // Fetch partnered hospitals if fleet context
            if (isFleetContext) {
              await fetchPartneredHospitals();
            }
          }
        } else {
          await fetchAmbulances();
          await fetchPatients();
          // Fetch partnered hospitals if fleet context
          if (isFleetContext) {
            await fetchPartneredHospitals();
          }
        }
      }, 'Loading ambulances...');
    };

    doFetch().catch((err) => {
      console.error('Error fetching data', err);
    });
  }, [selectedOrgId, user, isFleetContext]);

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

  const fetchPartneredHospitals = async () => {
    try {
      const resp = await collaborationService.getAll({ status: 'active' });
      const partnerships = resp.data?.data?.collaborations || resp.data?.collaborations || resp.data || [];
      
      // Extract hospital IDs from partnerships
      const hospitalIds = partnerships
        .filter(p => p.hospital_id)
        .map(p => p.hospital_id);
      
      // Filter hospitals to only show partnered ones
      const partnered = hospitals.filter(h => hospitalIds.includes(h.id));
      setPartneredHospitals(partnered);
    } catch (error) {
      console.error('Failed to fetch partnered hospitals:', error);
      setPartneredHospitals([]);
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
            // Check for onboarded, in_transit, or active sessions
            const sessionsResp = await patientService.getAllSessions({ 
              ambulanceId: amb.id
            });
            const allSessions = sessionsResp.data?.data?.sessions || sessionsResp.data?.sessions || [];
            const activeSessions = allSessions.filter(s => 
              ['active', 'onboarded', 'in_transit'].includes(s.status?.toLowerCase())
            );
            return {
              ...amb,
              activeSession: activeSessions.length > 0 ? activeSessions[0] : null,
              hasActiveOnboarding: activeSessions.length > 0
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
            const hasActiveSessions = sessions.some(s => 
              ['active', 'onboarded', 'in_transit'].includes(s.status?.toLowerCase())
            );
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
    
    // Auto-set destination hospital for hospital context
    if (isHospitalContext) {
      const hospitalId = user?.role === 'superadmin' ? selectedOrgId : user?.organizationId;
      setDestinationHospitalId(hospitalId);
    } else {
      setDestinationHospitalId('');
    }
    
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
            <>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => handleViewOnboarding(row)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleOffboardFromTable(row)}
                className="ml-1"
              >
                <Power className="w-4 h-4 mr-1" />
                Offboard
              </Button>
            </>
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

      {/* Offboard Confirmation Modal */}
      <Modal
        isOpen={showOffboardModal}
        onClose={handleCancelOffboard}
        title="Confirm Patient Offboarding"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelOffboard}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              loading={submitting} 
              onClick={handleConfirmOffboard}
            >
              Yes, Offboard Patient
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
              <Power className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Offboard Patient</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                This action will complete the patient session and mark it as offboarded.
              </p>
            </div>
          </div>

          {offboardTarget && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-secondary mb-1">Ambulance</p>
                  <p className="font-medium">{offboardTarget.registration_number || offboardTarget.vehicleNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Session Code</p>
                  <p className="font-medium">{offboardTarget.activeSession?.session_code || 'N/A'}</p>
                </div>
              </div>

              <div className="text-sm text-secondary">
                <p>Are you sure you want to offboard this patient? This action cannot be undone.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

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
            {isHospitalContext ? (
              // Hospital context: destination is pre-set and read-only
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900">
                  {hospitals.find(h => h.id === destinationHospitalId)?.name || selectedOrgInfo?.name || 'Current Hospital'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Destination is automatically set to your hospital
                </p>
              </div>
            ) : (
              // Fleet context: allow selection from partnered hospitals
              <>
                <Select
                  placeholder="Select destination hospital"
                  options={partneredHospitals.map(h => ({
                    value: h.id,
                    label: `${h.name} - ${h.city || 'N/A'}, ${h.state || 'N/A'}`
                  }))}
                  value={destinationHospitalId ? {
                    value: destinationHospitalId,
                    label: partneredHospitals.find(h => h.id === destinationHospitalId)?.name || ''
                  } : null}
                  onChange={(opt) => setDestinationHospitalId(opt?.value || '')}
                  classNamePrefix="react-select"
                />
                {partneredHospitals.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                    No partnered hospitals available. Please establish partnerships first.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Onboarding;
