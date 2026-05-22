"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';
import Pagination from "@/components/Global/pagination";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    availability: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/product');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      
      const uniqueCategories = [...new Set(data.map(product => product.category?.name).filter(cat => cat))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, []);

  const checkInventoryAvailability = (product) => {
    if (!product.items || product.items.length === 0) {
      return { canMake: true, missingIngredients: [] };
    }

    const missingIngredients = [];

    for (const item of product.items) {
      const inventoryItem = inventory.find(
        (invItem) => invItem.id === item.inventory?.id || invItem.id === item.itemId
      );

      if (!inventoryItem) {
        missingIngredients.push({
          name: item.inventory?.name || 'Unknown Item',
          reason: "Not in inventory",
        });
      } else if (parseFloat(inventoryItem.stock) < item.quantity) {
        missingIngredients.push({
          name: inventoryItem.name,
          reason: `Low stock (${inventoryItem.stock} ${inventoryItem.unit} available, need ${item.quantity} ${item.unit})`,
        });
      }
    }

    return {
      canMake: missingIngredients.length === 0,
      missingIngredients,
    };
  };

  const productsWithInventoryStatus = products.map((product) => {
    const inventoryCheck = checkInventoryAvailability(product);
    return {
      ...product,
      inventoryAvailable: inventoryCheck.canMake,
      missingIngredients: inventoryCheck.missingIngredients,
    };
  });

  const totalProducts = products.length;
  const availableProducts = productsWithInventoryStatus.filter(
    (p) => p.avilable === "true" && p.inventoryAvailable
  ).length;
  const avgProfit = products.length > 0
    ? products.reduce((sum, p) => sum + (p.sellingPrice - p.costPrice), 0) / products.length
    : 0;

  // Filter products
  const filteredProducts = productsWithInventoryStatus.filter((product) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.name?.toLowerCase().includes(searchLower);

    const matchesCategory =
      filters.category === "all" || product.category?.name === filters.category;

    const matchesAvailability =
      filters.availability === "all" ||
      (filters.availability === "available" &&
        product.avilable === "true" &&
        product.inventoryAvailable) ||
      (filters.availability === "unavailable" &&
        (product.avilable !== "true" || !product.inventoryAvailable));

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Pagination - Same as purchase page
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const categoryList = ["all", ...categories];

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((product) => product.id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedProducts.map(id =>
        fetch(`/api/product/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedProducts.length} product(s) deleted successfully`);
      fetchProducts();
      setSelectedProducts([]);
      setBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete products');
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const response = await fetch(`/api/product/${productToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('Product deleted successfully');
      fetchProducts();
      setDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete product');
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Category",
      "Selling Price",
      "Cost Price",
      "Profit",
      "Available",
      "Inventory Status",
      "Prep Time",
    ];
    const rows = filteredProducts.map((product) => [
      product.id,
      product.name,
      product.category?.name || 'N/A',
      product.sellingPrice,
      product.costPrice,
      product.sellingPrice - product.costPrice,
      product.avilable === "true" ? "Yes" : "No",
      product.inventoryAvailable ? "In Stock" : "Out of Stock",
      `${product.preparationTime} min`,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getProfitMargin = (sellingPrice, costPrice) => {
    if (!sellingPrice || !costPrice) return '0';
    return (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={() => router.push("/products/add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow"
            >
              Add Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Products
              </span>
              <ShoppingBag className="text-gray-400" size={16} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {totalProducts}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Available
              </span>
              <TrendingUp className="text-green-500" size={16} />
            </div>
            <div className="text-2xl font-semibold text-green-600">
              {availableProducts}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              With ingredients in stock
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Profit
              </span>
              <span className="text-gray-400 text-base">रु</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              रु{avgProfit.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete ({selectedProducts.length})
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => {
                    setFilters({ ...filters, category: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => {
                    setFilters({ ...filters, availability: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === paginatedProducts.length &&
                        paginatedProducts.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Selling Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Cost Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Profit Margin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((product) => {
                  const isFullyAvailable =
                    product.avilable === "true" && product.inventoryAvailable;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="rounded border-gray-300"
                        />
                       </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                       </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                        रु{product.sellingPrice}
                       </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                        रु{product.costPrice}
                       </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-green-600">
                          {getProfitMargin(product.sellingPrice, product.costPrice)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          +रु{product.sellingPrice - product.costPrice}
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium w-fit ${
                              isFullyAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isFullyAvailable ? "Available" : "Unavailable"}
                          </span>
                          {!product.inventoryAvailable &&
                            product.missingIngredients.length > 0 && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {product.missingIngredients.length} missing
                              </span>
                            )}
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              router.push(`/products/view/${product.id}`)
                            }
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/products/edit/${product.id}`)
                            }
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showItemsPerPage={true}
          />
        </div>
      </div>

      {deleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-gray-700" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete Product?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteModal && selectedProducts.length > 0 && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete {selectedProducts.length} Orders?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}