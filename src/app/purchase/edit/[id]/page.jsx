'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function EditPurchasePage() {
  const router = useRouter()
  const params = useParams()
  const purchaseId = params.id
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [items, setItems] = useState('')
  const [totalAmount, setTotalAmount] = useState('0')
  const [totalItems, setTotalItems] = useState('0')
  const [images, setImages] = useState([]) 
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suppliers
        const suppliersRes = await fetch('/api/suppliers')
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json()
          setSuppliers(suppliersData)
        }
        
        // Fetch purchase details
        const purchaseRes = await fetch(`/api/purchase/${purchaseId}`)
        if (!purchaseRes.ok) throw new Error('Failed to fetch purchase')
        
        const purchaseData = await purchaseRes.json()
        console.log('Purchase data:', purchaseData)
        
        // Extract supplier ID from the supplier object
        const supplierId = purchaseData.supplier?.id || purchaseData.supplier
        setSelectedSupplier(supplierId)
        setPurchaseDate(purchaseData.purchaseDate?.split('T')[0] || '')
        
        // Handle items - if it's an object, convert to string
        let itemsString = purchaseData.items || ''
        if (typeof itemsString === 'object') {
          itemsString = JSON.stringify(itemsString)
        }
        setItems(itemsString)
        
        setStatus(purchaseData.status || 'pending')
        setTotalItems(purchaseData.totalItems?.toString() || '0')
        setTotalAmount(purchaseData.totalAmount?.toString() || '0')
        
        // Extract image IDs from the image array of objects
        let imageIds = []
        let imagePreviewData = []
        
        if (purchaseData.image && Array.isArray(purchaseData.image)) {
          // Extract just the IDs from the image objects
          imageIds = purchaseData.image.map(img => img.id).filter(id => id !== null)
          
          // Create previews with image URLs
          imagePreviewData = purchaseData.image.map((img, index) => ({
            url: img.imageUrl,
            uploading: false,
            isExisting: true,
            id: img.id,
            tempId: `existing-${img.id}-${index}`
          }))
        }
        
        setImages(imageIds) // Store only the IDs
        setImagePreviews(imagePreviewData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load purchase details')
        router.push('/purchase')
      } finally {
        setLoading(false)
      }
    }
    
    if (purchaseId) {
      fetchData()
    }
  }, [purchaseId, router])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }
    
    if (!items) {
      toast.error('Please enter items')
      return
    }
    
    setSubmitting(true)
    const loadingToast = toast.loading('Updating purchase order...')
    
    try {
      // Format data according to API requirements
      const purchaseData = {
        supplier: selectedSupplier, // Just the supplier ID as string
        purchaseDate: purchaseDate,
        totalAmount: totalAmount,
        totalItems: totalItems,
        items: items, // This should be a string (comma-separated list)
        image: images, // Array of image ID strings
        status: status
      }
      
      console.log('Updating purchase with data:', purchaseData)
      console.log('Supplier ID:', selectedSupplier)
      console.log('Items string:', items)
      console.log('Image IDs:', images)
      
      const response = await fetch(`/api/purchase/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(purchaseData)
      })
      
      const contentType = response.headers.get('content-type')
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          console.error('Server error:', errorData)
          throw new Error(errorData.message || errorData.error || 'Failed to update purchase')
        } else {
          const textResponse = await response.text()
          console.error('Server error response:', textResponse)
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
      }
      
      let responseData = null
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
        console.log('Update successful:', responseData)
      }
      
      toast.success('Purchase order updated successfully!', { id: loadingToast })
      setTimeout(() => router.push(`/purchase/view/${purchaseId}`), 1500)
    } catch (error) {
      console.error('Error updating purchase:', error)
      toast.error(error.message || 'Failed to update purchase', { id: loadingToast })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading purchase details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push(`/purchase/view/${purchaseId}`)}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Purchase Order</h1>
              <p className="text-sm text-gray-500 mt-0.5">Update purchase order details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id || supplier._id} value={supplier.id || supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items (comma-separated) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  required
                  rows={4}
                  placeholder="Enter items as comma-separated list, e.g., Item 1, Item 2, Item 3"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple items with commas</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Items
                  </label>
                  <input
                    type="text"
                    value={totalItems}
                    onChange={(e) => setTotalItems(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (रु)
                  </label>
                  <input
                    type="text"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documents & Images
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
                  <p className="text-sm text-gray-600">Click to upload new images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                </label>
                {uploadingImage && <p className="text-sm text-blue-600 mt-2">Uploading images...</p>}
                {images.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">{images.length} file(s) attached</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/purchase/view/${purchaseId}`)}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}