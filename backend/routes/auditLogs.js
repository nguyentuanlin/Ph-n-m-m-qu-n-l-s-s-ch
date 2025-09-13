const express = require('express');
const { body, query, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Audit log ID
 *         user:
 *           type: string
 *           description: User ID who performed the action
 *         userInfo:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *         action:
 *           type: string
 *           enum: [LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, ASSIGN, UNASSIGN, APPROVE, REJECT, EXPORT, IMPORT]
 *         resource:
 *           type: string
 *           enum: [USER, DEPARTMENT, UNIT, RANK, POSITION, BOOK, BOOK_ENTRY, NOTIFICATION, REPORT, AUTH, SYSTEM]
 *         resourceId:
 *           type: string
 *           description: ID of the resource being acted upon
 *         resourceName:
 *           type: string
 *           description: Name of the resource
 *         description:
 *           type: string
 *           description: Human-readable description of the action
 *         oldData:
 *           type: object
 *           description: Data before the change
 *         newData:
 *           type: object
 *           description: Data after the change
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 *         status:
 *           type: string
 *           enum: [SUCCESS, FAILED, PENDING]
 *         errorMessage:
 *           type: string
 *         executionTime:
 *           type: number
 *           description: Execution time in milliseconds
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Lấy danh sách audit logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Lọc theo user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, ASSIGN, UNASSIGN, APPROVE, REJECT, EXPORT, IMPORT]
 *         description: Lọc theo loại hành động
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *           enum: [USER, DEPARTMENT, UNIT, RANK, POSITION, BOOK, BOOK_ENTRY, NOTIFICATION, REPORT, AUTH, SYSTEM]
 *         description: Lọc theo loại tài nguyên
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILED, PENDING]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mô tả hoặc tên người dùng
 *     responses:
 *       200:
 *         description: Danh sách audit logs
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 */
// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin only)
router.get('/', protect, restrictTo('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().isIn(['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'ASSIGN', 'UNASSIGN', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT']).withMessage('Invalid action'),
  query('resource').optional().isIn(['USER', 'DEPARTMENT', 'UNIT', 'RANK', 'POSITION', 'BOOK', 'BOOK_ENTRY', 'NOTIFICATION', 'REPORT', 'AUTH', 'SYSTEM']).withMessage('Invalid resource'),
  query('status').optional().isIn(['SUCCESS', 'FAILED', 'PENDING']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
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
      page = 1,
      limit = 50,
      user,
      action,
      resource,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filters = {};
    
    if (user) {
      filters.user = user;
    }
    
    if (action) {
      filters.action = action;
    }
    
    if (resource) {
      filters.resource = resource;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = endDateTime;
      }
    }
    
    if (search) {
      filters.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'userInfo.fullName': { $regex: search, $options: 'i' } },
        { 'userInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Get logs with pagination
    const result = await AuditLog.getLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: -1
    });

    res.status(200).json({
      status: 'success',
      data: result
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
 * /api/audit-logs/stats:
 *   get:
 *     summary: Lấy thống kê audit logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Số ngày để thống kê
 *     responses:
 *       200:
 *         description: Thống kê audit logs
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
 *                     totalLogs:
 *                       type: integer
 *                     logsByAction:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     logsByResource:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           resource:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     logsByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     logsByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 */
// @desc    Get audit logs statistics
// @route   GET /api/audit-logs/stats
// @access  Private (Admin only)
router.get('/stats', protect, restrictTo('admin'), [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
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

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get various statistics
    const [
      totalLogs,
      logsByAction,
      logsByResource,
      logsByStatus,
      logsByDay,
      topUsers
    ] = await Promise.all([
      // Total logs
      AuditLog.countDocuments({ createdAt: { $gte: startDate } }),
      
      // Logs by action
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Logs by resource
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Logs by status
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Logs by day
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top users
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            user: { $arrayElemAt: ['$userInfo', 0] },
            count: 1
          }
        }
      ])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalLogs,
        logsByAction: logsByAction.map(item => ({
          action: item._id,
          count: item.count
        })),
        logsByResource: logsByResource.map(item => ({
          resource: item._id,
          count: item.count
        })),
        logsByStatus: logsByStatus.map(item => ({
          status: item._id,
          count: item.count
        })),
        logsByDay: logsByDay.map(item => ({
          date: item._id,
          count: item.count
        })),
        topUsers: topUsers.map(item => ({
          user: {
            fullName: item.user?.fullName || 'Unknown',
            email: item.user?.email || 'Unknown'
          },
          count: item.count
        }))
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
 * /api/audit-logs/user/{userId}:
 *   get:
 *     summary: Lấy hoạt động của một user cụ thể
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Số ngày để lấy hoạt động
 *     responses:
 *       200:
 *         description: Hoạt động của user
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
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     activitySummary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           resource:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: User không tồn tại
 */
// @desc    Get user activity
// @route   GET /api/audit-logs/user/:userId
// @access  Private (Admin only)
router.get('/user/:userId', protect, restrictTo('admin'), [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
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

    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;

    // Check if user exists
    const user = await User.findById(userId).select('fullName email role');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get user activity summary
    const activitySummary = await AuditLog.getUserActivitySummary(userId, days);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        activitySummary: activitySummary.map(item => ({
          action: item._id.action,
          resource: item._id.resource,
          count: item.count,
          lastActivity: item.lastActivity
        }))
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
 * /api/audit-logs/export:
 *   post:
 *     summary: Xuất audit logs ra file
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 enum: [csv, excel, json]
 *                 default: csv
 *               filters:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   action:
 *                     type: string
 *                   resource:
 *                     type: string
 *                   status:
 *                     type: string
 *     responses:
 *       200:
 *         description: File export thành công
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
 *                     downloadUrl:
 *                       type: string
 *                       description: URL để download file
 *                     filename:
 *                       type: string
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 */
// @desc    Export audit logs
// @route   POST /api/audit-logs/export
// @access  Private (Admin only)
router.post('/export', protect, restrictTo('admin'), [
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('format').optional().isIn(['csv', 'excel', 'json']).withMessage('Invalid format'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
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

    const { startDate, endDate, format = 'csv', filters = {} } = req.body;

    // Build filter object
    const queryFilters = { ...filters };
    
    if (startDate || endDate) {
      queryFilters.createdAt = {};
      if (startDate) {
        queryFilters.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        queryFilters.createdAt.$lte = endDateTime;
      }
    }

    // Get all matching logs
    const logs = await AuditLog.find(queryFilters)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();

    // For now, return a simple response
    // In a real implementation, you would generate and save the file
    res.status(200).json({
      status: 'success',
      message: 'Export feature will be implemented',
      data: {
        totalRecords: logs.length,
        format,
        filters: queryFilters
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
