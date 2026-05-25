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
    taxRate: 0, // Default tax rate
    payment: {
      status: "full",
      method: "cash",
      paidAmount: {
        cash: 0,
        online: 0,
      },
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
          console.log("ORDER DATA =>", data);
          if (res.ok) {
            setOrder(data);
            if (data.discount?.value) {
              setBill(prev => ({
                ...prev,
                discount: { value: data.discount.value, amount: data.discount.amount || 0 }
              }));
            }
            if (data.tax?.rate) {
              setBill(prev => ({
                ...prev,
                taxRate: data.tax.rate
              }));
            }
          } else {
            toast.error("Failed to load order");
          }
        }

        if (tableId) {
          const res = await fetch(`/api/tables/${tableId}`);
          const data = await res.json();
          console.log("TABLE DATA =>", data);
          if (res.ok) {
            setTable(data);
          } else {
            toast.error("Failed to load table");
          }
        }
      } catch (err) {
        console.log(err);
        toast.error("Error loading billing");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId, orderId]);

  // =========================
  // ACTIVE ORDER
  // =========================
  const activeOrder = order || table?.orders?.[0];

  // =========================
  // CUSTOMER
  // =========================
  const customer = {
    name: activeOrder?.customerName || "Walk-in Customer",
    contact: activeOrder?.contactNumber || "-",
  };

  // =========================
  // ITEMS
  // =========================
  const items = activeOrder?.items || table?.orders?.flatMap((o) => o.items || []) || [];

  // =========================
  // CALCULATIONS
  // =========================
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const discountAmount = () => {
    return (subtotal * Number(bill.discount.value || 0)) / 100;
  };

  const taxAmount = () => {
    const base = subtotal - discountAmount();
    return base * (Number(bill.taxRate || 0) / 100);
  };

  const total = subtotal - discountAmount() + taxAmount();

  // =========================
  // AUTO FULL PAYMENT
  // =========================
  useEffect(() => {
    if (bill.payment.status === "full") {
      if (bill.payment.method === "cash") {
        setBill((prev) => ({
          ...prev,
          payment: {
            ...prev.payment,
            paidAmount: {
              cash: total,
              online: 0,
            },
            remaining: 0,
          },
        }));
      } else if (bill.payment.method === "online") {
        setBill((prev) => ({
          ...prev,
          payment: {
            ...prev.payment,
            paidAmount: {
              cash: 0,
              online: total,
            },
            remaining: 0,
          },
        }));
      }
    }
  }, [total, bill.payment.status, bill.payment.method]);

  // =========================
  // STATUS CHANGE
  // =========================
  const handleStatusChange = (status) => {
    console.log("Status changed to:", status);
    
    setBill((p) => {
      let paidAmount = { cash: 0, online: 0 };
      let remaining = total;

      if (status === "full") {
        if (p.payment.method === "cash") {
          paidAmount = { cash: total, online: 0 };
        } else if (p.payment.method === "online") {
          paidAmount = { cash: 0, online: total };
        }
        remaining = 0;
      }

      if (status === "half") {
        setHalfPaymentAmount(0);
        paidAmount = { cash: 0, online: 0 };
        remaining = total;
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

  // =========================
  // METHOD CHANGE
  // =========================
  const handleMethodChange = (method) => {
    console.log("Method changed to:", method, "Current halfPaymentAmount:", halfPaymentAmount);
    
    setBill((p) => {
      let paidAmount = { cash: 0, online: 0 };

      if (p.payment.status === "full") {
        if (method === "cash") {
          paidAmount = { cash: total, online: 0 };
        } else if (method === "online") {
          paidAmount = { cash: 0, online: total };
        }
      }

      if (p.payment.status === "half") {
        if (method === "cash") {
          paidAmount = { cash: halfPaymentAmount, online: 0 };
        } else if (method === "online") {
          paidAmount = { cash: 0, online: halfPaymentAmount };
        } else if (method === "mixed") {
          paidAmount = { cash: halfPaymentAmount, online: 0 };
        }
      }

      return {
        ...p,
        payment: {
          ...p.payment,
          method,
          paidAmount,
          remaining: total - (paidAmount.cash + paidAmount.online),
        },
      };
    });
  };

  // =========================
  // HALF PAYMENT CHANGE
  // =========================
  const handleHalfPaymentChange = (value) => {
    const amount = Number(value);
    const maxAmount = total;

    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed total bill: ₹${maxAmount.toFixed(2)}`);
      return;
    }

    if (amount === total) {
      toast.error("For half payment, amount should be less than total bill");
      return;
    }

    console.log("Half payment amount set to:", amount);
    setHalfPaymentAmount(amount);

    setBill((p) => {
      let paidAmount = { cash: 0, online: 0 };

      if (p.payment.method === "cash") {
        paidAmount = { cash: amount, online: 0 };
      } else if (p.payment.method === "online") {
        paidAmount = { cash: 0, online: amount };
      } else if (p.payment.method === "mixed") {
        paidAmount = { cash: amount, online: 0 };
      }

      return {
        ...p,
        payment: {
          ...p.payment,
          paidAmount,
          remaining: total - amount,
        },
      };
    });
  };

  // =========================
  // MIXED PAYMENT HANDLER
  // =========================
  const handleMixedPayment = (cashValue, onlineValue) => {
    const newCash = cashValue !== undefined ? Number(cashValue) : Number(bill.payment.paidAmount.cash || 0);
    const newOnline = onlineValue !== undefined ? Number(onlineValue) : Number(bill.payment.paidAmount.online || 0);
    const paid = newCash + newOnline;
    const remaining = total - paid;

    if (paid > total) {
      toast.error(`Total paid cannot exceed ₹${total.toFixed(2)}`);
      return;
    }

    let newStatus = bill.payment.status;
    if (paid === total) {
      newStatus = "full";
    } else if (paid > 0 && paid < total) {
      newStatus = "half";
      setHalfPaymentAmount(paid);
    } else if (paid === 0) {
      newStatus = "credit";
    }

    setBill((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        method: "mixed",
        status: newStatus,
        paidAmount: {
          cash: newCash,
          online: newOnline,
        },
        remaining: remaining,
      },
    }));
  };

  // =========================
  // PAYMENT SUBMISSION - CRITICAL FIX FOR LEDGER
  // =========================
  const handlePayment = async () => {
    try {
      const id = activeOrder?.id;

      if (!id) {
        toast.error("Order not found");
        return;
      }

      // Calculate paid amounts
      let cashPaid = 0;
      let onlinePaid = 0;
      let totalPaid = 0;

      if (bill.payment.status === "half") {
        // For half payment, use halfPaymentAmount
        if (halfPaymentAmount > 0) {
          if (bill.payment.method === "cash") {
            cashPaid = halfPaymentAmount;
          } else if (bill.payment.method === "online") {
            onlinePaid = halfPaymentAmount;
          } else if (bill.payment.method === "mixed") {
            cashPaid = bill.payment.paidAmount.cash || halfPaymentAmount;
            onlinePaid = bill.payment.paidAmount.online || 0;
          }
        } else {
          cashPaid = Number(bill.payment.paidAmount.cash || 0);
          onlinePaid = Number(bill.payment.paidAmount.online || 0);
        }
        totalPaid = cashPaid + onlinePaid;
      } 
      else if (bill.payment.status === "full") {
        if (bill.payment.method === "cash") {
          cashPaid = total;
        } else if (bill.payment.method === "online") {
          onlinePaid = total;
        } else if (bill.payment.method === "mixed") {
          cashPaid = Number(bill.payment.paidAmount.cash || 0);
          onlinePaid = Number(bill.payment.paidAmount.online || 0);
        }
        totalPaid = cashPaid + onlinePaid;
      } 
      else if (bill.payment.status === "credit") {
        cashPaid = 0;
        onlinePaid = 0;
        totalPaid = 0;
      }

      console.log("Payment Details:", {
        status: bill.payment.status,
        method: bill.payment.method,
        halfPaymentAmount,
        cashPaid,
        onlinePaid,
        totalPaid,
        total
      });

      // VALIDATION
      if (bill.payment.status === "half") {
        if (totalPaid <= 0) {
          toast.error("Please enter an amount for half payment");
          return;
        }
        if (totalPaid >= total) {
          toast.error("For half payment, amount should be less than total bill");
          return;
        }
      }

      // CRITICAL FIX: Use the exact payment status strings that your ledger expects
      // Based on your response, your API accepts "HALFPAYMENT" but ledger might expect "PARTIAL"
      // Let's use "PARTIAL" for half payments as that's the standard
      let finalPaymentStatus = "";
      
      if (bill.payment.status === "full" && totalPaid === total) {
        finalPaymentStatus = "PAID";
      } 
      else if (bill.payment.status === "half" && totalPaid > 0 && totalPaid < total) {
        // Use "PARTIAL" instead of "HALFPAYMENT" for ledger compatibility
        finalPaymentStatus = "PARTIAL";
      } 
      else if (bill.payment.status === "credit" && totalPaid === 0) {
        finalPaymentStatus = "CREDIT";
      }
      else if (totalPaid > 0 && totalPaid < total) {
        finalPaymentStatus = "PARTIAL";
      }
      else if (totalPaid === total) {
        finalPaymentStatus = "PAID";
      }

      const remainingAmount = finalPaymentStatus === "PAID" ? 0 : total - totalPaid;

      // Prepare payload
      const payload = {
        tableId: tableId || "",
        customerName: customer.name,
        contactNumber: customer.contact,
        subtotal: subtotal,
        grossAmount: subtotal,
        discount: {
          value: Number(bill.discount.value || 0),
          amount: Number(discountAmount()),
        },
        tax: {
          rate: Number(bill.taxRate || 0),
          amount: Number(taxAmount()),
        },
        total: Number(total),
        paymentStatus: finalPaymentStatus, // This will be "PARTIAL" for half payments
        paymentMethod: bill.payment.method.toUpperCase(),
        paidAmount: {
          cash: Number(cashPaid),
          online: Number(onlinePaid),
        },
        remainingAmount: Number(remainingAmount),
        orderStatus: finalPaymentStatus === "PAID" ? "COMPLETED" : "ONGOING",
        tableStatus: finalPaymentStatus === "PAID" ? "available" : "occupied",
      };

      console.log("FINAL PAYLOAD =>", JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("PAYMENT RESPONSE =>", data);

      if (!res.ok) {
        throw new Error(data.message || "Payment failed");
      }

      toast.success(
        finalPaymentStatus === "PAID"
          ? "Payment completed successfully"
          : finalPaymentStatus === "PARTIAL"
          ? `Partial payment of ₹${totalPaid.toFixed(2)} received`
          : "Credit confirmed"
      );

      router.push("/pos");
    } catch (err) {
      console.log(err);
      toast.error(err.message || "Payment failed");
    }
  };

  const paidAmount = Number(bill.payment.paidAmount.cash || 0) + Number(bill.payment.paidAmount.online || 0);

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
            <button onClick={() => router.push("/pos")} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft />
            </button>
            <h2 className="font-semibold">
              {table ? `Table ${table.name}` : "Order Billing"}
            </h2>
            <div className="w-10"></div>
          </div>

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

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between bg-gray-50 p-3 rounded-xl">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

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
                      amount: (subtotal * Number(e.target.value)) / 100,
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
                  setBill({
                    ...bill,
                    taxRate: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-6 bg-gray-50">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Total Bill</p>
            <h1 className="text-4xl font-bold">₹{total.toFixed(2)}</h1>
            {bill.payment.status !== "full" && (
              <p className="text-sm text-gray-500 mt-1">
                Paid: ₹{paidAmount.toFixed(2)} | Remaining: ₹{bill.payment.remaining.toFixed(2)}
              </p>
            )}
          </div>

          <select
            className="w-full p-3 rounded-xl border mb-3"
            value={bill.payment.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="full">Full Payment</option>
            <option value="half">Half Payment</option>
            <option value="credit">Credit</option>
          </select>

          {bill.payment.status === "half" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Payment Amount
              </label>
              <input
                type="number"
                className="w-full p-3 border rounded-xl"
                placeholder={`Amount (Max: ₹${(total - 0.01).toFixed(2)})`}
                value={halfPaymentAmount}
                onChange={(e) => handleHalfPaymentChange(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter amount less than total bill
              </p>
            </div>
          )}

          {bill.payment.status !== "credit" && (
            <>
              <select
                className="w-full p-3 rounded-xl border mb-4"
                value={bill.payment.method}
                onChange={(e) => handleMethodChange(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="mixed">Mixed</option>
              </select>

              {bill.payment.method === "mixed" && (
                <div className="space-y-2 mb-3">
                  <input
                    type="number"
                    className="w-full p-3 border rounded-xl"
                    placeholder="Cash Amount"
                    value={bill.payment.paidAmount.cash || ""}
                    onChange={(e) => handleMixedPayment(Number(e.target.value), undefined)}
                  />
                  <input
                    type="number"
                    className="w-full p-3 border rounded-xl"
                    placeholder="Online Amount"
                    value={bill.payment.paidAmount.online || ""}
                    onChange={(e) => handleMixedPayment(undefined, Number(e.target.value))}
                  />
                </div>
              )}
            </>
          )}

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