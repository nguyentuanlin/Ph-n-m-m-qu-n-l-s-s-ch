const mongoose = require('mongoose');

const bookEntrySchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  // Ngày tháng của entry
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required']
  },
  // Dữ liệu thực tế của entry
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Entry data is required']
  },
  // Trạng thái entry
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  // Thời gian submit
  submittedAt: {
    type: Date
  },
  // Người approve/reject
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Thời gian review
  reviewedAt: {
    type: Date
  },
  // Ghi chú từ người review
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  // Có đúng hạn không
  isOnTime: {
    type: Boolean,
    default: true
  },
  // Thời gian deadline
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  // Thời gian thực tế hoàn thành
  completedAt: {
    type: Date
  },
  // File đính kèm (nếu có)
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
  // Version history
  version: {
    type: Number,
    default: 1
  },
  // Previous versions
  history: [{
    data: mongoose.Schema.Types.Mixed,
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeReason: String
  }]
}, {
  timestamps: true
});

// Index for better performance
bookEntrySchema.index({ bookId: 1, entryDate: 1 });
bookEntrySchema.index({ userId: 1, entryDate: 1 });
bookEntrySchema.index({ status: 1 });
bookEntrySchema.index({ deadline: 1 });
bookEntrySchema.index({ submittedAt: 1 });

// Compound index for unique constraint
bookEntrySchema.index({ bookId: 1, entryDate: 1 }, { unique: true });

// Pre-save middleware to check if entry is on time
bookEntrySchema.pre('save', function(next) {
  if (this.submittedAt && this.deadline) {
    this.isOnTime = this.submittedAt <= this.deadline;
  }
  next();
});

module.exports = mongoose.model('BookEntry', bookEntrySchema);
