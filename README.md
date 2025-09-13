# Hệ thống quản lý sổ sách số hóa

Hệ thống quản lý và theo dõi sổ sách số hóa, thay thế việc viết tay truyền thống bằng công nghệ hiện đại.

## 🚀 Tính năng chính

### Cho Nhân viên (Staff)
- **Dashboard cá nhân**: Xem tổng quan công việc, hiệu suất
- **Quản lý sổ sách**: Cập nhật sổ sách được giao theo lịch
- **Theo dõi tiến độ**: Xem trạng thái các entry đã nộp
- **Thông báo**: Nhận nhắc nhở deadline và cập nhật trạng thái

### Cho Chỉ huy (Commander)
- **Dashboard quản lý**: Theo dõi tiến độ toàn bộ phòng ban
- **Quản lý nhân viên**: Xem hiệu suất và phân công công việc
- **Báo cáo**: Thống kê chi tiết về chất lượng và thời gian
- **Cảnh báo**: Nhận thông báo khi có nhân viên trễ hạn

### Cho Quản trị viên (Admin)
- **Quản lý toàn hệ thống**: Tạo sổ sách, phân quyền người dùng
- **Báo cáo tổng hợp**: Thống kê toàn bộ hệ thống
- **Cấu hình**: Thiết lập lịch cập nhật, cảnh báo

## 🛠 Công nghệ sử dụng

### Backend
- **Node.js** với **Express.js**
- **MongoDB** với **Mongoose**
- **JWT** cho xác thực
- **Node-cron** cho lập lịch
- **Express-validator** cho validation

### Frontend
- **Next.js 14** với App Router
- **React 18** với TypeScript
- **Tailwind CSS** cho styling
- **React Query** cho state management
- **React Hook Form** cho form handling
- **Lucide React** cho icons

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm hoặc yarn

### Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies
npm run install:all

# Hoặc cài đặt từng phần
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd frontend && npm install     # Frontend dependencies
```

### Cấu hình môi trường

1. **Backend**: Copy `backend/config.env.example` thành `backend/.env`
```bash
cd backend
cp config.env.example .env
```

2. **Cập nhật các biến môi trường trong `.env`**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/so-sach-management
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

3. **Frontend**: Tạo file `.env.local` trong thư mục `frontend`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Chạy ứng dụng

```bash
# Chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:backend   # Backend trên port 5000
npm run dev:frontend  # Frontend trên port 3000
```

## 🗄 Cấu trúc Database

### Models chính

#### User
- Thông tin người dùng (tên, email, phòng ban, chức vụ)
- Phân quyền (admin, commander, staff)
- Sổ sách được giao

#### Book
- Thông tin sổ sách (tên, mã, loại, phòng ban)
- Người được giao phụ trách
- Lịch cập nhật (tần suất, thời gian)
- Cấu hình cảnh báo

#### BookEntry
- Dữ liệu thực tế của từng entry
- Trạng thái (draft, submitted, approved, rejected)
- Thời gian deadline và hoàn thành
- Lịch sử thay đổi

#### Notification
- Thông báo cho người dùng
- Các loại: nhắc nhở, cảnh báo, phê duyệt
- Mức độ ưu tiên và thời gian hết hạn

## 🔐 Phân quyền

### Admin
- Toàn quyền truy cập hệ thống
- Tạo/sửa/xóa sổ sách và người dùng
- Xem tất cả báo cáo

### Commander
- Quản lý phòng ban của mình
- Xem báo cáo phòng ban
- Phê duyệt entry của nhân viên

### Staff
- Chỉ xem sổ sách được giao
- Cập nhật entry của mình
- Xem thông báo cá nhân

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (admin only)
- `GET /api/auth/me` - Thông tin user hiện tại
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Books
- `GET /api/books` - Danh sách sổ sách
- `POST /api/books` - Tạo sổ sách mới
- `GET /api/books/:id` - Chi tiết sổ sách
- `PUT /api/books/:id` - Cập nhật sổ sách
- `DELETE /api/books/:id` - Xóa sổ sách
- `GET /api/books/:id/entries` - Danh sách entry

### Users
- `GET /api/users` - Danh sách người dùng
- `GET /api/users/:id` - Chi tiết người dùng
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng
- `GET /api/users/:id/stats` - Thống kê người dùng

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/performance` - Báo cáo hiệu suất
- `GET /api/reports/books` - Báo cáo sổ sách
- `GET /api/reports/late-entries` - Báo cáo trễ hạn

### Notifications
- `GET /api/notifications` - Danh sách thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/:id` - Xóa thông báo

## 🚀 Triển khai

### Development
```bash
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📝 Ghi chú

- Hệ thống sử dụng JWT cho authentication
- Tự động nhắc nhở theo lịch đã cấu hình
- Hỗ trợ upload file đính kèm
- Responsive design cho mobile
- Dark mode support (có thể thêm)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Email: your-email@example.com
- Project Link: [https://github.com/your-username/so-sach-management](https://github.com/your-username/so-sach-management)
