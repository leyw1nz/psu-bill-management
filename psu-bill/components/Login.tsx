"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSession, setCurrentUser } from "@/lib/auth";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ArrowForward,
  Error as ErrorIcon,
} from "@mui/icons-material";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Forgot Password State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call login API to validate user credentials
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Create session
        await createSession(result.user.id);
        setCurrentUser(result.user);

        // Store member_id for easy access (user.id is already member_id for database users)
        localStorage.setItem("member_id", result.user.id);

        // Redirect to main page where user can choose their menu
        router.push("/main");
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  const handlePSUPassportLogin = () => {
    // Redirect to OIDC login endpoint
    window.location.href = "/api/auth/oidc/login";
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });

      const result = await response.json();

      if (result.success) {
        setForgotSuccess(result.message);
        // Show temp password in development
        if (result.data?.tempPassword) {
          setForgotSuccess(
            `${result.message}\n\nรหัสผ่านชั่วคราว: ${result.data.tempPassword}\n(สำหรับการพัฒนาระบบเท่านั้น)`
          );
        }
        setForgotIdentifier("");
      } else {
        setForgotError(result.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
      }
    } catch (err) {
      setForgotError("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(to bottom right, #5DD5D5, #4EC8E8, #4AB8F5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 450, md: 500 },
          borderRadius: { xs: 4, sm: 5, md: 6 },
          p: { xs: 3 },
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Image
            src="/PSUBill_logo.png"
            alt="PSU Bill Logo"
            width={350}
            height={350}
            style={{
              objectFit: "contain",
              width: "100%",
              maxWidth: "180px",
              height: "auto",
            }}
            priority
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(to right, #2e3d8f, #2fabdf)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            mb: 1,
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
          }}
        >
          ระบบตรวจสอบค่าน้ำค่าไฟ
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            fontWeight: 500,
            color: "#3D5A98",
            mb: { xs: 3, sm: 4 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          มหาวิทยาลัยสงขลานครินทร์
        </Typography>

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleLogin}>
          {/* Divider */}
          <Divider sx={{ my: { xs: 3, sm: 4 } }}>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                bgcolor: "#f6fcfd",
                borderRadius: 1,
                fontWeight: 500,
                color: "#2e5aa4",
                fontSize: "1rem",
              }}
            >
              บุคลากร
            </Typography>
          </Divider>

          {/* PSU Passport Button */}
          <Button
            type="button"
            fullWidth
            variant="contained"
            onClick={handlePSUPassportLogin}
            sx={{
              bgcolor: "#3D5A98",
              fontWeight: "bold",
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              borderRadius: 3,
              boxShadow: 2,
              transition: "all 0.3s",
              "&:hover": {
                bgcolor: "#2D4A88",
                boxShadow: 4,
                transform: "translateY(-2px)",
              },
            }}
          >
            <Image
              src="/PSUOauth.svg"
              alt="PSU Passport Logo"
              width={515}
              height={59}
              style={{
                height: "24px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </Button>

          {/* Divider */}
          <Divider sx={{ my: { xs: 2.5, sm: 3 } }}>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                bgcolor: "#f6fcfd",
                borderRadius: 1,
                fontWeight: 500,
                color: "#2f7ebe",
                fontSize: "1rem",
              }}
            >
              บุคคลทั่วไป
            </Typography>
          </Divider>

          {/* Username Field */}
          <TextField
            fullWidth
            label="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="กรอกชื่อผู้ใช้"
            required
            sx={{ mb: { xs: 2, sm: 2.5 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon
                    color="action"
                    sx={{ fontSize: { xs: 20, sm: 24 } }}
                  />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              },
            }}
            InputLabelProps={{
              sx: { fontSize: { xs: "0.875rem", sm: "1rem" } },
            }}
          />

          {/* Password Field */}
          <TextField
            fullWidth
            label="รหัสผ่าน"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="กรอกรหัสผ่าน"
            required
            sx={{ mb: { xs: 3, sm: 4 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon
                    color="action"
                    sx={{ fontSize: { xs: 20, sm: 24 } }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    ) : (
                      <Visibility sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              },
            }}
            InputLabelProps={{
              sx: { fontSize: { xs: "0.875rem", sm: "1rem" } },
            }}
          />

          {/* Login Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            endIcon={
              loading ? null : (
                <ArrowForward sx={{ fontSize: { xs: 18, sm: 20 } }} />
              )
            }
            sx={{
              background: "linear-gradient(to right, #3366FF, #5555FF)",
              fontWeight: "bold",
              py: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              boxShadow: 3,
              transition: "all 0.3s",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              "&:hover": {
                background: "linear-gradient(to right, #2952CC, #4444DD)",
                boxShadow: 6,
                transform: "translateY(-2px)",
              },
              "&.Mui-disabled": {
                bgcolor: "grey.400",
                color: "white",
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                  กำลังเข้าสู่ระบบ...
                </Typography>
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setForgotPasswordOpen(true)}
              sx={{
                color: "#1976d2",
                textDecoration: "none",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              ลืมรหัสผ่าน?
            </Link>
          </Box>
        </Box>

        {/* Forgot Password Dialog */}
        <Dialog
          open={forgotPasswordOpen}
          onClose={() => {
            setForgotPasswordOpen(false);
            setForgotError("");
            setForgotSuccess("");
            setForgotIdentifier("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>ลืมรหัสผ่าน</DialogTitle>
          <DialogContent>
            {forgotError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {forgotError}
              </Alert>
            )}
            {forgotSuccess && (
              <Alert severity="success" sx={{ mb: 2, whiteSpace: "pre-line" }}>
                {forgotSuccess}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              กรุณากรอกชื่อผู้ใช้, อีเมล หรือรหัสบัตรประชาชนของคุณ
              ระบบจะส่งรหัสผ่านใหม่ไปยังอีเมลที่ลงทะเบียนไว้
            </Typography>
            <TextField
              fullWidth
              label="ชื่อผู้ใช้ / อีเมล / รหัสบัตรประชาชน"
              value={forgotIdentifier}
              onChange={(e) => setForgotIdentifier(e.target.value)}
              disabled={forgotLoading}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setForgotPasswordOpen(false);
                setForgotError("");
                setForgotSuccess("");
                setForgotIdentifier("");
              }}
              disabled={forgotLoading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleForgotPassword}
              variant="contained"
              disabled={forgotLoading || !forgotIdentifier}
            >
              {forgotLoading ? "กำลังดำเนินการ..." : "รีเซ็ตรหัสผ่าน"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
