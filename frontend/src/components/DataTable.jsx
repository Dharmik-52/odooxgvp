import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

export default function DataTable({
  columns,
  data = [],
  loading = false,
  onEdit,
  onDelete,
  onAction,
  actionLabel,
  enableSearch = true,
  enableSorting = true,
  enablePagination = true,
  enableRowSelection = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Get started by adding new data',
}) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  // Build columns from the simple { key, label, render } format into TanStack column defs
  const tableColumns = useMemo(() => {
    const cols = []

    if (enableRowSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded accent-green-400"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded accent-green-400"
          />
        ),
        size: 40,
        enableSorting: false,
      })
    }

    columns.forEach((col) => {
      cols.push({
        id: col.key,
        accessorFn: (row) => row[col.key],
        header: col.label,
        cell: (info) =>
          col.render
            ? col.render(info.getValue(), info.row.original)
            : info.getValue(),
        enableSorting: col.sortable !== false,
      })
    })

    if (onEdit || onDelete || onAction) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {onAction && (
              <button
                onClick={() => onAction(row.original)}
                className="text-ff-blue hover:text-ff-blue/80 text-xs font-medium px-3 py-1 rounded"
              >
                {actionLabel}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(row.original)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(row.original)}
                className="text-gray-400 hover:text-ff-red transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ),
      })
    }

    return cols
  }, [columns, onEdit, onDelete, onAction, actionLabel, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    enableRowSelection,
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-ff-card border border-ff-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ff-bg">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ff-border">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-ff-border rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-ff-card border border-ff-border rounded-lg p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
        <p className="text-gray-600 text-sm mt-1">{emptySubtext}</p>
      </div>
    )
  }

  const SortIcon = ({ column }) => {
    if (!column.getCanSort()) return null
    const sorted = column.getIsSorted()
    if (sorted === 'asc') return <ChevronUp className="w-4 h-4 text-ff-green" />
    if (sorted === 'desc') return <ChevronDown className="w-4 h-4 text-ff-green" />
    return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-600" />
  }

  return (
    <div className="bg-ff-card border border-ff-border rounded-lg overflow-hidden">
      {/* Search bar */}
      {enableSearch && (
        <div className="px-6 py-3 border-b border-ff-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-ff-bg border border-ff-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ff-green/50 focus:border-ff-green/50"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ff-bg sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${header.id === 'actions' ? 'text-right' : ''
                      } ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-200 transition-colors' : ''}`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={header.column.columnDef.size ? { width: header.column.columnDef.size } : {}}
                  >
                    <div className={`flex items-center gap-1.5 ${header.id === 'actions' ? 'justify-end' : ''}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {enableSorting && header.id !== 'actions' && header.id !== 'select' && (
                        <SortIcon column={header.column} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-ff-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-ff-bg/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 ${cell.column.id === 'actions' ? 'text-right' : ''
                      }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-ff-border">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-400">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} entries
            </p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-ff-bg border border-ff-border rounded text-sm text-gray-300 focus:outline-none"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm bg-ff-bg border border-ff-border rounded hover:bg-ff-border disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm text-gray-400">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm bg-ff-bg border border-ff-border rounded hover:bg-ff-border disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
