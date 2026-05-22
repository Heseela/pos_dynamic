"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  CreditCard,
  Banknote,
  Wallet,
  Tag,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function BillingForm({ table, products, onBack, onComplete, onClearTable }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("full");
  const [halfPaymentAmount, setHalfPaymentAmount] = useState(0);
  const [creditRemaining, setCreditRemaining] = useState(0);
  const [discount, setDiscount] = useState({ type: "none", value: 0 });
  const [showMixedModal, setShowMixedModal] = useState(false);
  const [mixedPayment, setMixedPayment] = useState({ cash: 0, online: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState(table.customerName || "Guest");
  const [contactNumber, setContactNumber] = useState(table.contactNumber || "");
  const [showHalfPaymentModal, setShowHalfPaymentModal] = useState(false);
  const [tempHalfAmount, setTempHalfAmount] = useState(0);

  // Helper function to safely convert to number
  const toNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const url = `/api/${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || `Request failed with status ${response.status}`);
      }
      
      return result;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  const getSubtotal = () => {
    if (!table || !table.orders) return 0;
    
    return table.orders.reduce(
      (sum, item) => sum + toNumber(item.sellingPrice || item.price || 0) * toNumber(item.quantity || 0),
      0
    );
  };
  
  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (discount.type === "percentage") {
      return (subtotal * toNumber(discount.value)) / 100;
    } else if (discount.type === "amount") {
      return Math.min(toNumber(discount.value), subtotal);
    }
    return 0;
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const afterDiscount = subtotal - discountAmount;
    const taxRate = 0.10; 
    return afterDiscount * taxRate;
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const taxAmount = getTaxAmount();
    return subtotal - discountAmount + taxAmount;
  };

  const displaySubtotal = getSubtotal();
  const displayDiscountAmount = getDiscountAmount();
  const displayTaxAmount = getTaxAmount();
  const displayFinalTotal = getFinalTotal();

  const openMixedModal = () => {
    // Reset mixed payment based on current payment status
    if (paymentStatus === "half" && halfPaymentAmount > 0) {
      // For half payment, set target to half amount
      const half = halfPaymentAmount / 2;
      setMixedPayment({ cash: half, online: half });
    } else {
      // For full payment, set target to full amount
      const half = displayFinalTotal / 2;
      setMixedPayment({ cash: half, online: half });
    }
    setShowMixedModal(true);
  };

  const handleMixedConfirm = () => {
    const totalToPay = paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal;
    const mixedTotal = mixedPayment.cash + mixedPayment.online;
    
    if (Math.abs(mixedTotal - totalToPay) > 0.01) {
      alert(`Combined amounts must equal ${paymentStatus === "half" ? "half payment amount" : "total"}: रु${totalToPay.toFixed(2)}`);
      return;
    }
    
    setPaymentMethod("mixed");
    setShowMixedModal(false);
  };

  const handlePaymentStatusChange = (status) => {
    if (status === "half") {
      setShowHalfPaymentModal(true);
      setTempHalfAmount(0);
    } else if (status === "credit") {
      setPaymentStatus("credit");
      setCreditRemaining(displayFinalTotal);
      setHalfPaymentAmount(0);
    } else {
      setPaymentStatus("full");
      setHalfPaymentAmount(0);
      setCreditRemaining(0);
    }
  };

  const handleHalfPaymentConfirm = () => {
    if (tempHalfAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (tempHalfAmount > displayFinalTotal) {
      toast.error("Payment amount cannot exceed total amount");
      return;
    }
    setHalfPaymentAmount(tempHalfAmount);
    setPaymentStatus("half");
    setCreditRemaining(0);
    setShowHalfPaymentModal(false);
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    
    try {
      let paidAmount = 0;
      let remainingAmount = 0;
      
      // Calculate based on payment status
      if (paymentStatus === "full") {
        paidAmount = displayFinalTotal;
        remainingAmount = 0;
      } else if (paymentStatus === "half") {
        paidAmount = halfPaymentAmount;
        remainingAmount = displayFinalTotal - halfPaymentAmount;
      } else if (paymentStatus === "credit") {
        paidAmount = 0;
        remainingAmount = displayFinalTotal;
      }
      
      // For mixed payment method, override paidAmount with mixed payment total
      let finalPaidAmount = paidAmount;
      let finalCashAmount = 0;
      let finalOnlineAmount = 0;
      
      if (paymentMethod === "mixed") {
        finalCashAmount = toNumber(mixedPayment.cash);
        finalOnlineAmount = toNumber(mixedPayment.online);
        finalPaidAmount = finalCashAmount + finalOnlineAmount;
        
        // Update remaining amount based on actual paid amount for half payments
        if (paymentStatus === "half") {
          remainingAmount = displayFinalTotal - finalPaidAmount;
          paidAmount = finalPaidAmount;
        }
      } else if (paymentMethod === "cash") {
        finalCashAmount = paidAmount;
        finalOnlineAmount = 0;
      } else {
        finalCashAmount = 0;
        finalOnlineAmount = paidAmount;
      }
      
      // Prepare items array with proper number types
      const items = table.orders.map(item => ({
        id: toNumber(item.id),
        name: String(item.name || ""),
        price: toNumber(item.sellingPrice || item.price || 0),
        quantity: toNumber(item.quantity || 0),
        total: toNumber((item.sellingPrice || item.price || 0) * (item.quantity || 0))
      }));
      
      // Prepare the update data with all numbers properly converted
      const updateData = {
        customerName: String(customerName || "Guest"),
        contactNumber: contactNumber ? String(contactNumber) : null,
        paymentMethod: String(paymentMethod === "mixed" ? "mixed" : paymentMethod),
        paymentStatus: String(paymentStatus === "full" ? "paid" : (paymentStatus === "half" ? "half_paid" : "credit")),
        orderStatus: String(paymentStatus === "full" ? "completed" : "pending"),
        paidAmount: {
          cash: toNumber(finalCashAmount),
          online: toNumber(finalOnlineAmount)
        },
        discount: {
          type: String(discount.type),
          value: toNumber(discount.type === "none" ? 0 : discount.value),
          amount: toNumber(displayDiscountAmount)
        },
        tax: {
          rate: toNumber(10),
          amount: toNumber(displayTaxAmount)
        },
        subtotal: toNumber(displaySubtotal),
        grossAmount: toNumber(displaySubtotal - displayDiscountAmount),
        total: toNumber(displayFinalTotal),
        paidAmountValue: toNumber(finalPaidAmount),
        remainingAmount: toNumber(remainingAmount),
        creditRemaining: toNumber(paymentStatus === "credit" ? remainingAmount : (paymentStatus === "half" ? remainingAmount : 0)),
        tableStatus: String(paymentStatus === "full" ? "available" : "occupied"),
        items: items
      };

      // Save bill to API
      const billData = {
        orderId: table.orderId || table.id,
        tableId: toNumber(table.id),
        tableNumber: String(table.number || ""),
        customerName: String(customerName || "Guest"),
        contactNumber: contactNumber ? String(contactNumber) : null,
        items: items,
        subtotal: toNumber(displaySubtotal),
        discount: {
          type: String(discount.type),
          value: toNumber(discount.type === "none" ? 0 : discount.value),
          amount: toNumber(displayDiscountAmount)
        },
        tax: {
          rate: toNumber(10),
          amount: toNumber(displayTaxAmount)
        },
        grossAmount: toNumber(displaySubtotal - displayDiscountAmount),
        total: toNumber(displayFinalTotal),
        paymentMethod: String(paymentMethod === "mixed" ? "mixed" : paymentMethod),
        paymentStatus: String(paymentStatus === "full" ? "paid" : (paymentStatus === "half" ? "half_paid" : "credit")),
        paidAmount: {
          cash: toNumber(finalCashAmount),
          online: toNumber(finalOnlineAmount)
        },
        paidAmountValue: toNumber(finalPaidAmount),
        remainingAmount: toNumber(remainingAmount),
        creditRemaining: toNumber(paymentStatus === "credit" ? remainingAmount : (paymentStatus === "half" ? remainingAmount : 0)),
        timestamp: new Date().toISOString()
      };

      // Save bill to API
      try {
        const response = await apiRequest('bills', 'POST', billData);
        console.log('Bill saved successfully:', response);
        toast.success('Bill saved successfully!');
      } catch (billError) {
        console.error('Error saving bill:', billError);
        toast.error('Failed to save bill to server, but payment was processed');
      }

      const orderId = table.orderId || table.id;
      
      if (orderId) {
        try {
          const response = await apiRequest(`order/${orderId}`, 'PATCH', updateData);
          console.log('Update response:', response);
        } catch (orderError) {
          console.error('Error updating order:', orderError);
        }
      }

      // Update table status
      if (table.id || table.number) {
        try {
          await apiRequest(`tables/${table.id || table.number}`, 'PATCH', {
            status: String(paymentStatus === "full" ? "available" : "occupied"),
            isOccupied: paymentStatus !== "full",
            currentOrderId: paymentStatus !== "full" ? orderId : null
          });
          console.log('Table status updated');
        } catch (tableError) {
          console.error('Error updating table status:', tableError);
        }
      }

      // Save transaction locally
      const transactionData = {
        id: Date.now(),
        orderId: orderId,
        tableNumber: String(table.number || ""),
        tableId: toNumber(table.id),
        customerName: String(customerName || "Guest"),
        contactNumber: contactNumber ? String(contactNumber) : null,
        items: items,
        subtotal: toNumber(displaySubtotal),
        discount: toNumber(discount.type === "none" ? 0 : discount.value),
        discountType: String(discount.type),
        discountAmount: toNumber(displayDiscountAmount),
        tax: toNumber(displayTaxAmount),
        taxRate: toNumber(10),
        grossAmount: toNumber(displaySubtotal - displayDiscountAmount),
        total: toNumber(displayFinalTotal),
        paymentMethod: String(paymentMethod),
        paymentStatus: String(paymentStatus === "full" ? "paid" : (paymentStatus === "half" ? "half_paid" : "credit")),
        orderStatus: String(paymentStatus === "full" ? "completed" : "pending"),
        paidAmount: {
          cash: toNumber(finalCashAmount),
          online: toNumber(finalOnlineAmount)
        },
        mixedPayment: paymentMethod === "mixed" ? {
          cash: toNumber(mixedPayment.cash),
          online: toNumber(mixedPayment.online)
        } : null,
        paidAmountValue: toNumber(finalPaidAmount),
        remainingAmount: toNumber(remainingAmount),
        creditRemaining: toNumber(paymentStatus === "credit" ? remainingAmount : (paymentStatus === "half" ? remainingAmount : 0)),
        timestamp: new Date().toISOString(),
      };

      const existingOrders = JSON.parse(localStorage.getItem('completed_orders') || '[]');
      existingOrders.unshift(transactionData);
      if (existingOrders.length > 100) existingOrders.pop();
      localStorage.setItem('completed_orders', JSON.stringify(existingOrders));

      // Show success message based on payment status
      if (paymentStatus === "full") {
        toast.success(`Full payment of रु${finalPaidAmount.toFixed(2)} completed successfully!`);
      } else if (paymentStatus === "half") {
        toast.success(`Payment of रु${finalPaidAmount.toFixed(2)} received. Remaining balance: रु${remainingAmount.toFixed(2)}`);
      } else {
        toast.success(`Credit recorded. Total amount due: रु${remainingAmount.toFixed(2)}`);
      }

      if (onComplete) {
        onComplete(transactionData);
      }
      
      if (onClearTable && paymentStatus === "full") {
        onClearTable(table.id || table.number);
      }
      
      // Navigate back to POS page after successful payment
      setTimeout(() => {
        try {
          router.push('/pos');
          router.refresh();
        } catch (error) {
          console.error('Router navigation failed:', error);
          window.location.href = '/pos';
        }
      }, 1500);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to complete payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Invoice</h2>
              <p className="text-sm text-gray-300 mt-1">
                Table #{table.number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Invoice #</p>
              <p className="font-mono font-semibold text-white">
                {Date.now().toString().slice(-6)}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {new Date().toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contact number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 uppercase">
                    Item
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600 uppercase">
                    Qty
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 uppercase">
                    Price
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 uppercase">
                    Total
                  </th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.orders.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 px-2">
                      <div className="font-medium text-gray-900">{item.name}</div>
                     </td>
                    <td className="py-4 px-2 text-center text-gray-900 font-medium">
                      {item.quantity}
                     </td>
                    <td className="py-4 px-2 text-right text-gray-900">
                      रु{(item.sellingPrice || item.price).toLocaleString()}
                     </td>
                    <td className="py-4 px-2 text-right font-semibold text-gray-900">
                      रु{((item.sellingPrice || item.price) * item.quantity).toLocaleString()}
                     </td>
                   </tr>
                ))}
              </tbody>
             </table>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    रु{displaySubtotal.toLocaleString()}
                  </span>
                </div>

                {discount.type !== "none" && displayDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag size={14} />
                      Discount{" "}
                      {discount.type === "percentage"
                        ? `(${discount.value}%)`
                        : `(रु${discount.value})`}
                    </span>
                    <span className="font-medium">
                      -रु{displayDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Gross Amount</span>
                  <span className="font-medium">
                    रु{(displaySubtotal - displayDiscountAmount).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 10%)</span>
                  <span className="font-medium">
                    रु{displayTaxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                  <span className="text-xl font-bold text-gray-900">
                    Grand Total
                  </span>
                  <span className="text-3xl font-bold text-gray-900">
                    रु{displayFinalTotal.toFixed(2)}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Apply Discount
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={discount.type}
                      onChange={(e) =>
                        setDiscount({ type: e.target.value, value: 0 })
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="amount">Fixed Amount (रु)</option>
                    </select>
                    {discount.type !== "none" && (
                      <input
                        type="number"
                        value={discount.value}
                        onChange={(e) =>
                          setDiscount({
                            ...discount,
                            value: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder={
                          discount.type === "percentage" ? "0%" : "रु0"
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        min="0"
                        max={discount.type === "percentage" ? "100" : undefined}
                        step={discount.type === "percentage" ? "1" : "0.01"}
                      />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Payment Status
                  </p>
                  <div>
                    <select
                      value={paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="full">Full Payment</option>
                      <option value="half">Half Payment</option>
                      <option value="credit">Credit</option>
                    </select>
                    
                    {paymentStatus === "half" && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-semibold text-green-600">रु{halfPaymentAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Remaining Amount:</span>
                          <span className="font-semibold text-orange-600">रु{(displayFinalTotal - halfPaymentAmount).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Bill:</span>
                            <span className="font-semibold text-gray-900">रु{displayFinalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ✓ Payment to be received: रु{halfPaymentAmount.toFixed(2)}<br />
                          ⏳ Remaining after payment: रु{(displayFinalTotal - halfPaymentAmount).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {paymentStatus === "credit" && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Credit Amount:</span>
                          <span className="font-semibold text-yellow-700">रु{creditRemaining.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This amount will be recorded as credit for this customer
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        paymentMethod === "cash"
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Banknote size={18} />
                      <span className="font-medium text-sm">Cash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        paymentMethod === "card"
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard size={18} />
                      <span className="font-medium text-sm">Online</span>
                    </button>
                    <button
                      onClick={openMixedModal}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        paymentMethod === "mixed"
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Wallet size={18} />
                      <span className="font-medium text-sm">Both</span>
                    </button>
                  </div>
                  
                  {paymentMethod === "mixed" && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cash:</span>
                        <span className="font-semibold text-gray-900">रु{mixedPayment.cash.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Online:</span>
                        <span className="font-semibold text-gray-900">रु{mixedPayment.online.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-semibold text-green-600">रु{(mixedPayment.cash + mixedPayment.online).toFixed(2)}</span>
                      </div>
                      {paymentStatus === "half" && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Target Amount:</span>
                          <span className="font-semibold text-blue-600">रु{halfPaymentAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={() => window.print()}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Half Payment Modal */}
      {showHalfPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Enter Payment Amount
              </h3>
              <button
                onClick={() => {
                  setShowHalfPaymentModal(false);
                  setPaymentStatus("full");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Bill Amount</p>
                  <p className="text-2xl font-bold text-gray-900">रु{displayFinalTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How much is the customer paying?
                  </label>
                  <input
                    type="number"
                    value={tempHalfAmount}
                    onChange={(e) => setTempHalfAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount customer is paying"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    min="0"
                    max={displayFinalTotal}
                    step="0.01"
                    autoFocus
                  />
                  {tempHalfAmount > 0 && tempHalfAmount <= displayFinalTotal && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded">
                        <span className="text-gray-600">Customer will pay:</span>
                        <span className="font-semibold text-green-600">रु{tempHalfAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded">
                        <span className="text-gray-600">Remaining to pay later:</span>
                        <span className="font-semibold text-orange-600">रु{(displayFinalTotal - tempHalfAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  {tempHalfAmount > displayFinalTotal && (
                    <div className="mt-2 text-sm text-red-600">
                      Amount cannot exceed total amount of रु{displayFinalTotal.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    This will record the payment and keep track of the remaining amount.
                    The customer can pay the remaining amount later.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowHalfPaymentModal(false);
                  setPaymentStatus("full");
                }}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHalfPaymentConfirm}
                disabled={tempHalfAmount <= 0 || tempHalfAmount > displayFinalTotal}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Amount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mixed Payment Modal */}
      {showMixedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Cash + Online Payment
              </h3>
              <button
                onClick={() => setShowMixedModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {paymentStatus === "half" ? "Amount to be Paid Today" : "Total Amount"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    रु{(paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal).toFixed(2)}
                  </p>
                  {paymentStatus === "half" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total Bill: रु{displayFinalTotal.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash Amount
                  </label>
                  <input
                    type="number"
                    value={mixedPayment.cash}
                    onChange={(e) => setMixedPayment({
                      ...mixedPayment,
                      cash: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Enter cash amount"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    min="0"
                    max={paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Online Amount
                  </label>
                  <input
                    type="number"
                    value={mixedPayment.online}
                    onChange={(e) => setMixedPayment({
                      ...mixedPayment,
                      online: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Enter online amount"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    min="0"
                    max={paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal}
                    step="0.01"
                  />
                </div>

                <button
                  onClick={() => {
                    const targetAmount = paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal;
                    const half = targetAmount / 2;
                    setMixedPayment({ cash: half, online: half });
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Split 50/50
                </button>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Entered:</span>
                    <span className={`font-semibold ${
                      Math.abs((mixedPayment.cash + mixedPayment.online) - (paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal)) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      रु{(mixedPayment.cash + mixedPayment.online).toFixed(2)}
                    </span>
                  </div>
                  {Math.abs((mixedPayment.cash + mixedPayment.online) - (paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal)) >= 0.01 && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount must equal {paymentStatus === "half" ? "the payment amount" : "total"} of रु{(paymentStatus === "half" ? halfPaymentAmount : displayFinalTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMixedModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMixedConfirm}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Confirm Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}