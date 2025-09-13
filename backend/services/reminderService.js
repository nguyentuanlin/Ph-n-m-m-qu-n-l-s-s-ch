const cron = require('node-cron');
const TaskAssignment = require('../models/TaskAssignment');
const Notification = require('../models/Notification');
const User = require('../models/User');

class ReminderService {
  constructor() {
    this.startReminderCron();
  }

  // Khởi động cron job để kiểm tra nhắc nhở
  startReminderCron() {
    // Chạy mỗi 30 phút để kiểm tra nhắc nhở
    cron.schedule('*/30 * * * *', () => {
      this.checkAndSendReminders();
    });

    // Chạy mỗi ngày lúc 8h sáng để kiểm tra công việc quá hạn
    cron.schedule('0 8 * * *', () => {
      this.checkOverdueTasks();
    });

    console.log('✅ Reminder service started');
  }

  // Kiểm tra và gửi nhắc nhở
  async checkAndSendReminders() {
    try {
      const now = new Date();
      
      // Tìm các nhắc nhở cần gửi
      const tasks = await TaskAssignment.find({
        'reminders.sent': false,
        'reminders.scheduledAt': { $lte: now }
      }).populate('assignedTo assignedBy');

      for (const task of tasks) {
        for (const reminder of task.reminders) {
          if (!reminder.sent && new Date(reminder.scheduledAt) <= now) {
            await this.sendReminder(task, reminder);
            
            // Đánh dấu đã gửi
            reminder.sent = true;
            reminder.sentAt = new Date();
          }
        }
        
        await task.save();
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Gửi nhắc nhở
  async sendReminder(task, reminder) {
    try {
      // Tạo thông báo trong hệ thống
      const notification = new Notification({
        title: 'Nhắc nhở công việc',
        message: reminder.message,
        type: 'task_reminder',
        userId: task.assignedTo._id,
        relatedId: task._id,
        relatedType: 'TaskAssignment',
        priority: task.priority === 'urgent' ? 'high' : 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          deadline: task.deadline,
          priority: task.priority
        }
      });

      await notification.save();

      // Gửi email nhắc nhở (nếu có cấu hình email)
      if (reminder.type === 'email') {
        await this.sendEmailReminder(task, reminder);
      }

      // Gửi SMS nhắc nhở (nếu có cấu hình SMS)
      if (reminder.type === 'sms') {
        await this.sendSMSReminder(task, reminder);
      }

      console.log(`✅ Reminder sent for task: ${task.title}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  // Gửi email nhắc nhở
  async sendEmailReminder(task, reminder) {
    // TODO: Implement email service
    console.log(`📧 Email reminder for task: ${task.title}`);
  }

  // Gửi SMS nhắc nhở
  async sendSMSReminder(task, reminder) {
    // TODO: Implement SMS service
    console.log(`📱 SMS reminder for task: ${task.title}`);
  }

  // Kiểm tra công việc quá hạn
  async checkOverdueTasks() {
    try {
      const now = new Date();
      
      // Tìm các công việc quá hạn
      const overdueTasks = await TaskAssignment.find({
        status: { $in: ['pending', 'in_progress'] },
        deadline: { $lt: now }
      }).populate('assignedTo assignedBy unit');

      for (const task of overdueTasks) {
        // Cập nhật trạng thái thành quá hạn
        if (task.status !== 'overdue') {
          task.status = 'overdue';
          await task.save();

          // Tạo thông báo quá hạn
          const notification = new Notification({
            title: 'Công việc quá hạn',
            message: `Công việc "${task.title}" đã quá hạn. Vui lòng hoàn thành sớm nhất có thể.`,
            type: 'task_overdue',
            userId: task.assignedTo._id,
            relatedId: task._id,
            relatedType: 'TaskAssignment',
            priority: 'high',
            data: {
              taskId: task._id,
              taskTitle: task.title,
              deadline: task.deadline,
              daysOverdue: Math.ceil((now - new Date(task.deadline)) / (1000 * 60 * 60 * 24))
            }
          });

          await notification.save();

          // Thông báo cho người giao việc
          const assignerNotification = new Notification({
            title: 'Công việc quá hạn',
            message: `Công việc "${task.title}" được giao cho ${task.assignedTo.name} đã quá hạn.`,
            type: 'task_overdue_assigner',
            userId: task.assignedBy._id,
            relatedId: task._id,
            relatedType: 'TaskAssignment',
            priority: 'medium',
            data: {
              taskId: task._id,
              taskTitle: task.title,
              assignedTo: task.assignedTo.name,
              deadline: task.deadline
            }
          });

          await assignerNotification.save();

          console.log(`⚠️ Overdue task notification sent: ${task.title}`);
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Tạo nhắc nhở tự động cho công việc mới
  async createAutomaticReminders(taskId) {
    try {
      const task = await TaskAssignment.findById(taskId);
      if (!task) return;

      const deadline = new Date(task.deadline);
      const now = new Date();

      // Nhắc nhở 24 giờ trước hạn
      const reminder24h = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        await task.addReminder(
          'notification',
          `Nhắc nhở: Công việc "${task.title}" sẽ hết hạn trong 24 giờ`,
          reminder24h
        );
      }

      // Nhắc nhở 2 giờ trước hạn
      const reminder2h = new Date(deadline.getTime() - 2 * 60 * 60 * 1000);
      if (reminder2h > now) {
        await task.addReminder(
          'notification',
          `Nhắc nhở khẩn cấp: Công việc "${task.title}" sẽ hết hạn trong 2 giờ`,
          reminder2h
        );
      }

      // Nhắc nhở 30 phút trước hạn
      const reminder30m = new Date(deadline.getTime() - 30 * 60 * 1000);
      if (reminder30m > now) {
        await task.addReminder(
          'notification',
          `Nhắc nhở khẩn cấp: Công việc "${task.title}" sẽ hết hạn trong 30 phút`,
          reminder30m
        );
      }

      console.log(`✅ Automatic reminders created for task: ${task.title}`);
    } catch (error) {
      console.error('Error creating automatic reminders:', error);
    }
  }

  // Gửi nhắc nhở thủ công
  async sendManualReminder(taskId, message, scheduledAt) {
    try {
      const task = await TaskAssignment.findById(taskId);
      if (!task) throw new Error('Task not found');

      await task.addReminder('notification', message, new Date(scheduledAt));
      
      console.log(`✅ Manual reminder scheduled for task: ${task.title}`);
      return true;
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      return false;
    }
  }

  // Lấy danh sách nhắc nhở sắp tới
  async getUpcomingReminders(userId, limit = 10) {
    try {
      const tasks = await TaskAssignment.find({
        assignedTo: userId,
        'reminders.sent': false,
        'reminders.scheduledAt': { $gte: new Date() }
      })
      .populate('bookId', 'title')
      .sort({ 'reminders.scheduledAt': 1 })
      .limit(limit);

      const reminders = [];
      tasks.forEach(task => {
        task.reminders.forEach(reminder => {
          if (!reminder.sent && new Date(reminder.scheduledAt) >= new Date()) {
            reminders.push({
              id: reminder._id,
              taskId: task._id,
              taskTitle: task.title,
              bookTitle: task.bookId.title,
              message: reminder.message,
              scheduledAt: reminder.scheduledAt,
              type: reminder.type
            });
          }
        });
      });

      return reminders.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }
}

module.exports = new ReminderService();
