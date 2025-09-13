# Hướng dẫn sử dụng hệ thống Audit Logs

## Tổng quan

Hệ thống Audit Logs được thiết kế để theo dõi và ghi lại tất cả các hoạt động của người dùng trong hệ thống quản lý sổ sách quân đội. Điều này giúp:

- **Bảo mật**: Theo dõi các thao tác nhạy cảm
- **Tuân thủ**: Đáp ứng yêu cầu audit và compliance
- **Troubleshooting**: Phân tích và khắc phục sự cố
- **Phân tích**: Hiểu rõ hành vi người dùng

## Cấu trúc hệ thống

### Backend Components

#### 1. Model AuditLog (`backend/models/AuditLog.js`)
```javascript
{
  user: ObjectId,           // ID người dùng thực hiện
  userInfo: {               // Thông tin người dùng (để tránh populate)
    fullName: String,
    email: String,
    role: String,
    department: String,
    unit: String
  },
  action: String,           // Loại hành động (LOGIN, CREATE, UPDATE, etc.)
  resource: String,         // Tài nguyên được thao tác (USER, DEPARTMENT, etc.)
  resourceId: ObjectId,     // ID của tài nguyên
  resourceName: String,     // Tên tài nguyên
  description: String,      // Mô tả chi tiết
  oldData: Mixed,          // Dữ liệu trước khi thay đổi
  newData: Mixed,          // Dữ liệu sau khi thay đổi
  ipAddress: String,       // IP của người dùng
  userAgent: String,       // Browser/Client info
  status: String,          // SUCCESS, FAILED, PENDING
  errorMessage: String,    // Thông báo lỗi (nếu có)
  executionTime: Number,   // Thời gian thực hiện (ms)
  metadata: {              // Thông tin bổ sung
    method: String,        // HTTP method
    url: String,           // API endpoint
    statusCode: Number     // HTTP status code
  }
}
```

#### 2. Middleware AuditLogger (`backend/middleware/auditLogger.js`)
- Tự động log các thao tác API
- Capture request/response data
- Tính toán thời gian thực hiện
- Lưu trữ thông tin kỹ thuật

#### 3. API Routes (`backend/routes/auditLogs.js`)
- `GET /api/audit-logs` - Lấy danh sách logs
- `GET /api/audit-logs/stats` - Thống kê logs
- `GET /api/audit-logs/user/:userId` - Hoạt động của user
- `POST /api/audit-logs/export` - Xuất dữ liệu

### Frontend Components

#### 1. Màn hình chính (`frontend/src/app/admin/audit-logs/page.tsx`)
- Hiển thị danh sách logs với DataGrid
- Bộ lọc nâng cao (theo user, action, resource, status, thời gian)
- Xem chi tiết từng log entry
- Xuất dữ liệu

#### 2. Màn hình thống kê (`frontend/src/app/admin/audit-logs/stats/page.tsx`)
- Biểu đồ hoạt động theo thời gian
- Phân bố hành động và tài nguyên
- Top users hoạt động
- Thống kê trạng thái

## Các loại hành động được log

### Authentication
- `LOGIN` - Đăng nhập thành công
- `LOGOUT` - Đăng xuất
- `LOGIN_FAILED` - Đăng nhập thất bại

### CRUD Operations
- `CREATE` - Tạo mới tài nguyên
- `UPDATE` - Cập nhật tài nguyên
- `DELETE` - Xóa tài nguyên
- `VIEW` - Xem tài nguyên

### Business Operations
- `ASSIGN` - Phân công sổ sách
- `UNASSIGN` - Hủy phân công
- `APPROVE` - Phê duyệt
- `REJECT` - Từ chối

### System Operations
- `EXPORT` - Xuất dữ liệu
- `IMPORT` - Nhập dữ liệu
- `BACKUP` - Sao lưu
- `RESTORE` - Khôi phục

## Các tài nguyên được theo dõi

- `USER` - Người dùng
- `DEPARTMENT` - Phòng ban
- `UNIT` - Đơn vị
- `RANK` - Cấp bậc
- `POSITION` - Chức vụ
- `BOOK` - Sổ sách
- `BOOK_ENTRY` - Bản ghi sổ sách
- `NOTIFICATION` - Thông báo
- `REPORT` - Báo cáo
- `AUTH` - Xác thực
- `SYSTEM` - Hệ thống

## Cách sử dụng

### 1. Truy cập màn hình Audit Logs
- Đăng nhập với tài khoản admin
- Vào menu "Audit Logs" trong sidebar
- Chọn "Danh sách logs" hoặc "Thống kê"

### 2. Lọc và tìm kiếm
- Sử dụng bộ lọc để tìm logs cụ thể
- Tìm kiếm theo tên người dùng, email, mô tả
- Lọc theo khoảng thời gian
- Lọc theo loại hành động và tài nguyên

### 3. Xem chi tiết
- Click vào icon "Xem" để xem chi tiết log
- Thông tin bao gồm:
  - Thông tin người dùng
  - Chi tiết hành động
  - Dữ liệu trước/sau thay đổi
  - Thông tin kỹ thuật (IP, User Agent, etc.)

### 4. Xuất dữ liệu
- Click "Xuất dữ liệu" để export logs
- Chọn định dạng: CSV, Excel, JSON
- Áp dụng bộ lọc trước khi xuất

## API Usage

### Lấy danh sách logs
```javascript
const logs = await getAuditLogs(token, {
  page: 1,
  limit: 50,
  action: 'CREATE',
  resource: 'USER',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Lấy thống kê
```javascript
const stats = await getAuditStats(token, 30); // 30 ngày
```

### Lấy hoạt động của user
```javascript
const activity = await getUserActivity(token, userId, 30);
```

## Cấu hình

### Bật/tắt audit logging
Để tắt audit logging cho một route cụ thể, thêm vào options:

```javascript
router.get('/some-route', protect, auditLogger({
  skipPaths: ['/api/some-route']
}), handler);
```

### Tùy chỉnh thông tin log
Chỉnh sửa trong `auditLogger.js`:

```javascript
// Thêm thông tin bổ sung
metadata: {
  method: req.method,
  url: req.originalUrl,
  statusCode: res.statusCode,
  customField: 'customValue' // Thêm field tùy chỉnh
}
```

## Bảo mật

- Chỉ admin mới có thể xem audit logs
- Dữ liệu nhạy cảm (password) được loại bỏ khỏi logs
- IP address và User Agent được lưu trữ để tracking
- Logs được lưu trữ vĩnh viễn (có thể cấu hình retention policy)

## Performance

- Audit logging chạy bất đồng bộ (async) để không ảnh hưởng performance
- Indexes được tạo cho các trường thường xuyên query
- Pagination được hỗ trợ cho danh sách logs
- Caching có thể được thêm vào cho stats

## Troubleshooting

### Logs không xuất hiện
1. Kiểm tra middleware đã được thêm vào routes
2. Kiểm tra user đã đăng nhập
3. Kiểm tra database connection

### Performance chậm
1. Kiểm tra indexes trong database
2. Giảm số lượng logs được query
3. Sử dụng pagination

### Lỗi export
1. Kiểm tra quyền admin
2. Kiểm tra format export được hỗ trợ
3. Kiểm tra kích thước dữ liệu

## Mở rộng

### Thêm loại hành động mới
1. Cập nhật enum trong `AuditLog.js`
2. Cập nhật `auditLogger.js` để nhận diện action mới
3. Cập nhật frontend labels

### Thêm tài nguyên mới
1. Cập nhật enum trong `AuditLog.js`
2. Thêm model reference trong `auditLogger.js`
3. Cập nhật frontend labels

### Tùy chỉnh UI
1. Chỉnh sửa `page.tsx` và `stats/page.tsx`
2. Thêm components mới
3. Cập nhật styling

## Kết luận

Hệ thống Audit Logs cung cấp khả năng theo dõi và giám sát toàn diện các hoạt động trong hệ thống. Với thiết kế linh hoạt và dễ mở rộng, nó đáp ứng được các yêu cầu bảo mật và compliance của hệ thống quản lý quân đội.
