"use client";

import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";

import {
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  EditDocument as EditIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Print as PrintIcon,
  Assessment as ChartIcon,
  ElectricBolt as ElectricIcon,
  Water as WaterIcon,
} from "@mui/icons-material";

export default function AdminDashboardManual() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminIcon color="primary" fontSize="large" /> คู่มือ: หน้าหลักผู้ดูแลระบบ (Admin Dashboard)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        หน้าศูนย์รวมคำสั่งสำหรับเจ้าหน้าที่ แสดงภาพรวมจำนวนข้อมูลและเมนูทางลัดสำหรับจัดการระบบ
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        
        {/* =========================================================
            Section 1: บ้านพัก (House)
           ========================================================= */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
            <Stack direction="row" alignItems="center" gap={1} mb={2}>
              <HomeIcon color="action" />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                1. หมวดบ้านพัก (House)
              </Typography>
            </Stack>
            
            <Typography variant="body2" paragraph color="text.secondary">
              ส่วนจัดการข้อมูลบ้านพัก มีเมนูใช้งานทั้งหมด <strong>4 รายการ</strong> ดังนี้:
            </Typography>

            <Stack spacing={2}>
               
               {/* Row 1: บันทึกไฟ & น้ำ */}
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {/* Card 1: Electric */}
                  <Box flex={1}>
                     <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderColor: '#fde68a' }}>
                       <CardContent sx={{ py: 2 }}>
                         <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#fff7ed', color: '#f59e0b' }}><ElectricIcon /></Avatar>
                            <Box>
                              <Typography fontWeight={700} color="text.primary">1. มิเตอร์ไฟฟ้า</Typography>
                              <Typography variant="body2" color="text.secondary">จดเลขมิเตอร์ไฟบ้านพัก</Typography>
                            </Box>
                         </Stack>
                       </CardContent>
                     </Card>
                  </Box>

                  {/* Card 2: Water */}
                  <Box flex={1}>
                     <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderColor: '#bfdbfe' }}>
                       <CardContent sx={{ py: 2 }}>
                         <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#e8f0fe', color: '#1967d2' }}><WaterIcon /></Avatar>
                            <Box>
                              <Typography fontWeight={700} color="text.primary">2. มิเตอร์นํ้าประปา</Typography>
                              <Typography variant="body2" color="text.secondary">จดเลขมิเตอร์น้ำบ้านพัก</Typography>
                            </Box>
                         </Stack>
                       </CardContent>
                     </Card>
                  </Box>
               </Stack>

               {/* Row 2: Export & Manage */}
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {/* Card 3: Export */}
                  <Box flex={1}>
                     <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                       <CardContent sx={{ py: 2 }}>
                         <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#e6f4ea', color: '#1e8e3e' }}><DownloadIcon /></Avatar>
                            <Box>
                              <Typography fontWeight={700} color="text.primary">3. ส่งออก Excel</Typography>
                              <Typography variant="body2" color="text.secondary">โหลดรายงานเพื่อส่งกองคลังหักเงินเดือน</Typography>
                            </Box>
                         </Stack>
                       </CardContent>
                     </Card>
                  </Box>

                  {/* Card 4: Manage */}
                  <Box flex={1}>
                     <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                       <CardContent sx={{ py: 2 }}>
                         <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#f1f3f4', color: '#5f6368' }}><SettingsIcon /></Avatar>
                            <Box>
                              <Typography fontWeight={700} color="text.primary">4. จัดการข้อมูล</Typography>
                              <Typography variant="body2" color="text.secondary">เพิ่ม/ลบ/แก้ไข บ้าน</Typography>
                            </Box>
                         </Stack>
                       </CardContent>
                     </Card>
                  </Box>
               </Stack>

            </Stack>
          </Paper>
        </Box>

        {/* =========================================================
            Section 2: ร้านค้า (Shop)
           ========================================================= */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
            <Stack direction="row" alignItems="center" gap={1} mb={2}>
              <StoreIcon color="action" />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                2. หมวดร้านค้า (Shop)
              </Typography>
            </Stack>
            
            <Typography variant="body2" paragraph color="text.secondary">
              ส่วนจัดการร้านค้า มีเมนูคำสั่งทั้งหมด <strong>5 รายการ</strong> ดังนี้:
            </Typography>

            <Stack spacing={2}>
              
              {/* Row 1: บันทึกไฟ & น้ำ */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box flex={1}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderColor: '#fde68a' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#fff7ed', color: '#f59e0b' }}><ElectricIcon /></Avatar>
                        <Box>
                          <Typography fontWeight={700} color="text.primary">1. มิเตอร์ไฟฟ้า</Typography>
                          <Typography variant="body2" color="text.secondary">จดเลขมิเตอร์ไฟร้านค้า</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
                <Box flex={1}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, borderColor: '#bfdbfe' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#e8f0fe', color: '#1967d2' }}><WaterIcon /></Avatar>
                        <Box>
                          <Typography fontWeight={700} color="text.primary">2. มิเตอร์นํ้าประปา</Typography>
                          <Typography variant="body2" color="text.secondary">จดเลขมิเตอร์น้ำร้านค้า</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>

              {/* Row 2: ตรวจสลิป (สำคัญ) */}
              <Box>
                <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "#faf5ff", borderColor: "#e9d5ff" }}>
                  <CardContent sx={{ py: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#f3e8fd', color: '#9333ea' }}><CheckIcon /></Avatar>
                      <Box>
                        <Typography fontWeight={700} color="text.primary">3. ตรวจสอบผลการชำระ </Typography>
                        <Typography variant="body2" color="text.secondary">
                           ใช้ตรวจสอบสลิปโอนเงินที่ร้านค้าส่งเข้ามา เพื่อกด <strong>อนุมัติ</strong> หรือ <strong>ปฏิเสธ </strong>
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Row 3: พิมพ์บิล & จัดการ */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box flex={1}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#fce8e6', color: '#c5221f' }}><PrintIcon /></Avatar>
                        <Box>
                          <Typography fontWeight={700} color="text.primary">4. พิมพ์ใบแจ้งหนี้</Typography>
                          <Typography variant="body2" color="text.secondary">พิมพ์ใบแจ้งหนี้สำหรับร้านค้า</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
                <Box flex={1}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: '#f1f3f4', color: '#5f6368' }}><SettingsIcon /></Avatar>
                        <Box>
                          <Typography fontWeight={700} color="text.primary">5. จัดการข้อมูล</Typography>
                          <Typography variant="body2" color="text.secondary">แก้ไข/เพิ่ม/ลบ ร้านค้า</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>

            </Stack>
          </Paper>
        </Box>

        {/* =========================================================
            Section 3: สมาชิก (Member)
           ========================================================= */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
            <Stack direction="row" alignItems="center" gap={1} mb={2}>
              <PeopleIcon color="action" />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                3. หมวดสมาชิก (Member)
              </Typography>
            </Stack>
            
            <Stack spacing={2}>
               <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#f1f3f4', color: '#5f6368' }}><SettingsIcon /></Avatar>
                    <Box>
                      <Typography fontWeight={700} color="text.primary">จัดการข้อมูลสมาชิก</Typography>
                      <Typography variant="body2" color="text.secondary">
                        เพิ่ม User ใหม่ (Admin/User), รีเซ็ตรหัสผ่าน, หรือผูกบัญชีสมาชิกเข้ากับบ้าน/ร้านค้า
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Paper>
        </Box>

         {/* =========================================================
             Section 4: สถิติ (Stats)
            ========================================================= */}
         <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
            <Stack direction="row" alignItems="center" gap={1} mb={1}>
              <ChartIcon color="primary" />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                4. สถิติและรายงาน
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
                ส่วนล่างสุดของหน้าจอจะแสดง สรุปยอดการใช้งานไฟฟ้าและนํ้าประปา
            </Typography>
          </Paper>
        </Box>

      </Stack>
    </Box>
  );
}