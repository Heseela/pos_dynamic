'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, Plus, Minus, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AddPurchasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState([{ id: 1, inventoryId: '', name: '', quantity: 1, price: 0 }])
  const [totalAmount, setTotalAmount] = useState('0')
  const [totalItems, setTotalItems] = useState(0)
  const [images, setImages] = useState([]) 
  const [imagePreviews, setImagePreviews] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers')
        if (response.ok) {
          const data = await response.json()
          setSuppliers(data)
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      }
    }
    
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory')
        if (response.ok) {
          const data = await response.json()
          setInventoryItems(data)
        }
      } catch (error) {
        console.error('Error fetching inventory:', error)
      }
    }
    
    fetchSuppliers()
    fetchInventory()
  }, [])

  useEffect(() => {
    let totalQty = 0
    let totalAmt = 0
    items.forEach(item => {
      const qty = parseInt(item.quantity) || 0
      const price = parseFloat(item.price) || 0
      totalQty += qty
      totalAmt += qty * price
    })
    setTotalItems(totalQty)
    setTotalAmount(totalAmt.toString())
  }, [items])

  const addItem = () => {
    setItems([...items, { id: Date.now(), inventoryId: '', name: '', quantity: 1, price: 0 }])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // If inventory is selected, auto-fill the name and price
        if (field === 'inventoryId') {
          const selectedInventory = inventoryItems.find(inv => inv.id === value)
          if (selectedInventory) {
            updatedItem.name = selectedInventory.name
            updatedItem.price = selectedInventory.price || 0
          }
        }
        
        return updatedItem
      }
      return item
    }))
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
        console.log('Upload response:', result)
        
        let imageUuid = null
        
        if (result.fileupload && result.fileupload.id) {
          imageUuid = result.fileupload.id
          console.log('Found image ID in fileupload.id:', imageUuid)
        } else if (result.id) {
          imageUuid = result.id
        } else if (result.uuid) {
          imageUuid = result.uuid
        }
        
        if (!imageUuid) {
          console.error('Could not find image ID in response:', result)
          toast.error('Failed to get image ID from server')
          setImagePreviews(prev => prev.filter(img => img.tempId !== tempId))
          continue
        }
        
        console.log('✅ Image uploaded successfully with UUID:', imageUuid)
        
        setImages(prev => [...prev, imageUuid])
        
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
        console.log('Image deleted successfully')
      } catch (err) {
        console.error('Error deleting file from server:', err)
      }
    }
    
    setImages(prev => prev.filter((_, i) => i !== index))
    
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
    
    if (items.length === 0 || !items[0].inventoryId) {
      toast.error('Please add at least one inventory item')
      return
    }
    
    // Validate all items have inventory selected
    const invalidItems = items.filter(item => !item.inventoryId)
    if (invalidItems.length > 0) {
      toast.error('Please select inventory items for all rows')
      return
    }
    
    setLoading(true)
    const loadingToast = toast.loading('Creating purchase order...')
    
    try {
      // Format items as array of objects with inventory UUID, quantity, and price
      const itemsArray = items
        .filter(item => item.inventoryId && item.inventoryId.trim() !== '')
        .map(item => ({
          inventory: item.inventoryId, // This should be a UUID
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0
        }))
      
      const purchaseData = {
        supplier: selectedSupplier, 
        purchaseDate: purchaseDate, 
        totalAmount: totalAmount, 
        totalItems: totalItems.toString(),
        status: "pending",
        items: itemsArray, // Send as array of objects with UUIDs
        image: images 
      }
      
      console.log('Purchase data being sent:', JSON.stringify(purchaseData, null, 2))
      console.log('Items array with UUIDs:', itemsArray)
      console.log('Images to send:', images)
      
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(purchaseData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        throw new Error(error.message || error.error || 'Failed to create purchase')
      }
      
      const result = await response.json()
      console.log('Purchase created:', result)
      
      toast.success('Purchase order created successfully!', { id: loadingToast })
      setTimeout(() => router.push('/purchase'), 1500)
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error(error.message || 'Failed to create purchase', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'branch_head']}>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/purchase')}
              className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">New Purchase Order</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create a new purchase order</p>
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
                      <option key={supplier.id} value={supplier.id}>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <select
                          value={item.inventoryId}
                          onChange={(e) => updateItem(item.id, 'inventoryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          required
                        >
                          <option value="">Select Inventory Item</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} {inv.code && `(${inv.code})`} - रु {inv.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          required
                          min="1"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="w-24 text-right pt-2 text-sm font-semibold text-gray-700">
                        रु {(item.quantity * item.price).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <label className="block text-xs font-medium text-blue-700 mb-2">
                    Items Summary (Will be saved with inventory UUIDs)
                  </label>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      item.inventoryId && (
                        <p key={idx} className="text-sm text-gray-700">
                          • {item.name} - {item.quantity} x रु {parseFloat(item.price).toLocaleString()} = रु {(item.quantity * item.price).toLocaleString()}
                        </p>
                      )
                    ))}
                    {items.every(item => !item.inventoryId) && <p className="text-sm text-gray-500">No items added yet</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Items
                  </label>
                  <input
                    type="text"
                    value={totalItems}
                    readOnly
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (रु)
                  </label>
                  <input
                    type="text"
                    value={totalAmount}
                    readOnly
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Bill / Documents
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
                  <p className="text-sm text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                </label>
                {uploadingImage && <p className="text-sm text-blue-600 mt-2">Uploading images...</p>}
                {images.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">{images.length} file(s) uploaded successfully</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/purchase')}
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Create Purchase Order
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