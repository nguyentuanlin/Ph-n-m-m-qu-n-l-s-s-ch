const express = require('express');
const { body, validationResult } = require('express-validator');
const Rank = require('../models/Rank');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * /api/ranks:
 *   get:
 *     summary: Lấy danh sách cấp bậc
 *     tags: [Ranks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách cấp bậc
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
 *                     ranks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Rank'
 */
// @desc    Get all ranks
// @route   GET /api/ranks
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 50, category, isActive } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const ranks = await Rank.find(query)
      .sort({ level: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rank.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        ranks,
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
 * /api/ranks:
 *   post:
 *     summary: Tạo cấp bậc mới
 *     tags: [Ranks]
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
 *               - level
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [Enlisted, NCO, Officer, General]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo cấp bậc thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
// @desc    Create new rank
// @route   POST /api/ranks
// @access  Private (Admin only)
router.post('/', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .notEmpty()
    .withMessage('Rank name is required')
    .trim(),
  body('level')
    .isInt({ min: 1 })
    .withMessage('Level must be a positive integer'),
  body('category')
    .isIn(['Enlisted', 'NCO', 'Officer', 'General'])
    .withMessage('Invalid category'),
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

    const { name, level, category, description } = req.body;

    const rank = await Rank.create({
      name,
      level,
      category,
      description
    });

    res.status(201).json({
      status: 'success',
      message: 'Rank created successfully',
      data: {
        rank
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
 * /api/ranks/{id}:
 *   put:
 *     summary: Cập nhật cấp bậc
 *     tags: [Ranks]
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
 *               level:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [Enlisted, NCO, Officer, General]
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
// @desc    Update rank
// @route   PUT /api/ranks/:id
// @access  Private (Admin only)
router.put('/:id', protect, restrictTo('admin'), auditLogger(), [
  body('name')
    .optional()
    .trim(),
  body('level')
    .optional()
    .isInt({ min: 1 }),
  body('category')
    .optional()
    .isIn(['Enlisted', 'NCO', 'Officer', 'General']),
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

    const rank = await Rank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!rank) {
      return res.status(404).json({
        status: 'error',
        message: 'Rank not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Rank updated successfully',
      data: {
        rank
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
 * /api/ranks/{id}:
 *   delete:
 *     summary: Xóa cấp bậc
 *     tags: [Ranks]
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
// @desc    Delete rank
// @route   DELETE /api/ranks/:id
// @access  Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), auditLogger(), async (req, res) => {
  try {
    const rank = await Rank.findByIdAndDelete(req.params.id);

    if (!rank) {
      return res.status(404).json({
        status: 'error',
        message: 'Rank not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Rank deleted successfully'
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
