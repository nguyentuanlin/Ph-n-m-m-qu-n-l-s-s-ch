const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Book = require('../models/Book');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Middleware to ensure response structure
const ensureArrayResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && data.data && !Array.isArray(data.data)) {
      data.data = [];
    }
    return originalJson.call(this, data);
  };
  next();
};

// @desc    Get users for task assignment (all roles can access)
// @route   GET /api/users/for-assignment
// @access  Private
router.get('/for-assignment', protect, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .populate({
        path: 'unit',
        select: 'name code type',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'department', 
        select: 'name code',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'rank',
        select: 'name level category',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'position',
        select: 'name code level',
        options: { strictPopulate: false }
      })
      .select('fullName email role unit department rank position')
      .sort({ fullName: 1 });

    res.status(200).json({
      status: 'success',
      data: users || []
    });
  } catch (error) {
    console.error('Error fetching users for assignment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
});

// @desc    Test API - Get users without populate
// @route   GET /api/users/test
// @access  Private (Admin only)
router.get('/test', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('fullName email role unit department rank position')
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: users || [],
      message: 'Test API - Raw data without populate'
    });
  } catch (error) {
    console.error('Error in test API:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test API error',
      error: error.message
    });
  }
});

// @desc    Debug API - Check database connection and data
// @route   GET /api/users/debug
// @access  Private (Admin only)
router.get('/debug', protect, restrictTo('admin'), async (req, res) => {
  try {
    // Check if User model exists
    const userCount = await User.countDocuments();
    
    // Get first user to check structure
    const firstUser = await User.findOne().select('fullName email role');
    
    // Check if we can find users
    const allUsers = await User.find({}).limit(3).select('fullName email role');
    
    res.status(200).json({
      status: 'success',
      data: {
        userCount,
        firstUser,
        allUsers: allUsers || [],
        isArray: Array.isArray(allUsers),
        type: typeof allUsers
      },
      message: 'Debug API - Database connection and data check'
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug API error',
      error: error.message
    });
  }
});

// @desc    Simple users API - Minimal populate
// @route   GET /api/users/simple
// @access  Private (Admin only)
router.get('/simple', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const users = await User.find({})
      .populate('rank', 'name')
      .populate('unit', 'name')
      .populate('department', 'name')
      .populate('position', 'name')
      .select('fullName email role unit department rank position')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({});

    res.status(200).json({
      status: 'success',
      data: users || [],
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in simple users API:', error);
    res.status(500).json({
      status: 'error',
      message: 'Simple users API error',
      error: error.message
    });
  }
});

// @desc    Emergency users API - No populate at all
// @route   GET /api/users/emergency
// @access  Private (Admin only)
router.get('/emergency', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const users = await User.find({})
      .select('fullName email role unit department rank position isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({});

    // Transform data to ensure it's always an array
    const safeUsers = Array.isArray(users) ? users.map(user => ({
      _id: user._id,
      fullName: user.fullName || 'N/A',
      email: user.email || 'N/A',
      role: user.role || 'staff',
      unit: user.unit || null,
      department: user.department || null,
      rank: user.rank || null,
      position: user.position || null,
      isActive: user.isActive !== undefined ? user.isActive : true,
      createdAt: user.createdAt
    })) : [];

    res.status(200).json({
      status: 'success',
      data: safeUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in emergency users API:', error);
    res.status(500).json({
      status: 'error',
      message: 'Emergency users API error',
      error: error.message
    });
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, restrictTo('admin'), auditLogger(), ensureArrayResponse, async (req, res) => {
  try {
    const { page = 1, limit = 10, department, role, search } = req.query;
    const query = {};

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with simple populate to avoid errors
    let users = [];
    try {
      users = await User.find(query)
        .populate('rank', 'name level category')
        .populate('unit', 'name code type')
        .populate('department', 'name code')
        .populate('position', 'name code level')
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } catch (populateError) {
      console.warn('Populate error, falling back to basic query:', populateError.message);
      // Fallback to basic query without populate
      users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await User.countDocuments(query);

    // Ensure we always return an array
    const safeUsers = Array.isArray(users) ? users : [];

    res.status(200).json({
      status: 'success',
      data: safeUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in users API:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, auditLogger(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('rank', 'name level category')
      .populate('unit', 'name code type')
      .populate('department', 'name code')
      .populate('position', 'name code level')
      .populate('assignedBooks.bookId', 'name code type department')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'staff' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
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

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, restrictTo('admin'), auditLogger(), [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'commander', 'staff'])
    .withMessage('Invalid role'),
  body('rank')
    .notEmpty()
    .withMessage('Rank is required')
    .isMongoId()
    .withMessage('Invalid rank ID'),
  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .isMongoId()
    .withMessage('Invalid unit ID'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isMongoId()
    .withMessage('Invalid department ID'),
  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isMongoId()
    .withMessage('Invalid position ID'),
  body('duty')
    .notEmpty()
    .withMessage('Duty is required')
    .trim(),
  body('phone')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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

    const { fullName, email, username, password, role, rank, unit, department, position, duty, phone, isActive = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      email,
      username,
      password,
      role,
      rank,
      unit,
      department,
      position,
      duty,
      phone,
      isActive
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userResponse
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
router.put('/:id', protect, restrictTo('admin'), auditLogger(), [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'commander', 'staff'])
    .withMessage('Invalid role'),
  body('rank')
    .optional()
    .isMongoId()
    .withMessage('Invalid rank ID'),
  body('unit')
    .optional()
    .isMongoId()
    .withMessage('Invalid unit ID'),
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID'),
  body('position')
    .optional()
    .isMongoId()
    .withMessage('Invalid position ID'),
  body('duty')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Only admin can update users

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password')
     .populate('assignedBooks.bookId', 'name code type');

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: updatedUser
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    // Remove user from assigned books
    await Book.updateMany(
      { assignedTo: user._id },
      { $unset: { assignedTo: 1 } }
    );

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
router.get('/:id/stats', protect, auditLogger(), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check access permissions
    if (req.user.role === 'staff' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const BookEntry = require('../models/BookEntry');
    const moment = require('moment');

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Admin can see all stats, users can only see their own

    const now = new Date();
    const startOfMonth = moment().startOf('month').toDate();
    const startOfWeek = moment().startOf('week').toDate();

    // Get statistics
    const [
      totalEntries,
      monthlyEntries,
      weeklyEntries,
      onTimeEntries,
      lateEntries,
      pendingEntries,
      approvedEntries,
      rejectedEntries
    ] = await Promise.all([
      BookEntry.countDocuments({ userId }),
      BookEntry.countDocuments({ 
        userId, 
        entryDate: { $gte: startOfMonth } 
      }),
      BookEntry.countDocuments({ 
        userId, 
        entryDate: { $gte: startOfWeek } 
      }),
      BookEntry.countDocuments({ 
        userId, 
        isOnTime: true,
        status: 'submitted'
      }),
      BookEntry.countDocuments({ 
        userId, 
        isOnTime: false,
        status: 'submitted'
      }),
      BookEntry.countDocuments({ 
        userId, 
        status: 'draft'
      }),
      BookEntry.countDocuments({ 
        userId, 
        status: 'approved'
      }),
      BookEntry.countDocuments({ 
        userId, 
        status: 'rejected'
      })
    ]);

    // Calculate completion rate
    const completionRate = totalEntries > 0 ? 
      ((approvedEntries / totalEntries) * 100).toFixed(1) : 0;

    // Calculate on-time rate
    const onTimeRate = (onTimeEntries + lateEntries) > 0 ? 
      ((onTimeEntries / (onTimeEntries + lateEntries)) * 100).toFixed(1) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalEntries,
          monthlyEntries,
          weeklyEntries,
          onTimeEntries,
          lateEntries,
          pendingEntries,
          approvedEntries,
          rejectedEntries,
          completionRate: parseFloat(completionRate),
          onTimeRate: parseFloat(onTimeRate)
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

// @desc    Get departments
// @route   GET /api/users/departments
// @access  Private (Admin only)
router.get('/departments', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const query = {};
    
    // Admin can see all departments

    const departments = await User.distinct('department', query);
    
    res.status(200).json({
      status: 'success',
      data: {
        departments
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
