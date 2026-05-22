// 'use client'

// import ProtectedRoute from '@/components/ProtectedRoute'
// import { useState, useEffect } from 'react'
// import { useRouter, useParams } from 'next/navigation'
// import { ArrowLeft, Save } from 'lucide-react'
// import toast, { Toaster } from 'react-hot-toast'

// export default function EditTransactionPage() {
//   const router = useRouter()
//   const params = useParams()

//   const transactionId = params.id

//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)

//   const [formData, setFormData] = useState({
//     type: 'INVOICE',
//     debit: '',
//     credit: '',
//     balance: '',
//     note: '',
//     createdAt: ''
//   })

//   // ================= FETCH TRANSACTION =================
//   const fetchTransaction = async () => {
//     try {
//       console.log('Fetching transaction:', transactionId)

//       const response = await fetch(`/api/ledgers/${transactionId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         credentials: 'include'
//       })

//       if (!response.ok) {
//         throw new Error(`HTTP Error ${response.status}`)
//       }

//       const data = await response.json()

//       console.log('Ledger Data:', data)

//       // API may return directly OR inside ledger
//       const ledger = data.ledger || data

//       setFormData({
//         type: ledger.type || 'INVOICE',

//         debit: ledger.debit
//           ? Number(ledger.debit).toString()
//           : '',

//         credit: ledger.credit
//           ? Number(ledger.credit).toString()
//           : '',

//         balance: ledger.balance
//           ? Number(ledger.balance).toString()
//           : '',

//         note: ledger.note || '',

//         createdAt: ledger.createdAt
//           ? new Date(ledger.createdAt)
//               .toISOString()
//               .split('T')[0]
//           : new Date().toISOString().split('T')[0]
//       })
//     } catch (error) {
//       console.error('Error fetching ledger:', error)

//       toast.error(
//         error.message || 'Failed to load transaction'
//       )

//       router.push('/ledgers')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     if (transactionId) {
//       fetchTransaction()
//     }
//   }, [transactionId])

//   // ================= HANDLE CHANGE =================
//   const handleChange = e => {
//     const { name, value } = e.target

//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }))
//   }

//   // ================= SUBMIT =================
//   const handleSubmit = async e => {
//     e.preventDefault()

//     if (
//       !formData.type ||
//       (!formData.debit && !formData.credit)
//     ) {
//       toast.error(
//         'Please fill required fields'
//       )
//       return
//     }

//     setSubmitting(true)

//     const loadingToast = toast.loading(
//       'Updating transaction...'
//     )

//     try {
//       const payload = {
//         type: formData.type,

//         debit: formData.debit
//           ? Number(formData.debit)
//           : 0,

//         credit: formData.credit
//           ? Number(formData.credit)
//           : 0,

//         balance: formData.balance
//           ? Number(formData.balance)
//           : 0,

//         note: formData.note
//       }

//       console.log('PATCH Payload:', payload)

//       const response = await fetch(
//         `/api/ledgers/${transactionId}`,
//         {
//           method: 'PATCH',
//           headers: {
//             'Content-Type':
//               'application/json'
//           },
//           credentials: 'include',
//           body: JSON.stringify(payload)
//         }
//       )

//       if (!response.ok) {
//         const errorData =
//           await response.json()

//         console.error(
//           'Update Error:',
//           errorData
//         )

//         throw new Error(
//           errorData.message ||
//             'Failed to update ledger'
//         )
//       }

//       const updatedData =
//         await response.json()

//       console.log(
//         'Updated Successfully:',
//         updatedData
//       )

//       toast.success(
//         'Transaction updated successfully!',
//         {
//           id: loadingToast
//         }
//       )

//       setTimeout(() => {
//         router.push('/ledgers')
//       }, 1000)
//     } catch (error) {
//       console.error(error)

//       toast.error(
//         error.message ||
//           'Failed to update transaction',
//         {
//           id: loadingToast
//         }
//       )
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   // ================= LOADING =================
//   if (loading) {
//     return (
//       <ProtectedRoute
//         allowedRoles={[
//           'admin',
//           'branch_head'
//         ]}
//       >
//         <div className="flex items-center justify-center min-h-screen bg-gray-50">
//           <div className="text-center">
//             <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />

//             <p className="text-gray-600">
//               Loading transaction...
//             </p>
//           </div>
//         </div>
//       </ProtectedRoute>
//     )
//   }

//   return (
//     <ProtectedRoute
//       allowedRoles={[
//         'admin',
//         'branch_head'
//       ]}
//     >
//       <div className="min-h-screen bg-gray-50 p-6">

//         <Toaster position="top-right" />

//         <div className="max-w-3xl mx-auto">

//           {/* HEADER */}
//           <div className="flex items-center gap-4 mb-6">

//             <button
//               onClick={() =>
//                 router.push('/ledgers')
//               }
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               <ArrowLeft
//                 className="text-gray-600"
//                 size={20}
//               />
//             </button>

//             <div>
//               <h1 className="text-2xl font-semibold text-gray-900">
//                 Edit Ledger
//               </h1>

//               <p className="text-sm text-gray-500 mt-0.5">
//                 Update ledger details
//               </p>
//             </div>

//           </div>

//           {/* FORM */}
//           <div className="bg-white rounded-lg border border-gray-200 p-6">

//             <form
//               onSubmit={handleSubmit}
//               className="space-y-5"
//             >

//               {/* TYPE + DATE */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Ledger Type
//                   </label>

//                   <select
//                     name="type"
//                     value={formData.type}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                   >
//                     <option value="INVOICE">
//                       INVOICE
//                     </option>

//                     <option value="PAID">
//                       PAID
//                     </option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Date
//                   </label>

//                   <input
//                     type="date"
//                     name="createdAt"
//                     value={formData.createdAt}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                   />
//                 </div>

//               </div>

//               {/* DEBIT + CREDIT */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Debit Amount
//                   </label>

//                   <div className="relative">

//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
//                       रु
//                     </span>

//                     <input
//                       type="number"
//                       name="debit"
//                       value={formData.debit}
//                       onChange={handleChange}
//                       min="0"
//                       step="0.01"
//                       placeholder="0.00"
//                       className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                     />

//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Credit Amount
//                   </label>

//                   <div className="relative">

//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
//                       रु
//                     </span>

//                     <input
//                       type="number"
//                       name="credit"
//                       value={formData.credit}
//                       onChange={handleChange}
//                       min="0"
//                       step="0.01"
//                       placeholder="0.00"
//                       className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                     />

//                   </div>
//                 </div>

//               </div>

//               {/* BALANCE */}
//               <div>

//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Balance
//                 </label>

//                 <div className="relative">

//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
//                     रु
//                   </span>

//                   <input
//                     type="number"
//                     name="balance"
//                     value={formData.balance}
//                     onChange={handleChange}
//                     min="0"
//                     step="0.01"
//                     placeholder="0.00"
//                     className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
//                   />

//                 </div>

//               </div>

//               {/* NOTE */}
//               <div>

//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Note
//                 </label>

//                 <textarea
//                   name="note"
//                   value={formData.note}
//                   onChange={handleChange}
//                   rows={4}
//                   placeholder="Write additional details..."
//                   className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
//                 />

//               </div>

//               {/* BUTTONS */}
//               <div className="flex gap-3 pt-4 border-t border-gray-200">

//                 <button
//                   type="button"
//                   onClick={() =>
//                     router.push('/ledgers')
//                   }
//                   className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
//                 >

//                   {submitting ? (
//                     <>
//                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save size={16} />
//                       Save Changes
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
'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function EditLedgerPage() {
  const router = useRouter()
  const params = useParams()

  const ledgerId = params.id

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ledger, setLedger] = useState(null)
  const [supplier, setSupplier] = useState(null)

  const [formData, setFormData] = useState({
    type: 'INVOICE',
    debit: '',
    credit: '',
    balance: '',
    note: '',
    createdAt: '',
    // Supplier fields
    supplierName: '',
    supplierContact: '',
    supplierLocation: '',
    supplierBankName: '',
    supplierAccountNo: '',
    supplierCredit: ''
  })

  // ================= FETCH LEDGER =================
  const fetchLedger = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/ledgers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`)
      }

      const data = await response.json()

      console.log('LEDGER RESPONSE:', data)

      let foundLedger = null
      let foundSupplier = null

      // LOOP THROUGH SUPPLIERS
      data.forEach((supplierItem) => {
        // LOOP THROUGH LEDGERS
        supplierItem.ledgers?.forEach((ledgerItem) => {
          if (ledgerItem.id === ledgerId) {
            foundLedger = ledgerItem
            foundSupplier = supplierItem
          }
        })
      })

      console.log('FOUND LEDGER:', foundLedger)
      console.log('FOUND SUPPLIER:', foundSupplier)

      if (!foundLedger) {
        toast.error('Ledger not found')
        router.push('/ledgers')
        return
      }

      setLedger(foundLedger)
      setSupplier(foundSupplier)

      // Calculate debit/credit from amounts
      const debit = Number(foundLedger.debit || 0)
      const credit = Number(foundLedger.credit || 0)

      setFormData({
        type: foundLedger.type || 'INVOICE',
        debit: debit > 0 ? debit.toString() : '',
        credit: credit > 0 ? credit.toString() : '',
        balance: foundLedger.balance ? Number(foundLedger.balance).toString() : '',
        note: foundLedger.note || '',
        createdAt: foundLedger.createdAt
          ? new Date(foundLedger.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        // Supplier fields
        supplierName: foundSupplier?.name || '',
        supplierContact: foundSupplier?.contactNumber || foundSupplier?.phone || '',
        supplierLocation: foundSupplier?.location || foundSupplier?.address || '',
        supplierBankName: foundSupplier?.bankname || foundSupplier?.bankName || '',
        supplierAccountNo: foundSupplier?.accountNo || foundSupplier?.accountNumber || '',
        supplierCredit: foundSupplier?.credit ? Number(foundSupplier.credit).toString() : ''
      })
    } catch (error) {
      console.error('Error fetching ledger:', error)
      toast.error(error.message || 'Failed to load ledger')
      router.push('/ledgers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ledgerId) {
      fetchLedger()
    }
  }, [ledgerId])

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.type || (!formData.debit && !formData.credit)) {
      toast.error('Please fill required fields')
      return
    }

    setSubmitting(true)

    const loadingToast = toast.loading('Updating ledger...')

    try {
      // Update ledger
      const ledgerPayload = {
        type: formData.type,
        debit: formData.debit ? Number(formData.debit) : 0,
        credit: formData.credit ? Number(formData.credit) : 0,
        balance: formData.balance ? Number(formData.balance) : 0,
        note: formData.note,
        createdAt: formData.createdAt
      }

      console.log('Ledger PATCH Payload:', ledgerPayload)

      const ledgerResponse = await fetch(`/api/ledgers/${ledgerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(ledgerPayload)
      })

      if (!ledgerResponse.ok) {
        const errorData = await ledgerResponse.json()
        throw new Error(errorData.message || 'Failed to update ledger')
      }

      // Update supplier if supplier exists and has changes
      if (supplier && supplier.id) {
        const supplierPayload = {
          name: formData.supplierName,
          contactNumber: formData.supplierContact,
          location: formData.supplierLocation,
          bankname: formData.supplierBankName,
          accountNo: formData.supplierAccountNo,
          credit: formData.supplierCredit ? Number(formData.supplierCredit) : 0
        }

        console.log('Supplier PATCH Payload:', supplierPayload)

        const supplierResponse = await fetch(`/api/suppliers/${supplier.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(supplierPayload)
        })

        if (!supplierResponse.ok) {
          console.warn('Failed to update supplier, but ledger was updated')
          toast.success('Ledger updated successfully, but supplier update failed')
        } else {
          toast.success('Ledger and supplier updated successfully!', { id: loadingToast })
        }
      } else {
        toast.success('Ledger updated successfully!', { id: loadingToast })
      }

      setTimeout(() => {
        router.push('/ledgers')
      }, 1000)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Failed to update ledger', { id: loadingToast })
    } finally {
      setSubmitting(false)
    }
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading ledger...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!ledger) return null

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <Toaster position="top-right" />

        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/ledgers')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Ledger</h1>
              <p className="text-sm text-gray-500 mt-0.5">Update ledger and supplier details</p>
            </div>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* LEDGER SECTION */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ledger Information</h2>
                <div className="space-y-4">
                  {/* TYPE + DATE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ledger Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="INVOICE">INVOICE</option>
                        <option value="PAID">PAID</option>
                        <option value="PURCHASE">PURCHASE</option>
                        <option value="SALE">SALE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        name="createdAt"
                        value={formData.createdAt}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* DEBIT + CREDIT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Debit Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">रु</span>
                        <input
                          type="number"
                          name="debit"
                          value={formData.debit}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credit Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">रु</span>
                        <input
                          type="number"
                          name="credit"
                          value={formData.credit}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BALANCE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">रु</span>
                      <input
                        type="number"
                        name="balance"
                        value={formData.balance}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* NOTE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Write additional details..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* SUPPLIER SECTION */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="supplierContact"
                      value={formData.supplierContact}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="supplierLocation"
                      value={formData.supplierLocation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="supplierBankName"
                      value={formData.supplierBankName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="supplierAccountNo"
                      value={formData.supplierAccountNo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Credit
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">रु</span>
                      <input
                        type="number"
                        name="supplierCredit"
                        value={formData.supplierCredit}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/ledgers')}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
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
