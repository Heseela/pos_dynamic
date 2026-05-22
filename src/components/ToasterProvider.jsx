'use client'

import { Toaster } from 'react-hot-toast'

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        top: 80,
      }}
      toastOptions={{
        duration: 2500,
        style: {
          background: '#111827',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          fontWeight: '500',
          fontSize: '14px',
          backdropFilter: 'blur(8px)',
          maxWidth: '400px',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        success: {
          duration: 2500,
          style: {
            background: '#111827',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#111827',
          },
        },
        error: {
          duration: 3500,
          style: {
            background: '#111827',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            background: '#111827',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          iconTheme: {
            primary: '#9ca3af',
            secondary: '#111827',
          },
        },
      }}
    />
  )
}
