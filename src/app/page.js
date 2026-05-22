"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Zap,
  MapPin,
  Target,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    revenueChange: 0,
    orders: 0,
    ordersChange: 0,
    products: 0,
    productsChange: 0,
    lowStock: 0,
    lowStockChange: 0,
    transactions: [],
    lowStockItems: [],
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPOS = localStorage.getItem("pos");
      const storedProducts = localStorage.getItem("products");
      const storedInventory = localStorage.getItem("inventory");

      try {
        const posTransactions = storedPOS ? JSON.parse(storedPOS) : [];
        const products = storedProducts ? JSON.parse(storedProducts) : [];
        const inventory = storedInventory ? JSON.parse(storedInventory) : [];

        // Calculate today's revenue and orders
        const today = new Date().toISOString().split("T")[0];
        const todayTransactions = posTransactions.filter((t) => {
          const txnDate = t.date?.split("T")[0] || "";
          return txnDate === today;
        });

        const revenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const orders = todayTransactions.length;

        // Get low stock items (below reorder level)
        const lowStockItems = inventory
          .filter((item) => {
            const quantity = item.quantity || 0;
            const reorderLevel = item.reorderLevel || item.minStock || 20;
            return quantity < reorderLevel;
          })
          .slice(0, 3)
          .map((item) => ({
            name: item.name || "Unknown",
            current: item.quantity || 0,
            min: item.reorderLevel || item.minStock || 20,
            category: item.category || "General",
            sku: item.sku || `SKU-${item.id}`,
          }));

        // Get recent transactions (last 4)
        const recentTransactions = posTransactions
          .sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0);
            const dateB = new Date(b.date || b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 4)
          .map((txn) => {
            const itemCount = Array.isArray(txn.items)
              ? txn.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
              : 0;
            
            const txnDate = new Date(txn.date || txn.createdAt || Date.now());
            const now = new Date();
            const diffMinutes = Math.floor((now - txnDate) / (1000 * 60));
            
            let timeAgo = "";
            if (diffMinutes < 1) timeAgo = "Just now";
            else if (diffMinutes < 60) timeAgo = `${diffMinutes} mins ago`;
            else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)} hours ago`;
            else timeAgo = `${Math.floor(diffMinutes / 1440)} days ago`;

            return {
              id: txn.invoiceNumber || txn.id || `TXN-${Math.random().toString(36).substr(2, 6)}`,
              time: timeAgo,
              items: itemCount,
              total: txn.total || 0,
              customer: txn.customerName || "Walk-in",
              status: txn.status || "completed",
              paymentMethod: txn.paymentMethod || "Cash",
            };
          });

        setDashboardData({
          revenue,
          revenueChange: 0, // Would need historical data
          orders,
          ordersChange: 0, // Would need historical data
          products: products.length,
          productsChange: 0, // Would need historical data
          lowStock: lowStockItems.length,
          lowStockChange: 0,
          transactions: recentTransactions,
          lowStockItems,
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    }
  }, []);

  const quickActions = [
    {
      icon: Zap,
      title: "Lightning Checkout",
      subtitle: "Process sales instantly",
      action: () => router.push("/pos"),
      roles: ["admin", "branch_head", "cashier", "worker"],
    },
    {
      icon: Package,
      title: "Stock Control",
      subtitle: "Monitor inventory",
      action: () => router.push("/inventory"),
      roles: ["admin", "branch_head"],
    },
    {
      icon: TrendingUp,
      title: "Business Insights",
      subtitle: "Analytics & trends",
      action: () => router.push("/reports"),
      roles: ["admin", "branch_head"],
    },
  ];

  const filteredQuickActions = quickActions.filter((action) =>
    user?.role?.some(userRole => action.roles.includes(userRole))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs">
            <div className="text-gray-500 mb-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </div>
            <div className="font-semibold text-gray-900">
              {user?.branch || "Main"}
            </div>
          </div>
          <div className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs">
            <div className="opacity-80 mb-0.5 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Access Level
            </div>
            <div className="font-bold uppercase">
              {user?.role?.join(", ").replace(/_/g, " ")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredQuickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={action.action}
              className="group bg-white hover:bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-0.5">
                {action.title}
              </div>
              <div className="text-xs text-gray-500">{action.subtitle}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">रु</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-green-700">
                +{dashboardData.revenueChange}%
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Cash Flow
          </div>

          <div className="text-2xl font-bold text-gray-900">
            रु{dashboardData.revenue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">Since morning</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-green-700">
                +{dashboardData.ordersChange}%
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Transactions
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardData.orders}
          </div>
          <div className="text-xs text-gray-500 mt-2">Completed today</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-700" />
            </div>
            <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-700">
              +{dashboardData.productsChange}
            </div>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Catalog Size
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboardData.products}
          </div>
          <div className="text-xs text-gray-500 mt-2">Active SKUs</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <span className="text-xs font-bold text-red-700">
                {dashboardData.lowStockChange}
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Stock Alerts
          </div>
          <div className="text-2xl font-bold text-red-600">
            {dashboardData.lowStock}
          </div>
          <div className="text-xs text-gray-500 mt-2">Critical items</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Live Activity Feed
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time transaction stream
              </p>
            </div>
            <button
              onClick={() => router.push("/ledgers")}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium group"
            >
              View all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {dashboardData.transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions yet today
              </div>
            ) : (
              dashboardData.transactions.map((txn, idx) => (
                <div
                  key={idx}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {txn.id}
                        </span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                          {txn.status === "completed" ? "Completed" : txn.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">{txn.customer}</span>
                        <span className="text-gray-300">•</span>
                        <span>{txn.items} items</span>
                        <span className="text-gray-300">•</span>
                        <span>{txn.paymentMethod}</span>
                        <span className="text-gray-300">•</span>
                        <span>{txn.time}</span>
                      </div>
                    </div>

                    <div className="font-bold text-gray-900">
                      रु{txn.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  Restock Queue
                </h2>
                <p className="text-xs text-gray-500">Urgent attention needed</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/inventory")}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium group"
            >
              Manage
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {dashboardData.lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                All items are well stocked
              </div>
            ) : (
              dashboardData.lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {item.category} • {item.sku}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded whitespace-nowrap ml-2">
                      CRITICAL
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Inventory level</span>
                      <span className="font-bold text-gray-900">
                        {item.current} / {item.min} units
                      </span>
                    </div>
                    <div className="relative w-full bg-red-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-red-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            (item.current / item.min) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
