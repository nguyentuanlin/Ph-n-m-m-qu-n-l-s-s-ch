'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layouts/DashboardLayout'
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material'
import {
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AuditLogsStatsPage() {
  const [isClient, setIsClient] = useState(false)
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)

  useEffect(() => {
    setIsClient(true)
    fetchStats()
  }, [days])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      const response = await fetch(`http://localhost:5002/api/audit-logs/stats?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        throw new Error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Không thể tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="p-6">
        <div className="mb-6">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom>
                Thống kê Audit Logs
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Phân tích hoạt động của người dùng trong hệ thống
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  label="Khoảng thời gian"
                >
                  <MenuItem value={7}>7 ngày</MenuItem>
                  <MenuItem value={30}>30 ngày</MenuItem>
                  <MenuItem value={90}>90 ngày</MenuItem>
                  <MenuItem value={365}>1 năm</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchStats}
                disabled={loading}
              >
                Làm mới
              </Button>
            </Box>
          </Box>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} className="mb-6">
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TimelineIcon color="primary" className="mr-3" />
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Tổng số logs
                        </Typography>
                        <Typography variant="h4">
                          {stats.totalLogs.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PersonIcon color="success" className="mr-3" />
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Người dùng hoạt động
                        </Typography>
                        <Typography variant="h4">
                          {stats.topUsers.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <SecurityIcon color="warning" className="mr-3" />
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Hành động phổ biến
                        </Typography>
                        <Typography variant="h4">
                          {stats.logsByAction[0]?.count || 0}
                        </Typography>
                        <Typography variant="caption">
                          {actionLabels[stats.logsByAction[0]?.action as keyof typeof actionLabels] || stats.logsByAction[0]?.action}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TrendingUpIcon color="info" className="mr-3" />
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Tỷ lệ thành công
                        </Typography>
                        <Typography variant="h4">
                          {stats.logsByStatus.find(s => s.status === 'SUCCESS')?.count || 0}
                        </Typography>
                        <Typography variant="caption">
                          / {stats.totalLogs} logs
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Activity Over Time */}
              <Grid item xs={12} lg={8}>
                <Paper className="p-4">
                  <Typography variant="h6" gutterBottom>
                    Hoạt động theo thời gian
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.logsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Số lượng logs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Status Distribution */}
              <Grid item xs={12} lg={4}>
                <Paper className="p-4">
                  <Typography variant="h6" gutterBottom>
                    Phân bố trạng thái
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.logsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count, percent }: any) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.logsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Actions Distribution */}
              <Grid item xs={12} md={6}>
                <Paper className="p-4">
                  <Typography variant="h6" gutterBottom>
                    Phân bố hành động
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.logsByAction.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="action" 
                        tickFormatter={(value) => actionLabels[value as keyof typeof actionLabels] || value}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => actionLabels[value as keyof typeof actionLabels] || value}
                      />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Resources Distribution */}
              <Grid item xs={12} md={6}>
                <Paper className="p-4">
                  <Typography variant="h6" gutterBottom>
                    Phân bố tài nguyên
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.logsByResource.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="resource" 
                        tickFormatter={(value) => resourceLabels[value as keyof typeof resourceLabels] || value}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => resourceLabels[value as keyof typeof resourceLabels] || value}
                      />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Top Users */}
              <Grid item xs={12}>
                <Paper className="p-4">
                  <Typography variant="h6" gutterBottom>
                    Top người dùng hoạt động
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Hạng</TableCell>
                          <TableCell>Tên</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="right">Số lượng hoạt động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.topUsers.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={`#${index + 1}`} 
                                color={index < 3 ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{item.user.fullName}</TableCell>
                            <TableCell>{item.user.email}</TableCell>
                            <TableCell align="right">
                              <Typography variant="h6">
                                {item.count.toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : (
          <Alert severity="info">
            Không có dữ liệu thống kê
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}
