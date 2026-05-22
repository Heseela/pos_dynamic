"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function BillingPage() {
  const { tableId } = useParams();
  const router = useRouter();

  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [halfPaymentAmount, setHalfPaymentAmount] = useState(0);

  const [bill, setBill] = useState({
    discount: { value: 0, amount: 0 },
    taxRate: 0,

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

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const res = await fetch(`/api/tables/${tableId}`);
        const data = await res.json();

        if (res.ok) {
          setTable(data);
        } else {
          toast.error("Failed to load table");
        }
      } catch {
        toast.error("Error loading billing");
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [tableId]);

  // =========================
  // CALCULATIONS
  // =========================
  const subtotal =
    table?.orders?.reduce(
      (sum, order) =>
        sum +
        (order?.items || []).reduce(
          (s, i) => s + (i.price || 0) * (i.quantity || 0),
          0
        ),
      0
    ) || 0;

  const discountAmount = () => {
    return (subtotal * (bill.discount.value || 0)) / 100;
  };

  const taxAmount = () => {
    const base = subtotal - discountAmount();
    return base * (bill.taxRate / 100);
  };

  const total = subtotal - discountAmount() + taxAmount();

  // =========================
  // STATUS CHANGE
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
        setHalfPaymentAmount(0);

        paidAmount = {
          cash: 0,
          online: 0,
        };

        remaining = total;
      }

      if (status === "credit") {
        paidAmount = {
          cash: 0,
          online: 0,
        };

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
  // HALF PAYMENT
  // =========================
  const handleHalfPaymentChange = (value) => {
    const amount = Number(value);
    const maxAmount = total;

    if (amount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    if (amount > maxAmount) {
      toast.error(
        `Amount cannot exceed total bill: ₹${maxAmount.toFixed(2)}`
      );
      return;
    }

    setHalfPaymentAmount(amount);

    setBill((p) => ({
      ...p,

      payment: {
        ...p.payment,

        paidAmount: {
          cash:
            p.payment.method === "cash"
              ? amount
              : p.payment.method === "online"
              ? 0
              : amount,

          online:
            p.payment.method === "online"
              ? amount
              : p.payment.method === "cash"
              ? 0
              : 0,
        },

        remaining: total - amount,
      },
    }));
  };

  // =========================
  // MIXED PAYMENT
  // =========================
  const handleMixed = (cash, online) => {
    setBill((p) => {
      const newCash =
        cash !== undefined
          ? cash
          : p.payment.paidAmount.cash;

      const newOnline =
        online !== undefined
          ? online
          : p.payment.paidAmount.online;

      const paid = newCash + newOnline;
      const remaining = total - paid;

      if (paid > total) {
        toast.error(
          `Total paid cannot exceed ₹${total.toFixed(2)}`
        );

        return p;
      }

      return {
        ...p,

        payment: {
          ...p.payment,

          method: "mixed",

          status:
            paid === total
              ? "full"
              : paid > 0
              ? "half"
              : "credit",

          paidAmount: {
            cash: newCash,
            online: newOnline,
          },

          remaining,
        },
      };
    });
  };

  // =========================
  // PAYMENT
  // =========================
  const handlePayment = async () => {
    try {
      const order = table?.orders?.[0];

      if (bill.payment.status === "half") {
        const paidAmount =
          bill.payment.paidAmount.cash +
          bill.payment.paidAmount.online;

        if (paidAmount <= 0) {
          toast.error(
            "Please enter an amount for half payment"
          );
          return;
        }

        if (paidAmount >= total) {
          toast.error(
            "For half payment, amount should be less than total bill"
          );
          return;
        }
      }

      const res = await fetch(`/api/order/${order?.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          tableId,

          subtotal,

          discount: bill.discount,

          tax: {
            rate: bill.taxRate,
            amount: taxAmount(),
          },

          total,

          paymentStatus: bill.payment.status,
          paymentMethod: bill.payment.method,

          paidAmount: bill.payment.paidAmount,

          remainingAmount: bill.payment.remaining,

          tableStatus:
            bill.payment.status === "full"
              ? "available"
              : "occupied",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast.success(
        bill.payment.status === "full"
          ? "Payment completed successfully"
          : `Payment of ₹${(
              bill.payment.paidAmount.cash +
              bill.payment.paidAmount.online
            ).toFixed(2)} received. Remaining: ₹${bill.payment.remaining.toFixed(
              2
            )}`
      );

      router.push("/pos");
    } catch (err) {
      toast.error(err.message || "Payment failed");
    }
  };

  // =========================
  // PAID AMOUNT
  // =========================
  const paidAmount =
    bill.payment.paidAmount.cash +
    bill.payment.paidAmount.online;

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        Loading billing...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">

        {/* ================= LEFT ================= */}
        <div className="lg:col-span-2 p-4 sm:p-5 md:p-6 border-b lg:border-b-0 lg:border-r">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-5 gap-3">
            <button
              onClick={() => router.push("/pos")}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft />
            </button>

            <h2 className="font-semibold text-sm sm:text-base md:text-lg text-center flex-1">
              Table {table?.name}
            </h2>

            <div className="w-10"></div>
          </div>

          {/* ITEMS */}
          <div className="space-y-2 max-h-[280px] sm:max-h-[350px] overflow-y-auto pr-1">
            {table?.orders?.map((order) =>
              order?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center gap-3 bg-gray-50 p-3 rounded-xl"
                >
                  <span className="text-sm sm:text-base break-words">
                    {item.name} × {item.quantity}
                  </span>

                  <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                    ₹{(
                      item.price * item.quantity
                    ).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* DISCOUNT + TAX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

            {/* DISCOUNT */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold mb-2 text-sm sm:text-base">
                Discount (%)
              </p>

              <input
                className="w-full border p-2.5 rounded-lg text-sm sm:text-base"
                type="number"
                value={bill.discount.value}
                onChange={(e) =>
                  setBill((p) => ({
                    ...p,

                    discount: {
                      value: Number(e.target.value),

                      amount:
                        (subtotal *
                          Number(e.target.value)) /
                        100,
                    },
                  }))
                }
              />
            </div>

            {/* TAX */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold mb-2 text-sm sm:text-base">
                Tax (%)
              </p>

              <input
                className="w-full border p-2.5 rounded-lg text-sm sm:text-base"
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

        {/* ================= RIGHT ================= */}
        <div className="p-4 sm:p-5 md:p-6 bg-gray-50">

          {/* TOTAL */}
          <div className="text-center mb-6">
            <p className="text-xs sm:text-sm text-gray-500">
              Total Bill
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold break-words">
              ₹{total.toFixed(2)}
            </h1>

            {bill.payment.status !== "full" && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2 break-words">
                Paid: ₹{paidAmount.toFixed(2)} | Remaining:
                ₹{bill.payment.remaining.toFixed(2)}
              </p>
            )}
          </div>

          {/* STATUS */}
          <select
            className="w-full p-3 rounded-xl border mb-3 text-sm sm:text-base"
            value={bill.payment.status}
            onChange={(e) =>
              handleStatusChange(e.target.value)
            }
          >
            <option value="full">Full Payment</option>
            <option value="half">Half Payment</option>
            <option value="credit">Credit</option>
          </select>

          {/* HALF PAYMENT */}
          {bill.payment.status === "half" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Payment Amount
              </label>

              <input
                type="number"
                className="w-full p-3 border rounded-xl text-sm sm:text-base"
                placeholder={`Amount (Max: ₹${total.toFixed(
                  2
                )})`}
                value={halfPaymentAmount}
                onChange={(e) =>
                  handleHalfPaymentChange(
                    e.target.value
                  )
                }
                min="0"
                max={total}
                step="0.01"
              />

              <p className="text-xs text-gray-500 mt-1">
                Min: ₹0.01 | Max: ₹
                {(total - 0.01).toFixed(2)}
              </p>
            </div>
          )}

          {/* METHOD */}
          {bill.payment.status !== "credit" && (
            <>
              <select
                className="w-full p-3 rounded-xl border mb-4 text-sm sm:text-base"
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
              {bill.payment.method === "mixed" &&
                bill.payment.status !== "credit" && (
                  <div className="space-y-2 mb-4">
                    <input
                      type="number"
                      className="w-full p-3 border rounded-xl text-sm sm:text-base"
                      placeholder="Cash Amount"
                      value={
                        bill.payment.paidAmount.cash || ""
                      }
                      onChange={(e) =>
                        handleMixed(
                          Number(e.target.value),
                          undefined
                        )
                      }
                    />

                    <input
                      type="number"
                      className="w-full p-3 border rounded-xl text-sm sm:text-base"
                      placeholder="Online Amount"
                      value={
                        bill.payment.paidAmount.online ||
                        ""
                      }
                      onChange={(e) =>
                        handleMixed(
                          undefined,
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                )}
            </>
          )}

          {/* SUMMARY */}
          <div className="text-sm space-y-3 mb-6 border-t pt-4">

            <div className="flex justify-between gap-3">
              <span>Subtotal</span>
              <span className="font-medium">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between gap-3 text-red-500">
              <span>Discount</span>
              <span className="font-medium">
                -₹{discountAmount().toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span>Tax</span>
              <span className="font-medium">
                ₹{taxAmount().toFixed(2)}
              </span>
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={handlePayment}
            className="w-full bg-black text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition text-sm sm:text-base"
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