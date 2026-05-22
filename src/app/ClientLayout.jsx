'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import Sidebar from '@/components/Layout/Sidebar'
import Navbar from '@/components/Layout/Navbar'

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { loggedIn, loading } = useAuth()
  console.log(loggedIn,loading,"herehbdsdsabj 76")
  
  useEffect(() => {
    if (!loading && !loggedIn && pathname !== '/login' && pathname !== '/unauthorized') {
      router.push('/login')
    }
  }, [loggedIn, loading, pathname, router])
  
  const isAuthPage = pathname === '/login' || pathname === '/unauthorized'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (isAuthPage) {
    return <>{children}</>

  }

  if (!loggedIn) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
