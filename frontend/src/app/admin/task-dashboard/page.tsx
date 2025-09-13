'use client';

import React, { useState, useEffect } from 'react';
import { taskAssignmentService, TaskAssignment } from '../../../js/taskAssignmentService';
import { useAuth } from '../../../contexts/AuthContext';

const TaskDashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksData, remindersData, statsData] = await Promise.all([
        taskAssignmentService.getTaskAssignments({
          limit: 50,
          sortBy: 'deadline',
          sortOrder: 'asc'
        }),
        taskAssignmentService.getUpcomingReminders(),
        taskAssignmentService.getStats()
      ]);
      
      setTasks(tasksData.data);
      setUpcomingReminders(remindersData.data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByPeriod = () => {
    const now = new Date();
    const period = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const futureDate = new Date(now.getTime() + period * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= futureDate;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline < now && task.status !== 'completed';
    });
  };

  const getUrgentTasks = () => {
    const now = new Date();
    const urgentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    return tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline <= urgentDate && task.status !== 'completed';
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const upcomingTasks = getTasksByPeriod();
  const overdueTasks = getOverdueTasks();
  const urgentTasks = getUrgentTasks();

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Dashboard Giao việc
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
          >
            <option value="week">7 ngày tới</option>
            <option value="month">30 ngày tới</option>
            <option value="quarter">90 ngày tới</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Tổng công việc</p>
                <p className="text-2xl font-bold text-black dark:text-white">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-10">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Quá hạn</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Đang thực hiện</p>
                <p className="text-2xl font-bold text-blue-600">{stats.byStatus.in_progress || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.byStatus.completed || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Công việc sắp đến hạn ({upcomingTasks.length})
            </h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Không có công việc nào sắp đến hạn</p>
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task._id}
                  className="border-t border-stroke px-4 py-4 dark:border-strokedark md:px-6 2xl:px-7.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-black dark:text-white">{task.title}</h5>
                      <p className="text-sm text-gray-500">{task.bookId.title}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'low' && 'Thấp'}
                          {task.priority === 'medium' && 'Trung bình'}
                          {task.priority === 'high' && 'Cao'}
                          {task.priority === 'urgent' && 'Khẩn cấp'}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'pending' && 'Chờ thực hiện'}
                          {task.status === 'in_progress' && 'Đang thực hiện'}
                          {task.status === 'completed' && 'Hoàn thành'}
                          {task.status === 'overdue' && 'Quá hạn'}
                          {task.status === 'cancelled' && 'Đã hủy'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-black dark:text-white">
                        {formatDate(task.deadline)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getDaysUntilDeadline(task.deadline)} ngày
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Tiến độ</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Công việc quá hạn ({overdueTasks.length})
            </h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {overdueTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Không có công việc quá hạn</p>
              </div>
            ) : (
              overdueTasks.map((task) => (
                <div
                  key={task._id}
                  className="border-t border-stroke px-4 py-4 dark:border-strokedark md:px-6 2xl:px-7.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-black dark:text-white">{task.title}</h5>
                      <p className="text-sm text-gray-500">{task.bookId.title}</p>
                      <p className="text-sm text-gray-500">Người nhận: {task.assignedTo.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {formatDate(task.deadline)}
                      </p>
                      <p className="text-xs text-red-500">
                        Quá hạn {Math.abs(getDaysUntilDeadline(task.deadline))} ngày
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Tiến độ</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="mt-6 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Nhắc nhở sắp tới ({upcomingReminders.length})
            </h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {upcomingReminders.map((reminder, index) => (
              <div
                key={index}
                className="border-t border-stroke px-4 py-4 dark:border-strokedark md:px-6 2xl:px-7.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-black dark:text-white">{reminder.taskTitle}</h5>
                    <p className="text-sm text-gray-500">{reminder.message}</p>
                    <p className="text-sm text-gray-500">Sổ sách: {reminder.bookTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-black dark:text-white">
                      {formatDate(reminder.scheduledAt)}
                    </p>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {reminder.type === 'notification' && 'Thông báo'}
                      {reminder.type === 'email' && 'Email'}
                      {reminder.type === 'sms' && 'SMS'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Tasks Alert */}
      {urgentTasks.length > 0 && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center">
            <svg className="mr-3 h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Cảnh báo: {urgentTasks.length} công việc khẩn cấp sắp đến hạn trong 24 giờ
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Vui lòng kiểm tra và xử lý ngay lập tức
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDashboardPage;
