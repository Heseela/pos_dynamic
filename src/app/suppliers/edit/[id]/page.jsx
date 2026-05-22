'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, X, Upload, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params.id
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    panvat: '',
    contact: '',
    totalamount: '0',
    paid: '0',
    credit: '0',
    accountNo: '',
    bankname: '',
  })
  
  const [images, setImages] = useState([]) 
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        console.log('Fetching supplier with ID:', supplierId)
        const response = await fetch(`/api/suppliers/${supplierId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const supplier = await response.json()
        console.log('Supplier data:', supplier)
        
        setFormData({
          name: supplier.name || '',
          location: supplier.location || '',
          panvat: supplier.panvat || '',
          contact: supplier.contact || '',
          totalamount: supplier.totalamount ? supplier.totalamount.toString() : '0',
          paid: supplier.paid ? supplier.paid.toString() : '0',
          credit: supplier.credit ? supplier.credit.toString() : '0',
          accountNo: supplier.accountNo || '',
          bankname: supplier.bankname || '',
        })
        
        let imageIds = []
        let imagePreviewData = []
        
        if (supplier.image && Array.isArray(supplier.image)) {
          imageIds = supplier.image.map(img => img.id)
          imagePreviewData = supplier.image.map((img, index) => ({
            url: img.imageUrl,
            uploading: false,
            isExisting: true,
            id: img.id,
            tempId: `existing-${img.id}-${index}`
          }))
        }
        
        setImages(imageIds) 
        setImagePreviews(imagePreviewData)
      } catch (error) {
        console.error('Error fetching supplier:', error)
        toast.error(error.message || 'Failed to load supplier')
        router.push('/suppliers')
      } finally {
        setLoading(false)
      }
    }
  
    if (supplierId) {
      fetchSupplier()
    }
  }, [supplierId, router])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'totalamount' || name === 'paid') {
      const total = name === 'totalamount' ? parseFloat(value) : parseFloat(formData.totalamount)
      const paid = name === 'paid' ? parseFloat(value) : parseFloat(formData.paid)
      if (!isNaN(total) && !isNaN(paid)) {
        const creditValue = (total - paid).toString()
        setFormData(prev => ({ ...prev, credit: creditValue }))
      }
    }
  }

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
        }
        else if (result.id) {
          imageId = result.id
          imageUrl = result.imageUrl || result.url
        } else if (result.uuid) {
          imageId = result.uuid
          imageUrl = result.imageUrl || result.url
        } else if (result.data && result.data.id) {
          imageId = result.data.id
          imageUrl = result.data.imageUrl || result.data.url
        }
        
        if (!imageId) {
          console.error('Could not find image ID in response:', result)
          toast.error('Failed to get image ID from server')
          setImagePreviews(prev => prev.filter(img => img.tempId !== tempId))
          continue
        }
        console.log('✅ Image uploaded successfully with ID:', imageId)
        console.log('Image URL:', imageUrl)
        
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
    if (!formData.name || !formData.contact) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    const loadingToast = toast.loading('Updating supplier...')
    
    try {
      const updatedSupplier = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        panvat: formData.panvat.trim(),
        contact: formData.contact.trim(),
        totalamount: formData.totalamount || '0',
        paid: formData.paid || '0',
        credit: formData.credit || '0',
        accountNo: formData.accountNo.trim(),
        bankname: formData.bankname.trim(),
        image: images
      }
      
      console.log('Updating supplier with data:', updatedSupplier)
      console.log('Image IDs to send:', images)
      
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify(updatedSupplier)
      })
      const contentType = response.headers.get('content-type')
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          console.error('Server error:', errorData)
          throw new Error(errorData.message || errorData.error || 'Failed to update supplier')
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
      
      toast.success('Supplier updated successfully!', { id: loadingToast })
      setTimeout(() => router.push(`/suppliers/view/${supplierId}`), 1500)
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error(error.message || 'Failed to update supplier', { id: loadingToast })
    } finally {
      setSubmitting(false)
    }
  }
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'branch_head', 'accountant']}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading supplier...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head', 'accountant']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <Toaster position="top-right" />
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.push(`/suppliers/view/${supplierId}`)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Supplier</h1>
              <p className="text-sm text-gray-500 mt-0.5">Update supplier information</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN / VAT</label>
                  <input 
                    type="text" 
                    name="panvat" 
                    value={formData.panvat} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    name="contact" 
                    value={formData.contact} 
                    onChange={handleChange} 
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    name="bankname" 
                    value={formData.bankname} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input 
                    type="text" 
                    name="accountNo" 
                    value={formData.accountNo} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (रु)</label>
                  <input 
                    type="number" 
                    name="totalamount" 
                    value={formData.totalamount} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (रु)</label>
                  <input 
                    type="number" 
                    name="paid" 
                    value={formData.paid} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit / Due</label>
                  <input 
                    type="number" 
                    name="credit" 
                    value={formData.credit} 
                    readOnly 
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" 
                  />
                </div>
              </div>

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

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => router.push(`/suppliers/view/${supplierId}`)} 
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={submitting}
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
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}