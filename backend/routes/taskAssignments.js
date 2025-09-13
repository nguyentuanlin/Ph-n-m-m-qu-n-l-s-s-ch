const express = require('express');
const router = express.Router();
const TaskAssignment = require('../models/TaskAssignment');
const Book = require('../models/Book');
const BookEntry = require('../models/BookEntry');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Department = require('../models/Department');
const { protect: auth } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const reminderService = require('../services/reminderService');

// Middleware để kiểm tra quyền truy cập
const checkTaskPermission = async (req, res, next) => {
  try {
    const user = req.user;
    const taskId = req.params.id;
    
    if (user.role === 'admin') {
      return next();
    }
    
    if (taskId) {
      const task = await TaskAssignment.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Không tìm thấy công việc' });
      }
      
      // Kiểm tra quyền truy cập
      if (task.assignedTo.toString() !== user.id && 
          task.assignedBy.toString() !== user.id &&
          task.unit.toString() !== user.unit.toString()) {
        return res.status(403).json({ message: 'Không có quyền truy cập công việc này' });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi kiểm tra quyền truy cập', error: error.message });
  }
};

// @route   GET /api/task-assignments
// @desc    Lấy danh sách giao việc
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      assignedBy,
      unit,
      department,
      overdue,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Lọc theo vai trò người dùng
    if (user.role === 'admin') {
      // Admin có thể xem tất cả
    } else if (user.role === 'commander') {
      // Chỉ huy xem được công việc trong đơn vị
      query.unit = user.unit;
    } else {
      // Nhân viên chỉ xem được công việc được giao cho mình
      query.assignedTo = user.id;
    }

    // Áp dụng các bộ lọc
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (assignedBy) query.assignedBy = assignedBy;
    if (unit) query.unit = unit;
    if (department) query.department = department;
    if (overdue === 'true') {
      query.status = { $in: ['pending', 'in_progress'] };
      query.deadline = { $lt: new Date() };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tasks = await TaskAssignment.find(query)
      .populate('assignedBy', 'name email position')
      .populate('assignedTo', 'name email position')
      .populate('bookId', 'title bookNumber')
      .populate('bookEntryId', 'title entryNumber')
      .populate('unit', 'name')
      .populate('department', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TaskAssignment.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách giao việc', error: error.message });
  }
});

// @route   GET /api/task-assignments/stats
// @desc    Lấy thống kê giao việc
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;
    console.log('User for stats:', { id: user.id, role: user.role, unit: user.unit, department: user.department });
    
    let matchQuery = {};

    if (user.role === 'admin') {
      matchQuery = {};
    } else if (user.role === 'commander') {
      if (user.unit) {
        matchQuery.unit = user.unit;
      }
    } else {
      matchQuery.assignedTo = user.id;
    }

    console.log('Match query:', matchQuery);

    // Kiểm tra xem có TaskAssignment nào không
    const totalTasks = await TaskAssignment.countDocuments(matchQuery);
    console.log('Total tasks found:', totalTasks);

    // Nếu không có task nào, trả về stats rỗng
    if (totalTasks === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          overdue: 0,
          byStatus: {}
        }
      });
    }

    const stats = await TaskAssignment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Aggregation stats:', stats);

    const overdueCount = await TaskAssignment.countDocuments({
      ...matchQuery,
      status: { $in: ['pending', 'in_progress'] },
      deadline: { $lt: new Date() }
    });

    console.log('Overdue count:', overdueCount);

    // Xử lý kết quả aggregation an toàn
    const byStatus = {};
    if (stats && stats.length > 0) {
      stats.forEach(stat => {
        byStatus[stat._id] = stat.count;
      });
    }

    res.json({
      success: true,
      data: {
        total: totalTasks,
        overdue: overdueCount,
        byStatus: byStatus
      }
    });
  } catch (error) {
    console.error('Error in stats endpoint:', error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
});

// @route   GET /api/task-assignments/:id
// @desc    Lấy chi tiết giao việc
// @access  Private
router.get('/:id', auth, checkTaskPermission, async (req, res) => {
  try {
    const task = await TaskAssignment.findById(req.params.id)
      .populate('assignedBy', 'name email position unit department')
      .populate('assignedTo', 'name email position unit department')
      .populate('bookId', 'title bookNumber description')
      .populate('bookEntryId', 'title entryNumber content')
      .populate('unit', 'name description')
      .populate('department', 'name description')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('notes.author', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết giao việc', error: error.message });
  }
});

// @route   POST /api/task-assignments
// @desc    Tạo giao việc mới
// @access  Private
router.post('/', auth, auditLogger, async (req, res) => {
  try {
    console.log('Creating task assignment with data:', req.body);
    console.log('User creating task:', { id: req.user.id, role: req.user.role, unit: req.user.unit, department: req.user.department });

    const {
      title,
      description,
      bookId,
      bookEntryId,
      assignedTo,
      deadline,
      priority = 'medium',
      requiresApproval = false,
      unit,
      department,
      tags = [],
      reminderSettings = {}
    } = req.body;

    // Kiểm tra quyền tạo giao việc
    if (req.user.role !== 'admin' && req.user.role !== 'commander') {
      return res.status(403).json({ message: 'Không có quyền tạo giao việc' });
    }

    // Kiểm tra sổ sách và mục sổ sách tồn tại
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(400).json({ message: 'Sổ sách không tồn tại' });
    }

    const bookEntry = await BookEntry.findById(bookEntryId);
    if (!bookEntry) {
      return res.status(400).json({ message: 'Mục sổ sách không tồn tại' });
    }

    // Kiểm tra người nhận việc
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Người nhận việc không tồn tại' });
    }

    // Tạo giao việc mới
    const taskData = {
      title,
      description,
      bookId,
      bookEntryId,
      assignedBy: req.user.id,
      assignedTo,
      deadline: new Date(deadline),
      priority,
      requiresApproval,
      unit: unit || req.user.unit,
      department: department || req.user.department,
      tags,
      createdBy: req.user.id
    };

    console.log('Task data to save:', taskData);

    const task = new TaskAssignment(taskData);
    await task.save();

    console.log('Task saved successfully:', task._id);

    // Thêm nhắc nhở nếu được cấu hình
    if (reminderSettings.enabled) {
      const reminderTimes = reminderSettings.times || [];
      for (const time of reminderTimes) {
        const reminderDate = new Date(deadline);
        reminderDate.setHours(reminderDate.getHours() - time.hours);
        
        await task.addReminder(
          'notification',
          `Nhắc nhở: Công việc "${title}" sắp đến hạn`,
          reminderDate
        );
      }
    } else {
      // Tạo nhắc nhở tự động mặc định
      try {
        await reminderService.createAutomaticReminders(task._id);
      } catch (reminderError) {
        console.warn('Warning: Could not create automatic reminders:', reminderError.message);
        // Không fail toàn bộ request vì reminder không quan trọng
      }
    }

    // Populate để trả về thông tin đầy đủ
    await task.populate([
      { path: 'assignedBy', select: 'name email position' },
      { path: 'assignedTo', select: 'name email position' },
      { path: 'bookId', select: 'title bookNumber' },
      { path: 'bookEntryId', select: 'title entryNumber' },
      { path: 'unit', select: 'name' },
      { path: 'department', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo giao việc thành công',
      data: task
    });
  } catch (error) {
    console.error('Error creating task assignment:', error);
    res.status(500).json({ message: 'Lỗi tạo giao việc', error: error.message });
  }
});

// @route   PUT /api/task-assignments/:id
// @desc    Cập nhật giao việc
// @access  Private
router.put('/:id', auth, checkTaskPermission, auditLogger, async (req, res) => {
  try {
    const task = await TaskAssignment.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    // Kiểm tra quyền cập nhật
    const canUpdate = req.user.role === 'admin' || 
                     task.assignedBy.toString() === req.user.id ||
                     (req.user.role === 'commander' && task.unit.toString() === req.user.unit.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Không có quyền cập nhật giao việc này' });
    }

    const updateData = { ...req.body, updatedBy: req.user.id };
    const updatedTask = await TaskAssignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedBy', select: 'name email position' },
      { path: 'assignedTo', select: 'name email position' },
      { path: 'bookId', select: 'title bookNumber' },
      { path: 'bookEntryId', select: 'title entryNumber' },
      { path: 'unit', select: 'name' },
      { path: 'department', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật giao việc thành công',
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật giao việc', error: error.message });
  }
});

// @route   PUT /api/task-assignments/:id/progress
// @desc    Cập nhật tiến độ công việc
// @access  Private
router.put('/:id/progress', auth, checkTaskPermission, auditLogger, async (req, res) => {
  try {
    const { progress } = req.body;
    const task = await TaskAssignment.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    // Chỉ người được giao việc mới có thể cập nhật tiến độ
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ người được giao việc mới có thể cập nhật tiến độ' });
    }

    await task.updateProgress(progress, req.user.id);

    res.json({
      success: true,
      message: 'Cập nhật tiến độ thành công',
      data: task
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật tiến độ', error: error.message });
  }
});

// @route   POST /api/task-assignments/:id/notes
// @desc    Thêm ghi chú cho giao việc
// @access  Private
router.post('/:id/notes', auth, checkTaskPermission, auditLogger, async (req, res) => {
  try {
    const { content } = req.body;
    const task = await TaskAssignment.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    await task.addNote(content, req.user.id);

    res.json({
      success: true,
      message: 'Thêm ghi chú thành công'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm ghi chú', error: error.message });
  }
});

// @route   PUT /api/task-assignments/:id/approve
// @desc    Phê duyệt giao việc
// @access  Private
router.put('/:id/approve', auth, auditLogger, async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const task = await TaskAssignment.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    if (!task.requiresApproval) {
      return res.status(400).json({ message: 'Giao việc này không yêu cầu phê duyệt' });
    }

    // Kiểm tra quyền phê duyệt
    if (req.user.role !== 'admin' && req.user.role !== 'commander') {
      return res.status(403).json({ message: 'Không có quyền phê duyệt' });
    }

    task.approvedBy = req.user.id;
    task.approvedAt = new Date();
    task.approvalNotes = approvalNotes;
    await task.save();

    res.json({
      success: true,
      message: 'Phê duyệt giao việc thành công'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi phê duyệt giao việc', error: error.message });
  }
});

// @route   DELETE /api/task-assignments/:id
// @desc    Xóa giao việc
// @access  Private
router.delete('/:id', auth, checkTaskPermission, auditLogger, async (req, res) => {
  try {
    const task = await TaskAssignment.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Không tìm thấy giao việc' });
    }

    // Chỉ admin hoặc người tạo mới có thể xóa
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền xóa giao việc này' });
    }

    await TaskAssignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa giao việc thành công'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa giao việc', error: error.message });
  }
});

// @route   GET /api/task-assignments/overdue
// @desc    Lấy danh sách công việc quá hạn
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'admin') {
      query = {};
    } else if (user.role === 'commander') {
      query.unit = user.unit;
    } else {
      query.assignedTo = user.id;
    }

    const overdueTasks = await TaskAssignment.findOverdueTasks()
      .find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('bookId', 'title')
      .populate('unit', 'name');

    res.json({
      success: true,
      data: overdueTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách công việc quá hạn', error: error.message });
  }
});

// @route   GET /api/task-assignments/stats
// @desc    Lấy thống kê giao việc
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;
    console.log('User for stats:', { id: user.id, role: user.role, unit: user.unit, department: user.department });
    
    let matchQuery = {};

    if (user.role === 'admin') {
      matchQuery = {};
    } else if (user.role === 'commander') {
      if (user.unit) {
        matchQuery.unit = user.unit;
      }
    } else {
      matchQuery.assignedTo = user.id;
    }

    console.log('Match query:', matchQuery);

    // Kiểm tra xem có TaskAssignment nào không
    const totalTasks = await TaskAssignment.countDocuments(matchQuery);
    console.log('Total tasks found:', totalTasks);

    // Nếu không có task nào, trả về stats rỗng
    if (totalTasks === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          overdue: 0,
          byStatus: {}
        }
      });
    }

    const stats = await TaskAssignment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Aggregation stats:', stats);

    const overdueCount = await TaskAssignment.countDocuments({
      ...matchQuery,
      status: { $in: ['pending', 'in_progress'] },
      deadline: { $lt: new Date() }
    });

    console.log('Overdue count:', overdueCount);

    // Xử lý kết quả aggregation an toàn
    const byStatus = {};
    if (stats && stats.length > 0) {
      stats.forEach(stat => {
        byStatus[stat._id] = stat.count;
      });
    }

    res.json({
      success: true,
      data: {
        total: totalTasks,
        overdue: overdueCount,
        byStatus: byStatus
      }
    });
  } catch (error) {
    console.error('Error in stats endpoint:', error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
});

// @route   GET /api/task-assignments/reminders/upcoming
// @desc    Lấy danh sách nhắc nhở sắp tới
// @access  Private
router.get('/reminders/upcoming', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const reminders = await reminderService.getUpcomingReminders(req.user.id, parseInt(limit));
    
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách nhắc nhở', error: error.message });
  }
});

// @route   POST /api/task-assignments/:id/reminders
// @desc    Tạo nhắc nhở thủ công
// @access  Private
router.post('/:id/reminders', auth, checkTaskPermission, async (req, res) => {
  try {
    const { message, scheduledAt } = req.body;
    
    if (!message || !scheduledAt) {
      return res.status(400).json({ message: 'Thông báo và thời gian lên lịch là bắt buộc' });
    }

    const success = await reminderService.sendManualReminder(req.params.id, message, scheduledAt);
    
    if (success) {
      res.json({
        success: true,
        message: 'Nhắc nhở đã được lên lịch thành công'
      });
    } else {
      res.status(500).json({ message: 'Lỗi tạo nhắc nhở' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo nhắc nhở', error: error.message });
  }
});

// @route   POST /api/task-assignments/check-overdue
// @desc    Kiểm tra công việc quá hạn (chạy thủ công)
// @access  Private (chỉ admin)
router.post('/check-overdue', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có thể chạy kiểm tra quá hạn' });
    }

    await reminderService.checkOverdueTasks();
    
    res.json({
      success: true,
      message: 'Đã kiểm tra công việc quá hạn'
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi kiểm tra công việc quá hạn', error: error.message });
  }
});

module.exports = router;
