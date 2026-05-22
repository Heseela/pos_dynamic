'use client'

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import Pagination from "@/components/Global/pagination";

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      
      const data = await response.json();
      setInventory(data);
      
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(cat => cat && cat !== ""))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower);
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = sortedInventory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(
    (item) => parseFloat(item.stock) < parseFloat(item.reorderLevel)
  ).length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + (parseFloat(item.stock || 0) * parseFloat(item.currentPrice || 0)),
    0
  );
  const totalStock = inventory.reduce((sum, item) => sum + parseFloat(item.stock || 0), 0);

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedInventory.map((item) =>item.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedItems.map(id =>
        fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} item(s) deleted successfully`);
      fetchInventory();
      setSelectedItems([]);
      setBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete items');
    }
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const itemId =itemToDelete.id;
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('Item deleted successfully');
      fetchInventory();
      setDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete item');
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Item Name",
      "Category",
      "Unit",
      "Stock",
      "Current Price",
      "Old Price",
      "Reorder Level",
      "Total Value",
    ];
    const rows = sortedInventory.map((item) => [
      item.id,
      item.name,
      item.category || 'N/A',
      item.unit,
      item.stock,
      item.currentPrice,
      item.oldPrice || 'N/A',
      item.reorderLevel,
      (parseFloat(item.stock || 0) * parseFloat(item.currentPrice || 0)).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStockStatus = (stock, reorderLevel) => {
    const stockNum = parseFloat(stock);
    const reorderNum = parseFloat(reorderLevel);
    if (stockNum < reorderNum) {
      return { text: "Low Stock", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    } else if (stockNum < reorderNum * 2) {
      return { text: "Medium Stock", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    } else {
      return { text: "Good Stock", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading inventory...</p>
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sortedInventory.length} {sortedInventory.length === 1 ? "item" : "items"}
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
              onClick={() => router.push("/inventory/add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Items
              </span>
              <Package className="text-gray-400" size={16} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {totalItems}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Low Stock
              </span>
              <AlertTriangle className="text-red-500" size={16} />
            </div>
            <div className="text-2xl font-semibold text-red-600">
              {lowStockItems}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Units
              </span>
              <TrendingUp className="text-gray-400" size={16} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {totalStock}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Value
              </span>
              <span className="text-gray-400 text-base">रु</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              रु{totalValue.toLocaleString()}
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
                placeholder="Search by item name or category..."
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
            {selectedItems.length > 0 && (
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete ({selectedItems.length})
              </button>
            )}
          </div>

          {showFilters && categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                        selectedItems.length === paginatedInventory.length &&
                        paginatedInventory.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Current Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Value
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
                {paginatedInventory.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.reorderLevel);
                  const itemId = item.id;
                  return (
                    <tr
                      key={itemId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(itemId)}
                          onChange={() => toggleSelectItem(itemId)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="text-gray-400" size={18} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {item?.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                        रु{item.currentPrice}/{item.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                        रु{(parseFloat(item.stock || 0) * parseFloat(item.currentPrice || 0)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/inventory/view/${itemId}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/inventory/edit/${itemId}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
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

      {deleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-gray-700" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete Item?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{itemToDelete.name}</span>?
            </p>
            <p className="text-center text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteModal && selectedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete {selectedItems.length} {selectedItems.length === 1 ? "Item" : "Items"}?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-6">
              Are you sure you want to delete {selectedItems.length} selected{" "}
              {selectedItems.length === 1 ? "item" : "items"}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                Delete {selectedItems.length > 1 && `(${selectedItems.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}