'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { login as apiLogin } from '@/js/apiService'

interface User {
  _id: string
  username: string
  email: string
  fullName: string
  role: 'admin' | 'commander' | 'staff'
  department?: string
  position?: string
  phone?: string
  isActive: boolean
  lastLogin?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user && !!token

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUserData = localStorage.getItem('userData')
      
      if (savedToken && savedUserData) {
        try {
          setToken(savedToken)
          const userData = JSON.parse(savedUserData)
          setUser({
            _id: userData._id || '',
            username: userData.username || '',
            email: userData.email || '',
            fullName: userData.fullName || '',
            role: userData.role || 'staff',
            department: userData.department || '',
            position: userData.position || '',
            phone: userData.phone || '',
            isActive: userData.isActive || true,
            lastLogin: userData.lastLogin || '',
            avatar: userData.avatar || ''
          })
        } catch (error) {
          console.error('Auth initialization failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('userData')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin(email, password)
      const { token: userToken } = response

      setToken(userToken)
      
      // Lấy thông tin user từ localStorage (đã được lưu bởi apiLogin)
      const savedUserData = localStorage.getItem('userData')
      let userData = null
      
      if (savedUserData) {
        userData = JSON.parse(savedUserData)
        setUser({
          _id: userData._id || '',
          username: userData.username || '',
          email: userData.email || '',
          fullName: userData.fullName || '',
          role: userData.role || 'staff',
          department: userData.department || '',
          position: userData.position || '',
          phone: userData.phone || '',
          isActive: userData.isActive || true,
          lastLogin: userData.lastLogin || '',
          avatar: userData.avatar || ''
        })
      }

      // Redirect based on role
      const userRole = userData?.role || 'staff'
      console.log('User role:', userRole) // Debug log
      
      if (userRole === 'admin') {
        router.push('/admin/dashboard')
      } else if (userRole === 'commander') {
        router.push('/commander/dashboard')
      } else {
        router.push('/staff/dashboard')
      }
    } catch (error: any) {
      console.error('Login error in AuthContext:', error)
      throw new Error(error.message || 'Đăng nhập thất bại')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    router.push('/auth/signin')
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
