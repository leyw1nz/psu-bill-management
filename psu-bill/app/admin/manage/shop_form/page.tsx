'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import Link from 'next/link';
import { Member } from '@/types';
import { shopService, memberService } from '@/lib/services';

function ShopFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'add';
  const shopId = searchParams.get('shopId');

  // เพิ่ม State สำหรับลิงก์หน้าหลัก
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mainPageLink, setMainPageLink] = useState('/admin/main');
  const [userRole, setUserRole] = useState<number | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('auth') || localStorage.getItem('userData');
      if (userStr) {
          const userObj = JSON.parse(userStr);
          const roleId = Number(userObj.role_id || userObj.roleId || userObj.role);
          setUserRole(roleId);

          // --- กำหนดลิงก์หน้าหลักตาม Role ---
          if (roleId === 2) {
            setMainPageLink('/main');
          } else {
            setMainPageLink('/admin/main');
          }
          // -------------------------------
      }
    } catch(e) { console.error(e); }
  }, []);

  const backPath = '/admin/manage/shop'; // กลับไปหน้ารายการเสมอ

  const [loading, setLoading] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    shop_no: '',
    location: '',
    elect_account_no: '',
    water_account_no: '',
    member_id: '',
    note: '',
  });

  const [errors, setErrors] = useState<any>({});
  const [resultDialog, setResultDialog] = useState({
    open: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  const isReadOnly = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  const fetchShop = async (id: string) => {
    try {
      setLoading(true);
      const response = await shopService.getById(id);

      if (response.success && response.data) {
        const shop = response.data;
        setFormData({
          shop_no: shop.shop_no || '',
          location: shop.location || '',
          elect_account_no: shop.elect_account_no || '',
          water_account_no: shop.water_account_no || '',
          member_id: shop.member_id?.toString() || '',
          note: shop.note || '',
        });

        if (shop.member) {
          setSelectedMember(shop.member);
        }
      } else {
        showResultDialog('error', 'ไม่พบข้อมูล', 'ไม่พบข้อมูลร้านค้า');
        router.push(backPath);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      showResultDialog('error', 'เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลร้านค้า');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((isEditMode || isReadOnly) && shopId) {
      fetchShop(shopId);
    }
  }, [mode, shopId]);

  const handleSearchMembers = async () => {
    try {
      setSearchLoading(true);
      const response = await memberService.getAll({
        search: searchTerm,
        status: 'active',
      });
      if (response.success && response.data) {
        setMembers(response.data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error searching members:', error);
      setMembers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (openSearch) {
      handleSearchMembers();
    }
  }, [openSearch]);

  useEffect(() => {
    if (searchTerm && openSearch) {
      const timer = setTimeout(() => {
        handleSearchMembers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setFormData({ ...formData, member_id: member.member_id.toString() });
    setOpenSearch(false);
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setFormData({ ...formData, member_id: '' });
  };

  const showResultDialog = (type: 'success' | 'error', title: string, message: string) => {
    setResultDialog({ open: true, type, title, message });
  };

  const closeResultDialog = () => {
    setResultDialog({ ...resultDialog, open: false });
    if (resultDialog.type === 'success') {
      router.push(backPath);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.shop_no.trim()) newErrors.shop_no = 'กรุณากรอกรหัสร้าน';
    if (!formData.location.trim()) newErrors.location = 'กรุณากรอกสถานที่/อาคาร';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const duplicateCheck = await shopService.checkDuplicateShopNo(
        formData.shop_no,
        isEditMode ? shopId || undefined : undefined
      );

      if (duplicateCheck.isDuplicate) {
        setErrors({ ...errors, shop_no: 'รหัสร้านนี้มีอยู่ในระบบแล้ว' });
        showResultDialog('error', 'ข้อมูลซ้ำ', 'รหัสร้านนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
        setLoading(false);
        return;
      }

      const payload = {
        shop_no: formData.shop_no,
        location: formData.location,
        elect_account_no: formData.elect_account_no || undefined,
        water_account_no: formData.water_account_no || undefined,
        member_id: formData.member_id || undefined,
        note: formData.note || undefined,
      };

      let response;
      if (isAddMode) {
        response = await shopService.create(payload);
      } else if (isEditMode && shopId) {
        response = await shopService.update(shopId, payload);
      }

      if (response) {
        if (response.success) {
          showResultDialog('success', 'สำเร็จ', isAddMode ? 'เพิ่มข้อมูลร้านค้าสำเร็จ' : 'แก้ไขข้อมูลร้านค้าสำเร็จ');
        } else {
          showResultDialog('error', 'เกิดข้อผิดพลาด', response.error || 'ไม่สามารถบันทึกข้อมูลได้');
        }
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      showResultDialog('error', 'เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(backPath);
  };

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        {loading && (isEditMode || isReadOnly) && !formData.shop_no ? (
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
              
              {/* --- แก้ไข: ซ่อนหน้าผู้ดูแลระบบ ถ้าเป็น Role 2 --- */}
              {userRole !== 2 && (
                <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
                  <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
                </Box>
              )}
              {/* ------------------------------------------- */}

              <Box onClick={() => router.push('/admin/manage/shop')} className="breadcrumb-link">
                <Typography className="breadcrumb-text">จัดการข้อมูลร้านค้า</Typography>
              </Box>
              <Typography className="breadcrumb-current">
                {isAddMode ? 'เพิ่มข้อมูลร้านค้า' : isReadOnly ? 'ดูข้อมูลร้านค้า' : 'แก้ไขข้อมูลร้านค้า'}
              </Typography>
            </Breadcrumbs>

            {/* Form */}
            <Paper elevation={3} sx={{ mb: 3, p: 3, borderRadius: 3, border: '1px solid #e7ebff' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                {isAddMode && <PersonAddIcon sx={{ fontSize: 28, color: '#4caf50' }} />}
                {isEditMode && <EditIcon sx={{ fontSize: 28, color: '#f57c00' }} />}
                {isReadOnly && <VisibilityIcon sx={{ fontSize: 28, color: '#1976d2' }} />}
                <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600, color: '#35373b' }}>
                  {isAddMode ? 'เพิ่มข้อมูลร้านค้า' : isReadOnly ? 'ข้อมูลร้านค้า' : 'แก้ไขข้อมูลร้านค้า'}
                </Typography>
              </Stack>

              <form onSubmit={handleSubmit}>
                {/* Shop Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>ข้อมูลร้านค้า</Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    <TextField
                      fullWidth size="small" label="รหัสร้าน *" placeholder="S001"
                      value={formData.shop_no}
                      onChange={(e) => { setFormData({ ...formData, shop_no: e.target.value }); if(errors.shop_no) setErrors({...errors, shop_no: undefined}); }}
                      error={!!errors.shop_no} helperText={errors.shop_no}
                      disabled={isReadOnly} InputProps={{ readOnly: isReadOnly }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isReadOnly ? '#f5f5f5' : 'white' } }}
                    />
                    <TextField
                      fullWidth size="small" label="สถานที่/อาคาร *" placeholder="อาคารพาณิชย์ 1"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      error={!!errors.location} helperText={errors.location}
                      disabled={isReadOnly} InputProps={{ readOnly: isReadOnly }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isReadOnly ? '#f5f5f5' : 'white' } }}
                    />
                    <TextField
                      fullWidth size="small" label="เลขที่บัญชีไฟฟ้า" placeholder="E-2024-001"
                      value={formData.elect_account_no}
                      onChange={(e) => setFormData({ ...formData, elect_account_no: e.target.value })}
                      disabled={isReadOnly} InputProps={{ readOnly: isReadOnly }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isReadOnly ? '#f5f5f5' : 'white' } }}
                    />
                    <TextField
                      fullWidth size="small" label="เลขที่บัญชีน้ำประปา" placeholder="W-2024-001"
                      value={formData.water_account_no}
                      onChange={(e) => setFormData({ ...formData, water_account_no: e.target.value })}
                      disabled={isReadOnly} InputProps={{ readOnly: isReadOnly }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isReadOnly ? '#f5f5f5' : 'white' } }}
                    />
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        fullWidth size="small" label="หมายเหตุ" placeholder="ข้อมูลเพิ่มเติม" multiline rows={2}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        disabled={isReadOnly} InputProps={{ readOnly: isReadOnly }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isReadOnly ? '#f5f5f5' : 'white' } }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Owner Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>ข้อมูลเจ้าของร้าน</Typography>
                    <Divider sx={{ flex: 1 }} />
                    {/* ✅ แก้ไข: แสดงปุ่มค้นหาเสมอ (ลบเงื่อนไข userRole !== 2 ออก) */}
                    {!isReadOnly && (
                      <>
                        <Button
                          variant="contained" size="small" startIcon={<SearchIcon />}
                          onClick={() => setOpenSearch(true)}
                          sx={{ bgcolor: '#2196f3', textTransform: 'none', fontSize: 14, '&:hover': { bgcolor: '#1976d2' } }}
                        >
                          ค้นหาสมาชิก
                        </Button>
                        {selectedMember && (
                          <Button
                            variant="outlined" size="small" startIcon={<ClearIcon />}
                            onClick={handleClearMember}
                            sx={{ textTransform: 'none', fontSize: 14, borderColor: '#9e9e9e', color: '#9e9e9e' }}
                          >
                            ล้าง
                          </Button>
                        )}
                      </>
                    )}
                  </Stack>

                  {selectedMember ? (
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                        <Box><Typography variant="caption" color="text.secondary">รหัสสมาชิก</Typography><Typography variant="body2" fontWeight={500}>{selectedMember.staff_id || selectedMember.citizen_id || selectedMember.member_id}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">ชื่อ-นามสกุล</Typography><Typography variant="body2" fontWeight={500}>{selectedMember.title || ''} {selectedMember.name || ''} {selectedMember.surname || ''}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">อีเมล</Typography><Typography variant="body2" fontWeight={500}>{selectedMember.email || '-'}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography><Typography variant="body2" fontWeight={500}>{selectedMember.phone || '-'}</Typography></Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">{isReadOnly ? 'ไม่มีข้อมูลเจ้าของร้าน' : 'กรุณาค้นหาและเลือกสมาชิกเป็นเจ้าของร้าน'}</Typography>
                    </Alert>
                  )}
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined" size="medium" startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    sx={{ borderColor: '#9e9e9e', color: '#9e9e9e', borderRadius: 1.5, px: 3, py: 1, textTransform: 'none', fontSize: 15, fontWeight: 500, '&:hover': { borderColor: '#757575', bgcolor: '#f5f5f5' } }}
                  >
                    {isReadOnly ? 'ปิด' : 'ยกเลิก'}
                  </Button>
                  {!isReadOnly && (
                    <Button
                      type="submit" variant="contained" size="medium" startIcon={<SaveIcon />}
                      disabled={loading}
                      sx={{ bgcolor: '#4caf50', color: 'white', borderRadius: 1.5, px: 3, py: 1, textTransform: 'none', fontSize: 15, fontWeight: 500, '&:hover': { bgcolor: '#388e3c' } }}
                    >
                      {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>
                  )}
                </Stack>
              </form>
            </Paper>

            {/* Dialogs */}
            <Dialog open={openSearch} onClose={() => setOpenSearch(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
               <DialogTitle sx={{ bgcolor: '#2196f3', color: 'white', borderRadius: '12px 12px 0 0' }}>
                <Stack direction="row" alignItems="center" spacing={1}><SearchIcon /><Typography variant="h6">ค้นหาสมาชิก</Typography></Stack>
              </DialogTitle>
              <DialogContent sx={{ mt: 2, pb: 2 }}>
                <TextField fullWidth size="small" placeholder="ค้นหา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 2 }} autoFocus InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#9e9e9e' }} /> }} />
                
                <TableContainer sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead><TableRow><TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>รหัส</TableCell><TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell><TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>อีเมล</TableCell><TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>เบอร์โทร</TableCell><TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }} align="center">เลือก</TableCell></TableRow></TableHead>
                    <TableBody>
                      {searchLoading ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress size={40} /></TableCell></TableRow> : members.map((member) => (
                        <TableRow key={member.member_id} hover sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                          <TableCell>{member.staff_id || member.citizen_id || member.member_id}</TableCell>
                          <TableCell>{member.title} {member.name} {member.surname}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell align="center"><IconButton size="small" onClick={() => handleSelectMember(member)} sx={{ color: '#4caf50', '&:hover': { bgcolor: '#e8f5e9' } }}><CheckCircleIcon /></IconButton></TableCell>
                        </TableRow>
                      ))}
                      {!searchLoading && members.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#e1f5fe', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                        <InfoIcon sx={{ color: '#0288d1' }} />
                        <Typography variant="body2" sx={{ color: '#01579b' }}>
                            หากไม่พบสมาชิกสามารถเพิ่มได้ที่
                            <Link href="/admin/manage/member_form?mode=add" style={{ marginLeft: '5px', color: '#0288d1', fontWeight: 600, textDecoration: 'underline' }}>
                                เพิ่มสมาชิกใหม่
                            </Link>
                        </Typography>
                    </Box>
                    <Button onClick={() => setOpenSearch(false)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>ปิด</Button>
                </Stack>
              </DialogContent>
            </Dialog>

            <Dialog open={resultDialog.open} onClose={closeResultDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
              <DialogTitle sx={{ bgcolor: resultDialog.type === 'success' ? '#4caf50' : '#f44336', color: 'white', borderRadius: '12px 12px 0 0' }}>
                <Stack direction="row" alignItems="center" spacing={1}>{resultDialog.type === 'success' ? <CheckCircleIcon /> : <CancelIcon />}<Typography variant="h6">{resultDialog.title}</Typography></Stack>
              </DialogTitle>
              <DialogContent sx={{ mt: 3 }}><Alert severity={resultDialog.type} sx={{ borderRadius: 2 }}><Typography variant="body1">{resultDialog.message}</Typography></Alert></DialogContent>
              <DialogActions sx={{ p: 2 }}><Button onClick={closeResultDialog} variant="contained" color="primary">ตกลง</Button></DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </MainLayout>
  );
}

export default function ShopFormPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>}>
      <ShopFormContent />
    </Suspense>
  );
}