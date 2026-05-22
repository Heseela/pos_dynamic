import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6">You don't have permission to access this page.</p>
        <Link href="/" className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
