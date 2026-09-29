"use client";

import { useState } from "react";
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
  Dialog,
  IconButton
} from "@mui/material";

import {
  Payments as PaymentsIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function ShopPaymentManual() {
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
        <PaymentsIcon color="primary" fontSize="large" /> คู่มือ: การแจ้งชำระเงิน (สำหรับร้านค้า)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        ขั้นตอนการแจ้งชำระเงินค่าไฟฟ้าและค่าน้ำประปา ผ่านระบบออนไลน์พร้อมแนบหลักฐานการโอนเงิน
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        
        {/* 1. สังเกตสถานะ */}
        <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            1. สังเกตปุ่ม "แจ้งชำระ"
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            ในหน้าหลัก หากมียอดที่ต้องชำระ ท่านจะเห็นปุ่มสีแดง <strong>"แจ้งชำระ"</strong> ปรากฏอยู่ที่รายการค่าไฟ หรือค่าน้ำ
          </Alert>

          {/* จำลอง UI ให้เหมือนหน้า ShopMainClient */}
          <Card variant="outlined" sx={{ bgcolor: "#f8f9fa", borderColor: "#cdcdcf", borderRadius: 2 }}>
            <CardContent>
                <Stack spacing={2}>
                    {/* ตัวอย่างแถวค่าไฟ */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <FlashOnIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
                                    กระแสไฟฟ้า
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ยอดชำระ: 1,250.00 บาท
                                </Typography>
                            </Box>
                        </Stack>
                        <Button
                            variant="contained"
                            startIcon={<PaymentsIcon />}
                            sx={{
                                bgcolor: "#A73032",
                                borderRadius: 50,
                                textTransform: "none",
                                px: 3,
                                "&:hover": { bgcolor: "#8a2628" },
                            }}
                        >
                            แจ้งชำระ
                        </Button>
                    </Stack>

                    {/* ตัวอย่างแถวค่าน้ำ */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <WaterIcon sx={{ color: "#3b82f6", fontSize: 28 }} />
                             <Box>
                                <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
                                    ค่าน้ำประปา
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ยอดชำระ: 150.00 บาท
                                </Typography>
                            </Box>
                        </Stack>
                        <Button
                            variant="contained"
                            startIcon={<PaymentsIcon />}
                            sx={{
                                bgcolor: "#A73032",
                                borderRadius: 50,
                                textTransform: "none",
                                px: 3,
                                "&:hover": { bgcolor: "#8a2628" },
                            }}
                        >
                            แจ้งชำระ
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
          </Card>
        </Paper>

        {/* 2. ขั้นตอนการชำระเงิน */}
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            2. ขั้นตอนการดำเนินการ (Step-by-Step)
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 2 }}>
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>กดปุ่ม "แจ้งชำระ"</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                    คลิกที่ปุ่มสีแดงบริเวณรายการที่ต้องการชำระ ระบบจะเปิดหน้าต่างสำหรับแจ้งโอนเงินขึ้นมา
                </Typography>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>โอนเงินและแนบสลิป</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    1. โอนเงินผ่านแอปธนาคารตามยอดที่ระบุ <br/>
                    2. บันทึกรูปสลิป (e-Slip) ลงในเครื่อง <br/>
                    3. กดปุ่มเพื่ออัปโหลดรูปสลิปในระบบ
                </Typography>
                
                {/* ✅ แทรกรูปภาพหน้าต่างแนบสลิป */}
                {renderZoomableImage("/manual_images/shop_payment_upload.png", "หน้าต่างแนบสลิปโอนเงิน", 500)}

                <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <CloudUploadIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                        รองรับไฟล์รูปภาพ .jpg, .png (สลิปการโอนเงิน)
                    </Typography>
                </Box>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>ตรวจสอบสถานะ "รอตรวจสอบ"</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    เมื่อแนบสลิปสำเร็จ ปุ่มแจ้งชำระจะเปลี่ยนสถานะเป็น <strong>"รอตรวจสอบ"</strong> (สีเหลือง) เจ้าหน้าที่จะทำการตรวจสอบยอดเงินของท่าน
                </Typography>
                
                {/* ✅ แทรกรูปภาพสถานะต่างๆ */}
                {renderZoomableImage("/manual_images/shop_payment_status.png", "ตัวอย่างสถานะการชำระเงิน", 500)}

                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 50,
                        px: 3,
                        py: 0.7,
                        bgcolor: "rgba(234,179,8,0.12)", 
                        border: "1px solid rgba(234,179,8,0.7)",
                    }}
                >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}>
                        รอตรวจสอบ
                    </Typography>
                </Box>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>ชำระเงินเสร็จสิ้น</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    เมื่อเจ้าหน้าที่ตรวจสอบความถูกต้องแล้ว สถานะจะเปลี่ยนเป็น <strong>"ชำระแล้ว"</strong> (สีเขียว) ถือว่ารายการเสร็จสมบูรณ์
                </Typography>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 50,
                        px: 3,
                        py: 0.7,
                        bgcolor: "rgba(34,197,94,0.15)",
                        border: "1px solid rgba(34,197,94,0.8)",
                    }}
                >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
                        ชำระแล้ว
                    </Typography>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>

        {/* 3. หมายเหตุ */}
        <Alert severity="warning">
            <strong>ข้อควรระวัง:</strong> กรุณาตรวจสอบยอดเงินและบัญชีปลายทางให้ถูกต้องก่อนกดยืนยันการโอน หากมีปัญหาในการชำระเงิน กรุณาติดต่อเจ้าหน้าที่ดูแลระบบ
        </Alert>

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