"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const allProducts = [
    {
      id: 1,
      name: "Product A",
      sku: "SKU001",
      sold: 145,
      revenue: 50000,
      stock: 45,
      category: "Electronics",
    },
    {
      id: 2,
      name: "Product C",
      sku: "SKU003",
      sold: 98,
      revenue: 35000,
      stock: 23,
      category: "Food",
    },
    {
      id: 3,
      name: "Product D",
      sku: "SKU004",
      sold: 76,
      revenue: 28000,
      stock: 12,
      category: "Electronics",
    },
    {
      id: 4,
      name: "Product B",
      sku: "SKU002",
      sold: 64,
      revenue: 22000,
      stock: 67,
      category: "Clothing",
    },
    {
      id: 5,
      name: "Product E",
      sku: "SKU005",
      sold: 52,
      revenue: 18000,
      stock: 8,
      category: "Food",
    },
    {
      id: 6,
      name: "Product F",
      sku: "SKU006",
      sold: 48,
      revenue: 16000,
      stock: 34,
      category: "Electronics",
    },
    {
      id: 7,
      name: "Product G",
      sku: "SKU007",
      sold: 42,
      revenue: 14500,
      stock: 56,
      category: "Clothing",
    },
    {
      id: 8,
      name: "Product H",
      sku: "SKU008",
      sold: 38,
      revenue: 12800,
      stock: 19,
      category: "Food",
    },
    {
      id: 9,
      name: "Product I",
      sku: "SKU009",
      sold: 35,
      revenue: 11200,
      stock: 41,
      category: "Electronics",
    },
    {
      id: 10,
      name: "Product J",
      sku: "SKU010",
      sold: 31,
      revenue: 9800,
      stock: 28,
      category: "Clothing",
    },
  ];

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Product",
      "SKU",
      "Category",
      "Units Sold",
      "Revenue",
      "Stock",
    ];
    const rows = filteredProducts.map((p, idx) => [
      idx + 1,
      p.name,
      p.sku,
      p.category,
      p.sold,
      p.revenue,
      p.stock,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "top-products-report.csv";
    link.click();
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
                Top Selling Products
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-linear-to-b from-gray-50 to-white">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product, index) => {
                  const globalRank = startIndex + index + 1;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                          {globalRank}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                            <Package className="text-gray-500" size={18} />
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 font-mono">
                        {product.sku}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900 text-sm">
                        {product.sold}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 text-sm">
                        रु{product.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-gray-600">
                        {product.stock} units
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-4 py-3.5 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredProducts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
