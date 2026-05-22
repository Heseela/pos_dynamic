'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Minus,
  Plus,
  ShoppingCart,
  Receipt,
  Printer,
  X,
  Percent,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CartWithBilling({
  orderInfo,
  orders,
  onUpdateQuantity,
  onRemoveItem,
  onComplete,
  onProceedToBilling,
  showCustomerInfo = false,
  onBackToTables,
  setSelectedTable
}) {
  const router = useRouter()

  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showTaxModal, setShowTaxModal] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [contactNumber, setContactNumber] = useState('')

  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(10)

  const [tempDiscount, setTempDiscount] = useState('')
  const [tempTax, setTempTax] = useState('')

  const [showPrintOptions, setShowPrintOptions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const discountInputRef = useRef(null)
  const taxInputRef = useRef(null)

  useEffect(() => {
    if (showDiscountModal) {
      setTimeout(() => discountInputRef.current?.focus(), 100)
    }

    if (showTaxModal) {
      setTimeout(() => taxInputRef.current?.focus(), 100)
    }
  }, [showDiscountModal, showTaxModal])

  // =========================
  // CALCULATIONS
  // =========================

  const getSubtotal = () => {
    return orders.reduce(
      (sum, item) =>
        sum + (item.sellingPrice || item.price || 0) * item.quantity,
      0
    )
  }

  const getDiscountAmount = () => {
    return (getSubtotal() * discount) / 100
  }

  const getAfterDiscount = () => {
    return getSubtotal() - getDiscountAmount()
  }

  const getTaxAmount = () => {
    return (getAfterDiscount() * tax) / 100
  }

  const getFinalTotal = () => {
    return getAfterDiscount() + getTaxAmount()
  }

  // =========================
  // API HELPER
  // =========================

  const apiRequest = async (
    endpoint,
    method = 'GET',
    data = null
  ) => {
    const url = `/api/${endpoint}`

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (
      data &&
      ['POST', 'PUT', 'PATCH'].includes(method)
    ) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Request failed with status ${response.status}`
        )
      }

      return result
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // =========================
  // PREPARE ORDER DATA
  // =========================

  const prepareOrderData = (action) => {
    const subtotal = getSubtotal()
    const discountAmount = getDiscountAmount()
    const afterDiscount = getAfterDiscount()
    const taxAmount = getTaxAmount()
    const finalTotal = getFinalTotal()

    return {
      orderType:
        orderInfo?.type ||
        (orderInfo?.table ? 'dine-in' : 'takeaway'),

      tableId: orderInfo?.table?.id || null,

      customerName:
        customerName?.trim() !== ''
          ? customerName
          : 'Guest',

      contactNumber: contactNumber || null,

      items: orders.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.sellingPrice || item.price,
        total:
          (item.sellingPrice || item.price) *
          item.quantity,
      })),

      subtotal,

      discount: {
        value: discount,
        amount: discountAmount,
      },

      tax: {
        rate: tax,
        amount: taxAmount,
      },

      grossAmount: afterDiscount,

      total: finalTotal,

      paymentMethod: '',

      paymentStatus:
        action === 'complete'
          ? 'paid'
          : 'pending',

      orderStatus:
        action === 'complete'
          ? 'paid'
          : 'ongoing',

      paidAmount: {
        cash: 0,
        online: 0,
      },
    }
  }

  // =========================
  // CLEAR CART
  // =========================

  const handleClearCart = () => {
    if (orders.length === 0) {
      toast.error('Cart is already empty')
      return
    }

    orders.forEach((item) =>
      onRemoveItem(item.id)
    )

    setCustomerName('')
    setContactNumber('')

    setDiscount(0)
    setTax(10)

    setTempDiscount('')
    setTempTax('')

    toast.success('Cart cleared successfully!')
  }

  // =========================
  // DISCOUNT
  // =========================

  const handleApplyDiscount = () => {
    const num = parseFloat(tempDiscount)

    if (isNaN(num)) {
      toast.error('Please enter valid number')
      return
    }

    if (num < 0 || num > 100) {
      toast.error('Discount must be between 0-100')
      return
    }

    setDiscount(num)

    setShowDiscountModal(false)
    setTempDiscount('')

    toast.success(
      num > 0
        ? `Discount ${num}% applied`
        : 'Discount removed'
    )
  }

  // =========================
  // TAX
  // =========================

  const handleApplyTax = () => {
    const num = parseFloat(tempTax)

    if (isNaN(num)) {
      toast.error('Please enter valid number')
      return
    }

    if (num < 0 || num > 100) {
      toast.error('Tax must be between 0-100')
      return
    }

    setTax(num)

    setShowTaxModal(false)
    setTempTax('')

    toast.success(
      num > 0
        ? `Tax ${num}% applied`
        : 'Tax removed'
    )
  }

  // =========================
  // SAVE BILL
  // =========================

  const handleSaveBill = async () => {
    if (orders.length === 0) {
      toast.error('Cannot save empty bill')
      return
    }

    setIsSaving(true)

    try {
      const orderData = prepareOrderData('draft')

      const response = await apiRequest(
        'order',
        'POST',
        orderData
      )

      toast.success(
        `Bill ${
          response.billNumber || ''
        } saved successfully!`
      )

      setSelectedTable(null)
      if (onComplete) {
        onComplete(response)
      }
    } catch (error) {
      console.error('Save bill error:', error)

      toast.error(
        error.message || 'Failed to save bill'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // =========================
  // COMPLETE ORDER
  // =========================

  const handleCompleteOrder = async () => {
    if (orders.length === 0) {
      toast.error('Cannot complete empty order')
      return
    }

    setIsSaving(true)

    try {
      const orderData =
        prepareOrderData('complete')

      const response = await apiRequest(
        'order',
        'POST',
        orderData
      )

      toast.success(
        `Order ${
          response.orderNumber || ''
        } completed successfully!`
      )

      if (onComplete) {
        onComplete(response)
      }

      handleClearCart()

      setTimeout(() => {
        router.push('/pos/saved-bills')
      }, 1500)
    } catch (error) {
      console.error(
        'Complete order error:',
        error
      )

      toast.error(
        error.message ||
          'Failed to complete order'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // =========================
  // BACK TO TABLES
  // =========================

  const goBackToTables = () => {
    if (onBackToTables) {
      onBackToTables()
    }

    if (orders.length > 0) {
      orders.forEach((item) =>
        onRemoveItem(item.id)
      )
    }

    setCustomerName('')
    setContactNumber('')
    setDiscount(0)
    setTax(10)
  }

  // =========================
  // PRINT
  // =========================

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* HEADER */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart
                size={20}
                className="text-gray-700"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {orderInfo?.table
                  ? `Table ${orderInfo.table.number}`
                  : 'Individual Order'}
              </h2>

              <p className="text-sm text-gray-500">
                {orders.length} items in cart
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER INFO */}
        {showCustomerInfo && (
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>

              <input
                type="tel"
                value={contactNumber}
                onChange={(e) =>
                  setContactNumber(e.target.value)
                }
                placeholder="Enter contact number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* CART ITEMS */}
        <div className="p-4">
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart
                size={50}
                className="mx-auto text-gray-300 mb-3"
              />

              <p className="text-gray-500">
                Cart is empty
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.name}
                        </h4>

                        <p className="text-sm text-gray-600">
                          रु{' '}
                          {item.sellingPrice ||
                            item.price}{' '}
                          each
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          onRemoveItem(item.id)
                        }
                        className="text-red-500"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          className="w-8 h-8 border rounded flex items-center justify-center"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-10 text-center font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          className="w-8 h-8 border rounded flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="font-bold">
                        रु{' '}
                        {(
                          (item.sellingPrice ||
                            item.price) *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISCOUNT */}
              <div className="flex items-center justify-between py-3 border-t mt-4">
                <div className="flex items-center gap-2">
                  <Percent size={16} />
                  <span>Discount</span>
                </div>

                <button
                  onClick={() => {
                    setTempDiscount(
                      discount.toString()
                    )
                    setShowDiscountModal(true)
                  }}
                  className="text-sm underline"
                >
                  {discount > 0 ? 'Edit' : 'Add'}
                </button>
              </div>

              {/* TAX */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Percent size={16} />
                  <span>Tax</span>
                </div>

                <button
                  onClick={() => {
                    setTempTax(tax.toString())
                    setShowTaxModal(true)
                  }}
                  className="text-sm underline"
                >
                  Edit
                </button>
              </div>

              {/* TOTALS */}
              <div className="space-y-2 py-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>
                    रु {getSubtotal().toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Discount ({discount}%)
                    </span>

                    <span>
                      - रु{' '}
                      {getDiscountAmount().toFixed(
                        2
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-blue-600">
                  <span>Tax ({tax}%)</span>

                  <span>
                    + रु{' '}
                    {getTaxAmount().toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-lg font-bold">
                    Final Total
                  </span>

                  <span className="text-2xl font-bold">
                    रु{' '}
                    {getFinalTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleClearCart}
                    disabled={isSaving}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Clear Cart
                  </button>

                  <button
                    onClick={handleSaveBill}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-200 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Receipt size={16} />

                    {isSaving
                      ? 'Saving...'
                      : 'Save Bill'}
                  </button>
                </div>

                {onProceedToBilling && (
                  <button
                    onClick={onProceedToBilling}
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg"
                  >
                    Place Order & Mark Paid
                  </button>
                )}

                {onComplete &&
                  !onProceedToBilling && (
                    <button
                      onClick={
                        handleCompleteOrder
                      }
                      disabled={isSaving}
                      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg"
                    >
                      {isSaving
                        ? 'Processing...'
                        : 'Place Order'}
                    </button>
                  )}

                <div className="relative">
                  <button
                    onClick={() =>
                      setShowPrintOptions(
                        !showPrintOptions
                      )
                    }
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Printer size={18} />
                    Print Bill
                  </button>

                  {showPrintOptions && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          handlePrint()
                          setShowPrintOptions(
                            false
                          )
                        }}
                        className="w-full px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Print Bill (80mm)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add Discount
            </h3>

            <input
              ref={discountInputRef}
              type="number"
              value={tempDiscount}
              onChange={(e) =>
                setTempDiscount(e.target.value)
              }
              placeholder="Enter discount"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowDiscountModal(false)
                }
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyDiscount}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAX MODAL */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add Tax
            </h3>

            <input
              ref={taxInputRef}
              type="number"
              value={tempTax}
              onChange={(e) =>
                setTempTax(e.target.value)
              }
              placeholder="Enter tax"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowTaxModal(false)
                }
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyTax}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}