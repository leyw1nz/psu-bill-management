"use client";

import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
} from "@mui/material";

import {
  Store as StoreIcon, // เปลี่ยนไอคอนเป็นรูปตึกร้านค้า
  ArrowForward as ArrowIcon,
  Person as PersonIcon, // ไอคอนสำหรับ User
  Lock as LockIcon,     // ไอคอนสำหรับ Password
} from "@mui/icons-material";

import Link from "next/link";

export default function ShopLoginManual() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StoreIcon color="primary" fontSize="large" /> คู่มือ: การเข้าสู่ระบบ (สำหรับร้านค้า/ผู้ประกอบการ)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        สำหรับผู้ประกอบการร้านค้า ที่ต้องการตรวจสอบค่าน้ำ-ค่าไฟ
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        
        {/* 1. ช่องทางการเข้าใช้งาน */}
        <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            1. รูปแบบการเข้าใช้งาน
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            สำหรับร้านค้า ให้ท่านเข้าสู่ระบบโดยใช้ <strong>ชื่อผู้ใช้ (Username)</strong> และ <strong>รหัสผ่าน (Password)</strong> ที่ได้รับจากจากเจ้าหน้าที่
          </Alert>

          <Card variant="outlined" sx={{ bgcolor: "#f8faff", borderColor: "#bfdbfe" }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'white', 
                    borderRadius: '50%', 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    Username & Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    กรอกข้อมูลในส่วนของ "บุคคลทั่วไป" เพื่อเข้าใช้งาน
                  </Typography>
                </Box>
                <Box>
                  <Button 
                    variant="contained" 
                    disableElevation
                    sx={{ 
                        background: "linear-gradient(to right, #3366FF, #5555FF)", 
                        px: 4, 
                        py: 1 
                    }}
                  >
                    เข้าสู่ระบบ
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Paper>

        {/* 2. ขั้นตอนการเข้าใช้งาน */}
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            2. ขั้นตอนการเข้าใช้งาน (Step-by-Step)
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 2 }}>
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>ไปที่หน้าเข้าสู่ระบบ</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    เข้าเว็บไซต์ระบบตรวจสอบค่านํ้าค่าไฟ จะพบหน้าจอ Login
                </Typography>
                
                <Button 
                    component={Link} 
                    href="/login" 
                    variant="outlined" 
                    size="small" 
                    endIcon={<ArrowIcon />}
                >
                    ไปที่หน้า Login
                </Button>

              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>กรอกข้อมูลบัญชีผู้ใช้</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                    ในส่วนที่มีข้อความคั่นว่า <strong>"บุคคลทั่วไป"</strong> ให้ท่านกรอกข้อมูลดังนี้:
                </Typography>
                <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid #ddd' }}>
                    <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                                <strong>ชื่อผู้ใช้:</strong> กรอก Username ของท่าน
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LockIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                                <strong>รหัสผ่าน:</strong> กรอก Password ของท่าน
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>กดปุ่ม "เข้าสู่ระบบ"</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                    คลิกที่ปุ่มสีฟ้า <strong>"เข้าสู่ระบบ"</strong> เพื่อยืนยัน
                </Typography>
                <Alert severity="success" sx={{ mt: 2 }}>
                    เมื่อเข้าสู่ระบบสำเร็จ ท่านจะเข้าสู่หน้าหลัก (Main Menu) เพื่อเลือกดูรายการบิลค่าน้ำ-ค่าไฟของท่าน
                </Alert>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>
      </Stack>
    </Box>
  );
}