import { useState, useEffect } from 'react'
import { getTrips, createTrip, updateTripStatus } from '../api/trips'
import { getVehicles } from '../api/vehicles'
import { getDrivers } from '../api/drivers'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import { Plus, CheckCircle, XCircle } from 'lucide-react'
import { tripSchema, validateForm } from '../utils/validation'

export default function TripDispatch() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({ status: '' })
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    cargo_weight_kg: '',
    origin: '',
    destination: '',
    estimated_distance_km: '',
    revenue: '',
    estimated_fuel_cost: '',
  })
  const [formError, setFormError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      const [tripsData, vehiclesData, driversData] = await Promise.all([
        getTrips(filters),
        getVehicles({ status: 'Available' }),
        getDrivers({ duty_status: 'On_Duty' }),
      ])
      setTrips(tripsData)
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const { success, errors } = validateForm(tripSchema, formData)
    setFormErrors(errors || {})
    if (!success) return

    if (selectedVehicle && parseFloat(formData.cargo_weight_kg) > selectedVehicle.max_capacity_kg) {
      setFormError(`Cargo exceeds vehicle capacity of ${selectedVehicle.max_capacity_kg}kg`)
      return
    }

    try {
      await createTrip({
        ...formData,
        cargo_weight_kg: parseFloat(formData.cargo_weight_kg),
        estimated_distance_km: parseFloat(formData.estimated_distance_km) || 0,
        revenue: parseFloat(formData.revenue) || 0,
        estimated_fuel_cost: parseFloat(formData.estimated_fuel_cost) || 0,
      })
      toast.success('Trip created')
      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create trip')
    }
  }

  const handleComplete = async (trip) => {
    const finalOdometer = prompt('Enter final odometer reading:', trip.vehicle?.odometer_km || '')
    const actualDistance = prompt('Enter actual distance (km):', trip.estimated_distance_km || '')
    const actualFuelCost = prompt('Enter actual fuel cost:', trip.estimated_fuel_cost || '')

    if (finalOdometer === null) return

    try {
      await updateTripStatus(
        trip.id,
        'Completed',
        parseFloat(finalOdometer) || null,
        parseFloat(actualDistance) || null,
        parseFloat(actualFuelCost) || null
      )
      toast.success('Trip completed')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete trip')
    }
  }

  const handleCancel = async (trip) => {
    if (!confirm('Cancel this trip?')) return
    try {
      await updateTripStatus(trip.id, 'Cancelled')
      toast.success('Trip cancelled')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel trip')
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      driver_id: '',
      cargo_weight_kg: '',
      origin: '',
      destination: '',
      estimated_distance_km: '',
      revenue: '',
      estimated_fuel_cost: '',
    })
    setFormError('')
    setFormErrors({})
  }

  const columns = [
    { key: 'id', label: 'Trip ID' },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (val) => val?.name || '-'
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (val) => val?.name || '-'
    },
    {
      key: 'cargo_weight_kg',
      label: 'Cargo (kg)',
      render: (val) => val?.toLocaleString()
    },
    { key: 'origin', label: 'Origin' },
    { key: 'destination', label: 'Destination' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusPill status={val} />
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trip Dispatch</h1>
        <div className="flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={trips}
        onAction={(trip) => trip.status === 'Dispatched' ? handleComplete(trip) : null}
        actionLabel="Complete"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Trip"
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Vehicle"
            type="select"
            value={formData.vehicle_id}
            onChange={(v) => setFormData({ ...formData, vehicle_id: v })}
            options={vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.license_plate}) - ${v.max_capacity_kg}kg` }))}
            required
          />
          {selectedVehicle && (
            <p className="text-xs text-gray-400 -mt-2 mb-4">
              Max capacity: {selectedVehicle.max_capacity_kg}kg
            </p>
          )}
          <FormField
            label="Driver"
            type="select"
            value={formData.driver_id}
            onChange={(v) => setFormData({ ...formData, driver_id: v })}
            options={drivers.map(d => ({ value: d.id, label: `${d.name} (${d.license_number})` }))}
            required
          />
          <FormField
            label="Cargo Weight (kg)"
            type="number"
            value={formData.cargo_weight_kg}
            onChange={(v) => setFormData({ ...formData, cargo_weight_kg: v })}
            required
          />
          {formError && (
            <p className="text-sm text-ff-red mb-4">{formError}</p>
          )}
          <FormField
            label="Origin"
            value={formData.origin}
            onChange={(v) => setFormData({ ...formData, origin: v })}
            required
            placeholder="Mumbai"
          />
          <FormField
            label="Destination"
            value={formData.destination}
            onChange={(v) => setFormData({ ...formData, destination: v })}
            required
            placeholder="Pune"
          />
          <FormField
            label="Est. Distance (km)"
            type="number"
            value={formData.estimated_distance_km}
            onChange={(v) => setFormData({ ...formData, estimated_distance_km: v })}
            placeholder="150"
          />
          <FormField
            label="Revenue"
            type="number"
            value={formData.revenue}
            onChange={(v) => setFormData({ ...formData, revenue: v })}
            placeholder="5000"
          />
          <FormField
            label="Est. Fuel Cost"
            type="number"
            value={formData.estimated_fuel_cost}
            onChange={(v) => setFormData({ ...formData, estimated_fuel_cost: v })}
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
              Create Trip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
