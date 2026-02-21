const colorMap = {
  green: 'border-l-ff-green',
  red: 'border-l-ff-red',
  yellow: 'border-l-ff-yellow',
  blue: 'border-l-ff-blue',
}

export default function KPICard({ title, value, subtitle, color = 'green', icon: Icon }) {
  return (
    <div className={`bg-ff-card border border-ff-border rounded-lg p-6 border-l-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white font-mono">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-ff-bg rounded-lg">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  )
}
