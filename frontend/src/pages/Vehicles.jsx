import { useState } from 'react'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Archive } from 'lucide-react'
import { vehicleSchema, validateForm } from '../utils/validation'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useRetireVehicle } from '../hooks/useQueries'

export default function Vehicles() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [filters, setFilters] = useState({ status: '', type: '' })
  const [formErrors, setFormErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    type: 'Truck',
    max_capacity_kg: '',
    odometer_km: '',
    acquisition_cost: '',
    model: '',
  })

  const { data: vehicles = [], isLoading } = useVehicles(filters)
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const deleteMutation = useDeleteVehicle()
  const retireMutation = useRetireVehicle()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { success, errors } = validateForm(vehicleSchema, formData)
    setFormErrors(errors || {})
    if (!success) return

    try {
      const payload = {
        ...formData,
        max_capacity_kg: parseFloat(formData.max_capacity_kg),
        odometer_km: parseFloat(formData.odometer_km) || 0,
        acquisition_cost: parseFloat(formData.acquisition_cost) || 0,
      }

      if (editingVehicle) {
        await updateMutation.mutateAsync({ id: editingVehicle.id, data: payload })
        toast.success('Vehicle updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Vehicle created')
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name,
      license_plate: vehicle.license_plate,
      type: vehicle.type,
      max_capacity_kg: vehicle.max_capacity_kg.toString(),
      odometer_km: vehicle.odometer_km.toString(),
      acquisition_cost: vehicle.acquisition_cost?.toString() || '',
      model: vehicle.model || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (vehicle) => {
    if (!confirm(`Delete vehicle ${vehicle.name}?`)) return
    try {
      await deleteMutation.mutateAsync(vehicle.id)
      toast.success('Vehicle deleted')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed')
    }
  }

  const handleRetire = async (vehicle) => {
    try {
      await retireMutation.mutateAsync(vehicle.id)
      toast.success('Vehicle retired')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to retire')
    }
  }

  const resetForm = () => {
    setEditingVehicle(null)
    setFormErrors({})
    setFormData({
      name: '',
      license_plate: '',
      type: 'Truck',
      max_capacity_kg: '',
      odometer_km: '',
      acquisition_cost: '',
      model: '',
    })
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'license_plate', label: 'License Plate' },
    { key: 'type', label: 'Type' },
    {
      key: 'max_capacity_kg',
      label: 'Capacity (kg)',
      render: (val) => val?.toLocaleString()
    },
    {
      key: 'odometer_km',
      label: 'Odometer (km)',
      render: (val) => val?.toLocaleString()
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusPill status={val} />
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Vehicles</h1>
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="On_Trip">On Trip</option>
            <option value="In_Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          >
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
          >
            <Plus className="w-5 h-5" />
            New Vehicle
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAction={handleRetire}
        actionLabel="Retire"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle' : 'New Vehicle'}
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="License Plate"
            value={formData.license_plate}
            onChange={(v) => setFormData({ ...formData, license_plate: v })}
            required
            placeholder="ABC-1234"
            error={formErrors.license_plate}
          />
          <FormField
            label="Name"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            required
            placeholder="Ford Transit"
            error={formErrors.name}
          />
          <FormField
            label="Type"
            type="select"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            options={[
              { value: 'Truck', label: 'Truck' },
              { value: 'Van', label: 'Van' },
              { value: 'Bike', label: 'Bike' },
            ]}
          />
          <FormField
            label="Model"
            value={formData.model}
            onChange={(v) => setFormData({ ...formData, model: v })}
            placeholder="2024"
          />
          <FormField
            label="Max Capacity (kg)"
            type="number"
            value={formData.max_capacity_kg}
            onChange={(v) => setFormData({ ...formData, max_capacity_kg: v })}
            required
          />
          <FormField
            label="Odometer (km)"
            type="number"
            value={formData.odometer_km}
            onChange={(v) => setFormData({ ...formData, odometer_km: v })}
          />
          <FormField
            label="Acquisition Cost"
            type="number"
            value={formData.acquisition_cost}
            onChange={(v) => setFormData({ ...formData, acquisition_cost: v })}
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
              {editingVehicle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
