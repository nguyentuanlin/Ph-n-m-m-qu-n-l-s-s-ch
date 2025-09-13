'use client';

import { useState, useEffect } from "react";
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
    FormControl,
    InputLabel,
    Grid,
    Snackbar,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import axios from "axios";
import { 
    apiService, 
    createUser, 
    getUsers, 
    updateUser, 
    deleteUser,
    User,
    getRanks,
    getUnits,
    getDepartments,
    getPositions,
    Rank,
    Unit,
    Department,
    Position
} from "@/js/apiService";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function AdminUsersPage() {
    const [isClient, setIsClient] = useState(false)
    const [users, setUsers] = useState<User[]>([]);
    const [ranks, setRanks] = useState<Rank[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState<User>();
    const [msgError, setError] = useState("");
    const [msgSuccess, setSuccess] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
    const paginationModel = { page: 0, pageSize: 5 };

    // handle table data
    const defColumns: GridColDef[] = [
        { field: 'fullName', headerName: 'Họ tên', flex: 2 },
        { field: 'email', headerName: 'Email', flex: 2 },
        { field: 'username', headerName: 'Tên đăng nhập', flex: 1 },
        { 
            field: 'role', 
            headerName: 'Quyền', 
            flex: 1,
            renderCell: (params) => {
                const roleLabels = {
                    'admin': 'Quản trị viên',
                    'commander': 'Chỉ huy',
                    'staff': 'Nhân viên'
                };
                return roleLabels[params.value as keyof typeof roleLabels] || params.value;
            }
        },
        { field: 'phone', headerName: 'Số điện thoại', flex: 1 },
        { field: 'duty', headerName: 'Nhiệm vụ', flex: 1 },
        {
            field: 'isActive',
            headerName: 'Trạng thái',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ 
                    color: params.value ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                }}>
                    {params.value ? 'Hoạt động' : 'Không hoạt động'}
                </Box>
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
    ];

    useEffect(() => {
        setIsClient(true);
        fetchUsers();
        fetchReferenceData();
    }, []);

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem("token") ?? "";
            const [ranksRes, unitsRes, departmentsRes, positionsRes] = await Promise.all([
                getRanks(token),
                getUnits(token),
                getDepartments(),
                getPositions()
            ]);
            
            setRanks(ranksRes.data.ranks);
            setUnits(unitsRes.data.units);
            setDepartments(departmentsRes.data.departments);
            setPositions(positionsRes.data.positions);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    };

    const fetchUsers = async () => {
        const res = await getUsers();
        const data = res.data.users ?? [];
        setUsers(data);
    };

    const openEditModal = (user: any) => {
        setIsModalOpen(true);
        setIsEditing(true);
        setCurrentUser(user);
    };

    const openCreateModal = () => {
        setIsModalOpen(true);
        setIsEditing(false);
        setCurrentUser({ 
            _id: '', 
            fullName: '', 
            email: '', 
            username: '', 
            role: 'staff',
            rank: '',
            unit: '',
            department: '',
            position: '',
            duty: '',
            phone: '',
            password: '',
            isActive: true,
            createdAt: '',
            updatedAt: ''
        });
    };

    const handleDelete = async (id: any) => {
        if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            try {
                const token = localStorage.getItem("token") || "";
                await deleteUser(id);
                await fetchUsers();
                showSnackbar("Xóa người dùng thành công!", "success");
            } catch (error: any) {
                showSnackbar("Xóa người dùng thất bại: " + error.message, "error");
            }
        }
    };

    const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const handleSave = async () => {
        try {
            var token = localStorage.getItem("token") ?? "";
            if (currentUser) {
                // Validate required fields
                if (!currentUser.fullName || !currentUser.email || !currentUser.username) {
                    setError("Vui lòng điền đầy đủ thông tin bắt buộc");
                    return;
                }
                
                if (!isEditing && !currentUser.password) {
                    setError("Vui lòng nhập mật khẩu");
                    return;
                }
                
                if (!currentUser.rank || !currentUser.unit || !currentUser.department || !currentUser.position || !currentUser.duty) {
                    setError("Vui lòng chọn đầy đủ thông tin quân đội");
                    return;
                }
                
                if (isEditing) {
                    await updateUser(currentUser._id, currentUser);
                    await fetchUsers();
                    setIsModalOpen(false);
                    setError("");
                    showSnackbar("Cập nhật người dùng thành công!", "success");
                } else {
                    await createUser(currentUser);
                    await fetchUsers();
                    setIsModalOpen(false);
                    setError("");
                    showSnackbar("Tạo người dùng thành công!", "success");
                }
            }
        } catch (error: any) {
            setError(error.message.toString());
            showSnackbar("Có lỗi xảy ra: " + error.message, "error");
        }
    };

    return (
        <DefaultLayout>
            <Typography variant="h4" gutterBottom>
                Quản lý người dùng
            </Typography>
            <Button variant="contained" color="primary" onClick={openCreateModal}>
                Thêm người dùng
            </Button>
            <Box sx={{ height: 400, width: '100%', marginTop: 2 }}>
                <DataGrid
                    rows={users.map(user => ({ ...user, id: user._id }))}
                    columns={defColumns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[5, 10, 20]}
                    sx={{ border: 0 }}
                />
            </Box>

            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? "Chỉnh sửa người dùng" : "Thêm mới người dùng"}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Thông tin cơ bản */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Thông tin cơ bản
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                    <TextField
                        label="Họ tên"
                        type="text"
                        fullWidth
                        value={currentUser?.fullName || ''}
                        onChange={(e) => setCurrentUser({...currentUser!, fullName: e.target.value})}
                                required
                    />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                    <TextField
                        label="Tên đăng nhập"
                        type="text"
                        fullWidth
                        value={currentUser?.username || ''}
                        onChange={(e) => setCurrentUser({...currentUser!, username: e.target.value})}
                                required
                    />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={currentUser?.email || ''}
                        onChange={(e) => setCurrentUser({...currentUser!, email: e.target.value})}
                                disabled={isEditing}
                                required
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Số điện thoại"
                                type="text"
                                fullWidth
                                value={currentUser?.phone || ''}
                                onChange={(e) => setCurrentUser({...currentUser!, phone: e.target.value})}
                            />
                        </Grid>
                        
                        {!isEditing && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Mật khẩu"
                                    type="password"
                                    fullWidth
                                    value={currentUser?.password || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, password: e.target.value})}
                                    required
                                />
                            </Grid>
                        )}
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Quyền</InputLabel>
                    <Select
                                    value={currentUser?.role || 'staff'}
                                    onChange={(e) => setCurrentUser({...currentUser!, role: e.target.value})}
                        label="Quyền"
                                >
                                    <MenuItem value="staff">Nhân viên</MenuItem>
                                    <MenuItem value="commander">Chỉ huy</MenuItem>
                                    <MenuItem value="admin">Quản trị viên</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* Thông tin quân đội */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Thông tin quân đội
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Cấp bậc</InputLabel>
                                <Select
                                    value={currentUser?.rank || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, rank: e.target.value})}
                                    label="Cấp bậc"
                                >
                                    {ranks.map((rank) => (
                                        <MenuItem key={rank._id} value={rank._id}>
                                            {rank.name} ({rank.category})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Đơn vị</InputLabel>
                                <Select
                                    value={currentUser?.unit || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, unit: e.target.value})}
                                    label="Đơn vị"
                                >
                                    {units.map((unit) => (
                                        <MenuItem key={unit._id} value={unit._id}>
                                            {unit.name} ({unit.type})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Phòng ban</InputLabel>
                                <Select
                                    value={currentUser?.department || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, department: e.target.value})}
                                    label="Phòng ban"
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept._id} value={dept._id}>
                                            {dept.name} ({dept.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Chức vụ</InputLabel>
                                <Select
                                    value={currentUser?.position || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, position: e.target.value})}
                                    label="Chức vụ"
                                >
                                    {positions.map((pos) => (
                                        <MenuItem key={pos._id} value={pos._id}>
                                            {pos.name} - {pos.department.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Nhiệm vụ</InputLabel>
                                <Select
                                    value={currentUser?.duty || ''}
                                    onChange={(e) => setCurrentUser({...currentUser!, duty: e.target.value})}
                                    label="Nhiệm vụ"
                                >
                                    <MenuItem value="Huấn luyện">Huấn luyện</MenuItem>
                                    <MenuItem value="Chiến đấu">Chiến đấu</MenuItem>
                                    <MenuItem value="Hậu cần">Hậu cần</MenuItem>
                                    <MenuItem value="Tham mưu">Tham mưu</MenuItem>
                                    <MenuItem value="Chính trị">Chính trị</MenuItem>
                                    <MenuItem value="Kỹ thuật">Kỹ thuật</MenuItem>
                                    <MenuItem value="Quân y">Quân y</MenuItem>
                                    <MenuItem value="Tài chính">Tài chính</MenuItem>
                                    <MenuItem value="Pháp chế">Pháp chế</MenuItem>
                                    <MenuItem value="Đối ngoại">Đối ngoại</MenuItem>
                                    <MenuItem value="Công nghệ thông tin">Công nghệ thông tin</MenuItem>
                                    <MenuItem value="An ninh">An ninh</MenuItem>
                    </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    {msgError.length > 0 && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {msgError}
                        </Alert>
                    )}
                    <Button onClick={() => setIsModalOpen(false)} color="secondary">
                        Huỷ bỏ
                    </Button>
                    <Button onClick={handleSave} color="primary" variant="contained">
                        Lưu thông tin
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </DefaultLayout>
    );
}