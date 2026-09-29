"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

import { getCurrentUser } from "@/lib/auth";
import MainLayout from "@/components/MainLayout";
import MessageDialog from "@/components/MessageDialog";

import type { TabPanelProps, User, Shop, ShopBill, AppDialogState } from "@/types";
import { formatThaiDate, thaiMonths, parseInt as parseIntSafe, parseNumber } from "@/lib/utils";
import { ShopBillService } from "@/lib/services/shopBillService";

import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Card,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Breadcrumbs,
  Link as MuiLink,
  useMediaQuery,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";

import {
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  SearchOff as SearchOffIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`utility-tabpanel-${index}`}
      aria-labelledby={`utility-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// ปีพ.ศ. ย้อนหลัง 10 ปี
const currentBEYear = new Date().getFullYear() + 543;
const years = Array.from({ length: 10 }, (_, i) => currentBEYear - i);

type MonthFilter = "*" | string;
type YearFilter = "*" | string;

// ✅ เดือนแบบย่อ (มือถือ)
const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const formatMonthLabel = (year: string, month: string, compact: boolean) => {
  if (!compact) return formatThaiDate(year, month);
  const mNo = parseIntSafe(month);
  const m = thaiMonthsShort[mNo - 1] ?? "";
  const y2 = String(parseIntSafe(year)).slice(-2);
  return `${m} ${y2}`;
};

// ✅ robust parse สำหรับ postgres timestamp (เช่น "YYYY-MM-DD HH:mm:ss")
type DateInput = string | Date | null | undefined;

const toDateSafe = (value: DateInput) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();

  // normalize "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  const normalized = raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatApprovedThai = (value: DateInput, compact: boolean) => {
  const d = toDateSafe(value);
  if (!d) return "-";

  const day = d.getDate(); // 1-31
  const monthIndex = d.getMonth(); // 0-11
  const yearBE = d.getFullYear() + 543;

  if (compact) {
    const m = thaiMonthsShort[monthIndex] ?? "";
    const y2 = String(yearBE).slice(-2);
    return `${day} ${m} ${y2}`; // 17 ธ.ค. 68
  }

  const mLong = thaiMonths[monthIndex] ?? "";
  return `${day} ${mLong} ${yearBE}`; // 17 ธันวาคม 2568
};

type HistoryRow = {
  monthLabel: string;

  electApprovedAt: string;
  electBefore: string;
  electAfter: string;
  electDiff: string;
  electAmount: string;

  waterApprovedAt: string;
  waterBefore: string;
  waterAfter: string;
  waterDiff: string;
  waterAmount: string;
};

// ✅ กัน TS ถ้าใน types ยังไม่ได้ใส่ field approve_date
type ShopBillWithApprove = ShopBill & {
  elect_approve_date?: DateInput;
  water_approve_date?: DateInput;
};

export default function ShopHistoryPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);

  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("*");
  const [selectedYear, setSelectedYear] = useState<YearFilter>("*");

  const [bills, setBills] = useState<ShopBillWithApprove[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const [appDialog, setAppDialog] = useState<AppDialogState>({
    open: false,
    severity: "info",
    title: "",
    message: "",
  });

  const openAppDialog = (next: Omit<AppDialogState, "open">) => setAppDialog({ open: true, ...next });
  const closeAppDialog = () => setAppDialog((p) => ({ ...p, open: false }));

  const rowsPerPage = 10;

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
      return;
    }

    setUser(currentUser);

    const shopId = localStorage.getItem("selectedShopId");
    if (!shopId) {
      setLoading(false);
      openAppDialog({
        severity: "warning",
        title: "ไม่พบข้อมูลร้านค้า",
        message: "กรุณาเลือกร้านค้าจากหน้าหลักก่อน",
      });
      return;
    }

    setSelectedShopId(shopId);
  }, [router]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedShopId) return;

      setLoading(true);
      try {
        const userMemberId = localStorage.getItem("member_id");
        const res = await ShopBillService.getHistoryAll(selectedShopId);

        if (!res.success) {
          openAppDialog({
            severity: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: res.message || res.error || "ไม่สามารถโหลดข้อมูลได้",
          });
          setBills([]);
          setShop(null);
          return;
        }

        if (userMemberId && String(res.data.shop.member_id) !== String(userMemberId)) {
          openAppDialog({
            severity: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลร้านค้านี้",
          });
          setBills([]);
          setShop(null);
          return;
        }

        setShop(res.data.shop);
        setBills((res.data.bills ?? []) as ShopBillWithApprove[]);
      } catch (e) {
        console.error(e);
        openAppDialog({
          severity: "error",
          title: "เกิดข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [selectedShopId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleYearSelect = (e: SelectChangeEvent<string>) => {
    setSelectedYear(e.target.value);
    setPage(1);
  };

  const handleMonthSelect = (e: SelectChangeEvent<string>) => {
    setSelectedMonth(e.target.value);
    setPage(1);
  };

  // ✅ สร้าง rows แล้วแยกชุด “อนุมัติแล้ว” ตามแท็บ
  const { electRows, waterRows } = useMemo(() => {
    const sorted = [...(bills ?? [])].sort((a, b) => {
      const by = Number(b.year || 0);
      const ay = Number(a.year || 0);
      if (by !== ay) return by - ay;

      const bm = Number(b.month || 0);
      const am = Number(a.month || 0);
      return bm - am;
    });

    const filtered = sorted.filter((bill) => {
      const monthNo = parseIntSafe(bill.month);
      const monthName = thaiMonths[monthNo - 1] || "";
      const billYear = parseIntSafe(bill.year);

      const matchYear = selectedYear === "*" ? true : billYear === Number(selectedYear);
      const matchMonth = selectedMonth === "*" ? true : monthName === selectedMonth;

      return matchYear && matchMonth;
    });

    const mapped: HistoryRow[] = filtered.map((bill) => {
      const ePrev = parseIntSafe(bill.elect_unit_previous);
      const eCurr = parseIntSafe(bill.elect_unit_current);
      const eDiff = eCurr - ePrev;

      const wPrev = parseIntSafe(bill.water_unit_previous);
      const wCurr = parseIntSafe(bill.water_unit_current);
      const wDiff = wCurr - wPrev;

      return {
        monthLabel: formatMonthLabel(String(bill.year || ""), String(bill.month || ""), isMobile),

        // ✅ ใช้ชื่อ field ตามฐานข้อมูล
        electApprovedAt: formatApprovedThai(bill.elect_approve_date, isMobile),
        electBefore: ePrev.toLocaleString("th-TH"),
        electAfter: eCurr.toLocaleString("th-TH"),
        electDiff: eDiff.toLocaleString("th-TH"),
        electAmount: parseNumber(bill.elect_amount).toLocaleString("th-TH", {
          minimumFractionDigits: isMobile ? 0 : 2,
          maximumFractionDigits: isMobile ? 0 : 2,
        }),

        waterApprovedAt: formatApprovedThai(bill.water_approve_date, isMobile),
        waterBefore: wPrev.toLocaleString("th-TH"),
        waterAfter: wCurr.toLocaleString("th-TH"),
        waterDiff: wDiff.toLocaleString("th-TH"),
        waterAmount: parseNumber(bill.water_amount).toLocaleString("th-TH", {
          minimumFractionDigits: isMobile ? 0 : 2,
          maximumFractionDigits: isMobile ? 0 : 2,
        }),
      };
    });

    return {
      electRows: mapped.filter((r) => r.electApprovedAt !== "-"),
      waterRows: mapped.filter((r) => r.waterApprovedAt !== "-"),
    };
  }, [bills, selectedMonth, selectedYear, isMobile]);

  // ✅ pagination อิงตามแท็บปัจจุบัน
  const activeRows = tabValue === 0 ? electRows : waterRows;

  const totalPages = Math.max(1, Math.ceil(activeRows.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const currentData = activeRows.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const emptyText =
    selectedMonth === "*" && selectedYear === "*"
      ? "ไม่มีรายการที่อนุมัติแล้วในระบบ"
      : selectedMonth === "*"
      ? `ไม่มีรายการที่อนุมัติแล้วในปี ${selectedYear}`
      : selectedYear === "*"
      ? `ไม่มีรายการที่อนุมัติแล้วในเดือน ${selectedMonth}`
      : `ไม่มีรายการที่อนุมัติแล้วในเดือน ${selectedMonth} ปี ${selectedYear}`;

  const headCellSx = {
    fontWeight: 800,
    fontSize: isMobile ? 12 : 15,
    color: "#2c3e50",
    borderBottom: "3px solid #dee2e6",
    bgcolor: "#e9ecef",
    py: isMobile ? 1 : 2,
    px: isMobile ? 0.5 : 2,
    whiteSpace: "nowrap",
  } as const;

  const bodyCellSx = {
    fontSize: isMobile ? 12 : 15,
    py: isMobile ? 1 : 1.5,
    px: isMobile ? 0.5 : 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as const;

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          <Paper sx={{ borderRadius: 1, bgcolor: "#f8f9fa", border: "1px solid #e3e6ea", p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2}>
              <Breadcrumbs>
                <MuiLink component={NextLink} href="/main" underline="hover" color="inherit">
                  <Typography color="#2fa4da">หน้าหลัก</Typography>
                </MuiLink>

                <MuiLink component={NextLink} href="/shop/main" underline="hover" color="inherit">
                  <Typography color="#2fa4da">{shop ? `ร้านเลขที่ ${shop.shop_no}` : "ค่าน้ำค่าไฟร้านค้า"}</Typography>
                </MuiLink>

                <Typography color="text.primary">ประวัติย้อนหลัง</Typography>
              </Breadcrumbs>

              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarMonthIcon sx={{ fontSize: 20, color: "#6c757d" }} />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select value={selectedYear} onChange={handleYearSelect} sx={{ borderRadius: 2, bgcolor: "white", fontSize: 15 }}>
                      <MenuItem value="*" sx={{ fontSize: 15 }}>
                        -- ทั้งหมด --
                      </MenuItem>
                      {years.map((y) => (
                        <MenuItem key={y} value={String(y)} sx={{ fontSize: 15 }}>
                          {y}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select value={selectedMonth} onChange={handleMonthSelect} sx={{ borderRadius: 2, bgcolor: "white", fontSize: 15 }}>
                    <MenuItem value="*" sx={{ fontSize: 15 }}>
                      -- ทั้งหมด --
                    </MenuItem>
                    {thaiMonths.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: 15 }}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          <Card elevation={2} sx={{ borderRadius: 5, border: "1px solid #cdcdcf", overflow: "hidden" }}>
            <Box sx={{ borderBottom: "5px solid #dedede" }}>
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                <Tab icon={<FlashOnIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="ไฟฟ้า" />
                <Tab icon={<WaterIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="น้ำประปา" />
              </Tabs>
            </Box>

            {/* ================= ไฟฟ้า ================= */}
            <TabPanel value={tabValue} index={0}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : electRows.length === 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, px: 3 }}>
                  <SearchOffIcon sx={{ fontSize: 64, color: "#adb5bd", mb: 2 }} />
                  <Typography sx={{ fontSize: 15, color: "#6c757d", textAlign: "center" }}>{emptyText}</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ width: "100%", overflowX: "hidden" }}>
                    <Table
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        tableLayout: isMobile ? "fixed" : "auto",
                        width: "100%",
                      }}
                    >
                      {isMobile && (
                        <colgroup>
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "17%" }} />
                          <col style={{ width: "17%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18%" }} />
                        </colgroup>
                      )}

                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "อนุมัติ" : "วันที่อนุมัติ"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "เดือน" : "ประจำเดือน"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "ก่อน" : "มิเตอร์ก่อน"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "หลัง" : "มิเตอร์หลัง"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "ต่าง" : "ผลต่าง"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "บาท" : "จำนวนเงิน (บาท)"}</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {currentData.map((row, idx) => (
                          <TableRow key={`${row.monthLabel}-${idx}`} hover>
                            <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 500, color: "#1a1a1b" }}>
                              {row.electApprovedAt}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 800, color: "#495057" }}>
                              {row.monthLabel}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#6c757d" }}>
                              {row.electBefore}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#6c757d" }}>
                              {row.electAfter}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#0d6efd", fontWeight: 900 }}>
                              {row.electDiff}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#198754", fontWeight: 900 }}>
                              {row.electAmount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size={isMobile ? "medium" : "large"} showFirstButton showLastButton />
                    </Box>
                  )}
                </>
              )}
            </TabPanel>

            {/* ================= น้ำ ================= */}
            <TabPanel value={tabValue} index={1}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : waterRows.length === 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, px: 3 }}>
                  <SearchOffIcon sx={{ fontSize: 64, color: "#adb5bd", mb: 2 }} />
                  <Typography sx={{ fontSize: 15, color: "#6c757d", textAlign: "center" }}>{emptyText}</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ width: "100%", overflowX: "hidden" }}>
                    <Table
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        tableLayout: isMobile ? "fixed" : "auto",
                        width: "100%",
                      }}
                    >
                      {isMobile && (
                        <colgroup>
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "17%" }} />
                          <col style={{ width: "17%" }} />
                          <col style={{ width: "15%" }} />
                          <col style={{ width: "18%" }} />
                        </colgroup>
                      )}

                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "อนุมัติ" : "วันที่อนุมัติ"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "เดือน" : "ประจำเดือน"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "ก่อน" : "มิเตอร์ก่อน"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "หลัง" : "มิเตอร์หลัง"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "ต่าง" : "ผลต่าง"}</TableCell>
                          <TableCell align="center" sx={headCellSx}>{isMobile ? "บาท" : "จำนวนเงิน (บาท)"}</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {currentData.map((row, idx) => (
                          <TableRow key={`${row.monthLabel}-${idx}`} hover>
                            <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 500, color: "#1a1a1b" }}>
                              {row.waterApprovedAt}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, fontWeight: 800, color: "#495057" }}>
                              {row.monthLabel}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#6c757d" }}>
                              {row.waterBefore}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#6c757d" }}>
                              {row.waterAfter}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#0d6efd", fontWeight: 900 }}>
                              {row.waterDiff}
                            </TableCell>
                            <TableCell align="center" sx={{ ...bodyCellSx, color: "#198754", fontWeight: 900 }}>
                              {row.waterAmount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size={isMobile ? "medium" : "large"} showFirstButton showLastButton />
                    </Box>
                  )}
                </>
              )}
            </TabPanel>
          </Card>
        </Stack>
      </Container>

      <MessageDialog
        open={appDialog.open}
        severity={appDialog.severity}
        title={appDialog.title}
        message={appDialog.message}
        onClose={closeAppDialog}
        primaryText={selectedShopId ? "ตกลง" : "กลับหน้าหลัก"}
        onPrimary={() => (selectedShopId ? closeAppDialog() : router.push("/main"))}
      />
    </MainLayout>
  );
}
