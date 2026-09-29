"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

import { getCurrentUser } from "@/lib/auth";
import MainLayout from "@/components/MainLayout";
import MessageDialog from "@/components/MessageDialog";

import type { House, HouseBill, AppDialogState } from "@/types";
import {
  formatThaiDate,
  parseNumber,
  parseInt as parseIntSafe,
} from "@/lib/utils";
import { HouseBillService } from "@/lib/services/HouseBillService";

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
  Link as MuiLink,
  useMediaQuery,
  Alert,
  AlertTitle,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Print as PrintIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

export default function HouseMainPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);
  const [bill, setBill] = useState<HouseBill | null>(null);
  const [houseId, setHouseId] = useState<string | null>(null);

  const [appDialog, setAppDialog] = useState<AppDialogState>({
    open: false,
    severity: "info",
    title: "",
    message: "",
  });

  const openAppDialog = (next: Omit<AppDialogState, "open">) =>
    setAppDialog({ open: true, ...next });

  const closeAppDialog = () => setAppDialog((p) => ({ ...p, open: false }));

  const now = new Date();
  const currentYear = (now.getFullYear() + 543).toString();
  const currentMonth = (now.getMonth() + 1).toString();
  const currentMonthDisplay = formatThaiDate(currentYear, currentMonth);

  const displayMonth = bill
    ? formatThaiDate(bill.year, bill.month)
    : currentMonthDisplay;

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push("/");
          return;
        }

        const selectedHouseId = localStorage.getItem("selectedHouseId");
        if (!selectedHouseId) {
          setLoading(false);
          openAppDialog({
            severity: "warning",
            title: "ไม่พบข้อมูลบ้านพัก",
            message: "กรุณาเลือกบ้านพักจากหน้าหลักก่อน",
          });
          return;
        }

        setHouseId(selectedHouseId);
        const userMemberId = localStorage.getItem("member_id");

        // ✅ ดึงข้อมูลเดือนปัจจุบัน (ไม่ fallback อัตโนมัติ)
        const targetYear = currentYear;
        const targetMonth = currentMonth;
        const res = await HouseBillService.getLatest(
          selectedHouseId,
          targetYear,
          targetMonth
        );

        if (!res.success) {
          setLoading(false);
          openAppDialog({
            severity: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: res.message || res.error || "ไม่สามารถโหลดข้อมูลได้",
          });
          return;
        }

        // กันสิทธิ์เข้าถึง
        if (
          userMemberId &&
          String(res.data.house.member_id) !== String(userMemberId)
        ) {
          setLoading(false);
          openAppDialog({
            severity: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลบ้านพักนี้",
          });
          return;
        }

        setHouse(res.data.house);
        setBill(res.data.latestBill ?? null);

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

  // กันกรณีบ้านไม่โหลด
  if (!house) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Button
            variant="contained"
            onClick={() => router.push("/main")}
            sx={{ textTransform: "none" }}
          >
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

  // คำนวณเฉพาะตอนมี bill
  const electPrevious = bill ? parseIntSafe(bill.elect_unit_previous) : 0;
  const electCurrent = bill ? parseIntSafe(bill.elect_unit_current) : 0;
  const electDiff = bill ? parseIntSafe(String(bill.elect_unit_diff ?? 0)) : 0;
  const electAmount = bill ? parseNumber(bill.elect_amount) : 0;

  const waterPrevious = bill ? parseIntSafe(bill.water_unit_previous) : 0;
  const waterCurrent = bill ? parseIntSafe(bill.water_unit_current) : 0;
  const waterDiff = bill ? parseIntSafe(String(bill.water_unit_diff ?? 0)) : 0;
  const waterAmount = bill ? parseNumber(bill.water_amount) : 0;

  // ✅ กรณีมี house แต่ไม่มี bill (บิลเดือนปัจจุบันยังไม่ออก)
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
                บ้านเลขที่ {house.house_no} (อาคาร {house.zone_building})
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
                  onClick={() => router.push("/house/history")}
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
                บ้านเลขที่ {house.house_no} (อาคาร {house.zone_building})
              </Typography>
            </Breadcrumbs>
          </Box>

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
                <Typography
                  sx={{ fontSize: 16, fontWeight: 600, opacity: 0.8 }}
                >
                  ประจำเดือน
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                  {displayMonth}
                </Typography>
              </Box>

              <Box textAlign="center">
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  disabled={!bill}
                  onClick={() => {
                    if (!bill) return;
                    localStorage.setItem("invoiceType", "house");
                    localStorage.setItem(
                      "selectedBillId",
                      String(bill.bill_id)
                    );
                    localStorage.setItem("selectedBillYear", String(bill.year));
                    localStorage.setItem(
                      "selectedBillMonth",
                      String(bill.month)
                    );
                    router.push("/invoice");
                  }}
                  // ✅ แก้ไข: เปลี่ยนปุ่มเป็นสีเขียว
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
                  onClick={() => router.push("/house/history")}
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

          {/* Bill cards */}
          <>
              {/* ค่าไฟ */}
              <Card
                elevation={2}
                sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <FlashOnIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                    <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
                      ค่าไฟฟ้า
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: { xs: 2, sm: 3 },
                      mb: 2,
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        หน่วยมิเตอร์ก่อน
                      </Typography>
                      <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
                        {electPrevious.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        หน่วยมิเตอร์หลัง
                      </Typography>
                      <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
                        {electCurrent.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: "#eeeeee",
                        borderRadius: 3,
                        p: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpIcon sx={{ fontSize: 18 }} />
                        <Typography>ผลต่าง</Typography>
                      </Stack>
                      <Typography fontWeight={900}>
                        {electDiff.toLocaleString()} หน่วย
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: "#eeeeee",
                        borderRadius: 3,
                        p: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttachMoneyIcon sx={{ fontSize: 18 }} />
                        <Typography>จำนวนเงิน</Typography>
                      </Stack>
                      <Typography fontWeight={900}>
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

              {/* ค่าน้ำ */}
              <Card
                elevation={2}
                sx={{ borderRadius: 5, border: "1px solid #cdcdcf" }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <WaterIcon sx={{ color: "#3b82f6", fontSize: 28 }} />
                    <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
                      ค่าน้ำประปา
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: { xs: 2, sm: 3 },
                      mb: 2,
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        หน่วยมิเตอร์ก่อน
                      </Typography>
                      <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
                        {waterPrevious.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        หน่วยมิเตอร์หลัง
                      </Typography>
                      <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
                        {waterCurrent.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: "#eeeeee",
                        borderRadius: 3,
                        p: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpIcon sx={{ fontSize: 18 }} />
                        <Typography>ผลต่าง</Typography>
                      </Stack>
                      <Typography fontWeight={900}>
                        {waterDiff.toLocaleString()} หน่วย
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        bgcolor: "#eeeeee",
                        borderRadius: 3,
                        p: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AttachMoneyIcon sx={{ fontSize: 18 }} />
                        <Typography>จำนวนเงิน</Typography>
                      </Stack>
                      <Typography fontWeight={900}>
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
          </>
        </Stack>
      </Container>

      {/* Dialog รวมทุกสถานะ (แทน Alert) */}
      <MessageDialog
        open={appDialog.open}
        severity={appDialog.severity}
        title={appDialog.title}
        message={appDialog.message}
        onClose={closeAppDialog}
        primaryText={houseId ? "ตกลง" : "กลับหน้าหลัก"}
        onPrimary={() => (houseId ? closeAppDialog() : router.push("/main"))}
      />
    </MainLayout>
  );
}