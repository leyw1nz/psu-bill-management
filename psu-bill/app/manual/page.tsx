"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Stack,
  Alert,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";

import {
  Info as InfoIcon,
  Person as UserIcon,
  Store as ShopIcon,
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth"; // ✅ อย่าลืม import function นี้

// ----------------------------------------------------------------------
// 1. Config ข้อมูล Card และสิทธิ์การเข้าถึง
// ----------------------------------------------------------------------
const CARD_CONFIG = [
  {
    id: "house",
    title: "สำหรับบ้านพัก",
    desc: "วิธีตรวจสอบบิล ดูประวัติ และพิมพ์ใบแจ้งหนี้สำหรับผู้พักอาศัย",
    icon: <UserIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />,
    color: "primary.main",
    href: "/manual/house/dashboard",
    // Admin, House, General เห็นได้
    allowedRoles: ["admin", "house", "general"],
  },
  {
    id: "shop",
    title: "สำหรับร้านค้า",
    desc: "วิธีตรวจสอบยอดค้างชำระ และขั้นตอนการส่งสลิปโอนเงิน",
    icon: <ShopIcon sx={{ fontSize: 60, color: "warning.main", mb: 2 }} />,
    color: "warning.main",
    href: "/manual/shop/dashboard",
    // Admin, Shop, General เห็นได้
    allowedRoles: ["admin", "shop", "general"],
  },
  {
    id: "admin",
    title: "สำหรับเจ้าหน้าที่",
    desc: "การจัดการข้อมูล การจดมิเตอร์ และการตรวจสอบการชำระเงิน",
    icon: <AdminIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />,
    color: "error.main",
    href: "/manual/admin/dashboard",
    // ✅ กำหนดให้เฉพาะ admin เท่านั้นที่เห็น
    allowedRoles: ["admin"],
  },
];

// Mapping Role ID -> String
const ROLE_MAP: Record<number, string> = {
  1: "admin",
  2: "shop",
  3: "general",
  4: "house",
};

export default function ManualPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role_id) {
      const roleId = user.role_id as number;
      setUserRole(ROLE_MAP[roleId] || "general");
    } else {
      // ถ้าไม่ได้ Login ให้มองเป็น general ไว้ก่อน (เห็นแค่ House/Shop)
      setUserRole("general");
    }
    setLoading(false);
  }, []);

  if (loading) return null; // หรือใส่ Loading Spinner ตามต้องการ

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            bgcolor: "primary.main",
            borderRadius: 2,
            color: "white",
            display: "flex",
          }}
        >
          <InfoIcon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#2c3e50">
            ภาพรวมระบบ (System Overview)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ยินดีต้อนรับสู่คู่มือการใช้งานระบบ PSU Bill
          </Typography>
        </Box>
      </Box>

      <Stack spacing={4}>
        {/* Intro */}
        <Paper sx={{ p: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            เกี่ยวกับระบบ
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography paragraph color="text.secondary">
            ระบบ PSU Bill พัฒนาขึ้นเพื่อบริหารจัดการ (ค่าน้ำ/ค่าไฟ)
            ภายในมหาวิทยาลัย ช่วยให้การจดมิเตอร์ คำนวณค่าใช้จ่าย และการชำระเงิน
          </Typography>

          <Alert severity="info" sx={{ mt: 2 }}>
            กรุณาเลือกหัวข้อคู่มือตามบทบาทการใช้งานของคุณจากเมนูด้านซ้าย
            หรือคลิกที่การ์ดด้านล่าง
          </Alert>
        </Paper>

        {/* Dynamic Cards Section */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {CARD_CONFIG.map((card) => {
            // 🎯 Logic: ถ้า UserRole ไม่มีสิทธิ์ใน Card นี้ ให้ซ่อน (return null)
            if (userRole && !card.allowedRoles.includes(userRole)) {
              return null;
            }

            return (
              <Box key={card.id} sx={{ flex: 1 }}>
                <Link href={card.href} style={{ textDecoration: "none" }}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      transition: "0.3s",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardActionArea sx={{ height: "100%", p: 2 }}>
                      <CardContent sx={{ textAlign: "center" }}>
                        {card.icon}
                        <Typography variant="h6" gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.desc}
                        </Typography>
                        <Box
                          mt={2}
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          gap={1}
                          color={card.color}
                        >
                          <Typography variant="button">ดูคู่มือ</Typography>
                          <ArrowIcon fontSize="small" />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Link>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}