import api from './axios'

export const getDrivers = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.duty_status) params.append('duty_status', filters.duty_status)
  
  const response = await api.get(`/drivers/?${params.toString()}`)
  return response.data
}

export const getDriver = async (id) => {
  const response = await api.get(`/drivers/${id}`)
  return response.data
}

export const createDriver = async (data) => {
  const response = await api.post('/drivers/', data)
  return response.data
}

export const updateDriver = async (id, data) => {
  const response = await api.put(`/drivers/${id}`, data)
  return response.data
}

export const deleteDriver = async (id) => {
  const response = await api.delete(`/drivers/${id}`)
  return response.data
}
