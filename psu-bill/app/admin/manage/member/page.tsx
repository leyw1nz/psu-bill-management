'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth'; // เพิ่ม import getCurrentUser
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Stack,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RestoreFromTrash as RestoreIcon,
  VpnKey as VpnKeyIcon,
  ContentCopy as ContentCopyIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as PasswordVisibilityIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { Role, Member, MemberFilters } from '@/types';
import { memberService, roleService } from '@/lib/services';

// Role color mapping by role_id
const getRoleColor = (roleId?: number) => {
  switch (roleId) {
    case 1: // admin
      return { bg: '#ffebee', color: '#c62828' };
    case 2: // house
      return { bg: '#e3f2fd', color: '#1976d2' };
    case 3: // shop
      return { bg: '#f3e5f5', color: '#7b1fa2' };
    default:
      return { bg: '#f5f5f5', color: '#616161' };
  }
};

export default function AdminManageMemberPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<MemberFilters>({
    role_id: '',
    searchText: '',
    email: '',
    status: 'active',
    memberType: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [restoreResultOpen, setRestoreResultOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch members using service
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser(); // ดึง User ปัจจุบันเพื่อเช็คสิทธิ์

      const response = await memberService.getAll({
        role_id: filters.role_id,
        search: filters.searchText,
        email: filters.email,
        status: filters.status,
      });

      if (response.success && response.data) {
        let filteredMembers = response.data;

        // --- เพิ่มการกรองสำหรับ Role 2 (House Manager / Shop Manager) ---
        // ถ้าเป็น Role 2 ให้เห็นเฉพาะ Role 3 (General User)
        if (currentUser?.role_id === 2) {
           filteredMembers = filteredMembers.filter((member: Member) => member.role_id === 3);
        }
        // -----------------------------------------------------------

        // Apply memberType filter
        if (filters.memberType === 'staff') {
          // บุคลากร: has staff_id
          filteredMembers = filteredMembers.filter((member: Member) => member.staff_id !== null && member.staff_id !== undefined);
        } else if (filters.memberType === 'external') {
          // บุคคลภายนอก: no staff_id (and has username for login)
          filteredMembers = filteredMembers.filter((member: Member) =>
            (member.staff_id === null || member.staff_id === undefined) &&
            member.username !== null &&
            member.username !== undefined
          );
        } else {
          // 'all': Show all members (staff with staff_id or external with username)
          filteredMembers = filteredMembers.filter((member: Member) =>
            (member.staff_id !== null && member.staff_id !== undefined) ||
            (member.username !== null && member.username !== undefined)
          );
        }

        setMembers(filteredMembers);
      } else {
        console.error('Failed to fetch members:', response.error);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles using service
  const fetchRoles = async () => {
    const currentUser = getCurrentUser(); // ดึง User ปัจจุบัน
    const response = await roleService.getAll();
    
    if (response.success && response.data) {
      let fetchedRoles = response.data;

      // --- เพิ่มการกรอง Role Dropdown สำหรับ Role 2 ---
      if (currentUser?.role_id === 2) {
        fetchedRoles = fetchedRoles.filter(r => r.role_id === 3);
      }
      // ---------------------------------------------

      setRoles(fetchedRoles);
    } else {
      console.error('Failed to fetch roles:', response.error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearFilters = () => {
    setFilters({
      role_id: '',
      searchText: '',
      email: '',
      status: 'active',
      memberType: 'all',
    });
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchMembers();
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setSelectedMember(null);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    setLoading(true);

    try {
      if (!selectedMember?.member_id) return;

      const response = await memberService.delete(selectedMember.member_id);

      if (response.success) {
        await fetchMembers();
        setResultOpen(true);
      } else {
        console.error('Failed to delete member:', response.error);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClose = () => {
    setResultOpen(false);
    setSelectedMember(null);
  };

  const handleRestoreClick = (member: Member) => {
    setSelectedMember(member);
    setRestoreConfirmOpen(true);
  };

  const handleRestoreConfirmClose = () => {
    setRestoreConfirmOpen(false);
    setSelectedMember(null);
  };

  const handleConfirmRestore = async () => {
    setRestoreConfirmOpen(false);
    setLoading(true);

    try {
      if (!selectedMember?.member_id) return;

      const response = await memberService.restore(selectedMember.member_id);

      if (response.success) {
        await fetchMembers();
        setRestoreResultOpen(true);
      } else {
        console.error('Failed to restore member:', response.error);
      }
    } catch (error) {
      console.error('Error restoring member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreResultClose = () => {
    setRestoreResultOpen(false);
    setSelectedMember(null);
  };

  const handleResetPasswordClick = (member: Member) => {
    setSelectedMember(member);
    setResetPasswordConfirmOpen(true);
  };

  const handleResetPasswordConfirmClose = () => {
    setResetPasswordConfirmOpen(false);
    setSelectedMember(null);
  };

  const handleConfirmResetPassword = async () => {
    setResetPasswordConfirmOpen(false);
    setLoading(true);

    try {
      if (!selectedMember?.member_id) return;

      const response = await memberService.resetPassword(selectedMember.member_id);

      if (response.success && response.data?.password) {
        setGeneratedPassword(response.data.password);
        setPasswordDialogOpen(true);

        // Send email notification for password reset
        if (selectedMember.email) {
          try {
            const emailResponse = await fetch('/api/send-password-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: selectedMember.email,
                fullname: `${selectedMember.title || ''} ${selectedMember.name} ${selectedMember.surname}`.trim(),
                username: selectedMember.username,
                password: response.data.password,
                isReset: true,
              }),
            });

            const emailData = await emailResponse.json();
            if (!emailData.success) {
              console.error('Failed to send reset password email:', emailData.error);
            }
          } catch (emailError) {
            console.error('Error sending reset password email:', emailError);
          }
        }
      } else {
        console.error('Failed to reset password:', response.error);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setSelectedMember(null);
    setGeneratedPassword('');
    setShowPassword(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
  };

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
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
          {/* แสดงหน้าผู้ดูแลระบบเฉพาะ Role 1 (ถ้าต้องการ) แต่ในหน้านี้ Role 2 เข้ามาได้ */}
          {/* คุณอาจจะต้องเช็ค role ตรงนี้ด้วยถ้า Role 2 ไม่มีหน้า admin main */}
          <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
            <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
          </Box>
          <Typography className="breadcrumb-current">จัดการข้อมูลสมาชิก</Typography>
        </Breadcrumbs>

        {/* Filter Section */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid #e7ebff',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              mb: 2,
              color: '#35373b',
            }}
          >
            ค้นหาข้อมูลสมาชิก
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="ค้นหาทั่วไป"
              placeholder="ชื่อ, รหัส, username, เบอร์โทร"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="อีเมล"
              placeholder="ค้นหาอีเมล"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={roles}
              value={roles.find(r => r.role_id.toString() === filters.role_id) || null}
              onChange={(_, newValue) => setFilters({ ...filters, role_id: newValue?.role_id.toString() || '' })}
              getOptionLabel={(option) => option.role_name || 'ไม่ระบุ'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="บทบาท"
                  placeholder="เลือกบทบาท"
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={[
                { value: 'active', label: 'ปกติ' },
                { value: 'deleted', label: 'ถูกลบ' },
                { value: 'all', label: 'ทั้งหมด' },
              ]}
              value={
                filters.status === 'active'
                  ? { value: 'active', label: 'ปกติ' }
                  : filters.status === 'deleted'
                    ? { value: 'deleted', label: 'ถูกลบ' }
                    : { value: 'all', label: 'ทั้งหมด' }
              }
              onChange={(_, newValue) => setFilters({ ...filters, status: (newValue?.value as 'active' | 'deleted' | 'all') || 'active' })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="สถานะ"
                  placeholder="เลือกสถานะ"
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'staff', label: 'บุคลากร' },
                { value: 'external', label: 'บุคคลภายนอก' },
              ]}
              value={
                filters.memberType === 'staff'
                  ? { value: 'staff', label: 'บุคลากร' }
                  : filters.memberType === 'external'
                    ? { value: 'external', label: 'บุคคลภายนอก' }
                    : { value: 'all', label: 'ทั้งหมด' }
              }
              onChange={(_, newValue) => setFilters({ ...filters, memberType: (newValue?.value as 'all' | 'staff' | 'external') || 'all' })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ประเภทสมาชิก"
                  placeholder="เลือกประเภท"
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
          </Box>

          {/* Buttons Row */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="flex-end"
            sx={{
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: 18 }} />}
              onClick={handleClearFilters}
              sx={{
                bgcolor: '#9e9e9e',
                color: 'white',
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#757575',
                },
              }}
            >
              ล้างตัวกรอง
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
              onClick={handleSearch}
              sx={{
                bgcolor: '#2196f3',
                color: 'white',
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#1976d2',
                },
              }}
            >
              ค้นหา
            </Button>
          </Stack>
        </Paper>

        {/* Table */}
        <Paper
          elevation={3}
          sx={{
            p: 2.5,
            my: 1.5,
            width: '100%',
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid #e7ebff',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: 16, my: 2, color: '#64696f', fontWeight: 500 }}>
              {loading ? 'กำลังโหลด...' : `ผลการค้นหา: ${members.length} รายการ`}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => router.push('/admin/manage/member_form?mode=add')}
              sx={{
                bgcolor: '#4caf50',
                color: 'white',
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#388e3c',
                },
              }}
            >
              เพิ่มสมาชิกใหม่ (บุคคลภายนอก)
            </Button>
          </Stack>

          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#e4eef8' }}>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    รหัสสมาชิก
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    Username
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    ชื่อ-นามสกุล
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    อีเมล
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    เบอร์โทรศัพท์
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    บทบาท
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: '2px solid #507494',
                      color: '#507494',
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontSize={16}>
                        กำลังโหลดข้อมูล...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {members
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((member) => {
                        const roleStyle = getRoleColor(member.role_id ?? undefined);
                        const isDeleted = member.delete_date !== null && member.delete_date !== undefined;
                        const isStaff = member.staff_id !== null && member.staff_id !== undefined;
                        return (
                          <TableRow
                            key={member.member_id}
                            sx={{
                              bgcolor: isDeleted ? '#ffebee' : 'white',
                              opacity: isDeleted ? 0.7 : 1,
                              '&:hover': {
                                bgcolor: isDeleted ? '#ffcdd2' : '#f5f5f5',
                              },
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: 15,
                                py: 2,
                                fontWeight: 500,
                                color: '#1976d2',
                              }}
                            >
                              {member.staff_id || member.citizen_id || member.member_id}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: 15,
                                py: 2,
                              }}
                            >
                              {member.username || '-'}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: 15,
                                py: 2,
                              }}
                            >
                              {member.title || ''} {member.name || ''} {member.surname || ''}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: 14,
                                py: 2,
                                color: '#616161',
                              }}
                            >
                              {member.email || '-'}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                fontSize: 15,
                                py: 2,
                              }}
                            >
                              {member.phone || '-'}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                py: 2,
                              }}
                            >
                              <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                                <Chip
                                  label={member.role?.role_name || 'ไม่ระบุ'}
                                  size="small"
                                  sx={{
                                    bgcolor: roleStyle.bg,
                                    color: roleStyle.color,
                                    fontWeight: 500,
                                    fontSize: 13,
                                  }}
                                />
                                {isDeleted && (
                                  <Chip
                                    label="ถูกลบ"
                                    size="small"
                                    sx={{
                                      bgcolor: '#ffcdd2',
                                      color: '#c62828',
                                      fontWeight: 500,
                                      fontSize: 13,
                                    }}
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                borderBottom: '1px solid #e0e0e0',
                                py: 2,
                              }}
                            >
                              <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    router.push(`/admin/manage/member_form?mode=view&memberId=${member.member_id}`)
                                  }
                                  sx={{
                                    bgcolor: '#e3f2fd',
                                    color: '#1976d2',
                                    '&:hover': {
                                      bgcolor: '#bbdefb',
                                    },
                                  }}
                                  title="ดูข้อมูล"
                                >
                                  <VisibilityIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                                {!isDeleted ? (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        router.push(`/admin/manage/member_form?mode=edit&memberId=${member.member_id}`)
                                      }
                                      sx={{
                                        bgcolor: '#fff3e0',
                                        color: '#f57c00',
                                        '&:hover': {
                                          bgcolor: '#ffe0b2',
                                        },
                                      }}
                                      title="แก้ไข"
                                    >
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    {!isStaff && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleResetPasswordClick(member)}
                                        sx={{
                                          bgcolor: '#f3e5f5',
                                          color: '#7b1fa2',
                                          '&:hover': {
                                            bgcolor: '#e1bee7',
                                          },
                                        }}
                                        title="รีเซ็ตรหัสผ่าน"
                                      >
                                        <VpnKeyIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    )}
                                    {!isStaff && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick(member)}
                                        sx={{
                                          bgcolor: '#ffebee',
                                          color: '#d32f2f',
                                          '&:hover': {
                                            bgcolor: '#ffcdd2',
                                          },
                                        }}
                                        title="ลบ"
                                      >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    )}
                                  </>
                                ) : (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRestoreClick(member)}
                                    sx={{
                                      bgcolor: '#e8f5e9',
                                      color: '#2e7d32',
                                      '&:hover': {
                                        bgcolor: '#c8e6c9',
                                      },
                                    }}
                                    title="กู้คืน"
                                  >
                                    <RestoreIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary" fontSize={16}>
                            ไม่พบข้อมูลสมาชิก
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={members.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
            sx={{
              borderTop: '1px solid #e0e0e0',
              bgcolor: '#fafafa',
              '.MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel': {
                color: '#64696f',
                fontSize: 14,
                fontWeight: 500,
              },
            }}
          />
        </Paper>

        {/* Confirmation Modal */}
        <Dialog
          open={confirmOpen}
          onClose={handleConfirmClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WarningIcon sx={{ fontSize: 32, color: '#f57c00' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#35373b' }}>
                ยืนยันการลบสมาชิก
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 15, color: '#64696f', mt: 1 }}>
              ต้องการลบสมาชิก{' '}
              <strong>
                {selectedMember?.title || ''} {selectedMember?.name} {selectedMember?.surname}
              </strong>{' '}
              หรือไม่?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleConfirmClose}
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderColor: '#9e9e9e',
                color: '#616161',
                '&:hover': {
                  borderColor: '#757575',
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                bgcolor: '#d32f2f',
                '&:hover': {
                  bgcolor: '#c62828',
                },
              }}
            >
              ยืนยันการลบ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Result Modal */}
        <Dialog
          open={resultOpen}
          onClose={handleResultClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 32, color: '#4caf50' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#35373b' }}>
                ลบสมาชิกสำเร็จ
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 15, color: '#64696f', mt: 1 }}>
              ลบข้อมูลสมาชิก{' '}
              <strong>
                {selectedMember?.title || ''} {selectedMember?.name} {selectedMember?.surname}
              </strong>{' '}
              เรียบร้อยแล้ว
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleResultClose}
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                bgcolor: '#2196f3',
                '&:hover': {
                  bgcolor: '#1976d2',
                },
              }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Confirmation Modal */}
        <Dialog
          open={restoreConfirmOpen}
          onClose={handleRestoreConfirmClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <RestoreIcon sx={{ fontSize: 32, color: '#2e7d32' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#35373b' }}>
                ยืนยันการกู้คืนสมาชิก
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 15, color: '#64696f', mt: 1 }}>
              ต้องการกู้คืนสมาชิก{' '}
              <strong>
                {selectedMember?.title || ''} {selectedMember?.name} {selectedMember?.surname}
              </strong>{' '}
              หรือไม่?
              <br />
              <br />
              สมาชิกจะกลับมาใช้งานได้ตามปกติ
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleRestoreConfirmClose}
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderColor: '#9e9e9e',
                color: '#616161',
                '&:hover': {
                  borderColor: '#757575',
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmRestore}
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                bgcolor: '#2e7d32',
                '&:hover': {
                  bgcolor: '#1b5e20',
                },
              }}
            >
              ยืนยันการกู้คืน
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Result Modal */}
        <Dialog
          open={restoreResultOpen}
          onClose={handleRestoreResultClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 32, color: '#4caf50' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#35373b' }}>
                กู้คืนสมาชิกสำเร็จ
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 15, color: '#64696f', mt: 1 }}>
              กู้คืนสมาชิก{' '}
              <strong>
                {selectedMember?.title || ''} {selectedMember?.name} {selectedMember?.surname}
              </strong>{' '}
              เรียบร้อยแล้ว
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleRestoreResultClose}
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                bgcolor: '#2196f3',
                '&:hover': {
                  bgcolor: '#1976d2',
                },
              }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Confirmation Modal */}
        <Dialog
          open={resetPasswordConfirmOpen}
          onClose={handleResetPasswordConfirmClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <WarningIcon sx={{ fontSize: 32, color: '#ff9800' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#35373b' }}>
                ยืนยันการรีเซ็ตรหัสผ่าน
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 15, color: '#64696f', mt: 1 }}>
              ต้องการรีเซ็ตรหัสผ่านของสมาชิก{' '}
              <strong>
                {selectedMember?.title || ''} {selectedMember?.name} {selectedMember?.surname}
              </strong>{' '}
              หรือไม่?
              <br />
              <br />
              รหัสผ่านใหม่จะถูกสร้างขึ้นและส่งไปยังอีเมลของสมาชิก
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={handleResetPasswordConfirmClose}
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderColor: '#9e9e9e',
                color: '#616161',
                '&:hover': {
                  borderColor: '#757575',
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              variant="contained"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                bgcolor: '#ff9800',
                '&:hover': {
                  bgcolor: '#f57c00',
                },
              }}
            >
              ยืนยันการรีเซ็ต
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Display Dialog */}
        <Dialog
          open={passwordDialogOpen}
          onClose={handleClosePasswordDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', borderRadius: '12px 12px 0 0' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <VpnKeyIcon />
              <Typography variant="h6">รหัสผ่านใหม่</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>สำคัญ:</strong> กรุณาบันทึกรหัสผ่านนี้ เพราะจะไม่สามารถดูได้อีกครั้ง
              </Typography>
            </Alert>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                รหัสผ่านได้ถูกส่งไปยังอีเมล <strong>{selectedMember?.email}</strong> เรียบร้อยแล้ว
              </Typography>
            </Alert>
            <TextField
              fullWidth
              label="รหัสผ่าน"
              type={showPassword ? 'text' : 'password'}
              value={generatedPassword}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <PasswordVisibilityIcon />}
                      </IconButton>
                      <IconButton
                        onClick={handleCopyPassword}
                        edge="end"
                        color="primary"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f5',
                  fontFamily: 'monospace',
                  fontSize: 16,
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleClosePasswordDialog}
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 1.5,
                px: 3,
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              ปิด
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
}