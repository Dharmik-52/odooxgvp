const statusColors = {
  Available: 'bg-green-500/20 text-green-400 border-green-500/30',
  On_Trip: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  In_Shop: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Retired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Dispatched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  On_Duty: 'bg-green-500/20 text-green-400 border-green-500/30',
  Off_Duty: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  New: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  In_Progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function StatusPill({ status }) {
  const colorClass = statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
