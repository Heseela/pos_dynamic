"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ViewSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;

  const [supplier, setSupplier] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(`/api/suppliers/${supplierId}`);
        if (!response.ok) throw new Error('Failed to fetch supplier');
        const data = await response.json();
        setSupplier(data);
        
        if (data.image && data.image.length > 0) {
          const urls = data.image.map((imageId) => {
            if (typeof imageId === 'object' && imageId !== null) {
              return imageId.imageUrl || `${process.env.NEXT_PUBLIC_LOGIN_API_URL}/fileupload/${imageId.id}`;
            }
            return `${process.env.NEXT_PUBLIC_LOGIN_API_URL}/fileupload/${imageId}`;
          });
          setImageUrls(urls);
        }
      } catch (error) {
        console.error('Error fetching supplier:', error);
        toast.error('Failed to load supplier');
        router.push('/suppliers');
      } finally {
        setLoading(false);
      }
    };
  
    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, router]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('Supplier deleted successfully');
      router.push('/suppliers');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete supplier');
    }
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head", "accountant"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading supplier...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!supplier) return null;

  const totalAmount = parseFloat(supplier.totalamount || 0);
  const paidAmount = parseFloat(supplier.paid || 0);
  const dueAmount = parseFloat(supplier.credit || 0);
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  
  const getPaymentStatus = () => {
    if (dueAmount <= 0) return { status: "Settled", color: "text-green-600 bg-green-50", icon: CheckCircle };
    if (dueAmount < totalAmount / 2) return { status: "Partially Paid", color: "text-yellow-600 bg-yellow-50", icon: AlertCircle };
    return { status: "Outstanding", color: "text-red-600 bg-red-50", icon: AlertCircle };
  };
  
  const paymentStatus = getPaymentStatus();
  const StatusIcon = paymentStatus.icon;

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head", "accountant"]}>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/suppliers")}
                className="p-2 hover:bg-white rounded-lg transition-all"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{supplier.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">Supplier Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/suppliers/edit/${supplier.id}`)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">रु {totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">रु {paidAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Due Amount</p>
              <p className="text-2xl font-bold text-amber-600">रु {dueAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={16} /> Basic Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Supplier Name</p>
                    <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PAN / VAT</p>
                    <p className="text-sm font-mono text-gray-900">{supplier.panvat || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">{supplier.location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="text-sm text-gray-900">{supplier.contact || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Banking Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Bank Name</p>
                    <p className="text-sm text-gray-900">{supplier.bankname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account Number</p>
                    <p className="text-sm font-mono text-gray-900">{supplier.accountNo || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon size={16} /> Attached Documents
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
                          alt={`Document ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ImageIcon className="text-gray-400" size={24} />
                    </div>
                    <p className="text-sm text-gray-500">No documents uploaded</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.color}`}>
                      <StatusIcon size={14} /> {paymentStatus.status}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Payment Progress</span>
                      <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Bill</span>
                      <span className="font-semibold">रु {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Total Paid</span>
                      <span className="font-semibold text-green-600">रु {paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Remaining Due</span>
                      <span className="font-semibold text-amber-600">रु {dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {lightboxOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
            <div className="relative max-w-4xl w-full max-h-[90vh]">
              <img
                src={imageUrls[selectedImageIndex]}
                alt="Document"
                className="w-full h-full object-contain"
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                Delete Supplier?
              </h3>
              <p className="text-center text-gray-600 text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold">{supplier.name}</span>? This action cannot be undone.
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