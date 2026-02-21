import api from './axios'

export const getMaintenanceLogs = async () => {
  const response = await api.get('/maintenance/')
  return response.data
}

export const createMaintenanceLog = async (data) => {
  const response = await api.post('/maintenance/', data)
  return response.data
}

export const resolveMaintenanceLog = async (id) => {
  const response = await api.patch(`/maintenance/${id}/resolve`)
  return response.data
}

export const updateMaintenanceLog = async (id, data) => {
  const response = await api.put(`/maintenance/${id}`, data)
  return response.data
}
