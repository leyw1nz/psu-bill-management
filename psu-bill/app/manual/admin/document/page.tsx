"use client";

import { useState } from "react";
import { 
  Box, 
  Typography, 
  Stack, 
  Divider, 
  Card, 
  CardContent, 
  Avatar,
  Dialog,
  IconButton
} from "@mui/material";
import { 
  Topic as DocIcon, 
  Description as BillIcon, 
  Download as ExcelIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon
} from "@mui/icons-material";

export default function AdminDocumentManual() {
  // State สำหรับ Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ ฟังก์ชันแสดงรูปภาพแบบ Zoomable (Show Icon on Hover)
  const renderZoomableImage = (src: string, alt: string, maxWidth: number = 600) => (
    <Box 
      sx={{ 
        position: 'relative', 
        width: 'fit-content', 
        mt: 2, 
        mb: 1,
        cursor: 'zoom-in', 
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover .zoom-icon': {
           opacity: 1,
           transform: 'translate(-50%, -50%) scale(1)',
        },
        '&:hover .img-content': {
           filter: 'brightness(0.9)',
           transform: 'scale(1.02)',
        }
      }}
      onClick={() => setPreviewImage(src)}
    >
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
      <Box 
        className="zoom-icon"
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) scale(0.8)',
          bgcolor: 'rgba(0, 0, 0, 0.6)', 
          color: 'white', 
          borderRadius: '50%', 
          p: 1.5, 
          display: 'flex',
          opacity: 0,
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
        <DocIcon color="info" fontSize="large" /> 5. เอกสารและรายงาน (Documents)
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        {/* ✅ Card 1: ใบแจ้งหนี้ */}
        <Card variant="outlined" sx={{ bgcolor: "white", borderRadius: 2 }}>
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', width: 56, height: 56 }}>
                        <BillIcon fontSize="large" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                            พิมพ์ใบแจ้งหนี้ (Invoice)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            สามารถเลือกพิมพ์ใบแจ้งหนี้ได้ 2 รูปแบบ:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, typography: 'body2', color: 'text.primary', mb: 2 }}>
                            <li><strong>พิมพ์ทั้งหมด:</strong> ระบบจะรวมใบแจ้งหนี้ของทุกห้องในเดือนนั้นเป็นไฟล์ PDF เดียว</li>
                            <li><strong>พิมพ์รายบุคคล:</strong> เลือกพิมพ์เฉพาะห้องที่ต้องการจากตาราง</li>
                        </Box>

                        {/* ✅ รูปภาพ: ปุ่มพิมพ์ใบแจ้งหนี้ */}
                        {renderZoomableImage("/manual_images/document_invoice_print.png", "ตัวอย่างปุ่มพิมพ์ใบแจ้งหนี้", 500)}
                    </Box>
                </Stack>
            </CardContent>
        </Card>

        {/* ✅ Card 2: Export Excel */}
        <Card variant="outlined" sx={{ bgcolor: "white", borderRadius: 2 }}>
            <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', width: 56, height: 56 }}>
                        <ExcelIcon fontSize="large" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                            ส่งออกข้อมูล (Export Excel)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            กดปุ่ม <strong>"Export Excel"</strong> เพื่อดาวน์โหลดไฟล์ .xlsx เพื่อนำไปส่งให้กองคลัง ซึ่งประกอบด้วย:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, typography: 'body2', mt: 1, mb: 2, color: 'text.primary' }}>
                            <li>สรุปเลขมิเตอร์ (ก่อน/หลัง) ของทุกห้อง</li>
                            <li>ยอดเงินค่าไฟและค่าน้ำ</li>
                        </Box>

                        {/* ✅ รูปภาพ: ปุ่ม Export Excel */}
                        {renderZoomableImage("/manual_images/document_export_excel.png", "ตัวอย่างปุ่ม Export Excel", 500)}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
      </Stack>

      {/* ✅ Lightbox Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.85)' } }}
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