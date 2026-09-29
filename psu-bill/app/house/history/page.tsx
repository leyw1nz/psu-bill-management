"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

import { getCurrentUser } from "@/lib/auth";
import MainLayout from "@/components/MainLayout";
import MessageDialog from "@/components/MessageDialog";

import type {
  User,
  House,
  HouseBill,
  TabPanelProps,
  AppDialogState,
} from "@/types";
import {
  formatThaiDate,
  parseNumber,
  parseInt as parseIntSafe,
  thaiMonths,
} from "@/lib/utils";
import { HouseBillService } from "@/lib/services/HouseBillService";

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

// ปี พ.ศ. ย้อนหลัง 10 ปี
const currentBEYear = new Date().getFullYear() + 543;
const years = Array.from({ length: 10 }, (_, i) => currentBEYear - i);

// เก็บเป็น string จะง่ายกับ <Select/>
type MonthFilter = "*" | string;
type YearFilter = "*" | string;

type HistoryRow = {
  monthLabel: string;

  electBefore: string;
  electAfter: string;
  electDiff: string;
  electAmount: string;

  waterBefore: string;
  waterAfter: string;
  waterDiff: string;
  waterAmount: string;
};

export default function HouseHistoryPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [house, setHouse] = useState<House | null>(null);

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);

  const [selectedMonth, setSelectedMonth] = useState<MonthFilter>("*");
  const [selectedYear, setSelectedYear] = useState<YearFilter>("*");

  const [bills, setBills] = useState<HouseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);

  // Dialog แทน alert
  const [appDialog, setAppDialog] = useState<AppDialogState>({
    open: false,
    severity: "info",
    title: "",
    message: "",
  });

  const openAppDialog = (next: Omit<AppDialogState, "open">) =>
    setAppDialog({ open: true, ...next });
  const closeAppDialog = () => setAppDialog((p) => ({ ...p, open: false }));

  const rowsPerPage = 10;

  // auth + get selectedHouseId
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
      return;
    }
    setUser(currentUser);

    const hId = localStorage.getItem("selectedHouseId");
    if (!hId) {
      setLoading(false);
      openAppDialog({
        severity: "warning",
        title: "ไม่พบบ้านพักที่เลือก",
        message: "กรุณาเลือกบ้านพักจากหน้าหลักก่อน",
      });
      return;
    }

    setSelectedHouseId(hId);
  }, [router]);

  // load history via service
  useEffect(() => {
    const load = async () => {
      if (!selectedHouseId) return;

      setLoading(true);
      try {
        const userMemberId = localStorage.getItem("member_id");
        const res = await HouseBillService.getHistoryAll(selectedHouseId);

        if (!res.success) {
          setHouse(null);
          setBills([]);
          openAppDialog({
            severity: "error",
            title: "โหลดข้อมูลไม่สำเร็จ",
            message: res.message || res.error || "ไม่สามารถโหลดข้อมูลได้",
          });
          return;
        }

        // กันสิทธิ์เข้าถึง (ถ้าระบบคุณใช้ member_id เทียบ)
        if (
          userMemberId &&
          String(res.data.house.member_id) !== String(userMemberId)
        ) {
          setHouse(null);
          setBills([]);
          openAppDialog({
            severity: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลบ้านพักนี้",
          });
          return;
        }

        setHouse(res.data.house);
        setBills(res.data.bills ?? []);
      } catch (e) {
        console.error(e);
        setHouse(null);
        setBills([]);
        openAppDialog({
          severity: "error",
          title: "เกิดข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedHouseId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleYearSelect = (e: SelectChangeEvent) => {
    setSelectedYear(e.target.value as string);
    setPage(1);
  };

  const handleMonthSelect = (e: SelectChangeEvent) => {
    setSelectedMonth(e.target.value as string);
    setPage(1);
  };

  const rows: HistoryRow[] = useMemo(() => {
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

      const matchYear =
        selectedYear === "*" ? true : billYear === Number(selectedYear);
      const matchMonth =
        selectedMonth === "*" ? true : monthName === selectedMonth;

      return matchYear && matchMonth;
    });

    return filtered.map((bill) => {
      const ePrev = parseIntSafe(bill.elect_unit_previous);
      const eCurr = parseIntSafe(bill.elect_unit_current);
      const eDiff = parseIntSafe(bill.elect_unit_diff) || eCurr - ePrev;

      const wPrev = parseIntSafe(bill.water_unit_previous);
      const wCurr = parseIntSafe(bill.water_unit_current);
      const wDiff = parseIntSafe(bill.water_unit_diff) || wCurr - wPrev;

      return {
        monthLabel: formatThaiDate(bill.year || "", bill.month || ""),

        electBefore: ePrev.toLocaleString("th-TH"),
        electAfter: eCurr.toLocaleString("th-TH"),
        electDiff: eDiff.toLocaleString("th-TH"),
        electAmount: parseNumber(bill.elect_amount).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),

        waterBefore: wPrev.toLocaleString("th-TH"),
        waterAfter: wCurr.toLocaleString("th-TH"),
        waterDiff: wDiff.toLocaleString("th-TH"),
        waterAmount: parseNumber(bill.water_amount).toLocaleString("th-TH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
    });
  }, [bills, selectedMonth, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const startIndex = (page - 1) * rowsPerPage;
  const currentData = rows.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  if (!user) {
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

  const emptyText =
    selectedMonth === "*" && selectedYear === "*"
      ? "ไม่มีรายการในระบบ"
      : selectedMonth === "*"
      ? `ไม่มีรายการในปี ${selectedYear}`
      : selectedYear === "*"
      ? `ไม่มีรายการในเดือน ${selectedMonth}`
      : `ไม่มีรายการในเดือน ${selectedMonth} ปี ${selectedYear}`;

  const headCellSx = {
    fontWeight: 700,
    fontSize: 15,
    color: "#2c3e50",
    borderBottom: "3px solid #dee2e6",
    bgcolor: "#e9ecef",
    py: 2,
    whiteSpace: "nowrap",
  } as const;

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          {/* Filter + Breadcrumbs */}
          <Paper
            sx={{
              borderRadius: 1,
              bgcolor: "#f8f9fa",
              border: "1px solid #e3e6ea",
              p: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Breadcrumbs>
                <MuiLink
                  component={NextLink}
                  href="/main"
                  underline="hover"
                  color="inherit"
                >
                  <Typography color="#2fa4da">หน้าหลัก</Typography>
                </MuiLink>

                <MuiLink
                  component={NextLink}
                  href="/house/main"
                  underline="hover"
                  color="inherit"
                >
                  <Typography color="#2fa4da">
                    {house
                      ? `บ้านเลขที่ ${house.house_no} (อาคาร ${house.zone_building})`
                      : "ค่าน้ำค่าไฟบ้านพัก"}
                  </Typography>
                </MuiLink>

                <Typography color="text.primary">ประวัติย้อนหลัง</Typography>
              </Breadcrumbs>

              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                flexWrap="wrap"
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarMonthIcon sx={{ fontSize: 20, color: "#6c757d" }} />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedYear}
                      onChange={handleYearSelect}
                      sx={{ borderRadius: 2, bgcolor: "white", fontSize: 15 }}
                    >
                      <MenuItem value="*" sx={{ fontSize: 15 }}>
                        -- ทั้งหมด --
                      </MenuItem>
                      {years.map((y) => (
                        <MenuItem
                          key={y}
                          value={String(y)}
                          sx={{ fontSize: 15 }}
                        >
                          {y}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={selectedMonth}
                    onChange={handleMonthSelect}
                    sx={{ borderRadius: 2, bgcolor: "white", fontSize: 15 }}
                  >
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

          {/* Tabs + Tables */}
          <Card
            elevation={2}
            sx={{
              borderRadius: 5,
              border: "1px solid #cdcdcf",
              overflow: "hidden",
            }}
          >
            <Box sx={{ borderBottom: "5px solid #dedede" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  "& .MuiTab-root": {
                    fontSize: 18,
                    fontWeight: 600,
                    textTransform: "none",
                    minHeight: 47,
                    py: 1.5,
                  },
                  "& .Mui-selected": { color: "#1e76e3" },
                  "& .MuiTabs-indicator": { height: 5, bgcolor: "#4e5ee9" },
                }}
              >
                <Tab
                  icon={<FlashOnIcon sx={{ fontSize: 20 }} />}
                  iconPosition="start"
                  label="ไฟฟ้า"
                />
                <Tab
                  icon={<WaterIcon sx={{ fontSize: 20 }} />}
                  iconPosition="start"
                  label="น้ำประปา"
                />
              </Tabs>
            </Box>

            {/* ไฟฟ้า */}
            <TabPanel value={tabValue} index={0}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : rows.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 8,
                    px: 3,
                  }}
                >
                  <SearchOffIcon
                    sx={{ fontSize: 64, color: "#adb5bd", mb: 2 }}
                  />
                  <Typography
                    sx={{ fontSize: 15, color: "#6c757d", textAlign: "center" }}
                  >
                    {emptyText}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={headCellSx}>
                            ประจำเดือน
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            มิเตอร์ก่อน
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            มิเตอร์หลัง
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            ผลต่าง (หน่วย)
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            จำนวนเงิน (บาท)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentData.map((row, idx) => (
                          <TableRow
                            key={`${row.monthLabel}-${idx}`}
                            hover
                            sx={{
                              bgcolor: idx % 2 === 0 ? "white" : "#f8f9fa",
                              "&:hover": { bgcolor: "#e3f2fd" },
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 15,
                                color: "#495057",
                                fontWeight: 700,
                              }}
                            >
                              {row.monthLabel}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: 15, color: "#6c757d" }}
                            >
                              {row.electBefore}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: 15, color: "#6c757d" }}
                            >
                              {row.electAfter}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 15,
                                color: "#0d6efd",
                                fontWeight: 700,
                              }}
                            >
                              {row.electDiff}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 16,
                                color: "#198754",
                                fontWeight: 800,
                              }}
                            >
                              {row.electAmount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              )}
            </TabPanel>

            {/* น้ำ */}
            <TabPanel value={tabValue} index={1}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : rows.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 8,
                    px: 3,
                  }}
                >
                  <SearchOffIcon
                    sx={{ fontSize: 64, color: "#adb5bd", mb: 2 }}
                  />
                  <Typography
                    sx={{ fontSize: 15, color: "#6c757d", textAlign: "center" }}
                  >
                    {emptyText}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={headCellSx}>
                            ประจำเดือน
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            มิเตอร์ก่อน
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            มิเตอร์หลัง
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            ผลต่าง (หน่วย)
                          </TableCell>
                          <TableCell align="center" sx={headCellSx}>
                            จำนวนเงิน (บาท)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentData.map((row, idx) => (
                          <TableRow
                            key={`${row.monthLabel}-${idx}`}
                            hover
                            sx={{
                              bgcolor: idx % 2 === 0 ? "white" : "#f8f9fa",
                              "&:hover": { bgcolor: "#e3f2fd" },
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 15,
                                color: "#495057",
                                fontWeight: 700,
                              }}
                            >
                              {row.monthLabel}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: 15, color: "#6c757d" }}
                            >
                              {row.waterBefore}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontSize: 15, color: "#6c757d" }}
                            >
                              {row.waterAfter}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 15,
                                color: "#0d6efd",
                                fontWeight: 700,
                              }}
                            >
                              {row.waterDiff}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: 16,
                                color: "#198754",
                                fontWeight: 800,
                              }}
                            >
                              {row.waterAmount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 3 }}
                    >
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size={isMobile ? "medium" : "large"}
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              )}
            </TabPanel>
          </Card>
        </Stack>
      </Container>

      {/* Dialog แจ้งเตือน */}
      <MessageDialog
        open={appDialog.open}
        severity={appDialog.severity}
        title={appDialog.title}
        message={appDialog.message}
        onClose={closeAppDialog}
        primaryText={selectedHouseId ? "ตกลง" : "กลับหน้าหลัก"}
        onPrimary={() =>
          selectedHouseId ? closeAppDialog() : router.push("/main")
        }
      />
    </MainLayout>
  );
}
