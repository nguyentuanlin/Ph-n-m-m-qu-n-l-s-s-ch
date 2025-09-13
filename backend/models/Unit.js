const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Unit code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['Tiểu đội', 'Trung đội', 'Đại đội', 'Tiểu đoàn', 'Trung đoàn', 'Lữ đoàn', 'Sư đoàn', 'Quân đoàn', 'Quân khu'],
    required: [true, 'Unit type is required']
  },
  parentUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },
  commander: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
unitSchema.index({ code: 1 });
unitSchema.index({ type: 1 });
unitSchema.index({ parentUnit: 1 });

module.exports = mongoose.model('Unit', unitSchema);
