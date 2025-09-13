const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *               - rank
 *               - unit
 *               - department
 *               - position
 *               - duty
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *                 maxLength: 100
 *               rank:
 *                 type: string
 *                 description: Rank ID (ObjectId)
 *               unit:
 *                 type: string
 *                 description: Unit ID (ObjectId)
 *               department:
 *                 type: string
 *                 description: Department ID (ObjectId)
 *               position:
 *                 type: string
 *                 description: Position ID (ObjectId)
 *               duty:
 *                 type: string
 *                 enum: [Huấn luyện, Chiến đấu, Hậu cần, Tham mưu, Chính trị, Kỹ thuật, Quân y, Tài chính, Pháp chế, Đối ngoại, Công nghệ thông tin, An ninh]
 *               role:
 *                 type: string
 *                 enum: [admin, commander, logistic, staff]
 *                 default: staff
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Lỗi validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (only admin can register)
router.post('/register', auditLogger(), [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim(),
  body('rank')
    .isMongoId()
    .withMessage('Valid rank ID is required'),
  body('unit')
    .isMongoId()
    .withMessage('Valid unit ID is required'),
  body('department')
    .isMongoId()
    .withMessage('Valid department ID is required'),
  body('position')
    .isMongoId()
    .withMessage('Valid position ID is required'),
  body('duty')
    .notEmpty()
    .withMessage('Duty is required')
    .isIn(['Huấn luyện', 'Chiến đấu', 'Hậu cần', 'Tham mưu', 'Chính trị', 'Kỹ thuật', 'Quân y', 'Tài chính', 'Pháp chế', 'Đối ngoại', 'Công nghệ thông tin', 'An ninh'])
    .withMessage('Invalid duty'),
  body('role')
    .optional()
    .isIn(['admin', 'commander', 'logistic', 'staff'])
    .withMessage('Invalid role')
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

    const { username, email, password, fullName, rank, unit, department, position, duty, role = 'staff', phone } = req.body;

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

    // Validate that all referenced IDs exist
    const Rank = require('../models/Rank');
    const Unit = require('../models/Unit');
    const Department = require('../models/Department');
    const Position = require('../models/Position');

    const [rankExists, unitExists, departmentExists, positionExists] = await Promise.all([
      Rank.findById(rank),
      Unit.findById(unit),
      Department.findById(department),
      Position.findById(position)
    ]);

    if (!rankExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Rank not found'
      });
    }

    if (!unitExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Unit not found'
      });
    }

    if (!departmentExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    if (!positionExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Position not found'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      rank,
      unit,
      department,
      position,
      duty,
      role,
      phone
    });

    // Generate token
    const token = generateToken(user);

    // Populate user data
    const populatedUser = await User.findById(user._id)
      .populate('rank', 'name level category')
      .populate('unit', 'name code type')
      .populate('department', 'name code')
      .populate('position', 'name code level');

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: populatedUser,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         description: Thông tin đăng nhập không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', auditLogger(), [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error during login',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('rank', 'name level category')
      .populate('unit', 'name code type')
      .populate('department', 'name code')
      .populate('position', 'name code level')
      .populate('assignedBooks.bookId', 'name code type department');

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

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .trim(),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty')
    .trim(),
  body('position')
    .optional()
    .notEmpty()
    .withMessage('Position cannot be empty')
    .trim()
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

    const { fullName, phone, department, position } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (position) updateData.position = position;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
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
