"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useMemo } from "react";
import generatePayload from "promptpay-qr";

export interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  billType: "electric" | "water";
  amount: number;
  accountNo: string;
  shopNo?: string;
  month?: string;
  year?: string;
}

export default function QRCodeDialog({
  open,
  onClose,
  billType,
  amount,
  accountNo,
  shopNo,
  month,
  year,
}: QRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Format bill type display
  const billTypeDisplay = billType === "electric" ? "ค่าไฟฟ้า" : "ค่าน้ำประปา";
  const billTypeIcon = billType === "electric" ? "⚡" : "💧";

  // Determine account type
  const accountType = useMemo(() => {
    // If original account number contains dash or space, treat as bank account (not PromptPay)
    const hasDashOrSpace = /[-\s]/.test(accountNo);

    const cleanAccountNo = accountNo.replace(/[-\s]/g, "");
    const is10Digit = !hasDashOrSpace && cleanAccountNo.length === 10 && /^\d+$/.test(cleanAccountNo);
    const is13Digit = !hasDashOrSpace && cleanAccountNo.length === 13 && /^\d+$/.test(cleanAccountNo);

    if (is10Digit) return "promptpay-mobile";
    if (is13Digit) return "promptpay-id";
    return "bank-account";
  }, [accountNo]);

  // Generate QR code data for payment
  // Supports both PromptPay and Bill Payment formats
  const qrData = useMemo(() => {
    try {
      // If original account number contains dash or space, treat as bank account (not PromptPay)
      const hasDashOrSpace = /[-\s]/.test(accountNo);

      // Clean account number (remove dashes, spaces)
      const cleanAccountNo = accountNo.replace(/[-\s]/g, "");

      // Check if it's a PromptPay-compatible format (only if no dashes/spaces in original)
      const is10Digit = !hasDashOrSpace && cleanAccountNo.length === 10 && /^\d+$/.test(cleanAccountNo);
      const is13Digit = !hasDashOrSpace && cleanAccountNo.length === 13 && /^\d+$/.test(cleanAccountNo);

      if (is10Digit || is13Digit) {
        // Mobile number (10 digits) or National ID (13 digits) - use PromptPay
        return generatePayload(cleanAccountNo, { amount });
      } else {
        // Bank account number - use custom format for display
        // Format: ACCOUNT|AMOUNT|BILLTYPE|SHOP|PERIOD
        // This can be customized based on your banking integration needs
        const billInfo = `${billType.toUpperCase()}|${shopNo || "N/A"}|${month}/${year}`;
        return `BANK:${cleanAccountNo}|AMT:${amount.toFixed(2)}|REF:${billInfo}`;
      }
    } catch (error) {
      console.error("Error generating payment QR:", error);
      // Fallback to simple format
      return `${billType.toUpperCase()}|${accountNo}|${amount.toFixed(2)}|${shopNo || "N/A"}|${month || ""}/${year || ""}`;
    }
  }, [accountNo, amount, billType, shopNo, month, year]);

  // Handle download QR code
  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      // Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qr-${billType}-${shopNo || "shop"}-${month}_${year}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {billTypeIcon} QR Code ชำระเงิน
          </Typography>
          <Box
            sx={{
              bgcolor: accountType === "bank-account" ? "#ea580c" : "#1e3a8a",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {accountType === "bank-account" ? "Bank Transfer" : "PromptPay"}
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3} alignItems="center">
          {/* Bill Information */}
          <Box
            sx={{
              width: "100%",
              p: 2,
              bgcolor: "#f5f7fa",
              borderRadius: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  ประเภทค่าบริการ:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {billTypeDisplay}
                </Typography>
              </Stack>

              {shopNo && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    รหัสร้านค้า:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {shopNo}
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  เลขที่บัญชี:
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {accountNo}
                </Typography>
              </Stack>

              {month && year && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    งวดที่:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {month}/{year}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.5 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={600}>
                  จำนวนเงิน:
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: billType === "electric" ? "#ff9800" : "#2196f3",
                  }}
                >
                  ฿{amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* QR Code */}
          <Box
            ref={qrRef}
            sx={{
              p: 3,
              bgcolor: "white",
              borderRadius: 2,
              border: "2px solid #e0e0e0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <QRCodeSVG
              value={qrData}
              size={220}
              level="H"
              includeMargin={true}
              fgColor={billType === "electric" ? "#ff6f00" : "#1976d2"}
            />
          </Box>

          {/* Instructions */}
          <Box
            sx={{
              width: "100%",
              p: 2,
              bgcolor: accountType === "bank-account" ? "#fff7ed" : "#e3f2fd",
              borderRadius: 2,
              border: accountType === "bank-account" ? "1px solid #fed7aa" : "1px solid #90caf9",
            }}
          >
            <Typography
              variant="body2"
              color={accountType === "bank-account" ? "#c2410c" : "primary"}
              fontWeight={600}
              sx={{ mb: 1 }}
            >
              {accountType === "bank-account"
                ? "วิธีการชำระเงิน:"
                : "วิธีการชำระเงินผ่าน PromptPay:"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {accountType === "bank-account" ? (
                <>
                  1. สแกน QR Code นี้เพื่อดูข้อมูลการชำระเงิน
                  <br />
                  2. โอนเงินไปยังเลขบัญชี: <strong>{accountNo}</strong>
                  <br />
                  3. จำนวนเงิน: <strong>฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong>
                  <br />
                  4. ระบุหมายเหตุ: {billTypeDisplay} {shopNo && `ร้าน ${shopNo}`} {month}/{year}
                  <br />
                  5. อัพโหลดสลิปการชำระเงินในระบบ
                </>
              ) : (
                <>
                  1. สแกน QR Code ด้วยแอปพลิเคชันธนาคารของคุณ
                  <br />
                  2. ระบบจะกรอกเลขบัญชีและจำนวนเงินให้อัตโนมัติ
                  <br />
                  3. ตรวจสอบข้อมูลให้ถูกต้อง
                  <br />
                  4. ยืนยันการชำระเงิน
                  <br />
                  5. อัพโหลดสลิปการชำระเงินในระบบ
                </>
              )}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadQR}
          sx={{
            borderColor: "#1976d2",
            color: "#1976d2",
            "&:hover": {
              borderColor: "#1565c0",
              bgcolor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          ดาวน์โหลด QR Code
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}
