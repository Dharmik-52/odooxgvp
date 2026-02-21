import api from './axios'

export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard')
  return response.data
}

export const getReports = async () => {
  const response = await api.get('/analytics/reports')
  return response.data
}
