'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/types';
import { memberService } from '@/lib/services';
import { formatCompactNumber } from '@/lib/utils'; // อย่าลืม Import ตัวนี้

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  Paper,
  CircularProgress,
  Breadcrumbs,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Store as StoreIcon,
  BarChart as BarChartIcon,
  Print as PrintIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  EditDocument as EditDocumentIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  NavigateNext as NavigateNextIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
// Import Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import MainLayout from '@/components/MainLayout';

interface DashboardStats {
  houses: {
    total: number;
    withElectric: number;
    withWater: number;
  };
  shops: {
    total: number;
    withElectric: number;
    withWater: number;
    pendingPayment: number;
  };
  members: {
    total: number;
  };
}

export default function AdminMainPage() {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State สำหรับตัวเลขกล่องบน
  const [stats, setStats] = useState<DashboardStats>({
    houses: { total: 0, withElectric: 0, withWater: 0 },
    shops: { total: 0, withElectric: 0, withWater: 0, pendingPayment: 0 },
    members: { total: 0 },
  });

  // State สำหรับข้อมูลกราฟ
  const [chartData, setChartData] = useState<{
    trends: any[];
    costs: any[];
  }>({
    trends: [],
    costs: [],
  });

  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/');
          return;
        }

        setUser(currentUser);

        if (currentUser.member_id) {
          const response = await memberService.getById(currentUser.member_id);

          if (response.success && response.data) {
            if (response.data.role_id === 1) {
              setIsAdmin(true);
            } else {
              console.error('Access denied: User is not an admin');
              router.push('/');
              return;
            }
          } else {
            console.error('Failed to fetch member data:', response.error);
            router.push('/');
            return;
          }
        } else {
          console.error('No member_id found');
          router.push('/');
          return;
        }

        await fetchStats();
        setLoading(false);
      } catch (error) {
        console.error('Error in admin check:', error);
        router.push('/');
      }
    };

    const fetchStats = async () => {
      try {
        // 1. ดึงข้อมูลตัวเลขสรุป
        const statsRes = await fetch('/api/stats');
        
        if (!statsRes.ok) {
           throw new Error(`Failed to fetch stats: ${statsRes.status}`);
        }

        const statsJson = await statsRes.json();
        if (statsJson.success && statsJson.data) {
          setStats(statsJson.data);
        }

        // 2. ดึงข้อมูลกราฟ
        const chartRes = await fetch('/api/stats/charts');
        
        if (!chartRes.ok) {
           throw new Error(`Failed to fetch charts: ${chartRes.status}`);
        }

        const chartJson = await chartRes.json();
        
        if (chartJson.success && chartJson.data) {
          setChartData({
            trends: chartJson.data.trendData || [],
            costs: chartJson.data.costData || []
          });
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>กำลังตรวจสอบสิทธิ์...</Typography>
      </Box>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        {/* Breadcrumb and Header Section */}
        <Box>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
            aria-label="breadcrumb"
            className="breadcrumb-card"
          >
            <Box onClick={() => router.push('/main')} className="breadcrumb-link">
              <HomeIcon className="breadcrumb-icon" />
              <Typography className="breadcrumb-text">หน้าหลัก</Typography>
            </Box>
            <Typography className="breadcrumb-current">หน้าผู้ดูแลระบบ</Typography>
          </Breadcrumbs>
        </Box>

        {/* House Sections */}
        <Box sx={{ mb: 4, p: 4, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5} mb={4}>
            <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon sx={{ fontSize: 28, color: '#10b981' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', mb: 0.5 }}>บ้านพัก</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>จัดการข้อมูล บันทึกหน่วยมิเตอร์ และส่งออกข้อมูลให้กับกองคลัง</Typography>
            </Box>
            <Stack direction="row" alignItems="center" gap={2}>
              <Chip label={`ทั้งหมด ${stats.houses.total.toLocaleString()} หลัง`} sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', height: 36 }} />
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={(e) => { e.stopPropagation(); router.push('/admin/manage/house'); }} sx={{ borderColor: '#10b981', color: '#10b981', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#059669', bgcolor: 'rgba(16, 185, 129, 0.05)' } }}>จัดการข้อมูล</Button>
            </Stack>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {/* House Electric Card */}
            <Card onClick={() => router.push('/admin/manage/house_record_elect')} sx={{ background: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', border: '1px solid #fed7aa', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <EditDocumentIcon sx={{ fontSize: 60, color: '#f59e0b' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>บันทึกหน่วยมิเตอร์ไฟฟ้า</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#25bb59ff' }}>{stats.houses.withElectric.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#534f4fff' }}>/</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#35373bff' }}>{stats.houses.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>หลัง</Typography>
              </CardContent>
            </Card>

            {/* House Water Card */}
            <Card onClick={() => router.push('/admin/manage/house_record_water')} sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <EditDocumentIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>บันทึกหน่วยมิเตอร์น้ำประปา</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#25bb59ff' }}>{stats.houses.withWater.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#534f4fff' }}>/</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#35373bff' }}>{stats.houses.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>หลัง</Typography>
              </CardContent>
            </Card>

            {/* House Export */}
            <Card onClick={() => router.push('/admin/export_excel')} sx={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '1px solid #6ee7b7', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'start', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <DownloadIcon sx={{ fontSize: 60, color: '#06802cff' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>ส่งออกข้อมูลเป็นไฟล์ Excel</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#35373bff' }}>{stats.houses.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>หลัง</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Shop Sections */}
        <Box sx={{ mb: 4, p: 4, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5} mb={4}>
            <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StoreIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', mb: 0.5 }}>ร้านค้า</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>จัดการข้อมูล บันทึกหน่วยมิเตอร์ ตรวจสอบการชำระ และพิมพ์ใบแจ้งหนี้</Typography>
            </Box>
            <Stack direction="row" alignItems="center" gap={2}>
              <Chip label={`ทั้งหมด ${stats.shops.total.toLocaleString()} ร้าน`} sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem', height: 36 }} />
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={(e) => { e.stopPropagation(); router.push('/admin/manage/shop'); }} sx={{ borderColor: '#f59e0b', color: '#f59e0b', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245, 158, 11, 0.05)' } }}>จัดการข้อมูล</Button>
            </Stack>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {/* Store Electric */}
            <Card onClick={() => router.push('/admin/manage/shop_record_elect')} sx={{ background: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', border: '1px solid #fed7aa', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <EditDocumentIcon sx={{ fontSize: 60, color: '#f59e0b' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>บันทึกหน่วยมิเตอร์ไฟฟ้า</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#25bb59ff' }}>{stats.shops.withElectric.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#534f4fff' }}>/</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#35373bff' }}>{stats.shops.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>ร้าน</Typography>
              </CardContent>
            </Card>

            {/* Store Water */}
            <Card onClick={() => router.push('/admin/manage/shop_record_water')} sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <EditDocumentIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>บันทึกหน่วยมิเตอร์น้ำประปา</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#25bb59ff' }}>{stats.shops.withWater.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#534f4fff' }}>/</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#35373bff' }}>{stats.shops.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>ร้าน</Typography>
              </CardContent>
            </Card>

            {/* Store Print */}
            <Card onClick={() => router.push('/invoice_all')} sx={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'start', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <PrintIcon sx={{ fontSize: 60, color: '#ee2c39ff' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>พิมพ์ใบแจ้งหนี้</Typography>
              </CardContent>
            </Card>

            {/* Store Pay Check */}
            <Card onClick={() => router.push('/admin/check_slip')} sx={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', border: '1px solid #f9a8d4', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(236, 72, 153, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'start', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: '#3f0545ff' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>ตรวจสอบผลการชำระ</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#f59e0b' }}>{stats.shops.pendingPayment.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>รายการ</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Others Section */}
        <Box sx={{ mb: 4, p: 4, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5} mb={4}>
            <Box sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon sx={{ fontSize: 28, color: '#6366f1' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', mb: 0.5 }}>อื่นๆ</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>จัดการข้อมูลสมาชิก การตั้งค่าระบบ และอัตราค่าบริการ</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {/* Member Management */}
            <Card onClick={() => router.push('/admin/manage/member')} sx={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #93c5fd', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <PeopleIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>จัดการสมาชิก</Typography>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                  <Typography sx={{ fontSize: 32, fontWeight: 600, color: '#3b82f6' }}>{stats.members.total.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 24, textAlign: 'center', opacity: 0.8 }}>คน</Typography>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card onClick={() => router.push('/admin/system-settings')} sx={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d', borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)' } }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'start', justifyContent: 'center' }} >
                  <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #ede2e2', width: 80, height: 80 }}>
                    <SettingsIcon sx={{ fontSize: 60, color: '#f59e0b' }} />
                  </Avatar>
                </Box>
                <Typography variant="body1" sx={{ fontSize: 20, textAlign: 'center' }}>ตั้งค่าระบบ</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* ✅✅✅ Stat Sections (Real Data) ✅✅✅ */}
        <Box sx={{ mb: 4, p: 4, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <Stack direction={'row'} alignItems={'center'} gap={1.5} mb={4}>
            <Box sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChartIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', mb: 0.5 }}>สถิติและรายงาน</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>แผนภูมิและสถิติการใช้งานระบบ (6 เดือนล่าสุด)</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
            
            {/* Left Chart: Usage Trends (Area Chart) */}
            <Paper sx={{ height: 400, p: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, display: 'flex', flexDirection: 'column', transition: 'all 0.3s', '&:hover': { boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)' } }}>
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <TrendingUpIcon sx={{ color: '#8b5cf6' }} />
                <Typography variant="h6" fontWeight="bold" color="#1e293b">แนวโน้มการใช้งาน (หน่วย)</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trends}>
                  <defs>
                    <linearGradient id="colorElectric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b' }} 
                    tickFormatter={formatCompactNumber}
                    width={45} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    // ✅ แก้ไข: ใช้ type any เพื่อรองรับ undefined
                    formatter={(value: any) => [
                      typeof value === 'number' ? value.toLocaleString() : "0", 
                      ""
                    ]} 
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="electric" name="หน่วยไฟ" stroke="#f59e0b" fillOpacity={1} fill="url(#colorElectric)" />
                  <Area type="monotone" dataKey="water" name="หน่วยน้ำ" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWater)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>

            {/* Right Chart: Cost (Bar Chart) */}
            <Paper sx={{ height: 400, p: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 3, display: 'flex', flexDirection: 'column', transition: 'all 0.3s', '&:hover': { boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)' } }}>
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <AssessmentIcon sx={{ color: '#ec4899' }} />
                <Typography variant="h6" fontWeight="bold" color="#1e293b">ยอดรวมค่าใช้จ่าย (บาท)</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.costs} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b' }} 
                    tickFormatter={formatCompactNumber}
                    width={45} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    // ✅ แก้ไข: ใช้ type any เพื่อรองรับ undefined
                    formatter={(value: any) => [
                      typeof value === 'number' ? value.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : "0.00", 
                      ""
                    ]} 
                  />
                  <Legend />
                  <Bar dataKey="total" name="ยอดรวม (บาท)" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

          </Box>
        </Box>
      </Container >
    </MainLayout>
  );
}