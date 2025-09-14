const express = require('express');
const { body, validationResult } = require('express-validator');
const BookEntry = require('../models/BookEntry');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const { protect, checkEntryAccess } = require('../middleware/auth');
const moment = require('moment');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// @desc    Create new book entry
// @route   POST /api/entries
// @access  Private
router.post('/', protect, auditLogger(), [
  body('bookId')
    .isMongoId()
    .withMessage('Valid book ID is required'),
  body('entryDate')
    .isISO8601()
    .withMessage('Valid entry date is required'),
  body('data')
    .notEmpty()
    .withMessage('Entry data is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookId, entryDate, data } = req.body;

    // Check if book exists and user has access
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user has access to this book
    if (req.user.role === 'staff' && book.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this book'
      });
    }

    // Check if entry already exists for this date
    const existingEntry = await BookEntry.findOne({
      bookId,
      entryDate: new Date(entryDate)
    });

    if (existingEntry) {
      return res.status(400).json({
        status: 'error',
        message: 'Entry already exists for this date'
      });
    }

    // Calculate deadline based on book schedule
    const deadline = calculateDeadline(book, new Date(entryDate));

    // Create entry
    const entry = await BookEntry.create({
      bookId,
      userId: req.user._id,
      entryDate: new Date(entryDate),
      data,
      deadline,
      status: 'draft'
    });

    // Populate entry data
    const populatedEntry = await BookEntry.findById(entry._id)
      .populate('bookId', 'name code type department')
      .populate('userId', 'fullName email department');

    res.status(201).json({
      status: 'success',
      message: 'Entry created successfully',
      data: {
        entry: populatedEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get book entries
// @route   GET /api/entries
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      bookId, 
      startDate, 
      endDate, 
      status,
      userId 
    } = req.query;
    
    const query = {};

    // Filter by book
    if (bookId) {
      query.bookId = bookId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by user
    if (userId) {
      query.userId = userId;
    } else if (req.user.role === 'staff') {
      // Staff can only see their own entries
      query.userId = req.user._id;
    }

    const entries = await BookEntry.find(query)
      .populate('bookId', 'name code type department')
      .populate('userId', 'fullName email department')
      .populate('reviewedBy', 'fullName email')
      .sort({ entryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BookEntry.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: entries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single entry
// @route   GET /api/entries/:id
// @access  Private
router.get('/:id', protect, checkEntryAccess, async (req, res) => {
  try {
    const entry = await BookEntry.findById(req.params.id)
      .populate('bookId', 'name code type department template')
      .populate('userId', 'fullName email department')
      .populate('reviewedBy', 'fullName email');

    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        entry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update entry
// @route   PUT /api/entries/:id
// @access  Private
router.put('/:id', protect, checkEntryAccess, auditLogger(), [
  body('data')
    .notEmpty()
    .withMessage('Entry data is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const entry = await BookEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    // Only allow update if status is draft or if user is admin/commander
    if (entry.status !== 'draft' && req.user.role === 'staff') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot update submitted entry'
      });
    }

    // Save current data to history
    entry.history.push({
      data: entry.data,
      modifiedAt: new Date(),
      modifiedBy: req.user._id,
      changeReason: req.body.changeReason || 'Entry updated'
    });

    // Update entry
    entry.data = req.body.data;
    entry.version += 1;
    await entry.save();

    const updatedEntry = await BookEntry.findById(entry._id)
      .populate('bookId', 'name code type department')
      .populate('userId', 'fullName email department')
      .populate('reviewedBy', 'fullName email');

    res.status(200).json({
      status: 'success',
      message: 'Entry updated successfully',
      data: {
        entry: updatedEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Submit entry
// @route   PUT /api/entries/:id/submit
// @access  Private
router.put('/:id/submit', protect, checkEntryAccess, async (req, res) => {
  try {
    const entry = await BookEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    if (entry.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Entry is already submitted'
      });
    }

    // Update entry status
    entry.status = 'submitted';
    entry.submittedAt = new Date();
    entry.completedAt = new Date();
    await entry.save();

    // Create notification for commander
    const book = await Book.findById(entry.bookId);
    if (book && book.alertConfig.notifyCommander) {
      await Notification.create({
        recipient: book.assignedTo, // This should be the commander
        sender: req.user._id,
        type: 'submission',
        title: 'Entry mới được submit',
        message: `Entry cho sổ "${book.name}" đã được submit bởi ${req.user.fullName}`,
        priority: 'medium',
        relatedData: {
          bookId: book._id,
          entryId: entry._id,
          userId: req.user._id
        }
      });
    }

    const updatedEntry = await BookEntry.findById(entry._id)
      .populate('bookId', 'name code type department')
      .populate('userId', 'fullName email department');

    res.status(200).json({
      status: 'success',
      message: 'Entry submitted successfully',
      data: {
        entry: updatedEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Approve/Reject entry
// @route   PUT /api/entries/:id/review
// @access  Private (Commander/Admin only)
router.put('/:id/review', protect, [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  body('reviewNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Review notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only commander and admin can review
    if (req.user.role === 'staff') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const entry = await BookEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    if (entry.status !== 'submitted') {
      return res.status(400).json({
        status: 'error',
        message: 'Entry is not submitted'
      });
    }

    // Update entry
    entry.status = req.body.status;
    entry.reviewedBy = req.user._id;
    entry.reviewedAt = new Date();
    entry.reviewNotes = req.body.reviewNotes;
    await entry.save();

    // Create notification for user
    await Notification.create({
      recipient: entry.userId,
      sender: req.user._id,
      type: req.body.status === 'approved' ? 'approval' : 'rejection',
      title: `Entry ${req.body.status === 'approved' ? 'được phê duyệt' : 'bị từ chối'}`,
      message: `Entry của bạn đã ${req.body.status === 'approved' ? 'được phê duyệt' : 'bị từ chối'}${req.body.reviewNotes ? ': ' + req.body.reviewNotes : ''}`,
      priority: req.body.status === 'approved' ? 'low' : 'medium',
      relatedData: {
        bookId: entry.bookId,
        entryId: entry._id
      }
    });

    const updatedEntry = await BookEntry.findById(entry._id)
      .populate('bookId', 'name code type department')
      .populate('userId', 'fullName email department')
      .populate('reviewedBy', 'fullName email');

    res.status(200).json({
      status: 'success',
      message: `Entry ${req.body.status} successfully`,
      data: {
        entry: updatedEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete entry
// @route   DELETE /api/entries/:id
// @access  Private
router.delete('/:id', protect, checkEntryAccess, async (req, res) => {
  try {
    const entry = await BookEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    // Only allow delete if status is draft or if user is admin
    if (entry.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete submitted entry'
      });
    }

    await BookEntry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function to calculate deadline
function calculateDeadline(book, entryDate) {
  const { updateSchedule } = book;
  const deadline = new Date(entryDate);

  switch (updateSchedule.frequency) {
    case 'daily':
      // Add 1 day
      deadline.setDate(deadline.getDate() + 1);
      break;
    case 'weekly':
      // Add 1 week
      deadline.setDate(deadline.getDate() + 7);
      break;
    case 'monthly':
      // Add 1 month
      deadline.setMonth(deadline.getMonth() + 1);
      break;
  }

  // Set time based on schedule
  if (updateSchedule.time) {
    const [hours, minutes] = updateSchedule.time.split(':');
    deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  return deadline;
}

module.exports = router;
