const express = require('express');
const { body, validationResult } = require('express-validator');
const Position = require('../models/Position');
const Department = require('../models/Department');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /api/positions:
 *   get:
 *     summary: Lấy danh sách chức vụ
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách chức vụ
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
 *                     positions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Position'
 */
// @desc    Get all positions
// @route   GET /api/positions
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 50, department, level, isActive } = req.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    if (level) {
      query.level = level;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const positions = await Position.find(query)
      .populate('department', 'name code')
      .populate('requirements.minRank', 'name level')
      .sort({ level: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Position.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: positions,
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

/**
 * @swagger
 * /api/positions:
 *   post:
 *     summary: Tạo chức vụ mới
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - department
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               department:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [Junior, Senior, Management, Executive]
 *               requirements:
 *                 type: object
 *                 properties:
 *                   minRank:
 *                     type: string
 *                   experience:
 *                     type: number
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo chức vụ thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Create new position
// @route   POST /api/positions
// @access  Private (Admin only)
router.post('/', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .notEmpty()
    .withMessage('Position name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Position code is required')
    .trim(),
  body('department')
    .isMongoId()
    .withMessage('Invalid department ID'),
  body('level')
    .isIn(['Junior', 'Senior', 'Management', 'Executive'])
    .withMessage('Invalid level'),
  body('requirements.minRank')
    .optional()
    .isMongoId()
    .withMessage('Invalid minimum rank ID'),
  body('requirements.experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  body('responsibilities')
    .optional()
    .isArray()
    .withMessage('Responsibilities must be an array'),
  body('description')
    .optional()
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code, department, level, requirements, responsibilities, description } = req.body;

    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    const position = await Position.create({
      name,
      code: code.toUpperCase(),
      department,
      level,
      requirements: requirements || {},
      responsibilities: responsibilities || [],
      description
    });

    const populatedPosition = await Position.findById(position._id)
      .populate('department', 'name code')
      .populate('requirements.minRank', 'name level');

    res.status(201).json({
      status: 'success',
      message: 'Position created successfully',
      data: {
        position: populatedPosition
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

/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     summary: Cập nhật chức vụ
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               department:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [Junior, Senior, Management, Executive]
 *               requirements:
 *                 type: object
 *                 properties:
 *                   minRank:
 *                     type: string
 *                   experience:
 *                     type: number
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Update position
// @route   PUT /api/positions/:id
// @access  Private (Admin only)
router.put('/:id', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .optional()
    .trim(),
  body('code')
    .optional()
    .trim(),
  body('department')
    .optional()
    .isMongoId(),
  body('level')
    .optional()
    .isIn(['Junior', 'Senior', 'Management', 'Executive']),
  body('requirements.minRank')
    .optional()
    .isMongoId(),
  body('requirements.experience')
    .optional()
    .isInt({ min: 0 }),
  body('responsibilities')
    .optional()
    .isArray(),
  body('description')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    // Check if department exists if provided
    if (updateData.department) {
      const departmentExists = await Department.findById(updateData.department);
      if (!departmentExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Department not found'
        });
      }
    }

    const position = await Position.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name code')
     .populate('requirements.minRank', 'name level');

    if (!position) {
      return res.status(404).json({
        status: 'error',
        message: 'Position not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Position updated successfully',
      data: {
        position
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

/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     summary: Xóa chức vụ
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Delete position
// @route   DELETE /api/positions/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);

    if (!position) {
      return res.status(404).json({
        status: 'error',
        message: 'Position not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Position deleted successfully'
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
