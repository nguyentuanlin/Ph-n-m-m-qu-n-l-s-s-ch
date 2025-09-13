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
import { getPositions, createPosition, updatePosition, deletePosition } from '@/js/apiService'

interface Position {
  _id: string
  name: string
  code: string
  department: {
    _id: string
    name: string
    code: string
  }
  level: 'Junior' | 'Senior' | 'Management' | 'Executive'
  requirements: {
    minRank?: {
      _id: string
      name: string
      level: number
    }
    experience?: number
  }
  responsibilities: string[]
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Department {
  _id: string
  name: string
  code: string
}

interface Rank {
  _id: string
  name: string
  level: number
}

const levelLabels = {
  Junior: 'Cấp cơ sở',
  Senior: 'Cấp cao',
  Management: 'Quản lý',
  Executive: 'Điều hành'
}

const levelColors = {
  Junior: 'default',
  Senior: 'primary',
  Management: 'secondary',
  Executive: 'error'
}

export default function AdminPositionsPage() {
  const [isClient, setIsClient] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [ranks, setRanks] = useState<Rank[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<Position>()
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
    department: '',
    level: 'Junior' as Position['level'],
    minRank: '',
    experience: '',
    responsibilities: [] as string[],
    description: ''
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên chức vụ', flex: 2 },
    { field: 'code', headerName: 'Mã chức vụ', flex: 1 },
    { 
      field: 'department', 
      headerName: 'Phòng ban', 
      flex: 2,
      renderCell: (params) => params.value?.name || '-'
    },
    { 
      field: 'level', 
      headerName: 'Cấp độ', 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={levelLabels[params.value as keyof typeof levelLabels]} 
          color={levelColors[params.value as keyof typeof levelColors] as any}
          size="small"
        />
      )
    },
    { 
      field: 'requirements', 
      headerName: 'Yêu cầu', 
      flex: 2,
      renderCell: (params) => (
        <Box>
          {params.value?.minRank && (
            <Chip 
              label={`Cấp bậc: ${params.value.minRank.name}`} 
              size="small" 
              className="mr-1 mb-1"
            />
          )}
          {params.value?.experience && (
            <Chip 
              label={`Kinh nghiệm: ${params.value.experience} năm`} 
              size="small" 
              color="primary"
            />
          )}
        </Box>
      )
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
    fetchPositions()
    fetchDepartments()
    fetchRanks()
  }, [])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || ''
      const response = await getPositions()
      setPositions(response.data.positions)
    } catch (error) {
      console.error('Error fetching positions:', error)
      showSnackbar('Không thể tải danh sách chức vụ', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5002/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data.departments)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchRanks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5002/api/ranks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRanks(data.data.ranks)
      }
    } catch (error) {
      console.error('Error fetching ranks:', error)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setCurrentPosition(undefined)
    setFormData({
      name: '',
      code: '',
      department: '',
      level: 'Junior',
      minRank: '',
      experience: '',
      responsibilities: [],
      description: ''
    })
    setNewResponsibility('')
    setIsModalOpen(true)
  }

  const openEditModal = (position: Position) => {
    setIsEditing(true)
    setCurrentPosition(position)
    setFormData({
      name: position.name,
      code: position.code,
      department: position.department._id,
      level: position.level,
      minRank: position.requirements?.minRank?._id || '',
      experience: position.requirements?.experience?.toString() || '',
      responsibilities: position.responsibilities || [],
      description: position.description || ''
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
      const positionData = {
        name: formData.name,
        code: formData.code,
        department: formData.department,
        level: formData.level,
        requirements: {
          minRank: formData.minRank || undefined,
          experience: formData.experience ? parseInt(formData.experience) : undefined
        },
        responsibilities: formData.responsibilities,
        description: formData.description
      }
      
      if (isEditing && currentPosition?._id) {
        await updatePosition(currentPosition._id, positionData)
        showSnackbar('Cập nhật chức vụ thành công!', 'success')
      } else {
        await createPosition(positionData)
        showSnackbar('Tạo chức vụ thành công!', 'success')
      }
      
      setIsModalOpen(false)
      fetchPositions()
    } catch (error: any) {
      showSnackbar(error.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chức vụ này?')) return
    
    try {
      setError('')
      const token = localStorage.getItem('token') || ''
      await deletePosition(id)
      showSnackbar('Xóa chức vụ thành công!', 'success')
      fetchPositions()
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
            Quản lý chức vụ
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Quản lý các chức vụ trong hệ thống
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
            Thêm chức vụ mới
          </Button>
        </div>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={positions.map(pos => ({ ...pos, id: pos._id }))}
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
            {isEditing ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Tên chức vụ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Mã chức vụ"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                fullWidth
                required
              />
              
              <FormControl fullWidth required>
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Phòng ban"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required>
                <InputLabel>Cấp độ</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as Position['level'] })}
                  label="Cấp độ"
                >
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Cấp bậc tối thiểu</InputLabel>
                  <Select
                    value={formData.minRank}
                    onChange={(e) => setFormData({ ...formData, minRank: e.target.value })}
                    label="Cấp bậc tối thiểu"
                  >
                    <MenuItem value="">Không yêu cầu</MenuItem>
                    {ranks.map((rank) => (
                      <MenuItem key={rank._id} value={rank._id}>
                        {rank.name} (Cấp {rank.level})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Kinh nghiệm (năm)"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Box>
              
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
