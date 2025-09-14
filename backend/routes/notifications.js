const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, auditLogger(), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead, priority } = req.query;
    const query = { recipient: req.user._id };

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by read status
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'fullName email')
      .populate('relatedData.bookId', 'name code')
      .populate('relatedData.entryId', 'entryDate status')
      .populate('relatedData.userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.status(200).json({
      status: 'success',
      data: notifications,
      unreadCount,
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

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, auditLogger(), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        notification
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

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, auditLogger(), async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, auditLogger(), async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
router.delete('/', protect, auditLogger(), async (req, res) => {
  try {
    const { type, isRead } = req.query;
    const query = { recipient: req.user._id };

    if (type) {
      query.type = type;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const result = await Notification.deleteMany(query);

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} notifications deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
router.get('/settings', protect, auditLogger(), async (req, res) => {
  try {
    // This would typically come from user preferences
    // For now, return default settings
    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      reminderTime: '07:00',
      escalationTime: '09:00',
      types: {
        reminder: true,
        deadline_warning: true,
        deadline_missed: true,
        submission: false,
        approval: true,
        rejection: true,
        escalation: true,
        system: true
      }
    };

    res.status(200).json({
      status: 'success',
      data: {
        settings
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

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
router.put('/settings', protect, [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('pushNotifications must be a boolean'),
  body('reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('reminderTime must be in HH:MM format'),
  body('escalationTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('escalationTime must be in HH:MM format')
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

    // In a real application, you would save these settings to the user model
    // For now, just return the updated settings
    const settings = {
      emailNotifications: req.body.emailNotifications ?? true,
      pushNotifications: req.body.pushNotifications ?? true,
      reminderTime: req.body.reminderTime ?? '07:00',
      escalationTime: req.body.escalationTime ?? '09:00',
      types: {
        reminder: req.body.types?.reminder ?? true,
        deadline_warning: req.body.types?.deadline_warning ?? true,
        deadline_missed: req.body.types?.deadline_missed ?? true,
        submission: req.body.types?.submission ?? false,
        approval: req.body.types?.approval ?? true,
        rejection: req.body.types?.rejection ?? true,
        escalation: req.body.types?.escalation ?? true,
        system: req.body.types?.system ?? true
      }
    };

    res.status(200).json({
      status: 'success',
      message: 'Notification settings updated successfully',
      data: {
        settings
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

// @desc    Create notification (for testing or admin use)
// @route   POST /api/notifications
// @access  Private (Admin only)
router.post('/', protect, [
  body('recipient')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('type')
    .isIn(['reminder', 'deadline_warning', 'deadline_missed', 'submission', 'approval', 'rejection', 'escalation', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
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

    // Only admin can create notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const {
      recipient,
      type,
      title,
      message,
      priority = 'medium',
      relatedData,
      expiresAt
    } = req.body;

    const notification = await Notification.create({
      recipient,
      sender: req.user._id,
      type,
      title,
      message,
      priority,
      relatedData,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('recipient', 'fullName email')
      .populate('sender', 'fullName email');

    res.status(201).json({
      status: 'success',
      message: 'Notification created successfully',
      data: {
        notification: populatedNotification
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
