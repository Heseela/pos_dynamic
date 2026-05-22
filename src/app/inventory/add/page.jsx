'use client'

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function AddInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "",
    stock: "",
    currentPrice: "",
    oldPrice: "",
    reorderLevel: "",
  });

  useEffect(() => {
   
    const fetchCategories = async () => {
  try {

    const response = await fetch('/api/category')

    if (response.ok) {

      const data = await response.json()

      console.log("CATEGORY DATA:", data)

      if (Array.isArray(data)) {

        const categories = data.map(item => ({
          id: item.id,
          name: item.name,
        }))

        setCategoriesList(categories)
      }
    }

  } catch (error) {

    console.error('Error fetching categories:', error)

  }
}
    fetchCategories();
  }, []);

  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "gram", label: "Grams (g)" },
    { value: "liters", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "box", label: "Box" },
    { value: "pack", label: "Pack" },
    { value: "dozen", label: "Dozen" },
    { value: "bottle", label: "Bottle" },
    { value: "bag", label: "Bag" },
    { value: "carton", label: "Carton" },
    { value: "case", label: "Case" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.unit || !formData.stock || !formData.currentPrice || !formData.reorderLevel) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Adding inventory item...');
    
    try {
      const inventoryData = {
        name: formData.name,
        category: formData.category, 
        unit: formData.unit,
        stock: formData.stock.toString(),
        currentPrice: formData.currentPrice.toString(),
        oldPrice: formData.oldPrice ? formData.oldPrice.toString() : formData.currentPrice.toString(),
        reorderLevel: formData.reorderLevel.toString(),
      };
      
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item');
      }
      
      toast.success('Inventory item added successfully!', { id: loadingToast });
      setTimeout(() => router.push('/inventory'), 1500);
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item', { id: loadingToast });
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
            onClick={() => router.push("/inventory")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add Inventory Item
            </h1>
            <p className="text-gray-500 mt-1">
              Add a new raw ingredient or supply
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Onion, Tomato Sauce, Mozzarella Cheese"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select unit</option>
                  {unitOptions.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantity in {formData.unit || "unit"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>

            <div className="flex w-full gap-3">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price (रु) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="120"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Price per {formData.unit || "unit"}
                </p>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Old Price (रु)
                </label>
                <input
                  type="number"
                  name="oldPrice"
                  value={formData.oldPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Previous price (optional)
                </p>
              </div>
            </div>
            
            {formData.stock && formData.currentPrice && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">
                    Total Inventory Value:
                  </span>
                  <span className="text-blue-900 font-semibold text-lg">
                    रु
                    {(
                      parseFloat(formData.stock) * parseFloat(formData.currentPrice)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/inventory")}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Item"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}