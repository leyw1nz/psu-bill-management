"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Typography, Button, Container, Paper } from "@mui/material";
import { Error as ErrorIcon } from "@mui/icons-material";

export default function HouseManualLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    
    // 🔴 แก้ไข: ใช้ user.role_id เช็ค ID ที่อนุญาต
    if (user && [1, 3, 4].includes(user.role_id as number)) {
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
          <Button variant="contained" onClick={() => router.push("/manual")}>กลับ</Button>
        </Paper>
      </Container>
    );
  }
  return <>{children}</>;
}