// components/MainLayout.tsx

"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, handleLogout as handleSmartLogout } from "@/lib/auth";
import { User, MainLayoutProps } from "@/types";
import Image from "next/image";
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Link,
  Divider,
} from "@mui/material";
import {
  LogoutOutlined as LogoutOutlinedIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  MenuBook as ManualIcon, // ✅ 1. เพิ่มไอคอนหนังสือ
} from "@mui/icons-material";

export default function MainLayout({
  children,
  IsMobile = true,
}: MainLayoutProps) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleLogout = async () => {
    await handleSmartLogout();
  };

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(to bottom right, #5DD5D5, #4EC8E8, #4AB8F5)",
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          py: 1,
          background: "linear-gradient(to right, #2e3d8f, #2fabdf)",
          color: "white",
          borderRadius: 0,
        }}
      >
        <Container maxWidth={IsMobile ? "md" : false}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent={{ xs: "stretch", sm: "space-between" }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="start"
              spacing={2}
            >
              {/* Logo */}
              <Image
                src="/PSUBill_logo.png"
                alt="PSU Bill Logo"
                width={200}
                height={200}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  maxWidth: "60px",
                  height: "auto",
                  borderRadius: "50%",
                }}
                priority
              />
              {/* Title */}
              <Box>
                <Typography
                  variant="h6"
                  align="left"
                  sx={{
                    fontWeight: "bold",
                    color: "white",
                    fontSize: "1.8rem",
                  }}
                >
                  ระบบตรวจสอบค่าน้ำค่าไฟ
                </Typography>
                <Typography
                  variant="h6"
                  align="left"
                  sx={{
                    fontWeight: "bold",
                    color: "white",
                    opacity: "0.8",
                    fontSize: "1rem",
                  }}
                >
                  PSU Bill
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent={"flex-end"}
            >
              {/* ✅ 2. เพิ่มปุ่มคู่มือการใช้งานตรงนี้ */}
              <Box mr={2} sx={{ display: 'box' }}> 
                <Link
                  href="/manual"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.15)', // พื้นหลังจางๆ ให้ดูเป็นปุ่ม
                    px: 2,
                    py: 0.5,
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <ManualIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                    คู่มือการใช้งาน
                  </Typography>
                </Link>
              </Box>
              {/* --------------------------------------- */}

              <PersonIcon sx={{ color: "white", fontSize: 24 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {user.name} {user.surname}
                </Typography>
              </Box>
              <Box textAlign={"right"}>
                <Link
                  onClick={handleLogout}
                  sx={{
                    color: "white",
                    cursor: "pointer",
                    textDecorationLine: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                >
                  <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
                  ออกจากระบบ
                </Link>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>{children}</Box>

      {/* Footer */}
      <Paper
        elevation={3}
        sx={{
          background: "linear-gradient(to right, #2e3d8f, #2fabdf)",
          color: "white",
          borderRadius: 0,
          mt: "auto",
        }}
      >
        <Container maxWidth={IsMobile ? "md" : false}>
          <Box sx={{ py: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2, md: 4 }}
              divider={
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                />
              }
            >
              {/* Copyright Section */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1, fontSize: "1rem" }}
                >
                  ระบบตรวจสอบค่าน้ำค่าไฟ PSU Bill
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                >
                  © {new Date().getFullYear()} มหาวิทยาลัยสงขลานครินทร์
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                >
                  สงวนลิขสิทธิ์ All rights reserved
                </Typography>
              </Box>

              {/* Contact Section */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1, fontSize: "1rem" }}
                >
                  ติดต่อเรา
                </Typography>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                    >
                      มหาวิทยาลัยสงขลานครินทร์ อ.หาดใหญ่ จ.สงขลา 90110
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                    >
                      074-282194
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                    >
                      psubill@psu.ac.th
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              {/* Version Info */}
              <Box sx={{ flex: { xs: 1, md: 0.5 } }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1, fontSize: "1rem" }}
                >
                  ข้อมูลระบบ
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                >
                  เวอร์ชัน 1.0.0
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: "0.875rem" }}
                >
                  อัพเดทล่าสุด:{" "}
                  {new Date().toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}