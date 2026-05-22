'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Users, UserCheck, Building2, Edit, Trash2, Plus } from 'lucide-react'

const INITIAL_BRANCHES = [
  {
    id: 1,
    code: 'ATS',
    name: 'Savory - ATS',
    location: 'Kathmandu, Nepal',
    type: 'Headquarters',
    manager: 'Admin User',
    employees: 15,
    status: 'Active',
    poles: [
      { name: 'Admin', head: 'Admin User', count: 2, role: 'admin' },
      { name: 'Branch Head', head: 'Jane Smith', count: 1, role: 'branch_head' },
      { name: 'Cashier', head: 'Ram Kumar', count: 6, role: 'cashier' },
      { name: 'Worker', head: 'Sita Sharma', count: 6, role: 'worker' },
    ]
  },
  {
    id: 2,
    code: 'BTL',
    name: 'Butwal Branch',
    location: 'Butwal, Nepal',
    type: 'Sub Branch',
    manager: 'Hari Prasad',
    employees: 10,
    status: 'Active',
    poles: [
      { name: 'Branch Head', head: 'Hari Prasad', count: 1, role: 'branch_head' },
      { name: 'Cashier', head: 'Maya Devi', count: 4, role: 'cashier' },
      { name: 'Worker', head: 'Gopal KC', count: 5, role: 'worker' },
    ]
  },
  {
    id: 3,
    code: 'BHR',
    name: 'Bhairahawa Branch',
    location: 'Bhairahawa, Nepal',
    type: 'Sub Branch',
    manager: 'Ramesh Thapa',
    employees: 8,
    status: 'Active',
    poles: [
      { name: 'Branch Head', head: 'Ramesh Thapa', count: 1, role: 'branch_head' },
      { name: 'Cashier', head: 'Sunita Rai', count: 3, role: 'cashier' },
      { name: 'Worker', head: 'Krishna Gurung', count: 4, role: 'worker' },
    ]
  },
]

export default function BranchesPage() {
  const router = useRouter()
  const [deleteModal, setDeleteModal] = useState({ show: false, branchId: null, branchName: '' })
  const [branches, setBranches] = useState([])

  const loadBranches = () => {
    const saved = localStorage.getItem('branches')
    if (saved) {
      setBranches(JSON.parse(saved))
    } else {
      localStorage.setItem('branches', JSON.stringify(INITIAL_BRANCHES))
      setBranches(INITIAL_BRANCHES)
    }
  }

  useEffect(() => {
    loadBranches()

    const handleStorageChange = (e) => {
      if (e.key === 'branches') {
        loadBranches()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    const handleFocus = () => {
      loadBranches()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const openDeleteModal = (id, name) => {
    setDeleteModal({ show: true, branchId: id, branchName: name })
  }

  const confirmDelete = () => {
    const updatedBranches = branches.filter(branch => branch.id !== deleteModal.branchId)
    setBranches(updatedBranches)
    localStorage.setItem('branches', JSON.stringify(updatedBranches))
    setDeleteModal({ show: false, branchId: null, branchName: '' })
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Branches</h1>
            <p className="text-sm text-gray-500 mt-1">{branches.length} branches</p>
          </div>
          <button 
            onClick={() => router.push('/branches/add')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            <Plus size={18} />
            Add Branch
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div 
              key={branch.id} 
              className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-gray-900 transition-all"
            >
              
         
              <div className="h-32 bg-linear-to-br from-gray-900 to-gray-700 flex items-center justify-center relative">
                <Building2 size={40} className="text-white/90" />

             
                {branch.type === 'Headquarters' && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/95 text-gray-900 rounded text-xs font-bold">
                      HQ
                    </span>
                  </div>
                )}

        
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/95 text-gray-900 rounded text-sm font-bold">
                    {branch.code}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {branch.name}
                  </h3>
                  
            
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => router.push(`/branches/edit/${branch.id}`)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(branch.id, branch.name)}
                      className="p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    <span>{branch.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-gray-400 shrink-0" />
                    <span>{branch.manager}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400 shrink-0" />
                    <span>{branch.employees} employees</span>
                  </div>
                </div>

                {branch.poles && (
                  <div className="grid grid-cols-2 gap-2">
                    {branch.poles.map((pole, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-2 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{pole.name}</span>
                          <span className="text-xs font-bold text-gray-900">{pole.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Branch
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteModal.branchName}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, branchId: null, branchName: '' })}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
