'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layouts/DashboardLayout'
import { 
  Users, 
  BookOpen, 
  Building2, 
  Shield, 
  TrendingUp, 
  Activity,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalBooks: number
  totalDepartments: number
  totalUnits: number
  activeUsers: number
  recentActivities: number
  pendingTasks: number
  completedTasks: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBooks: 0,
    totalDepartments: 0,
    totalUnits: 0,
    activeUsers: 0,
    recentActivities: 0,
    pendingTasks: 0,
    completedTasks: 0
  })

  const loadDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual API calls
      setStats({
        totalUsers: 156,
        totalBooks: 89,
        totalDepartments: 12,
        totalUnits: 8,
        activeUsers: 142,
        recentActivities: 23,
        pendingTasks: 7,
        completedTasks: 45
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Tổng số người dùng',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Tổng số sổ sách',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Số phòng ban',
      value: stats.totalDepartments,
      icon: Building2,
      color: 'bg-purple-500',
      change: '+2%',
      changeType: 'positive'
    },
    {
      title: 'Số đơn vị',
      value: stats.totalUnits,
      icon: Shield,
      color: 'bg-orange-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Người dùng hoạt động',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-emerald-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Hoạt động gần đây',
      value: stats.recentActivities,
      icon: Clock,
      color: 'bg-indigo-500',
      change: '+3%',
      changeType: 'positive'
    }
  ]

  return (
    <DashboardLayout requiredRole="admin">
      <div className="bg-gray-50 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Quản trị
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tổng quan hệ thống quản lý sổ sách số hóa
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      so với tháng trước
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

          {/* Charts and Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hoạt động gần đây
            </h3>
            <div className="space-y-4">
              {[
                { action: 'Người dùng mới đăng ký', time: '2 phút trước', type: 'user' },
                { action: 'Sổ sách mới được tạo', time: '15 phút trước', type: 'book' },
                { action: 'Cập nhật thông tin phòng ban', time: '1 giờ trước', type: 'department' },
                { action: 'Báo cáo được tạo', time: '2 giờ trước', type: 'report' },
                { action: 'Người dùng đăng nhập', time: '3 giờ trước', type: 'login' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'user' && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'book' && <BookOpen className="h-5 w-5 text-green-500" />}
                    {activity.type === 'department' && <Building2 className="h-5 w-5 text-purple-500" />}
                    {activity.type === 'report' && <FileText className="h-5 w-5 text-orange-500" />}
                    {activity.type === 'login' && <Activity className="h-5 w-5 text-indigo-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Trạng thái công việc
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Công việc hoàn thành
                  </span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {stats.completedTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Đang xử lý
                  </span>
                </div>
                <span className="text-sm font-bold text-yellow-600">
                  {stats.pendingTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Cần chú ý
                  </span>
                </div>
                <span className="text-sm font-bold text-red-600">
                  3
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Quản lý người dùng</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Quản lý sổ sách</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Quản lý phòng ban</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Tạo báo cáo</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
