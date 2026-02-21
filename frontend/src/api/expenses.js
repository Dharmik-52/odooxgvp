import api from './axios'

export const getExpenses = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category) params.append('category', filters.category)
  if (filters.source_module) params.append('source_module', filters.source_module)
  if (filters.vehicle_id) params.append('vehicle_id', filters.vehicle_id)
  if (filters.driver_id) params.append('driver_id', filters.driver_id)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  
  const response = await api.get(`/expenses/?${params.toString()}`)
  return response.data
}

export const getExpenseSummary = async () => {
  const response = await api.get('/expenses/summary')
  return response.data
}

export const createExpense = async (data) => {
  const response = await api.post('/expenses/', data)
  return response.data
}

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`)
  return response.data
}

export const getVehicleCost = async (vehicleId) => {
  const response = await api.get(`/expenses/vehicle/${vehicleId}`)
  return response.data
}

export const getExpensesSummary = async () => {
  const response = await api.get('/expenses/summary')
  return response.data
}
