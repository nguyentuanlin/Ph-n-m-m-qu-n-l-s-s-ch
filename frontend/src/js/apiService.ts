import axios, { AxiosInstance } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from './JwtPayload';
// Base URL cho API
const API_BASE_URL = 'http://localhost:5002/api';

export const apiService: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to include token in all requests
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
apiService.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
    }
);

export interface LoginResponse {
    token: string;
}

export interface User {
    _id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    rank?: string;
    unit?: string;
    department?: string;
    position?: string;
    duty?: string;
    phone?: string;
    password?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await apiService.post('/auth/login', { email, password });
        
        // Kiểm tra cấu trúc response từ backend
        const responseData = response.data;
        console.log('Login response:', responseData);
        
        let token: string;
        let user: any;
        
        if (responseData.data && responseData.data.token) {
            // Cấu trúc: { data: { token: "...", user: {...} } }
            token = responseData.data.token;
            user = responseData.data.user;
        } else if (responseData.token) {
            // Cấu trúc: { token: "..." }
            token = responseData.token;
            user = responseData.user;
        } else {
            throw new Error('Token not found in response');
        }
        
        localStorage.setItem('token', token);
        
        // Lưu thông tin user vào localStorage
        if (user) {
            const userData = {
                _id: user._id,
                token: token,
                role: user.role,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                department: user.department,
                position: user.position,
                phone: user.phone,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                avatar: user.avatar
            };
            localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        return { token };
    } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to login');
    }
};

export const getUsers = async (): Promise<{data: {users: User[]}}> => {
    try {
        const response = await apiService.get<{data: {users: User[]}}>('/users');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
}

export const updateUser = async (userId: string, user: Partial<User>): Promise<{data: {user: User}}> => {
    try {
        const response = await apiService.put<{data: {user: User}}>(`/users/${userId}`, user);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update user');
    }
}

export const createUser = async (user: Partial<User>): Promise<{data: {user: User}}> => {
    try {
        const response = await apiService.post<{data: {user: User}}>('/users', user);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create user');
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        await apiService.delete(`/users/${userId}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
};

// Rank interfaces and functions
export interface Rank {
    _id: string;
    name: string;
    level: number;
    category: 'Enlisted' | 'NCO' | 'Officer' | 'General';
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getRanks = async (): Promise<{data: {ranks: Rank[]}}> => {
    try {
        const response = await apiService.get<{data: {ranks: Rank[]}}>('/ranks');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch ranks');
    }
};

export const createRank = async (rank: Partial<Rank>): Promise<{data: {rank: Rank}}> => {
    try {
        const response = await apiService.post<{data: {rank: Rank}}>('/ranks', rank);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create rank');
    }
};

export const updateRank = async (rankId: string, rank: Partial<Rank>): Promise<{data: {rank: Rank}}> => {
    try {
        const response = await apiService.put<{data: {rank: Rank}}>(`/ranks/${rankId}`, rank);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update rank');
    }
};

export const deleteRank = async (rankId: string): Promise<void> => {
    try {
        await apiService.delete(`/ranks/${rankId}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete rank');
    }
};

// Unit interfaces and functions
export interface Unit {
    _id: string;
    name: string;
    code: string;
    type: 'Tiểu đội' | 'Trung đội' | 'Đại đội' | 'Tiểu đoàn' | 'Trung đoàn' | 'Lữ đoàn' | 'Sư đoàn' | 'Quân đoàn' | 'Quân khu';
    parentUnit?: {
        _id: string;
        name: string;
        code: string;
        type: string;
    };
    commander?: {
        _id: string;
        fullName: string;
        rank: {
            name: string;
        };
    };
    location?: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getUnits = async (): Promise<{data: {units: Unit[]}}> => {
    try {
        const response = await apiService.get<{data: {units: Unit[]}}>('/units');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch units');
    }
};

export const createUnit = async (unit: Partial<Unit>): Promise<{data: {unit: Unit}}> => {
    try {
        const response = await apiService.post<{data: {unit: Unit}}>('/units', unit);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create unit');
    }
};

export const updateUnit = async (unitId: string, unit: Partial<Unit>): Promise<{data: {unit: Unit}}> => {
    try {
        const response = await apiService.put<{data: {unit: Unit}}>(`/units/${unitId}`, unit);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update unit');
    }
};

export const deleteUnit = async (unitId: string): Promise<void> => {
    try {
        await apiService.delete(`/units/${unitId}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete unit');
    }
};

// Department interfaces and functions
export interface Department {
    _id: string;
    name: string;
    code: string;
    description?: string;
    head?: {
        _id: string;
        fullName: string;
        rank: {
            name: string;
        };
    };
    responsibilities: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getDepartments = async (): Promise<{data: {departments: Department[]}}> => {
    try {
        const response = await apiService.get<{data: {departments: Department[]}}>('/departments');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch departments');
    }
};

export const createDepartment = async (department: Partial<Department>): Promise<{data: {department: Department}}> => {
    try {
        const response = await apiService.post<{data: {department: Department}}>('/departments', department);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create department');
    }
};

export const updateDepartment = async (departmentId: string, department: Partial<Department>): Promise<{data: {department: Department}}> => {
    try {
        const response = await apiService.put<{data: {department: Department}}>(`/departments/${departmentId}`, department);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update department');
    }
};

export const deleteDepartment = async (departmentId: string): Promise<void> => {
    try {
        await apiService.delete(`/departments/${departmentId}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete department');
    }
};

// Position interfaces and functions
export interface Position {
    _id: string;
    name: string;
    code: string;
    department: {
        _id: string;
        name: string;
        code: string;
    };
    level: 'Junior' | 'Senior' | 'Management' | 'Executive';
    requirements: {
        minRank?: {
            _id: string;
            name: string;
            level: number;
        };
        experience?: number;
    };
    responsibilities: string[];
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getPositions = async (): Promise<{data: {positions: Position[]}}> => {
    try {
        const response = await apiService.get<{data: {positions: Position[]}}>('/positions');
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch positions');
    }
};

export const createPosition = async (position: Partial<Position>): Promise<{data: {position: Position}}> => {
    try {
        const response = await apiService.post<{data: {position: Position}}>('/positions', position);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create position');
    }
};

export const updatePosition = async (positionId: string, position: Partial<Position>): Promise<{data: {position: Position}}> => {
    try {
        const response = await apiService.put<{data: {position: Position}}>(`/positions/${positionId}`, position);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update position');
    }
};

export const deletePosition = async (positionId: string): Promise<void> => {
    try {
        await apiService.delete(`/positions/${positionId}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete position');
    }
};

// Audit Logs API
export interface AuditLog {
    _id: string;
    user: {
        _id: string;
        fullName: string;
        email: string;
        role: string;
    };
    userInfo: {
        fullName: string;
        email: string;
        role: string;
        department?: string;
        unit?: string;
    };
    action: string;
    resource: string;
    resourceId?: string;
    resourceName?: string;
    description: string;
    oldData?: any;
    newData?: any;
    ipAddress: string;
    userAgent: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    errorMessage?: string;
    executionTime: number;
    metadata: {
        method: string;
        url: string;
        statusCode: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AuditLogsResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuditLogsFilters {
    page?: number;
    limit?: number;
    user?: string;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export const getAuditLogs = async (filters: AuditLogsFilters = {}): Promise<AuditLogsResponse> => {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });

        const response = await apiService.get(`/audit-logs?${queryParams}`);

        return response.data.data;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }
};

export interface AuditStats {
    totalLogs: number;
    logsByAction: Array<{ action: string; count: number }>;
    logsByResource: Array<{ resource: string; count: number }>;
    logsByStatus: Array<{ status: string; count: number }>;
    logsByDay: Array<{ date: string; count: number }>;
    topUsers: Array<{ user: { fullName: string; email: string }; count: number }>;
}

export const getAuditStats = async (days: number = 30): Promise<AuditStats> => {
    try {
        const response = await apiService.get(`/audit-logs/stats?days=${days}`);

        return response.data.data;
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        throw error;
    }
};

export const getUserActivity = async (userId: string, days: number = 30): Promise<any> => {
    try {
        const response = await apiService.get(`/audit-logs/user/${userId}?days=${days}`);

        return response.data.data;
    } catch (error) {
        console.error('Error fetching user activity:', error);
        throw error;
    }
};

export const exportAuditLogs = async (filters: any): Promise<any> => {
    try {
        const response = await apiService.post('/audit-logs/export', filters);

        return response.data;
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        throw error;
    }
};