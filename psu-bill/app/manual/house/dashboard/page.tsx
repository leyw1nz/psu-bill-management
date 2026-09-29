"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  Dialog,
  IconButton
} from "@mui/material";

import {
  Home as HomeIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  Description as BillIcon,
  Print as PrintIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function HouseDashboardManual() {
  // State สำหรับ Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ ฟังก์ชันแสดงรูปภาพแบบ Zoomable
  const renderZoomableImage = (src: string, alt: string, maxWidth: number = 600) => (
    <Box 
      sx={{ 
        position: 'relative', 
        width: 'fit-content', 
        my: 2,
        cursor: 'zoom-in', 
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover .zoom-icon': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        '&:hover .img-content': { filter: 'brightness(0.9)', transform: 'scale(1.02)' }
      }}
      onClick={() => setPreviewImage(src)}
    >
      <Box className="img-content" component="img" src={src} alt={alt}
        sx={{ width: '100%', maxWidth: maxWidth, height: 'auto', display: 'block', transition: 'transform 0.3s, filter 0.3s' }}
      />
      <Box className="zoom-icon"
        sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(0.8)',
          bgcolor: 'rgba(0, 0, 0, 0.6)', color: 'white', borderRadius: '50%', p: 1.5, display: 'flex', opacity: 0, transition: 'all 0.2s', pointerEvents: 'none' 
        }}
      >
        <ZoomInIcon fontSize="medium" />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeIcon color="primary" fontSize="large" /> หน้าหลัก (Dashboard)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        หน้าแรกสำหรับเจ้าของบ้านพัก ใช้สำหรับตรวจสอบยอดค่าใช้จ่ายประจำเดือนปัจจุบัน และดูรายละเอียดการใช้น้ำ-ไฟ ของบ้านพักที่ท่านอาศัยอยู่
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        
        {/* Section 1: House Info & Overview Image */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              1. ข้อมูลทั่วไปและภาพรวม
            </Typography>
            
            {/* ✅ แทรกรูปภาพ Overview ตรงนี้เพื่อให้เห็นภาพรวมก่อน */}
            {renderZoomableImage("/manual_images/house_dashboard_overview.png", "ตัวอย่างหน้า Dashboard บ้านพัก", 800)}

            <List>
              <ListItem>
                <ListItemIcon><HomeIcon color="action" /></ListItemIcon>
                <ListItemText 
                  primary="ข้อมูลบ้านพัก" 
                  secondary="ส่วนบนสุดของหน้าจอจะแสดง เลขที่บ้าน และ อาคาร/โซน ของท่าน เพื่อให้แน่ใจว่ากำลังดูข้อมูลของบ้านหลังที่ถูกต้อง" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><BillIcon color="action" /></ListItemIcon>
                <ListItemText 
                  primary="งวดประจำเดือน" 
                  secondary="แสดงเดือนและปี พ.ศ. ของยอดบิลปัจจุบันที่ระบบเรียกเก็บ" 
                />
              </ListItem>
            </List>
            
            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>กรณีไม่พบข้อมูล:</strong> หากขึ้นข้อความ "ยังไม่มีข้อมูลบิลสำหรับเดือนนี้" หมายความว่าเจ้าหน้าที่ยังไม่ได้ทำการคำนวณหรือยืนยันยอดเงินของเดือนปัจจุบัน
            </Alert>
          </Paper>
        </Box>

        {/* Section 2 & 3: Bill Details */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          
          {/* Card 1: Electricity */}
          <Box flex={1}>
            <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlashOnIcon sx={{ color: "#f59e0b" }} /> รายละเอียดค่าไฟฟ้า
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ระบบจะแสดงการ์ดข้อมูลสีเหลือง/ส้ม สำหรับค่าไฟฟ้า ประกอบด้วย:
                </Typography>
                <Box component="ul" sx={{ pl: 2, typography: 'body2', color: 'text.secondary' }}>
                  <li><strong>หน่วยมิเตอร์ก่อน:</strong> เลขมิเตอร์เดือนที่แล้ว</li>
                  <li><strong>หน่วยมิเตอร์หลัง:</strong> เลขมิเตอร์เดือนปัจจุบัน</li>
                  <li><strong>ผลต่าง:</strong> จำนวนหน่วยที่ใช้จริง (หลัง - ก่อน)</li>
                  <li><strong>จำนวนเงิน:</strong> ยอดเงินที่ต้องชำระ (บาท)</li>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Card 2: Water */}
          <Box flex={1}>
            <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WaterIcon sx={{ color: "#3b82f6" }} /> รายละเอียดค่าน้ำประปา
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ระบบจะแสดงการ์ดข้อมูลสีฟ้า สำหรับค่าน้ำประปา ประกอบด้วย:
                </Typography>
                <Box component="ul" sx={{ pl: 2, typography: 'body2', color: 'text.secondary' }}>
                  <li><strong>หน่วยมิเตอร์ก่อน:</strong> เลขมิเตอร์เดือนที่แล้ว</li>
                  <li><strong>หน่วยมิเตอร์หลัง:</strong> เลขมิเตอร์เดือนปัจจุบัน</li>
                  <li><strong>ผลต่าง:</strong> จำนวนหน่วยที่ใช้จริง (หลัง - ก่อน)</li>
                  <li><strong>จำนวนเงิน:</strong> ยอดเงินที่ต้องชำระ (บาท)</li>
                </Box>
              </CardContent>
            </Card>
          </Box>

        </Stack>

        {/* Section 3: Actions */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              3. ปุ่มดำเนินการ
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="start" gap={2}>
                <Chip icon={<PrintIcon />} label="พิมพ์ใบแจ้งหนี้" color="primary" />
                <Typography variant="body2">
                  กดปุ่มนี้เพื่อดาวน์โหลดหรือพิมพ์ใบแจ้งหนี้ (Invoice) ในรูปแบบ PDF เพื่อนำไปใช้เป็นหลักฐานการเบิกจ่ายหรือชำระเงิน
                </Typography>
              </Box>
              <Box display="flex" alignItems="start" gap={2}>
                <Chip icon={<HistoryIcon />} label="ดูประวัติย้อนหลัง" />
                <Typography variant="body2">
                  กดปุ่มนี้เพื่อเปลี่ยนไปยังหน้า "ประวัติย้อนหลัง" สำหรับดูยอดการใช้งานในเดือนก่อนๆ
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

      </Stack>

      {/* Lightbox Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.85)' } }}
      >
        <Box sx={{ position: 'relative', outline: 'none' }}>
            <IconButton onClick={() => setPreviewImage(null)} sx={{ position: 'absolute', top: -40, right: 0, color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}>
                <CloseIcon />
            </IconButton>
            {previewImage && <Box component="img" src={previewImage} sx={{ width: 'auto', maxWidth: '90vw', maxHeight: '90vh', borderRadius: 2 }} />}
        </Box>
      </Dialog>
    </Box>
  );
}