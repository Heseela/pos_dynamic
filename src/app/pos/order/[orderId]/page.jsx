"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();

  const tableId = params?.tableId;
  const orderId = params?.orderId;

  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [halfPaymentAmount, setHalfPaymentAmount] = useState(0);

  const [bill, setBill] = useState({
    discount: { value: 0, amount: 0 },
    taxRate: 0,
    payment: {
      status: "full",
      method: "cash",
      paidAmount: { cash: 0, online: 0 },
      remaining: 0,
    },
  });

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (orderId) {
          const res = await fetch(`/api/order/${orderId}`);
          const data = await res.json();
          if (res.ok) setOrder(data);
          else toast.error("Failed to load order");
        }

        if (tableId) {
          const res = await fetch(`/api/tables/${tableId}`);
          const data = await res.json();
          if (res.ok) setTable(data);
          else toast.error("Failed to load table");
        }
      } catch {
        toast.error("Error loading billing");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId, orderId]);

  const activeOrder = order || table?.orders?.[0];

  const customer = {
    name: activeOrder?.customerName || "Walk-in Customer",
    contact: activeOrder?.contactNumber || "-",
  };

  const items =
    order?.items ||
    table?.orders?.flatMap((o) => o.items || []) ||
    [];

  // =========================
  // CALCULATIONS
  // =========================
  const subtotal = items.reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
    0
  );

  const discountAmount = () =>
    (subtotal * (bill.discount.value || 0)) / 100;

  const taxAmount = () => {
    const base = subtotal - discountAmount();
    return base * (bill.taxRate / 100);
  };

  const total = subtotal - discountAmount() + taxAmount();

  // =========================
  // PAYMENT LOGIC WITH HALF PAYMENT
  // =========================

  const handleStatusChange = (status) => {
    setBill((p) => {
      let paidAmount = { ...p.payment.paidAmount };
      let remaining = total;

      if (status === "full") {
        paidAmount = {
          cash: p.payment.method === "cash" ? total : 0,
          online: p.payment.method === "online" ? total : 0,
        };
        remaining = 0;
      }

      if (status === "half") {
        // Reset half payment amount when switching to half status
        setHalfPaymentAmount(0);
        paidAmount = { cash: 0, online: 0 };
        remaining = total; // Initially, nothing is paid
      }

      if (status === "credit") {
        paidAmount = { cash: 0, online: 0 };
        remaining = total;
      }

      return {
        ...p,
        payment: {
          ...p.payment,
          status,
          paidAmount,
          remaining,
        },
      };
    });
  };

  // Half payment handler
  const handleHalfPaymentChange = (value) => {
    const amount = Number(value);
    const maxAmount = total;
    
    // Validate amount
    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed total bill: ₹${maxAmount.toFixed(2)}`);
      return;
    }
    
    setHalfPaymentAmount(amount);
    
    setBill((p) => ({
      ...p,
      payment: {
        ...p.payment,
        paidAmount: { 
          cash: p.payment.method === "cash" ? amount : 
                 p.payment.method === "online" ? 0 : amount,
          online: p.payment.method === "online" ? amount : 
                  p.payment.method === "cash" ? 0 : 0,
        },
        remaining: total - amount,
      },
    }));
  };

  const handleMixed = (cash, online) => {
    setBill((p) => {
      const newCash = cash !== undefined ? cash : p.payment.paidAmount.cash;
      const newOnline = online !== undefined ? online : p.payment.paidAmount.online;

      const paid = newCash + newOnline;
      const remaining = total - paid;

      if (paid > total) {
        toast.error(`Total paid cannot exceed ₹${total.toFixed(2)}`);
        return p;
      }

      // Determine status based on payment amount
      let newStatus = p.payment.status;
      if (paid === total) {
        newStatus = "full";
      } else if (paid > 0 && paid < total) {
        newStatus = "half";
      } else {
        newStatus = "credit";
      }

      return {
        ...p,
        payment: {
          ...p.payment,
          method: "mixed",
          status: newStatus,
          paidAmount: {
            cash: newCash,
            online: newOnline,
          },
          remaining: remaining,
        },
      };
    });
  };

  // =========================
  // PAYMENT API
  // =========================
  const handlePayment = async () => {
    try {
      const id = order?.id || table?.orders?.[0]?.id;

      // Validate half payment if status is half
      if (bill.payment.status === "half") {
        const paidAmount = bill.payment.paidAmount.cash + bill.payment.paidAmount.online;
        if (paidAmount <= 0) {
          toast.error("Please enter an amount for half payment");
          return;
        }
        if (paidAmount >= total) {
          toast.error("For half payment, amount should be less than total bill");
          return;
        }
      }

      const res = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,

          customerName: customer.name,
          contactNumber: customer.contact,

          subtotal,
          discount: bill.discount,
          tax: { rate: bill.taxRate, amount: taxAmount() },
          total,

          paymentStatus: bill.payment.status,
          paymentMethod: bill.payment.method,
          paidAmount: bill.payment.paidAmount,
          remainingAmount: bill.payment.remaining,

          tableStatus: bill.payment.status === "full" ? "available" : "occupied",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(
        bill.payment.status === "full" 
          ? "Payment completed successfully" 
          : `Payment of ₹${(bill.payment.paidAmount.cash + bill.payment.paidAmount.online).toFixed(2)} received. Remaining: ₹${bill.payment.remaining.toFixed(2)}`
      );
      
      router.push("/pos");
    } catch (err) {
      toast.error(err.message || "Payment failed");
    }
  };

  // Calculate paid amount
  const paidAmount = bill.payment.paidAmount.cash + bill.payment.paidAmount.online;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        Loading billing...
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl grid grid-cols-3 overflow-hidden">

        {/* LEFT */}
        <div className="col-span-2 p-6 border-r">

          <div className="flex justify-between items-center mb-5">
            <button onClick={() => router.push("/pos")}>
              <ArrowLeft />
            </button>
            <h2 className="font-semibold">
              {table ? `Table ${table.name}` : "Order Billing"}
            </h2>
          </div>

          {/* CUSTOMER */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl mb-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold">{customer.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-semibold">{customer.contact}</p>
            </div>
          </div>

          {/* ITEMS */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between bg-gray-50 p-3 rounded-xl"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* DISCOUNT / TAX */}
          <div className="grid grid-cols-2 gap-4 mt-6">

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold mb-2">Discount (%)</p>
              <input
                className="w-full border p-2 rounded"
                type="number"
                value={bill.discount.value}
                onChange={(e) =>
                  setBill((p) => ({
                    ...p,
                    discount: {
                      value: Number(e.target.value),
                      amount:
                        (subtotal * Number(e.target.value)) / 100,
                    },
                  }))
                }
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold mb-2">Tax %</p>
              <input
                className="w-full border p-2 rounded"
                type="number"
                value={bill.taxRate}
                onChange={(e) =>
                  setBill({ ...bill, taxRate: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-6 bg-gray-50">

          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Total Bill</p>
            <h1 className="text-4xl font-bold">
              ₹{total.toFixed(2)}
            </h1>
            {bill.payment.status !== "full" && (
              <p className="text-sm text-gray-500 mt-1">
                Paid: ₹{paidAmount.toFixed(2)} | Remaining: ₹{bill.payment.remaining.toFixed(2)}
              </p>
            )}
          </div>

          {/* PAYMENT SYSTEM WITH HALF PAYMENT */}

          <select
            className="w-full p-3 rounded-xl border mb-3"
            value={bill.payment.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="full">Full Payment</option>
            <option value="half">Half Payment</option>
            <option value="credit">Credit</option>
          </select>

          {/* HALF PAYMENT AMOUNT INPUT */}
          {bill.payment.status === "half" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Payment Amount
              </label>
              <input
                type="number"
                className="w-full p-3 border rounded-xl"
                placeholder={`Amount (Max: ₹${total.toFixed(2)})`}
                value={halfPaymentAmount}
                onChange={(e) => handleHalfPaymentChange(e.target.value)}
                min="0"
                max={total}
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: ₹0.01 | Max: ₹{(total - 0.01).toFixed(2)}
              </p>
            </div>
          )}

          {/* METHOD - Only show for full or half payments */}
          {bill.payment.status !== "credit" && (
            <>
              <select
                className="w-full p-3 rounded-xl border mb-4"
                value={bill.payment.method}
                onChange={(e) =>
                  setBill((p) => ({
                    ...p,
                    payment: {
                      ...p.payment,
                      method: e.target.value,
                    },
                  }))
                }
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="mixed">Mixed</option>
              </select>

              {/* MIXED */}
              {bill.payment.method === "mixed" && bill.payment.status !== "credit" && (
                <div className="space-y-2 mb-3">
                  <input
                    type="number"
                    className="w-full p-3 border rounded-xl"
                    placeholder="Cash Amount"
                    value={bill.payment.paidAmount.cash || ""}
                    onChange={(e) =>
                      handleMixed(Number(e.target.value), undefined)
                    }
                  />
                  <input
                    type="number"
                    className="w-full p-3 border rounded-xl"
                    placeholder="Online Amount"
                    value={bill.payment.paidAmount.online || ""}
                    onChange={(e) =>
                      handleMixed(undefined, Number(e.target.value))
                    }
                  />
                </div>
              )}
            </>
          )}

          {/* SUMMARY */}
          <div className="text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span>-₹{discountAmount().toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹{taxAmount().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-black text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition"
          >
            <CheckCircle size={18} />
            {bill.payment.status === "full" 
              ? "Complete Payment" 
              : bill.payment.status === "half" 
              ? `Pay ₹${halfPaymentAmount || 0}` 
              : "Confirm Credit"}
          </button>

        </div>
      </div>
    </div>
  );
}