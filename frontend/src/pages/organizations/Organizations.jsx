import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import { organizationService } from '../../services';

export const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchOrganizations();
  }, [filterType]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await organizationService.getAll(params);
      // API returns { success: true, data: { organizations: [...], pagination: {...} } }
      setOrganizations(response.data?.data?.organizations || response.data?.organizations || response.data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (org = null) => {
    setSelectedOrg(org);
    if (org) {
      reset(org);
    } else {
      reset({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrg(null);
    reset({});
  };

  const onSubmit = async (data) => {
    try {
      if (selectedOrg) {
        await organizationService.update(selectedOrg.id, data);
      } else {
        await organizationService.create(data);
      }
      fetchOrganizations();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save organization:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      try {
        await organizationService.delete(id);
        fetchOrganizations();
      } catch (error) {
        console.error('Failed to delete organization:', error);
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-secondary">{row.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.type === 'HOSPITAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.type}
        </span>
      ),
    },
    {
      header: 'Location',
      accessor: 'city',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-secondary" />
          <span>{row.city}, {row.state}</span>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-secondary" />
            <span>{row.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-secondary" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status || 'Active'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredOrgs = organizations.filter(org => 
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Organizations</h1>
          <p className="text-secondary">Manage hospitals and fleet owners</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterType === 'all' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('HOSPITAL')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterType === 'HOSPITAL' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              Hospitals
            </button>
            <button
              onClick={() => setFilterType('FLEET_OWNER')}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                filterType === 'FLEET_OWNER' ? 'bg-primary text-white' : 'bg-background-card'
              }`}
            >
              Fleets
            </button>
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      <Table columns={columns} data={filteredOrgs} />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedOrg ? 'Edit Organization' : 'Add Organization'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>
              {selectedOrg ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Organization Name"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
            />
            <div>
              <label className="block text-sm font-medium text-text mb-2">Type</label>
              <select {...register('type', { required: 'Type is required' })} className="input">
                <option value="">Select Type</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="FLEET_OWNER">Fleet Owner</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>}
            </div>
          </div>

          <Input
            label="License Number"
            {...register('licenseNumber', { required: 'License number is required' })}
            error={errors.licenseNumber?.message}
          />

          <Input
            label="Address"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              {...register('city', { required: 'City is required' })}
              error={errors.city?.message}
            />
            <Input
              label="State"
              {...register('state', { required: 'State is required' })}
              error={errors.state?.message}
            />
            <Input
              label="Zip Code"
              {...register('zipCode', { required: 'Zip code is required' })}
              error={errors.zipCode?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              {...register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
