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
  Snackbar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import NotificationSnackbar from '@/components/common/NotificationSnackbar'
import { getRanks, createRank, updateRank, deleteRank } from '@/js/apiService'

interface Rank {
  _id: string
  name: string
  level: number
  category: 'Enlisted' | 'NCO' | 'Officer' | 'General'
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const categoryLabels = {
  Enlisted: 'Binh sĩ',
  NCO: 'Hạ sĩ quan',
  Officer: 'Sĩ quan',
  General: 'Tướng lĩnh'
}

const categoryColors = {
  Enlisted: 'default',
  NCO: 'primary',
  Officer: 'secondary',
  General: 'error'
}

export default function AdminRanksPage() {
  const [isClient, setIsClient] = useState(false)
  const [ranks, setRanks] = useState<Rank[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentRank, setCurrentRank] = useState<Rank>()
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
    level: '',
    category: 'Enlisted' as 'Enlisted' | 'NCO' | 'Officer' | 'General',
    description: ''
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên cấp bậc', flex: 2 },
    { field: 'level', headerName: 'Cấp độ', flex: 1, type: 'number' },
    { 
      field: 'category', 
      headerName: 'Phân loại', 
      flex: 2,
      renderCell: (params) => (
        <Chip 
          label={categoryLabels[params.value as keyof typeof categoryLabels]} 
          color={categoryColors[params.value as keyof typeof categoryColors] as any}
          size="small"
        />
      )
    },
    { field: 'description', headerName: 'Mô tả', flex: 3 },
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
    fetchRanks()
  }, [])

  const fetchRanks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      const response = await getRanks(token)
      setRanks(response.data.ranks)
    } catch (error) {
      console.error('Error fetching ranks:', error)
      showSnackbar('Không thể tải danh sách cấp bậc', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setCurrentRank(undefined)
    setFormData({
      name: '',
      level: '',
      category: 'Enlisted',
      description: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (rank: Rank) => {
    setIsEditing(true)
    setCurrentRank(rank)
    setFormData({
      name: rank.name,
      level: rank.level.toString(),
      category: rank.category,
      description: rank.description || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      setError('')
      setLoading(true)
      
      const token = localStorage.getItem('token') || ''
      const rankData = {
        ...formData,
        level: parseInt(formData.level)
      }
      
      if (isEditing && currentRank?._id) {
        await updateRank(currentRank._id, rankData)
        showSnackbar('Cập nhật cấp bậc thành công!', 'success')
      } else {
        await createRank(rankData)
        showSnackbar('Tạo cấp bậc thành công!', 'success')
      }
      
      setIsModalOpen(false)
      fetchRanks()
    } catch (error: any) {
      showSnackbar(error.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cấp bậc này?')) return
    
    try {
      setError('')
      const token = localStorage.getItem('token') || ''
      await deleteRank(id)
      showSnackbar('Xóa cấp bậc thành công!', 'success')
      fetchRanks()
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
            Quản lý cấp bậc
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Quản lý các cấp bậc quân đội trong hệ thống
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
            Thêm cấp bậc mới
          </Button>
        </div>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={ranks.map(rank => ({ ...rank, id: rank._id }))}
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
        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditing ? 'Chỉnh sửa cấp bậc' : 'Thêm cấp bậc mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Tên cấp bậc"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Cấp độ"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
              
              <Select
                label="Phân loại"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                fullWidth
                required
              >
                <MenuItem value="Enlisted">Binh sĩ</MenuItem>
                <MenuItem value="NCO">Hạ sĩ quan</MenuItem>
                <MenuItem value="Officer">Sĩ quan</MenuItem>
                <MenuItem value="General">Tướng lĩnh</MenuItem>
              </Select>
              
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

        {/* Notification Snackbar */}
        <NotificationSnackbar
          open={openSnackbar}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onClose={handleCloseSnackbar}
        />
      </div>
    </DashboardLayout>
  )
}
