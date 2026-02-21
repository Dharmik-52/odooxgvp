import { useState, useEffect, useRef, useMemo } from 'react'
import { getExpenses, getExpenseSummary, getExpenseCategories, createExpense, deleteExpense } from '../api/expenses'
import { getVehicles } from '../api/vehicles'
import { getDrivers } from '../api/drivers'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import KPICard from '../components/KPICard'
import StatusPill from '../components/StatusPill'
import toast from 'react-hot-toast'
import {
  Plus, DollarSign, Lock, Link2, Trash2, Truck, Fuel, Wrench, Users, FileText,
  Search, X, ChevronDown, Calendar, Filter, ArrowUpDown
} from 'lucide-react'

const categoryColors = {
  Vehicle_Acquisition: 'bg-green-500/20 text-green-400 border-green-500/30',
  Trip_Fuel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Trip_Operational: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Maintenance_Repair: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Driver_Compliance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Miscellaneous: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const categoryIcons = {
  Vehicle_Acquisition: Truck,
  Trip_Fuel: Fuel,
  Trip_Operational: Fuel,
  Maintenance_Repair: Wrench,
  Driver_Compliance: Users,
  Miscellaneous: FileText,
}

const sourceOptions = [
  { value: 'Vehicles', label: 'Vehicles', icon: Truck },
  { value: 'Trips', label: 'Trips', icon: Fuel },
  { value: 'Maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'Drivers', label: 'Drivers', icon: Users },
  { value: 'Manual', label: 'Manual', icon: FileText },
]

const sortOptions = [
  { value: 'date-desc', label: 'Date (Newest First)', sortBy: 'date', sortOrder: 'desc' },
  { value: 'date-asc', label: 'Date (Oldest First)', sortBy: 'date', sortOrder: 'asc' },
  { value: 'amount-desc', label: 'Amount (High → Low)', sortBy: 'amount', sortOrder: 'desc' },
  { value: 'amount-asc', label: 'Amount (Low → High)', sortBy: 'amount', sortOrder: 'asc' },
  { value: 'category-asc', label: 'Category (A → Z)', sortBy: 'category', sortOrder: 'asc' },
  { value: 'source_module-asc', label: 'Source Module (A → Z)', sortBy: 'source_module', sortOrder: 'asc' },
]

function Dropdown({ isOpen, onClose, children, anchorRef }) {
  if (!isOpen) return null

  return (
    <div className="absolute z-50 mt-2">
      {children}
    </div>
  )
}

function FilterDropdown({
  isOpen,
  onClose,
  trigger,
  children,
  anchorRef,
  width = "w-64"
}) {
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const triggerEl = anchorRef?.current
        if (triggerEl && !triggerEl.contains(event.target)) {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  return (
    <div ref={dropdownRef} className={`absolute z-50 mt-2 ${width}`}>
      <div className="bg-ff-card border border-ff-border rounded-lg shadow-xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    sources: [],
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1
  })

  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [categorySearch, setCategorySearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimeoutRef = useRef(null)

  const [activeDropdown, setActiveDropdown] = useState(null)
  const categoryBtnRef = useRef(null)
  const sourceBtnRef = useRef(null)
  const amountBtnRef = useRef(null)
  const dateBtnRef = useRef(null)
  const sortBtnRef = useRef(null)

  const filteredCategoryOptions = useMemo(() => {
    return categoryOptions.filter(c =>
      c.category.toLowerCase().includes(categorySearch.toLowerCase())
    )
  }, [categoryOptions, categorySearch])

  const hasActiveFilters = useMemo(() => {
    return filters.search ||
      filters.categories.length > 0 ||
      filters.sources.length > 0 ||
      filters.amountMin ||
      filters.amountMax ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy !== 'date' ||
      filters.sortOrder !== 'desc'
  }, [filters])

  useEffect(() => {
    loadCategoryOptions()
    loadData()
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchInput])

  useEffect(() => {
    loadData()
  }, [filters])

  const loadCategoryOptions = async () => {
    try {
      const data = await getExpenseCategories()
      setCategoryOptions(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [expensesData, summaryData, vehiclesData, driversData] = await Promise.all([
        getExpenses({
          search: filters.search,
          category: filters.categories.join(','),
          source_module: filters.sources.join(','),
          amount_min: filters.amountMin ? parseFloat(filters.amountMin) : null,
          amount_max: filters.amountMax ? parseFloat(filters.amountMax) : null,
          date_from: filters.dateFrom || null,
          date_to: filters.dateTo || null,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
          page: filters.page,
          per_page: 20
        }),
        getExpenseSummary(),
        getVehicles(),
        getDrivers(),
      ])
      setExpenses(expensesData.items || [])
      setTotalCount(expensesData.total || 0)
      setTotalPages(expensesData.total_pages || 0)
      setSummary(summaryData)
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
      })
      toast.success('Expense added manually')
      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add expense')
    }
  }

  const handleDelete = async (expense) => {
    if (!confirm('Delete this expense?')) return
    try {
      await deleteExpense(expense.id)
      toast.success('Expense deleted')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete expense')
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: '',
      vehicle_id: '',
      driver_id: '',
      note: '',
    })
  }

  const resetAllFilters = () => {
    setSearchInput('')
    setFilters({
      search: '',
      categories: [],
      sources: [],
      amountMin: '',
      amountMax: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1
    })
    setCategorySearch('')
  }

  const removeFilter = (filterKey) => {
    if (filterKey === 'search') {
      setSearchInput('')
      setFilters(prev => ({ ...prev, search: '', page: 1 }))
    } else if (filterKey === 'categories') {
      setFilters(prev => ({ ...prev, categories: [], page: 1 }))
    } else if (filterKey === 'sources') {
      setFilters(prev => ({ ...prev, sources: [], page: 1 }))
    } else if (filterKey === 'amount') {
      setFilters(prev => ({ ...prev, amountMin: '', amountMax: '', page: 1 }))
    } else if (filterKey === 'date') {
      setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '', page: 1 }))
    } else if (filterKey === 'sort') {
      setFilters(prev => ({ ...prev, sortBy: 'date', sortOrder: 'desc', page: 1 }))
    }
  }

  const applyCategories = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    setActiveDropdown(null)
  }

  const applySources = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    setActiveDropdown(null)
  }

  const applyAmount = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    setActiveDropdown(null)
  }

  const applyDate = () => {
    setFilters(prev => ({ ...prev, page: 1 }))
    setActiveDropdown(null)
  }

  const applySort = (sortBy, sortOrder) => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
    setActiveDropdown(null)
  }

  const quickDateSelect = (range) => {
    const today = new Date()
    let from, to

    if (range === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1)
      to = today
    } else if (range === 'lastMonth') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
    } else if (range === 'thisYear') {
      from = new Date(today.getFullYear(), 0, 1)
      to = today
    }

    setFilters(prev => ({
      ...prev,
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0]
    }))
  }

  const getCategoryTotal = (category) => {
    if (!summary?.by_category) return 0
    const found = summary.by_category.find(c => c.category === category)
    return found?.total || 0
  }

  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? <mark key={i} className="bg-yellow-500/40 text-yellow-200 rounded px-0.5">{part}</mark>
        : part
    )
  }

  const formatCategoryLabel = (category) => {
    return category.replace(/_/g, ' ')
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Vehicle_Acquisition': Truck,
      'Trip_Fuel': Fuel,
      'Trip_Operational': Fuel,
      'Maintenance_Repair': Wrench,
      'Driver_Compliance': Users,
      'Miscellaneous': FileText,
    }
    return iconMap[category] || FileText
  }

  const getCategoryColor = (category) => {
    return categoryColors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    vehicle_id: '',
    driver_id: '',
    note: '',
  })

  const categories = [
    { value: 'Vehicle_Acquisition', label: 'Vehicle Acquisition', icon: Truck, color: 'green' },
    { value: 'Trip_Fuel', label: 'Trip Fuel', icon: Fuel, color: 'blue' },
    { value: 'Trip_Operational', label: 'Trip Operational', icon: Fuel, color: 'cyan' },
    { value: 'Maintenance_Repair', label: 'Maintenance & Repair', icon: Wrench, color: 'yellow' },
    { value: 'Driver_Compliance', label: 'Driver Compliance', icon: Users, color: 'purple' },
    { value: 'Miscellaneous', label: 'Miscellaneous', icon: FileText, color: 'gray' },
  ]

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[val]}`}>
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'source_module',
      label: 'Source',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{val}</span>
          {row.source_id && (
            <Link2 className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" title="View source" />
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => highlightText(val, filters.search)
    },
    {
      key: 'vehicle_id',
      label: 'Vehicle',
      render: (val) => {
        if (!val) return '-'
        const vehicle = vehicles.find(v => v.id === val)
        return vehicle?.name || '-'
      }
    },
    {
      key: 'driver_id',
      label: 'Driver',
      render: (val) => {
        if (!val) return '-'
        const driver = drivers.find(d => d.id === val)
        return driver?.name || '-'
      }
    },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (val) => `₹${val?.toLocaleString()}`
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        row.source_module === 'Manual' ? (
          <button
            onClick={() => handleDelete(row)}
            className="text-ff-red hover:text-ff-red/80"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-gray-500" title="Auto-generated expense">
            <Lock className="w-4 h-4" />
          </div>
        )
      )
    },
  ]

  const currentSortOption = sortOptions.find(
    opt => opt.sortBy === filters.sortBy && opt.sortOrder === filters.sortOrder
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
        >
          <Plus className="w-5 h-5" />
          Add Manual Expense
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <div key={cat.value} className={`bg-ff-card border border-ff-border rounded-lg p-4 border-t-4 border-t-${cat.color}-400`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${cat.color}-400`} />
                <span className="text-xs text-gray-400">{cat.label}</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                ₹{getCategoryTotal(cat.value).toLocaleString()}
              </p>
            </div>
          )
        })}
        <div className="bg-ff-card border border-ff-border rounded-lg p-4 border-t-4 border-t-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-white" />
            <span className="text-xs text-gray-400">TOTAL</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            ₹{(summary?.total || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-ff-card border border-ff-border rounded-lg p-4 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by description, vehicle, driver, trip ID..."
            className="w-full pl-12 pr-12 py-3 bg-ff-bg border border-ff-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ff-green focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center pb-2">
          <div className="relative">
            <button
              ref={categoryBtnRef}
              onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
              className={`flex items-center gap-2 px-4 py-2 bg-ff-bg border rounded-lg text-white hover:bg-ff-border ${filters.categories.length > 0 ? 'border-ff-green' : 'border-ff-border'}`}
            >
              <Filter className="w-4 h-4" />
              {filters.categories.length > 0
                ? `Categories (${filters.categories.length})`
                : 'All Categories'}
              <ChevronDown className="w-4 h-4" />
              {filters.categories.length > 0 && (
                <span className="w-2 h-2 bg-ff-green rounded-full" />
              )}
            </button>
            <FilterDropdown
              isOpen={activeDropdown === 'category'}
              onClose={() => setActiveDropdown(null)}
              anchorRef={categoryBtnRef}
              width="w-80"
            >
              <div className="p-3 border-b border-ff-border">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 bg-ff-bg border border-ff-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-ff-green"
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {filteredCategoryOptions.map((cat) => {
                  const Icon = getCategoryIcon(cat.category)
                  const isSelected = filters.categories.includes(cat.category)
                  return (
                    <label
                      key={cat.category}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ff-border cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, categories: [...prev.categories, cat.category] }))
                          } else {
                            setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat.category) }))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-500 text-ff-green focus:ring-ff-green"
                      />
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-white">{formatCategoryLabel(cat.category)}</span>
                      <span className="text-gray-500 text-sm">({cat.count})</span>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-2 p-3 border-t border-ff-border">
                <button
                  onClick={() => { setFilters(prev => ({ ...prev, categories: [] })); setCategorySearch('') }}
                  className="flex-1 py-2 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
                >
                  Clear
                </button>
                <button
                  onClick={applyCategories}
                  className="flex-1 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
                >
                  Apply
                </button>
              </div>
            </FilterDropdown>
          </div>

          <div className="relative">
            <button
              ref={sourceBtnRef}
              onClick={() => setActiveDropdown(activeDropdown === 'source' ? null : 'source')}
              className={`flex items-center gap-2 px-4 py-2 bg-ff-bg border rounded-lg text-white hover:bg-ff-border ${filters.sources.length > 0 ? 'border-ff-green' : 'border-ff-border'}`}
            >
              <Filter className="w-4 h-4" />
              {filters.sources.length > 0
                ? `Sources (${filters.sources.length})`
                : 'All Sources'}
              <ChevronDown className="w-4 h-4" />
              {filters.sources.length > 0 && (
                <span className="w-2 h-2 bg-ff-green rounded-full" />
              )}
            </button>
            <FilterDropdown
              isOpen={activeDropdown === 'source'}
              onClose={() => setActiveDropdown(null)}
              anchorRef={sourceBtnRef}
              width="w-56"
            >
              <div className="max-h-64 overflow-y-auto p-2">
                {sourceOptions.map((source) => {
                  const Icon = source.icon
                  const isSelected = filters.sources.includes(source.value)
                  return (
                    <label
                      key={source.value}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ff-border cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, sources: [...prev.sources, source.value] }))
                          } else {
                            setFilters(prev => ({ ...prev, sources: prev.sources.filter(s => s !== source.value) }))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-500 text-ff-green focus:ring-ff-green"
                      />
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{source.label}</span>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-2 p-3 border-t border-ff-border">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sources: [] }))}
                  className="flex-1 py-2 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
                >
                  Clear
                </button>
                <button
                  onClick={applySources}
                  className="flex-1 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
                >
                  Apply
                </button>
              </div>
            </FilterDropdown>
          </div>

          <div className="relative">
            <button
              ref={amountBtnRef}
              onClick={() => setActiveDropdown(activeDropdown === 'amount' ? null : 'amount')}
              className={`flex items-center gap-2 px-4 py-2 bg-ff-bg border rounded-lg text-white hover:bg-ff-border ${(filters.amountMin || filters.amountMax) ? 'border-ff-green' : 'border-ff-border'}`}
            >
              <DollarSign className="w-4 h-4" />
              {filters.amountMin || filters.amountMax
                ? `₹${filters.amountMin || '0'} - ₹${filters.amountMax || '∞'}`
                : 'Amount Range'}
              <ChevronDown className="w-4 h-4" />
              {(filters.amountMin || filters.amountMax) && (
                <span className="w-2 h-2 bg-ff-green rounded-full" />
              )}
            </button>
            <FilterDropdown
              isOpen={activeDropdown === 'amount'}
              onClose={() => setActiveDropdown(null)}
              anchorRef={amountBtnRef}
              width="w-56"
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min ₹</label>
                  <input
                    type="number"
                    value={filters.amountMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-ff-bg border border-ff-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-ff-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max ₹</label>
                  <input
                    type="number"
                    value={filters.amountMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                    placeholder="No limit"
                    className="w-full px-3 py-2 bg-ff-bg border border-ff-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-ff-green"
                  />
                </div>
              </div>
              <div className="flex gap-2 p-3 border-t border-ff-border">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, amountMin: '', amountMax: '' }))}
                  className="flex-1 py-2 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
                >
                  Clear
                </button>
                <button
                  onClick={applyAmount}
                  className="flex-1 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
                >
                  Apply
                </button>
              </div>
            </FilterDropdown>
          </div>

          <div className="relative">
            <button
              ref={dateBtnRef}
              onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
              className={`flex items-center gap-2 px-4 py-2 bg-ff-bg border rounded-lg text-white hover:bg-ff-border ${(filters.dateFrom || filters.dateTo) ? 'border-ff-green' : 'border-ff-border'}`}
            >
              <Calendar className="w-4 h-4" />
              {filters.dateFrom || filters.dateTo
                ? `${filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Start'} – ${filters.dateTo ? new Date(filters.dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'End'}`
                : 'Date Range'}
              <ChevronDown className="w-4 h-4" />
              {(filters.dateFrom || filters.dateTo) && (
                <span className="w-2 h-2 bg-ff-green rounded-full" />
              )}
            </button>
            <FilterDropdown
              isOpen={activeDropdown === 'date'}
              onClose={() => setActiveDropdown(null)}
              anchorRef={dateBtnRef}
              width="w-64"
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 bg-ff-bg border border-ff-border rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-ff-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-ff-bg border border-ff-border rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-ff-green"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => quickDateSelect('thisMonth')}
                    className="px-3 py-1 text-xs bg-ff-bg border border-ff-border rounded-lg text-gray-300 hover:bg-ff-border"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => quickDateSelect('lastMonth')}
                    className="px-3 py-1 text-xs bg-ff-bg border border-ff-border rounded-lg text-gray-300 hover:bg-ff-border"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => quickDateSelect('thisYear')}
                    className="px-3 py-1 text-xs bg-ff-bg border border-ff-border rounded-lg text-gray-300 hover:bg-ff-border"
                  >
                    This Year
                  </button>
                </div>
              </div>
              <div className="flex gap-2 p-3 border-t border-ff-border">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                  className="flex-1 py-2 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
                >
                  Clear
                </button>
                <button
                  onClick={applyDate}
                  className="flex-1 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
                >
                  Apply
                </button>
              </div>
            </FilterDropdown>
          </div>

          <div className="relative">
            <button
              ref={sortBtnRef}
              onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
              className="flex items-center gap-2 px-4 py-2 bg-ff-bg border border-ff-border rounded-lg text-white hover:bg-ff-border"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort
              <ChevronDown className="w-4 h-4" />
            </button>
            <FilterDropdown
              isOpen={activeDropdown === 'sort'}
              onClose={() => setActiveDropdown(null)}
              anchorRef={sortBtnRef}
              width="w-56"
            >
              <div className="p-2">
                {sortOptions.map((option) => {
                  const isSelected = filters.sortBy === option.sortBy && filters.sortOrder === option.sortOrder
                  return (
                    <button
                      key={option.value}
                      onClick={() => applySort(option.sortBy, option.sortOrder)}
                      className={`w-full text-left px-3 py-2 rounded-lg ${isSelected ? 'bg-ff-green/20 text-ff-green' : 'text-white hover:bg-ff-border'}`}
                    >
                      {isSelected && '● '}{option.label}
                    </button>
                  )
                })}
              </div>
            </FilterDropdown>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-2 px-4 py-2 border border-ff-red/50 text-ff-red rounded-lg hover:bg-ff-red/10"
            >
              <X className="w-4 h-4" />
              Reset All
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-ff-border">
            {filters.search && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-border rounded-full text-white">
                <Search className="w-3 h-3" />
                <span>"{filters.search}"</span>
                <button onClick={() => removeFilter('search')} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {filters.categories.map(cat => (
              <div key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-green/50 rounded-full text-white">
                <span className="text-ff-green">●</span>
                <span>{formatCategoryLabel(cat)}</span>
                <button onClick={() => {
                  setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))
                }} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {filters.sources.map(src => (
              <div key={src} className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-green/50 rounded-full text-white">
                <span className="text-ff-green">●</span>
                <span>{src}</span>
                <button onClick={() => {
                  setFilters(prev => ({ ...prev, sources: prev.sources.filter(s => s !== src) }))
                }} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(filters.amountMin || filters.amountMax) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-green/50 rounded-full text-white">
                <DollarSign className="w-3 h-3" />
                <span>₹{filters.amountMin || '0'} - ₹{filters.amountMax || '∞'}</span>
                <button onClick={() => removeFilter('amount')} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-green/50 rounded-full text-white">
                <Calendar className="w-3 h-3" />
                <span>{filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Start'} - {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'End'}</span>
                <button onClick={() => removeFilter('date')} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {(filters.sortBy !== 'date' || filters.sortOrder !== 'desc') && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ff-bg border border-ff-green/50 rounded-full text-white">
                <ArrowUpDown className="w-3 h-3" />
                <span>{currentSortOption?.label}</span>
                <button onClick={() => removeFilter('sort')} className="hover:text-ff-red">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!loading && (
        <div className="mb-4 text-gray-400">
          Showing {expenses.length} of {totalCount} expenses
        </div>
      )}

      {loading ? (
        <div className="bg-ff-card border border-ff-border rounded-lg overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 border-b border-ff-border bg-ff-bg" />
            ))}
          </div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-ff-card border border-ff-border rounded-lg p-12 text-center">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No expenses found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-ff-green text-ff-bg font-medium rounded-lg hover:bg-ff-green/90"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ff-border"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {filters.page} of {totalPages}
          </span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={filters.page === totalPages}
            className="px-4 py-2 bg-ff-card border border-ff-border rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ff-border"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Manual Expense"
      >
        <form onSubmit={handleSubmit}>
          <FormField
            label="Description"
            value={formData.description}
            onChange={(v) => setFormData({ ...formData, description: v })}
            required
            placeholder="Enter expense description"
          />
          <FormField
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={(v) => setFormData({ ...formData, amount: v })}
            required
          />
          <FormField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(v) => setFormData({ ...formData, date: v })}
            required
          />
          <FormField
            label="Link to Vehicle (Optional)"
            type="select"
            value={formData.vehicle_id}
            onChange={(v) => setFormData({ ...formData, vehicle_id: v })}
            options={vehicles.map(v => ({ value: v.id, label: `${v.name} (${v.license_plate})` }))}
          />
          <FormField
            label="Link to Driver (Optional)"
            type="select"
            value={formData.driver_id}
            onChange={(v) => setFormData({ ...formData, driver_id: v })}
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />
          <FormField
            label="Note"
            value={formData.note}
            onChange={(v) => setFormData({ ...formData, note: v })}
            placeholder="Optional note"
          />
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 border border-ff-border text-gray-300 rounded-lg hover:bg-ff-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-ff-green text-ff-bg font-semibold rounded-lg hover:bg-ff-green/90"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
