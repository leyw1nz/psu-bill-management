"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
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
  Autocomplete,
  Divider,
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
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  PlaylistAdd as PlaylistAddIcon, // ✅ เพิ่มไอคอน
} from "@mui/icons-material";
import MainLayout from "@/components/MainLayout";

// # นำเข้า Utils และ Service
import { thaiMonths, getThaiYear, formatBaht } from "@/lib/utils";
import { ShopWithMember, BillRecordDisplay } from "@/types";
import { ShopService } from "@/lib/services/shopService";
import { BillCalculationService } from "@/lib/services/billCalculationService";

const formatDisplayDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Bangkok",
  });
};

// ✅ Interface สำหรับข้อมูลใน Bulk Modal (Shop)
interface BulkItem {
  shop: ShopWithMember;
  previousMeter: string;
  currentMeter: string;
  difference: string;
  amount: string;
  status: "pending" | "saving" | "done" | "error";
  errorMsg?: string;
  existingBillId?: string;
}

function ShopRecordElectContent() {
  const router = useRouter();

  // # Data States
  const [dbShops, setDbShops] = useState<ShopWithMember[]>([]);
  const [dbRecentRecords, setDbRecentRecords] = useState<BillRecordDisplay[]>(
    []
  );
  const [existingBill, setExistingBill] = useState<any | null>(null);

  // # UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMeter, setIsFetchingMeter] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [unitPrice, setUnitPrice] = useState<number>(5);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopWithMember | null>(null);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

  // --- ✅ BULK MODE STATES ---
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  // ------------------------

  const currentYearBE = getThaiYear(new Date().getFullYear());
  const currentMonth = thaiMonths[new Date().getMonth()];
  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYearBE - 2 + i).toString()
  );

  const [formData, setFormData] = useState({
    month: currentMonth,
    year: currentYearBE.toString(),
    previousMeter: "",
    currentMeter: "",
    difference: "",
    amount: "0",
  });

  // ✅ Track calculated amount to detect manual edits
  const [calculatedAmount, setCalculatedAmount] = useState<string>("0");

  // ✅ Check if amount was manually edited
  const isAmountManuallyEdited = useMemo(() => {
    if (!formData.amount || !calculatedAmount) return false;
    return parseFloat(formData.amount) !== parseFloat(calculatedAmount);
  }, [formData.amount, calculatedAmount]);

  // # Error Logic
  const fieldErrors = useMemo(() => {
    const prev = parseFloat(formData.previousMeter || "0");
    const curr = parseFloat(formData.currentMeter || "0");

    return {
      building: isSubmitted && !selectedBuilding,
      shop: isSubmitted && !selectedShop,
      currentMeter: isSubmitted && !formData.currentMeter,
      invalidValue: isSubmitted && formData.currentMeter !== "" && curr < prev,
      difference:
        isSubmitted &&
        (formData.difference === "" || formData.difference === null),
    };
  }, [
    isSubmitted,
    selectedBuilding,
    selectedShop,
    formData.currentMeter,
    formData.previousMeter,
    formData.difference,
  ]);

  // 1. Init Data
  useEffect(() => {
    const initData = async () => {
      try {
        const [shopsData, recordsData, electricityPrice] = await Promise.all([
          ShopService.getShops(),
          ShopService.getRecentElectBills(),
          BillCalculationService.getUnitPrice('shop', 'electricity'),
        ]);

        const sortedRecords = recordsData.sort((a, b) => {
          const dateA = new Date(a.elect_record_date || 0).getTime();
          const dateB = new Date(b.elect_record_date || 0).getTime();
          return dateB - dateA;
        });

        setDbShops(shopsData);
        setDbRecentRecords(sortedRecords.slice(0, 3));
        setUnitPrice(electricityPrice);
      } catch (error) {
        setNotification({
          open: true,
          message: "โหลดข้อมูลไม่สำเร็จ",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const buildingOptions = useMemo(
    () =>
      [...new Set(dbShops.map((s) => s.location).filter(Boolean))].sort(
        (a, b) => {
          const numA = parseInt(a || "0");
          const numB = parseInt(b || "0");
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return (a || "").localeCompare(b || "");
        }
      ),
    [dbShops]
  );

  const shopOptions = useMemo(() => {
    if (!selectedBuilding) return [];
    return dbShops
      .filter((s) => s.location === selectedBuilding)
      .map((s) => ({
        label: `${s.shop_no} - ${s.member?.name || "ไม่ระบุ"}`,
        shop: s,
      }));
  }, [selectedBuilding, dbShops]);

  // 2. Load Meter & Check Existing
  useEffect(() => {
    const loadMeterAndCheckExisting = async () => {
      if (!selectedShop) {
        setFormData((p) => ({
          ...p,
          previousMeter: "",
          currentMeter: "",
          difference: "",
          amount: "0",
        }));
        setExistingBill(null);
        setIsEditMode(false);
        return;
      }
      setIsFetchingMeter(true);
      const [prevMeter, existing] = await Promise.all([
        ShopService.getPreviousElectMeter(
          selectedShop.shop_id,
          formData.month,
          formData.year
        ),
        ShopService.getExistingBill(
          selectedShop.shop_id,
          formData.month,
          formData.year
        ),
      ]);
      setExistingBill(existing);

      if (existing && existing.elect_record_date) {
        setIsEditMode(true);
        const diff = existing.elect_unit_diff || 0;

        // Use BillCalculationService to calculate amount
        const calculation = BillCalculationService.calculateAmount(
          existing.elect_unit_previous || 0,
          existing.elect_unit_current || 0,
          unitPrice
        );

        setCalculatedAmount(calculation.formattedAmount);
        setFormData((p) => ({
          ...p,
          previousMeter: existing.elect_unit_previous?.toString() || "0",
          currentMeter: existing.elect_unit_current?.toString() || "",
          difference: diff.toString(),
          amount: existing.elect_amount?.toString() || "0",
        }));
      } else {
        setIsEditMode(false);
        setCalculatedAmount("0");
        setFormData((p) => ({
          ...p,
          previousMeter: prevMeter,
          currentMeter: "",
          difference: "",
          amount: "0",
        }));
      }
      setIsFetchingMeter(false);
    };
    loadMeterAndCheckExisting();
  }, [selectedShop, formData.month, formData.year, unitPrice]);

  const handleCloseNotification = () =>
    setNotification((p) => ({ ...p, open: false }));

  const handleBuildingChange = (v: string | null | undefined) => {
    setSelectedBuilding(v || null);
    setSelectedShop(null);
  };

  const handleShopChange = (
    opt: { label: string; shop: ShopWithMember } | null
  ) => {
    setSelectedShop(opt ? opt.shop : null);
  };

  const handleCurrentMeterChange = (v: string) => {
    if (v.length > 7) return;
    // Use BillCalculationService to calculate amount
    const calculation = BillCalculationService.calculateAmount(
      formData.previousMeter,
      v,
      unitPrice
    );

    setCalculatedAmount(calculation.formattedAmount);
    setFormData((p) => ({
      ...p,
      currentMeter: v,
      difference: calculation.difference.toFixed(0),
      amount: calculation.formattedAmount,
    }));
  };

  const handleManualAdjust = (field: "difference" | "amount", value: string) => {
    if (field === "difference") {
      const numDiff = value === "" ? 0 : Number(value);

      // Use BillCalculationService to calculate amount from difference
      const calculation = BillCalculationService.calculateAmount(
        0,
        numDiff,
        unitPrice
      );

      setCalculatedAmount(calculation.formattedAmount);
      setFormData((p) => ({
        ...p,
        difference: value === "" ? "" : numDiff.toString(),
        amount: calculation.formattedAmount,
      }));
    } else {
      if (value.length > 10) return;
      const cleanValue = value.replace(/^0+(?!\.|$)/, "");
      setFormData((p) => ({ ...p, amount: cleanValue || "0" }));
    }
  };

  // --- ✅ BULK MODE FUNCTIONS (Shop) ---

  const handleOpenBulkDialog = async () => {
    if (!selectedBuilding) {
      showNotification("กรุณาเลือกอาคาร/โซนก่อน", "warning");
      return;
    }
    setOpenBulkDialog(true);
    setIsBulkLoading(true);

    try {
      // 1. หา Shop ทั้งหมดในโซนที่เลือก
      const shopsInZone = dbShops
        .filter(s => s.location === selectedBuilding)
        .sort((a, b) => (a.shop_no || "").localeCompare(b.shop_no || ""));

      // 2. ดึงข้อมูลมิเตอร์
      const promises = shopsInZone.map(async (shop) => {
        const [prevMeter, existing] = await Promise.all([
          ShopService.getPreviousElectMeter(shop.shop_id, formData.month, formData.year),
          ShopService.getExistingBill(shop.shop_id, formData.month, formData.year)
        ]);
        
        // ถ้ามีบิลแล้ว
        if (existing && existing.elect_record_date) {
            return {
                shop,
                previousMeter: existing.elect_unit_previous?.toString() || "0",
                currentMeter: existing.elect_unit_current?.toString() || "",
                difference: existing.elect_unit_diff?.toString() || "0",
                amount: existing.elect_amount?.toString() || "0",
                status: "done" as const,
                existingBillId: existing.bill_id.toString()
            };
        }

        // ยังไม่มี
        return {
          shop,
          previousMeter: prevMeter,
          currentMeter: "",
          difference: "",
          amount: "0",
          status: "pending" as const,
        };
      });

      const items = await Promise.all(promises);
      setBulkItems(items);

    } catch (error) {
      console.error(error);
      showNotification("เกิดข้อผิดพลาดในการเตรียมข้อมูลแบบกลุ่ม", "error");
      setOpenBulkDialog(false);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkItemChange = (index: number, newCurrentMeter: string) => {
    if (newCurrentMeter.length > 7) return;

    const newItems = [...bulkItems];
    const item = newItems[index];

    const calculation = BillCalculationService.calculateAmount(
      item.previousMeter,
      newCurrentMeter,
      unitPrice
    );

    newItems[index] = {
      ...item,
      currentMeter: newCurrentMeter,
      difference: calculation.difference.toFixed(0),
      amount: calculation.formattedAmount,
      status: "pending" // Reset status to pending
    };

    setBulkItems(newItems);
  };

  const handleBulkSubmit = async () => {
    // กรองรายการที่พร้อมบันทึก (มีค่า, ถูกต้อง, ยังไม่ Done)
    const itemsToSave = bulkItems.filter(item => 
        item.currentMeter !== "" && 
        parseFloat(item.currentMeter) >= parseFloat(item.previousMeter) &&
        item.status !== 'done' // ✅ Smart Save Logic
    );

    if (itemsToSave.length === 0) {
        const hasErrorInput = bulkItems.some(item => 
            item.currentMeter !== "" && parseFloat(item.currentMeter) < parseFloat(item.previousMeter)
        );

        if (hasErrorInput) {
            showNotification("พบรายการที่ข้อมูลไม่ถูกต้อง (เลขมิเตอร์น้อยกว่าครั้งก่อน)", "warning");
        } else {
             showNotification("ไม่มีรายการใหม่ที่ต้องบันทึก", "warning");
        }
        return;
    }

    setIsBulkLoading(true);

    let successCount = 0;
    const newItems = [...bulkItems];

    for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        
        // Validation
        if (item.currentMeter === "" || parseFloat(item.currentMeter) < parseFloat(item.previousMeter)) {
             continue;
        }

        // Smart Save Skip
        if (item.status === 'done') {
            continue;
        }

        try {
            newItems[i].status = "saving";
            setBulkItems([...newItems]);

            const monthIndex = thaiMonths.indexOf(formData.month) + 1;
            
            // ✅ Save Shop Elect Bill
            await ShopService.saveBill({
                shop_id: item.shop.shop_id,
                month: monthIndex.toString(),
                year: formData.year,
                elect_unit_previous: item.previousMeter,
                elect_unit_current: item.currentMeter,
                elect_unit_diff: item.difference,
                elect_amount: item.amount,
                amount_edited: false
            });

            newItems[i].status = "done";
            newItems[i].errorMsg = undefined;
            successCount++;
        } catch (error) {
            newItems[i].status = "error";
            newItems[i].errorMsg = "บันทึกไม่สำเร็จ";
        }
    }

    setBulkItems(newItems);
    setIsBulkLoading(false);
    
    // Refresh List
    const updatedRecords = await ShopService.getRecentElectBills();
    const sortedUpdatedRecords = updatedRecords.sort((a, b) => {
        const dateA = new Date(a.elect_record_date || 0).getTime();
        const dateB = new Date(b.elect_record_date || 0).getTime();
        return dateB - dateA;
    });
    setDbRecentRecords(sortedUpdatedRecords.slice(0, 3));

    if (successCount > 0) {
        showNotification(`บันทึกสำเร็จ ${successCount} รายการ`, "success");
    }
  };

  // ---------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const prev = parseFloat(formData.previousMeter || "0");
    const curr = parseFloat(formData.currentMeter || "0");

    if (
      !selectedBuilding ||
      !selectedShop ||
      !formData.currentMeter ||
      (formData.currentMeter !== "" && curr < prev) ||
      !formData.difference
    ) {
      showNotification("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
      return;
    }

    setIsLoading(true);
    try {
      const monthIndex = thaiMonths.indexOf(formData.month) + 1;

      // ✅ Detect if amount was manually edited by admin
      const isAmountEdited = parseFloat(formData.amount) !== parseFloat(calculatedAmount);

      await ShopService.saveBill({
        shop_id: selectedShop!.shop_id,
        month: monthIndex.toString(),
        year: formData.year,
        elect_unit_previous: formData.previousMeter,
        elect_unit_current: formData.currentMeter,
        elect_unit_diff: formData.difference,
        elect_amount: formData.amount,
        amount_edited: isAmountEdited,
      });
      setOpenSuccessDialog(true);

      const updatedRecords = await ShopService.getRecentElectBills();
      const sortedUpdatedRecords = updatedRecords.sort((a, b) => {
        const dateA = new Date(a.elect_record_date || 0).getTime();
        const dateB = new Date(b.elect_record_date || 0).getTime();
        return dateB - dateA;
      });
      setDbRecentRecords(sortedUpdatedRecords.slice(0, 3));

      setIsSubmitted(false);
    } catch (error: any) {
      showNotification("บันทึกไม่สำเร็จ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    setSelectedBuilding(null);
    setSelectedShop(null);
    setCalculatedAmount("0");
    setFormData({
      month: currentMonth,
      year: currentYearBE.toString(),
      previousMeter: "",
      currentMeter: "",
      difference: "",
      amount: "0",
    });
  };

  const showNotification = (message: string, severity: "success" | "error" | "warning") => {
    setNotification({ open: true, message, severity });
  };

  if (isLoading)
    return (
      <MainLayout IsMobile={false}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            height: "80vh",
            alignItems: "center",
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading...</Typography>
        </Box>
      </MainLayout>
    );

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#94a3b8' }} />}
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
          <Typography className="breadcrumb-current">บันทึกค่าไฟร้านค้า</Typography>
        </Breadcrumbs>

        <Paper
          elevation={3}
          sx={{ p: 3, mb: 5, borderRadius: 3, border: "1px solid #e7ebff" }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontSize: 18, fontWeight: 600, color: "#35373b" }}
              >
                บันทึกค่าไฟร้านค้า
              </Typography>
            </Box>

            {isEditMode && existingBill && (
              <Alert severity="warning" icon={<EditIcon />} sx={{ 
                  mb: 3,
                  bgcolor: '#fff3e0',
                  border: '1px solid #ffe0b2',
                  '& .MuiAlert-icon': { color: '#ff9800' }
              }}>
                  <Typography sx={{ fontWeight: 600, mb: 0.5, color: '#e65100' }}>
                    พบข้อมูลการบันทึกแล้ว - กำลังอยู่ในโหมดแก้ไข
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e65100' }}>
                    ร้านค้านี้มีการบันทึกค่าไฟสำหรับเดือน {formData.month}{" "}
                    {formData.year} แล้ว
                    {" ("}บันทึกเมื่อ:{" "}{formatDisplayDate(existingBill.elect_record_date)}{")"}
                  </Typography>
              </Alert>
            )}

            {/* ส่วนที่ 1: ข้อมูลร้านค้า */}
            <Box sx={{ mb: 3 }}>
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
                  ข้อมูลร้านค้า
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Stack
                direction="row"
                spacing={2}
                alignItems="flex-start" // changed to flex-start for alignment
                sx={{ mb: 2 }}
              >
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={buildingOptions}
                        value={selectedBuilding}
                        onChange={(_, v) => handleBuildingChange(v)}
                        renderInput={(p) => (
                        <TextField
                            {...p}
                            label="อาคาร/โซน *"
                            error={fieldErrors.building}
                            helperText={fieldErrors.building && "กรุณาเลือกอาคาร"}
                            sx={{ bgcolor: "white" }}
                        />
                        )}
                    />
                    {/* ✅ ปุ่มบันทึกหลายรายการ */}
                    <Tooltip title={!selectedBuilding ? "กรุณาเลือกอาคารก่อน" : "บันทึกหลายรายการในอาคารนี้"}>
                        <span>
                            <Button 
                                variant="contained" 
                                color="primary"
                                sx={{ whiteSpace: 'nowrap', height: 40 }}
                                startIcon={<PlaylistAddIcon />}
                                disabled={!selectedBuilding}
                                onClick={handleOpenBulkDialog}
                            >
                                บันทึกหลายรายการ
                            </Button>
                        </span>
                    </Tooltip>
                  </Box>
                  
                  <Autocomplete
                    size="small"
                    options={shopOptions}
                    value={
                      shopOptions.find(
                        (o) => o.shop.shop_id === selectedShop?.shop_id
                      ) || null
                    }
                    onChange={(_, v) => handleShopChange(v)}
                    disabled={!selectedBuilding}
                    renderInput={(p) => (
                      <TextField
                        {...p}
                        label="ร้านค้า *"
                        error={fieldErrors.shop}
                        helperText={fieldErrors.shop && "กรุณาเลือกร้านค้า"}
                        sx={{ bgcolor: "white" }}
                      />
                    )}
                  />
                </Box>
                <Box
                  sx={{
                    bgcolor: "#f5f5f5",
                    p: 2,
                    borderRadius: 1,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: 104
                  }}
                >
                  {selectedShop ? (
                    <Box>
                      <Typography sx={{ fontSize: 14 }}>
                        <strong>ชื่อร้าน/ผู้เช่า:</strong>{" "}
                        {selectedShop.member?.name}{" "}
                        {selectedShop.member?.surname}
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        <strong>เบอร์โทร:</strong>{" "}
                        {selectedShop.member?.phone || "-"}
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        <strong>ที่ตั้ง:</strong> {selectedShop.location} ห้อง{" "}
                        {selectedShop.shop_no}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      sx={{ fontSize: 14, color: "#999", textAlign: "center" }}
                    >
                      เลือกร้านค้าเพื่อแสดงข้อมูล
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* ส่วนที่ 2: ข้อมูลมิเตอร์และการคำนวณ */}
            <Box sx={{ mb: 3 }}>
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
                  ข้อมูลมิเตอร์และการคำนวณ
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="stretch">
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1.5,
                    }}
                  >
                    <Autocomplete
                      size="small"
                      options={thaiMonths}
                      value={formData.month}
                      onChange={(_, v) =>
                        setFormData((p) => ({ ...p, month: v || "" }))
                      }
                      renderInput={(p) => <TextField {...p} label="เดือน" />}
                    />
                    <Autocomplete
                      size="small"
                      options={years}
                      value={formData.year}
                      onChange={(_, v) =>
                        setFormData((p) => ({ ...p, year: v || "" }))
                      }
                      renderInput={(p) => <TextField {...p} label="ปี" />}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="เลขมิเตอร์ครั้งก่อน"
                      value={formData.previousMeter}
                      slotProps={{
                        input: {
                          readOnly: true,
                          endAdornment: isFetchingMeter ? (
                            <CircularProgress size={20} />
                          ) : null,
                        },
                      }}
                      sx={{ bgcolor: "#f5f5f5" }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="เลขมิเตอร์ครั้งหลัง *"
                      type="number"
                      value={formData.currentMeter}
                      onChange={(e) => handleCurrentMeterChange(e.target.value)}
                      disabled={!selectedShop}
                      error={
                        fieldErrors.currentMeter || fieldErrors.invalidValue
                      }
                      helperText={
                        fieldErrors.invalidValue
                          ? "น้อยกว่าครั้งก่อน"
                          : fieldErrors.currentMeter && "กรุณากรอกเลขมิเตอร์"
                      }
                    />
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "#e8f5e9",
                      border: "1px solid #4caf50",
                      borderRadius: 1,
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                      จำนวนหน่วยที่ใช้:
                    </Typography>
                    <Typography variant="h6" sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                      {formData.difference || "0"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                      หน่วย
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    bgcolor: "rgb(227, 242, 253)",
                    border: "1px solid rgb(144, 202, 249)",
                    borderRadius: 1,
                    p: 2,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: 16, fontWeight: 'bold' }}
                  >
                    ยอดเงินที่ต้องชำระ
                  </Typography>
                  <TextField
                    fullWidth
                    size="medium"
                    variant="outlined"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      handleManualAdjust("amount", e.target.value)
                    }
                    onFocus={(e) => e.target.select()}
                    inputProps={{
                      style: {
                        textAlign: "center",
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#1976d2",
                      },
                    }}
                    sx={{ width: "80%", bgcolor: "white" }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">บาท</InputAdornment>
                        ),
                      },
                    }}
                  />
                  {isAmountManuallyEdited && (
                    <Box
                      sx={{
                        mt: 1,
                        px: 2,
                        py: 0.5,
                        bgcolor: "#fff3e0",
                        border: "1px solid #ff9800",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16, color: "#ff9800" }} />
                      <Typography
                        variant="caption"
                        sx={{ color: "#e65100", fontWeight: 600 }}
                      >
                        แก้ไขโดยผู้ดูแล (ปกติ: {formatBaht(parseFloat(calculatedAmount))})
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ mt: 3 }}
            >
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => router.push("/admin/main")}
                sx={{ color: '#64748b', borderColor: '#cbd5e1' }}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isEditMode ? <EditIcon /> : <SaveIcon />}
                disabled={isLoading}
                sx={{ bgcolor: isEditMode ? "#ff9800" : "#4caf50", '&:hover': { bgcolor: isEditMode ? "#e65100" : "#388e3c" } }}
              >
                {isEditMode ? "แก้ไข" : "บันทึก"}
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* ตารางบันทึกล่าสุด */}
        <Paper
          elevation={3}
          sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e7ebff" }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 16, fontWeight: 600, mb: 3, color: "#35373b" }}
          >
            รายการบันทึกหน่วยไฟฟ้า (3 รายการล่าสุด)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#e4eef8" }}>
                  {[
                    "วันที่บันทึก",
                    "ที่ตั้ง/เลขที่ร้าน",
                    "ชื่อ-นามสกุล",
                    "ประจำเดือน",
                    "เลขมิเตอร์ก่อน",
                    "เลขมิเตอร์หลัง",
                    "หน่วยที่ใช้",
                    "จำนวนเงิน",
                  ].map((h) => (
                    <TableCell key={h} align="center" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dbRecentRecords.length > 0 ? (
                  dbRecentRecords.map((r) => (
                    <TableRow key={r.bill_id}>
                      <TableCell align="center">
                        {formatDisplayDate(r.elect_record_date)}
                      </TableCell>
                      <TableCell align="center">
                        {r.shop?.location} {r.shop?.shop_no}
                      </TableCell>
                      <TableCell align="center">
                        {r.member?.name} {r.member?.surname}
                      </TableCell>
                      <TableCell align="center">
                        {r.month} {r.year}
                      </TableCell>
                      <TableCell align="center">
                        {r.elect_unit_previous}
                      </TableCell>
                      <TableCell align="center">
                        {r.elect_unit_current}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          component="span"
                          sx={{
                            bgcolor: "#e8f5e9",
                            color: "#2e7d32",
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 500
                          }}
                        >
                          {r.elect_unit_diff} หน่วย
                        </Box>
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        {formatBaht(r.elect_amount ?? 0)} ฿
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: '#94a3b8', py: 3 }}>
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* --- ✅ MODAL: บันทึกแบบกลุ่ม (Shop) --- */}
        <Dialog 
            open={openBulkDialog} 
            onClose={() => !isBulkLoading && setOpenBulkDialog(false)}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: '80vh', borderRadius: 3 } }}
        >
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
                {/* ✅ component="div" ป้องกัน error nesting */}
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    บันทึกค่าไฟรายโซน: {selectedBuilding} (ประจำเดือน {formData.month} {formData.year})
                </Typography>
                <IconButton onClick={() => setOpenBulkDialog(false)} disabled={isBulkLoading} sx={{ color: 'white' }}>
                    <CancelIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, bgcolor: '#f8fafc' }}>
                {isBulkLoading && bulkItems.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2, color: '#64748b' }}>กำลังดึงข้อมูลมิเตอร์ทุกร้าน...</Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ height: '65vh' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b' }}>เลขที่ร้าน</TableCell>
                                    <TableCell sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b' }}>ชื่อผู้เช่า</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b' }}>มิเตอร์ก่อน</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b', width: 150 }}>มิเตอร์หลัง</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b' }}>หน่วยใช้</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b' }}>ค่าไฟ (บาท)</TableCell>
                                    {/* ✅ width 120 */}
                                    <TableCell align="center" sx={{ bgcolor: '#e4eef8', fontWeight: 'bold', color: '#1e293b', width: 120 }}>สถานะ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bulkItems.map((item, index) => {
                                    const isError = item.currentMeter !== "" && parseFloat(item.currentMeter) < parseFloat(item.previousMeter);
                                    const isSaved = item.status === "done";
                                    
                                    return (
                                        <TableRow key={index} hover sx={{ bgcolor: isSaved ? '#f0fdf4' : 'inherit' }}>
                                            <TableCell sx={{ color: '#334155' }}>{item.shop.shop_no}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 150, color: '#334155' }}>
                                                    {item.shop.member?.name} {item.shop.member?.surname}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: '#94a3b8' }}>{item.previousMeter}</TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={item.currentMeter}
                                                    onChange={(e) => handleBulkItemChange(index, e.target.value)}
                                                    error={isError}
                                                    disabled={isBulkLoading}
                                                    sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                                    inputProps={{ style: { textAlign: 'right' } }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: isError ? '#ef4444' : '#334155' }}>
                                                {item.difference || "-"}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                {item.amount !== "0" ? formatBaht(parseFloat(item.amount)) : "-"}
                                            </TableCell>
                                            <TableCell align="center">
                                                {item.status === "saving" && <CircularProgress size={20} />}
                                                {/* ✅ whiteSpace: 'nowrap' */}
                                                {item.status === "done" && <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold', bgcolor: '#dcfce7', px: 1, py: 0.5, borderRadius: 1, whiteSpace: 'nowrap' }}>บันทึกแล้ว</Typography>}
                                                {item.status === "error" && (
                                                    <Tooltip title={item.errorMsg || "Error"}>
                                                        <Typography variant="caption" sx={{ color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold', bgcolor: '#fee2e2', px: 1, py: 0.5, borderRadius: 1, whiteSpace: 'nowrap' }}>ผิดพลาด</Typography>
                                                    </Tooltip>
                                                )}
                                                {item.status === "pending" && item.currentMeter !== "" && !isError && (
                                                     <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 'bold', bgcolor: '#ffedd5', px: 1, py: 0.5, borderRadius: 1, whiteSpace: 'nowrap' }}>รอเซฟ</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                <Typography variant="body2" sx={{ flex: 1, ml: 2, color: '#64748b', fontStyle: 'italic' }}>
                    * ระบบจะบันทึกเฉพาะรายการที่กรอกข้อมูลถูกต้องและยังไม่ได้บันทึก
                </Typography>
                <Button onClick={() => setOpenBulkDialog(false)} sx={{ color: '#64748b', borderColor: '#cbd5e1' }} variant="outlined" disabled={isBulkLoading}>
                    ปิดหน้าต่าง
                </Button>
                <Button 
                    onClick={handleBulkSubmit} 
                    variant="contained" 
                    sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, px: 3 }}
                    startIcon={isBulkLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={isBulkLoading}
                >
                    บันทึกทุกรายการ
                </Button>
            </DialogActions>
        </Dialog>

        {/* Success Dialog แบบละเอียด (Single Mode) */}
        <Dialog
          open={openSuccessDialog}
          onClose={handleCloseSuccessDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle
            sx={{
              bgcolor: isEditMode ? "#ff9800" : "#4caf50",
              color: "white",
              textAlign: "center",
              py: 2
            }}
          >
            {/* ✅ component="div" Fix */}
            <Typography variant="h6" component="div" fontWeight="bold">
              {isEditMode ? "แก้ไขข้อมูลสำเร็จ" : "บันทึกข้อมูลสำเร็จ"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 3, pb: 2 }}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography sx={{ fontSize: 18, color: "#35373b", mb: 3, fontWeight: 500 }}>
                {isEditMode
                  ? "แก้ไขค่าไฟฟ้าเรียบร้อยแล้ว"
                  : "บันทึกค่าไฟฟ้าเรียบร้อยแล้ว"}
              </Typography>
              <Box sx={{ bgcolor: "#f8fafc", p: 3, borderRadius: 2, mb: 2, border: '1px solid #e2e8f0', textAlign: 'left' }}>
                <Stack spacing={1.5}>
                  <Typography sx={{ fontSize: 15, color: "#334155" }}>
                    <strong>ร้านค้า:</strong> {selectedShop?.location}{" "}
                    {selectedShop?.shop_no}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: "#334155" }}>
                    <strong>ชื่อ-นามสกุล:</strong> {selectedShop?.member?.name}{" "}
                    {selectedShop?.member?.surname}
                  </Typography>
                  <Divider />
                  <Typography sx={{ fontSize: 15, color: "#334155" }}>
                    <strong>ประจำเดือน:</strong> {formData.month} {formData.year}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: "#334155" }}>
                    <strong>หน่วยที่ใช้:</strong> {formData.difference} หน่วย
                  </Typography>
                  <Typography
                    sx={{ fontSize: 18, color: "#1976d2", fontWeight: 700, mt: 1 }}
                  >
                    <strong>จำนวนเงิน:</strong>{" "}
                    {formatBaht(parseFloat(formData.amount))} บาท
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
            <Button
              variant="contained"
              onClick={handleCloseSuccessDialog}
              sx={{
                bgcolor: isEditMode ? "#ff9800" : "#4caf50",
                '&:hover': { bgcolor: isEditMode ? "#e65100" : "#388e3c" },
                color: "white",
                px: 5,
                py: 1,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%", borderRadius: 2, fontWeight: 500 }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </MainLayout>
  );
}

export default function ShopRecordElectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopRecordElectContent />
    </Suspense>
  );
}