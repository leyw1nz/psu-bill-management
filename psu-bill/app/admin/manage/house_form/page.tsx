"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Stack,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Card,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorOutlineIcon,
  ReceiptLong as ReceiptIcon,
  FlashOn as FlashOnIcon,
  Water as WaterIcon,
  SearchOff as SearchOffIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import MainLayout from "@/components/MainLayout";
import { Member, StaffDetails } from "@/types";
import { HouseService } from "@/lib/services/houseService";
import { memberService } from "@/lib/services/memberService";
import {
  houseTypeLabels,
  getHouseTypeLabel,
  getHouseTypeCode,
  thaiMonths,
  formatBaht,
} from "@/lib/utils";

// Interface สำหรับข้อมูลบิล (ปรับเพิ่มฟิลด์มิเตอร์)
interface BillHistoryItem {
  bill_id: string;
  month: string;
  year: string;
  
  // ข้อมูลไฟฟ้า
  elect_meter_last: number;
  elect_meter_curr: number;
  elect_unit: number;
  elect_amount: number;

  // ข้อมูลน้ำ
  water_meter_last: number;
  water_meter_curr: number;
  water_unit: number;
  water_amount: number;

  total_amount: number;
  status: string;
  created_at: string;
}

interface HouseFormData {
  house_no: string;
  zone_building: string;
  type: string;
  fee: string;
  note: string;
  member_id: string;
}

// Component ย่อยสำหรับ TabPanel
function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function HouseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "add"; // add, edit, view
  const houseId = searchParams.get("houseId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Member Search States
  const [openMemberSearch, setOpenMemberSearch] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [psuStaffList, setPsuStaffList] = useState<StaffDetails[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedStaffDetails, setSelectedStaffDetails] =
    useState<StaffDetails | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Bill History States
  const [billHistory, setBillHistory] = useState<BillHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = ไฟฟ้า, 1 = น้ำ

  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({
    open: false,
    success: false,
    message: "",
  });

  const [formData, setFormData] = useState<HouseFormData>({
    house_no: "",
    zone_building: "",
    type: "",
    fee: "",
    note: "",
    member_id: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const isReadonly = mode === "view";

  // Reset state when mode or houseId changes
  useEffect(() => {
    setFormData({
      house_no: "",
      zone_building: "",
      type: "",
      fee: "",
      note: "",
      member_id: "",
    });
    setSelectedMember(null);
    setError(null);
    setErrors({});
    setBillHistory([]);
    setTabValue(0);
  }, [mode, houseId]);

  // Load house data & Bill History
  useEffect(() => {
    if (mode !== "edit" && mode !== "view") return;
    if (!houseId) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Load House Data
        const response = await HouseService.getById(houseId);
        if (cancelled) return;

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to load house data");
        }

        const house = response.data;
        setFormData({
          house_no: house.house_no || "",
          zone_building: house.zone_building || "",
          type: getHouseTypeLabel(house.type) || "",
          fee: house.fee?.toString() || "",
          note: house.note || "",
          member_id: house.member_id?.toString() || "",
        });

        // 2. Load Member Data
        if (house.member_id) {
          try {
            const memberResponse = await memberService.getById(
              house.member_id.toString()
            );
            if (cancelled) return;

            if (memberResponse.success && memberResponse.data) {
              setSelectedMember(memberResponse.data);
              const member = memberResponse.data;
              if (member.staff_id) {
                try {
                  const staffResponse = await fetch(
                    `/api/psu/staff/search?q=${encodeURIComponent(
                      member.staff_id
                    )}`
                  );
                  const staffData = await staffResponse.json();
                  if (staffData.success && staffData.data?.length > 0) {
                    const matchingStaff = staffData.data.find(
                      (s: StaffDetails) => s.staffId === member.staff_id
                    );
                    if (matchingStaff) setSelectedStaffDetails(matchingStaff);
                  }
                } catch (staffErr) {
                  console.error(staffErr);
                }
              }
            }
          } catch (memberErr) {
            console.error(memberErr);
          }
        }

        // 3. Load Bill History (Only in View Mode)
        if (mode === "view") {
          setLoadingHistory(true);
          try {
            const historyRes = await fetch(
              `/api/bills/house/${houseId}?all=true`
            );
            const historyData = await historyRes.json();

            if (cancelled) return;

            if (
              historyData.success &&
              historyData.data &&
              historyData.data.bills
            ) {
              const mappedBills: BillHistoryItem[] = historyData.data.bills.map(
                (bill: any) => {
                  // Map ข้อมูลไฟฟ้า (ใช้ key ตามที่ API น่าจะส่งมา หรือใช้ 0)
                  const ePrev = parseFloat(bill.elect_unit_previous || bill.elect_meter_last || "0");
                  const eCurr = parseFloat(bill.elect_unit_current || bill.elect_meter_curr || "0");
                  const eDiff = parseFloat(bill.elect_unit_diff || bill.elect_unit || "0") || (eCurr - ePrev);
                  const eAmount = parseFloat(bill.elect_amount || "0");

                  // Map ข้อมูลน้ำ
                  const wPrev = parseFloat(bill.water_unit_previous || bill.water_meter_last || "0");
                  const wCurr = parseFloat(bill.water_unit_current || bill.water_meter_curr || "0");
                  const wDiff = parseFloat(bill.water_unit_diff || bill.water_unit || "0") || (wCurr - wPrev);
                  const wAmount = parseFloat(bill.water_amount || "0");
                  
                  const total = eAmount + wAmount;

                  return {
                    bill_id: bill.bill_id,
                    month: bill.month,
                    year: bill.year,
                    
                    elect_meter_last: ePrev,
                    elect_meter_curr: eCurr,
                    elect_unit: eDiff,
                    elect_amount: eAmount,

                    water_meter_last: wPrev,
                    water_meter_curr: wCurr,
                    water_unit: wDiff,
                    water_amount: wAmount,

                    total_amount: total,
                    status: bill.bill_status || "pending",
                    created_at: bill.created_at || new Date().toISOString(),
                  };
                }
              );

              // Sort: เดือนล่าสุด
              mappedBills.sort((a, b) => {
                const yearDiff = parseInt(b.year) - parseInt(a.year);
                if (yearDiff !== 0) return yearDiff; 
                return parseInt(b.month) - parseInt(a.month);
              });

              setBillHistory(mappedBills);
            } else {
              setBillHistory([]);
            }
          } catch (historyErr) {
            console.error("Error loading history:", historyErr);
            setBillHistory([]);
          } finally {
            if (!cancelled) setLoadingHistory(false);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [mode, houseId]);

  // --- Handlers ---

  const searchPSUStaff = async () => {
    if (!memberSearchTerm.trim()) {
      setSearchError("กรุณากรอกชื่อหรือนามสกุลเพื่อค้นหา");
      return;
    }
    try {
      setLoadingMembers(true);
      setSearchError(null);
      setPsuStaffList([]);
      const response = await fetch(
        `/api/psu/staff/search?q=${encodeURIComponent(memberSearchTerm)}`
      );
      const data = await response.json();
      if (!data.success || !data.data || data.data.length === 0) {
        setSearchError(
          `ไม่พบบุคลากรชื่อ/สกุล ตรงกับคำค้น "${memberSearchTerm}"`
        );
        return;
      }
      setPsuStaffList(data.data);
    } catch (err) {
      console.error("Error searching PSU staff:", err);
      setSearchError("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenMemberSearch = () => {
    setOpenMemberSearch(true);
    setMemberSearchTerm("");
    setPsuStaffList([]);
    setSearchError(null);
  };

  const handleSelectPSUStaff = async (staff: StaffDetails) => {
    try {
      setLoadingMembers(true);
      setSearchError(null);

      if (!staff.staffId) throw new Error("ข้อมูลรหัสบุคลากรไม่ถูกต้อง");
      if (!staff.staffNameThai || !staff.staffSnameThai)
        throw new Error("ข้อมูลชื่อ-นามสกุลไม่ถูกต้อง");

      const existingMemberResponse = await memberService.getAll();
      const existingMember = existingMemberResponse.data?.find(
        (m) => m.staff_id === staff.staffId
      );

      let member: Member;
      if (existingMember) {
        member = existingMember;
      } else {
        const createResponse = await memberService.create({
          email: staff.staffEmail || `${staff.staffId}@psu.ac.th`,
          role_id: 3,
          title: staff.titleNameThai || "",
          name: staff.staffNameThai,
          surname: staff.staffSnameThai,
          phone: staff.workTelephone || "",
          staff_id: staff.staffId,
        });
        if (!createResponse.success || !createResponse.data)
          throw new Error(
            createResponse.error || "ไม่สามารถสร้างบัญชีผู้ใช้ได้"
          );
        member = createResponse.data;
      }

      setSelectedMember(member);
      setSelectedStaffDetails(staff);
      setFormData((prev) => ({
        ...prev,
        member_id: member.member_id.toString(),
      }));
      setErrors((prev) => ({ ...prev, member_id: "" }));
      setOpenMemberSearch(false);
      setMemberSearchTerm("");
      setPsuStaffList([]);
    } catch (err) {
      console.error("Error selecting PSU staff:", err);
      setSearchError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเลือกบุคลากร"
      );
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setSelectedStaffDetails(null);
    setFormData((prev) => ({ ...prev, member_id: "" }));
  };

  const handleFieldChange = (field: keyof HouseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.house_no?.trim()) newErrors.house_no = "โปรดกรอกเลขที่บ้าน";
    if (!formData.zone_building?.trim())
      newErrors.zone_building = "โปรดเลือกอาคาร/โซน";
    if (!formData.type) newErrors.type = "โปรดเลือกประเภทบ้านพัก";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const houseData = {
        house_no: formData.house_no,
        zone_building: formData.zone_building,
        type: getHouseTypeCode(formData.type) || formData.type,
        fee: formData.fee || undefined,
        note: formData.note || undefined,
        member_id: formData.member_id || undefined,
      };

      let response;
      if (mode === "edit" && houseId) {
        response = await HouseService.update(houseId, houseData);
      } else {
        response = await HouseService.create(houseData);
      }

      if (!response.success) throw new Error(response.error);

      setResultDialog({
        open: true,
        success: true,
        message:
          mode === "edit"
            ? "แก้ไขข้อมูลบ้านพักสำเร็จ"
            : "เพิ่มข้อมูลบ้านพักสำเร็จ",
      });
    } catch (err) {
      console.error("Error saving house:", err);
      setResultDialog({
        open: true,
        success: false,
        message: `เกิดข้อผิดพลาด: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResultDialogClose = () => {
    if (resultDialog.success) router.push("/admin/manage/house");
    else setResultDialog((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => router.push("/admin/manage/house");

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Styles สำหรับหัวตาราง
  const headCellSx = {
    fontWeight: 700,
    fontSize: 15,
    color: "#2c3e50",
    borderBottom: "3px solid #dee2e6",
    bgcolor: "#e9ecef",
    py: 2,
    whiteSpace: "nowrap",
  } as const;

  // --- Render ---

  if (loading && (mode === "edit" || mode === "view")) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              minHeight: "60vh",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
          aria-label="breadcrumb"
          className="breadcrumb-card"
        >
          <Box onClick={() => router.push('/main')} className="breadcrumb-link">
            <HomeIcon className="breadcrumb-icon" />
            <Typography className="breadcrumb-text">หน้าหลัก</Typography>
          </Box>
          <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
            <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
          </Box>
          <Box onClick={() => router.push('/admin/manage/house')} className="breadcrumb-link">
            <Typography className="breadcrumb-text">จัดการข้อมูลบ้านพัก</Typography>
          </Box>
          <Typography className="breadcrumb-current">
            {mode === "add"
              ? "เพิ่มข้อมูลบ้านพัก"
              : mode === "edit"
              ? "แก้ไขข้อมูลบ้านพัก"
              : "ดูข้อมูลบ้านพัก"}
          </Typography>
        </Breadcrumbs>

        {/* Form Section */}
        <Paper
          elevation={3}
          sx={{ mb: 3, p: 3, borderRadius: 3, border: "1px solid #e7ebff" }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 18, fontWeight: 600, mb: 3, color: "#35373b" }}
          >
            {mode === "add"
              ? "เพิ่มข้อมูลบ้านพัก"
              : mode === "edit"
              ? "แก้ไขข้อมูลบ้านพัก"
              : "ดูข้อมูลบ้านพัก"}
          </Typography>

          <form noValidate onSubmit={handleSubmit}>
            {/* House Information */}
            <Box sx={{ mb: 4 }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#1976d2" }}
                >
                  ข้อมูลบ้านพัก
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="เลขที่บ้าน"
                  value={formData.house_no}
                  onChange={(e) =>
                    handleFieldChange("house_no", e.target.value)
                  }
                  error={!!errors.house_no}
                  helperText={errors.house_no}
                  InputProps={{ readOnly: isReadonly }}
                  sx={{
                    "& .MuiOutlinedInput-root": isReadonly
                      ? { bgcolor: "#f5f5f5" }
                      : {},
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="อาคาร/โซน"
                  value={formData.zone_building}
                  onChange={(e) =>
                    handleFieldChange("zone_building", e.target.value)
                  }
                  error={!!errors.zone_building}
                  helperText={errors.zone_building}
                  InputProps={{ readOnly: isReadonly }}
                  sx={{
                    "& .MuiOutlinedInput-root": isReadonly
                      ? { bgcolor: "#f5f5f5" }
                      : {},
                  }}
                />
                <Autocomplete
                  fullWidth
                  size="small"
                  options={houseTypeLabels}
                  value={formData.type || null}
                  onChange={(_, v) => handleFieldChange("type", v || "")}
                  disabled={isReadonly}
                  renderInput={(p) => (
                    <TextField
                      {...p}
                      label="ประเภทบ้านพัก"
                      required
                      error={!!errors.type}
                      helperText={errors.type}
                    />
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": isReadonly
                      ? { bgcolor: "#f5f5f5" }
                      : {},
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="ค่าธรรมเนียม (บาท)"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => handleFieldChange("fee", e.target.value)}
                  InputProps={{ readOnly: isReadonly }}
                  sx={{
                    "& .MuiOutlinedInput-root": isReadonly
                      ? { bgcolor: "#f5f5f5" }
                      : {},
                  }}
                />
                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="หมายเหตุ"
                    multiline
                    rows={2}
                    value={formData.note}
                    onChange={(e) => handleFieldChange("note", e.target.value)}
                    InputProps={{ readOnly: isReadonly }}
                    sx={{
                      "& .MuiOutlinedInput-root": isReadonly
                        ? { bgcolor: "#f5f5f5" }
                        : {},
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Member Assignment */}
            <Box sx={{ mb: 4 }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#1976d2" }}
                >
                  ข้อมูลผู้พักอาศัย
                </Typography>
                <Divider sx={{ flex: 1 }} />
                {!isReadonly && (
                  <>
                    {!selectedMember && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SearchIcon />}
                        onClick={handleOpenMemberSearch}
                        sx={{ bgcolor: "#2196f3" }}
                      >
                        เลือกผู้พักอาศัย
                      </Button>
                    )}
                    {selectedMember && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearMember}
                      >
                        ล้างข้อมูลผู้พักอาศัย
                      </Button>
                    )}
                  </>
                )}
              </Stack>

              {selectedMember ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f5f5f5",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        รหัสบุคลากร
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedMember.staff_id || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ชื่อ-นามสกุล
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedStaffDetails?.titleNameThai ||
                          selectedMember.title}{" "}
                        {selectedStaffDetails?.staffNameThai ||
                          selectedMember.name}{" "}
                        {selectedStaffDetails?.staffSnameThai ||
                          selectedMember.surname}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        อีเมล
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedMember.email || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        เบอร์โทรศัพท์
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedStaffDetails?.workTelephone ||
                          selectedMember.phone ||
                          "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "#fafafa",
                    borderRadius: 2,
                    border: "1px dashed #ccc",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {isReadonly
                      ? "ไม่มีข้อมูลผู้พักอาศัย"
                      : "คลิกปุ่ม 'เลือกผู้พักอาศัย' เพื่อเลือกผู้พักอาศัย"}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Buttons */}
            {!isReadonly ? (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ borderColor: "#9e9e9e", color: "#9e9e9e" }}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    loading ? <CircularProgress size={16} /> : <SaveIcon />
                  }
                  disabled={loading}
                  sx={{ bgcolor: "#4caf50" }}
                >
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleCancel}
                  sx={{ bgcolor: "#2196f3" }}
                >
                  กลับ
                </Button>
              </Stack>
            )}
          </form>
        </Paper>

        {/* ✅ Bill History Section (Tabbed Layout like HouseHistoryPage) */}
        {mode === "view" && (
            <Card
            elevation={2}
            sx={{
              borderRadius: 5,
              border: "1px solid #cdcdcf",
              overflow: "hidden",
              mb: 3
            }}
          >
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ p: 2, borderBottom: "1px solid #eee" }}
            >
                <ReceiptIcon color="primary" />
                <Typography
                variant="h6"
                sx={{ fontSize: 18, fontWeight: 600, color: "#35373b" }}
                >
                ประวัติบิลของบ้าน
                </Typography>
            </Stack>

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
              {loadingHistory ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : billHistory.length === 0 ? (
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
                    ไม่มีประวัติบิล
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={headCellSx}>ประจำเดือน</TableCell>
                        <TableCell align="center" sx={headCellSx}>มิเตอร์ก่อน</TableCell>
                        <TableCell align="center" sx={headCellSx}>มิเตอร์หลัง</TableCell>
                        <TableCell align="center" sx={headCellSx}>ผลต่าง (หน่วย)</TableCell>
                        <TableCell align="center" sx={headCellSx}>จำนวนเงิน (บาท)</TableCell>
                        <TableCell align="center" sx={headCellSx}>วันที่บันทึก</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billHistory.map((row, idx) => (
                        <TableRow
                          key={row.bill_id}
                          hover
                          sx={{
                            bgcolor: idx % 2 === 0 ? "white" : "#f8f9fa",
                            "&:hover": { bgcolor: "#e3f2fd" },
                          }}
                        >
                          <TableCell align="center" sx={{ fontSize: 15, color: "#495057", fontWeight: 700 }}>
                            {thaiMonths[parseInt(row.month) - 1]} {row.year}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#6c757d" }}>
                            {row.elect_meter_last.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#6c757d" }}>
                            {row.elect_meter_curr.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#0d6efd", fontWeight: 700 }}>
                            {row.elect_unit.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 16, color: "#198754", fontWeight: 800 }}>
                            {formatBaht(row.elect_amount)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 14, color: "#6c757d" }}>
                              {new Date(row.created_at).toLocaleDateString("th-TH")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* น้ำประปา */}
            <TabPanel value={tabValue} index={1}>
                {loadingHistory ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : billHistory.length === 0 ? (
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
                    ไม่มีประวัติบิล
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={headCellSx}>ประจำเดือน</TableCell>
                        <TableCell align="center" sx={headCellSx}>มิเตอร์ก่อน</TableCell>
                        <TableCell align="center" sx={headCellSx}>มิเตอร์หลัง</TableCell>
                        <TableCell align="center" sx={headCellSx}>ผลต่าง (หน่วย)</TableCell>
                        <TableCell align="center" sx={headCellSx}>จำนวนเงิน (บาท)</TableCell>
                        <TableCell align="center" sx={headCellSx}>วันที่บันทึก</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billHistory.map((row, idx) => (
                        <TableRow
                          key={row.bill_id}
                          hover
                          sx={{
                            bgcolor: idx % 2 === 0 ? "white" : "#f8f9fa",
                            "&:hover": { bgcolor: "#e3f2fd" },
                          }}
                        >
                          <TableCell align="center" sx={{ fontSize: 15, color: "#495057", fontWeight: 700 }}>
                            {thaiMonths[parseInt(row.month) - 1]} {row.year}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#6c757d" }}>
                            {row.water_meter_last.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#6c757d" }}>
                            {row.water_meter_curr.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 15, color: "#0d6efd", fontWeight: 700 }}>
                            {row.water_unit.toLocaleString()}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 16, color: "#198754", fontWeight: 800 }}>
                            {formatBaht(row.water_amount)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 14, color: "#6c757d" }}>
                              {new Date(row.created_at).toLocaleDateString("th-TH")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Card>
        )}

        {/* Member Search Dialog */}
        <Dialog
          open={openMemberSearch}
          onClose={() => setOpenMemberSearch(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: "#2196f3", color: "white" }}>
            ค้นหาบุคลากร
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="ค้นหาด้วยชื่อหรือนามสกุล"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") searchPSUStaff();
                }}
              />
              <Button
                variant="contained"
                onClick={searchPSUStaff}
                disabled={loadingMembers}
              >
                ค้นหา
              </Button>
            </Stack>
            {loadingMembers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : psuStaffList.length > 0 ? (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: "#e3f2fd" }}>รหัส</TableCell>
                      <TableCell sx={{ bgcolor: "#e3f2fd" }}>
                        ชื่อ-นามสกุล
                      </TableCell>
                      <TableCell sx={{ bgcolor: "#e3f2fd" }}>
                        หน่วยงาน
                      </TableCell>
                      <TableCell sx={{ bgcolor: "#e3f2fd" }} align="center">
                        เลือก
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {psuStaffList.map((staff, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{staff.staffId}</TableCell>
                        <TableCell>
                          {staff.titleNameThai}
                          {staff.staffNameThai} {staff.staffSnameThai}
                        </TableCell>
                        <TableCell>{staff.deptNameThai}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleSelectPSUStaff(staff)}
                            color="primary"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {searchError || "กรุณากรอกคำค้นหา"}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMemberSearch(false)}>ปิด</Button>
          </DialogActions>
        </Dialog>

        {/* Result Dialog */}
        <Dialog
          open={resultDialog.open}
          onClose={handleResultDialogClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogContent sx={{ pt: 4, pb: 2, textAlign: "center" }}>
            {resultDialog.success ? (
              <CheckCircleOutlineIcon
                sx={{ fontSize: 64, color: "#4caf50", mb: 2 }}
              />
            ) : (
              <ErrorOutlineIcon
                sx={{ fontSize: 64, color: "#f44336", mb: 2 }}
              />
            )}
            <Typography variant="h6">
              {resultDialog.success ? "สำเร็จ" : "เกิดข้อผิดพลาด"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {resultDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
            <Button
              onClick={handleResultDialogClose}
              variant="contained"
              sx={{ bgcolor: resultDialog.success ? "#4caf50" : "#f44336" }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
}

export default function HouseFormPage() {
  return (
    <Suspense
      fallback={
        <MainLayout IsMobile={false}>
          <CircularProgress />
        </MainLayout>
      }
    >
      <HouseFormContent />
    </Suspense>
  );
}