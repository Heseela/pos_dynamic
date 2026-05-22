'use client'

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryType = params.type;
  const categoryId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: categoryType,
  });

  // Map API type to display type
  const mapApiTypeToDisplayType = (apiType) => {
    const typeStr = apiType || '';
    if (typeStr.toLowerCase().includes('inventory')) return 'inventory';
    if (typeStr.toLowerCase().includes('product')) return 'products';
    if (typeStr.toLowerCase().includes('ledger')) return 'ledger';
    return 'inventory';
  };

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch('/api/category');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        
        // Find the specific category
        const foundCategory = data.find(item => item.id === categoryId);
        
        if (foundCategory) {
          setFormData({
            name: foundCategory.name,
            type: mapApiTypeToDisplayType(foundCategory.type),
          });
        } else {
          toast.error('Category not found');
          router.push('/categories');
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        toast.error('Failed to load category');
        router.push('/categories');
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId, router]);

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

    setSubmitting(true);
    const loadingToast = toast.loading('Updating category...');

    try {
      // Map display type to API type
      let apiType = formData.type;
      if (formData.type === 'inventory') apiType = 'inventory';
      else if (formData.type === 'products') apiType = 'products';
      else if (formData.type === 'ledger') apiType = 'ledger';
      
      const updatedCategory = {
        name: formData.name.trim(),
        type: apiType,
      };

      const response = await fetch(`/api/category/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update category');
      }

      toast.success('Category updated successfully!', { id: loadingToast });
      setTimeout(() => router.push('/categories'), 1500);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading category details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
              Edit Category
            </h1>
            <p className="text-gray-500 mt-1">
              Update category details
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="inventory">Inventory</option>
                <option value="products">Products</option>
                <option value="ledger">Ledger</option>
              </select>
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

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <Tag className="text-blue-600" size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Update Information
                  </h4>
                  <p className="text-sm text-blue-700">
                    Updating this category will affect all items using it.
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
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Category"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}