"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Chip,
  Dialog,
  IconButton,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  Home as HouseIcon,
  Store as ShopIcon,
  Person as MemberIcon,
  TouchApp as ClickIcon,
  TableChart as TableIcon,
  DynamicForm as FormIcon,
  Visibility as ViewIcon, // ✅ เพิ่ม Import ตรงนี้แล้ว
} from "@mui/icons-material";

export default function AdminManageManual() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const renderZoomableImage = (
    src: string,
    alt: string,
    maxWidth: number = 600
  ) => (
    <Box
      sx={{
        position: "relative",
        width: "fit-content",
        my: 2,
        cursor: "zoom-in",
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        "&:hover .zoom-icon": {
          opacity: 1,
          transform: "translate(-50%, -50%) scale(1)",
        },
        "&:hover .img-content": {
          filter: "brightness(0.9)",
          transform: "scale(1.02)",
        },
      }}
      onClick={() => setPreviewImage(src)}
    >
      <Box
        className="img-content"
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: "100%",
          maxWidth: maxWidth,
          height: "auto",
          display: "block",
          transition: "transform 0.3s, filter 0.3s",
        }}
      />
      <Box
        className="zoom-icon"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(0.8)",
          bgcolor: "rgba(0, 0, 0, 0.6)",
          color: "white",
          borderRadius: "50%",
          p: 1.5,
          display: "flex",
          opacity: 0,
          transition: "all 0.2s",
          pointerEvents: "none",
        }}
      >
        <ZoomInIcon fontSize="medium" />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight={700}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <AdminIcon color="primary" fontSize="large" /> 2. จัดการข้อมูลหลัก
        (Management)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        เมนูนี้ใช้สำหรับบริหารจัดการฐานข้อมูลหลักของระบบ ทั้งข้อมูลบ้านพัก
        ร้านค้า และสมาชิก
      </Typography>
      <Divider sx={{ my: 3 }} />

      <Stack spacing={4}>
        {/* ✅ ส่วนที่ 2.1: เลือกประเภท (ปรับดีไซน์ใหม่: Clean & Clear) */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom
            color="text.primary"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <ClickIcon color="action" /> 2.1 เลือกประเภทข้อมูล (Select Data
            Type)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            เมื่อเข้าสู่หน้าจัดการ ท่านสามารถเลือกแถบ (Tabs) หรือเมนู
            เพื่อจัดการข้อมูลแต่ละส่วนได้ดังนี้:
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Card บ้านพัก - พื้นขาว เน้นไอคอนสีฟ้า */}
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: "#e3f2fd",
                "&:hover": { boxShadow: 2, borderColor: "primary.main" },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  "&:last-child": { pb: 2 },
                }}
              >
                {/* Avatar สีจาง ไอคอนสีเข้ม */}
                <Avatar sx={{ bgcolor: "#e3f2fd", color: "#1565c0" }}>
                  <HouseIcon />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#1565c0"
                  >
                    บ้านพัก
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    จัดการเลขห้อง, มิเตอร์
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Card ร้านค้า - พื้นขาว เน้นไอคอนสีส้ม */}
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: "#fff3e0",
                "&:hover": { boxShadow: 2, borderColor: "warning.main" },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Avatar sx={{ bgcolor: "#fff3e0", color: "#ef6c00" }}>
                  <ShopIcon />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#ef6c00"
                  >
                    ร้านค้า
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    จัดการชื่อร้าน, โซน
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Card สมาชิก - พื้นขาว เน้นไอคอนสีชมพู */}
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                borderColor: "#fce4ec",
                "&:hover": { boxShadow: 2, borderColor: "secondary.main" },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Avatar sx={{ bgcolor: "#fce4ec", color: "#c2185b" }}>
                  <MemberIcon />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#c2185b"
                  >
                    สมาชิก
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    จัดการ User/Password
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Paper>

        {/* ✅ ส่วนที่ 2.2: เครื่องมือจัดการ */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom
            color="text.primary"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <TableIcon color="action" /> 2.2 เครื่องมือจัดการ (Actions)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            ท่านสามารถใช้เครื่องมือจัดการได้เหมือนกันในทุกเมนู
            (บ้าน/ร้าน/สมาชิก):
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1.5 }}>
              {/* ✅ ใช้รูปเดียวที่เป็นตัวแทน */}
              {renderZoomableImage(
                "/manual_images/manage_overview.png",
                "ตัวอย่างหน้าจัดการข้อมูล",
                800
              )}
            </Box>

            <Box sx={{ flex: 1, width: "100%" }}>
              <Stack spacing={2} sx={{ mt: { xs: 0, md: 2 } }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Chip
                    icon={<AddIcon />}
                    label="เพิ่มข้อมูล"
                    color="success"
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <Typography variant="body2" color="text.primary">
                    <strong>ปุ่มเขียว:</strong> ใช้สร้างข้อมูลใหม่
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Chip
                    icon={<EditIcon />}
                    label="แก้ไข"
                    color="warning"
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <Typography variant="body2" color="text.primary">
                    <strong>ปุ่มส้ม:</strong> ใช้แก้ไขข้อมูลเดิม
                  </Typography>
                </Box>
                <Divider />
                {/* ✅ แก้เป็นปุ่ม View ตามที่ขอ */}
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Chip
                    icon={<ViewIcon />}
                    label="ดูข้อมูล"
                    color="info"
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <Typography variant="body2" color="text.primary">
                    <strong>ปุ่มฟ้า (ดูข้อมูล):</strong>{" "}
                    ใช้กดดูรายละเอียดได้อย่างเดียว ไม่สามารถแก้ไขข้อมูลได้
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* ✅ ส่วนที่ 2.3: ฟอร์ม */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            gutterBottom
            color="text.primary"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <FormIcon color="action" /> 2.3 การกรอกข้อมูล (Data Entry)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            เมื่อกดปุ่มเพิ่มหรือแก้ไข ระบบจะแสดงแบบฟอร์มให้กรอกข้อมูล
            (ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก)
          </Typography>

          {renderZoomableImage(
            "/manual_images/manage_add_edit.png",
            "ตัวอย่างฟอร์มกรอกข้อมูล",
            600
          )}
        </Paper>
      </Stack>

      {/* Lightbox Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="xl"
        PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}
        BackdropProps={{ sx: { bgcolor: "rgba(0,0,0,0.85)" } }}
      >
        <Box sx={{ position: "relative", outline: "none" }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: -40,
              right: 0,
              color: "white",
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              sx={{
                width: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 2,
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
