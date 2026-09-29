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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from "@mui/material";

import {
  Description as InvoiceIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from "@mui/icons-material";

export default function ShopInvoiceManual() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InvoiceIcon color="primary" fontSize="large" /> คู่มือ: ใบแจ้งหนี้และการสั่งพิมพ์ (Invoice & Printing)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        คำแนะนำวิธีการตรวจสอบรายละเอียดในใบแจ้งหนี้ (บิลค่าไฟ/ค่าน้ำ) และขั้นตอนการบันทึกเป็นไฟล์ PDF หรือสั่งพิมพ์ลงกระดาษ
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        
        {/* 1. ส่วนแสดงผลใบแจ้งหนี้ */}
        <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            1. องค์ประกอบของใบแจ้งหนี้
          </Typography>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            ระบบจะแสดงตัวอย่างใบแจ้งหนี้ในรูปแบบ A4 บนหน้าจอ เพื่อให้ท่านตรวจสอบความถูกต้องของข้อมูล <strong>มิเตอร์ (ก่อน/หลัง)</strong> และ <strong>ยอดเงินรวม</strong> ก่อนนำไปใช้งาน
          </Alert>

          {/* จำลองหน้า Invoice UI */}
          <Box sx={{ bgcolor: "#f1f5f9", p: 3, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            
            {/* ปุ่มพิมพ์จำลอง */}
            <Paper sx={{ p: 1.5, width: "100%", display: "flex", justifyContent: "center", border: "1px solid #e3e6ea", borderRadius: 1 }}>
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    sx={{
                        bgcolor: '#1976d2',
                        textTransform: 'none',
                        boxShadow: 2
                    }}
                >
                    พิมพ์ / บันทึก PDF
                </Button>
            </Paper>

            {/* กระดาษจำลอง */}
            <Paper 
                elevation={3}
                sx={{ 
                    width: "100%", 
                    maxWidth: 500, 
                    aspectRatio: "210/297", 
                    p: 3, 
                    bgcolor: "white",
                    fontSize: 10, 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eee'
                }}
            >
                {/* Header จำลอง */}
                <Box textAlign="center" mb={2}>
                    <Typography variant="caption" fontWeight="bold" display="block">มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่</Typography>
                    <Typography variant="caption" display="block">ใบแจ้งหนี้และปริมาณการใช้กระแสไฟฟ้าและน้ำประปา</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>ประจำเดือน: <strong>มกราคม 2569</strong></Typography>
                </Box>

                {/* รายละเอียดผู้รับ */}
                <Box mb={2} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                    <Typography variant="caption" display="block"><b>ชื่อ - สกุล :</b> เจ้าของร้านตัวอย่าง</Typography>
                    <Typography variant="caption" display="block"><b>สถานที่ :</b> ร้านเลขที่ A-01 (โซนโรงอาหาร)</Typography>
                </Box>

                {/* ตารางจำลอง (ปรับให้ตรงกับ Code จริง: รายการ | ครั้งก่อน | ครั้งหลัง | ผลต่าง | เงิน) */}
                <TableContainer sx={{ border: '1px solid #000', mb: 1 }}>
                    <Table size="small" padding="none">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#d3d3d3' }}>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000', py: 0.5, fontWeight: 'bold' }}>รายการ</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000', py: 0.5 }}>ก่อน</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000', py: 0.5 }}>หลัง</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000', py: 0.5 }}>หน่วย</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, py: 0.5, fontWeight: 'bold' }}>จำนวนเงิน</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                                <TableCell sx={{ fontSize: 9, borderRight: '1px solid #000', px: 0.5 }}>ค่าไฟฟ้า</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>1,000</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>1,150</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>150</TableCell>
                                <TableCell align="right" sx={{ fontSize: 9, px: 1 }}>750.00</TableCell>
                            </TableRow>
                            <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                                <TableCell sx={{ fontSize: 9, borderRight: '1px solid #000', px: 0.5 }}>ค่าน้ำประปา</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>500</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>510</TableCell>
                                <TableCell align="center" sx={{ fontSize: 9, borderRight: '1px solid #000' }}>10</TableCell>
                                <TableCell align="right" sx={{ fontSize: 9, px: 1 }}>150.00</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ fontSize: 9, borderRight: '1px solid #000', fontWeight: 'bold' }}>รวมทั้งสิ้น</TableCell>
                                <TableCell align="right" sx={{ fontSize: 9, px: 1, fontWeight: 'bold', color: '#1976d2' }}>900.00</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Footer ลายเซ็น */}
                <Box mt="auto" display="flex" justifyContent="space-between" px={2} pt={2}>
                    <Box textAlign="center">
                        <Box sx={{ borderBottom: '1px dotted #000', width: 60, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: 8 }}>จนท. มหาวิทยาลัย</Typography>
                    </Box>
                    <Box textAlign="center">
                        <Box sx={{ borderBottom: '1px dotted #000', width: 60, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: 8 }}>ผู้ใช้ไฟฟ้า/น้ำ</Typography>
                    </Box>
                </Box>
            </Paper>
          </Box>
        </Paper>

        {/* 2. ขั้นตอนการใช้งาน */}
        <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            2. ขั้นตอนการใช้งาน
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 2 }}>
            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>1. ตรวจสอบความถูกต้อง (Check Accuracy)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    ตรวจสอบ <strong>ชื่อผู้รับ, สถานที่, และตัวเลขมิเตอร์</strong> (จดครั้งก่อน vs จดครั้งหลัง) ว่าสัมพันธ์กันหรือไม่ 
                </Typography>
                <Alert severity="warning" sx={{ py: 0 }}>
                    <Typography variant="caption">หากตัวเลขมิเตอร์ผิดปกติ หรือยอดเงินไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่ก่อนทำการชำระเงิน</Typography>
                </Alert>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>2. กดปุ่มสั่งพิมพ์ (Print / Save)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    คลิกที่ปุ่ม <strong>"พิมพ์ / บันทึก PDF"</strong> สีน้ำเงินด้านบนของเอกสาร
                </Typography>
              </StepContent>
            </Step>

            <Step active={true}>
              <StepLabel>
                <Typography fontWeight={600}>3. เลือกรูปแบบปลายทาง (Select Destination)</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    หน้าต่างตั้งค่าการพิมพ์จะปรากฏขึ้น ท่านสามารถเลือกได้ 2 รูปแบบ:
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <PrintIcon color="primary" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600}>พิมพ์ออกกระดาษ (Printer)</Typography>
                            <Typography variant="caption" color="text.secondary">เลือกชื่อเครื่องพิมพ์ที่เชื่อมต่ออยู่ แล้วกด Print</Typography>
                        </Box>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <PdfIcon color="error" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600}>บันทึกเป็นไฟล์ (Save as PDF)</Typography>
                            <Typography variant="caption" color="text.secondary">
                                ที่ช่อง <em>Destination</em> เลือก <strong>"Save as PDF"</strong> เพื่อดาวน์โหลดเก็บไว้ในเครื่อง
                            </Typography>
                        </Box>
                    </Paper>
                </Stack>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>
      </Stack>
    </Box>
  );
}