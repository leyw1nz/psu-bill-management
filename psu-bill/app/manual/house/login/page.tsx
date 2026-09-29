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
  Link as MuiLink,
  Card,
  CardContent,
} from "@mui/material";

import {
  Login as LoginIcon,
  School as SchoolIcon,
  ArrowForward as ArrowIcon,
  ErrorOutline as ErrorIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";

// ✅ Import Link จาก next/link
import Link from "next/link";

export default function HouseLoginManual() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LoginIcon color="primary" fontSize="large" /> คู่มือ: การเข้าสู่ระบบ (สำหรับเจ้าของบ้านพัก)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        สำหรับบุคลากรและเจ้าหน้าที่มหาวิทยาลัย ที่เข้าพักอาศัยในบ้านพัก
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        
        {/* 1. วิธีการเข้าสู่ระบบ */}
        <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            1. ช่องทางการเข้าใช้งาน
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            ระบบนี้เชื่อมต่อกับฐานข้อมูลบุคลากร <strong>ท่านไม่ต้องสมัครสมาชิกใหม่</strong> สามารถใช้บัญชี PSU Passport เดิมที่มีอยู่ได้ทันที
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
                  <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    PSU Passport Login
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    เข้าสู่ระบบด้วยบัญชีมอ. (PSU Passport) เท่านั้น
                  </Typography>
                </Box>
                <Box>
                  <Button 
                    variant="contained" 
                    disableElevation
                    sx={{ bgcolor: "#1e3a8a", px: 4, py: 1 }}
                  >
                    ตัวอย่างปุ่ม Login
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
                
                {/* ✅ แก้ไข: ลบ <Link> ที่ครอบออก แล้วใช้ component={Link} ใน Button แทน */}
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
                <Typography fontWeight={600}>คลิกปุ่ม "PSU Passport"</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                    มองหาปุ่มสีน้ำเงินที่มีสัญลักษณ์ PSU Passport แล้วคลิกเพื่อดำเนินการต่อ
                </Typography>
                <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                    <Typography variant="caption" color="text.secondary">
                        ระบบจะพาไปที่หน้าล็อกอินกลางของมหาวิทยาลัย
                    </Typography>
                </Box>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>กรอกรหัส PSU Passport</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                    กรอก <strong>PSU Username</strong> และ <strong>รหัสผ่าน</strong> ชุดเดียวกับที่ใช้เข้า WiFi หรือระบบ MIS ของมหาวิทยาลัย
                </Typography>
                <Alert severity="success" sx={{ mt: 2 }}>
                    เมื่อยืนยันตัวตนสำเร็จ ระบบจะพาท่านกลับมายังหน้า <strong>"ข้อมูลบ้านพัก"</strong> โดยอัตโนมัติ
                </Alert>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>
      </Stack>
    </Box>
  );
}