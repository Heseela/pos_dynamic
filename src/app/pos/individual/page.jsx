"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Package,
  Bike,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Search,
  Receipt,
  Save,
  CreditCard
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

// Order Type Selection Component
function OrderTypeSelector({ onSelect, selectedType, ongoingOrder, loadingOrder, onContinueOrder, refreshOngoingOrder }) {
  const orderTypes = [
    {
      id: "takeaway",
      title: "Takeaway",
      description: "Pack and collect from counter",
      icon: Package,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "delivery",
      title: "Delivery",
      description: "Deliver to customer's address",
      icon: Bike,
      color: "bg-blue-50 text-blue-600",
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Select Order Type</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`group relative bg-white border-2 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                isSelected
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isSelected ? "bg-gray-900 text-white" : type.color
                  } group-hover:bg-gray-900 group-hover:text-white`}
                >
                  <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>

                {isSelected && (
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Ongoing Order UI - Clickable */}
      <div 
        className={`mt-4 bg-white border border-gray-200 rounded-xl p-4 transition-all ${
          ongoingOrder ? "cursor-pointer hover:shadow-md hover:border-gray-400" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Ongoing Order
          </h3>
          {ongoingOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshOngoingOrder();
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          )}
        </div>

        {loadingOrder ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : ongoingOrder ? (
          <div 
            onClick={() => onContinueOrder(ongoingOrder)}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {ongoingOrder.customerName}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                ongoingOrder.orderType === "delivery" 
                  ? "bg-blue-100 text-blue-600" 
                  : "bg-purple-100 text-purple-600"
              }`}>
                {ongoingOrder.orderType === "delivery" ? (
                  <Bike size={12} />
                ) : (
                  <Package size={12} />
                )}
                {ongoingOrder.orderType === "delivery" ? "Delivery" : "Takeaway"}
              </span>
            </div>
            
            <p className="text-xs text-gray-500">
              📞 {ongoingOrder.contactNumber || "N/A"}
            </p>
            
            <p className="text-xs text-gray-500">
              Items: {ongoingOrder.items?.length || 0}
            </p>
            
            <p className="text-xs text-gray-500">
              Total: रु {(ongoingOrder.total || 0).toLocaleString()}
            </p>
            
            <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
              {ongoingOrder.orderStatus}
            </span>
            
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              Click to continue this order →
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No ongoing order</p>
        )}
      </div>
    </div>
  );
}

// Customer Details Form Component
function CustomerDetailsForm({ orderType, customer, setCustomer, errors }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="Enter customer name"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors"
            />
          </div>
        </div>

        {orderType === "delivery" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder="Enter delivery address"
                rows={2}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors resize-none ${
                  errors.address ? "border-red-500" : "border-gray-200"
                }`}
              />
            </div>
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IndividualOrderPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: ""
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  const [ongoingOrder, setOngoingOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/product");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.map(p => ({
            ...p,
            sellingPrice: Number(p.sellingPrice) || 0
          })));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch ongoing order
  const fetchOngoingOrder = async () => {
    try {
      setLoadingOrder(true);
      const res = await fetch("/api/order");
      const data = await res.json();
      const orders = Array.isArray(data) ? data : [data];
      const ongoing = orders.find(
        (o) => (o.orderStatus === "ONGOING" || o.orderStatus === "ongoing") && 
               (o.orderType === "takeaway" || o.orderType === "delivery")
      );
      setOngoingOrder(ongoing || null);
    } catch (err) {
      console.error("Error fetching ongoing order:", err);
      setOngoingOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    fetchOngoingOrder();
  }, []);

  // Function to continue an existing order
  const continueOrder = (order) => {
    if (!order) return;
    
    // Set order type from existing order
    setOrderType(order.orderType);
    
    // Load customer details
    setCustomer({
      name: order.customerName || "",
      phone: order.contactNumber || "",
      address: order.customerAddress || ""
    });
    
    // Load cart items
    const loadedCart = (order.items || []).map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1
    }));
    setCart(loadedCart);
    
    // Set order editing state
    setCurrentOrderId(order.id);
    setIsEditingOrder(true);
    
    // Move to step 2
    setStep(2);
    
    toast.success(`Continuing ${order.orderType} order for ${order.customerName}`);
  };

  const addToCart = (product) => {
    const price = Number(product.sellingPrice) || 0;
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price,
        quantity: 1
      }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 13;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const validateCustomer = () => {
    const newErrors = {};
    if (!customer.name.trim()) newErrors.name = "Customer name is required";
    if (orderType === "delivery" && !customer.address.trim()) {
      newErrors.address = "Delivery address is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Order Function
  const saveOrder = async () => {
    if (!validateCustomer()) return;
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        customerName: customer.name,
        contactNumber: customer.phone || null,
        customerAddress: orderType === "delivery" ? customer.address : null,
        orderType: orderType,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        grossAmount: subtotal,
        discount: { value: 0, amount: 0 },
        tax: { rate: taxRate, amount: taxAmount },
        total: total,
        paymentMethod: "",
        paymentStatus: "pending",
        orderStatus: "ongoing",
        paidAmount: { cash: 0, online: 0 },
        tableId: ""
      };

      let url = "/api/order";
      let method = "POST";

      if (currentOrderId) {
        url = `/api/order/${currentOrderId}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      console.log("Save order response:", data);
      
      if (!res.ok) throw new Error(data.message || "Failed to save order");

      const orderId = data.id || data.order?.id;
      setCurrentOrderId(orderId);
      setIsEditingOrder(true);
      
      toast.success(isEditingOrder ? "Order updated successfully!" : "Order saved successfully!");
      return orderId;
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save order");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Proceed to Payment Function
  const proceedToPayment = async () => {
    if (!validateCustomer()) return;
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProceeding(true);
    try {
      const orderData = {
        customerName: customer.name,
        contactNumber: customer.phone || null,
        customerAddress: orderType === "delivery" ? customer.address : null,
        orderType: orderType,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        grossAmount: subtotal,
        discount: { value: 0, amount: 0 },
        tax: { rate: taxRate, amount: taxAmount },
        total: total,
        paymentMethod: "",
        paymentStatus: "pending",
        orderStatus: "ongoing",
        paidAmount: { cash: 0, online: 0 },
        tableId: ""
      };

      let url = "/api/order";
      let method = "POST";

      if (currentOrderId) {
        url = `/api/order/${currentOrderId}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      console.log("Proceed to payment response:", data);
      
      if (!res.ok) throw new Error(data.message || "Failed to save order");

      const orderId = data.id || data.order?.id;
      
      if (!orderId) {
        throw new Error("No order ID returned");
      }
      
      toast.success("Order saved! Redirecting to payment...");
      
      // Store a flag in sessionStorage to indicate that we need to refresh ongoing orders
      sessionStorage.setItem('shouldRefreshOngoingOrder', 'true');
      
      // Redirect to order page
      router.push(`/pos/order/${orderId}`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save order");
    } finally {
      setIsProceeding(false);
    }
  };

  // Check for refresh flag when component mounts
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('shouldRefreshOngoingOrder');
    if (shouldRefresh === 'true') {
      sessionStorage.removeItem('shouldRefreshOngoingOrder');
      fetchOngoingOrder();
      // Also reset the editing state if needed
      if (step === 2) {
        setStep(1);
        setCart([]);
        setCustomer({ name: "", phone: "", address: "" });
        setCurrentOrderId(null);
        setIsEditingOrder(false);
        setOrderType(null);
      }
    }
  }, [router]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head", "cashier", "worker"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading menu...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head", "cashier", "worker"]}>
      <div className="min-h-screen bg-gray-50">
        
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => {
                if (step === 1) router.push("/pos");
                else if (step === 2) setStep(1);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Individual Order</h1>
              <p className="text-sm text-gray-500">
                {step === 1 && "Select order type"}
                {step === 2 && "Add items to cart"}
              </p>
            </div>
            {isEditingOrder && step === 2 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full ml-4">
                Editing Order
              </span>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Step 1: Order Type Selection */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto">
              <OrderTypeSelector
                selectedType={orderType}
                onSelect={(type) => {
                  setOrderType(type);
                  setTimeout(() => setStep(2), 300);
                }}
                ongoingOrder={ongoingOrder}
                loadingOrder={loadingOrder}
                onContinueOrder={continueOrder}
                refreshOngoingOrder={fetchOngoingOrder}
              />
            </div>
          )}

          {/* Step 2: Menu & Cart */}
          {step === 2 && (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Menu Section */}
              <div className="flex-1">
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-gray-900 transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.unit || "Item"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            रु {product.sellingPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                        <Plus size={12} /> Tap to add to cart
                      </p>
                    </button>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No items found</p>
                  </div>
                )}
              </div>

              {/* Cart Section */}
              <div className="lg:w-[450px]">
                <div className="bg-white rounded-xl border border-gray-200 sticky top-20">
                  <div className="p-4 border-b">
                    <h2 className="font-bold text-lg">Current Order</h2>
                    <p className="text-sm text-gray-500">{cart.length} items</p>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt size={40} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Cart is empty</p>
                        <p className="text-xs text-gray-400">Tap items to add</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">रु {item.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded hover:bg-gray-200 transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded hover:bg-gray-200 transition"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => updateQuantity(item.id, 0)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Customer Details Form */}
                  <div className="p-4 border-t border-gray-100">
                    <CustomerDetailsForm
                      orderType={orderType}
                      customer={customer}
                      setCustomer={setCustomer}
                      errors={errors}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>रु {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">VAT ({taxRate}%)</span>
                        <span>रु {taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-green-600">रु {total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Two buttons: Save Order and Proceed to Payment */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={saveOrder}
                        disabled={cart.length === 0 || isSaving}
                        className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        {isEditingOrder ? "Update Order" : "Save Order"}
                      </button>
                      
                      <button
                        onClick={proceedToPayment}
                        disabled={cart.length === 0 || isProceeding}
                        className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {isProceeding ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CreditCard size={18} />
                        )}
                        Proceed to Pay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}