"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
  Alert,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Print as PrintIcon,
  PendingActions as PendingActionsIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import MainLayout from "@/components/MainLayout";
import { Shop, ShopBill } from "@/types";
import {
  formatThaiDate,
  parseNumber,
  parseInt as parseIntSafe,
} from "@/lib/utils";
import PaymentDialog, { BillKind } from "@/components/PaymentDialog";

type BillStatus = "unpaid" | "pending" | "paid";
type BillTypeUI = "electric" | "water";

function toStatus(id?: number | null): BillStatus {
  // pay_status_id: 1=รอชำระ, 2=รอตรวจสอบ, 3=ชำระแล้ว, 4=ค้างชำระ
  if (id === 3) return "paid";
  if (id === 2) return "pending";
  return "unpaid";
}

export default function Payment() {
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bill, setBill] = useState<ShopBill | null>(null);
  const [unpaidBills, setUnpaidBills] = useState<ShopBill[]>([]);
  const [error, setError] = useState("");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [shopId, setShopId] = useState<number | null>(null);

  const [openPayment, setOpenPayment] = useState(false);
  const [dialogPayload, setDialogPayload] = useState<{
    billId: number; // ✅ bill_id ของบิลรายเดือน
    billKind: BillKind;
    monthLabel: string;
    billType: string;
    amount: number;
  } | null>(null);

  const router = useRouter();

  const now = new Date();
  const currentYear = (now.getFullYear() + 543).toString();
  const currentMonth = (now.getMonth() + 1).toString();

  const isCurrentMonth =
    !selectedYear ||
    (selectedYear === currentYear && selectedMonth === currentMonth);

  const currentMonthDisplay = formatThaiDate(currentYear, currentMonth);

  const reloadAll = async (
    targetShopId: number,
    year: string,
    month: string
  ) => {
    const billRes = await fetch(
      `/api/bills/shop/${targetShopId}?year=${year}&month=${month}`,
      {
        cache: "no-store",
      }
    );
    if (billRes.ok) {
      const billData = await billRes.json();
      if (billData.success) {
        setShop(billData.data.shop);
        setBill(billData.data.latestBill);
      }
    }

    try {
      const unpaidRes = await fetch(`/api/bills/shop/${targetShopId}/unpaid`, {
        cache: "no-store",
      });
      if (unpaidRes.ok) {
        const unpaidData = await unpaidRes.json();
        if (unpaidData.success && unpaidData.data)
          setUnpaidBills(unpaidData.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPayment = (bt: BillTypeUI, status: BillStatus) => {
    if (status !== "unpaid") return;
    if (!bill) return;

    const monthLabel = formatThaiDate(bill.year, bill.month);
    const amount =
      bt === "water"
        ? parseNumber(bill.water_amount)
        : parseNumber(bill.elect_amount);

    const billKind: BillKind = bt === "water" ? "WATER" : "ELECT";
    const billType = bt === "water" ? "ค่าน้ำประปา" : "กระแสไฟฟ้า";

    // ✅ สำคัญมาก: ต้องส่ง “bill_id (id ของบิลรายเดือน)”
    setDialogPayload({
      billId: Number(bill.bill_id),
      billKind,
      monthLabel,
      billType,
      amount,
    });

    setOpenPayment(true);
  };

  const handleClosePayment = (didUpload?: boolean) => {
    setOpenPayment(false);

    // ✅ อัปโหลดสำเร็จ -> reload แล้วสถานะจะเป็น pay_status_id=2
    if (didUpload && shopId) {
      const y = selectedYear ?? currentYear;
      const m = selectedMonth ?? currentMonth;
      void reloadAll(shopId, y, m);
    }

    // กัน unmount ทันที
    setTimeout(() => setDialogPayload(null), 450);
  };

  const handleSelectBill = async (u: ShopBill) => {
    if (!shopId) return;
    const year = String(u.year || '');
    const month = String(u.month || '');
    setSelectedYear(year);
    setSelectedMonth(month);
    await reloadAll(shopId, year, month);
  };

  const handleBackToCurrentMonth = async () => {
    if (!shopId) return;
    setSelectedYear(null);
    setSelectedMonth(null);
    await reloadAll(shopId, currentYear, currentMonth);
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
          setError("ไม่พบข้อมูลร้านค้า กรุณาเลือกร้านค้าจากหน้าหลัก");
          setLoading(false);
          return;
        }

        const sId = Number(selectedShopId);
        setShopId(sId);

        const userMemberId = localStorage.getItem("member_id");

        const billRes = await fetch(
          `/api/bills/shop/${sId}?year=${currentYear}&month=${currentMonth}`,
          {
            cache: "no-store",
          }
        );

        if (!billRes.ok) {
          setError("ไม่สามารถโหลดข้อมูลร้านค้าได้");
          setLoading(false);
          return;
        }

        const billData = await billRes.json();
        if (billData.success) {
          const shopData = billData.data.shop;

          if (userMemberId && shopData.member_id !== userMemberId) {
            setError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลร้านค้านี้");
            setLoading(false);
            return;
          }

          setShop(shopData);
          setBill(billData.data.latestBill);
        } else {
          setError(billData.error || "ไม่พบข้อมูลร้านค้า");
        }

        try {
          const unpaidRes = await fetch(`/api/bills/shop/${sId}/unpaid`, {
            cache: "no-store",
          });
          if (unpaidRes.ok) {
            const unpaidData = await unpaidRes.json();
            if (unpaidData.success && unpaidData.data)
              setUnpaidBills(unpaidData.data);
          }
        } catch {}

        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoading(false);
      }
    };

    load();
  }, [router, currentYear, currentMonth]);

  if (loading) {
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

  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </MainLayout>
    );
  }

  if (!shop || !bill) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Alert severity="warning">ไม่พบข้อมูลร้านค้า/บิล</Alert>
        </Container>
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

  const displayMonth = formatThaiDate(bill.year, bill.month);

  const electStatus = toStatus(bill.elect_pay_status_id);
  const waterStatus = toStatus(bill.water_pay_status_id);

  const totalUnpaidAmount = unpaidBills.reduce((total, b) => {
    let t = 0;
    if (b.elect_pay_status_id === 4) t += parseNumber(b.elect_amount);
    if (b.water_pay_status_id === 4) t += parseNumber(b.water_amount);
    return total + t;
  }, 0);

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Paper
          sx={{
            borderRadius: 1,
            bgcolor: "#f8f9fa",
            border: "1px solid #e3e6ea",
            p: 2,
            mb: 3,
          }}
        >
          <Breadcrumbs>
            <Link href={"/main"} style={{ textDecoration: "none" }}>
              <Typography color="#2fa4da">หน้าหลัก</Typography>
            </Link>
            <Typography color="dark">{`ร้านเลขที่ ${shop.shop_no}`}</Typography>
          </Breadcrumbs>
        </Paper>

        <Stack spacing={3}>
          {/* รายการค้างชำระ */}
          {unpaidBills.length > 0 ? (
            <Card
              elevation={2}
              sx={{
                borderRadius: 3,
                border: "1px solid #fecaca",
                bgcolor: "#fef2f2",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PendingActionsIcon
                        sx={{ color: "#dc2626", fontSize: 28 }}
                      />
                      <Typography
                        sx={{ fontSize: 18, fontWeight: 600, color: "#991b1b" }}
                      >
                        รายการค้างชำระ
                      </Typography>
                    </Stack>

                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#991b1b" }}
                    >
                      รวมค้างชำระ:{" "}
                      {totalUnpaidAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ฿
                    </Typography>
                  </Stack>

                  <Stack spacing={1.5}>
                    {unpaidBills.slice(0, 3).map((u) => {
                      const billMonth = formatThaiDate(u.year, u.month);
                      const hasUnpaidElect = u.elect_pay_status_id === 4;
                      const hasUnpaidWater = u.water_pay_status_id === 4;
                      const amt =
                        (hasUnpaidElect ? parseNumber(u.elect_amount) : 0) +
                        (hasUnpaidWater ? parseNumber(u.water_amount) : 0);

                      const isSelected = bill.bill_id === u.bill_id;

                      return (
                        <Paper
                          key={u.bill_id}
                          elevation={0}
                          onClick={() => handleSelectBill(u)}
                          sx={{
                            bgcolor: isSelected ? "#fef2f2" : "#fff",
                            borderRadius: 2,
                            p: 1.5,
                            border: isSelected
                              ? "2px solid #dc2626"
                              : "1px solid #fecaca",
                            cursor: "pointer",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                            >
                              <Box
                                sx={{
                                  bgcolor: "#fee2e2",
                                  borderRadius: 1.5,
                                  p: 1,
                                  display: "flex",
                                }}
                              >
                                <Stack direction="row" spacing={0.5}>
                                  {hasUnpaidElect && (
                                    <FlashOnIcon
                                      sx={{ color: "#dc2626", fontSize: 18 }}
                                    />
                                  )}
                                  {hasUnpaidWater && (
                                    <WaterIcon
                                      sx={{ color: "#dc2626", fontSize: 18 }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#1f2937",
                                  }}
                                >
                                  {billMonth}
                                </Typography>
                                <Typography
                                  sx={{ fontSize: 12, color: "#6b7280" }}
                                >
                                  {hasUnpaidElect && hasUnpaidWater
                                    ? "ค่าไฟ + ค่าน้ำ"
                                    : hasUnpaidElect
                                    ? "ค่าไฟฟ้า"
                                    : "ค่าน้ำประปา"}
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography
                              sx={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: "#dc2626",
                              }}
                            >
                              {amt.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              ฿
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Box />
          )}

          {/* ประจำเดือน + ปุ่ม */}
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
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography
                  sx={{ fontSize: 17, fontWeight: 500, opacity: 0.8 }}
                >
                  ประจำเดือน
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 500 }}>
                  {displayMonth}
                </Typography>
              </Box>

              <Box textAlign="center">
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => {
                    localStorage.setItem("invoiceType", "shop");
                    localStorage.setItem("selectedBillId", String(bill.bill_id));
                    localStorage.setItem("selectedBillYear", String(bill.year || ''));
                    localStorage.setItem("selectedBillMonth", String(bill.month || ''));
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
                  }}
                >
                  {currentMonthDisplay}
                </Button>
              </Box>
            )}
          </Paper>

          {/* การ์ดไฟฟ้า */}
          <Card
            elevation={2}
            sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FlashOnIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                  <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
                    กระแสไฟฟ้า
                  </Typography>
                </Stack>

                {electStatus === "unpaid" && (
                  <Typography
                    onClick={() => handleOpenPayment("electric", electStatus)}
                    sx={{
                      bgcolor: "#A73032",
                      borderRadius: 50,
                      fontSize: 16,
                      px: 5,
                      py: 1,
                      cursor: "pointer",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    แจ้งชำระ
                  </Typography>
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
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}
                    >
                      รอตรวจสอบการชำระ
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
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#166534" }}
                    >
                      ชำระแล้ว
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}
                  >
                    หน่วยมิเตอร์ก่อน
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700 }}>
                    {electPrevious.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    หน่วย
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}
                  >
                    หน่วยมิเตอร์หลัง
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700 }}>
                    {electCurrent.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    หน่วย
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 2,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#eeeeee",
                    borderRadius: 3,
                    p: 1.3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon sx={{ fontSize: 20, color: "#1e76e3" }} />
                    <Typography sx={{ fontSize: 16 }}>ผลต่าง</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {electDiff.toLocaleString()} หน่วย
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#eeeeee",
                    borderRadius: 3,
                    p: 1.3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoneyIcon sx={{ fontSize: 20, color: "#10b981" }} />
                    <Typography sx={{ fontSize: 16 }}>จำนวนเงิน</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {electAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {/* การ์ดน้ำ */}
          <Card
            elevation={2}
            sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WaterIcon sx={{ color: "#3b82f6", fontSize: 28 }} />
                  <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
                    ค่าน้ำประปา
                  </Typography>
                </Stack>

                {waterStatus === "unpaid" && (
                  <Typography
                    onClick={() => handleOpenPayment("water", waterStatus)}
                    sx={{
                      bgcolor: "#A73032",
                      borderRadius: 50,
                      fontSize: 16,
                      px: 5,
                      py: 1,
                      cursor: "pointer",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    แจ้งชำระ
                  </Typography>
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
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}
                    >
                      รอตรวจสอบการชำระ
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
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#166534" }}
                    >
                      ชำระแล้ว
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}
                  >
                    หน่วยมิเตอร์ก่อน
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700 }}>
                    {waterPrevious.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    หน่วย
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}
                  >
                    หน่วยมิเตอร์หลัง
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700 }}>
                    {waterCurrent.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    หน่วย
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 2,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#eeeeee",
                    borderRadius: 3,
                    p: 1.3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon sx={{ fontSize: 20, color: "#1e76e3" }} />
                    <Typography sx={{ fontSize: 16 }}>ผลต่าง</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {waterDiff.toLocaleString()} หน่วย
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#eeeeee",
                    borderRadius: 3,
                    p: 1.3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoneyIcon sx={{ fontSize: 20, color: "#10b981" }} />
                    <Typography sx={{ fontSize: 16 }}>จำนวนเงิน</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {waterAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* ✅ Dialog อัปโหลดสลิป */}
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
    </MainLayout>
  );
}
