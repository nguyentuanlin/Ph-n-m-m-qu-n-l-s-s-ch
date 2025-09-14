'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layouts/DashboardLayout'
import {
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  MenuItem,
  Box,
  Typography,
  Select,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  Snackbar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import NotificationSnackbar from '@/components/common/NotificationSnackbar'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/js/apiService'

interface Department {
  _id: string
  name: string
  code: string
  description?: string
  head?: {
    _id: string
    fullName: string
    rank: {
      name: string
    }
  }
  responsibilities: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  fullName: string
  rank: {
    name: string
  }
}

export default function AdminDepartmentsPage() {
  const [isClient, setIsClient] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentDepartment, setCurrentDepartment] = useState<Department>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setOpenSnackbar(true)
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }


  const [newResponsibility, setNewResponsibility] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head: '',
    responsibilities: [] as string[]
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên phòng ban', flex: 2 },
    { field: 'code', headerName: 'Mã phòng ban', flex: 1 },
    { 
      field: 'head', 
      headerName: 'Trưởng phòng', 
      flex: 2,
      renderCell: (params) => params.value?.fullName || '-'
    },
    { 
      field: 'responsibilities', 
      headerName: 'Nhiệm vụ', 
      flex: 2,
      renderCell: (params) => (
        <Box>
          {params.value?.slice(0, 2).map((resp: string, index: number) => (
            <Chip key={index} label={resp} size="small" className="mr-1 mb-1" />
          ))}
          {params.value?.length > 2 && (
            <Chip label={`+${params.value.length - 2}`} size="small" color="default" />
          )}
        </Box>
      )
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Hoạt động' : 'Không hoạt động'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'action',
      headerName: 'Hành động',
      flex: 1,
      renderCell: (params) => (
        <div>
          <IconButton color="primary" onClick={() => openEditModal(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      )
    }
  ]

  useEffect(() => {
    setIsClient(true)
    fetchDepartments()
    fetchUsers()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      const response = await getDepartments()
      console.log('Departments API response:', response)
      // Backend now returns data directly, not nested in departments property
      const data = response.data || []
      setDepartments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      showSnackbar('Không thể tải danh sách phòng ban', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5002/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setCurrentDepartment(undefined)
    setFormData({
      name: '',
      code: '',
      description: '',
      head: '',
      responsibilities: []
    })
    setNewResponsibility('')
    setIsModalOpen(true)
  }

  const openEditModal = (department: Department) => {
    setIsEditing(true)
    setCurrentDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      head: department.head?._id || '',
      responsibilities: department.responsibilities || []
    })
    setNewResponsibility('')
    setIsModalOpen(true)
  }

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, newResponsibility.trim()]
      })
      setNewResponsibility('')
    }
  }

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    try {
      setError('')
      setLoading(true)
      
      const token = localStorage.getItem('token') || ''
      const departmentData = {
        ...formData,
        head: formData.head ? { _id: formData.head, fullName: '', rank: { name: '' } } : undefined
      }
      
      if (isEditing && currentDepartment?._id) {
        await updateDepartment(currentDepartment._id, departmentData)
        showSnackbar('Cập nhật phòng ban thành công!', 'success')
      } else {
        await createDepartment(departmentData)
        showSnackbar('Tạo phòng ban thành công!', 'success')
      }
      
      setIsModalOpen(false)
      fetchDepartments()
    } catch (error: any) {
      showSnackbar(error.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return
    
    try {
      setError('')
      const token = localStorage.getItem('token') || ''
      await deleteDepartment(id)
      showSnackbar('Xóa phòng ban thành công!', 'success')
      fetchDepartments()
    } catch (error: any) {
      showSnackbar(error.message || 'Có lỗi xảy ra', 'error')
    }
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="p-6">
        <div className="mb-6">
          <Typography variant="h4" gutterBottom>
            Quản lý phòng ban
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Quản lý các phòng ban trong hệ thống
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

        <div className="mb-4">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={openCreateModal}
          >
            Thêm phòng ban mới
          </Button>
        </div>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={departments.map(dept => ({ ...dept, id: dept._id }))}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            sx={{ border: 0 }}
          />
        </Paper>

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Tên phòng ban"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Mã phòng ban"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                fullWidth
                required
              />
              
              <FormControl fullWidth>
                <InputLabel>Trưởng phòng</InputLabel>
                <Select
                  value={formData.head}
                  onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  label="Trưởng phòng"
                >
                  <MenuItem value="">Chưa chọn</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.fullName} - {user.rank.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Nhiệm vụ
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    label="Thêm nhiệm vụ"
                    value={newResponsibility}
                    onChange={(e) => setNewResponsibility(e.target.value)}
                    fullWidth
                    onKeyPress={(e) => e.key === 'Enter' && addResponsibility()}
                  />
                  <Button 
                    variant="contained" 
                    onClick={addResponsibility}
                    disabled={!newResponsibility.trim()}
                  >
                    Thêm
                  </Button>
                </Box>
                <List dense>
                  {formData.responsibilities.map((resp, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={resp} />
                      <ListItemSecondaryAction>
                        <MuiIconButton 
                          edge="end" 
                          onClick={() => removeResponsibility(index)}
                          color="error"
                        >
                          <RemoveIcon />
                        </MuiIconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
