import { useState, useEffect } from 'react'
import { getExpenses, getExpenseSummary, createExpense, deleteExpense } from '../api/expenses'
import { getVehicles } from '../api/vehicles'
import { getDrivers } from '../api/drivers'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import KPICard from '../components/KPICard'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import { Plus, DollarSign, Lock, Link2, Trash2, Truck, Fuel, Wrench, Users, FileText } from 'lucide-react'

const categoryColors = {
  Vehicle_Acquisition: 'bg-green-500/20 text-green-400 border-green-500/30',
  Trip_Fuel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Trip_Operational: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Maintenance_Repair: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Driver_Compliance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Miscellaneous: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const categoryIcons = {
  Vehicle_Acquisition: Truck,
  Trip_Fuel: Fuel,
  Trip_Operational: Fuel,
  Maintenance_Repair: Wrench,
  Driver_Compliance: Users,
  Miscellaneous: FileText,
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    source_module: '',
    vehicle_id: '',
    driver_id: '',
    date_from: '',
    date_to: '',
  })
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    vehicle_id: '',
    driver_id: '',
    note: '',
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      const [expensesData, summaryData, vehiclesData, driversData] = await Promise.all([
        getExpenses(filters),
        getExpenseSummary(),
        getVehicles(),
        getDrivers(),
      ])
      setExpenses(expensesData)
      setSummary(summaryData)
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
      })
      toast.success('Expense added manually')
      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add expense')
    }
  }

  const handleDelete = async (expense) => {
    if (!confirm('Delete this expense?')) return
    try {
      await deleteExpense(expense.id)
      toast.success('Expense deleted')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete expense')
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: '',
      vehicle_id: '',
      driver_id: '',
      note: '',
    })
  }

  const getCategoryTotal = (category) => {
    if (!summary?.by_category) return 0
    const found = summary.by_category.find(c => c.category === category)
    return found?.total || 0
  }

  const columns = [
    { key: 'id', label: '#' },
    { 
      key: 'date', 
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      key: 'category', 
      label: 'Category',
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[val]}`}>
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    { 
      key: 'source_module', 
      label: 'Source',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{val}</span>
          {row.source_id && (
            <Link2 className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" title="View source" />
          )}
        </div>
      )
    },
    { key: 'description', label: 'Description' },
    { 
      key: 'vehicle_id', 
      label: 'Vehicle',
      render: (val) => {
        if (!val) return '-'
        const vehicle = vehicles.find(v => v.id === val)
        return vehicle?.name || '-'
      }
    },
    { 
      key: 'driver_id', 
      label: 'Driver',
      render: (val) => {
        if (!val) return '-'
        const driver = drivers.find(d => d.id === val)
        return driver?.name || '-'
      }
    },
    { 
      key: 'amount', 
      label: 'Amount (₹)',
      render: (val) => `₹${val?.toLocaleString()}`
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (_, row) => (
        row.source_module === 'Manual' ? (
          <button
            onClick={() => handleDelete(row)}
            className="text-ff-red hover:text-ff-red/80"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-gray-500" title="Auto-generated expense">
            <Lock className="w-4 h-4" />
          </div>
        )
      )
    },
  ]

  const categories = [
    { value: 'Vehicle_Acquisition', label: 'Vehicle Acquisition', icon: Truck, color: 'green' },
    { value: 'Trip_Fuel', label: 'Trip Fuel', icon: Fuel, color: 'blue' },
    { value: 'Trip_Operational', label: 'Trip Operational', icon: Fuel, color: 'cyan' },
    { value: 'Maintenance_Repair', label: 'Maintenance & Repair', icon: Wrench, color: 'yellow' },
    { value: 'Driver_Compliance', label: 'Driver Compliance', icon: Users, color: 'purple' },
    { value: 'Miscellaneous', label: 'Miscellaneous', icon: FileText, color: 'gray' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ff-green" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
        >
          <Plus className="w-5 h-5" />
          Add Manual Expense
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <div key={cat.value} className={`bg-ff-card border border-ff-border rounded-lg p-4 border-t-4 border-t-${cat.color}-400`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${cat.color}-400`} />
                <span className="text-xs text-gray-400">{cat.label}</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                ₹{getCategoryTotal(cat.value).toLocaleString()}
              </p>
            </div>
          )
        })}
        <div className="bg-ff-card border border-ff-border rounded-lg p-4 border-t-4 border-t-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-white" />
            <span className="text-xs text-gray-400">TOTAL</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            ₹{(summary?.total || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
        >
          <option value="">All Categories</option>
          <option value="Vehicle_Acquisition">Vehicle Acquisition</option>
          <option value="Trip_Fuel">Trip Fuel</option>
          <option value="Trip_Operational">Trip Operational</option>
          <option value="Maintenance_Repair">Maintenance & Repair</option>
          <option value="Driver_Compliance">Driver Compliance</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
        <select
          value={filters.source_module}
          onChange={(e) => setFilters({ ...filters, source_module: e.target.value })}
          className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
        >
          <option value="">All Sources</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Trips">Trips</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Drivers">Drivers</option>
          <option value="Manual">Manual</option>
        </select>
        <select
          value={filters.vehicle_id}
          onChange={(e) => setFilters({ ...filters, vehicle_id: e.target.value })}
          className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
        >
          <option value="">All Vehicles</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          placeholder="From Date"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white"
          placeholder="To Date"
        />
        <button
          onClick={() => setFilters({ category: '', source_module: '', vehicle_id: '', driver_id: '', date_from: '', date_to: '' })}
          className="px-4 py-2 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
        >
          Reset Filters
        </button>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
      />

      {summary?.by_vehicle?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Cost per Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.by_vehicle.map((item) => (
              <div key={item.vehicle_id} className="bg-ff-card border border-ff-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{item.vehicle_name}</span>
                  <span className="text-ff-green font-bold font-mono">₹{item.total_cost.toLocaleString()}</span>
                </div>
                <div className="w-full bg-ff-bg rounded-full h-2">
                  <div 
                    className="bg-ff-green h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (item.total_cost / (summary?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Manual Expense"
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Description"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            required
            placeholder="Enter expense description"
          />
          <FormField
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={(v) => setFormData({ ...formData, amount: v })}
            required
          />
          <FormField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(v) => setFormData({ ...formData, date: v })}
            required
          />
          <FormField
            label="Link to Vehicle (Optional)"
            type="select"
            value={formData.vehicle_id}
            onChange={(v) => setFormData({ ...formData, vehicle_id: v })}
            options={vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.license_plate})` }))}
          />
          <FormField
            label="Link to Driver (Optional)"
            type="select"
            value={formData.driver_id}
            onChange={(v) => setFormData({ ...formData, driver_id: v })}
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />
          <FormField
            label="Note"
            value={formData.note}
            onChange={(v) => setFormData({ ...formData, note: v })}
            placeholder="Optional note"
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
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
