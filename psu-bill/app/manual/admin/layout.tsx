"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Typography, Button, Container, Paper } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";

export default function AdminManualLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    
    // 🔴 แก้ไข: ใช้ user.role_id === 1 (Admin)
    if (user && user.role_id === 1) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    setChecking(false);
  }, []);

  if (checking) return null;

  if (!isAuthorized) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">ไม่มีสิทธิ์เข้าถึง</Typography>
          <Typography color="text.secondary" paragraph>เนื้อหานี้สำหรับผู้ดูแลระบบเท่านั้น</Typography>
          <Button variant="contained" onClick={() => router.push("/manual")}>กลับไปหน้าหลักคู่มือ</Button>
        </Paper>
      </Container>
    );
  }
  return <>{children}</>;
}