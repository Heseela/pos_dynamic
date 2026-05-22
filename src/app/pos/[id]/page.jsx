"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Printer,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  Receipt,
} from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function POSPage({ params }) {
  const { id: tableId } = React.use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (!tableId) {
          throw new Error("Table ID missing");
        }

        // ================= TABLE =================
        const tableRes = await fetch(`/api/tables/${tableId}`, {
          cache: "no-store",
        });

        const tableData = await tableRes.json().catch(() => null);

        if (!tableRes.ok) {
          throw new Error(tableData?.message || "Failed to load table");
        }

        setTable(tableData);

        // ================= EXISTING ORDER =================
        if (tableData?.orders?.length > 0) {
          const latestOrder =
            tableData.orders[tableData.orders.length - 1];

          setIsEditingOrder(true);
          setCurrentOrderId(latestOrder?.id || null);

          const loadedCart = (latestOrder?.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          }));

          setCart(loadedCart);
        } else {
          setCart([]);
          setIsEditingOrder(false);
          setCurrentOrderId(null);
        }

        // ================= PRODUCTS =================
        const productRes = await fetch(`/api/product`, {
          cache: "no-store",
        });

        const productData = await productRes.json().catch(() => []);

        if (!productRes.ok) {
          throw new Error(
            productData?.message || "Failed to load products"
          );
        }

        if (Array.isArray(productData)) {
          setProducts(
            productData.map((p) => ({
              ...p,
              sellingPrice: Number(p.sellingPrice) || 0,
            }))
          );
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("POS ERROR:", error);
        toast.error(error?.message || "Failed to load POS");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableId]);

  // ================= ADD TO CART =================
  const addToCart = (product) => {
    const price = Number(product.sellingPrice) || 0;

    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);

      if (exists) {
        return prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                quantity: p.quantity + 1,
              }
            : p
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          quantity: 1,
        },
      ];
    });
  };

  // ================= UPDATE QUANTITY =================
  const updateQty = (id, qty) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity: qty,
                }
              : i
          )
    );
  };

  // ================= SUBTOTAL =================
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ================= SAVE ORDER =================
  const placeOrder = async () => {
    try {
      if (cart.length === 0) {
        toast.error("Cart is empty");
        return;
      }

      const orderData = {
        customerName: "Guest",

        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),

        grossAmount: subtotal,
        total: subtotal,

        tableId,

        orderStatus: "ongoing",
        orderType: "table",

        paymentMethod: "",

        discount: {
          value: 0,
          amount: 0,
        },

        paymentStatus: "pending",

        paidAmount: {
          cash: 0,
          online: 0,
        },

        tax: {
          rate: 0,
          amount: 0,
        },
      };

      const url =
        isEditingOrder && currentOrderId
          ? `/api/order/${currentOrderId}`
          : `/api/order`;

      const method =
        isEditingOrder && currentOrderId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(orderData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save order");
      }

      toast.success(
        isEditingOrder
          ? "Order updated successfully"
          : "Order placed successfully"
      );

      setCart([]);
      setIsEditingOrder(false);
      setCurrentOrderId(null);

      setTimeout(() => {
        router.push("/pos");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Error placing order");
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>

          <div className="text-gray-600">Loading POS...</div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier"]}>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* ================= HEADER ================= */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            <button
              onClick={() => router.push("/pos")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="h-6 sm:h-8 w-px bg-gray-200 flex-shrink-0"></div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="bg-black rounded-lg p-2 flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg md:text-xl font-bold truncate">
                    Table {table?.name}
                  </h1>

                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    Table Order • POS
                  </p>
                </div>
              </div>
            </div>

            {isEditingOrder && (
              <div className="hidden sm:flex ml-2 md:ml-4 bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap">
                Editing Existing Order
              </div>
            )}
          </div>

          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <Printer className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* ================= MENU SECTION ================= */}
          <div className="flex-1 flex flex-col overflow-hidden order-2 lg:order-1">
            <div className="px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-gray-600" />

                <h2 className="text-base sm:text-lg font-semibold">
                  Menu Items
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Click on any item to add to order
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all text-left"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </div>

                    <p className="font-medium text-sm sm:text-base text-gray-800 line-clamp-2">
                      {p.name}
                    </p>

                    <p className="text-base sm:text-lg font-bold text-green-600 mt-2">
                      ₹{p.sellingPrice}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= CART SECTION ================= */}
          <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col shadow-lg order-1 lg:order-2 max-h-[45vh] lg:max-h-full">
            {/* CART HEADER */}
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base sm:text-lg">
                    Current Order
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {cart.length}{" "}
                    {cart.length === 1 ? "item" : "items"} in cart
                  </p>
                </div>

                <Receipt className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* CART ITEMS */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {cart.length === 0 && (
                <div className="text-center py-10 sm:py-16">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                  </div>

                  <p className="text-sm sm:text-base text-gray-400">
                    No items added
                  </p>

                  <p className="text-[11px] sm:text-xs text-gray-300 mt-1">
                    Click on menu items to add
                  </p>
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-100 gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-800 truncate">
                      {item.name}
                    </p>

                    <p className="text-xs sm:text-sm text-gray-500">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        updateQty(item.id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-6 sm:w-8 text-center font-medium text-sm">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQty(item.id, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>

                    <button
                      onClick={() => updateQty(item.id, 0)}
                      className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= FOOTER ================= */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm sm:text-base text-gray-600">
                  Subtotal
                </span>

                <span className="text-xl sm:text-2xl font-bold">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={placeOrder}
                  className="bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors text-sm sm:text-base"
                >
                  {isEditingOrder
                    ? "Update Order"
                    : "Save Order"}
                </button>

                <button
                  onClick={() => {
                    if (cart.length === 0) {
                      toast.error("Cart is empty");
                      return;
                    }

                    router.push(
                      `/pos/billing/${tableId}?type=table`
                    );
                  }}
                  className="bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Proceed to Pay
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-gray-400 text-center mt-4">
                Tax will be calculated at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
