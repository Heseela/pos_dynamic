'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, X, Upload, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AddSupplierPage() {
  const router = useRouter()
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreviews, setImagePreviews] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    panvat: '',
    contact: '',
    totalamount: '',
    paid: '',
    credit: '',
    accountNo: '',
    bankname: '',
    image: []
  })
  const [uploadedImages, setUploadedImages] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'totalamount' || name === 'paid') {
      const total = name === 'totalamount' ? parseFloat(value) : parseFloat(formData.totalamount)
      const paid = name === 'paid' ? parseFloat(value) : parseFloat(formData.paid)
      if (!isNaN(total) && !isNaN(paid)) {
        setFormData(prev => ({ ...prev, credit: (total - paid).toString() }))
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
        
        console.log('Upload response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Upload failed:', errorText)
          throw new Error(`Upload failed: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Full upload response:', result)
        
        let imageUuid = result.id || result.uuid || result.fileId || result.id || result?.fileupload?.id
        if (!imageUuid) {
          console.error('Could not find UUID in response. Response structure:', Object.keys(result))
          toast.error('Failed to get image ID from server')
          setImagePreviews(prev => prev.filter(img => img.tempId !== tempId))
          continue
        }
        
        console.log(' Image uploaded successfully with UUID:', imageUuid)
        
        setFormData(prev => {
          const currentImages = prev.image.filter(img => img !== null)
          return {
            ...prev,
            image: [...currentImages, imageUuid]
          }
        })
        
        setImagePreviews(prev => 
          prev.map(img => 
            img.tempId === tempId ? { ...img, uploading: false, uuid: imageUuid } : img
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
    
    if (imageToRemove.uuid) {
      try {
        await fetch(`/api/fileupload/${imageToRemove.uuid}`, {
          method: 'DELETE',
          credentials: "include"
        })
      } catch (err) {
        console.error('Error deleting file from server:', err)
      }
    }
    
    setFormData(prev => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== index)
    }))
    
    if (imageToRemove.url && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    toast.success("Image removed")
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!formData.name || !formData.contact || !formData.totalamount) {
    toast.error('Please fill in all required fields')
    return
  }
  
  const loadingToast = toast.loading('Creating supplier...')
  
  console.log('=== IMAGES BEFORE SUBMIT ===')
  console.log('FormData.image array:', formData.image)
  console.log('Number of images:', formData.image.length)
  
  try {
    const payload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      panvat: formData.panvat.trim(),
      contact: formData.contact.trim(),
      totalamount: parseFloat(formData.totalamount).toString(),
      paid: parseFloat(formData.paid || 0).toString(),
      credit: parseFloat(formData.credit || 0).toString(),
      accountNo: formData.accountNo.trim(),
      bankname: formData.bankname.trim(),
      image: formData.image.filter(img => img !== null) 
    }
    
    console.log('Final payload being sent:', JSON.stringify(payload, null, 2))
    
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    console.log('Server response:', result)
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create supplier')
    }
    
    toast.success('Supplier created successfully!', { id: loadingToast })
    setTimeout(() => router.push('/suppliers'), 1500)
  } catch (error) {
    console.error('Error creating supplier:', error)
    toast.error(error.message || 'Failed to create supplier', { id: loadingToast })
  }
}
  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head', 'accountant']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <Toaster position="top-right" />
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => router.push('/suppliers')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Add Supplier</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create a new supplier record</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN / VAT</label>
                  <input type="text" name="panvat" value={formData.panvat} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="city, country" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input type="text" name="bankname" value={formData.bankname} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (रु) <span className="text-red-500">*</span></label>
                  <input type="number" name="totalamount" value={formData.totalamount} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (रु)</label>
                  <input type="number" name="paid" value={formData.paid} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit / Due</label>
                  <input type="number" name="credit" value={formData.credit} readOnly className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document
                </label>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img
                            src={img.url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200?text=Image+Error'
                            }}
                          />
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {!img.uploading && img.uuid && (
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

                <label className={`border-2 border-dashed rounded-lg p-8 block text-center cursor-pointer hover:border-gray-900 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploadingImage}
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                </label>
                {uploadingImage && <p className="text-sm text-blue-600 mt-2">Uploading images...</p>}
                {formData.image.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">{formData.image.length} file(s) uploaded successfully</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => router.push('/suppliers')} className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"><Save size={16} /> Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}