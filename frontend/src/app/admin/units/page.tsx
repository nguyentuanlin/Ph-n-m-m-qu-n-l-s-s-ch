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
  Snackbar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import NotificationSnackbar from '@/components/common/NotificationSnackbar'
import { getUnits, createUnit, updateUnit, deleteUnit, CreateUpdateUnit } from '@/js/apiService'

interface Unit {
  _id: string
  name: string
  code: string
  type: 'Tiểu đội' | 'Trung đội' | 'Đại đội' | 'Tiểu đoàn' | 'Trung đoàn' | 'Lữ đoàn' | 'Sư đoàn' | 'Quân đoàn' | 'Quân khu'
  parentUnit?: {
    _id: string
    name: string
    code: string
    type: string
  }
  commander?: {
    _id: string
    fullName: string
    rank: {
      name: string
    }
  }
  location?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const unitTypeLabels = {
  'Tiểu đội': 'Tiểu đội',
  'Trung đội': 'Trung đội', 
  'Đại đội': 'Đại đội',
  'Tiểu đoàn': 'Tiểu đoàn',
  'Trung đoàn': 'Trung đoàn',
  'Lữ đoàn': 'Lữ đoàn',
  'Sư đoàn': 'Sư đoàn',
  'Quân đoàn': 'Quân đoàn',
  'Quân khu': 'Quân khu'
}

const unitTypeColors = {
  'Tiểu đội': 'default',
  'Trung đội': 'primary',
  'Đại đội': 'secondary',
  'Tiểu đoàn': 'success',
  'Trung đoàn': 'warning',
  'Lữ đoàn': 'info',
  'Sư đoàn': 'error',
  'Quân đoàn': 'default',
  'Quân khu': 'primary'
}

export default function AdminUnitsPage() {
  const [isClient, setIsClient] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [parentUnits, setParentUnits] = useState<Unit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentUnit, setCurrentUnit] = useState<Unit>()
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



  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Tiểu đội' as Unit['type'],
    parentUnit: '',
    location: '',
    description: ''
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên đơn vị', flex: 2 },
    { field: 'code', headerName: 'Mã đơn vị', flex: 1 },
    { 
      field: 'type', 
      headerName: 'Loại đơn vị', 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={unitTypeLabels[params.value as keyof typeof unitTypeLabels]} 
          color={unitTypeColors[params.value as keyof typeof unitTypeColors] as any}
          size="small"
        />
      )
    },
    { 
      field: 'parentUnit', 
      headerName: 'Đơn vị cha', 
      flex: 2,
      renderCell: (params) => params.value?.name || '-'
    },
    { 
      field: 'commander', 
      headerName: 'Chỉ huy', 
      flex: 2,
      renderCell: (params) => params.value?.fullName || '-'
    },
    { field: 'location', headerName: 'Vị trí', flex: 1 },
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
    fetchUnits()
    fetchParentUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      setLoading(true)
      const response = await getUnits()
      console.log('Units API response:', response)
      // Backend now returns data directly, not nested in units property
      const data = response.data || []
      setUnits(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching units:', error)
      showSnackbar('Không thể tải danh sách đơn vị', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchParentUnits = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5002/api/units', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Parent units API response:', data)
        // Backend now returns data directly, not nested in units property
        const units = data.data || []
        setParentUnits(Array.isArray(units) ? units : [])
      }
    } catch (error) {
      console.error('Error fetching parent units:', error)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setCurrentUnit(undefined)
    setFormData({
      name: '',
      code: '',
      type: 'Tiểu đội',
      parentUnit: '',
      location: '',
      description: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (unit: Unit) => {
    setIsEditing(true)
    setCurrentUnit(unit)
    setFormData({
      name: unit.name,
      code: unit.code,
      type: unit.type,
      parentUnit: unit.parentUnit?._id || '',
      location: unit.location || '',
      description: unit.description || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      setLoading(true)
      
      const token = localStorage.getItem('token') || ''
      const unitData: CreateUpdateUnit = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        parentUnit: formData.parentUnit || undefined,
        location: formData.location,
        description: formData.description
      }
      
      if (isEditing && currentUnit?._id) {
        await updateUnit(currentUnit._id, unitData)
        showSnackbar('Cập nhật đơn vị thành công!', 'success')
      } else {
        await createUnit(unitData)
        showSnackbar('Tạo đơn vị thành công!', 'success')
      }
      
      setIsModalOpen(false)
      fetchUnits()
    } catch (error: any) {
      showSnackbar(error.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) return
    
    try {
      setError('')
      const token = localStorage.getItem('token') || ''
      await deleteUnit(id)
      showSnackbar('Xóa đơn vị thành công!', 'success')
      fetchUnits()
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
            Quản lý đơn vị
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Quản lý các đơn vị quân đội trong hệ thống
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
            Thêm đơn vị mới
          </Button>
        </div>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={units.map(unit => ({ ...unit, id: unit._id }))}
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
            {isEditing ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Tên đơn vị"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Mã đơn vị"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                fullWidth
                required
              />
              
              <FormControl fullWidth required>
                <InputLabel>Loại đơn vị</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Unit['type'] })}
                  label="Loại đơn vị"
                >
                  {Object.entries(unitTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Đơn vị cha</InputLabel>
                <Select
                  value={formData.parentUnit}
                  onChange={(e) => setFormData({ ...formData, parentUnit: e.target.value })}
                  label="Đơn vị cha"
                >
                  <MenuItem value="">Không có</MenuItem>
                  {(parentUnits || []).map((unit) => (
                    <MenuItem key={unit._id} value={unit._id}>
                      {unit.name} ({unit.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Vị trí"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
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
