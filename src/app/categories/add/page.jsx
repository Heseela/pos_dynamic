'use client'

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, Package, ShoppingBag, BookOpen } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function AddCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "inventory",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Adding category...');

    try {
      // Map display type to API type
      let apiType = formData.type;
      if (formData.type === 'inventory') apiType = 'inventory';
      else if (formData.type === 'products') apiType = 'products';
      else if (formData.type === 'ledger') apiType = 'ledger';
      
      const categoryData = {
        name: formData.name.trim(),
        type: apiType,
      };

      const response = await fetch('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add category');
      }

      toast.success('Category added successfully!', { id: loadingToast });
      setTimeout(() => router.push('/categories'), 1500);
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Failed to add category', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/categories")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add Category
            </h1>
            <p className="text-gray-500 mt-1">
              Create a new category for inventory, products, or ledger
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "inventory" })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    formData.type === "inventory"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.type === "inventory"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">
                      Inventory
                    </p>
                    <p className="text-xs text-gray-500">
                      Raw ingredients
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "products" })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    formData.type === "products"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.type === "products"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <ShoppingBag size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">
                      Products
                    </p>
                    <p className="text-xs text-gray-500">
                      Menu items
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "ledger" })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    formData.type === "ledger"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.type === "ledger"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm">
                      Ledger
                    </p>
                    <p className="text-xs text-gray-500">
                      Accounts & transactions
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Vegetables, Pizza, Revenue"
              />
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <Tag className="text-gray-600" size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Category Preview
                  </h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">
                      {formData.name || "Category Name"}
                    </span>
                    {" will be added to "}
                    <span className="font-medium">
                      {formData.type === "inventory" ? "Inventory" : formData.type === "products" ? "Products" : "Ledger"}
                    </span>
                    {" categories"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/categories")}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Category"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}