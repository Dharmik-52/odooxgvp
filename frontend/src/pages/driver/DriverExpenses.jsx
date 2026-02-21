import { useState, useEffect } from 'react'
import { Receipt, Truck, Navigation } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DriverExpenses() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [activeTrip, setActiveTrip] = useState(null)

    const [formData, setFormData] = useState({
        category: 'Trip_Fuel',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        // Fetch active trip to pre-fill vehicle and trip IDs if needed
        const fetchActiveTrip = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/trips/driver/current', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('fleetflow_token')}` }
                })
                if (response.ok) setActiveTrip(await response.json())
            } catch (err) {
                console.error('Error fetching trip context for expense', err)
            }
        }
        fetchActiveTrip()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                vehicle_id: activeTrip?.vehicle?.id || null, // Link to vehicle if on trip
                trip_id: activeTrip?.id || null // Link to trip if on trip
            }

            const response = await fetch('http://localhost:8000/api/v1/expenses/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fleetflow_token')}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error('Failed to submit expense')
            }

            alert('Expense logged successfully!')
            navigate('/driver-dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/driver-dashboard')} className="text-gray-400 hover:text-white">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-ff-green" />
                    Log Expense
                </h1>
            </div>

            <div className="bg-ff-card border border-ff-border rounded-xl p-6">
                {activeTrip ? (
                    <div className="mb-6 bg-ff-bg border border-ff-green/30 p-4 rounded-lg flex items-center gap-4">
                        <Navigation className="w-8 h-8 text-ff-green shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-white">Linking expense to Active Trip #{activeTrip.id}</p>
                            <p className="text-xs text-gray-400">{activeTrip.origin} to {activeTrip.destination}</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                        <p className="text-sm font-medium text-yellow-400">Notice: You have no active trip. This expense will be logged as a general driver expense.</p>
                    </div>
                )}

                {error && (
                    <div className="bg-ff-red/10 border border-ff-red/20 text-ff-red p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-ff-bg border border-ff-border text-white rounded-lg px-4 py-3 focus:outline-none focus:border-ff-green"
                                required
                            >
                                <option value="Trip_Fuel">Fuel Stop</option>
                                <option value="Trip_Operational">Toll / Parking</option>
                                <option value="Miscellaneous">Other/Misc</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full bg-ff-bg border border-ff-border text-white rounded-lg px-4 py-3 focus:outline-none focus:border-ff-green"
                                placeholder="e.g. 500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full bg-ff-bg border border-ff-border text-white rounded-lg px-4 py-3 focus:outline-none focus:border-ff-green [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description / Notes</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-ff-bg border border-ff-border text-white rounded-lg px-4 py-3 focus:outline-none focus:border-ff-green h-24 resize-none"
                            placeholder="Briefly describe the expense..."
                            required
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ff-green text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Submitting...' : 'Submit Expense'}
                            <input type="file" className="hidden" id="receipt-upload" />
                        </button>
                        <div className="mt-4 text-center">
                            <label htmlFor="receipt-upload" className="text-sm text-ff-green cursor-pointer hover:underline flex items-center justify-center gap-2">
                                Add Receipt Photo (Optional)
                            </label>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
