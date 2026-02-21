import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Navigation, MapPin, CheckCircle, Navigation2 } from 'lucide-react'

export default function ActiveTrip() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [trip, setTrip] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [updateMessage, setUpdateMessage] = useState('')

    useEffect(() => {
        fetchActiveTrip()
    }, [])

    const fetchActiveTrip = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/trips/driver/current', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('fleetflow_token')}` }
            })
            if (response.ok) {
                setTrip(await response.json())
            } else {
                navigate('/driver-dashboard')
            }
        } catch (error) {
            console.error('Error fetching active trip:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateLocation = async () => {
        setUpdating(true)
        setUpdateMessage('Ping sent to dispatch...')

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        setUpdateMessage('Location updated successfully.')
        setTimeout(() => setUpdateMessage(''), 3000)
        setUpdating(false)
    }

    const handleCompleteTrip = async () => {
        const finalOdo = prompt("Enter final odometer reading (km):", trip?.vehicle?.odometer_km || 0)
        if (!finalOdo) return;

        setUpdating(true)
        try {
            const response = await fetch(`http://localhost:8000/api/v1/trips/${trip.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fleetflow_token')}`
                },
                body: JSON.stringify({ status: 'Completed', final_odometer: parseFloat(finalOdo) })
            })

            if (response.ok) {
                navigate('/driver-dashboard')
            } else {
                alert("Failed to complete trip.")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setUpdating(false)
        }
    }

    if (loading) return <div className="text-white">Loading trip data...</div>
    if (!trip) return null

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/driver-dashboard')} className="text-gray-400 hover:text-white">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Navigation className="w-6 h-6 text-ff-blue" />
                    Active Trip #{trip.id}
                </h1>
            </div>

            <div className="bg-ff-card border border-ff-border rounded-xl p-6 relative overflow-hidden">
                {/* Mock Map Background Placeholder */}
                <div className="absolute inset-0 bg-[#0f1015] opacity-50 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1b26 0%, transparent 100%)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10 grid gap-8">
                    <div className="flex justify-between items-center px-4">
                        <div className="text-center">
                            <MapPin className="w-8 h-8 text-ff-blue mx-auto mb-2" />
                            <p className="text-sm text-gray-400 uppercase tracking-wider">Origin</p>
                            <p className="font-bold text-xl text-white">{trip.origin}</p>
                        </div>

                        <div className="flex-1 flex items-center justify-center px-8 relative">
                            <div className="h-1 w-full bg-gray-700/50 rounded flex items-center">
                                {/* Simulated progress bar connecting origin and dest */}
                                <div className="h-full bg-gradient-to-r from-ff-blue to-ff-green w-1/2 relative rounded">
                                    <div className="absolute -right-2 -top-1.5 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <MapPin className="w-8 h-8 text-ff-green mx-auto mb-2" />
                            <p className="text-sm text-gray-400 uppercase tracking-wider">Destination</p>
                            <p className="font-bold text-xl text-white">{trip.destination}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-ff-bg/80 backdrop-blur rounded-lg p-4 border border-ff-border/50">
                        <div>
                            <p className="text-xs text-gray-500">CARGO WEIGHT</p>
                            <p className="font-semibold text-white">{trip.cargo_weight_kg} kg</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ASSIGNED VEHICLE</p>
                            <p className="font-semibold text-white">{trip.vehicle?.name || 'Assigned'} ({trip.vehicle?.license_plate || 'N/A'})</p>
                        </div>
                    </div>

                    {updateMessage && (
                        <div className="bg-ff-blue/10 text-ff-blue p-3 rounded-lg text-center text-sm font-medium border border-ff-blue/20 animate-fade-in">
                            {updateMessage}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleUpdateLocation}
                            disabled={updating}
                            className="flex-1 bg-ff-bg border border-ff-border text-white py-4 rounded-xl font-medium hover:bg-ff-border/50 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            <Navigation2 className="w-5 h-5 text-gray-400 group-hover:text-ff-blue transition-colors" />
                            Update Location Ping
                        </button>
                        <button
                            onClick={handleCompleteTrip}
                            disabled={updating}
                            className="flex-1 bg-ff-green text-white py-4 rounded-xl font-medium hover:bg-green-600 transition-colors shadow-[0_0_15px_rgba(0,255,128,0.2)] hover:shadow-[0_0_20px_rgba(0,255,128,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Confirm Arrival & Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
