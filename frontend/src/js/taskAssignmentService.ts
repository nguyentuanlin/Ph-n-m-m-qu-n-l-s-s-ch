import { apiService } from './apiService';

export interface TaskAssignment {
  _id: string;
  title: string;
  description: string;
  bookId: {
    _id: string;
    title: string;
    bookNumber: string;
  };
  bookEntryId: {
    _id: string;
    title: string;
    entryNumber: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
    position: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    position: string;
  };
  assignedAt: string;
  deadline: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  notes: Array<{
    content: string;
    author: {
      _id: string;
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
  reminders: Array<{
    type: 'email' | 'notification' | 'sms';
    message: string;
    scheduledAt: string;
    sent: boolean;
    sentAt?: string;
  }>;
  requiresApproval: boolean;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  approvalNotes?: string;
  unit: {
    _id: string;
    name: string;
  };
  department: {
    _id: string;
    name: string;
  };
  tags: string[];
  attachments: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  daysUntilDeadline: number;
  isCompleted: boolean;
}

export interface CreateTaskAssignmentData {
  title: string;
  description: string;
  bookId: string;
  bookEntryId: string;
  assignedTo: string;
  deadline: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requiresApproval?: boolean;
  unit?: string;
  department?: string;
  tags?: string[];
  reminderSettings?: {
    enabled: boolean;
    times: Array<{ hours: number }>;
  };
}

export interface UpdateTaskAssignmentData {
  title?: string;
  description?: string;
  assignedTo?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requiresApproval?: boolean;
  unit?: string;
  department?: string;
  tags?: string[];
}

export interface TaskAssignmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  assignedBy?: string;
  unit?: string;
  department?: string;
  overdue?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskAssignmentStats {
  total: number;
  overdue: number;
  byStatus: {
    [key: string]: number;
  };
}

export interface TaskAssignmentResponse {
  success: boolean;
  data: TaskAssignment[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface TaskAssignmentDetailResponse {
  success: boolean;
  data: TaskAssignment;
}

export interface TaskAssignmentStatsResponse {
  success: boolean;
  data: TaskAssignmentStats;
}

class TaskAssignmentService {
  private baseUrl = '/task-assignments';

  // Lấy danh sách giao việc
  async getTaskAssignments(filters: TaskAssignmentFilters = {}): Promise<TaskAssignmentResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  // Lấy chi tiết giao việc
  async getTaskAssignment(id: string): Promise<TaskAssignment> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  // Tạo giao việc mới
  async createTaskAssignment(data: CreateTaskAssignmentData): Promise<TaskAssignment> {
    const response = await apiService.post(this.baseUrl, data);
    return response.data.data;
  }

  // Cập nhật giao việc
  async updateTaskAssignment(id: string, data: UpdateTaskAssignmentData): Promise<TaskAssignment> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, data);
    return response.data.data;
  }

  // Cập nhật tiến độ
  async updateProgress(id: string, progress: number): Promise<TaskAssignment> {
    const response = await apiService.put(`${this.baseUrl}/${id}/progress`, { progress });
    return response.data.data;
  }

  // Thêm ghi chú
  async addNote(id: string, content: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/${id}/notes`, { content });
  }

  // Phê duyệt giao việc
  async approveTask(id: string, approvalNotes?: string): Promise<void> {
    await apiService.put(`${this.baseUrl}/${id}/approve`, { approvalNotes });
  }

  // Xóa giao việc
  async deleteTaskAssignment(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Lấy danh sách công việc quá hạn
  async getOverdueTasks(): Promise<TaskAssignment[]> {
    const response = await apiService.get(`${this.baseUrl}/overdue`);
    return response.data.data;
  }

  // Lấy thống kê
  async getStats(): Promise<TaskAssignmentStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  // Lấy danh sách sổ sách để giao việc
  async getBooks(): Promise<any[]> {
    const response = await apiService.get('/books/for-assignment');
    return response.data.data;
  }

  // Lấy danh sách mục sổ sách
  async getBookEntries(bookId: string): Promise<any[]> {
    const response = await apiService.get(`/entries?bookId=${bookId}`);
    return response.data.data;
  }

  // Lấy danh sách người dùng để giao việc
  async getUsers(): Promise<any[]> {
    const response = await apiService.get('/users/for-assignment');
    return response.data.data;
  }

  // Lấy danh sách đơn vị
  async getUnits(): Promise<any[]> {
    const response = await apiService.get('/units');
    return response.data.data;
  }

  // Lấy danh sách phòng ban
  async getDepartments(): Promise<any[]> {
    const response = await apiService.get('/departments');
    return response.data.data;
  }

  // Lấy danh sách nhắc nhở sắp tới
  async getUpcomingReminders(limit: number = 10): Promise<any[]> {
    const response = await apiService.get(`${this.baseUrl}/reminders/upcoming?limit=${limit}`);
    return response.data.data;
  }

  // Tạo nhắc nhở thủ công
  async createManualReminder(taskId: string, message: string, scheduledAt: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/${taskId}/reminders`, { message, scheduledAt });
  }

  // Kiểm tra công việc quá hạn
  async checkOverdueTasks(): Promise<void> {
    await apiService.post(`${this.baseUrl}/check-overdue`);
  }
}

export const taskAssignmentService = new TaskAssignmentService();
