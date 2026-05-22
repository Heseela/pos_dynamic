'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState } from 'react'
import { 
  ArrowLeft, 
  Download,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AllTransactionsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const allTransactions = [
    { id: 'INV-1234', date: '2025-12-26', customer: 'Walk-in Customer', amount: 5000, status: 'Completed', items: 3 },
    { id: 'INV-1233', date: '2025-12-24', customer: 'John Doe', amount: 3500, status: 'Completed', items: 2 },
    { id: 'INV-1232', date: '2025-12-22', customer: 'Jane Smith', amount: 4200, status: 'Pending', items: 4 },
    { id: 'INV-1231', date: '2025-12-20', customer: 'Mike Johnson', amount: 2800, status: 'Completed', items: 2 },
    { id: 'INV-1230', date: '2025-12-18', customer: 'Sarah Williams', amount: 6500, status: 'Completed', items: 5 },
    { id: 'INV-1229', date: '2025-12-16', customer: 'Walk-in Customer', amount: 1900, status: 'Completed', items: 1 },
    { id: 'INV-1228', date: '2025-12-15', customer: 'Robert Brown', amount: 3200, status: 'Pending', items: 3 },
    { id: 'INV-1227', date: '2025-12-14', customer: 'Emma Davis', amount: 4100, status: 'Completed', items: 3 },
    { id: 'INV-1226', date: '2025-12-12', customer: 'Walk-in Customer', amount: 2300, status: 'Completed', items: 2 },
    { id: 'INV-1225', date: '2025-12-10', customer: 'David Wilson', amount: 5800, status: 'Completed', items: 4 },
  ]

  const filteredTransactions = allTransactions.filter(txn => {
    const matchesSearch = (
      txn.id.toLowerCase().includes(search.toLowerCase()) ||
      txn.customer.toLowerCase().includes(search.toLowerCase())
    )
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  const exportToCSV = () => {
    const headers = ['Invoice', 'Date', 'Customer', 'Items', 'Amount', 'Status']
    const rows = filteredTransactions.map(txn => 
      [txn.id, txn.date, txn.customer, txn.items, txn.amount, txn.status]
    )
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'transactions-report.csv'
    link.click()
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
      <div className="space-y-6">
        
       
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/reports')}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">All Transactions</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

      
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice or customer name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                showFilters 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          )}
        </div>

      
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 font-mono">{txn.id}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{txn.date}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-900">{txn.customer}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-gray-600">{txn.items}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900 text-sm">रु{txn.amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-center">
                      {txn.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded-md text-xs font-medium">
                          <CheckCircle size={12} />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-medium">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => router.push(`/ledgers/view/${txn.id.split('-')[1]}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> of{' '}
                <span className="font-semibold text-gray-900">{filteredTransactions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
