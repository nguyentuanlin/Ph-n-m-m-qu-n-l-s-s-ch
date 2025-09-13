'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layouts/DashboardLayout'
import {
  Paper,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material'
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridFilterModel,
  GridSortModel
} from '@mui/x-data-grid'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { vi } from 'date-fns/locale'

interface AuditLog {
  _id: string
  user: {
    _id: string
    fullName: string
    email: string
    role: string
  }
  userInfo: {
    fullName: string
    email: string
    role: string
    department?: string
    unit?: string
  }
  action: string
  resource: string
  resourceId?: string
  resourceName?: string
  description: string
  oldData?: any
  newData?: any
  ipAddress: string
  userAgent: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  errorMessage?: string
  executionTime: number
  metadata: {
    method: string
    url: string
    statusCode: number
  }
  createdAt: string
  updatedAt: string
}

interface AuditStats {
  totalLogs: number
  logsByAction: Array<{ action: string; count: number }>
  logsByResource: Array<{ resource: string; count: number }>
  logsByStatus: Array<{ status: string; count: number }>
  logsByDay: Array<{ date: string; count: number }>
  topUsers: Array<{ user: { fullName: string; email: string }; count: number }>
}

const actionLabels = {
  'LOGIN': 'Đăng nhập',
  'LOGOUT': 'Đăng xuất',
  'CREATE': 'Tạo mới',
  'UPDATE': 'Cập nhật',
  'DELETE': 'Xóa',
  'VIEW': 'Xem',
  'ASSIGN': 'Phân công',
  'UNASSIGN': 'Hủy phân công',
  'APPROVE': 'Phê duyệt',
  'REJECT': 'Từ chối',
  'EXPORT': 'Xuất dữ liệu',
  'IMPORT': 'Nhập dữ liệu'
}

const resourceLabels = {
  'USER': 'Người dùng',
  'DEPARTMENT': 'Phòng ban',
  'UNIT': 'Đơn vị',
  'RANK': 'Cấp bậc',
  'POSITION': 'Chức vụ',
  'BOOK': 'Sổ sách',
  'BOOK_ENTRY': 'Bản ghi sổ sách',
  'NOTIFICATION': 'Thông báo',
  'REPORT': 'Báo cáo',
  'AUTH': 'Xác thực',
  'SYSTEM': 'Hệ thống'
}

const statusColors = {
  'SUCCESS': 'success',
  'FAILED': 'error',
  'PENDING': 'warning'
} as const

export default function AdminAuditLogsPage() {
  const [isClient, setIsClient] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    user: '',
    action: '',
    resource: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null
  })
  
  // UI State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setIsClient(true)
    fetchLogs()
    fetchStats()
  }, [page, pageSize, filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.user && { user: filters.user }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString().split('T')[0] }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString().split('T')[0] })
      })

      const response = await fetch(`http://localhost:5002/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.data.logs)
        setTotal(data.data.total)
      } else {
        throw new Error('Failed to fetch logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError('Không thể tải danh sách logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token') || ''
      const response = await fetch('http://localhost:5002/api/audit-logs/stats?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(0) // Reset to first page when filtering
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      user: '',
      action: '',
      resource: '',
      status: '',
      startDate: null,
      endDate: null
    })
    setPage(0)
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token') || ''
      const response = await fetch('http://localhost:5002/api/audit-logs/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: filters.startDate?.toISOString().split('T')[0],
          endDate: filters.endDate?.toISOString().split('T')[0],
          format: 'csv',
          filters: {
            user: filters.user,
            action: filters.action,
            resource: filters.resource,
            status: filters.status
          }
        })
      })

      if (response.ok) {
        setSuccess('Xuất dữ liệu thành công!')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      setError('Không thể xuất dữ liệu')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Thời gian',
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString('vi-VN')
    },
    {
      field: 'userInfo',
      headerName: 'Người thực hiện',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value.email}
          </Typography>
        </Box>
      )
    },
    {
      field: 'action',
      headerName: 'Hành động',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={actionLabels[params.value as keyof typeof actionLabels] || params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'resource',
      headerName: 'Tài nguyên',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={resourceLabels[params.value as keyof typeof resourceLabels] || params.value}
          size="small"
          color="secondary"
          variant="outlined"
        />
      )
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={statusColors[params.value as keyof typeof statusColors]}
        />
      )
    },
    {
      field: 'executionTime',
      headerName: 'Thời gian (ms)',
      width: 120,
      renderCell: (params) => `${params.value}ms`
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Xem chi tiết">
          <IconButton
            size="small"
            onClick={() => handleViewDetails(params.row)}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ]

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout requiredRole="admin">
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
        <div className="p-6">
          <div className="mb-6">
            <Typography variant="h4" gutterBottom>
              Audit Logs
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Theo dõi và quản lý các hoạt động của người dùng trong hệ thống
            </Typography>
          </div>

          {error && (
            <Alert severity="error" className="mb-4" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Paper className="mb-6">
            <Box p={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Bộ lọc</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    className="mr-2"
                  >
                    {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchLogs}
                    className="mr-2"
                  >
                    Làm mới
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    color="primary"
                  >
                    Xuất dữ liệu
                  </Button>
                </Box>
              </Box>

              {showFilters && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Tìm kiếm"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon className="mr-2" />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Hành động</InputLabel>
                      <Select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        label="Hành động"
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        {Object.entries(actionLabels).map(([key, label]) => (
                          <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Tài nguyên</InputLabel>
                      <Select
                        value={filters.resource}
                        onChange={(e) => handleFilterChange('resource', e.target.value)}
                        label="Tài nguyên"
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        {Object.entries(resourceLabels).map(([key, label]) => (
                          <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Trạng thái"
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="SUCCESS">Thành công</MenuItem>
                        <MenuItem value="FAILED">Thất bại</MenuItem>
                        <MenuItem value="PENDING">Đang chờ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <DatePicker
                      label="Từ ngày"
                      value={filters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <DatePicker
                      label="Đến ngày"
                      value={filters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                </Grid>
              )}

              <Box mt={2}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  size="small"
                >
                  Xóa bộ lọc
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={logs.map(log => ({ ...log, id: log._id }))}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page)
                setPageSize(model.pageSize)
              }}
              rowCount={total}
              paginationMode="server"
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 }
                }
              }}
              sx={{ border: 0 }}
            />
          </Paper>

          {/* Detail Dialog */}
          <Dialog
            open={detailDialogOpen}
            onClose={() => setDetailDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Chi tiết Audit Log
            </DialogTitle>
            <DialogContent>
              {selectedLog && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Thông tin người dùng
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tên:</strong> {selectedLog.userInfo.fullName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedLog.userInfo.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Vai trò:</strong> {selectedLog.userInfo.role}
                      </Typography>
                      {selectedLog.userInfo.department && (
                        <Typography variant="body2">
                          <strong>Phòng ban:</strong> {selectedLog.userInfo.department}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Thông tin hành động
                      </Typography>
                      <Typography variant="body2">
                        <strong>Hành động:</strong> {actionLabels[selectedLog.action as keyof typeof actionLabels] || selectedLog.action}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tài nguyên:</strong> {resourceLabels[selectedLog.resource as keyof typeof resourceLabels] || selectedLog.resource}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Trạng thái:</strong> {selectedLog.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Thời gian thực hiện:</strong> {selectedLog.executionTime}ms
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mô tả
                      </Typography>
                      <Typography variant="body2">
                        {selectedLog.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Thông tin kỹ thuật
                      </Typography>
                      <Typography variant="body2">
                        <strong>IP Address:</strong> {selectedLog.ipAddress}
                      </Typography>
                      <Typography variant="body2">
                        <strong>User Agent:</strong> {selectedLog.userAgent}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Method:</strong> {selectedLog.metadata.method}
                      </Typography>
                      <Typography variant="body2">
                        <strong>URL:</strong> {selectedLog.metadata.url}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status Code:</strong> {selectedLog.metadata.statusCode}
                      </Typography>
                    </Grid>
                    {selectedLog.errorMessage && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom color="error">
                          Thông báo lỗi
                        </Typography>
                        <Typography variant="body2" color="error">
                          {selectedLog.errorMessage}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                Đóng
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </LocalizationProvider>
    </DashboardLayout>
  )
}
