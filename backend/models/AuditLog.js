const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Người dùng thực hiện hành động
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Thông tin người dùng (để tránh populate khi cần)
  userInfo: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: null
    },
    unit: {
      type: String,
      default: null
    }
  },
  
  // Loại hành động
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'CREATE', 'UPDATE', 'DELETE', 'VIEW',
      'ASSIGN', 'UNASSIGN', 'APPROVE', 'REJECT',
      'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE'
    ]
  },
  
  // Tài nguyên được thao tác
  resource: {
    type: String,
    required: true,
    enum: [
      'USER', 'DEPARTMENT', 'UNIT', 'RANK', 'POSITION',
      'BOOK', 'BOOK_ENTRY', 'NOTIFICATION', 'REPORT',
      'AUTH', 'SYSTEM'
    ]
  },
  
  // ID của tài nguyên (nếu có)
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Tên tài nguyên (để dễ đọc)
  resourceName: {
    type: String,
    default: null
  },
  
  // Mô tả chi tiết hành động
  description: {
    type: String,
    required: true
  },
  
  // Dữ liệu trước khi thay đổi (cho UPDATE/DELETE)
  oldData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Dữ liệu sau khi thay đổi (cho CREATE/UPDATE)
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // IP address của người dùng
  ipAddress: {
    type: String,
    required: true
  },
  
  // User agent của browser
  userAgent: {
    type: String,
    required: true
  },
  
  // Kết quả của hành động
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  
  // Thông báo lỗi (nếu có)
  errorMessage: {
    type: String,
    default: null
  },
  
  // Thời gian thực hiện (milliseconds)
  executionTime: {
    type: Number,
    default: 0
  },
  
  // Metadata bổ sung
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const auditLog = new this(logData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const skip = (page - 1) * limit;
  
  const query = this.find(filters)
    .populate('user', 'fullName email role')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
  
  const [logs, total] = await Promise.all([
    query.exec(),
    this.countDocuments(filters)
  ]);
  
  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

// Static method to get user activity summary
auditLogSchema.statics.getUserActivitySummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return summary;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
