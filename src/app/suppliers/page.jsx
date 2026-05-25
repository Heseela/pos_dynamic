'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import {
  Plus,
  Filter,
  Download,
  Search,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Building2,
  Wallet
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Pagination from '@/components/Global/pagination'

export default function SuppliersPage() {
  const router = useRouter()

  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [selectedSuppliers, setSelectedSuppliers] = useState([])

  const [deleteModal, setDeleteModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState(null)

  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/suppliers')

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()

      const mappedSuppliers = (data || []).map((supplier) => ({
        id: supplier.id,
        name: supplier.name || 'N/A',
        location: supplier.location || 'N/A',
        panvat: supplier.panvat || 'N/A',
        contact: supplier.contact || 'N/A',
        totalamount: supplier.totalamount || '0',
        paid: supplier.paid || '0',
        credit: supplier.credit || '0',
        accountNo: supplier.accountNo || '',
        bankname: supplier.bankname || '',
        image: supplier.image || [],
      }))

      setSuppliers(mappedSuppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const totalSuppliers = suppliers.length

  const totalOutstanding = suppliers.reduce(
    (sum, s) =>
      sum +
      (parseFloat(s.totalamount || 0) -
        parseFloat(s.paid || 0)),
    0
  )

  const totalPaid = suppliers.reduce(
    (sum, s) => sum + parseFloat(s.paid || 0),
    0
  )

  const avgCredit =
    totalSuppliers > 0
      ? totalOutstanding / totalSuppliers
      : 0

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = search.toLowerCase()

    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.location.toLowerCase().includes(searchLower) ||
      supplier.contact.includes(searchLower) ||
      supplier.panvat.includes(searchLower)
    )
  })

  const sortedSuppliers = [...filteredSuppliers].sort(
    (a, b) => new Date(b.id) - new Date(a.id)
  )

  const totalPages = Math.ceil(
    sortedSuppliers.length / itemsPerPage
  )

  const startIndex = (currentPage - 1) * itemsPerPage

  const paginatedSuppliers = sortedSuppliers.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const toggleSelectAll = () => {
    if (
      selectedSuppliers.length ===
      paginatedSuppliers.length
    ) {
      setSelectedSuppliers([])
    } else {
      setSelectedSuppliers(
        paginatedSuppliers.map((s) => s.id)
      )
    }
  }

  const toggleSelectSupplier = (id) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedSuppliers.map((id) =>
        fetch(`/api/suppliers/${id}`, {
          method: 'DELETE',
        })
      )

      await Promise.all(deletePromises)

      toast.success(
        `${selectedSuppliers.length} supplier(s) deleted successfully`
      )

      fetchSuppliers()

      setSelectedSuppliers([])

      setBulkDeleteModal(false)
    } catch (error) {
      console.error(
        'Error bulk deleting suppliers:',
        error
      )

      toast.error('Failed to delete suppliers')
    }
  }

  const openDeleteModal = (supplier) => {
    setSupplierToDelete(supplier)
    setDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!supplierToDelete) return

    try {
      const response = await fetch(
        `/api/suppliers/${supplierToDelete.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete supplier')
      }

      toast.success('Supplier deleted successfully')

      setDeleteModal(false)

      setSupplierToDelete(null)

      fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)

      toast.error('Failed to delete supplier')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Location',
      'PAN/VAT',
      'Contact',
      'Total Amount',
      'Paid',
      'Credit',
    ]

    const rows = sortedSuppliers.map((s) => [
      s.id,
      s.name,
      s.location,
      s.panvat,
      s.contact,
      s.totalamount,
      s.paid,
      s.credit,
    ])

    const csv = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `suppliers-${
      new Date().toISOString().split('T')[0]
    }.csv`

    link.click()

    toast.success('Export completed!')
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedSuppliers([])
  }

  const handleItemsPerPageChange = (
    newItemsPerPage
  ) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedSuppliers([])
  }

  if (loading) {
    return (
      <ProtectedRoute
        allowedRoles={[
          'admin',
          'branch_head',
          'accountant',
        ]}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />

            <p className="text-gray-600">
              Loading suppliers...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute
      allowedRoles={[
        'admin',
        'branch_head',
        'accountant',
      ]}
    >
      <Toaster position="top-right" />

      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  {/* Left Content */}
  <div>
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
      Suppliers
    </h1>

    <p className="text-sm text-gray-500 mt-1">
      {sortedSuppliers.length}{" "}
      {sortedSuppliers.length === 1
        ? "supplier"
        : "suppliers"}
    </p>
  </div>

  {/* Right Buttons */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
    <button
      onClick={exportToCSV}
      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
    >
      <Download size={16} />
      Export
    </button>

    <button
      onClick={() =>
        router.push('/suppliers/add')
      }
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
    >
      <Plus size={16} />
      Add Supplier
    </button>
  </div>
</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Suppliers
              </span>

              <Building2
                className="text-gray-400"
                size={16}
              />
            </div>

            <div className="text-2xl font-semibold text-gray-900">
              {totalSuppliers}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Paid
              </span>

              <TrendingUp
                className="text-green-500"
                size={16}
              />
            </div>

            <div className="text-2xl font-semibold text-green-600">
              रु{totalPaid.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Outstanding
              </span>

              <Wallet
                className="text-amber-500"
                size={16}
              />
            </div>

            <div className="text-2xl font-semibold text-amber-600">
              रु{totalOutstanding.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Credit
              </span>

              <TrendingUp
                className="text-gray-400"
                size={16}
              />
            </div>

            <div className="text-2xl font-semibold text-gray-900">
              रु{avgCredit.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <button
              onClick={() =>
                setShowFilters(!showFilters)
              }
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>

            {selectedSuppliers.length > 0 && (
              <button
                onClick={() =>
                  setBulkDeleteModal(true)
                }
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete ({selectedSuppliers.length})
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedSuppliers.length ===
                          paginatedSuppliers.length &&
                        paginatedSuppliers.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Supplier
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Location
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    PAN/VAT
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Contact
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Amount
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Paid / Credit
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/suppliers/view/${supplier.id}`
                      )
                    }
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuppliers.includes(
                          supplier.id
                        )}
                        onChange={() =>
                          toggleSelectSupplier(
                            supplier.id
                          )
                        }
                        className="rounded border-gray-300"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2
                            className="text-gray-400"
                            size={18}
                          />
                        </div>

                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {supplier.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            {supplier.bankname ||
                              'No bank'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {supplier.location}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {supplier.panvat}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {supplier.contact}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-sm text-gray-900">
                      रु
                      {parseFloat(
                        supplier.totalamount || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">

                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">
                            Paid:
                          </span>

                          <span className="font-medium text-green-600">
                            रु
                            {parseFloat(
                              supplier.paid || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">
                            Credit:
                          </span>

                          <span className="font-medium text-amber-600">
                            रु
                            {parseFloat(
                              supplier.credit || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td
                      className="px-4 py-3"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() =>
                            router.push(
                              `/suppliers/view/${supplier.id}`
                            )
                          }
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() =>
                            router.push(
                              `/suppliers/edit/${supplier.id}`
                            )
                          }
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() =>
                            openDeleteModal(supplier)
                          }
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={
              handleItemsPerPageChange
            }
            showItemsPerPage={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}