const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema({
  // Thông tin cơ bản
  title: {
    type: String,
    required: [true, 'Tiêu đề công việc là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  
  description: {
    type: String,
    required: [true, 'Mô tả công việc là bắt buộc'],
    trim: true,
    maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
  },

  // Thông tin sổ sách liên quan
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'ID sổ sách là bắt buộc']
  },

  bookEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookEntry',
    required: [true, 'ID mục sổ sách là bắt buộc']
  },

  // Người giao việc và người nhận việc
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người giao việc là bắt buộc']
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Người nhận việc là bắt buộc']
  },

  // Thời gian và deadline
  assignedAt: {
    type: Date,
    default: Date.now
  },

  deadline: {
    type: Date,
    required: [true, 'Thời hạn hoàn thành là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.assignedAt;
      },
      message: 'Thời hạn hoàn thành phải sau thời gian giao việc'
    }
  },

  completedAt: {
    type: Date,
    default: null
  },

  // Trạng thái công việc
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Tiến độ hoàn thành
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Ghi chú và bình luận
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Thông tin nhắc nhở
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: null
    }
  }],

  // Thông tin phê duyệt
  requiresApproval: {
    type: Boolean,
    default: false
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  approvedAt: {
    type: Date,
    default: null
  },

  approvalNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Ghi chú phê duyệt không được vượt quá 500 ký tự']
  },

  // Thông tin đơn vị
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },

  // Metadata
  tags: [{
    type: String,
    trim: true
  }],

  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Thông tin tạo và cập nhật
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
taskAssignmentSchema.index({ assignedTo: 1, status: 1 });
taskAssignmentSchema.index({ assignedBy: 1, status: 1 });
taskAssignmentSchema.index({ deadline: 1, status: 1 });
taskAssignmentSchema.index({ unit: 1, department: 1 });
taskAssignmentSchema.index({ bookId: 1, bookEntryId: 1 });
taskAssignmentSchema.index({ createdAt: -1 });

// Virtual fields
taskAssignmentSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && this.deadline < new Date();
});

taskAssignmentSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const diffTime = this.deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

taskAssignmentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware để cập nhật trạng thái
taskAssignmentSchema.pre('save', function(next) {
  const now = new Date();
  
  // Cập nhật trạng thái nếu quá hạn
  if (this.status !== 'completed' && this.deadline < now) {
    this.status = 'overdue';
  }
  
  // Cập nhật tiến độ nếu hoàn thành
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = now;
    this.progress = 100;
  }
  
  next();
});

// Static methods
taskAssignmentSchema.statics.findOverdueTasks = function() {
  return this.find({
    status: { $in: ['pending', 'in_progress'] },
    deadline: { $lt: new Date() }
  });
};

taskAssignmentSchema.statics.findTasksByUser = function(userId, status = null) {
  const query = { assignedTo: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('assignedBy bookId bookEntryId unit department');
};

taskAssignmentSchema.statics.findTasksByUnit = function(unitId, status = null) {
  const query = { unit: unitId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('assignedBy assignedTo bookId bookEntryId unit department');
};

// Instance methods
taskAssignmentSchema.methods.addNote = function(content, authorId) {
  this.notes.push({
    content,
    author: authorId,
    createdAt: new Date()
  });
  return this.save();
};

taskAssignmentSchema.methods.updateProgress = function(progress, userId) {
  this.progress = Math.max(0, Math.min(100, progress));
  this.updatedBy = userId;
  
  if (progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (progress > 0 && this.status === 'pending') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

taskAssignmentSchema.methods.addReminder = function(type, message, scheduledAt) {
  this.reminders.push({
    type,
    message,
    scheduledAt,
    sent: false
  });
  return this.save();
};

module.exports = mongoose.model('TaskAssignment', taskAssignmentSchema);
