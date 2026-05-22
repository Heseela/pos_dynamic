"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CategoryReportPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCategories = localStorage.getItem("categories");
      const storedProducts = localStorage.getItem("products");
      const storedPOS = localStorage.getItem("pos");

      if (storedCategories && storedProducts) {
        try {
          const categoriesData = JSON.parse(storedCategories);
          const products = JSON.parse(storedProducts);
          const posTransactions = storedPOS ? JSON.parse(storedPOS) : [];

      
          const productCategories = categoriesData.products || [];

         
          const categoryStats = productCategories.map((cat) => {
            const categoryProducts = products.filter(
              (p) => p.category === cat.name
            );

            // Calculate revenue from POS sales for this category
            let catRevenue = 0;
            let unitsSold = 0;

            posTransactions.forEach((transaction) => {
              if (transaction.items && Array.isArray(transaction.items)) {
                transaction.items.forEach((item) => {
                  const product = products.find((p) => p.id === item.productId || p.name === item.name);
                  if (product && product.category === cat.name) {
                    catRevenue += (item.price || 0) * (item.quantity || 0);
                    unitsSold += item.quantity || 0;
                  }
                });
              }
            });

            // Find top selling product in this category
            const productSales = {};
            posTransactions.forEach((transaction) => {
              if (transaction.items && Array.isArray(transaction.items)) {
                transaction.items.forEach((item) => {
                  const product = products.find((p) => p.id === item.productId || p.name === item.name);
                  if (product && product.category === cat.name) {
                    productSales[product.name] = (productSales[product.name] || 0) + (item.quantity || 0);
                  }
                });
              }
            });

            const topProduct = Object.keys(productSales).length > 0
              ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
              : categoryProducts[0]?.name || "N/A";

            return {
              id: cat.id,
              name: cat.name,
              revenue: catRevenue,
              percentage: 0, // Will calculate after
              units: unitsSold,
              totalProducts: categoryProducts.length,
              growth: 0, // Calculate based on historical data if available
              topProduct: topProduct,
            };
          });

          // Calculate percentages
          const totalRev = categoryStats.reduce((sum, cat) => sum + cat.revenue, 0);
          const statsWithPercentage = categoryStats.map((cat) => ({
            ...cat,
            percentage: totalRev > 0 ? ((cat.revenue / totalRev) * 100).toFixed(1) : 0,
          }));

          setCategories(statsWithPercentage);
        } catch (error) {
          console.error("Error loading categories:", error);
        }
      }
      setLoading(false);
    }
  }, []);

  const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);
  const totalUnits = categories.reduce((sum, cat) => sum + cat.units, 0);

  const exportToCSV = () => {
    const headers = [
      "Category",
      "Revenue",
      "Percentage",
      "Units Sold",
      "Growth",
      "Top Product",
    ];
    const rows = categories.map((cat) => [
      cat.name,
      cat.revenue,
      cat.percentage,
      cat.units,
      cat.growth,
      cat.topProduct,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "category-report.csv";
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/reports")}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Revenue by Category
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Category performance breakdown
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <TrendingUp className="text-gray-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              रु{totalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Units
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Tag className="text-gray-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categories
              </span>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Tag className="text-gray-600" size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {categories.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Growth
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Top Product
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                      No category data available
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                            <Tag className="text-gray-500" size={18} />
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900 text-sm">
                        रु{cat.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getGrowthColor(
                                cat.growth
                              )}`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 text-sm">
                        {cat.units}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {cat.growth >= 0 ? (
                            <TrendingUp className="text-green-600" size={14} />
                          ) : (
                            <TrendingDown className="text-red-600" size={14} />
                          )}
                          <span
                            className={`font-semibold text-sm ${
                              cat.growth >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {cat.growth >= 0 ? "+" : ""}
                            {cat.growth}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {cat.topProduct}
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
