# Hướng dẫn tích hợp Frontend với Backend API

## 🚀 Đã hoàn thành

### 1. **Cập nhật API Service**
- ✅ Thay đổi base URL từ `http://localhost:3005` thành `http://localhost:5002/api`
- ✅ Cập nhật User interface để phù hợp với backend schema
- ✅ Cập nhật JWT payload interface
- ✅ Cập nhật các function API (login, getUsers, updateUser, createUser)

### 2. **Cập nhật Authentication**
- ✅ Cập nhật login component với loading state
- ✅ Cải thiện error handling
- ✅ Cập nhật JWT token handling
- ✅ Cập nhật role-based access control

### 3. **Cập nhật UI Components**
- ✅ Cập nhật Sidebar để sử dụng role mới (admin/user)
- ✅ Cập nhật SidebarItem để xử lý role đúng cách
- ✅ Cập nhật trang quản lý users với API mới
- ✅ Cập nhật form fields để phù hợp với User schema

## 🔧 Cách sử dụng

### 1. **Khởi chạy Backend**
```bash
cd backend
npm install
npm start
```
Backend sẽ chạy trên `http://localhost:5002`

### 2. **Khởi chạy Frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy trên `http://localhost:3000`

### 3. **Đăng nhập**
- Truy cập `http://localhost:3000/auth/signin`
- Sử dụng tài khoản admin mặc định:
  - **Email**: `admin@quandoi.vn`
  - **Password**: `admin123456`

## 📋 API Endpoints được sử dụng

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Users Management (Admin only)
- `GET /api/users` - Lấy danh sách users
- `PUT /api/users/:id` - Cập nhật user
- `POST /api/users` - Tạo user mới
- `DELETE /api/users/:id` - Xóa user

## 🔐 Phân quyền

### Admin
- Có thể truy cập tất cả tính năng
- Quản lý users
- Xem tất cả dữ liệu

### User
- Chỉ có thể xem thông tin của mình
- Không thể truy cập trang quản lý users

## 🎯 Tính năng đã tích hợp

1. **Đăng nhập/Đăng xuất**
   - Form đăng nhập với validation
   - JWT token authentication
   - Auto-redirect sau khi đăng nhập
   - Error handling

2. **Dashboard**
   - Trang chủ với thống kê
   - Role-based navigation
   - Protected routes

3. **Quản lý Users (Admin)**
   - Danh sách users với DataGrid
   - Thêm/sửa/xóa users
   - Form validation
   - Role management

## 🚨 Lưu ý quan trọng

1. **Backend phải chạy trước** khi khởi chạy frontend
2. **Tài khoản admin** sẽ được tự động tạo khi khởi chạy backend lần đầu
3. **JWT token** được lưu trong localStorage
4. **API base URL** có thể cần thay đổi tùy theo môi trường

## 🔄 Các bước tiếp theo

1. Test đầy đủ tính năng đăng nhập
2. Thêm validation cho forms
3. Cải thiện error handling
4. Thêm loading states
5. Implement logout functionality
6. Thêm refresh token mechanism

## 🐛 Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend có đang chạy không
- Kiểm tra URL trong apiService.ts
- Kiểm tra CORS settings

### Lỗi đăng nhập
- Kiểm tra email/password
- Kiểm tra backend logs
- Kiểm tra network tab trong DevTools

### Lỗi phân quyền
- Kiểm tra JWT token
- Kiểm tra role trong userData
- Kiểm tra menu permissions





