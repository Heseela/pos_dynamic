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
          (s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)),
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
  // AUTO UPDATE FULL PAYMENT
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
      }

      if (bill.payment.method === "online") {
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
    setBill((p) => {
      let paidAmount = {
        cash: 0,
        online: 0,
      };

      let remaining = total;

      if (status === "full") {
        if (p.payment.method === "cash") {
          paidAmount = {
            cash: total,
            online: 0,
          };
        }

        if (p.payment.method === "online") {
          paidAmount = {
            cash: 0,
            online: total,
          };
        }

        if (p.payment.method === "mixed") {
          paidAmount = {
            cash: total,
            online: 0,
          };
        }

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
  // PAYMENT METHOD CHANGE
  // =========================
  const handleMethodChange = (method) => {
    setBill((p) => {
      let paidAmount = {
        cash: 0,
        online: 0,
      };

      // FULL PAYMENT
      if (p.payment.status === "full") {
        if (method === "cash") {
          paidAmount = {
            cash: total,
            online: 0,
          };
        }

        if (method === "online") {
          paidAmount = {
            cash: 0,
            online: total,
          };
        }

        if (method === "mixed") {
          paidAmount = {
            cash: total,
            online: 0,
          };
        }
      }

      // HALF PAYMENT
      if (p.payment.status === "half") {
        if (method === "cash") {
          paidAmount = {
            cash: halfPaymentAmount,
            online: 0,
          };
        }

        if (method === "online") {
          paidAmount = {
            cash: 0,
            online: halfPaymentAmount,
          };
        }

        if (method === "mixed") {
          paidAmount = {
            cash: 0,
            online: 0,
          };
        }
      }

      return {
        ...p,

        payment: {
          ...p.payment,
          method,
          paidAmount,
          remaining:
            total -
            (paidAmount.cash + paidAmount.online),
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

    setBill((p) => {
      let paidAmount = {
        cash: 0,
        online: 0,
      };

      if (p.payment.method === "cash") {
        paidAmount = {
          cash: amount,
          online: 0,
        };
      }

      if (p.payment.method === "online") {
        paidAmount = {
          cash: 0,
          online: amount,
        };
      }

      if (p.payment.method === "mixed") {
        paidAmount = p.payment.paidAmount;
      }

      return {
        ...p,

        payment: {
          ...p.payment,
          paidAmount,
          remaining:
            total -
            (paidAmount.cash + paidAmount.online),
        },
      };
    });
  };

  // =========================
  // MIXED PAYMENT
  // =========================
  const handleMixed = (cash, online) => {
    setBill((p) => {
      const newCash =
        cash !== undefined
          ? Number(cash)
          : Number(p.payment.paidAmount.cash);

      const newOnline =
        online !== undefined
          ? Number(online)
          : Number(p.payment.paidAmount.online);

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

      if (!order?.id) {
        toast.error("Order not found");
        return;
      }

      const finalPaidAmount = {
        cash: Number(bill.payment.paidAmount.cash || 0),
        online: Number(bill.payment.paidAmount.online || 0),
      };

      const totalPaid =
        finalPaidAmount.cash +
        finalPaidAmount.online;

      // FULL PAYMENT FIX
      if (
        bill.payment.status === "full" &&
        totalPaid === 0
      ) {
        if (bill.payment.method === "cash") {
          finalPaidAmount.cash = total;
        }

        if (bill.payment.method === "online") {
          finalPaidAmount.online = total;
        }
      }

      // VALIDATION
      if (bill.payment.status === "half") {
        if (totalPaid <= 0) {
          toast.error(
            "Please enter an amount for half payment"
          );
          return;
        }

        if (totalPaid >= total) {
          toast.error(
            "For half payment, amount should be less than total bill"
          );
          return;
        }
      }

      const payload = {
        tableId,

        subtotal,

        discount: {
          value: Number(bill.discount.value || 0),
          amount: Number(discountAmount()),
        },

        tax: {
          rate: Number(bill.taxRate || 0),
          amount: Number(taxAmount()),
        },

        total: Number(total),

        paymentStatus:
          bill.payment.status === "full"
            ? "PAID"
            : bill.payment.status === "half"
            ? "PARTIAL"
            : "CREDIT",

        paymentMethod: bill.payment.method.toUpperCase(),

        paidAmount: {
          cash: Number(finalPaidAmount.cash),
          online: Number(finalPaidAmount.online),
        },

        remainingAmount: Number(
          total -
            (finalPaidAmount.cash +
              finalPaidAmount.online)
        ),

        orderStatus:
          bill.payment.status === "full"
            ? "COMPLETED"
            : "PENDING",

        tableStatus:
          bill.payment.status === "full"
            ? "available"
            : "occupied",
      };

      console.log("PAYLOAD =>", payload);

      const res = await fetch(`/api/order/${order.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("RESPONSE =>", data);

      if (!res.ok) {
        throw new Error(
          data.message || "Payment failed"
        );
      }

      toast.success(
        bill.payment.status === "full"
          ? "Payment completed successfully"
          : `Payment of ₹${(
              finalPaidAmount.cash +
              finalPaidAmount.online
            ).toFixed(2)} received`
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
    Number(bill.payment.paidAmount.cash || 0) +
    Number(bill.payment.paidAmount.online || 0);

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
                Paid: ₹{paidAmount.toFixed(2)} |
                Remaining:
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
                  handleMethodChange(e.target.value)
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