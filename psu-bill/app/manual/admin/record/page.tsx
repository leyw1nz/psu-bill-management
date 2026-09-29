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
  Chip,
  Dialog,
  IconButton,
} from "@mui/material";
import { 
  ElectricBolt, 
  WaterDrop, 
  Home, 
  Store, 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Search as SearchIcon, 
  CheckCircle as CheckCircleIcon, 
  Calculate as CalculateIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
} from "@mui/icons-material";

export default function AdminRecordManual() {
  // State สำหรับเก็บ URL ของรูปที่ต้องการขยาย (null = ไม่แสดง)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ ฟังก์ชันแสดงรูปภาพ (ปรับปรุงใหม่: Show Icon on Hover)
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
        <ElectricBolt color="warning" fontSize="large" /> 
        <WaterDrop color="primary" fontSize="large" /> 
        3. การบันทึกมิเตอร์ (Record Utilities)
      </Typography>

      <Stack spacing={3}>
        {/* ✅ ขั้นตอนการบันทึก */}
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
            ขั้นตอนการบันทึกข้อมูล
          </Typography>
          
          <Stepper orientation="vertical">
            {/* Step 1 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">1. ระบุข้อมูลสถานที่ (Select Unit)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  เลือก <strong>"อาคาร/โซน"</strong> และ <strong>"เลขที่ (บ้าน/ร้าน)"</strong> จาก Dropdown
                </Typography>
                
                {/* รูป Step 1 */}
                {renderZoomableImage("/manual_images/record_step1.png", "ตัวอย่างการเลือกอาคารและห้อง")}

                <Alert severity="success" icon={<SearchIcon />} sx={{ py: 0, alignItems: 'center' }}>
                  <Typography variant="caption">
                    เมื่อเลือกครบ ระบบจะแสดงชื่อเจ้าของ, เบอร์โทร และที่อยู่โดยอัตโนมัติ เพื่อให้ตรวจสอบความถูกต้องก่อนบันทึก
                  </Typography>
                </Alert>
              </StepContent>
            </Step>

            {/* Step 2 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">2. เลือกเดือนและตรวจสอบมิเตอร์เดิม (Period & Previous Meter)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  เลือก <strong>"เดือน/ปี"</strong> ที่ต้องการจดมิเตอร์
                </Typography>
                
                {/* รูป Step 2 */}
                {renderZoomableImage("/manual_images/record_step2.png", "ตัวอย่างการเลือกเดือน")}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip label="กรณีปกติ" color="primary" size="small" variant="outlined" />
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        ระบบจะดึง <strong>เลขมิเตอร์ครั้งก่อน (Previous Unit)</strong> มาแสดงให้โดยอัตโนมัติ
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="กรณีมีการบันทึกแล้ว" color="warning" size="small" variant="outlined" icon={<EditIcon />} />
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        หากเคยบันทึกแล้ว ระบบจะแจ้งเตือนสีเหลืองว่า <strong>"โหมดแก้ไข"</strong> และดึงค่าเดิมมาแสดง
                    </Typography>
                </Stack>
              </StepContent>
            </Step>

            {/* Step 3 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">3. กรอกเลขมิเตอร์ปัจจุบัน (Input Current Meter)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  กรอกตัวเลขลงในช่อง <strong>"เลขมิเตอร์ครั้งหลัง"</strong>
                </Typography>
                
                {/* รูป Step 3 */}
                {renderZoomableImage("/manual_images/record_step3.png", "ตัวอย่างการกรอกเลขมิเตอร์")}

                {/* ส่วนแสดงการคำนวณ */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f8f9fa" }}>
                  <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                    <CalculateIcon fontSize="small" color="action"/> ระบบคำนวณอัตโนมัติ:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: "#e8f5e9", borderRadius: 1, border: '1px dashed #4caf50' }}>
                        <Typography variant="caption" display="block" color="text.secondary">หน่วยที่ใช้ (Difference)</Typography>
                        <Typography variant="body1" fontWeight={700} color="success.main">
                          (เลขครั้งหลัง - เลขครั้งก่อน)
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1, border: '1px dashed #2196f3' }}>
                        <Typography variant="caption" display="block" color="text.secondary">ยอดเงิน (Amount)</Typography>
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          (หน่วยที่ใช้ x ราคาต่อหน่วย)
                        </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  *หากเลขมิเตอร์ปัจจุบัน "น้อยกว่า" ครั้งก่อน ระบบจะแจ้งเตือน (ป้องกันการกรอกผิด)
                </Typography>
              </StepContent>
            </Step>

            {/* Step 4 */}
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600} color="text.primary">4. ตรวจสอบและบันทึก (Review & Save)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ตรวจสอบ <strong>"ราคาต่อหน่วย"</strong> (แก้ไขได้) และยอดเงินสุทธิ
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip label="บันทึกข้อมูล" color="success" icon={<SaveIcon />} clickable />
                  <Typography variant="body2" color="text.primary">
                    กดปุ่มเพื่อบันทึก ระบบจะแสดง Dialog สรุปผล
                  </Typography>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>

        {/* ✅ ส่วนอธิบายตาราง */}
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0", bgcolor: "white" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
            ตารางบันทึกล่าสุด (Recent Records)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            ด้านล่างของหน้าจอจะแสดงรายการที่เพิ่งบันทึกไปล่าสุด 3-5 รายการ เพื่อให้ตรวจสอบความถูกต้องได้ทันที
          </Typography>
          
          {/* รูปตาราง (ใช้ renderZoomableImage) */}
          {renderZoomableImage("/manual_images/record_table.png", "ตัวอย่างตารางบันทึกล่าสุด", 800)}

          <Divider sx={{ my: 2 }} />
          <Box sx={{ p: 2, bgcolor: "#e4eef8", borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <CheckCircleIcon color="success" sx={{ mt: 0.5 }} />
            <Box>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">Tips:</Typography>
                <Typography variant="body2" color="text.secondary">
                    ข้อมูลจะปรากฏในตารางทันทีที่บันทึกเสร็จ หากต้องการแก้ไขรายการที่เพิ่งทำผิดไป ให้เลือกอาคาร/ห้องเดิมซ้ำ ระบบจะดึงข้อมูลมาให้แก้ไข
                </Typography>
            </Box>
          </Box>
        </Paper>
      </Stack>

      {/* ✅ Dialog (Lightbox) แสดงรูปขนาดใหญ่ */}
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