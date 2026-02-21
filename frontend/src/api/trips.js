import api from './axios'

export const getTrips = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id)
  if (filters.driver_id) params.append('driver_id', filters.driver_id)
  
  const response = await api.get(`/trips/?${params.toString()}`)
  return response.data
}

export const getTrip = async (id) => {
  const response = await api.get(`/trips/${id}`)
  return response.data
}

export const createTrip = async (data) => {
  const response = await api.post('/trips/', data)
  return response.data
}

export const updateTripStatus = async (id, status, finalOdometer = null, actualFuelCost = null) => {
  const data = { status }
  if (finalOdometer) data.final_odometer = finalOdometer
  if (actualFuelCost) data.actual_fuel_cost = actualFuelCost
  
  const response = await api.patch(`/trips/${id}/status`, data)
  return response.data
}

export const updateTrip = async (id, data) => {
  const response = await api.put(`/trips/${id}`, data)
  return response.data
}
