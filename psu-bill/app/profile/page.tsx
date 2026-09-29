"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import MainLayout from "@/components/MainLayout";
import Link from "next/link";
import { getCurrentUser, isOIDCUser } from "@/lib/auth";
import { memberService } from "@/lib/services";
import { Member } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOIDC, setIsOIDC] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    email: "",
    phone: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: false,
    phone: false,
  });

  // Change Password Dialog State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Check if user is OIDC user
        setIsOIDC(isOIDCUser(currentUser));

        if (currentUser.member_id) {
          const response = await memberService.getById(currentUser.member_id);

          if (response.success && response.data) {
            setMember(response.data);
            setEditData({
              email: response.data.email || "",
              phone: response.data.phone || "",
            });
          } else {
            setError(response.error || "Failed to load profile");
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSaveProfile = async () => {
    // Validate required fields
    const errors = {
      email: !editData.email || editData.email.trim() === "",
      phone: !editData.phone || editData.phone.trim() === "",
    };

    setValidationErrors(errors);

    // Check if there are any validation errors
    if (errors.email || errors.phone) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await memberService.update(member!.member_id, {
        username: member!.username || "",
        citizen_id: member!.citizen_id || undefined,
        email: editData.email,
        title: member!.title || undefined,
        name: member!.name || "",
        surname: member!.surname || "",
        phone: editData.phone,
        role_id: member!.role_id || 0,
      });

      // Check if the response is successful
      if (!response.success) {
        setError(response.error || "Failed to update profile");
        return;
      }

      if (response.data) {
        setMember(response.data);
        setEditData({
          email: response.data.email || "",
          phone: response.data.phone || "",
        });
        setSuccessDialogOpen(true);
        setIsEditMode(false);
        setValidationErrors({ email: false, phone: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      email: member?.email || "",
      phone: member?.phone || "",
    });
    setIsEditMode(false);
    setValidationErrors({ email: false, phone: false });
    setError(null);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member?.member_id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }

      setSuccessDialogOpen(true);
      setChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!member) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="lg">
          <Alert severity="error">ไม่พบข้อมูลผู้ใช้</Alert>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="lg">
        {/* Error Alert (only when not in edit mode) */}
        {error && !isEditMode && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Breadcrumbs */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            my: 1.5,
            mb: 3,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid #e7ebff",
          }}
        >
          <Breadcrumbs separator="/">
            <Link href="/main" style={{ textDecoration: "none" }}>
              <Typography
                color="#2fa4da"
                sx={{
                  fontSize: 16,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                หน้าหลัก
              </Typography>
            </Link>
            <Typography color="text.primary" sx={{ fontSize: 16 }}>
              ข้อมูลส่วนตัว
            </Typography>
          </Breadcrumbs>
        </Paper>

        {/* Profile Header */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            border: "1px solid #e7ebff",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar
              sx={{
                bgcolor: "#1976d2",
                width: 80,
                height: 80,
                fontSize: 32,
              }}
            >
              <PersonIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#35373b" }}>
                {member.title} {member.name} {member.surname}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {member.email || "ไม่มีอีเมล"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOIDC ? "บัญชี PSU Passport" : "บัญชีผู้ใช้ทั่วไป"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Profile Information */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            border: "1px solid #e7ebff",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#35373b" }}>
              ข้อมูลส่วนตัว
            </Typography>
            {!isEditMode && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditMode(true)}
                size="small"
                sx={{
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  "&:hover": {
                    borderColor: "#1565c0",
                    bgcolor: "rgba(25, 118, 210, 0.04)",
                  },
                }}
              >
                แก้ไข
              </Button>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="ชื่อผู้ใช้"
              value={member.username || "-"}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              variant="outlined"
              sx={{
                "& .MuiInputBase-input": {
                  bgcolor: "#f5f5f5",
                  cursor: "not-allowed",
                },
              }}
            />
            {member.staff_id && (
              <TextField
                fullWidth
                label="รหัสบุคลากร"
                value={member.staff_id}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                variant="outlined"
                sx={{
                  "& .MuiInputBase-input": {
                    bgcolor: "#f5f5f5",
                    cursor: "not-allowed",
                  },
                }}
              />
            )}
            <TextField
              fullWidth
              label="เบอร์โทรศัพท์"
              value={isEditMode ? editData.phone : member.phone || "-"}
              onChange={(e) => {
                setEditData({ ...editData, phone: e.target.value });
                if (validationErrors.phone) {
                  setValidationErrors({ ...validationErrors, phone: false });
                }
              }}
              slotProps={{
                input: {
                  readOnly: !isEditMode,
                },
              }}
              variant="outlined"
              required={isEditMode}
              error={isEditMode && validationErrors.phone}
              helperText={isEditMode && validationErrors.phone ? "กรุณากรอกเบอร์โทรศัพท์" : ""}
              sx={{
                "& .MuiInputBase-input": {
                  bgcolor: isEditMode ? "white" : "#f5f5f5",
                  cursor: isEditMode ? "text" : "not-allowed",
                },
                "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d32f2f",
                  borderWidth: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="อีเมล"
              value={isEditMode ? editData.email : member.email || "-"}
              onChange={(e) => {
                setEditData({ ...editData, email: e.target.value });
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: false });
                }
              }}
              slotProps={{
                input: {
                  readOnly: !isEditMode,
                },
              }}
              variant="outlined"
              required={isEditMode}
              error={isEditMode && validationErrors.email}
              helperText={isEditMode && validationErrors.email ? "กรุณากรอกอีเมล" : ""}
              sx={{
                "& .MuiInputBase-input": {
                  bgcolor: isEditMode ? "white" : "#f5f5f5",
                  cursor: isEditMode ? "text" : "not-allowed",
                },
                "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#d32f2f",
                  borderWidth: 2,
                },
              }}
            />
          </Box>

          {isEditMode && (
            <>
              {/* Error Alert in Edit Mode */}
              {error && (
                <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </Stack>
            </>
          )}
        </Paper>

        {/* Password Management - Only for non-OIDC users */}
        {!isOIDC && (
          <Paper
            elevation={3}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
              border: "1px solid #e7ebff",
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#35373b" }}>
              จัดการรหัสผ่าน
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัยที่ดีขึ้น
            </Typography>
            <Button
              variant="contained"
              startIcon={<LockIcon />}
              onClick={() => setChangePasswordOpen(true)}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
              }}
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </Paper>
        )}

        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          <DialogContent>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                type="password"
                label="รหัสผ่านปัจจุบัน"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                disabled={saving}
              />
              <TextField
                fullWidth
                type="password"
                label="รหัสผ่านใหม่"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                disabled={saving}
                helperText="รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
              />
              <TextField
                fullWidth
                type="password"
                label="ยืนยันรหัสผ่านใหม่"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                disabled={saving}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setChangePasswordOpen(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setPasswordError(null);
              }}
              disabled={saving}
              startIcon={<CancelIcon />}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Dialog */}
        <Dialog
          open={successDialogOpen}
          onClose={() => setSuccessDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <Box sx={{ textAlign: "center", pt: 4, pb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "#4caf50",
                  width: 64,
                  height: 64,
                }}
              >
                <SaveIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              บันทึกข้อมูลสำเร็จ
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ px: 3 }}>
              ข้อมูลส่วนตัวของคุณได้รับการอัพเดทเรียบร้อยแล้ว
            </Typography>
          </Box>
          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              onClick={() => setSuccessDialogOpen(false)}
              variant="contained"
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                minWidth: 120,
              }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
}
