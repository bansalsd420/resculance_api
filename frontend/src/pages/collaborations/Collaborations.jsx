import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
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
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { ToastContainer } from '../../components/ui/Toast';
import { collaborationService, organizationService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

// --- Validation Schema ---

const collaborationSchema = yup.object({
  fleetOwnerId: yup.number().typeError('Fleet owner is required').required('Fleet owner is required'),
  terms: yup.string().required('Terms are required'),
  duration: yup.number().typeError('Duration must be a number').required('Duration is required').positive('Duration must be positive'),
});

// --- Main Application Component (Collaborations) ---

export const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // For Create Modal
  const { toasts, toast, removeToast } = useToast();
  
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

      // Backend returns { success: true, data: { requests: [...] } } or similar
      const collabData = collabsRes.data?.data?.requests || collabsRes.data?.requests || collabsRes.data || [];
      const orgData = orgsRes.data?.data?.organizations || orgsRes.data?.organizations || orgsRes.data || [];
      
      setCollaborations(Array.isArray(collabData) ? collabData : []);
      setOrganizations(Array.isArray(orgData) ? orgData : []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load collaborations');
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
      toast.success('Collaboration request created successfully');
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create collaboration:', error);
      toast.error('Failed to create collaboration request');
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
      toast.warning("Rejection reason is required");
      return;
    }

    try {
      setLoading(true);
      if (type === 'accept') {
        await collaborationService.accept(collabId, {
          approvedBy: user.id,
          approvalDate: new Date().toISOString(),
        });
        toast.success('Collaboration request accepted');
      } else if (type === 'reject') {
        await collaborationService.reject(collabId, {
          rejectedBy: user.id,
          rejectionReason: reason,
        });
        toast.success('Collaboration request rejected');
      } else if (type === 'cancel') {
        await collaborationService.cancel(collabId);
        toast.success('Collaboration request cancelled');
      }
      
      await fetchData();
      closeActionModal();
    } catch (error) {
      console.error(`Failed to ${type} collaboration:`, error);
      toast.error(`Failed to ${type} collaboration request`);
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
    const hospitalName = collab.hospital_name || collab.hospitalName || '';
    const fleetName = collab.fleet_name || collab.fleetName || '';
    const matchesSearch =
      hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fleetName.toLowerCase().includes(searchTerm.toLowerCase());
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
            <div className="font-medium text-gray-900">{collab.hospital_name || collab.hospitalName || 'N/A'}</div>
            <div className="text-sm text-gray-500">{collab.hospital_code || collab.hospitalCode || ''}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Fleet Owner',
      accessor: 'fleet',
      render: (collab) => {
        return (
          <div>
            <div className="font-medium text-gray-900">{collab.fleet_name || collab.fleetName || 'N/A'}</div>
            <div className="text-sm text-gray-500">{collab.fleet_code || collab.fleetCode || ''}</div>
          </div>
        );
      },
    },
    {
      header: 'Message',
      accessor: 'message',
      render: (collab) => (
        <div className="text-sm text-gray-700 max-w-xs truncate" title={collab.message || collab.terms}>
          {collab.message || collab.terms || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Request Type',
      accessor: 'request_type',
      render: (collab) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Handshake className="w-4 h-4 text-gray-400" />
          <span className="capitalize">{collab.request_type || collab.requestType || 'Partnership'}</span>
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
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
            <select
              {...register('fleetOwnerId')}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Fleet Owner</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} - {org.city}
                </option>
              ))}
            </select>
            {errors.fleetOwnerId && (
              <p className="mt-1 text-sm text-red-500">{errors.fleetOwnerId.message}</p>
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
