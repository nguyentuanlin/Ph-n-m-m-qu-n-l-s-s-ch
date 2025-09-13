const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Book name is required'],
    trim: true,
    maxlength: [200, 'Book name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Book code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    required: [true, 'Book type is required'],
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'daily'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  // Người được giao phụ trách
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned user is required']
  },
  // Người tạo/giao sổ
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Lịch cập nhật
  updateSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    time: {
      type: String,
      default: '08:00' // HH:MM format
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6 // 0 = Sunday, 1 = Monday, etc.
    }],
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    }
  },
  // Trạng thái sổ
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  // Cấu hình cảnh báo
  alertConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '07:00' // Thời gian nhắc nhở trước deadline
    },
    escalationTime: {
      type: String,
      default: '09:00' // Thời gian báo cáo lên cấp trên
    },
    notifyCommander: {
      type: Boolean,
      default: true
    }
  },
  // Thông tin template cho sổ
  template: {
    fields: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'textarea'],
        default: 'text'
      },
      required: {
        type: Boolean,
        default: false
      },
      options: [String], // For select type
      placeholder: String
    }]
  }
}, {
  timestamps: true
});

// Index for better performance
bookSchema.index({ code: 1 });
bookSchema.index({ assignedTo: 1 });
bookSchema.index({ department: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ type: 1 });

module.exports = mongoose.model('Book', bookSchema);
