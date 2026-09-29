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
  Card,
  CardContent,
  Chip,
  Dialog,
  IconButton
} from "@mui/material";

import {
  History as HistoryIcon,
  Search as SearchIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  CalendarMonth as CalendarIcon,
  Speed as MeterIcon,
  AttachMoney as MoneyIcon,
  CompareArrows as DiffIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function HouseHistoryManual() {
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
        หน้านี้ใช้สำหรับดูสถิติการใช้น้ำและไฟฟ้าแบบละเอียด โดยสามารถดูเลขมิเตอร์ย้อนหลัง และยอดเงินในแต่ละเดือนได้
      </Typography>
      <Divider sx={{ my: 3 }} />

      {/* ✅ Layout ด้วย Stack */}
      <Stack spacing={3}>
        
        {/* Section 1: การเลือกประเภท (Tabs) */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              1. ภาพรวมและการเลือกดูข้อมูล
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ท่านสามารถกดที่แถบด้านบน (Tabs) เพื่อสลับดูข้อมูลระหว่าง <strong>ไฟฟ้า</strong> และ <strong>น้ำประปา</strong>
            </Typography>
            
            {/* ✅ แทรกรูปภาพ Overview ตรงนี้ */}
            {renderZoomableImage("/manual_images/house_history_overview.png", "ตัวอย่างหน้าประวัติการใช้งาน", 800)}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box flex={1} component={Paper} elevation={0} sx={{ bgcolor: '#f0f7ff', p: 2, borderRadius: 2, border: '1px solid #cce5ff' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <FlashOnIcon color="warning" />
                  <Typography fontWeight={600}>แท็บ: ไฟฟ้า</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  แสดงตารางมิเตอร์ไฟฟ้า หน่วยที่ใช้ และค่าไฟในแต่ละเดือน
                </Typography>
              </Box>

              <Box flex={1} component={Paper} elevation={0} sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 2, border: '1px solid #cff4fc' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <WaterIcon color="info" />
                  <Typography fontWeight={600}>แท็บ: น้ำประปา</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  แสดงตารางมิเตอร์น้ำ หน่วยที่ใช้ และค่าน้ำในแต่ละเดือน
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Section 2: การค้นหา */}
        <Box>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon sx={{ color: "#8b5cf6" }} /> 2. การค้นหาและตัวกรอง (Filters)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                ท่านสามารถเลือกกรองข้อมูลที่ต้องการดูได้จากแถบด้านบนขวาของตาราง
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon><CalendarIcon color="action" /></ListItemIcon>
                  <ListItemText 
                    primary={<strong>เลือกปี (Year)</strong>} 
                    secondary="เลือกปี พ.ศ. เพื่อดูประวัติย้อนหลังของปีนั้นๆ" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarIcon color="action" /></ListItemIcon>
                  <ListItemText 
                    primary={<strong>เลือกเดือน (Month)</strong>} 
                    secondary="เจาะจงดูข้อมูลเฉพาะเดือนที่ต้องการ" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Section 3: ความหมายของตาราง */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              3. ความหมายในตารางข้อมูล
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ตารางจะแสดงรายละเอียดการจดมิเตอร์และการคำนวณดังนี้:
            </Typography>

            <Stack spacing={1}>
               {/* Item 1 */}
               <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #eee' }}>
                  <Chip icon={<MeterIcon />} label="มิเตอร์ก่อน" size="small" variant="outlined" />
                  <Typography variant="body2">
                     เลขมิเตอร์ที่จดได้ใน <b>เดือนก่อนหน้า</b>
                  </Typography>
               </Stack>

               {/* Item 2 */}
               <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #eee' }}>
                  <Chip icon={<MeterIcon />} label="มิเตอร์หลัง" color="primary" size="small" variant="outlined" />
                  <Typography variant="body2">
                     เลขมิเตอร์ที่จดได้ใน <b>เดือนปัจจุบัน</b>
                  </Typography>
               </Stack>

               {/* Item 3 */}
               <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #eee' }}>
                  <Chip icon={<DiffIcon />} label="ผลต่าง (หน่วย)" color="info" size="small" variant="outlined" />
                  <Typography variant="body2">
                     ปริมาณหน่วยที่ใช้จริง (มิเตอร์หลัง - มิเตอร์ก่อน)
                  </Typography>
               </Stack>

               {/* Item 4 */}
               <Stack direction="row" alignItems="center" spacing={2} sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid #eee' }}>
                  <Chip icon={<MoneyIcon />} label="จำนวนเงิน" color="success" size="small" />
                  <Typography variant="body2" fontWeight={600} color="success.main">
                     ยอดเงินค่าใช้จ่ายประจำงวดนั้นๆ (บาท)
                  </Typography>
               </Stack>
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