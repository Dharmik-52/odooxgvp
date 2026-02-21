import { useState, useEffect } from 'react'
import { Truck, Route, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DriverDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTrip, setActiveTrip] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchActiveTrip()
    }, [])

    const fetchActiveTrip = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/trips/driver/current', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fleetflow_token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setActiveTrip(data)
            } else if (response.status === 404) {
                setActiveTrip(null)
            } else {
                throw new Error('Failed to fetch active trip')
            }
        } catch (error) {
            console.error('Error fetching active trip:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-white">Loading dashboard...</div>
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Driver'}</h1>
                    <p className="text-gray-400">Here's your current duty status and assignments.</p>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-medium text-sm">On Duty</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Trip Card */}
                <div className="bg-ff-card border border-ff-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Route className="w-5 h-5 text-ff-blue" />
                        Current Assignment
                    </h2>
                    {activeTrip ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-ff-bg rounded-lg border border-ff-border relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-ff-blue"></div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">TRIP #{activeTrip.id}</p>
                                    <p className="font-medium text-white">{activeTrip.origin} <span className="text-gray-500 mx-2">→</span> {activeTrip.destination}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">CARGO</p>
                                    <p className="font-medium text-white">{activeTrip.cargo_weight_kg} kg</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/active-trip')}
                                className="w-full bg-ff-blue text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                                View Trip Details & Navigation
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400">No active trips dispatched to you.</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions Card */}
                <div className="bg-ff-card border border-ff-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid gap-3">
                        <button
                            onClick={() => navigate('/driver-expenses')}
                            disabled={!activeTrip}
                            className="flex items-center gap-3 p-4 rounded-lg border border-ff-border bg-ff-bg hover:bg-ff-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed justify-between group"
                        >
                            <div className="flex items-center gap-3 text-white font-medium">
                                <span className="bg-ff-green/10 text-ff-green p-2 rounded-lg group-hover:bg-ff-green group-hover:text-white transition-colors"><Truck className="w-5 h-5" /></span>
                                Log Fuel/Toll Expense
                            </div>
                        </button>

                        <button className="flex items-center gap-3 p-4 rounded-lg border border-ff-border bg-ff-bg hover:bg-ff-border/50 transition-colors justify-between group">
                            <div className="flex items-center gap-3 text-white font-medium">
                                <span className="bg-ff-red/10 text-ff-red p-2 rounded-lg group-hover:bg-ff-red group-hover:text-white transition-colors"><AlertCircle className="w-5 h-5" /></span>
                                Report Issue or Accident
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
