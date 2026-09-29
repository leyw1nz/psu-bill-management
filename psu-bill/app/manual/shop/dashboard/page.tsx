"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  Dialog,
  IconButton
} from "@mui/material";

import {
  Store as ShopIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  Description as BillIcon,
  Print as PrintIcon,
  History as HistoryIcon,
  NotificationsActive as AlertIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function ShopDashboardManual() {
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
        <ShopIcon color="primary" fontSize="large" /> หน้าหลักร้านค้า (Shop Dashboard)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        หน้าแรกสำหรับผู้ประกอบการร้านค้า ใช้สำหรับตรวจสอบยอดค้างชำระ ดูรายละเอียดการใช้น้ำ-ไฟ และแจ้งชำระเงิน
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        
        {/* Section 1: Top Info & Overview Image */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              1. ข้อมูลทั่วไปและภาพรวม
            </Typography>
            
            {/* ✅ แทรกรูปภาพ Overview ตรงนี้ */}
            {renderZoomableImage("/manual_images/shop_dashboard_overview.png", "ตัวอย่างหน้า Dashboard ร้านค้า", 800)}

            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <ShopIcon color="action" />
                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>ร้านเลขที่ (Shop No.)</Typography>
                    <Typography variant="body2" color="text.secondary">ระบุเลขที่ร้านค้าของท่าน (มุมซ้ายบน)</Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <BillIcon color="action" />
                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>งวดประจำเดือน</Typography>
                    <Typography variant="body2" color="text.secondary">แสดงเดือนและปีของบิลปัจจุบันที่ระบบกำลังแสดงผล</Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Section 2: Unpaid Alert */}
        <Box>
          <Card 
            variant="outlined" 
            sx={{ borderRadius: 3, bgcolor: "#fff1f2", borderColor: "#fecdd3" }}
          >
            <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: "#be123c" }}>
                    <AlertIcon /> 2. การแจ้งเตือนยอดค้างชำระ
                </Typography>
                <Typography variant="body2" paragraph>
                    หากร้านค้ามียอดค้างชำระ (Unpaid) หรือรอตรวจสอบ (Pending) ระบบจะแสดง <strong>การ์ดสีแดง</strong> เด่นชัดที่ส่วนบนของหน้าจอ
                </Typography>
                <Box component="ul" sx={{ pl: 2, typography: 'body2', color: "#881337" }}>
                    <li><strong>รายการค้างชำระ:</strong> แสดงรายการบิลที่ยังไม่ได้จ่ายเงิน ท่านสามารถกดที่รายการเพื่อดูรายละเอียดได้</li>
                    <li><strong>ยอดรวมทั้งหมด:</strong> แสดงยอดเงินรวมที่ต้องชำระทันที</li>
                    <li><strong>ดูรายการเพิ่มเติม:</strong> หากมีรายการค้างจำนวนมาก สามารถกดปุ่ม "ดูอีก X รายการ" เพื่อขยายดูทั้งหมด</li>
                </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Section 3: Bill Details */}
        <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              3. รายละเอียดการใช้ไฟฟ้าและน้ำประปา
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* Electric */}
                <Box flex={1}>
                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FlashOnIcon sx={{ color: "#f59e0b" }} /> ค่ากระแสไฟฟ้า
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, typography: 'body2', color: 'text.secondary' }}>
                                <li><strong>มิเตอร์ก่อน/หลัง:</strong> เลขมิเตอร์ที่จดได้</li>
                                <li><strong>ผลต่าง:</strong> จำนวนหน่วยที่ใช้จริง</li>
                                <li><strong>จำนวนเงิน:</strong> ยอดเงินที่ต้องชำระ (บาท)</li>
                            </Box>
                            <Chip label="สถานะ: รอชำระ/ชำระแล้ว" size="small" sx={{ mt: 1 }} />
                        </CardContent>
                    </Card>
                </Box>

                {/* Water */}
                <Box flex={1}>
                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WaterIcon sx={{ color: "#3b82f6" }} /> ค่าน้ำประปา
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, typography: 'body2', color: 'text.secondary' }}>
                                <li><strong>มิเตอร์ก่อน/หลัง:</strong> เลขมิเตอร์ที่จดได้</li>
                                <li><strong>ผลต่าง:</strong> จำนวนหน่วยที่ใช้จริง</li>
                                <li><strong>จำนวนเงิน:</strong> ยอดเงินที่ต้องชำระ (บาท)</li>
                            </Box>
                            <Chip label="สถานะ: รอชำระ/ชำระแล้ว" size="small" sx={{ mt: 1 }} />
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </Box>

        {/* Section 4: Actions */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              4. ปุ่มดำเนินการ
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="start" gap={2}>
                <Chip icon={<PaymentIcon />} label="แจ้งชำระ (Pay)" color="error" />
                <Typography variant="body2">
                    (เฉพาะยอดค้างชำระ) กดเพื่อเปิดหน้าต่าง <strong>แนบสลิปโอนเงิน</strong> หรือแจ้งการชำระเงินกับเจ้าหน้าที่
                </Typography>
              </Box>
              <Box display="flex" alignItems="start" gap={2}>
                <Chip icon={<PrintIcon />} label="พิมพ์ใบแจ้งหนี้" color="success" />
                <Typography variant="body2">
                    ดาวน์โหลดใบแจ้งหนี้ (Invoice) เพื่อนำไปตรวจสอบหรือทำเบิกจ่าย
                </Typography>
              </Box>
              <Box display="flex" alignItems="start" gap={2}>
                <Chip icon={<HistoryIcon />} label="ดูประวัติย้อนหลัง" color="primary" />
                <Typography variant="body2">
                    ดูประวัติการใช้น้ำ-ไฟ ย้อนหลังในเดือนอื่นๆ
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