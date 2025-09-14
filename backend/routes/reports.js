const express = require('express');
const { body, validationResult } = require('express-validator');
const BookEntry = require('../models/BookEntry');
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const moment = require('moment');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', protect, auditLogger(), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    // Calculate start date based on period
    switch (period) {
      case 'week':
        startDate = moment().startOf('week').toDate();
        break;
      case 'month':
        startDate = moment().startOf('month').toDate();
        break;
      case 'quarter':
        startDate = moment().startOf('quarter').toDate();
        break;
      case 'year':
        startDate = moment().startOf('year').toDate();
        break;
      default:
        startDate = moment().startOf('month').toDate();
    }

    const query = { entryDate: { $gte: startDate, $lte: now } };

    // Filter by department for commander
    if (req.user.role === 'commander') {
      const users = await User.find({ department: req.user.department }).select('_id');
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    } else if (req.user.role === 'staff') {
      query.userId = req.user._id;
    }

    // Get statistics
    const [
      totalEntries,
      onTimeEntries,
      lateEntries,
      pendingEntries,
      approvedEntries,
      rejectedEntries,
      totalUsers,
      totalBooks
    ] = await Promise.all([
      BookEntry.countDocuments(query),
      BookEntry.countDocuments({ ...query, isOnTime: true, status: 'submitted' }),
      BookEntry.countDocuments({ ...query, isOnTime: false, status: 'submitted' }),
      BookEntry.countDocuments({ ...query, status: 'draft' }),
      BookEntry.countDocuments({ ...query, status: 'approved' }),
      BookEntry.countDocuments({ ...query, status: 'rejected' }),
      req.user.role === 'staff' ? 1 : 
        req.user.role === 'commander' ? 
          User.countDocuments({ department: req.user.department }) :
          User.countDocuments(),
      req.user.role === 'staff' ? 
        Book.countDocuments({ assignedTo: req.user._id }) :
        req.user.role === 'commander' ?
          Book.countDocuments({ department: req.user.department }) :
          Book.countDocuments()
    ]);

    // Calculate rates
    const completionRate = totalEntries > 0 ? 
      ((approvedEntries / totalEntries) * 100).toFixed(1) : 0;
    const onTimeRate = (onTimeEntries + lateEntries) > 0 ? 
      ((onTimeEntries / (onTimeEntries + lateEntries)) * 100).toFixed(1) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        period,
        stats: {
          totalEntries,
          onTimeEntries,
          lateEntries,
          pendingEntries,
          approvedEntries,
          rejectedEntries,
          totalUsers,
          totalBooks,
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

// @desc    Get performance report by user
// @route   GET /api/reports/performance
// @access  Private (Admin/Commander only)
router.get('/performance', protect, restrictTo('admin', 'commander'), async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department, 
      userId,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {};
    const userQuery = {};

    // Date range filter
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    // Department filter
    if (department) {
      userQuery.department = department;
    } else if (req.user.role === 'commander') {
      userQuery.department = req.user.department;
    }

    // User filter
    if (userId) {
      query.userId = userId;
    }

    // Get users based on filters
    const users = await User.find(userQuery).select('_id fullName email department position');
    const userIds = users.map(user => user._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        pagination: {
          current: parseInt(page),
          pages: 0,
          total: 0
        }
      });
    }

    query.userId = { $in: userIds };

    // Get performance data
    const performanceData = await BookEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          totalEntries: { $sum: 1 },
          onTimeEntries: {
            $sum: { $cond: [{ $eq: ['$isOnTime', true] }, 1, 0] }
          },
          lateEntries: {
            $sum: { $cond: [{ $eq: ['$isOnTime', false] }, 1, 0] }
          },
          approvedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pendingEntries: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          fullName: '$user.fullName',
          email: '$user.email',
          department: '$user.department',
          position: '$user.position',
          totalEntries: 1,
          onTimeEntries: 1,
          lateEntries: 1,
          approvedEntries: 1,
          rejectedEntries: 1,
          pendingEntries: 1,
          onTimeRate: {
            $cond: [
              { $gt: [{ $add: ['$onTimeEntries', '$lateEntries'] }, 0] },
              {
                $multiply: [
                  { $divide: ['$onTimeEntries', { $add: ['$onTimeEntries', '$lateEntries'] }] },
                  100
                ]
              },
              0
            ]
          },
          completionRate: {
            $cond: [
              { $gt: ['$totalEntries', 0] },
              { $multiply: [{ $divide: ['$approvedEntries', '$totalEntries'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { onTimeRate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await BookEntry.aggregate([
      { $match: query },
      { $group: { _id: '$userId' } },
      { $count: 'total' }
    ]);

    res.status(200).json({
      status: 'success',
      data: performanceData,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil((total[0]?.total || 0) / limit),
        total: total[0]?.total || 0
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

// @desc    Get book completion report
// @route   GET /api/reports/books
// @access  Private (Admin/Commander only)
router.get('/books', protect, restrictTo('admin', 'commander'), async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department, 
      type,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {};

    // Department filter
    if (department) {
      query.department = department;
    } else if (req.user.role === 'commander') {
      query.department = req.user.department;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Get books
    const books = await Book.find(query)
      .populate('assignedTo', 'fullName email department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    // Get completion data for each book
    const bookCompletionData = await Promise.all(
      books.map(async (book) => {
        const entryQuery = { bookId: book._id };
        
        if (startDate || endDate) {
          entryQuery.entryDate = {};
          if (startDate) entryQuery.entryDate.$gte = new Date(startDate);
          if (endDate) entryQuery.entryDate.$lte = new Date(endDate);
        }

        const [
          totalEntries,
          onTimeEntries,
          lateEntries,
          approvedEntries,
          pendingEntries
        ] = await Promise.all([
          BookEntry.countDocuments(entryQuery),
          BookEntry.countDocuments({ ...entryQuery, isOnTime: true, status: 'submitted' }),
          BookEntry.countDocuments({ ...entryQuery, isOnTime: false, status: 'submitted' }),
          BookEntry.countDocuments({ ...entryQuery, status: 'approved' }),
          BookEntry.countDocuments({ ...entryQuery, status: 'draft' })
        ]);

        const onTimeRate = (onTimeEntries + lateEntries) > 0 ? 
          ((onTimeEntries / (onTimeEntries + lateEntries)) * 100).toFixed(1) : 0;
        const completionRate = totalEntries > 0 ? 
          ((approvedEntries / totalEntries) * 100).toFixed(1) : 0;

        return {
          ...book.toObject(),
          stats: {
            totalEntries,
            onTimeEntries,
            lateEntries,
            approvedEntries,
            pendingEntries,
            onTimeRate: parseFloat(onTimeRate),
            completionRate: parseFloat(completionRate)
          }
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: bookCompletionData,
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

// @desc    Get late entries report
// @route   GET /api/reports/late-entries
// @access  Private (Admin/Commander only)
router.get('/late-entries', protect, restrictTo('admin', 'commander'), async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = { isOnTime: false, status: 'submitted' };

    // Date range filter
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    // Department filter
    if (department) {
      const users = await User.find({ department }).select('_id');
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    } else if (req.user.role === 'commander') {
      const users = await User.find({ department: req.user.department }).select('_id');
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }

    const lateEntries = await BookEntry.find(query)
      .populate('userId', 'fullName email department position')
      .populate('bookId', 'name code type department')
      .sort({ entryDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BookEntry.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: lateEntries,
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

// @desc    Export report data
// @route   GET /api/reports/export
// @access  Private (Admin/Commander only)
router.get('/export', protect, restrictTo('admin', 'commander'), async (req, res) => {
  try {
    const { 
      type = 'performance',
      startDate, 
      endDate, 
      department,
      format = 'json'
    } = req.query;

    // This is a basic implementation
    // In production, you would use libraries like xlsx or csv-writer
    
    let data = {};
    
    switch (type) {
      case 'performance':
        // Get performance data (similar to performance endpoint)
        data = { message: 'Performance export data' };
        break;
      case 'books':
        // Get book completion data
        data = { message: 'Books export data' };
        break;
      case 'late-entries':
        // Get late entries data
        data = { message: 'Late entries export data' };
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid export type'
        });
    }

    res.status(200).json({
      status: 'success',
      data: {
        type,
        format,
        data,
        exportedAt: new Date().toISOString()
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
