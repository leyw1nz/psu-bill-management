// components/PaymentDialog.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

export type BillKind = "ELECT" | "WATER";

type PaymentDialogProps = {
  open: boolean;
  onClose: (didUpload?: boolean) => void;

  billId: number;
  billKind: BillKind;
  monthLabel: string;
  billType: string;
  amount: number;
};

const UPLOAD_API = "/api/bills/shop/upload-slip";
const ALLOWED = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function PaymentDialog({
  open,
  onClose,
  billId,
  billKind,
  monthLabel,
  billType,
  amount,
}: PaymentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [snack, setSnack] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return setFile(null);

    if (!ALLOWED.includes(f.type)) {
      setFile(null);
      setSnack({
        open: true,
        severity: "error",
        message: "รองรับเฉพาะ JPG/PNG",
      });
      return;
    }
    if (f.size > MAX_SIZE) {
      setFile(null);
      setSnack({
        open: true,
        severity: "error",
        message: "ไฟล์ต้องไม่เกิน 5MB",
      });
      return;
    }

    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      setSnack({
        open: true,
        severity: "error",
        message: "กรุณาเลือกไฟล์สลิปก่อน",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
        reader.readAsDataURL(file);
      });

      const res = await fetch(UPLOAD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bill_id: String(billId),
          bill_kind: billKind,
          slip_base64: base64,
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          `อัปโหลดไม่สำเร็จ (HTTP ${res.status})${raw ? ` : ${raw}` : ""}`;
        throw new Error(msg);
      }

      setSnack({
        open: true,
        severity: "success",
        message: data?.message || "แจ้งชำระสำเร็จ (รอตรวจสอบ)",
      });

      onClose(true);
    } catch (err: any) {
      console.error("Upload Error:", err);
      setSnack({
        open: true,
        severity: "error",
        message: err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => !submitting && onClose(false)}
        fullWidth
        maxWidth="xs"
        keepMounted
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: "center" }}>
          แจ้งชำระเงิน
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography>ประจำเดือน: {monthLabel}</Typography>
            <Typography>ประเภท: {billType}</Typography>
            <Typography>
              ยอดชำระ: {amount.toLocaleString("th-TH")} บาท
            </Typography>
          </Box>

          <Box
            sx={{
              border: "1px solid #ddd",
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <Button
              component="label"
              disabled={submitting}
              sx={{
                textTransform: "none",
                borderRadius: 0,
                bgcolor: "#f0f0f0",
              }}
            >
              เลือกไฟล์
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFile}
              />
            </Button>

            <Box
              sx={{
                flex: 1,
                px: 1.5,
                py: 1,
                fontSize: 14,
                color: "#555",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file ? file.name : "ยังไม่ได้เลือกไฟล์"}
            </Box>
          </Box>

          <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.5 }}>
            รองรับ JPG/PNG ขนาดไม่เกิน 5MB
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button
            onClick={() => onClose(false)}
            disabled={submitting}
            sx={{ textTransform: "none", color: "#666" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!file || submitting}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
