'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { Role } from '@/types';
import { memberService, roleService } from '@/lib/services';
import { generatePassword } from '@/lib/passwordUtils';

function MemberFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'add'; // 'add', 'edit', or 'view'
  const memberId = searchParams.get('memberId');

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    email: '',
    title: '',
    name: '',
    surname: '',
    phone: '',
    username: '',
    role_id: '',
    password: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // เพิ่ม State สำหรับเก็บ Role ของ User ปัจจุบัน
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);

  // Result/Error Dialog state
  const [resultDialog, setResultDialog] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onClose: undefined as (() => void) | undefined,
  });

  const isReadOnly = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  // ✅ Helper: กำหนดเส้นทางย้อนกลับตาม Role
  const getBackPath = () => {
    if (currentUserRole === 2) {
      // Role 2 กลับไปหน้าจัดการสมาชิกของร้านค้า (ตามที่แจ้งมา)
      return '/admin/manage/membershopmanagement';
    }
    // Role อื่นๆ กลับไปหน้าจัดการสมาชิกปกติ
    return '/admin/manage/member';
  };

  // Show result dialog
  const showResultDialog = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    onClose?: () => void
  ) => {
    setResultDialog({ open: true, type, title, message, onClose });
  };

  // Close result dialog
  const closeResultDialog = () => {
    const callback = resultDialog.onClose;
    setResultDialog({ ...resultDialog, open: false, onClose: undefined });
    if (callback) {
      callback();
    }
  };

  // Fetch roles using service
  const fetchRoles = async () => {
    const response = await roleService.getAll();
    if (response.success && response.data) {
      let fetchedRoles = response.data;

      // กรอง Role สำหรับผู้จัดการร้านค้า (Role 2)
      const currentUser = getCurrentUser();
      if (currentUser?.role_id === 2) {
        fetchedRoles = fetchedRoles.filter(r => r.role_id === 3);
      }

      setRoles(fetchedRoles);
    } else {
      console.error('Error fetching roles:', response.error);
    }
  };

  // Fetch member data
  const fetchMember = async (id: string) => {
    try {
      setLoading(true);
      const response = await memberService.getById(id);

      if (response.success && response.data) {
        const member = response.data;
        setFormData({
          staff_id: member.staff_id || '',
          email: member.email || '',
          title: member.title || '',
          name: member.name || '',
          surname: member.surname || '',
          phone: member.phone || '',
          username: member.username || '',
          role_id: member.role_id?.toString() || '',
          password: '',
        });
      } else {
        console.error('Failed to fetch member:', response.error);
        showResultDialog('error', 'ไม่พบข้อมูล', 'ไม่พบข้อมูลสมาชิก');
        router.push(getBackPath()); // ✅ ใช้ getBackPath()
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      showResultDialog('error', 'เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  // Fetch next member ID
  const fetchNextMemberId = async () => {
    try {
      const response = await memberService.getNextMemberId();
      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          username: response.data!.padded_username,
        }));
      }
    } catch (error) {
      console.error('Error fetching next member_id:', error);
    }
  };

  useEffect(() => {
    // 1. ตรวจสอบ User Role เมื่อโหลดหน้าเว็บ
    const user = getCurrentUser();
    if (user) {
      setCurrentUserRole(user.role_id ?? null);
    }

    fetchRoles();
    if ((isEditMode || isReadOnly) && memberId) {
      fetchMember(memberId);
    }

    if (isAddMode) {
      const autoPassword = generatePassword(8);
      setFormData(prev => ({ ...prev, password: autoPassword }));
      fetchNextMemberId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, memberId]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.username.trim()) newErrors.username = 'กรุณากรอก Username';
    if (!formData.email.trim()) newErrors.email = 'กรุณากรอกอีเมล';
    if (!formData.role_id) newErrors.role_id = 'กรุณาเลือกบทบาท';
    if (!formData.name.trim()) newErrors.name = 'กรุณากรอกชื่อ';
    if (!formData.surname.trim()) newErrors.surname = 'กรุณากรอกนามสกุล';

    if (isAddMode && !formData.password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        role_id: parseInt(formData.role_id),
      };

      let response;
      if (isAddMode) {
        response = await memberService.create(payload);
      } else if (isEditMode && memberId) {
        response = await memberService.update(memberId, payload);
      }

      if (response) {
        if (response.success && response.data) {
          if (isAddMode && sendEmail && formData.email) {
            try {
              const emailResponse = await fetch('/api/send-password-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: formData.email,
                  username: formData.username,
                  password: formData.password,
                  isReset: false,
                }),
              });

              const emailData = await emailResponse.json();
              if (emailData.success) {
                // ✅ ใช้ getBackPath() แทน URL ตายตัว
                showResultDialog('success', 'สำเร็จ', 'เพิ่มสมาชิกสำเร็จและส่งอีเมลแจ้งรหัสผ่านเรียบร้อยแล้ว', () => router.push(getBackPath()));
              } else {
                // ✅ ใช้ getBackPath()
                showResultDialog('warning', 'เพิ่มสมาชิกสำเร็จ', 'เพิ่มสมาชิกสำเร็จ แต่ไม่สามารถส่งอีเมลได้: ' + (emailData.error || 'Unknown error'), () => router.push(getBackPath()));
              }
            } catch (emailError) {
              console.error('Error sending email:', emailError);
              // ✅ ใช้ getBackPath()
              showResultDialog('warning', 'เพิ่มสมาชิกสำเร็จ', 'เพิ่มสมาชิกสำเร็จ แต่เกิดข้อผิดพลาดในการส่งอีเมล', () => router.push(getBackPath()));
            }
          } else {
            // ✅ ใช้ getBackPath()
            showResultDialog('success', 'สำเร็จ', isAddMode ? 'เพิ่มสมาชิกสำเร็จ' : 'แก้ไขข้อมูลสมาชิกสำเร็จ', () => router.push(getBackPath()));
          }
        } else {
          showResultDialog('error', 'เกิดข้อผิดพลาด', response.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error saving member:', error);
      showResultDialog('error', 'เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(getBackPath()); // ✅ ใช้ getBackPath()
  };

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        {loading && (isEditMode || isReadOnly) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Breadcrumbs */}
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
              aria-label="breadcrumb"
              className="breadcrumb-card"
            >
              <Box onClick={() => router.push('/main')} className="breadcrumb-link">
                <HomeIcon className="breadcrumb-icon" />
                <Typography className="breadcrumb-text">หน้าหลัก</Typography>
              </Box>

              {/* แสดง Breadcrumb แยกตาม Role */}
              {currentUserRole === 1 && (
                <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
                  <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
                </Box>
              )}
              {/* ✅ ลิงก์จัดการสมาชิก วิ่งไปตาม Role ที่กำหนด */}
              <Box onClick={() => router.push(getBackPath())} className="breadcrumb-link">
                <Typography className="breadcrumb-text">จัดการข้อมูลสมาชิก</Typography>
              </Box>

              <Typography className="breadcrumb-current">
                {isAddMode ? 'เพิ่มสมาชิกใหม่' : isReadOnly ? 'ดูข้อมูลสมาชิก' : 'แก้ไขข้อมูลสมาชิก'}
              </Typography>
            </Breadcrumbs>

            {/* Form */}
            <Paper
              elevation={3}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 3,
                border: '1px solid #e7ebff',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                {isAddMode && <PersonAddIcon sx={{ fontSize: 28, color: '#4caf50' }} />}
                {isEditMode && <EditIcon sx={{ fontSize: 28, color: '#f57c00' }} />}
                {isReadOnly && <VisibilityIcon sx={{ fontSize: 28, color: '#1976d2' }} />}
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#35373b',
                  }}
                >
                  {isAddMode ? 'เพิ่มสมาชิกใหม่' : isReadOnly ? 'ข้อมูลสมาชิก' : 'แก้ไขข้อมูลสมาชิก'}
                </Typography>
              </Stack>

              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      ข้อมูลบัญชีผู้ใช้
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Username *"
                      placeholder="000001"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      error={!!errors.username}
                      helperText={errors.username || (isAddMode ? 'Username จะถูกสร้างอัตโนมัติจากรหัสสมาชิก' : '')}
                      disabled={true}
                      InputProps={{ readOnly: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: '#f5f5f5',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="อีเมล *"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={isReadOnly}
                      InputProps={{ readOnly: isReadOnly }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    />
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!errors.role_id}
                      disabled={isReadOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    >
                      <InputLabel>บทบาท *</InputLabel>
                      <Select
                        value={formData.role_id}
                        label="บทบาท *"
                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                        readOnly={isReadOnly}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.role_id} value={role.role_id.toString()}>
                            {role.role_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.role_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.role_id}
                        </Typography>
                      )}
                    </FormControl>

                    {isAddMode && (
                      <TextField
                        fullWidth
                        size="small"
                        label="รหัสผ่านที่สร้างอัตโนมัติ *"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="รหัสผ่านจะถูกสร้างอัตโนมัติ"
                        value={formData.password}
                        error={!!errors.password}
                        slotProps={{
                          input: {
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => {
                                    navigator.clipboard.writeText(formData.password);
                                    showResultDialog('success', 'คัดลอกสำเร็จ', 'คัดลอกรหัสผ่านไปยังคลิปบอร์ดแล้ว');
                                  }}
                                  edge="end"
                                  size="small"
                                  title="คัดลอกรหัสผ่าน"
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  size="small"
                                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                                >
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                                <IconButton
                                  onClick={() => {
                                    const newPassword = generatePassword(8);
                                    setFormData({ ...formData, password: newPassword });
                                    showResultDialog('info', 'สร้างรหัสผ่านใหม่', 'สร้างรหัสผ่านใหม่เรียบร้อยแล้ว');
                                  }}
                                  edge="end"
                                  size="small"
                                  title="สร้างรหัสผ่านใหม่"
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      />
                    )}

                    {isAddMode && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="ส่งอีเมลแจ้งรหัสผ่านไปยังสมาชิก"
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      ข้อมูลส่วนตัว
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="คำนำหน้า"
                      placeholder="นาย/นาง/นางสาว"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={isReadOnly}
                      InputProps={{ readOnly: isReadOnly }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="ชื่อ *"
                      placeholder="กรอกชื่อ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={!!errors.name}
                      helperText={errors.name}
                      disabled={isReadOnly}
                      InputProps={{ readOnly: isReadOnly }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="นามสกุล *"
                      placeholder="กรอกนามสกุล"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      error={!!errors.surname}
                      helperText={errors.surname}
                      disabled={isReadOnly}
                      InputProps={{ readOnly: isReadOnly }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    />
                    {(isEditMode || isReadOnly) && formData.staff_id && (
                      <TextField
                        fullWidth
                        size="small"
                        label="รหัสบุคลากร"
                        placeholder="รหัสบุคลากร"
                        value={formData.staff_id}
                        onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                        disabled={isReadOnly}
                        InputProps={{ readOnly: isReadOnly }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                          },
                        }}
                      />
                    )}
                    <TextField
                      fullWidth
                      size="small"
                      label="เบอร์โทรศัพท์"
                      placeholder="081-234-5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isReadOnly}
                      InputProps={{ readOnly: isReadOnly }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          bgcolor: isReadOnly ? '#f5f5f5' : 'white',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      sx={{
                        borderColor: '#9e9e9e',
                        color: '#9e9e9e',
                        borderRadius: 1.5,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontSize: 15,
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: '#757575',
                          bgcolor: '#f5f5f5',
                        },
                      }}
                    >
                      {isReadOnly ? 'ปิด' : 'ยกเลิก'}
                    </Button>
                    {!isReadOnly && (
                      <Button
                        type="submit"
                        variant="contained"
                        size="medium"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                        sx={{
                          bgcolor: '#4caf50',
                          color: 'white',
                          borderRadius: 1.5,
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontSize: 15,
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: '#388e3c',
                          },
                        }}
                      >
                        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </form>
            </Paper>

            <Dialog
              open={resultDialog.open}
              onClose={closeResultDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
                sx={{
                  bgcolor:
                    resultDialog.type === 'success'
                      ? '#4caf50'
                      : resultDialog.type === 'error'
                        ? '#f44336'
                        : resultDialog.type === 'warning'
                          ? '#ff9800'
                          : '#2196f3',
                  color: 'white',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {resultDialog.type === 'success' && <CheckCircleIcon />}
                  {resultDialog.type === 'error' && <ErrorIcon />}
                  {resultDialog.type === 'warning' && <WarningIcon />}
                  {resultDialog.type === 'info' && <InfoIcon />}
                  <Typography variant="h6">{resultDialog.title}</Typography>
                </Stack>
              </DialogTitle>
              <DialogContent sx={{ mt: 3 }}>
                <Alert
                  severity={resultDialog.type}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body1">{resultDialog.message}</Typography>
                </Alert>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={closeResultDialog} variant="contained" color="primary">
                  ตกลง
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </MainLayout>
  );
}

export default function MemberFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MemberFormContent />
    </Suspense>
  );
}