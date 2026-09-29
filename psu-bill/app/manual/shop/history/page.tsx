"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Chip,
  Card,
  CardContent,
  Dialog,
  IconButton
} from "@mui/material";

import {
  History as HistoryIcon,
  Search as SearchIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  CalendarMonth as DateIcon,
  TableChart as TableIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function ShopHistoryManual() {
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
        <HistoryIcon color="primary" fontSize="large" /> คู่มือ: ประวัติการใช้งาน (History)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        สำหรับเรียกดูข้อมูลการใช้น้ำและไฟฟ้าของร้านค้าตั้งแต่อดีตจนถึงปัจจุบัน
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        
        {/* Section 1: Filters & Overview Image */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" /> 1. ภาพรวมและการค้นหา (Overview & Filter)
            </Typography>
            <Typography variant="body2" paragraph>
                ท่านสามารถกรองข้อมูลเพื่อดูเฉพาะช่วงเวลาที่ต้องการได้จากเมนูด้านบนของตาราง
            </Typography>
            
            {/* ✅ แทรกรูปภาพ Overview ตรงนี้ */}
            {renderZoomableImage("/manual_images/shop_history_overview.png", "ตัวอย่างหน้าประวัติการใช้งานร้านค้า", 800)}

            <Stack direction="row" spacing={2} flexWrap="wrap">
                <Box sx={{ p: 1.5, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2">เลือกปี (Year)</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">เช่น 2567, 2568</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2">เลือกเดือน (Month)</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">เช่น มกราคม, กุมภาพันธ์</Typography>
                </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Section 2: Tabs */}
        <Box>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableIcon color="secondary" /> 2. การเลือกประเภทข้อมูล (Tabs)
                </Typography>
                <Typography variant="body2" paragraph>
                    เนื่องจากตารางข้อมูลมีรายละเอียดมาก ระบบจึงแยกข้อมูลออกเป็น 2 แท็บ (Tabs) ท่านต้องกดเลือกแท็บเพื่อดูข้อมูลที่ต้องการ
                </Typography>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                    <Box flex={1} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Chip icon={<FlashOnIcon />} label="แท็บ: ไฟฟ้า" color="warning" variant="outlined" />
                        <Typography variant="body2" sx={{ mt: 1 }}>แสดง: เลขมิเตอร์ไฟ, หน่วยที่ใช้, ค่าไฟ</Typography>
                    </Box>
                    <Box flex={1} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, textAlign: 'center' }}>
                        <Chip icon={<WaterIcon />} label="แท็บ: น้ำประปา" color="primary" variant="outlined" />
                        <Typography variant="body2" sx={{ mt: 1 }}>แสดง: เลขมิเตอร์น้ำ, หน่วยที่ใช้, ค่าน้ำ</Typography>
                    </Box>
                </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Section 3: Table Columns */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              3. รายละเอียดในตาราง
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ตารางจะแสดงเฉพาะรายการที่ <strong>"อนุมัติแล้ว"</strong> เท่านั้น ข้อมูลประกอบด้วย:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, typography: 'body2' }}>
                <li><strong>วันที่อนุมัติ:</strong> วันที่เจ้าหน้าที่ทำการตรวจสอบและยืนยันยอดเงิน</li>
                <li><strong>ประจำเดือน:</strong> รอบบิลของเดือนนั้นๆ</li>
                <li><strong>มิเตอร์ก่อน/หลัง:</strong> เลขมิเตอร์ที่จดได้</li>
                <li><strong>ผลต่าง:</strong> ปริมาณหน่วยที่ใช้ (หลัง ลบ ก่อน)</li>
                <li><strong>จำนวนเงิน (บาท):</strong> ยอดเงินสุทธิของประเภทสาธารณูปโภคนั้นๆ</li>
            </Box>
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