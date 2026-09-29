'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { shopService } from '@/lib/services';
import { ShopWithMember } from '@/types';

export default function AdminManageShopPage() {
  const router = useRouter();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopWithMember[]>([]);
  
  const [currentUser, setCurrentUser] = useState<{ roleId: number; memberId: string | number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mainPageLink, setMainPageLink] = useState('/admin/main');

  const [filters, setFilters] = useState({
    shopNumber: '',
    location: '',
    ownerName: '',
    phone: '',
  });

  useEffect(() => {
    const initData = () => {
      try {
        const userStr = localStorage.getItem('user') || localStorage.getItem('auth') || localStorage.getItem('userData');
        let roleId = 0;
        let memberId: string | number = '';

        if (userStr) {
          const userObj = JSON.parse(userStr);
          roleId = Number(userObj.role_id || userObj.roleId || userObj.role || 0);
          memberId = userObj.member_id || userObj.id || userObj.userId || '';
        }

        if (!roleId) roleId = Number(localStorage.getItem('role_id') || 0);
        if (!memberId) memberId = localStorage.getItem('member_id') || '';

        setCurrentUser({ roleId, memberId });

        if (roleId === 2) {
          setMainPageLink('/main');
        } else {
          setMainPageLink('/admin/main');
        }

        fetchShops();

      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    initData();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await shopService.getAll({ status: 'active' });
      if (response.success && response.data) {
        setShops(response.data);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error(error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueLocations = useMemo(() => {
    return [...new Set(shops.map(shop => shop.location).filter(Boolean))].sort() as string[];
  }, [shops]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({ shopNumber: '', location: '', ownerName: '', phone: '' });
  };

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesShopNumber = !filters.shopNumber || shop.shop_no?.toLowerCase().includes(filters.shopNumber.toLowerCase());
      const matchesLocation = !filters.location || shop.location?.toLowerCase().includes(filters.location.toLowerCase());
      const ownerName = shop.member ? `${shop.member.title || ''} ${shop.member.name || ''} ${shop.member.surname || ''}` : '';
      const matchesOwnerName = !filters.ownerName || ownerName.toLowerCase().includes(filters.ownerName.toLowerCase());
      const matchesPhone = !filters.phone || shop.member?.phone?.toLowerCase().includes(filters.phone.toLowerCase());
      return matchesShopNumber && matchesLocation && matchesOwnerName && matchesPhone;
    });
  }, [shops, filters]);

  // Style customization
  const inputStyle = {
    '& .MuiOutlinedInput-root': { 
        borderRadius: 1.5, 
        bgcolor: 'white', 
        fontSize: '16px' 
    }, 
    '& .MuiInputLabel-root': { 
        fontSize: '16px' 
    } 
  };

  const tableFontStyle = {
      fontSize: '14px'
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
          
          {/* --- แก้ไข: แสดงปุ่ม "หน้าผู้ดูแลระบบ" เฉพาะ Role 1 (Admin) เท่านั้น --- */}
          {currentUser?.roleId === 1 && (
            <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
              <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
            </Box>
          )}
          {/* ------------------------------------------------------------------- */}

          <Typography className="breadcrumb-current">จัดการข้อมูลร้านค้า</Typography>
        </Breadcrumbs>

        {/* Filter Section */}
        <Paper elevation={3} sx={{ mb: 3, p: 2.5, borderRadius: 3, border: '1px solid #e7ebff' }}>
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600, mb: 2, color: '#35373b' }}>ค้นหาข้อมูลร้านค้า</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
            
            <TextField 
              fullWidth size="small" label="เลขที่ร้าน" placeholder="ค้นหาเลขที่ร้าน" 
              value={filters.shopNumber} onChange={(e) => setFilters({ ...filters, shopNumber: e.target.value })} 
              sx={inputStyle} 
            />
            
            <Autocomplete 
              fullWidth size="small" options={uniqueLocations} 
              value={filters.location || null} onChange={(_, newValue) => setFilters({ ...filters, location: newValue || '' })} 
              renderInput={(params) => <TextField {...params} label="สถานที่/อาคาร" placeholder="เลือก..." />} 
              sx={inputStyle} 
            />
            
            <TextField 
              fullWidth size="small" label="ชื่อเจ้าของร้าน" placeholder="ค้นหาชื่อเจ้าของร้าน" 
              value={filters.ownerName} onChange={(e) => setFilters({ ...filters, ownerName: e.target.value })} 
              sx={inputStyle} 
            />
            
            <TextField 
              fullWidth size="small" label="เบอร์โทรศัพท์" placeholder="ค้นหาเบอร์โทรศัพท์" 
              value={filters.phone} onChange={(e) => setFilters({ ...filters, phone: e.target.value })} 
              sx={inputStyle} 
            />

          </Box>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="contained" size="small" startIcon={<ClearIcon />} onClick={handleClearFilters} sx={{ bgcolor: '#9e9e9e', color: 'white', borderRadius: 1.5, fontSize: '16px', px: 2 }}>ล้างตัวกรอง</Button>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={() => {}} sx={{ bgcolor: '#2196f3', color: 'white', borderRadius: 1.5, fontSize: '16px', px: 2 }}>ค้นหา</Button>
          </Stack>
        </Paper>

        {/* Table Section */}
        <Paper elevation={3} sx={{ p: 2.5, my: 1.5, width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid #e7ebff' }}>
          <Stack direction="row" justifyContent="flex-between">
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontSize: 16, my: 2, color: '#64696f', fontWeight: 500 }}>
                ผลการค้นหา:<b> {filteredShops.length}</b> รายการ
              </Typography>
            </Box>
            <Box sx={{ justifyContent: 'flex-end' }}>
              <Button
                variant="contained" size="small" startIcon={<AddIcon />}
                onClick={() => router.push('/admin/manage/shop_form?mode=add')}
                sx={{ bgcolor: '#4caf50', color: 'white', borderRadius: 1.5, px: 2, py: 0.5, textTransform: 'none', fontSize: 16, fontWeight: 500 }}
              >
                เพิ่มข้อมูลร้านค้า
              </Button>
            </Box>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e4eef8' }}>
                      <TableCell align="center" sx={{ ...tableFontStyle, borderBottom: '2px solid #507494', color: '#507494', fontWeight: 600 }}>เลขที่ร้าน</TableCell>
                      <TableCell align="center" sx={{ ...tableFontStyle, borderBottom: '2px solid #507494', color: '#507494', fontWeight: 600 }}>สถานที่/อาคาร</TableCell>
                      <TableCell align="center" sx={{ ...tableFontStyle, borderBottom: '2px solid #507494', color: '#507494', fontWeight: 600 }}>ชื่อเจ้าของร้าน</TableCell>
                      <TableCell align="center" sx={{ ...tableFontStyle, borderBottom: '2px solid #507494', color: '#507494', fontWeight: 600 }}>เบอร์โทรศัพท์</TableCell>
                      <TableCell align="center" sx={{ ...tableFontStyle, borderBottom: '2px solid #507494', color: '#507494', fontWeight: 600 }}>จัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredShops.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((shop) => (
                      <TableRow key={shop.shop_id} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}>
                        <TableCell align="center" sx={tableFontStyle}>{shop.shop_no}</TableCell>
                        <TableCell align="center" sx={tableFontStyle}>{shop.location}</TableCell>
                        <TableCell align="center" sx={tableFontStyle}>
                          {shop.member ? `${shop.member.title || ''} ${shop.member.name || ''} ${shop.member.surname || ''}`.trim() : '-'}
                        </TableCell>
                        <TableCell align="center" sx={tableFontStyle}>{shop.member?.phone || '-'}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/admin/manage/shop_form?mode=edit&shopId=${shop.shop_id}`)}
                            sx={{ bgcolor: '#fff3e0', color: '#f57c00', '&:hover': { bgcolor: '#ffe0b2' } }}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredShops.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary" sx={{ fontSize: 16 }}>ไม่พบข้อมูล</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredShops.length}
                rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="แสดงต่อหน้า:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`}
                sx={{ borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '14px' } }}
              />
            </>
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
}