import { useState } from 'react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { driverSchema, validateForm } from '../utils/validation'
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from '../hooks/useQueries'

export default function Drivers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [filters, setFilters] = useState({ duty_status: '' })
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_expiry: '',
  })
  const [formErrors, setFormErrors] = useState({})

  const { data: drivers = [], isLoading } = useDrivers(filters)
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const deleteMutation = useDeleteDriver()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { success, errors } = validateForm(driverSchema, formData)
    setFormErrors(errors || {})
    if (!success) return

    try {
      if (editingDriver) {
        await updateMutation.mutateAsync({ id: editingDriver.id, data: formData })
        toast.success('Driver updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Driver created')
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    }
  }

  const handleEdit = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (driver) => {
    if (!confirm(`Delete driver ${driver.name}?`)) return
    try {
      await deleteMutation.mutateAsync(driver.id)
      toast.success('Driver deleted')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed')
    }
  }

  const resetForm = () => {
    setEditingDriver(null)
    setFormErrors({})
    setFormData({
      name: '',
      license_number: '',
      license_expiry: '',
    })
  }

  const isLicenseExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date()
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'license_number', label: 'License #' },
    {
      key: 'license_expiry',
      label: 'Expiry',
      render: (val) => {
        const expired = isLicenseExpired(val)
        return (
          <span className={expired ? 'text-ff-red' : 'text-gray-300'}>
            {new Date(val).toLocaleDateString()}
          </span>
        )
      }
    },
    {
      key: 'completion_rate',
      label: 'Completion %',
      render: (val) => `${val}%`
    },
    {
      key: 'safety_score',
      label: 'Safety Score',
      render: (val) => `${val}%`
    },
    {
      key: 'duty_status',
      label: 'Status',
      render: (val, row) => {
        const expired = isLicenseExpired(row.license_expiry)
        if (expired && val !== 'Suspended') {
          return <StatusPill status="Suspended" />
        }
        return <StatusPill status={val} />
      }
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <div className="flex gap-4">
          <select
            value={filters.duty_status}
            onChange={(e) => setFilters({ ...filters, duty_status: e.target.value })}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="On_Duty">On Duty</option>
            <option value="Off_Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
          >
            <Plus className="w-5 h-5" />
            Add Driver
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={drivers}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? 'Edit Driver' : 'Add Driver'}
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Name"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            required
            placeholder="John Smith"
            error={formErrors.name}
          />
          <FormField
            label="License Number"
            value={formData.license_number}
            onChange={(v) => setFormData({ ...formData, license_number: v })}
            required
            placeholder="DL-123456"
            error={formErrors.license_number}
          />
          <FormField
            label="License Expiry"
            type="date"
            value={formData.license_expiry}
            onChange={(v) => setFormData({ ...formData, license_expiry: v })}
            required
            error={formErrors.license_expiry}
          />
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-ff-green text-ff-bg font-semibold rounded-lg hover:bg-ff-green/90"
            >
              {editingDriver ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
