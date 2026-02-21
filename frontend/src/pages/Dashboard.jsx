import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import StatusPill from '../components/StatusPill'
import { Truck, Wrench, Activity, Package } from 'lucide-react'
import { useDashboardStats } from '../hooks/useQueries'

export default function Dashboard() {
  const { data: stats, isLoading: loading } = useDashboardStats()

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
    { key: 'origin', label: 'Origin' },
    { key: 'destination', label: 'Destination' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusPill status={val} />
    },
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
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Active Fleet"
          value={stats?.active_fleet || 0}
          subtitle="Vehicles on trips"
          color="blue"
          icon={Truck}
        />
        <KPICard
          title="Maintenance Alerts"
          value={stats?.maintenance_alerts || 0}
          subtitle="Vehicles in shop"
          color="yellow"
          icon={Wrench}
        />
        <KPICard
          title="Utilization Rate"
          value={`${stats?.utilization_rate || 0}%`}
          subtitle="Fleet utilization"
          color="green"
          icon={Activity}
        />
        <KPICard
          title="Pending Cargo"
          value={stats?.pending_cargo || 0}
          subtitle="Draft trips"
          color="yellow"
          icon={Package}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Trips</h2>
        <DataTable
          columns={columns}
          data={stats?.recent_trips || []}
          loading={loading}
        />
      </div>
    </div>
  )
}
