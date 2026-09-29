"use client";

import { useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  Step, 
  Stepper, 
  StepLabel, 
  StepContent, 
  Chip, 
  Button,
  Dialog,
  IconButton
} from "@mui/material";
import { 
  PriceCheck as CheckIcon, 
  CheckCircle as ApproveIcon, 
  Cancel as RejectIcon, 
  FactCheck as FactCheckIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function AdminPaymentManual() {
  // State สำหรับเก็บ URL ของรูปที่ต้องการขยาย (null = ไม่แสดง)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ ฟังก์ชันแสดงรูปภาพ (Show Icon on Hover + Lightbox Trigger)
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
        // Effect เมื่อเอาเมาส์ชี้
        '&:hover .zoom-icon': {
           opacity: 1,
           transform: 'translate(-50%, -50%) scale(1)',
        },
        '&:hover .img-content': {
           filter: 'brightness(0.9)', // รูปมืดลงนิดนึง
           transform: 'scale(1.02)',  // รูปขยายขึ้นนิดนึง
        }
      }}
      onClick={() => setPreviewImage(src)}
    >
      {/* ตัวรูปภาพ */}
      <Box 
        className="img-content"
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          maxWidth: maxWidth, 
          height: 'auto',
          display: 'block',
          transition: 'transform 0.3s, filter 0.3s',
        }}
      />
      
      {/* ไอคอนแว่นขยาย (ปกติซ่อนอยู่) */}
      <Box 
        className="zoom-icon"
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) scale(0.8)', // จัดกึ่งกลาง
          bgcolor: 'rgba(0, 0, 0, 0.6)', 
          color: 'white', 
          borderRadius: '50%', 
          p: 1.5, 
          display: 'flex',
          opacity: 0, // 👈 เริ่มต้นซ่อนไว้
          transition: 'opacity 0.2s, transform 0.2s',
          pointerEvents: 'none' 
        }}
      >
        <ZoomInIcon fontSize="medium" />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckIcon color="success" fontSize="large" /> 4. ตรวจสอบการชำระเงิน (Check Slip)
      </Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
            ขั้นตอนการตรวจสอบและอนุมัติ
          </Typography>
          
          <Stepper orientation="vertical">
            {/* Step 1 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">1. ค้นหาและกรองสถานะ (Search & Filter)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    สามารถค้นหาด้วย <strong>รหัสร้าน, ชื่อร้าน หรือโซน</strong> และใช้ตัวกรองสถานะเพื่อดูรายการที่ต้องการ
                </Typography>
                
                {/* ✅ รูปภาพ Step 1: Search & Filter */}
                {renderZoomableImage("/manual_images/payment_check_step1.png", "การค้นหาและกรองรายการ")}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label="รอตรวจสอบ (Pending)" sx={{ bgcolor: "#0288D1", color: "white" }} size="small" />
                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>รายการที่ร้านค้าส่งสลิปมาแล้ว รอแอดมินตรวจ</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label="รอชำระ (Unpaid)" sx={{ bgcolor: "#ED6C02", color: "white" }} size="small" />
                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>รายการที่ยังไม่จ่าย หรือ ถูกปฏิเสธ (ไม่ผ่าน)</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="ชำระแล้ว (Paid)" sx={{ bgcolor: "#2E7D32", color: "white" }} size="small" />
                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>รายการที่อนุมัติเรียบร้อยแล้ว</Typography>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">2. กดตรวจสอบข้อมูล (Inspect)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ในตารางรายการ ให้กดที่ปุ่ม <strong>"ไอคอนตรวจสอบ"</strong> เพื่อเปิดดูรายละเอียด
                </Typography>

                {/* ✅ รูปภาพ Step 2: Inspect Button */}
                {renderZoomableImage("/manual_images/payment_check_step2.png", "ปุ่มกดตรวจสอบในตาราง")}

                <Box display="flex" alignItems="center" gap={2} sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, width: 'fit-content' }}>
                   <FactCheckIcon color="primary" />
                   <Typography variant="body2">กดปุ่มนี้ในคอลัมน์ขวาสุดของตาราง</Typography>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">3. พิจารณาอนุมัติ/ปฏิเสธ (Decision)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ตรวจสอบ <strong>ยอดเงิน, วันที่โอน, และรูปสลิป</strong> หากสถานะเป็น "รอตรวจสอบ" ปุ่มดำเนินการจะปรากฏขึ้น
                </Typography>
                
                {/* ✅ รูปภาพ Step 3: Approve Dialog */}
                {renderZoomableImage("/manual_images/payment_check_step3.png", "หน้าต่างตรวจสอบและอนุมัติ")}
                
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#f1f8e9', borderColor: '#a5d6a7' }}>
                         <Box display="flex" alignItems="center" gap={1}>
                            <Button variant="contained" size="small" color="success" startIcon={<ApproveIcon />} sx={{ pointerEvents: 'none' }}>
                                ผ่าน
                            </Button>
                            <Typography variant="subtitle2" fontWeight={600}>อนุมัติ (Approve)</Typography>
                         </Box>
                         <Typography variant="caption" color="text.secondary">
                           กดเมื่อข้อมูลถูกต้องครบถ้วน ระบบจะเปลี่ยนสถานะเป็น <strong>"ชำระแล้ว"</strong> (สีเขียว)
                         </Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#ffebee', borderColor: '#ef9a9a' }}>
                         <Box display="flex" alignItems="center" gap={1}>
                            <Button variant="contained" size="small" color="error" startIcon={<RejectIcon />} sx={{ pointerEvents: 'none' }}>
                                ไม่ผ่าน
                            </Button>
                            <Typography variant="subtitle2" fontWeight={600}>ปฏิเสธ (Reject)</Typography>
                         </Box>
                         <Typography variant="caption" color="text.secondary">
                           กดเมื่อสลิปผิด, ยอดไม่ตรง หรือมองไม่ชัด ระบบจะเปลี่ยนสถานะกลับเป็น <strong>"รอชำระ"</strong> (สีส้ม) เพื่อให้ร้านค้าส่งใหม่
                         </Typography>
                    </Paper>
                </Stack>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>
      </Stack>

      {/* ✅ Dialog (Lightbox) สำหรับแสดงรูปขนาดใหญ่ */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="xl"
        PaperProps={{
          sx: { bgcolor: 'transparent', boxShadow: 'none' } // พื้นหลังใส
        }}
        BackdropProps={{
          sx: { bgcolor: 'rgba(0,0,0,0.85)' } // พื้นหลังดำเข้ม
        }}
      >
        <Box sx={{ position: 'relative', outline: 'none' }}>
            <IconButton
                onClick={() => setPreviewImage(null)}
                sx={{
                    position: 'absolute',
                    top: -40,
                    right: 0,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }
                }}
            >
                <CloseIcon />
            </IconButton>
            
            {previewImage && (
                <Box 
                    component="img" 
                    src={previewImage} 
                    sx={{ 
                        width: 'auto', 
                        maxWidth: '90vw', 
                        maxHeight: '90vh', 
                        borderRadius: 2,
                        display: 'block'
                    }} 
                />
            )}
        </Box>
      </Dialog>
    </Box>
  );
}