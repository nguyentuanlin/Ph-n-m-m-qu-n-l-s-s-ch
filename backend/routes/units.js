const express = require('express');
const { body, validationResult } = require('express-validator');
const Unit = require('../models/Unit');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Lấy danh sách đơn vị
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn vị
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
 *                     units:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Unit'
 */
// @desc    Get all units
// @route   GET /api/units
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 50, type, isActive } = req.query;
    const query = {};

    if (type) {
      query.type = type;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const units = await Unit.find(query)
      .populate('parentUnit', 'name code type')
      .populate('commander', 'fullName rank')
      .sort({ type: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Unit.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        units,
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

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Tạo đơn vị mới
 *     tags: [Units]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Tiểu đội, Trung đội, Đại đội, Tiểu đoàn, Trung đoàn, Lữ đoàn, Sư đoàn, Quân đoàn, Quân khu]
 *               parentUnit:
 *                 type: string
 *               commander:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đơn vị thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Create new unit
// @route   POST /api/units
// @access  Private (Admin/Commander only)
router.post('/', protect, restrictTo('admin', 'commander'), auditLogger(), [
  body('name')
    .notEmpty()
    .withMessage('Unit name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Unit code is required')
    .trim(),
  body('type')
    .isIn(['Tiểu đội', 'Trung đội', 'Đại đội', 'Tiểu đoàn', 'Trung đoàn', 'Lữ đoàn', 'Sư đoàn', 'Quân đoàn', 'Quân khu'])
    .withMessage('Invalid unit type'),
  body('parentUnit')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent unit ID'),
  body('commander')
    .optional()
    .isMongoId()
    .withMessage('Invalid commander ID'),
  body('location')
    .optional()
    .trim(),
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

    const { name, code, type, parentUnit, commander, location, description } = req.body;

    const unit = await Unit.create({
      name,
      code: code.toUpperCase(),
      type,
      parentUnit,
      commander,
      location,
      description
    });

    const populatedUnit = await Unit.findById(unit._id)
      .populate('parentUnit', 'name code type')
      .populate('commander', 'fullName rank');

    res.status(201).json({
      status: 'success',
      message: 'Unit created successfully',
      data: {
        unit: populatedUnit
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
 * /api/units/{id}:
 *   put:
 *     summary: Cập nhật đơn vị
 *     tags: [Units]
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
 *               type:
 *                 type: string
 *                 enum: [Tiểu đội, Trung đội, Đại đội, Tiểu đoàn, Trung đoàn, Lữ đoàn, Sư đoàn, Quân đoàn, Quân khu]
 *               parentUnit:
 *                 type: string
 *               commander:
 *                 type: string
 *               location:
 *                 type: string
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
// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private (Admin/Commander only)
router.put('/:id', protect, restrictTo('admin', 'commander'), auditLogger(), [
  body('name')
    .optional()
    .trim(),
  body('code')
    .optional()
    .trim(),
  body('type')
    .optional()
    .isIn(['Tiểu đội', 'Trung đội', 'Đại đội', 'Tiểu đoàn', 'Trung đoàn', 'Lữ đoàn', 'Sư đoàn', 'Quân đoàn', 'Quân khu']),
  body('parentUnit')
    .optional()
    .isMongoId(),
  body('commander')
    .optional()
    .isMongoId(),
  body('location')
    .optional()
    .trim(),
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

    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentUnit', 'name code type')
     .populate('commander', 'fullName rank');

    if (!unit) {
      return res.status(404).json({
        status: 'error',
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Unit updated successfully',
      data: {
        unit
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
 * /api/units/{id}:
 *   delete:
 *     summary: Xóa đơn vị
 *     tags: [Units]
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
// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);

    if (!unit) {
      return res.status(404).json({
        status: 'error',
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Unit deleted successfully'
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
