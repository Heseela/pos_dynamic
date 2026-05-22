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
  Clock,
  Truck,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import Pagination from "@/components/Global/pagination";

export default function PurchasePage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // Fetch purchases from API
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/purchase');
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (p.supplier?.name || '').toLowerCase().includes(searchLower) ||
      (p.id || '').toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const sortedPurchases = [...filteredPurchases].sort(
    (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)
  );

  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPurchases = sortedPurchases.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalAmount = purchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
  const pendingOrders = purchases.filter((p) => p.status === "Pending").length;

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedPurchases.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedPurchases.map((item) => item.id));
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
        fetch(`/api/purchase/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} purchase(s) deleted successfully`);
      fetchPurchases();
      setSelectedItems([]);
      setBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete purchases');
    }
  };

  const openDeleteModal = (purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!purchaseToDelete) return;
    
    try {
      const response = await fetch(`/api/purchase/${purchaseToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('Purchase order deleted successfully');
      fetchPurchases();
      setDeleteModal(false);
      setPurchaseToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete purchase');
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Supplier",
      "Total Items",
      "Total Amount",
      "Status",
    ];
    const rows = sortedPurchases.map((p) => [
      p.id,
      new Date(p.purchaseDate).toLocaleDateString(),
      p.supplier?.name || 'N/A',
      p.totalItems || 0,
      p.totalAmount,
      
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-orders-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading purchases...</p>
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
              Purchase Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sortedPurchases.length} {sortedPurchases.length === 1 ? "order" : "orders"}
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
              onClick={() => router.push("/purchase/add")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow"
            >
              <Plus size={16} />
              New Purchase Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Orders
              </span>
              <Package className="text-gray-400" size={16} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {purchases.length}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Amount
              </span>
              <span className="text-gray-400 text-base">रु</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              रु{totalAmount.toLocaleString()}
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
                placeholder="Search by supplier..."
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
                        selectedItems.length === paginatedPurchases.length &&
                        paginatedPurchases.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Purchase Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Total Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-center">
                {paginatedPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(purchase.id)}
                        onChange={() => toggleSelectItem(purchase.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Truck className="text-gray-400" size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            Order #{purchase.id?.slice(-6)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {purchase.supplier?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {purchase.totalItems || 0}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                      रु{(parseFloat(purchase.totalAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          purchase.status === "Delivered"
                            ? "bg-gray-900 text-white"
                            : purchase.status === "Pending"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {purchase.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/purchase/view/${purchase.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/purchase/edit/${purchase.id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(purchase)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {deleteModal && purchaseToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-gray-700" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete Purchase Order?
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

      {bulkDeleteModal && selectedItems.length > 0 && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete {selectedItems.length} Orders?
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