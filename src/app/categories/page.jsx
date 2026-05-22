'use client'

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Package,
  ShoppingBag,
  BookOpen,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("inventory");

  // Map API type to display type
  const mapApiTypeToDisplayType = (apiType) => {
    const typeStr = apiType || '';
    if (typeStr.toLowerCase().includes('inventory')) return 'inventory';
    if (typeStr.toLowerCase().includes('products')) return 'products';
    if (typeStr.toLowerCase().includes('ledger')) return 'ledger';
    return 'inventory'; // default
  };

  // Map display type to API type
  const mapDisplayTypeToApiType = (displayType) => {
    if (displayType === 'inventory') return 'inventory';
    if (displayType === 'products') return 'products';
    if (displayType === 'ledger') return 'ledger';
    return 'inventory';
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/category');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      
      // Transform API data to include mapped type
      const transformedCategories = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        originalType: item.type,
        type: mapApiTypeToDisplayType(item.type),
        createdAt: item.createdat,
      }));
      
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by active tab
  const filteredCategories = categories.filter(cat => cat.type === activeTab);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      const apiType = mapDisplayTypeToApiType(categoryType);
      
      const newCategory = {
        name: categoryName.trim(),
        type: apiType,
      };

      const response = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      const result = await response.json();
      
      setCategories(prev => [...prev, { 
        id: result.id || Date.now(), 
        name: categoryName.trim(), 
        type: categoryType,
        originalType: apiType,
      }]);

      toast.success('Category added successfully');
      setCategoryName("");
      setAddModal(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) return;

    try {
      const apiType = mapDisplayTypeToApiType(selectedCategory.type);
      
      const updatedCategory = {
        name: categoryName.trim(),
        type: apiType,
      };

      const response = await fetch(`/api/category/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories(prev => prev.map(cat =>
        cat.id === selectedCategory.id
          ? { ...cat, name: categoryName.trim() }
          : cat
      ));

      toast.success('Category updated successfully');
      setCategoryName("");
      setSelectedCategory(null);
      setEditModal(false);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await fetch(`/api/category/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(prev => prev.filter(cat => cat.id !== selectedCategory.id));

      toast.success('Category deleted successfully');
      setSelectedCategory(null);
      setDeleteModal(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setEditModal(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setDeleteModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading categories...</p>
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
            <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage inventory, product, and ledger categories
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex gap-1">
          <button
            onClick={() => {
              setActiveTab("inventory");
              setCategoryType("inventory");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "inventory"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Package size={16} />
            Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab("products");
              setCategoryType("products");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "products"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ShoppingBag size={16} />
            Products
          </button>
          <button
            onClick={() => {
              setActiveTab("ledger");
              setCategoryType("ledger");
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ledger"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen size={16} />
            Ledger
          </button>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Tag className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Categories Found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first category
            </p>
            {/* <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Category
            </button> */}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Tag className="text-gray-600" size={18} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 capitalize">
                  {category.type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Category to {activeTab === "inventory" ? "Inventory" : activeTab === "products" ? "Products" : "Ledger"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type
              </label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-4"
              >
                <option value="inventory">Inventory</option>
                <option value="products">Products</option>
                <option value="ledger">Ledger</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Vegetables, Pizza, Revenue"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAddModal(false);
                  setCategoryName("");
                }}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!categoryName.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Category
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type
              </label>
              <select
                value={selectedCategory.type}
                onChange={(e) => setSelectedCategory({ ...selectedCategory, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-4"
              >
                <option value="inventory">Inventory</option>
                <option value="products">Products</option>
                <option value="ledger">Ledger</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleEditCategory();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditModal(false);
                  setCategoryName("");
                  setSelectedCategory(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                disabled={!categoryName.trim()}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Delete Category?
            </h3>
            <p className="text-center text-gray-600 text-sm mb-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {selectedCategory.name}
              </span>
              ?
            </p>
            <p className="text-center text-gray-600 text-sm mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setSelectedCategory(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}