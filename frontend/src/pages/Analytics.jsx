import { useState, useEffect } from 'react'
import { getReports } from '../api/analytics'
import { getDashboardStats } from '../api/analytics'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Activity, AlertTriangle, Download } from 'lucide-react'

export default function Analytics() {
  const [reports, setReports] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [reportsData, dashboardData] = await Promise.all([
        getReports(),
        getDashboardStats(),
      ])
      setReports(reportsData)
      setDashboard(dashboardData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!reports?.monthly_summary) return
    
    const headers = ['Month', 'Revenue', 'Fuel Cost', 'Maintenance', 'Net Profit']
    const rows = reports.monthly_summary.map(m => [
      m.month,
      m.revenue_proxy,
      m.fuel_cost,
      m.maintenance_cost,
      m.net_profit
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fleetflow_report.csv'
    a.click()
  }

  const downloadPDF = () => {
    window.print()
  }

  const monthlyColumns = [
    { key: 'month', label: 'Month' },
    { 
      key: 'revenue_proxy', 
      label: 'Revenue (₹)',
      render: (val) => val?.toLocaleString() || '-'
    },
    { 
      key: 'fuel_cost', 
      label: 'Fuel Cost (₹)',
      render: (val) => val?.toLocaleString() || '-'
    },
    { 
      key: 'maintenance_cost', 
      label: 'Maintenance (₹)',
      render: (val) => val?.toLocaleString() || '-'
    },
    { 
      key: 'net_profit', 
      label: 'Net Profit (₹)',
      render: (val) => (
        <span className={val >= 0 ? 'text-ff-green' : 'text-ff-red'}>
          {val?.toLocaleString()}
        </span>
      )
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white hover:bg-ff-border"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white hover:bg-ff-border"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total Fuel Cost"
          value={`₹${(reports?.total_fuel_cost || 0).toLocaleString()}`}
          subtitle="All time"
          color="yellow"
          icon={DollarSign}
        />
        <KPICard
          title="Fleet Utilization"
          value={`${dashboard?.utilization_rate || 0}%`}
          subtitle="Currently active"
          color="green"
          icon={Activity}
        />
        <KPICard
          title="Active Fleet"
          value={dashboard?.active_fleet || 0}
          subtitle="Vehicles on trips"
          color="blue"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-ff-card border border-ff-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Fuel Efficiency Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reports?.fuel_efficiency || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="vehicle_name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="km_per_rupee" stroke="#4ADE80" strokeWidth={2} dot={{ fill: '#4ADE80' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-ff-card border border-ff-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Costliest Vehicles</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports?.costliest_vehicles || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="vehicle_name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="total_cost" fill="#F87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Summary</h2>
        <DataTable
          columns={monthlyColumns}
          data={reports?.monthly_summary || []}
        />
      </div>

      {reports?.dead_stock?.length > 0 && (
        <div className="bg-ff-card border border-ff-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-ff-red mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Dead Stock Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.dead_stock.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="bg-ff-bg border border-ff-red/30 rounded-lg p-4">
                <p className="text-white font-medium">{vehicle.vehicle_name}</p>
                <p className="text-gray-400 text-sm">{vehicle.license_plate}</p>
                <p className="text-ff-red text-sm mt-2">No trips in last 30 days</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
