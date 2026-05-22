'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AddTransactionPage() {
  const router = useRouter()
  const [ledgerCategories, setLedgerCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Sale',
    category: '',
    description: '',
    amount: '',
    reference: '',
    status: 'Completed'
  })

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/category', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include"
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Categories from API:', data)
        
        // Handle different response structures
        let categories = []
        if (Array.isArray(data)) {
          categories = data
        } else if (data.data && Array.isArray(data.data)) {
          categories = data.data
        } else if (data.categories && Array.isArray(data.categories)) {
          categories = data.categories
        }
        
        setLedgerCategories(categories)
        if (categories.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: categories[0].name }))
        }
      } else {
        console.log('Categories API not available, using fallback')
        // Fallback categories
        const fallbackCategories = [
          { id: 1, name: "Revenue" },
          { id: 2, name: "Operating Expenses" },
          { id: 3, name: "Inventory" }
        ]
        setLedgerCategories(fallbackCategories)
        if (!formData.category) {
          setFormData(prev => ({ ...prev, category: fallbackCategories[0].name }))
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback categories on error
      const fallbackCategories = [
        { id: 1, name: "Revenue" },
        { id: 2, name: "Operating Expenses" },
        { id: 3, name: "Inventory" }
      ]
      setLedgerCategories(fallbackCategories)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    if (!formData.description) {
      toast.error('Please enter a description')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (!formData.reference) {
      toast.error('Please enter a reference number')
      return
    }
    
    setLoading(true)
    const loadingToast = toast.loading('Creating transaction...')
    
    try {
      const amountValue = parseFloat(formData.amount)
      const finalAmount = formData.type === 'Sale' ? amountValue : -Math.abs(amountValue)
      
      // Prepare payload for your backend
      const payload = {
        date: formData.date,
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        amount: finalAmount,
        reference: formData.reference.trim(),
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      console.log('Sending transaction payload:', payload)
      
      // Try to save to your backend API
      const response = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to create transaction (${response.status})`)
      }
      
      const result = await response.json()
      console.log('Transaction created:', result)
      
      toast.success('Transaction created successfully!', { id: loadingToast })
      setTimeout(() => router.push('/ledgers'), 1500)
      
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error(error.message || 'Failed to create transaction', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <Toaster position="top-right" />
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/ledgers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Add Transaction</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create a new financial entry</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="Sale">Sale</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {ledgerCategories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  required
                  placeholder="e.g., INV-1234, PO-5678, EXP-0012"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1.5">Unique identifier for this transaction</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Detailed description of the transaction..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (रु) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">रु</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {formData.type === 'Sale' ? 'Will be recorded as income (+)' : 'Will be recorded as expense (-)'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/ledgers')}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// 'use client'

// import ProtectedRoute from '@/components/ProtectedRoute'
// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { ArrowLeft, Save } from 'lucide-react'
// import toast, { Toaster } from 'react-hot-toast'

// export default function AddTransactionPage() {
//   const router = useRouter()

//   const [suppliers, setSuppliers] = useState([])
//   const [purchases, setPurchases] = useState([])

//   const [loading, setLoading] = useState(false)
//   const [loadingPurchases, setLoadingPurchases] = useState(false)

//   const [formData, setFormData] = useState({
//     supplier: '',
//     purchase: '',
//     totalAmount: '',
//     paidAmount: '',
//     type: 'invoice',
//     remainingAmount: '',
//   })

//   const fetchSuppliers = async () => {
//     try {
//       const response = await fetch('/api/suppliers', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//       })

//       if (!response.ok) {
//         throw new Error('Failed to fetch suppliers')
//       }

//       const data = await response.json()

//       let suppliersArray = []

//       if (Array.isArray(data)) {
//         suppliersArray = data
//       } else if (data.data && Array.isArray(data.data)) {
//         suppliersArray = data.data
//       } else if (
//         data.suppliers &&
//         Array.isArray(data.suppliers)
//       ) {
//         suppliersArray = data.suppliers
//       }

//       setSuppliers(suppliersArray)
//     } catch (error) {
//       console.error(error)
//       toast.error('Failed to load suppliers')
//     }
//   }

//   // ================= FETCH PURCHASES =================
//   const fetchPurchases = async (supplierId) => {
//     if (!supplierId) {
//       setPurchases([])
//       return
//     }

//     setLoadingPurchases(true)

//     try {
//       const response = await fetch(
//         `/api/purchase?supplierId=${supplierId}`,
//         {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           credentials: 'include',
//         }
//       )

//       if (!response.ok) {
//         throw new Error('Failed to fetch purchases')
//       }

//       const data = await response.json()

//       let purchasesArray = []

//       if (Array.isArray(data)) {
//         purchasesArray = data
//       } else if (data.data && Array.isArray(data.data)) {
//         purchasesArray = data.data
//       } else if (
//         data.purchases &&
//         Array.isArray(data.purchases)
//       ) {
//         purchasesArray = data.purchases
//       }

//       setPurchases(purchasesArray)

//       if (purchasesArray.length === 0) {
//         toast.error(
//           'No purchases found for this supplier'
//         )
//       }
//     } catch (error) {
//       console.error(error)
//       setPurchases([])
//       toast.error('Failed to load purchases')
//     } finally {
//       setLoadingPurchases(false)
//     }
//   }

//   useEffect(() => {
//     fetchSuppliers()
//   }, [])

//   const handleChange = (e) => {
//     const { name, value } = e.target

//     setFormData((prev) => {
//       const updated = {
//         ...prev,
//         [name]: value,
//       }

//       if (name === 'supplier') {
//         fetchPurchases(value)

//         return {
//           ...updated,
//           purchase: '',
//           totalAmount: '',
//           paidAmount: '',
//           remainingAmount: '',
//         }
//       }

//       if (name === 'purchase') {
//         const selectedPurchase = purchases.find(
//           (purchase) => purchase.id === value
//         )

//         if (selectedPurchase) {
//           const total = parseFloat(
//             selectedPurchase.totalAmount || 0
//           )

//           return {
//             ...updated,
//             totalAmount: total.toString(),
//             remainingAmount: (
//               total -
//               parseFloat(updated.paidAmount || 0)
//             ).toString(),
//           }
//         }
//       }

//       if (name === 'paidAmount') {
//         const total = parseFloat(
//           updated.totalAmount || 0
//         )

//         const paid = parseFloat(value || 0)

//         return {
//           ...updated,
//           remainingAmount: Math.max(
//             total - paid,
//             0
//           ).toString(),
//         }
//       }

//       return updated
//     })
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     if (!formData.supplier) {
//       toast.error('Please select supplier')
//       return
//     }

//     if (!formData.purchase) {
//       toast.error('Please select purchase')
//       return
//     }

//     if (!formData.paidAmount) {
//       toast.error('Please enter paid amount')
//       return
//     }

//     setLoading(true)

//     const loadingToast = toast.loading(
//       'Creating ledger...'
//     )

//     try {
//       const remaining =
//         parseFloat(formData.remainingAmount || 0)

//       const payload = {
//         supplier: formData.supplier,
//         purchase: formData.purchase,
//         totalAmount: String(
//           formData.totalAmount || '0'
//         ),
//         paidAmount: String(
//           formData.paidAmount || '0'
//         ),
//         type: remaining === 0 ? 'paid' : 'invoice',
//         remainingAmount: String(
//           formData.remainingAmount || '0'
//         ),
//       }

//       console.log('Payload:', payload)

//       const response = await fetch('/api/ledgers', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         credentials: 'include',
//         body: JSON.stringify(payload),
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(
//           data.message || 'Failed to create ledger'
//         )
//       }

//       toast.success('Ledger created successfully', {
//         id: loadingToast,
//       })

//       router.push('/ledgers')
//     } catch (error) {
//       console.error(error)

//       toast.error(
//         error.message || 'Something went wrong',
//         {
//           id: loadingToast,
//         }
//       )
//     } finally {
//       setLoading(false)
//     }
//   }

//   const formatUUID = (uuid) => {
//     if (!uuid) return ''
//     return `${uuid.substring(0, 8)}...`
//   }

//   const getSupplierName = () => {
//     const supplier = suppliers.find(
//       (s) => s.id === formData.supplier
//     )

//     return supplier?.name || ''
//   }

//   return (
//     <ProtectedRoute
//       allowedRoles={[
//         'admin',
//         'branch_head',
//         'accountant',
//       ]}
//     >
//       <Toaster position="top-right" />

//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-3xl mx-auto">

//           {/* HEADER */}
//           <div className="flex items-center gap-4 mb-6">
//             <button
//               onClick={() => router.push('/ledgers')}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               <ArrowLeft
//                 className="text-gray-600"
//                 size={20}
//               />
//             </button>

//             <div>
//               <h1 className="text-2xl font-semibold text-gray-900">
//                 Add Ledger
//               </h1>

//               <p className="text-sm text-gray-500 mt-1">
//                 Create supplier ledger transaction
//               </p>
//             </div>
//           </div>

//           {/* FORM */}
//           <div className="bg-white rounded-lg border border-gray-200 p-6">
//             <form
//               onSubmit={handleSubmit}
//               className="space-y-5"
//             >

//               {/* SUPPLIER */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Supplier
//                   <span className="text-red-500">
//                     {' '}
//                     *
//                   </span>
//                 </label>

//                 <select
//                   name="supplier"
//                   value={formData.supplier}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                 >
//                   <option value="">
//                     Select Supplier
//                   </option>

//                   {suppliers.map((supplier) => (
//                     <option
//                       key={supplier.id}
//                       value={supplier.id}
//                     >
//                       {supplier.name} (
//                       {formatUUID(supplier.id)})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* PURCHASE */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Purchase Order
//                   <span className="text-red-500">
//                     {' '}
//                     *
//                   </span>
//                 </label>

//                 <select
//                   name="purchase"
//                   value={formData.purchase}
//                   onChange={handleChange}
//                   required
//                   disabled={
//                     !formData.supplier ||
//                     loadingPurchases
//                   }
//                   className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
//                 >
//                   <option value="">
//                     {!formData.supplier
//                       ? 'Select supplier first'
//                       : loadingPurchases
//                       ? 'Loading purchases...'
//                       : purchases.length === 0
//                       ? 'No purchases found'
//                       : 'Select purchase'}
//                   </option>

//                   {purchases.map((purchase) => (
//                     <option
//                       key={purchase.id}
//                       value={purchase.id}
//                     >
//                       PO-{formatUUID(purchase.id)} -
//                       रु
//                       {parseFloat(
//                         purchase.totalAmount || 0
//                       ).toLocaleString()}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* AMOUNTS */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//                 {/* TOTAL */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Total Amount (रु)
//                   </label>

//                   <input
//                     type="number"
//                     name="totalAmount"
//                     value={formData.totalAmount}
//                     readOnly
//                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm"
//                   />

//                   <p className="text-xs text-gray-500 mt-1">
//                     Auto-filled from purchase
//                   </p>
//                 </div>

//                 {/* PAID */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Paid Amount (रु)
//                     <span className="text-red-500">
//                       {' '}
//                       *
//                     </span>
//                   </label>

//                   <input
//                     type="number"
//                     name="paidAmount"
//                     value={formData.paidAmount}
//                     onChange={handleChange}
//                     required
//                     min="0"
//                     step="0.01"
//                     placeholder="0.00"
//                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                   />
//                 </div>
//               </div>

//               {/* REMAINING */}
//               {(formData.totalAmount ||
//                 formData.paidAmount) && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Remaining Amount
//                   </label>

//                   <div className="text-2xl font-semibold text-amber-600">
//                     रु{' '}
//                     {parseFloat(
//                       formData.remainingAmount || 0
//                     ).toLocaleString()}
//                   </div>
//                 </div>
//               )}

//               {/* SUMMARY */}
//               {formData.supplier &&
//                 formData.purchase && (
//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                     <h3 className="text-sm font-semibold text-gray-900 mb-2">
//                       Transaction Summary
//                     </h3>

//                     <div className="space-y-1 text-sm">
//                       <p>
//                         <span className="font-medium">
//                           Supplier:
//                         </span>{' '}
//                         {getSupplierName()}
//                       </p>

//                       <p>
//                         <span className="font-medium">
//                           Total:
//                         </span>{' '}
//                         रु{' '}
//                         {parseFloat(
//                           formData.totalAmount || 0
//                         ).toLocaleString()}
//                       </p>

//                       <p>
//                         <span className="font-medium">
//                           Paid:
//                         </span>{' '}
//                         रु{' '}
//                         {parseFloat(
//                           formData.paidAmount || 0
//                         ).toLocaleString()}
//                       </p>

//                       <p>
//                         <span className="font-medium">
//                           Remaining:
//                         </span>{' '}
//                         रु{' '}
//                         {parseFloat(
//                           formData.remainingAmount || 0
//                         ).toLocaleString()}
//                       </p>

//                       <p>
//                         <span className="font-medium">
//                           Status:
//                         </span>{' '}
//                         {parseFloat(
//                           formData.remainingAmount || 0
//                         ) === 0
//                           ? 'Paid'
//                           : 'Invoice'}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//               {/* BUTTONS */}
//               <div className="flex gap-3 pt-4 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={() =>
//                     router.push('/ledgers')
//                   }
//                   className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={
//                     loading ||
//                     !formData.supplier ||
//                     !formData.purchase ||
//                     !formData.paidAmount
//                   }
//                   className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
//                 >
//                   {loading ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save size={16} />
//                       Save Ledger
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </ProtectedRoute>
//   )
// }