import { useState, useEffect } from 'react'
import { getMaintenanceLogs, createMaintenanceLog, resolveMaintenanceLog } from '../api/maintenance'
import { getVehicles } from '../api/vehicles'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import { Plus, CheckCircle } from 'lucide-react'

export default function Maintenance() {
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    issue: '',
    service_date: '',
    cost: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [logsData, vehiclesData] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
      ])
      setLogs(logsData)
      setVehicles(vehiclesData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMaintenanceLog({
        ...formData,
        service_date: formData.service_date,
        cost: parseFloat(formData.cost),
      })
      toast.success('Vehicle marked as In Shop')
      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create log')
    }
  }

  const handleResolve = async (log) => {
    try {
      await resolveMaintenanceLog(log.id)
      toast.success('Maintenance resolved')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resolve')
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      issue: '',
      service_date: '',
      cost: '',
    })
  }

  const columns = [
    { key: 'id', label: 'Log ID' },
    { 
      key: 'vehicle', 
      label: 'Vehicle',
      render: (val) => val?.name || '-'
    },
    { key: 'issue', label: 'Issue' },
    { 
      key: 'service_date', 
      label: 'Service Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      key: 'cost', 
      label: 'Cost',
      render: (val) => `₹${val?.toLocaleString()}`
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
        <h1 className="text-2xl font-bold text-white">Maintenance</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
        >
          <Plus className="w-5 h-5" />
          New Service
        </button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        onAction={(log) => log.status !== 'Resolved' ? handleResolve : null}
        actionLabel="Resolve"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Service"
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Vehicle"
            type="select"
            value={formData.vehicle_id}
            onChange={(v) => setFormData({ ...formData, vehicle_id: v })}
            options={vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.license_plate})` }))}
            required
          />
          <FormField
            label="Issue"
            value={formData.issue}
            onChange={(v) => setFormData({ ...formData, issue: v })}
            required
            placeholder="Oil change required"
          />
          <FormField
            label="Service Date"
            type="date"
            value={formData.service_date}
            onChange={(v) => setFormData({ ...formData, service_date: v })}
            required
          />
          <FormField
            label="Cost (₹)"
            type="number"
            value={formData.cost}
            onChange={(v) => setFormData({ ...formData, cost: v })}
            required
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
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
