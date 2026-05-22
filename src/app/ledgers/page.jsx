'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import {
  Plus,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  FileText,
  Layers,
  DollarSign,
  Hash
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Pagination from '@/components/Global/pagination'

export default function LedgersPage() {
  const router = useRouter()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selected, setSelected] = useState([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/ledgers', {
        method: 'GET',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed')

      const data = await res.json()

      let arr = []
      if (Array.isArray(data)) arr = data
      else if (data.data) arr = data.data
      else if (data.ledgers) arr = data.ledgers

      setTransactions(arr)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load data')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const safe = v => (v ? String(v).toLowerCase() : '')

  const filtered = transactions.filter(t =>
    safe(t.name).includes(safe(search)) ||
    safe(t.contactNumber).includes(safe(search)) ||
    safe(t.type).includes(safe(search))
  )

  const sorted = [...filtered].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0)
    const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0)
    return bDate - aDate
  })

  const totalPages = Math.ceil(sorted.length / itemsPerPage)
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getTotalDebit = (ledgers = []) =>
    ledgers.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)

  const getTotalCredit = (ledgers = []) =>
    ledgers.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)

  const totalBalance = transactions.reduce((sum, t) => {
    const debit = getTotalDebit(t.ledgers)
    const credit = getTotalCredit(t.ledgers)
    return sum + (debit - credit)
  }, 0)
  
  const totalLedgers = transactions.reduce((sum, t) => sum + (t.ledgers?.length || 0), 0)
  const totalCustomers = transactions.length

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === paginated.length) {
      setSelected([])
    } else {
      setSelected(paginated.map(t => t.id).filter(Boolean))
    }
  }

  const handleDeleteClick = (id) => {
    setItemToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/ledgers/${itemToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      toast.success('Transaction deleted successfully')
      setDeleteModalOpen(false)
      setItemToDelete(null)
      fetchTransactions()
      
      if (selected.includes(itemToDelete)) {
        setSelected(prev => prev.filter(id => id !== itemToDelete))
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete transaction')
    }
  }

  const deleteSelected = async () => {
    if (selected.length === 0) {
      toast.error('No items selected')
      return
    }

    if (!confirm(`Delete ${selected.length} item(s)?`)) return

    try {
      for (const id of selected) {
        await fetch(`/api/ledgers/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      }

      toast.success(`${selected.length} item(s) deleted successfully`)
      setSelected([])
      fetchTransactions()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete selected items')
    }
  }

  const exportToCSV = () => {
    const headers = ['Type', 'Name', 'Contact Number', 'Ledgers Count', 'Total Debit', 'Total Credit']
    
    const rows = sorted.map(t => [
      t.type || 'N/A',
      t.name || 'N/A',
      t.contactNumber || 'N/A',
      t.ledgers?.length || 0,
      getTotalDebit(t.ledgers),
      getTotalCredit(t.ledgers)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export completed!')
  }

  // Function to get items summary from ledgers
  const getItemsSummary = (ledgers) => {
    if (!ledgers || ledgers.length === 0) return 'No items'
    
    const items = []
    ledgers.forEach(ledger => {
      if (ledger.purchase && ledger.purchase.items && Array.isArray(ledger.purchase.items)) {
        ledger.purchase.items.forEach(item => {
          const itemName = item.inventory?.name || item.name || 'Unknown'
          const quantity = item.quantity || 1
          items.push(`${itemName} (${quantity})`)
        })
      } else if (ledger.order && ledger.order.items && Array.isArray(ledger.order.items)) {
        ledger.order.items.forEach(item => {
          const itemName = item.inventory?.name || item.name || 'Unknown'
          const quantity = item.quantity || 1
          items.push(`${itemName} (${quantity})`)
        })
      }
    })
    
    return items.length > 0 ? items.join(', ') : 'No items'
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'branch_head', 'accountant']}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading ledger data...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head', 'accountant']}>
      <Toaster position="top-right" />

      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Financial Ledger
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all financial transactions
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export
            </button>

            <button
              onClick={() => router.push('/ledgers/add')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase">Total Customers</span>
              <Users size={18} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalCustomers}</div>
            <div className="text-xs text-blue-600 mt-1">Active accounts</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-purple-600 uppercase">Total Ledgers</span>
              <Layers size={18} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{totalLedgers}</div>
            <div className="text-xs text-purple-600 mt-1">Transaction entries</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-600 uppercase">Net Balance</span>
              <DollarSign size={18} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">रु {totalBalance.toLocaleString()}</div>
            <div className="text-xs text-green-600 mt-1">Overall outstanding</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-orange-600 uppercase">Records Found</span>
              <FileText size={18} className="text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900">{sorted.length}</div>
            <div className="text-xs text-orange-600 mt-1">After filter</div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Search by name, contact number or type..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            
            {selected.length > 0 && (
              <button
                onClick={deleteSelected}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete Selected ({selected.length})
              </button>
            )}
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.length === paginated.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ledgers</th>
                  {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th> */}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-gray-300" />
                        <p>No transactions found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(t => {
                    const totalDebit = (t.ledgers || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
                    const totalCredit = (t.ledgers || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
                    const itemsSummary = getItemsSummary(t.ledgers)
                    
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(t.id)}
                            onChange={() => toggleSelect(t.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                            {t.type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{t.name || 'N/A'}</div>
                          {t.supplier?.location && (
                            <div className="text-xs text-gray-500 mt-0.5">{t.supplier.location}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {t.contactNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                            {t.ledgers?.length || 0}
                          </span>
                        </td>
                        {/* <td className="px-4 py-3">
                          <div className="text-xs text-gray-600 max-w-xs truncate" title={itemsSummary}>
                            {itemsSummary}
                          </div>
                        </td> */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-red-600">
                            रु {totalDebit.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-green-600">
                            रु {totalCredit.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/ledgers/view/${t.id}`)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => router.push(`/ledgers/edit/${t.id}`)}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Transaction"
                            >
                              <Edit size={18} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(t.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 size={18} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                showItemsPerPage
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>Showing {paginated.length} of {sorted.length} records</div>
          <div>Page {currentPage} of {totalPages || 1}</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Delete Transaction?
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setItemToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}