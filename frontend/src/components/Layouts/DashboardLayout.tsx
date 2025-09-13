'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Loader from '@/components/common/Loader'

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'commander' | 'staff'
}

const DashboardLayout = ({ children, requiredRole }: DashboardLayoutProps) => {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin')
        return
      }
      
      if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (user?.role === 'commander') {
          router.push('/commander/dashboard')
        } else {
          router.push('/staff/dashboard')
        }
        return
      }
    }
  }, [user, loading, isAuthenticated, router, requiredRole])

  if (loading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
