const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Position name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Position code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  level: {
    type: String,
    enum: ['Junior', 'Senior', 'Management', 'Executive'],
    required: [true, 'Position level is required']
  },
  requirements: {
    minRank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rank'
    },
    experience: {
      type: Number, // years
      default: 0
    }
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
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
positionSchema.index({ code: 1 });
positionSchema.index({ department: 1 });
positionSchema.index({ level: 1 });

module.exports = mongoose.model('Position', positionSchema);
