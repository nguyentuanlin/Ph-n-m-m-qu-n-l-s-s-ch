'use client';

import React, { useState, useEffect } from 'react';
import { taskAssignmentService, TaskAssignment, TaskAssignmentFilters, TaskAssignmentStats } from '../../../js/taskAssignmentService';
import { useAuth } from '../../../contexts/AuthContext';

const TaskAssignmentsPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [stats, setStats] = useState<TaskAssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [filters, setFilters] = useState<TaskAssignmentFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Load data
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAssignmentService.getTaskAssignments(filters);
      setTasks(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await taskAssignmentService.getStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewDetail = (task: TaskAssignment) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    try {
      await taskAssignmentService.updateProgress(taskId, progress);
      loadTasks();
      loadStats();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const isOverdue = (deadline: string, status: string) => {
    return status !== 'completed' && new Date(deadline) < new Date();
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Quản lý Giao việc Đăng Sổ sách
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo Giao việc Mới
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Trạng thái</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ thực hiện</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Độ ưu tiên</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">Tất cả độ ưu tiên</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Sắp xếp</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="deadline-asc">Hạn sớm nhất</option>
              <option value="deadline-desc">Hạn muộn nhất</option>
              <option value="priority-desc">Ưu tiên cao</option>
              <option value="priority-asc">Ưu tiên thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">Danh sách Giao việc</h4>
        </div>

        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Công việc</p>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="font-medium">Người nhận</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Trạng thái</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Tiến độ</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Hạn</p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="font-medium">Thao tác</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Không có giao việc nào</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            >
              <div className="col-span-2 flex items-center">
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.bookId.title}</p>
                </div>
              </div>
              <div className="col-span-1 hidden items-center sm:flex">
                <p className="text-sm text-black dark:text-white">{task.assignedTo.name}</p>
              </div>
              <div className="col-span-1 flex items-center">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status === 'pending' && 'Chờ thực hiện'}
                  {task.status === 'in_progress' && 'Đang thực hiện'}
                  {task.status === 'completed' && 'Hoàn thành'}
                  {task.status === 'overdue' && 'Quá hạn'}
                  {task.status === 'cancelled' && 'Đã hủy'}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between text-xs">
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
              <div className="col-span-1 flex items-center">
                <div>
                  <p className={`text-sm ${isOverdue(task.deadline, task.status) ? 'text-red-600' : 'text-black dark:text-white'}`}>
                    {formatDate(task.deadline)}
                  </p>
                  {isOverdue(task.deadline, task.status) && (
                    <p className="text-xs text-red-500">Quá hạn</p>
                  )}
                </div>
              </div>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={() => handleViewDetail(task)}
                  className="text-primary hover:text-opacity-80"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="rounded border border-stroke px-3 py-2 text-sm disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`rounded px-3 py-2 text-sm ${
                  page === pagination.current
                    ? 'bg-primary text-white'
                    : 'border border-stroke hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages}
              className="rounded border border-stroke px-3 py-2 text-sm disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTasks();
            loadStats();
          }}
        />
      )}

      {/* Task Detail Modal */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setShowDetailModal(false)}
          onUpdate={() => {
            loadTasks();
            loadStats();
          }}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bookId: '',
    bookEntryId: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium' as const,
    requiresApproval: false,
    tags: [] as string[],
    reminderSettings: {
      enabled: false,
      times: [{ hours: 24 }]
    }
  });
  const [books, setBooks] = useState<any[]>([]);
  const [bookEntries, setBookEntries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [booksData, usersData] = await Promise.all([
        taskAssignmentService.getBooks(),
        taskAssignmentService.getUsers()
      ]);
      setBooks(booksData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadBookEntries = async (bookId: string) => {
    try {
      const entries = await taskAssignmentService.getBookEntries(bookId);
      setBookEntries(entries);
    } catch (error) {
      console.error('Error loading book entries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await taskAssignmentService.createTaskAssignment(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-boxdark">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Tạo Giao việc Mới</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tiêu đề</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Mô tả</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Sổ sách</label>
              <select
                required
                value={formData.bookId}
                onChange={(e) => {
                  setFormData({ ...formData, bookId: e.target.value, bookEntryId: '' });
                  loadBookEntries(e.target.value);
                }}
                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="">Chọn sổ sách</option>
                {books && books.length > 0 ? books.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title} - {book.bookNumber}
                  </option>
                )) : (
                  <option value="" disabled>Đang tải...</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Mục sổ sách</label>
              <select
                required
                value={formData.bookEntryId}
                onChange={(e) => setFormData({ ...formData, bookEntryId: e.target.value })}
                disabled={!formData.bookId}
                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="">Chọn mục sổ sách</option>
                {bookEntries && bookEntries.length > 0 ? bookEntries.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.title} - {entry.entryNumber}
                  </option>
                )) : (
                  <option value="" disabled>Chọn sổ sách trước</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Người nhận</label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="">Chọn người nhận</option>
                {users && users.length > 0 ? users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name || user.fullName} - {user.position?.name || user.position || 'N/A'}
                  </option>
                )) : (
                  <option value="" disabled>Đang tải...</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Thời hạn</label>
            <input
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-black dark:text-white">Yêu cầu phê duyệt</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.reminderSettings.enabled}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  reminderSettings: { 
                    ...formData.reminderSettings, 
                    enabled: e.target.checked 
                  } 
                })}
                className="mr-2"
              />
              <span className="text-sm text-black dark:text-white">Bật nhắc nhở</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-stroke px-4 py-2 text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo giao việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Detail Modal Component
const TaskDetailModal = ({ task, onClose, onUpdate }: { task: TaskAssignment; onClose: () => void; onUpdate: () => void }) => {
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProgress = async () => {
    try {
      setLoading(true);
      await taskAssignmentService.updateProgress(task._id, progress);
      onUpdate();
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    try {
      setLoading(true);
      await taskAssignmentService.addNote(task._id, note);
      setNote('');
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-boxdark">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white">Chi tiết Giao việc</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium text-black dark:text-white">Thông tin cơ bản</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Tiêu đề:</span> {task.title}</p>
                <p><span className="font-medium">Mô tả:</span> {task.description}</p>
                <p><span className="font-medium">Sổ sách:</span> {task.bookId.title}</p>
                <p><span className="font-medium">Mục sổ sách:</span> {task.bookEntryId.title}</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium text-black dark:text-white">Thông tin giao việc</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Người giao:</span> {task.assignedBy.name}</p>
                <p><span className="font-medium">Người nhận:</span> {task.assignedTo.name}</p>
                <p><span className="font-medium">Thời hạn:</span> {formatDate(task.deadline)}</p>
                <p><span className="font-medium">Trạng thái:</span> 
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status === 'pending' && 'Chờ thực hiện'}
                    {task.status === 'in_progress' && 'Đang thực hiện'}
                    {task.status === 'completed' && 'Hoàn thành'}
                    {task.status === 'overdue' && 'Quá hạn'}
                    {task.status === 'cancelled' && 'Đã hủy'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <h4 className="mb-2 font-medium text-black dark:text-white">Tiến độ</h4>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium">{progress}%</span>
              <button
                onClick={handleUpdateProgress}
                disabled={loading}
                className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Cập nhật
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="mb-2 font-medium text-black dark:text-white">Ghi chú</h4>
            <div className="space-y-2">
              {task.notes.map((note, index) => (
                <div key={index} className="rounded border border-stroke p-3 dark:border-strokedark">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{note.author.name}</span>
                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm">{note.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                className="flex-1 rounded border border-stroke px-3 py-2 text-sm outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
              <button
                onClick={handleAddNote}
                disabled={loading || !note.trim()}
                className="rounded bg-primary px-3 py-2 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentsPage;
