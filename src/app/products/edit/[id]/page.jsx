"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Package, Upload, X, CheckCircle, Save } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    sellingPrice: "",
    costPrice: "",
    preparationTime: "",
    avilable: "true",
  });
  const [ingredients, setIngredients] = useState([]);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/category');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/product/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      console.log('Product data:', data);
      
      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category?.id || data.category || "",
        sellingPrice: data.sellingPrice?.toString() || "",
        costPrice: data.costPrice?.toString() || "",
        preparationTime: data.preparationTime?.toString() || "",
        avilable: data.avilable === "true" || data.avilable === true ? "true" : "false",
      });
      
      // Extract image IDs from the image array of objects (same as EditPurchase)
      let imageIds = [];
      let imagePreviewData = [];
      
      if (data.image && Array.isArray(data.image)) {
        // Extract just the IDs from the image objects
        imageIds = data.image.map(img => img.id).filter(id => id !== null);
        
        // Create previews with image URLs
        imagePreviewData = data.image.map((img, index) => ({
          url: img.imageUrl,
          uploading: false,
          isExisting: true,
          id: img.id,
          tempId: `existing-${img.id}-${index}`
        }));
      }
      
      setImages(imageIds);
      setImagePreviews(imagePreviewData);
      
      // Handle ingredients
      if (data.items && data.items.length > 0) {
        const mappedIngredients = data.items.map(item => ({
          itemId: item.itemId || item.inventory?.id,
          quantity: item.quantity?.toString() || "",
          unit: item.unit || "",
        }));
        setIngredients(mappedIngredients);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchInventory();
      fetchCategories();
      fetchProduct();
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked ? "true" : "false",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return
  
    const fileArray = Array.from(files)
    setUploadingImage(true)
  
    try {
      for (const file of fileArray) {
        const previewUrl = URL.createObjectURL(file)
        const tempId = Date.now() + Math.random()
        
        setImagePreviews(prev => [...prev, { 
          url: previewUrl, 
          file, 
          uploading: true, 
          isExisting: false,
          tempId: tempId
        }])
        
        const uploadFormData = new FormData()
        uploadFormData.append('images', file)
        
        console.log('Uploading file:', file.name)
        
        const response = await fetch('/api/fileupload', {
          method: 'POST',
          credentials: "include",
          body: uploadFormData
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Upload failed:', errorText)
          throw new Error(`Upload failed: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Upload response:', result)
        
        let imageId = null
        let imageUrl = null
        
        if (result.fileupload && result.fileupload.id) {
          imageId = result.fileupload.id
          imageUrl = result.fileupload.imageUrl
          console.log('Found image ID in fileupload.id:', imageId)
        } else if (result.id) {
          imageId = result.id
          imageUrl = result.imageUrl || result.url
        } else if (result.uuid) {
          imageId = result.uuid
          imageUrl = result.imageUrl || result.url
        }
        
        if (!imageId) {
          console.error('Could not find image ID in response:', result)
          toast.error('Failed to get image ID from server')
          setImagePreviews(prev => prev.filter(img => img.tempId !== tempId))
          continue
        }
        
        console.log('✅ Image uploaded successfully with ID:', imageId)
        
        setImages(prev => [...prev, imageId])
        
        setImagePreviews(prev => 
          prev.map(img => 
            img.tempId === tempId ? { 
              ...img, 
              uploading: false, 
              id: imageId,
              url: imageUrl || previewUrl
            } : img
          )
        )
      }
      toast.success(`${fileArray.length} image(s) uploaded successfully!`)
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err.message || "Upload failed")
      setImagePreviews(prev => prev.filter(img => !img.uploading))
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = async (index) => {
    const imageToRemove = imagePreviews[index]
    
    if (imageToRemove.isExisting && imageToRemove.id) {
      try {
        console.log('Deleting file with ID:', imageToRemove.id)
        
        const response = await fetch(`/api/fileupload/${imageToRemove.id}`, {
          method: 'DELETE',
          credentials: "include"
        })
        
        if (!response.ok) {
          console.error('Failed to delete file from server:', await response.text())
        } else {
          console.log('File deleted successfully from server')
        }
      } catch (err) {
        console.error('Error deleting file:', err)
      }
    }
    
    if (imageToRemove.id) {
      setImages(prev => prev.filter(id => id !== imageToRemove.id))
    }
    
    if (imageToRemove.url && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    toast.success("Image removed")
  }

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { itemId: "", quantity: "", unit: "" },
    ]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    
    if (field === "itemId") {
      const selectedItem = inventory.find((item) => item.id === value);
      if (selectedItem) {
        updated[index] = {
          ...updated[index],
          itemId: selectedItem.id,
          unit: selectedItem.unit,
        };
      }
    } else {
      updated[index][field] = value;
    }
    
    setIngredients(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.sellingPrice || !formData.costPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    const loadingToast = toast.loading('Updating product...');
    
    try {
      // Format data according to API requirements (same as EditPurchase)
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sellingPrice: Number(formData.sellingPrice),
        costPrice: Number(formData.costPrice),
        preparationTime: Number(formData.preparationTime) || 0,
        avilable: formData.avilable,
        items: ingredients
          .filter(ing => ing.itemId && ing.quantity && ing.unit)
          .map((ing) => ({
            itemId: ing.itemId,
            quantity: Number(ing.quantity),
            unit: ing.unit,
          })),
        image: images, // Array of image ID strings
      };
      
      console.log('Updating product with ID:', productId);
      console.log('Product data:', productData);
      console.log('Image IDs:', images);
      
      const response = await fetch(`/api/product/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(productData)
      });
      
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          throw new Error(errorData.message || errorData.error || 'Failed to update product');
        } else {
          const textResponse = await response.text();
          console.error('Server error response:', textResponse);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      let responseData = null;
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('Update successful:', responseData);
      }
      
      toast.success('Product updated successfully!', { id: loadingToast });
      setTimeout(() => router.push('/products'), 1500);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/products")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Product
            </h1>
            <p className="text-gray-500 mt-1">Update product details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  placeholder="Brief description of the product"
                />
              </div>

              {/* Image Upload Section - Same as EditPurchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviews.map((img, idx) => (
                      <div key={img.tempId || idx} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img
                            src={img.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', img.url)
                              e.target.src = 'https://via.placeholder.com/200?text=No+Image'
                            }}
                          />
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {!img.uploading && img.id && (
                            <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle size={12} />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className={`border-2 border-dashed rounded-lg p-6 block text-center cursor-pointer hover:border-gray-900 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploadingImage}
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload product images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                </label>
                {uploadingImage && <p className="text-sm text-blue-600 mt-2">Uploading images...</p>}
                {images.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">{images.length} image(s) attached</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={formData.preparationTime}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="15"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price (रु) *
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (रु) *
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="450"
                />
              </div>
            </div>

            {formData.sellingPrice && formData.costPrice && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700 font-medium">
                    Profit Margin:
                  </span>
                  <span className="text-green-900 font-semibold">
                    रु{(Number(formData.sellingPrice) - Number(formData.costPrice)).toFixed(2)} (
                    {(
                      ((Number(formData.sellingPrice) - Number(formData.costPrice)) /
                        Number(formData.sellingPrice)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recipe Ingredients
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Optional - add ingredients for inventory tracking</p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm">No ingredients added yet</p>
                <p className="text-xs mt-1">
                  Click "Add Ingredient" to start building your recipe (optional)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Inventory Item *
                        </label>
                        <select
                          value={ingredient.itemId}
                          onChange={(e) =>
                            handleIngredientChange(index, "itemId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          <option value="">Select item</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.stock} {item.unit} available)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Quantity *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={ingredient.quantity}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            min="0"
                            step="0.01"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            placeholder="0.5"
                          />
                          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 min-w-[10vh] flex items-center justify-center">
                            {ingredient.unit || "unit"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove ingredient"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Availability
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="avilable"
                checked={formData.avilable === "true"}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Mark as available
                </span>
                <p className="text-xs text-gray-500">
                  This product will be visible and orderable
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Update Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}