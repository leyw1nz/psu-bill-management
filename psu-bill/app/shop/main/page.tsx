// app/shop/main/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import MainLayout from "@/components/MainLayout";
import MessageDialog from "@/components/MessageDialog";
import PaymentDialog from "@/components/PaymentDialog";
import QRCodeDialog from "@/components/QRCodeDialog";

import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Card,
  CardContent,
  Button,
  Stack,
  Breadcrumbs,
  Collapse,
  Divider,
  Chip,
  Alert,
  AlertTitle,
} from "@mui/material";

import {
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  PendingActions as PendingActionsIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  NotificationsActive as NotificationsActiveIcon,
  QrCode as QrCodeIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import type {
  Shop,
  ShopBill,
  BillKind,
  BillStatus,
  BillTypeUI,
  PaymentDialogPayload,
  AppDialogState,
} from "@/types";

import { formatThaiDate, parseNumber, parseInt as parseIntSafe } from "@/lib/utils";
import { ShopBillService } from "@/lib/services/shopBillService";

// pay_status_id: 1=รอชำระ, 2=รอตรวจสอบ, 3=ชำระแล้ว, 4=ค้างชำระ
function toStatus(id?: number | null): BillStatus {
  if (id === 3) return "paid";
  if (id === 2) return "pending";
  return "unpaid";
}

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bill, setBill] = useState<ShopBill | null>(null);
  const [unpaidBills, setUnpaidBills] = useState<ShopBill[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [expandedUnpaid, setExpandedUnpaid] = useState(false);

  const [openPayment, setOpenPayment] = useState(false);
  const [dialogPayload, setDialogPayload] = useState<PaymentDialogPayload | null>(null);

  // QR Code Dialog State
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState<{
    billType: "electric" | "water";
    amount: number;
    accountNo: string;
    shopNo?: string;
    month?: string;
    year?: string;
  } | null>(null);

  const [appDialog, setAppDialog] = useState<AppDialogState>({
    open: false,
    severity: "info",
    title: "",
    message: "",
  });

  const detailsRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const now = new Date();
  const currentYear = (now.getFullYear() + 543).toString();
  const currentMonth = (now.getMonth() + 1).toString();
  const currentMonthDisplay = formatThaiDate(currentYear, currentMonth);

  const displayMonth = bill
    ? formatThaiDate(bill.year, bill.month)
    : currentMonthDisplay;

  const openAppDialog = (next: Omit<AppDialogState, "open">) =>
    setAppDialog({ open: true, ...next });

  const closeAppDialog = () => setAppDialog((p) => ({ ...p, open: false }));

  const scrollToDetails = () => {
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const isCurrentBillMonth = (y?: string | number | null, m?: string | number | null) => {
    if (y == null || m == null) return false;
    return (
      parseIntSafe(String(y)) === parseIntSafe(currentYear) &&
      parseIntSafe(String(m)) === parseIntSafe(currentMonth)
    );
  };

  const isCurrentMonth = !selectedYear || isCurrentBillMonth(selectedYear, selectedMonth);

  const isListStatus = (id?: number | null) => id === 1 || id === 2 || id === 4;
  const isPaidStatus = (id?: number | null) => id === 3;

  const isBillFullyPaid = (b: ShopBill) =>
    isPaidStatus(b.elect_pay_status_id) && isPaidStatus(b.water_pay_status_id);

  const hasBillListStatus = (b: ShopBill) =>
    isListStatus(b.elect_pay_status_id) || isListStatus(b.water_pay_status_id);

  const labelByStatus = (id?: number | null) => {
    if (id === 1) return "รอชำระ";
    if (id === 2) return "รอตรวจ";
    if (id === 4) return "ค้าง";
    return "";
  };

  const chipSxElectric = (id?: number | null) => {
    if (id === 2)
      return {
        bgcolor: "#fef9c3",
        color: "#854d0e",
        border: "1px solid #fde68a",
      };
    return {
      bgcolor: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #ffedd5",
    };
  };

  const chipSxWater = (id?: number | null) => {
    if (id === 2)
      return {
        bgcolor: "#dbeafe",
        color: "#1e40af",
        border: "1px solid #bfdbfe",
      };
    return {
      bgcolor: "#eff6ff",
      color: "#2563eb",
      border: "1px solid #dbeafe",
    };
  };

  const reloadAll = async (targetShopId: number, year: string, month: string) => {
    const latestRes = await ShopBillService.getLatest(targetShopId, year, month);
    if (latestRes.success) {
      setShop(latestRes.data.shop);
      setBill(latestRes.data.latestBill);
    }

    const unpaidRes = await ShopBillService.getUnpaid(targetShopId);
    setUnpaidBills(unpaidRes.success ? unpaidRes.data ?? [] : []);
  };

  const handleOpenPayment = (bt: BillTypeUI, status: BillStatus) => {
    if (!bill) return;
    if (status !== "unpaid") return;

    const monthLabel = formatThaiDate(String(bill.year), String(bill.month));
    const amount = bt === "water" ? parseNumber(bill.water_amount) : parseNumber(bill.elect_amount);

    const billKind: BillKind = bt === "water" ? "WATER" : "ELECT";
    const billType = bt === "water" ? "ค่าน้ำประปา" : "กระแสไฟฟ้า";

    setDialogPayload({
      billId: Number(bill.bill_id),
      billKind,
      monthLabel,
      billType,
      amount,
    });

    setOpenPayment(true);
  };

  const handleClosePayment = async (didUpload?: boolean) => {
    setOpenPayment(false);

    if (didUpload && shopId) {
      const y = selectedYear ?? currentYear;
      const m = selectedMonth ?? currentMonth;
      await reloadAll(shopId, String(y), String(m));
    }

    setTimeout(() => setDialogPayload(null), 300);
  };

  const handleShowQRCode = (billType: "electric" | "water") => {
    if (!bill || !shop) return;

    const amount = billType === "electric" ? parseNumber(bill.elect_amount) : parseNumber(bill.water_amount);

    let accountNo = billType === "electric"
      ? shop.elect_account_no || "N/A"
      : shop.water_account_no || "N/A";

    const cleanedNo = accountNo.replace(/[-\s]/g, "");
    if (cleanedNo.length === 10 || cleanedNo.length === 13) {
      accountNo = accountNo.includes("-") ? accountNo : `${accountNo}-`;
    }

    setQrPayload({
      billType,
      amount,
      accountNo,
      shopNo: shop.shop_no || undefined,
      month: String(bill.month),
      year: String(bill.year),
    });
    setQrDialogOpen(true);
  };

  const handleCloseQRDialog = () => {
    setQrDialogOpen(false);
    setTimeout(() => setQrPayload(null), 300);
  };

  const handleSelectBill = async (picked: ShopBill) => {
    if (!shopId) return;

    const y = String(picked.year);
    const m = String(picked.month);

    setSelectedYear(y);
    setSelectedMonth(m);

    await reloadAll(shopId, y, m);
    scrollToDetails();
  };

  const handleBackToCurrentMonth = async () => {
    if (!shopId) return;
    setSelectedYear(null);
    setSelectedMonth(null);
    await reloadAll(shopId, currentYear, currentMonth);
    scrollToDetails();
  };

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push("/");
          return;
        }

        const selectedShopId = localStorage.getItem("selectedShopId");
        if (!selectedShopId) {
          setLoading(false);
          openAppDialog({
            severity: "warning",
            title: "ไม่พบข้อมูลร้านค้า",
            message: "กรุณาเลือกร้านค้าจากหน้าหลัก",
          });
          return;
        }

        const sId = Number(selectedShopId);
        setShopId(sId);

        const userMemberId = localStorage.getItem("member_id");

        // ดึงข้อมูลเดือนปัจจุบัน (ไม่ fallback อัตโนมัติ)
        const targetYear = currentYear;
        const targetMonth = currentMonth;
        const latestRes = await ShopBillService.getLatest(sId, targetYear, targetMonth);

        if (!latestRes.success) {
          setLoading(false);
          openAppDialog({
            severity: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: latestRes.message || latestRes.error || "ไม่สามารถโหลดข้อมูลร้านค้าได้",
          });
          return;
        }

        if (userMemberId && String(latestRes.data.shop.member_id) !== String(userMemberId)) {
          setLoading(false);
          openAppDialog({
            severity: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลร้านค้านี้",
          });
          return;
        }

        setShop(latestRes.data.shop);
        setBill(latestRes.data.latestBill ?? null);

        const unpaidRes = await ShopBillService.getUnpaid(sId);
        setUnpaidBills(unpaidRes.success ? unpaidRes.data ?? [] : []);

        setLoading(false);

      } catch (e) {
        console.error(e);
        setLoading(false);
        openAppDialog({
          severity: "error",
          title: "เกิดข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        });
      }
    };

    load();
  }, [router, currentYear, currentMonth]);

  const unresolvedBillsUI = useMemo(() => {
    const base = (unpaidBills ?? [])
      .filter((b) => !isBillFullyPaid(b) && hasBillListStatus(b))
      .sort((a, b) => {
        const valA = (Number(a.year) || 0) * 100 + (Number(a.month) || 0);
        const valB = (Number(b.year) || 0) * 100 + (Number(b.month) || 0);
        return valB - valA;
      });

    if (bill && !isBillFullyPaid(bill) && hasBillListStatus(bill)) {
      const exists = base.some((x) => x.bill_id === bill.bill_id);
      if (!exists) base.unshift(bill);
    }

    return base;
  }, [unpaidBills, bill]);

  const totalUnresolvedAmountUI = useMemo(() => {
    return unresolvedBillsUI.reduce((total, b) => {
      let sum = 0;
      if (isListStatus(b.elect_pay_status_id)) sum += parseNumber(b.elect_amount);
      if (isListStatus(b.water_pay_status_id)) sum += parseNumber(b.water_amount);
      return total + sum;
    }, 0);
  }, [unresolvedBillsUI]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // กันกรณี shop ไม่โหลด
  if (!shop) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Button variant="contained" onClick={() => router.push("/main")} sx={{ textTransform: "none" }}>
            กลับหน้าหลัก
          </Button>
        </Container>

        <MessageDialog
          open={appDialog.open}
          severity={appDialog.severity}
          title={appDialog.title}
          message={appDialog.message}
          onClose={closeAppDialog}
          primaryText="กลับหน้าหลัก"
          onPrimary={() => router.push("/main")}
        />
      </MainLayout>
    );
  }

  // กรณีมี shop แต่ไม่มี bill (บิลเดือนปัจจุบันยังไม่ออก)
  if (!bill) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 2 }}>
          {/* Breadcrumbs */}
          <Box>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
              aria-label="breadcrumb"
              className="breadcrumb-card"
            >
              <Box
                onClick={() => router.push('/main')}
                className="breadcrumb-link"
              >
                <HomeIcon className="breadcrumb-icon" />
                <Typography className="breadcrumb-text">
                  หน้าหลัก
                </Typography>
              </Box>
              <Typography className="breadcrumb-current">
                ร้านเลขที่ {shop.shop_no} ({shop.location})
              </Typography>
            </Breadcrumbs>
          </Box>

          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 3,
              border: "1px solid #60a5fa",
              "& .MuiAlert-icon": {
                fontSize: 28
              }
            }}
          >
            <AlertTitle sx={{ fontWeight: "bold", fontSize: 18 }}>
              ยังไม่มีบิลของเดือน {currentMonthDisplay}
            </AlertTitle>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ขณะนี้ยังไม่มีข้อมูลบิลค่าน้ำ-ค่าไฟสำหรับเดือนนี้
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • บิลจะถูกออกโดยเจ้าหน้าที่หลังจากทำการบันทึกมิเตอร์<br />
              • คุณสามารถดูประวัติบิลย้อนหลังได้จากหน้า "ดูประวัติย้อนหลัง"<br />
              • หากมีคำถามกรุณาติดต่อเจ้าหน้าที่
            </Typography>
          </Alert>

          {/* Month/Year and Print Bill section (disabled when no bill) */}
          <Paper
            elevation={1}
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(88,81,81,0.2)",
              p: { xs: 2, sm: 2.5 },
              mb: 3,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, opacity: 0.8 }}>
                  ประจำเดือน
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                  {currentMonthDisplay}
                </Typography>
              </Box>

              <Box textAlign="center">
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  disabled
                  sx={{
                    bgcolor: "#cccccc",
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: 14,
                    px: 3,
                    py: 1,
                    mr: 1,
                    color: "#666666",
                    "&:hover": { bgcolor: "#cccccc" },
                  }}
                >
                  พิมพ์ใบแจ้งหนี้
                </Button>

                <Button
                  variant="contained"
                  startIcon={<HistoryIcon />}
                  onClick={() => router.push("/shop/history")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: 14,
                    px: 3,
                    py: 1,
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  ดูประวัติย้อนหลัง
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Container>

        <MessageDialog
          open={appDialog.open}
          severity={appDialog.severity}
          title={appDialog.title}
          message={appDialog.message}
          onClose={closeAppDialog}
        />
      </MainLayout>
    );
  }

  const electPrevious = parseIntSafe(bill.elect_unit_previous);
  const electCurrent = parseIntSafe(bill.elect_unit_current);
  const electDiff = parseIntSafe(bill.elect_unit_diff) || 0;
  const electAmount = parseNumber(bill.elect_amount);

  const waterPrevious = parseIntSafe(bill.water_unit_previous);
  const waterCurrent = parseIntSafe(bill.water_unit_current);
  const waterDiff = parseIntSafe(bill.water_unit_diff) || 0;
  const waterAmount = parseNumber(bill.water_amount);

  const electStatus = toStatus(bill.elect_pay_status_id);
  const waterStatus = toStatus(bill.water_pay_status_id);

  const renderUnpaidItem = (b: ShopBill) => {
    const billMonth = formatThaiDate(String(b.year), String(b.month));

    const electShow = isListStatus(b.elect_pay_status_id);
    const waterShow = isListStatus(b.water_pay_status_id);

    const billAmount =
      (electShow ? parseNumber(b.elect_amount) : 0) + (waterShow ? parseNumber(b.water_amount) : 0);

    const isSelected = bill.bill_id === b.bill_id;

    return (
      <Paper
        key={b.bill_id}
        elevation={0}
        onClick={() => handleSelectBill(b)}
        sx={{
          bgcolor: isSelected ? "#fff1f2" : "rgba(255,255,255,0.75)",
          borderRadius: 3,
          p: 2,
          border: isSelected ? "1.5px solid #fb7185" : "1px solid rgba(244, 63, 94, 0.15)",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: "#fff1f2",
            borderColor: "#fda4af",
            transform: "translateY(-2px)",
            boxShadow: "0 6px 18px rgba(220, 38, 38, 0.10)",
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                bgcolor: "#fee2e2",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
              }}
            >
              <NotificationsActiveIcon fontSize="small" />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{billMonth}</Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
                {electShow && (
                  <Chip
                    icon={<FlashOnIcon sx={{ fontSize: 14 }} />}
                    label={`ไฟ: ${labelByStatus(b.elect_pay_status_id)}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      ...chipSxElectric(b.elect_pay_status_id),
                    }}
                  />
                )}
                {waterShow && (
                  <Chip
                    icon={<WaterIcon sx={{ fontSize: 14 }} />}
                    label={`น้ำ: ${labelByStatus(b.water_pay_status_id)}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      ...chipSxWater(b.water_pay_status_id),
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#dc2626" }}>
            {billAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </Typography>
        </Stack>
      </Paper>
    );
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          {/* Breadcrumbs */}
          <Box>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
              aria-label="breadcrumb"
              className="breadcrumb-card"
            >
              <Box
                onClick={() => router.push('/main')}
                className="breadcrumb-link"
              >
                <HomeIcon className="breadcrumb-icon" />
                <Typography className="breadcrumb-text">
                  หน้าหลัก
                </Typography>
              </Box>
              <Typography className="breadcrumb-current">
                ร้านเลขที่ {shop.shop_no} ({shop.location})
              </Typography>
            </Breadcrumbs>
          </Box>
          {unresolvedBillsUI.length > 0 && (
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                border: "1px solid rgba(244, 63, 94, 0.18)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  bgcolor: "rgba(244, 63, 94, 0.08)",
                  zIndex: 0,
                }}
              />
              <CardContent sx={{ p: { xs: 2.5, sm: 3 }, position: "relative", zIndex: 1 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: "#dc2626",
                        borderRadius: 2,
                        width: 46,
                        height: 46,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 20px rgba(220,38,38,0.25)",
                      }}
                    >
                      <PendingActionsIcon sx={{ color: "white", fontSize: 26 }} />
                    </Box>
                    <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#b91c1c", lineHeight: 1.1 }}>
                      รายการค้างชำระ
                    </Typography>
                  </Stack>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#b91c1c" }}>ยอดรวมทั้งหมด</Typography>
                    <Typography sx={{ fontSize: 21.5, fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>
                      {totalUnresolvedAmountUI.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2.2, borderColor: "rgba(244,63,94,0.18)" }} />

                <Stack spacing={1.6}>
                  {unresolvedBillsUI.slice(0, 3).map(renderUnpaidItem)}
                  <Collapse in={expandedUnpaid} timeout="auto" unmountOnExit>
                    <Stack spacing={1.6} sx={{ mt: 1.6 }}>
                      {unresolvedBillsUI.slice(3).map(renderUnpaidItem)}
                    </Stack>
                  </Collapse>
                </Stack>

                {unresolvedBillsUI.length > 3 && (
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                    <Button
                      onClick={() => setExpandedUnpaid(!expandedUnpaid)}
                      endIcon={expandedUnpaid ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      size="small"
                      sx={{
                        color: "#b91c1c",
                        bgcolor: "rgba(255,255,255,0.65)",
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 800,
                        "&:hover": { bgcolor: "#fff", color: "#dc2626" },
                      }}
                    >
                      {expandedUnpaid ? "ย่อรายการ" : `ดูอีก ${unresolvedBillsUI.length - 3} รายการ`}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* ✅ จุดที่อยากเลื่อนมาหา */}
          <Box ref={detailsRef} />

          {/* เดือน + ปุ่ม */}
          <Paper
            elevation={1}
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(88,81,81,0.2)",
              p: { xs: 2, sm: 2.5 },
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 500, opacity: 0.8 }}>ประจำเดือน</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 500 }}>{displayMonth}</Typography>
              </Box>

              <Box textAlign={"center"}>
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => {
                    localStorage.setItem("invoiceType", "shop");
                    localStorage.setItem("selectedBillId", String(bill.bill_id));
                    localStorage.setItem("selectedBillYear", String(bill.year));
                    localStorage.setItem("selectedBillMonth", String(bill.month));
                    router.push("/invoice");
                  }}
                  sx={{
                    bgcolor: "#07bb3a",
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: 14,
                    px: 3,
                    py: 1,
                    mr: 1,
                    "&:hover": { bgcolor: "#089430" },
                  }}
                >
                  พิมพ์ใบแจ้งหนี้
                </Button>

                <Button
                  variant="contained"
                  startIcon={<HistoryIcon />}
                  onClick={() => router.push("/shop/history")}
                  sx={{
                    bgcolor: "#1e76e3",
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: 14,
                    px: 3,
                    py: 1,
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  ดูประวัติย้อนหลัง
                </Button>
              </Box>
            </Stack>

            {!isCurrentMonth && (
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToCurrentMonth}
                  fullWidth
                  sx={{
                    borderColor: "#1e76e3",
                    color: "#1e76e3",
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: 14,
                    py: 1,
                    mt: 1,
                  }}
                >
                  กลับไปเดือนปัจจุบัน ({currentMonthDisplay})
                </Button>
              </Box>
            )}
          </Paper>

          {/* ค่าไฟ */}
          <Card elevation={2} sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FlashOnIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 600 }}>
                    กระแสไฟฟ้า
                  </Typography>
                </Stack>

                {electStatus === "unpaid" && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => handleShowQRCode("electric")}
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      sx={{
                        borderColor: "#f59e0b",
                        color: "#f59e0b",
                        borderRadius: 50,
                        textTransform: "none",
                        fontSize: 13, // ✅ ปรับขนาดเล็กลง
                        px: 2,        // ✅ ปรับแคบลง
                        py: 0.3,
                        "&:hover": {
                          borderColor: "#d97706",
                          bgcolor: "rgba(245, 158, 11, 0.04)",
                        },
                      }}
                    >
                      QR Code
                    </Button>
                    <Button
                      onClick={() => handleOpenPayment("electric", electStatus)}
                      sx={{
                        bgcolor: "#A73032",
                        borderRadius: 50,
                        textTransform: "none",
                        fontSize: 14, // ✅ ปรับขนาดเล็กลง
                        px: 3,        // ✅ ปรับแคบลง
                        py: 0.3,
                        color: "#fff",
                        "&:hover": { bgcolor: "#8a2628" },
                      }}
                    >
                      แจ้งชำระ
                    </Button>
                  </Stack>
                )}
                {electStatus === "pending" && (
                  <Box
                    sx={{
                      borderRadius: 50,
                      px: 3,
                      py: 0.7,
                      bgcolor: "rgba(234,179,8,0.12)",
                      border: "1px solid rgba(234,179,8,0.7)",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}>
                      รอตรวจสอบ
                    </Typography>
                  </Box>
                )}
                {electStatus === "paid" && (
                  <Box
                    sx={{
                      borderRadius: 50,
                      px: 3,
                      py: 0.7,
                      bgcolor: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.8)",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
                      ชำระแล้ว
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: { xs: 2, sm: 3 }, mb: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    หน่วยมิเตอร์ก่อน
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#2a2929" }}>
                    {electPrevious.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    หน่วยมิเตอร์หลัง
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#2a2929" }}>
                    {electCurrent.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mt: 3 }}>
                <Paper
                  elevation={0}
                  sx={{ bgcolor: "#eeeeee", borderRadius: 3, p: 1.5, display: "flex", justifyContent: "space-between" }}
                >
                  <Typography>ผลต่าง</Typography>
                  <Typography fontWeight={700}>{electDiff.toLocaleString()} หน่วย</Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{ bgcolor: "#eeeeee", borderRadius: 3, p: 1.5, display: "flex", justifyContent: "space-between" }}
                >
                  <Typography>จำนวนเงิน</Typography>
                  <Typography fontWeight={700}>
                    {electAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {/* ค่าน้ำ */}
          <Card elevation={2} sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WaterIcon sx={{ color: "#3b82f6", fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 600 }}>
                    ค่าน้ำประปา
                  </Typography>
                </Stack>

                {waterStatus === "unpaid" && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => handleShowQRCode("water")}
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      sx={{
                        borderColor: "#3b82f6",
                        color: "#3b82f6",
                        borderRadius: 50,
                        textTransform: "none",
                        fontSize: 13, // ✅ ปรับขนาดเล็กลง
                        px: 2,        // ✅ ปรับแคบลง
                        py: 0.3,
                        "&:hover": {
                          borderColor: "#2563eb",
                          bgcolor: "rgba(59, 130, 246, 0.04)",
                        },
                      }}
                    >
                      QR Code
                    </Button>
                    <Button
                      onClick={() => handleOpenPayment("water", waterStatus)}
                      sx={{
                        bgcolor: "#A73032",
                        borderRadius: 50,
                        textTransform: "none",
                        fontSize: 14, // ✅ ปรับขนาดเล็กลง
                        px: 3,        // ✅ ปรับแคบลง
                        py: 0.3,
                        color: "#fff",
                        "&:hover": { bgcolor: "#8a2628" },
                      }}
                    >
                      แจ้งชำระ
                    </Button>
                  </Stack>
                )}
                {waterStatus === "pending" && (
                  <Box
                    sx={{
                      borderRadius: 50,
                      px: 3,
                      py: 0.7,
                      bgcolor: "rgba(234,179,8,0.12)",
                      border: "1px solid rgba(234,179,8,0.7)",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}>
                      รอตรวจสอบ
                    </Typography>
                  </Box>
                )}
                {waterStatus === "paid" && (
                  <Box
                    sx={{
                      borderRadius: 50,
                      px: 3,
                      py: 0.7,
                      bgcolor: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.8)",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
                      ชำระแล้ว
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: { xs: 2, sm: 3 }, mb: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    หน่วยมิเตอร์ก่อน
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#2a2929" }}>
                    {waterPrevious.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    หน่วยมิเตอร์หลัง
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#2a2929" }}>
                    {waterCurrent.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mt: 3 }}>
                <Paper
                  elevation={0}
                  sx={{ bgcolor: "#eeeeee", borderRadius: 3, p: 1.5, display: "flex", justifyContent: "space-between" }}
                >
                  <Typography>ผลต่าง</Typography>
                  <Typography fontWeight={700}>{waterDiff.toLocaleString()} หน่วย</Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{ bgcolor: "#eeeeee", borderRadius: 3, p: 1.5, display: "flex", justifyContent: "space-between" }}
                >
                  <Typography>จำนวนเงิน</Typography>
                  <Typography fontWeight={700}>
                    {waterAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {dialogPayload && (
        <PaymentDialog
          open={openPayment}
          onClose={handleClosePayment}
          billId={dialogPayload.billId}
          billKind={dialogPayload.billKind}
          monthLabel={dialogPayload.monthLabel}
          billType={dialogPayload.billType}
          amount={dialogPayload.amount}
        />
      )}

      {qrPayload && (
        <QRCodeDialog
          open={qrDialogOpen}
          onClose={handleCloseQRDialog}
          billType={qrPayload.billType}
          amount={qrPayload.amount}
          accountNo={qrPayload.accountNo}
          shopNo={qrPayload.shopNo}
          month={qrPayload.month}
          year={qrPayload.year}
        />
      )}

      <MessageDialog
        open={appDialog.open}
        severity={appDialog.severity}
        title={appDialog.title}
        message={appDialog.message}
        onClose={closeAppDialog}
        primaryText="ตกลง"
      />
    </MainLayout>
  );
}
