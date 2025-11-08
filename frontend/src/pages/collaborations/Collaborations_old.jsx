import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import Select from '../../components/ui/Select';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Handshake,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Search,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import getErrorMessage from '../../utils/getErrorMessage';
import { collaborationService, organizationService } from '../../services';
import { useAuthStore } from '../../store/authStore';

const Input = ({ type = 'text', placeholder, error, ...props }) => (
  <>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-xl ${className}`}>
    {children}
  </div>
);

const Table = ({ columns, data, loading }) => {
  if (loading) return <div className="p-4 text-center text-gray-500">Loading data...</div>;
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">No collaborations found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(item[column.accessor], item) : item[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? 'max-w-xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${maxWidth}`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4" id="modal-title">
              {title}
            </h3>
            {children}
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Validation Schema ---

const collaborationSchema = yup.object({
  fleetId: yup.number().typeError('Fleet owner is required').required('Fleet owner is required'),
  terms: yup.string().required('Terms are required'),
  duration: yup.number().typeError('Duration must be a number').required('Duration is required').positive('Duration must be positive'),
});

// --- Main Application Component (Collaborations) ---

const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const [showModal, setShowModal] = useState(false); // For Create Modal
  
  // State for the Action Confirmation Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'accept', 'reject', 'cancel'
    collabId: null,
    reason: '', // For rejection
  });

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(collaborationSchema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collabsRes, orgsRes] = await Promise.all([
        collaborationService.getAll(),
        organizationService.getAll({ type: 'FLEET_OWNER' }),
      ]);

      // FIX: Robust data extraction logic implemented here
      // Checks for data.collaborations (API response structure 1) OR data itself (API response structure 2)
      setCollaborations(collabsRes.data?.collaborations || collabsRes.data || []);
      setOrganizations(orgsRes.data?.organizations || orgsRes.data || []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setCollaborations([]);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await collaborationService.create(data);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create collaboration:', error);
      const msg = getErrorMessage(error, 'Failed to create collaboration');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Action Handlers (Triggering the Action Modal)
  const handleAcceptPrompt = (id) => setActionModal({ isOpen: true, type: 'accept', collabId: id, reason: '' });
  const handleRejectPrompt = (id) => setActionModal({ isOpen: true, type: 'reject', collabId: id, reason: '' });
  const handleCancelPrompt = (id) => setActionModal({ isOpen: true, type: 'cancel', collabId: id, reason: '' });
  
  const closeActionModal = () => setActionModal({ isOpen: false, type: '', collabId: null, reason: '' });
  
  const executeAction = async () => {
    const { type, collabId, reason } = actionModal;
    if (!collabId) return;

    // Reject requires a reason
    if (type === 'reject' && !reason.trim()) {
      console.error("Rejection reason is required.");
      return;
    }

    try {
      setLoading(true);
      if (type === 'accept') {
        await collaborationService.accept(collabId, {
          approvedBy: user.id,
          approvalDate: new Date().toISOString(),
        });
      } else if (type === 'reject') {
        await collaborationService.reject(collabId, {
          rejectedBy: user.id,
          rejectionReason: reason,
        });
      } else if (type === 'cancel') {
        await collaborationService.cancel(collabId);
      }
      
      console.log(`Successfully executed action: ${type} for collaboration ID: ${collabId}`);
      await fetchData();
      closeActionModal();
    } catch (error) {
      console.error(`Failed to ${type} collaboration:`, error);
      const msg = getErrorMessage(error, `Failed to ${type} collaboration`);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredCollaborations = collaborations.filter((collab) => {
    const matchesTab = activeTab === 'all' || collab.status?.toLowerCase() === activeTab;
    const matchesSearch =
      collab.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (organizations.find(o => o.id === collab.fleetId)?.name || 'N/A').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const statsData = {
    total: collaborations.length,
    pending: collaborations.filter((c) => c.status?.toLowerCase() === 'pending').length,
    approved: collaborations.filter((c) => c.status?.toLowerCase() === 'approved').length,
    rejected: collaborations.filter((c) => c.status?.toLowerCase() === 'rejected').length,
  };

  const columns = [
    {
      header: 'Hospital',
      accessor: 'hospital',
      render: (collab) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{collab.hospitalName || 'N/A'}</div>
            <div className="text-sm text-gray-500">ID: {collab.hospitalId}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Fleet Owner',
      accessor: 'fleet',
      render: (collab) => {
  const fleet = organizations.find((o) => o.id === collab.fleetId);
        return (
          <div>
            <div className="font-medium text-gray-900">{fleet?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{fleet?.city || ''}</div>
          </div>
        );
      },
    },
    {
      header: 'Terms',
      accessor: 'terms',
      render: (collab) => (
        <div className="text-sm text-gray-700 max-w-xs truncate" title={collab.terms}>{collab.terms}</div>
      ),
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (collab) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{collab.duration} months</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (collab) => (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${getStatusColor(collab.status)}`}>
          {getStatusIcon(collab.status)}
          {collab.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (collab) => (
        <div className="flex items-center gap-2">
          {collab.status?.toLowerCase() === 'pending' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleAcceptPrompt(collab.id)}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleRejectPrompt(collab.id)}>
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {collab.status?.toLowerCase() === 'approved' && (
            <Button size="sm" variant="secondary" onClick={() => handleCancelPrompt(collab.id)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];
  
  const currentActionCollab = actionModal.collabId ? collaborations.find(c => c.id === actionModal.collabId) : null;
  const actionTitle = actionModal.type === 'accept' ? 'Confirm Acceptance' :
                      actionModal.type === 'reject' ? 'Confirm Rejection' :
                      actionModal.type === 'cancel' ? 'Confirm Cancellation' : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mt-5 mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Partnership Management
          </h1>
          <p className="text-gray-600">Manage hospital-fleet collaborations and partnerships</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-5 h-5" />
          New Partnership
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Handshake className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{statsData.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-900">{statsData.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{statsData.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tabs & Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search partnerships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-full lg:w-64"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading collaborations...</div>
          ) : (
            <Table columns={columns} data={filteredCollaborations} />
          )}
        </Card>
      </motion.div>

      {/* Create Modal (New Partnership) */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Create New Partnership"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={loading}>
              Create Partnership
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fleet Owner
            </label>
            <Controller
              name="fleetId"
              control={control}
              defaultValue={''}
              render={({ field }) => {
                const options = organizations.map(o => ({ value: o.id, label: `${o.name} - ${o.city}` }));
                const value = options.find(o => o.value === field.value) || null;
                return (
                  <Select
                    classNamePrefix="react-select"
                    options={options}
                    value={value}
                    onChange={(opt) => field.onChange(opt ? opt.value : '')}
                    placeholder="Select Fleet Owner"
                  />
                );
              }}
            />
            {errors.fleetId && (
              <p className="mt-1 text-sm text-red-500">{errors.fleetId.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms & Conditions
            </label>
            <textarea
              {...register('terms')}
              rows={4}
              placeholder="Enter partnership terms and conditions..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            {errors.terms && (
              <p className="mt-1 text-sm text-red-500">{errors.terms.message}</p>
            )}
          </div>
          
          <Input
            label="Duration (months)"
            type="number"
            {...register('duration')}
            placeholder="12"
            error={errors.duration?.message}
          />
        </form>
      </Modal>

      {/* Action Confirmation Modal (Accept, Reject, Cancel) */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={closeActionModal}
        title={actionTitle}
        footer={
          <>
            <Button variant="secondary" onClick={closeActionModal}>
              Cancel
            </Button>
            <Button 
              onClick={executeAction} 
              loading={loading}
              variant={actionModal.type === 'accept' ? 'success' : actionModal.type === 'cancel' ? 'danger' : 'primary'}
            >
              {actionModal.type === 'accept' ? 'Yes, Accept' : actionModal.type === 'cancel' ? 'Yes, Cancel' : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-gray-700">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
            Are you sure you want to **{actionModal.type}** the partnership with **{currentActionCollab?.fleetOwnerName || 'N/A'}**? 
            This action cannot be undone.
          </p>
          
          {actionModal.type === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                Rejection Reason (Required)
              </label>
              <textarea
                value={actionModal.reason}
                onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                placeholder="Explain why you are rejecting this collaboration..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Collaborations;
