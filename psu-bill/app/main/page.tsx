'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  Store as StoreIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
  Apartment as ApartmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { House, Shop, Member } from '@/types';
import { getHouseTypeLabel } from '@/lib/utils';

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [houses, setHouses] = useState<House[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [member, setMember] = useState<Member | null>(null);
  
  // Roles Checks
  const [isAdmin, setIsAdmin] = useState(false);        
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null); 

  const router = useRouter();

  useEffect(() => {
    const loadUserProperties = async () => {
      try {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
          router.push('/');
          return;
        }

        // 1. Setup Roles
        setUserRole(currentUser.role_id ?? null);
        if (currentUser.role_id === 1) setIsAdmin(true);
        if (currentUser.role_id === 3) setIsOwner(true);

        // 2. Get member_id
        const memberId = localStorage.getItem('member_id') || currentUser.id; 

        // 3. Fetch Data
        if (memberId) {
          try {
            const apiUrl = `/api/members/${memberId}/properties`;
            const propertiesResponse = await fetch(apiUrl);

            if (propertiesResponse.ok) {
              const propertiesData = await propertiesResponse.json();

              if (propertiesData.success) {
                setMember(propertiesData.data.member);
                setHouses(propertiesData.data.houses || []);
                setShops(propertiesData.data.shops || []);
              }
            }
          } catch (error) {
            console.error('Error fetching member properties:', error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading user properties:', error);
        setLoading(false);
      }
    };

    loadUserProperties();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#35373b' }}>
            เลือกเมนู
          </Typography>
          <Typography variant="body1" sx={{ color: '#64696f' }}>
             {isOwner 
              ? 'ยินดีต้อนรับ กรุณาเลือกรายการที่ต้องการจัดการ' 
              : 'กรุณาเลือกเมนูที่ต้องการเข้าใช้งาน'}
          </Typography>
        </Box>

        <Stack spacing={3}>
          
          {/* ========================================================= */}
          {/* 1. ADMIN MENU (Role 1 Only) */}
          {/* ========================================================= */}
          {isAdmin && (
            <Card onClick={() => router.push('/admin/main')} sx={{ cursor: 'pointer', border: '2px solid #e7ebff', mb: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#1e76e3' } }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'rgba(30, 118, 227, 0.1)', width: 64, height: 64 }}>
                    <AdminIcon sx={{ fontSize: 32, color: '#1e76e3' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h5" fontWeight="bold">ผู้ดูแลระบบ</Typography>
                      <Chip label="Admin" size="small" sx={{ bgcolor: '#1e76e3', color: 'white' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">จัดการข้อมูลระบบทั้งหมด</Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 32, color: '#64696f' }} />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 2. SHOP MANAGER MENU (Role 2 เท่านั้น - ตัด Admin ออก) */}
          {/* ========================================================= */}
          {userRole === 2 && ( 
            <>
              {/* 2.1 จัดการข้อมูลร้านค้า */}
              <Card 
                onClick={() => router.push('/admin/manage/shop')} 
                sx={{ cursor: 'pointer', border: '2px solid #e7ebff', mb: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#f59e0b' } }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', width: 64, height: 64 }}>
                      <StoreIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold">จัดการข้อมูลร้านค้า</Typography>
                      <Typography variant="body2" color="text.secondary">ตรวจสอบและแก้ไขข้อมูลร้านค้า</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 32, color: '#64696f' }} />
                  </Stack>
                </CardContent>
              </Card>

              {/* 2.2 จัดการสมาชิก */}
              <Card 
                onClick={() => router.push('/admin/manage/membershopmanagement')}
                sx={{ cursor: 'pointer', border: '2px solid #e7ebff', mb: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#9c27b0' } }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', width: 64, height: 64 }}>
                      <PersonIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold">จัดการข้อมูลสมาชิก</Typography>
                      <Typography variant="body2" color="text.secondary">ดูและจัดการรายชื่อสมาชิกในระบบ</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 32, color: '#64696f' }} />
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}

          {/* ========================================================= */}
          {/* 3. HOUSE MANAGER MENU (Role 4 เท่านั้น - ตัด Admin ออก) */}
          {/* ========================================================= */}
          {userRole === 4 && (
            <Card onClick={() => router.push('/view/house')} sx={{ cursor: 'pointer', border: '2px solid #e7ebff', mb: 2, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#9c27b0' } }}>
               <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', width: 64, height: 64 }}>
                    <ApartmentIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold">ข้อมูลบ้านพัก (ส่วนกลาง)</Typography>
                    <Typography variant="body2" color="text.secondary">สำหรับผู้จัดการ ดูแลข้อมูลบ้านพักทั้งหมด</Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 32, color: '#64696f' }} />
                </Stack>
               </CardContent>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 4. OWNER / MEMBER MENU (Role 3 และคนที่มีข้อมูล) */}
          {/* ========================================================= */}
          
          {/* ถ้าเป็น Admin จะไม่แสดงรายการบ้านส่วนตัว เพื่อให้หน้าจอคลีน (ถ้าอยากให้แสดงให้ลบ !isAdmin ออก) */}
          {!isAdmin && (houses.length > 0 || shops.length > 0) && (
             <Divider textAlign="left" sx={{ my: 2 }}>
               <Chip label="รายการข้อมูลของคุณ" icon={<PersonIcon />} />
             </Divider>
          )}

          {/* รายการบ้าน (ซ่อนถ้าเป็น Admin) */}
          {!isAdmin && houses.map((house) => (
            <Card
              key={house.house_id}
              onClick={() => {
                localStorage.setItem('selectedHouseId', String(house.house_id));
                router.push('/house/main');
              }}
              sx={{ 
                cursor: 'pointer', 
                border: '2px solid #e7ebff', 
                mb: 1,
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#10b981' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', width: 56, height: 56 }}>
                    <HomeIcon sx={{ fontSize: 28, color: '#10b981' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      บ้านเลขที่ {house.house_no}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                       {house.zone_building} • {getHouseTypeLabel ? getHouseTypeLabel(house.type) : house.type}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 28, color: '#64696f' }} />
                </Stack>
              </CardContent>
            </Card>
          ))}

          {/* รายการร้านค้า (ซ่อนถ้าเป็น Admin) */}
          {!isAdmin && shops.map((shop) => (
            <Card
              key={shop.shop_id}
              onClick={() => {
                localStorage.setItem('selectedShopId', String(shop.shop_id));
                router.push('/shop/main');
              }}
              sx={{ 
                cursor: 'pointer', 
                border: '2px solid #e7ebff', 
                mb: 1,
                transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, borderColor: '#f59e0b' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                   <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', width: 56, height: 56 }}>
                      <StoreIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
                   </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      ร้านเลขที่ {shop.shop_no}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {shop.location}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 28, color: '#64696f' }} />
                </Stack>
              </CardContent>
            </Card>
          ))}

          {/* กรณีเป็น Owner แต่ไม่พบข้อมูลบ้านหรือร้านค้าเลย */}
          {isOwner && houses.length === 0 && shops.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              ไม่พบข้อมูลบ้านพักหรือร้านค้าที่ผูกกับบัญชีของคุณ กรุณาติดต่อผู้ดูแลระบบ
            </Alert>
          )}

        </Stack>
      </Container>
    </MainLayout>
  );
}