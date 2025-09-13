const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const BookEntry = require('../models/BookEntry');
const User = require('../models/User');
const { protect, restrictTo, checkBookAccess } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// @desc    Get books for task assignment (all roles can access)
// @route   GET /api/books/for-assignment
// @access  Private
router.get('/for-assignment', protect, async (req, res) => {
  try {
    const books = await Book.find({ isActive: true })
      .populate('unit', 'name')
      .populate('department', 'name')
      .select('title bookNumber description unit department')
      .sort({ title: 1 });

    res.status(200).json({
      status: 'success',
      data: books
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy danh sách sổ sách',
      error: error.message
    });
  }
});

// @desc    Get all books
// @route   GET /api/books
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status, type } = req.query;
    const query = {};

    // Filter by department (commander can see all, staff only their department)
    if (req.user.role === 'staff') {
      query.department = req.user.department;
    } else if (department) {
      query.department = department;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Staff can only see their assigned books
    if (req.user.role === 'staff') {
      query.assignedTo = req.user._id;
    }

    const books = await Book.find(query)
      .populate('assignedTo', 'fullName email department position')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        books,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
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

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
router.get('/:id', protect, checkBookAccess, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('assignedTo', 'fullName email department position')
      .populate('createdBy', 'fullName email');

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        book
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

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin/Commander only)
router.post('/', protect, restrictTo('admin', 'commander'), auditLogger(), [
  body('name')
    .notEmpty()
    .withMessage('Book name is required')
    .isLength({ max: 200 })
    .withMessage('Book name cannot exceed 200 characters'),
  body('code')
    .notEmpty()
    .withMessage('Book code is required')
    .isLength({ max: 50 })
    .withMessage('Book code cannot exceed 50 characters'),
  body('type')
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid book type'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('assignedTo')
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
  body('updateSchedule.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Invalid update frequency')
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

    const {
      name,
      code,
      type,
      description,
      department,
      assignedTo,
      updateSchedule,
      alertConfig,
      template
    } = req.body;

    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Assigned user not found'
      });
    }

    // Check if book code already exists
    const existingBook = await Book.findOne({ code: code.toUpperCase() });
    if (existingBook) {
      return res.status(400).json({
        status: 'error',
        message: 'Book code already exists'
      });
    }

    const book = await Book.create({
      name,
      code: code.toUpperCase(),
      type,
      description,
      department,
      assignedTo,
      createdBy: req.user._id,
      updateSchedule: updateSchedule || {
        frequency: 'daily',
        time: '08:00'
      },
      alertConfig: alertConfig || {
        enabled: true,
        reminderTime: '07:00',
        escalationTime: '09:00',
        notifyCommander: true
      },
      template: template || { fields: [] }
    });

    // Add book to user's assigned books
    await User.findByIdAndUpdate(assignedTo, {
      $push: {
        assignedBooks: {
          bookId: book._id,
          assignedDate: new Date()
        }
      }
    });

    const populatedBook = await Book.findById(book._id)
      .populate('assignedTo', 'fullName email department position')
      .populate('createdBy', 'fullName email');

    res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: {
        book: populatedBook
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

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Commander only)
router.put('/:id', protect, restrictTo('admin', 'commander'), auditLogger(), [
  body('name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Book name cannot exceed 200 characters'),
  body('type')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid book type'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID')
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

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // If changing assigned user
    if (req.body.assignedTo && req.body.assignedTo !== book.assignedTo.toString()) {
      // Check if new assigned user exists
      const newAssignedUser = await User.findById(req.body.assignedTo);
      if (!newAssignedUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Assigned user not found'
        });
      }

      // Remove book from old user
      await User.findByIdAndUpdate(book.assignedTo, {
        $pull: { assignedBooks: { bookId: book._id } }
      });

      // Add book to new user
      await User.findByIdAndUpdate(req.body.assignedTo, {
        $push: {
          assignedBooks: {
            bookId: book._id,
            assignedDate: new Date()
          }
        }
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'fullName email department position')
     .populate('createdBy', 'fullName email');

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: {
        book: updatedBook
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

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Remove book from user's assigned books
    await User.findByIdAndUpdate(book.assignedTo, {
      $pull: { assignedBooks: { bookId: book._id } }
    });

    // Delete all entries for this book
    await BookEntry.deleteMany({ bookId: book._id });

    // Delete the book
    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully'
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
// @route   GET /api/books/:id/entries
// @access  Private
router.get('/:id/entries', protect, checkBookAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const query = { bookId: req.params.id };

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

    // Staff can only see their own entries
    if (req.user.role === 'staff') {
      query.userId = req.user._id;
    }

    const entries = await BookEntry.find(query)
      .populate('userId', 'fullName email department')
      .populate('reviewedBy', 'fullName email')
      .sort({ entryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BookEntry.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        entries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
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

module.exports = router;
