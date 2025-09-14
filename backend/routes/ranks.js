const express = require('express');
const { body, validationResult } = require('express-validator');
const Rank = require('../models/Rank');
const { protect, restrictTo } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Test endpoint without authentication
router.get('/test', async (req, res) => {
  try {
    console.log('Test endpoint called');
    const count = await Rank.countDocuments();
    res.status(200).json({
      status: 'success',
      message: 'Database connection working',
      rankCount: count
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test create endpoint without authentication
router.post('/test-create', async (req, res) => {
  try {
    console.log('Test create endpoint called with body:', req.body);
    
    const { name, level, category, description } = req.body;
    
    if (!name || !level || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, level, category'
      });
    }

    const rank = await Rank.create({
      name,
      level: parseInt(level),
      category,
      description: description || ''
    });

    console.log('Test rank created successfully:', rank);

    res.status(201).json({
      status: 'success',
      message: 'Test rank created successfully',
      data: {
        rank
      }
    });
  } catch (error) {
    console.error('Error creating test rank:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// Test create with simple validation
router.post('/simple-create', async (req, res) => {
  try {
    console.log('Simple create endpoint called with body:', req.body);
    
    const { name, level, category, description } = req.body;
    
    // Create rank with minimal validation
    const rank = await Rank.create({
      name: name || 'Test Rank',
      level: level || 99,
      category: category || 'Enlisted',
      description: description || 'Test description'
    });

    console.log('Simple rank created successfully:', rank);

    res.status(201).json({
      status: 'success',
      message: 'Simple rank created successfully',
      data: {
        rank
      }
    });
  } catch (error) {
    console.error('Error creating simple rank:', error);
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
    console.log('Ranks API called');
    const { page = 1, limit = 50, category, isActive } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    console.log('Query:', query);

    const ranks = await Rank.find(query)
      .sort({ level: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Found ranks:', ranks.length);

    const total = await Rank.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: ranks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in ranks API:', error);
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
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    console.log('POST /api/ranks called with body:', req.body);
    console.log('User making request:', req.user);
    
    // Simple validation
    const { name, level, category, description } = req.body;
    
    if (!name || !level || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, level, category'
      });
    }

    console.log('Creating rank with data:', { name, level, category, description });

    const rank = await Rank.create({
      name: name.trim(),
      level: parseInt(level),
      category,
      description: description ? description.trim() : ''
    });

    console.log('Rank created successfully:', rank);

    res.status(201).json({
      status: 'success',
      message: 'Rank created successfully',
      data: {
        rank
      }
    });
  } catch (error) {
    console.error('Error creating rank:', error);
    
    // Handle unique constraint errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'level' ? 'cấp độ' : 'tên';
      return res.status(400).json({
        status: 'error',
        message: `Cấp bậc với ${fieldName} này đã tồn tại. Vui lòng chọn ${fieldName} khác.`,
        field: field
      });
    }
    
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
