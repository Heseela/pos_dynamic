'use client'

import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
      
      <div className="flex-1">
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-200 group">
          <Bell size={20} className="text-gray-600 group-hover:text-gray-900" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role || 'Role'}</p>
          </div>
          <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-blue-100">
            <span className="text-white text-base font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
