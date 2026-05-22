"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("month");
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    avgOrderValue: 0,
    avgOrderChange: 0,
    lowStockItems: 0,
    stockChange: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCategories = localStorage.getItem("categories");
      const storedProducts = localStorage.getItem("products");
      const storedPOS = localStorage.getItem("pos");
      const storedInventory = localStorage.getItem("inventory");

      try {
        const products = storedProducts ? JSON.parse(storedProducts) : [];
        const posTransactions = storedPOS ? JSON.parse(storedPOS) : [];
        const inventory = storedInventory ? JSON.parse(storedInventory) : [];
        const categoriesData = storedCategories ? JSON.parse(storedCategories) : { products: [] };

        // Calculate metrics
        const totalRevenue = posTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
        const totalOrders = posTransactions.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const lowStockItems = inventory.filter(item => (item.quantity || 0) < (item.reorderLevel || 10)).length;

        setMetrics({
          totalRevenue,
          revenueChange: 0, // Would need historical data
          totalOrders,
          ordersChange: 0, // Would need historical data
          avgOrderValue,
          avgOrderChange: 0, // Would need historical data
          lowStockItems,
          stockChange: 0,
        });

        // Calculate top products
        const productSales = {};
        posTransactions.forEach((transaction) => {
          if (transaction.items && Array.isArray(transaction.items)) {
            transaction.items.forEach((item) => {
              const productKey = item.productId || item.name;
              if (!productSales[productKey]) {
                productSales[productKey] = {
                  name: item.name,
                  sold: 0,
                  revenue: 0,
                  productId: item.productId
                };
              }
              productSales[productKey].sold += item.quantity || 0;
              productSales[productKey].revenue += (item.price || 0) * (item.quantity || 0);
            });
          }
        });

        const topProductsList = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p, idx) => {
            const product = products.find(prod => prod.id === p.productId || prod.name === p.name);
            return {
              id: idx + 1,
              name: p.name,
              sold: p.sold,
              revenue: p.revenue,
              stock: product?.stock || 0
            };
          });

        setTopProducts(topProductsList);

        // Calculate category breakdown
        const productCategories = categoriesData.products || [];
        const categoryStats = productCategories.map((cat) => {
          let catRevenue = 0;

          posTransactions.forEach((transaction) => {
            if (transaction.items && Array.isArray(transaction.items)) {
              transaction.items.forEach((item) => {
                const product = products.find((p) => p.id === item.productId || p.name === item.name);
                if (product && product.category === cat.name) {
                  catRevenue += (item.price || 0) * (item.quantity || 0);
                }
              });
            }
          });

          return {
            category: cat.name,
            revenue: catRevenue,
            percentage: 0,
            growth: 0, // Would need historical data
          };
        });

        const totalCatRevenue = categoryStats.reduce((sum, cat) => sum + cat.revenue, 0);
        const categoryWithPercentage = categoryStats.map((cat) => ({
          ...cat,
          percentage: totalCatRevenue > 0 ? ((cat.revenue / totalCatRevenue) * 100).toFixed(1) : 0,
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 4);

        setCategoryBreakdown(categoryWithPercentage);

        // Get recent transactions
        const recent = posTransactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3)
          .map((t, idx) => ({
            id: t.id || idx + 1,
            invoice: t.invoiceNumber || `INV-${t.id || idx + 1}`,
            date: t.date || new Date().toISOString().split('T')[0],
            customer: t.customerName || "Walk-in Customer",
            amount: t.total || 0,
            status: t.status || "Completed",
          }));

        setRecentTransactions(recent);

      } catch (error) {
        console.error("Error loading report data:", error);
      }
    }
  }, [dateRange]);

  const exportToCSV = () => {
    const report = [
      ["Business Report Summary"],
      ["Period", dateRange],
      ["Generated", new Date().toLocaleString()],
      [""],
      ["KEY METRICS"],
      ["Metric", "Value", "Change"],
      [
        "Total Revenue",
        `रु${metrics.totalRevenue}`,
        `${metrics.revenueChange}%`,
      ],
      ["Total Orders", metrics.totalOrders, `${metrics.ordersChange}%`],
      [
        "Avg Order Value",
        `रु${metrics.avgOrderValue}`,
        `${metrics.avgOrderChange}%`,
      ],
      [
        "Low Stock Items",
        metrics.lowStockItems,
        `${metrics.stockChange} items`,
      ],
      [""],
      ["TOP SELLING PRODUCTS"],
      ["Rank", "Product", "Units Sold", "Revenue", "Stock"],
      ...topProducts.map((p, idx) => [
        idx + 1,
        p.name,
        p.sold,
        p.revenue,
        p.stock,
      ]),
      [""],
      ["REVENUE BY CATEGORY"],
      ["Category", "Revenue", "Percentage", "Growth"],
      ...categoryBreakdown.map((c) => [
        c.category,
        c.revenue,
        `${c.percentage}%`,
        `${c.growth}%`,
      ]),
      [""],
      ["RECENT TRANSACTIONS"],
      ["Invoice", "Date", "Customer", "Amount", "Status"],
      ...recentTransactions.map((t) => [
        t.invoice,
        t.date,
        t.customer,
        t.amount,
        t.status,
      ]),
    ];

    const csv = report.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `business-report-${dateRange}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const getGrowthColor = (growth) => {
    if (growth >= 0) return "bg-green-500";
    return "bg-red-500";
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Business Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track performance and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-xl font-bold">रु</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              रु{metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUp className="text-green-600" size={12} />
              <span className="font-medium text-green-700">
                {metrics.revenueChange}% vs last period
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <ShoppingCart className="text-gray-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {metrics.totalOrders}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowDown className="text-red-600" size={12} />
              <span className="font-medium text-red-700">
                {Math.abs(metrics.ordersChange)}% vs last period
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Avg Order Value
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <TrendingUp className="text-gray-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              रु{metrics.avgOrderValue}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUp className="text-green-600" size={12} />
              <span className="font-medium text-green-700">
                {metrics.avgOrderChange}% vs last period
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Low Stock Items
              </span>
              <div className="p-2 bg-red-50 rounded-lg">
                <Package className="text-red-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">
              {metrics.lowStockItems}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUp className="text-gray-600" size={12} />
              <span className="font-medium text-gray-600">
                {metrics.stockChange} items need reorder
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Top Selling Products
              </h2>
              <button
                onClick={() => router.push("/reports/products")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No sales data available
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.sold} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">
                        रु{product.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.stock} in stock
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Revenue by Category
              </h2>
              <button
                onClick={() => router.push("/reports/categories")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No category data available
                </div>
              ) : (
                categoryBreakdown.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {cat.category}
                        </span>
                        {cat.growth !== 0 && (
                          <div className="inline-flex items-center gap-0.5">
                            {cat.growth >= 0 ? (
                              <TrendingUp className="text-green-600" size={12} />
                            ) : (
                              <TrendingDown className="text-red-600" size={12} />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                cat.growth >= 0 ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              {cat.growth >= 0 ? "+" : ""}
                              {cat.growth}%
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        रु{cat.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getGrowthColor(
                            cat.growth
                          )}`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Transactions
              </h2>
              <button
                onClick={() => router.push("/ledgers")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                      No transactions available
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        {txn.invoice}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {txn.date}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900">
                        {txn.customer}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                        रु{txn.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${
                            txn.status === "Completed"
                              ? "bg-gray-900 text-white"
                              : "bg-white border border-gray-300 text-gray-700"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => router.push(`/pos`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
