import api from './axios'

export const getVehicles = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.type) params.append('type', filters.type)
  
  const response = await api.get(`/vehicles/?${params.toString()}`)
  return response.data
}

export const getVehicle = async (id) => {
  const response = await api.get(`/vehicles/${id}`)
  return response.data
}

export const createVehicle = async (data) => {
  const response = await api.post('/vehicles/', data)
  return response.data
}

export const updateVehicle = async (id, data) => {
  const response = await api.put(`/vehicles/${id}`, data)
  return response.data
}

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`)
  return response.data
}

export const retireVehicle = async (id) => {
  const response = await api.patch(`/vehicles/${id}/retire`)
  return response.data
}
