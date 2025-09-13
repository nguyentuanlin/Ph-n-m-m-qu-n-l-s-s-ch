'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Loader2, Shield, Lock, User, ShieldCheck } from 'lucide-react'
import { Alert, Snackbar } from '@mui/material'

export default function SigninPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
    } catch (error: any) {
      console.log(error)
      if (error.message) {
        setError(error.message)
      } else {
        setError('Đang có lỗi xảy ra, vui lòng thử lại sau!')
      }
      setOpenSnackbar(true)
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Military Decorative Elements */}
      <div className="absolute top-10 left-10 text-green-400 opacity-30">
        <ShieldCheck className="h-16 w-16" />
      </div>
      <div className="absolute bottom-10 right-10 text-green-400 opacity-30">
        <Shield className="h-20 w-20" />
      </div>
      <div className="absolute top-1/2 left-10 text-green-400 opacity-20">
        <Lock className="h-12 w-12" />
      </div>
      <div className="absolute top-1/3 right-10 text-green-400 opacity-20">
        <User className="h-14 w-14" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-green-500 shadow-2xl border-4 border-green-400">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white tracking-wide">
            HỆ THỐNG QUẢN LÝ
          </h1>
          <h2 className="mt-2 text-2xl font-semibold text-green-300">
            SỔ SÁCH SỐ HÓA
          </h2>
          <div className="mt-4 h-1 w-24 bg-gradient-to-r from-green-500 to-green-300 mx-auto rounded-full"></div>
          <p className="mt-4 text-sm text-green-200 font-medium">
            BỘ QUỐC PHÒNG - VIỆT NAM
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  ĐỊA CHỈ EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Nhập địa chỉ email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  MẬT KHẨU
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-300 hover:text-white transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-3" />
                    ĐĂNG NHẬP HỆ THỐNG
                  </>
                )}
              </button>
            </div>

            {/* Footer Message */}
            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-sm text-green-200 font-medium">
                Liên hệ quản trị viên để được cấp tài khoản truy cập
              </p>
            </div>
          </form>
        </div>

        {/* Bottom Decoration */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-green-300 text-sm font-medium">
            <div className="h-1 w-8 bg-green-500 rounded-full"></div>
            <span>BẢO MẬT CAO</span>
            <div className="h-1 w-8 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Error Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  )
}