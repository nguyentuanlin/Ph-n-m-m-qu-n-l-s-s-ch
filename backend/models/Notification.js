const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'reminder',           // Nhắc nhở cập nhật sổ
      'deadline_warning',   // Cảnh báo sắp hết hạn
      'deadline_missed',    // Đã quá hạn
      'submission',         // Đã submit entry
      'approval',           // Entry được approve
      'rejection',          // Entry bị reject
      'escalation',         // Báo cáo lên cấp trên
      'system'              // Thông báo hệ thống
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  // Dữ liệu liên quan
  relatedData: {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookEntry'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Trạng thái đọc
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Mức độ ưu tiên
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Có gửi email không
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  // Thời gian hết hạn thông báo
  expiresAt: {
    type: Date
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

// TTL index for auto-deletion of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
