"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Edit, Trash2, Package, Tag, 
  DollarSign, Clock, ImageIcon, X, ChevronLeft, ChevronRight 
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function ViewProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/product/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      setProduct(data);
      
      if (data.image && data.image.length > 0) {
        const urls = data.image.map((img) => {
          if (typeof img === 'object' && img !== null) {
            return img.imageUrl || `${process.env.NEXT_PUBLIC_LOGIN_API_URL}/fileupload/${img.id}`;
          }
          return `${process.env.NEXT_PUBLIC_LOGIN_API_URL}/fileupload/${img}`;
        });
        setImageUrls(urls);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/product/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete product');
    }
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!product) return null;

  const isAvailable = product.avilable === "true" || product.available === "true";
  const profit = (product.sellingPrice || 0) - (product.costPrice || 0);
  const profitMargin = product.sellingPrice > 0 ? ((profit / product.sellingPrice) * 100).toFixed(1) : 0;

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/products")}
                className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
              >
                <ArrowLeft className="text-gray-600" size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">Product Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/products/edit/${product.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                <Edit size={16} /> Edit
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-10 border-b border-gray-200 bg-linear-to-br from-gray-50 to-white">
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Selling Price
                </p>
                <div className="inline-flex items-baseline gap-1">
                  <h2 className="text-5xl font-bold text-gray-900">
                    रु{(product.sellingPrice || 0).toLocaleString()}
                  </h2>
                </div>
                {product.costPrice > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Cost: रु{(product.costPrice || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-end">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isAvailable 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isAvailable ? '✓ Available' : '✗ Unavailable'}
                </span>
              </div>

              {/* Product Images Section */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon size={16} /> Product Images
                </h2>
                {imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageUrls.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="text-gray-400" size={24} />
                    </div>
                    <p className="text-sm text-gray-500">No images uploaded</p>
                  </div>
                )}
              </div>

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <Package className="text-gray-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {product.category?.name || product.category || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <Clock className="text-gray-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Preparation Time
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {product.preparationTime || 0} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Pricing Details Section */}
              <div className="bg-linear-to-r from-blue-50 to-purple-50 p-5 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} /> Pricing Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Selling Price</p>
                    <p className="text-xl font-bold text-blue-600">रु{product.sellingPrice?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cost Price</p>
                    <p className="text-xl font-bold text-red-600">रु{product.costPrice?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profit</p>
                    <p className="text-xl font-bold text-green-600">रु{profit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profit Margin</p>
                    <p className="text-xl font-bold text-purple-600">{profitMargin}%</p>
                  </div>
                </div>
              </div>

              {/* Ingredients Section */}
              {product.items && product.items.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Ingredients / Items
                  </p>
                  <div className="space-y-2">
                    {product.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{item.inventory?.name || item.name || 'Ingredient'}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.quantity} {item.unit || 'pcs'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {lightboxOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors z-10"
            >
              <X size={24} />
            </button>
            
            <div className="relative max-w-5xl w-full max-h-[90vh]">
              <img
                src={imageUrls[selectedImageIndex]}
                alt={`Product ${selectedImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                Delete Product?
              </h3>
              <p className="text-center text-gray-600 text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold">{product.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}