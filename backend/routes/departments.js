const express = require('express');
const { body, validationResult } = require('express-validator');
const Department = require('../models/Department');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Lấy danh sách phòng ban
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng ban
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
 *                     departments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Department'
 */
// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const departments = await Department.find(query)
      .populate('head', 'fullName rank')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Department.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        departments,
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
 * /api/departments:
 *   post:
 *     summary: Tạo phòng ban mới
 *     tags: [Departments]
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               head:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo phòng ban thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin only)
router.post('/', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .trim(),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('head')
    .optional()
    .isMongoId()
    .withMessage('Invalid head ID'),
  body('responsibilities')
    .optional()
    .isArray()
    .withMessage('Responsibilities must be an array')
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

    const { name, code, description, head, responsibilities } = req.body;

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      head,
      responsibilities: responsibilities || []
    });

    const populatedDepartment = await Department.findById(department._id)
      .populate('head', 'fullName rank');

    res.status(201).json({
      status: 'success',
      message: 'Department created successfully',
      data: {
        department: populatedDepartment
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
 * /api/departments/{id}:
 *   put:
 *     summary: Cập nhật phòng ban
 *     tags: [Departments]
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
 *               description:
 *                 type: string
 *               head:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
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
// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
router.put('/:id', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .optional()
    .trim(),
  body('code')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('head')
    .optional()
    .isMongoId(),
  body('responsibilities')
    .optional()
    .isArray(),
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

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('head', 'fullName rank');

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Department updated successfully',
      data: {
        department
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
 * /api/departments/{id}:
 *   delete:
 *     summary: Xóa phòng ban
 *     tags: [Departments]
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
// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        status: 'error',
        message: 'Department not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Department deleted successfully'
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
