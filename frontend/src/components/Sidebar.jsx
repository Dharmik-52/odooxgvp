import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Truck, 
  Route, 
  Wrench, 
  Receipt, 
  Users, 
  BarChart3,
  LogOut,
  Menu
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'dispatcher', 'safety_officer', 'analyst'] },
  { path: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['manager'] },
  { path: '/trips', label: 'Trip Dispatch', icon: Route, roles: ['manager', 'dispatcher'] },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['manager', 'dispatcher'] },
  { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['manager', 'dispatcher'] },
  { path: '/drivers', label: 'Drivers', icon: Users, roles: ['manager', 'safety_officer'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['manager', 'analyst'] },
]

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter(item => hasRole(item.roles))

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-ff-card border-r border-ff-border flex flex-col">
      <div className="p-6 border-b border-ff-border">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-8 h-8 text-ff-green" />
          FleetFlow
        </h1>
        <p className="text-xs text-gray-500 mt-1">Fleet & Logistics Management</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-ff-green/10 text-ff-green border-l-2 border-ff-green'
                      : 'text-gray-400 hover:bg-ff-bg hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-ff-border">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-10 h-10 rounded-full bg-ff-bg flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-ff-red hover:bg-ff-red/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
