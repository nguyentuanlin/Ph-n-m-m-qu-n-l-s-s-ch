const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rank name is required'],
    unique: true,
    trim: true
  },
  level: {
    type: Number,
    required: [true, 'Rank level is required'],
    unique: true
  },
  category: {
    type: String,
    enum: ['Enlisted', 'NCO', 'Officer', 'General'],
    required: [true, 'Rank category is required']
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
rankSchema.index({ level: 1 });
rankSchema.index({ category: 1 });

module.exports = mongoose.model('Rank', rankSchema);
