import axiosInstance from './axios'

export const getExpenses = async (params = {}) => {
  const {
    search = "",
    category = "",
    source_module = "",
    vehicle_id = "",
    driver_id = "",
    amount_min = null,
    amount_max = null,
    date_from = null,
    date_to = null,
    sort_by = "date",
    sort_order = "desc",
    page = 1,
    per_page = 20
  } = params

  const queryParams = {}
  
  if (search) queryParams.search = search
  if (category) queryParams.category = category
  if (source_module) queryParams.source_module = source_module
  if (vehicle_id) queryParams.vehicle_id = vehicle_id
  if (driver_id) queryParams.driver_id = driver_id
  if (amount_min !== null) queryParams.amount_min = amount_min
  if (amount_max !== null) queryParams.amount_max = amount_max
  if (date_from) queryParams.date_from = date_from
  if (date_to) queryParams.date_to = date_to
  queryParams.sort_by = sort_by
  queryParams.sort_order = sort_order
  queryParams.page = page
  queryParams.per_page = per_page
  
  const response = await axiosInstance.get("/expenses/", { params: queryParams })
  return response.data
}

export const getExpenseCategories = async () => {
  const response = await axiosInstance.get("/expenses/categories")
  return response.data
}

export const getExpenseSummary = async () => {
  const response = await axiosInstance.get('/expenses/summary')
  return response.data
}

export const createExpense = async (data) => {
  const response = await axiosInstance.post('/expenses/', data)
  return response.data
}

export const deleteExpense = async (id) => {
  const response = await axiosInstance.delete(`/expenses/${id}`)
  return response.data
}

export const getVehicleCost = async (vehicleId) => {
  const response = await axiosInstance.get(`/expenses/vehicle/${vehicleId}`)
  return response.data
}

export const getExpensesSummary = async () => {
  const response = await axiosInstance.get('/expenses/summary')
  return response.data
}
