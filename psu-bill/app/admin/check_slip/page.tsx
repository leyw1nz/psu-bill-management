"use client";

import React, { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link as MLink,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
  Tooltip,
  InputLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  FactCheck as FactCheckIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import MainLayout from "@/components/MainLayout";

import type { AdminSlipRow, SlipDecisionAction, SlipKind, SlipStatusFilter } from "@/types";
import { SlipService } from "@/lib/services/slipService";
import { thaiMonths } from "@/lib/utils";

// --- Helpers ---
function formatCurrency(amount?: number | null) {
  return (amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(month?: number, year?: number): string {
  if (!month || !year) return "-";
  const monthName = thaiMonths[month - 1] || month.toString();
  return `${monthName} ${year}`;
}

type StatusUI = SlipStatusFilter;

/**
 * ✅ กติกาใหม่:
 * - ถ้า status ว่าง/NULL => "unpaid"
 * - deny/ไม่ผ่าน/ค้าง => "unpaid" (ไปอยู่รอชำระ)
 * - pending => "pending"
 * - paid => "paid"
 */
function normalizeStatusToUI(raw?: string | null): StatusUI {
  const text = String(raw || "").trim();

  // ✅ ไม่มีสถานะ -> ถือว่า "รอชำระ"
  if (!text) return "unpaid";

  // paid
  if (text.includes("ชำระแล้ว") || text.includes("ผ่าน") || text === "paid") return "paid";

  // pending
  if (text.includes("รอตรวจ") || text.includes("รอพิจารณา") || text === "pending") return "pending";

  // unpaid (รวม deny/ค้าง/ไม่ผ่าน)
  if (
    text.includes("รอชำระ") ||
    text.includes("ค้าง") ||
    text.includes("ไม่ผ่าน") ||
    text.includes("ปฏิเสธ") ||
    text === "unpaid"
  ) {
    return "unpaid";
  }

  // default
  return "unpaid";
}

function getStatusChip(label?: string | null) {
  const ui = normalizeStatusToUI(label);

  if (ui === "unpaid") return { text: "รอชำระ", sx: { bgcolor: "#ED6C02", color: "#fff", border: "none" } };
  if (ui === "pending") return { text: "รอตรวจสอบ", sx: { bgcolor: "#0288D1", color: "#fff", border: "none" } };
  return { text: "ชำระแล้ว", sx: { bgcolor: "#2E7D32", color: "#fff", border: "none" } };
}

function shouldShowByFilter(statusName: string | null | undefined, filter: StatusUI) {
  if (filter === "all") return true;
  return normalizeStatusToUI(statusName) === filter;
}

type DecisionDialogState = {
  open: boolean;
  row?: AdminSlipRow;
  kind?: SlipKind;
};

type ChangeStatusDialogState = {
  open: boolean;
  row?: AdminSlipRow;
  kind?: SlipKind;
  currentStatusId?: number;
};

export default function CheckSlipPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminSlipRow[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusUI>("pending");
  const [kindFilter] = useState<SlipKind | "ALL">("ALL");

  const [decisionDlg, setDecisionDlg] = useState<DecisionDialogState>({ open: false });
  const [changeStatusDlg, setChangeStatusDlg] = useState<ChangeStatusDialogState>({ open: false });
  const [imageError, setImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error">("success");

  const fetchSlips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SlipService.getAdminSlips({
        q,
        status: statusFilter,
        kind: kindFilter,
      });
      setRows(data);
    } catch (e: any) {
      console.error(e);
      setResultType("error");
      setResultMessage(e?.message || "เกิดข้อผิดพลาด");
      setOpenResultDialog(true);
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, kindFilter]);

  useEffect(() => {
    fetchSlips();
  }, [fetchSlips]);

  const handleOpenDecision = (row: AdminSlipRow, kind: SlipKind) => {
    setDecisionDlg({ open: true, row, kind });
    setImageError(false);
  };

  const handleCloseDecision = () => setDecisionDlg((prev) => ({ ...prev, open: false }));

  const handleOpenChangeStatus = (row: AdminSlipRow, kind: SlipKind) => {
    const currentStatusId = kind === "ELECT"
      ? getStatusIdFromName(row.elect_status_name)
      : getStatusIdFromName(row.water_status_name);
    setChangeStatusDlg({ open: true, row, kind, currentStatusId });
  };

  const handleCloseChangeStatus = () => setChangeStatusDlg({ open: false });

  const getStatusIdFromName = (statusName?: string | null): number => {
    const ui = normalizeStatusToUI(statusName);
    if (ui === "paid") return 3;
    if (ui === "pending") return 2;
    return 1; // unpaid
  };

  const handleConfirmChangeStatus = async (newStatusId: number) => {
    if (!changeStatusDlg.row || !changeStatusDlg.kind) return;

    setIsSubmitting(true);
    try {
      await SlipService.changeStatus({
        billId: changeStatusDlg.row.bill_id,
        kind: changeStatusDlg.kind,
        statusId: newStatusId,
      });

      setResultType("success");
      setResultMessage("เปลี่ยนสถานะสำเร็จ");

      handleCloseChangeStatus();
      setOpenResultDialog(true);
      fetchSlips();
    } catch (e: any) {
      setResultType("error");
      setResultMessage(e?.message || "เกิดข้อผิดพลาด");
      setOpenResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDecision = async (action: SlipDecisionAction) => {
    if (!decisionDlg.row || !decisionDlg.kind) return;

    setIsSubmitting(true);
    try {
      await SlipService.decideSlip({
        billId: decisionDlg.row.bill_id,
        kind: decisionDlg.kind,
        action,
      });

      // ✅ approve = success, deny = กลับไปรอชำระ (แต่เป็นผลสำเร็จของการบันทึก)
      setResultType("success");
      setResultMessage(action === "approve" ? "อนุมัติรายการสำเร็จ" : 'ตั้งสถานะกลับเป็น "รอชำระ" เรียบร้อยแล้ว');

      handleCloseDecision();
      setOpenResultDialog(true);
      fetchSlips();
    } catch (e: any) {
      setResultType("error");
      setResultMessage(e?.message || "เกิดข้อผิดพลาด");
      setOpenResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="lg">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#ffffff' }} />}
          aria-label="breadcrumb"
          className="breadcrumb-card"
        >
          <Box onClick={() => window.location.href = '/main'} className="breadcrumb-link">
            <HomeIcon className="breadcrumb-icon" />
            <Typography className="breadcrumb-text">หน้าหลัก</Typography>
          </Box>
          <Box onClick={() => window.location.href = '/admin/main'} className="breadcrumb-link">
            <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
          </Box>
          <Typography className="breadcrumb-current">ตรวจสอบสลิปการชำระเงิน</Typography>
        </Breadcrumbs>

        <Paper elevation={3} sx={{ my: 2, p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#35373b", mb: 3 }}>
            ตรวจสอบสลิปการชำระเงิน
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาด้วยรหัสร้าน, ชื่อร้าน หรือโซน"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchSlips();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#666" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <FormControl sx={{ width: { xs: "100%", md: 250 } }}>
              <InputLabel size="small">สถานะ</InputLabel>
              <Select
                size="small"
                value={statusFilter}
                label="สถานะ"
                onChange={(e) => setStatusFilter(e.target.value as StatusUI)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="unpaid">รอชำระ</MenuItem>
                <MenuItem value="pending">รอตรวจสอบ</MenuItem>
                <MenuItem value="paid">ชำระแล้ว</MenuItem>
                <MenuItem value="all">ทั้งหมด</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Typography sx={{ mb: 2, color: "#666" }}>พบ {rows.length} รายการ</Typography>

          <TableContainer sx={{ borderRadius: 2, border: "1px solid #eee" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>รหัสร้าน</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ชื่อร้าน</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>เดือน</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    จำนวนเงิน (บาท)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>วันที่ส่ง</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    สถานะ
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const renderRowItem = (kind: SlipKind) => {
                      const amount = kind === "ELECT" ? row.elect_amount : row.water_amount;
                      const statusName = kind === "ELECT" ? row.elect_status_name : row.water_status_name;
                      const slip = kind === "ELECT" ? row.elect_pay_slip_image : row.water_pay_slip_image;

                      const chip = getStatusChip(statusName);

                      return (
                        <TableRow key={`${row.bill_id}-${kind}`} sx={{ "&:hover": { bgcolor: "#f9f9f9" } }}>
                          <TableCell>{row.shop_id}</TableCell>
                          <TableCell>{row.shop_name ?? ""}</TableCell>
                          <TableCell>
                            {row.bill_month}/{row.bill_year} ({kind === "ELECT" ? "ไฟ" : "น้ำ"})
                          </TableCell>
                          <TableCell align="right">{formatCurrency(amount)}</TableCell>
                          <TableCell>{row.submit_date ?? "-"}</TableCell>

                          <TableCell align="center">
                            <Chip
                              label={chip.text}
                              sx={{ ...chip.sx, fontWeight: 600, borderRadius: "16px", height: 28, minWidth: 120 }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              {slip ? (
                                <Tooltip title="ตรวจสอบสลิป">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDecision(row, kind)}
                                    sx={{ color: "#1976d2", "&:hover": { bgcolor: "#e3f2fd" } }}
                                  >
                                    <FactCheckIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <IconButton disabled size="small">
                                  <CloseIcon fontSize="small" sx={{ color: "#ccc" }} />
                                </IconButton>
                              )}
                              <Tooltip title="เปลี่ยนสถานะ">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenChangeStatus(row, kind)}
                                  sx={{ color: "#f57c00", "&:hover": { bgcolor: "#fff3e0" } }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    };

                    const showElect = row.elect_amount > 0 && shouldShowByFilter(row.elect_status_name, statusFilter);
                    const showWater = row.water_amount > 0 && shouldShowByFilter(row.water_status_name, statusFilter);

                    if (!showElect && !showWater) return null;

                    return (
                      <React.Fragment key={`bill-${row.bill_id}`}>
                        {showElect && renderRowItem("ELECT")}
                        {showWater && renderRowItem("WATER")}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Decision Dialog */}
        <Dialog open={decisionDlg.open} onClose={handleCloseDecision} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ตรวจสอบสลิปการชำระเงิน
              </Typography>
              <IconButton onClick={handleCloseDecision} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            {decisionDlg.row && (
              <Box>
                <Paper variant="outlined" sx={{ p: 3, mb: 4, bgcolor: "#fff", borderRadius: 3, borderColor: "#eee" }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        รหัสร้าน
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {decisionDlg.row.shop_id}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ชื่อร้าน
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {decisionDlg.row.shop_name ?? ""}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        เดือน
                      </Typography>
                      <Typography variant="body1">
                        {formatMonthYear(decisionDlg.row.bill_month, decisionDlg.row.bill_year)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        จำนวนเงิน
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#1976d2" }}>
                        {decisionDlg.kind === "ELECT"
                          ? formatCurrency(decisionDlg.row.elect_amount)
                          : formatCurrency(decisionDlg.row.water_amount)}{" "}
                        บาท
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        วันที่ส่ง
                      </Typography>
                      <Typography variant="body1">{decisionDlg.row.submit_date ?? "-"}</Typography>
                    </Box>
                  </Box>
                </Paper>

                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    รูปสลิปการชำระเงิน
                  </Typography>

                  {(() => {
                    const url =
                      decisionDlg.kind === "ELECT"
                        ? decisionDlg.row.elect_pay_slip_image
                        : decisionDlg.row.water_pay_slip_image;

                    if (!imageError && url) {
                      return (
                        <Box
                          component="img"
                          src={url}
                          alt="Payment Slip"
                          onError={() => setImageError(true)}
                          sx={{
                            width: "100%",
                            maxWidth: 600,
                            height: "auto",
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            maxHeight: 500,
                            objectFit: "contain",
                          }}
                        />
                      );
                    }

                    return (
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: 500,
                          height: 350,
                          border: "2px dashed #ccc",
                          borderRadius: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#f8f9fa",
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 60, color: "#bdbdbd", mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          ไม่พบรูปภาพสลิป
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            {(() => {
              const currentStatus =
                decisionDlg.row && decisionDlg.kind
                  ? decisionDlg.kind === "ELECT"
                    ? decisionDlg.row.elect_status_name
                    : decisionDlg.row.water_status_name
                  : "";

              const uiStatus = normalizeStatusToUI(currentStatus);
              const isPending = uiStatus === "pending";

              // ✅ ให้ตัดสินใจได้เฉพาะ "รอตรวจสอบ"
              if (isPending) {
                return (
                  <>
                    <Button
                      onClick={handleCloseDecision}
                      variant="outlined"
                      sx={{ borderRadius: 2, borderColor: "#ccc", color: "#666", px: 3 }}
                    >
                      ยกเลิก
                    </Button>

                    <Button
                      onClick={() => handleConfirmDecision("deny")}
                      variant="contained"
                      startIcon={<CancelIcon />}
                      disabled={isSubmitting}
                      sx={{ borderRadius: 2, bgcolor: "#D32F2F", px: 3 }}
                    >
                      ไม่ผ่าน
                    </Button>

                    <Button
                      onClick={() => handleConfirmDecision("approve")}
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      disabled={isSubmitting}
                      sx={{ borderRadius: 2, bgcolor: "#2E7D32", px: 3 }}
                    >
                      ผ่าน
                    </Button>
                  </>
                );
              }

              return (
                <Button onClick={handleCloseDecision} variant="contained" sx={{ borderRadius: 2 }}>
                  ปิด
                </Button>
              );
            })()}
          </DialogActions>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={changeStatusDlg.open} onClose={handleCloseChangeStatus} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                เปลี่ยนสถานะการชำระเงิน
              </Typography>
              <IconButton onClick={handleCloseChangeStatus} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 2 }}>
            {changeStatusDlg.row && (
              <Box>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#f9f9f9", borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">รหัสร้าน:</Typography>
                      <Typography variant="body2" fontWeight={600}>{changeStatusDlg.row.shop_id}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">ชื่อร้าน:</Typography>
                      <Typography variant="body2" fontWeight={600}>{changeStatusDlg.row.shop_name ?? ""}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">เดือน:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatMonthYear(changeStatusDlg.row.bill_month, changeStatusDlg.row.bill_year)}
                        ({changeStatusDlg.kind === "ELECT" ? "ค่าไฟ" : "ค่าน้ำ"})
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">จำนวนเงิน:</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {changeStatusDlg.kind === "ELECT"
                          ? formatCurrency(changeStatusDlg.row.elect_amount)
                          : formatCurrency(changeStatusDlg.row.water_amount)} บาท
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                  เลือกสถานะใหม่:
                </Typography>

                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant={changeStatusDlg.currentStatusId === 1 ? "contained" : "outlined"}
                    onClick={() => handleConfirmChangeStatus(1)}
                    disabled={isSubmitting || changeStatusDlg.currentStatusId === 1}
                    startIcon={<CancelIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      borderColor: "#ED6C02",
                      color: changeStatusDlg.currentStatusId === 1 ? "#fff" : "#ED6C02",
                      bgcolor: changeStatusDlg.currentStatusId === 1 ? "#ED6C02" : "transparent",
                      "&:hover": { bgcolor: changeStatusDlg.currentStatusId === 1 ? "#d66002" : "#fff3e0" },
                    }}
                  >
                    รอชำระ
                  </Button>

                  <Button
                    fullWidth
                    variant={changeStatusDlg.currentStatusId === 2 ? "contained" : "outlined"}
                    onClick={() => handleConfirmChangeStatus(2)}
                    disabled={isSubmitting || changeStatusDlg.currentStatusId === 2}
                    startIcon={<FactCheckIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      borderColor: "#0288D1",
                      color: changeStatusDlg.currentStatusId === 2 ? "#fff" : "#0288D1",
                      bgcolor: changeStatusDlg.currentStatusId === 2 ? "#0288D1" : "transparent",
                      "&:hover": { bgcolor: changeStatusDlg.currentStatusId === 2 ? "#0277bd" : "#e3f2fd" },
                    }}
                  >
                    รอตรวจสอบ
                  </Button>

                  <Button
                    fullWidth
                    variant={changeStatusDlg.currentStatusId === 3 ? "contained" : "outlined"}
                    onClick={() => handleConfirmChangeStatus(3)}
                    disabled={isSubmitting || changeStatusDlg.currentStatusId === 3}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      borderColor: "#2E7D32",
                      color: changeStatusDlg.currentStatusId === 3 ? "#fff" : "#2E7D32",
                      bgcolor: changeStatusDlg.currentStatusId === 3 ? "#2E7D32" : "transparent",
                      "&:hover": { bgcolor: changeStatusDlg.currentStatusId === 3 ? "#276a2c" : "#e8f5e9" },
                    }}
                  >
                    ชำระแล้ว
                  </Button>
                </Stack>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseChangeStatus}
              variant="outlined"
              disabled={isSubmitting}
              sx={{ borderRadius: 2, borderColor: "#ccc", color: "#666" }}
            >
              ปิด
            </Button>
          </DialogActions>
        </Dialog>

        {/* Result Dialog */}
        <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)} maxWidth="sm" fullWidth>
          <DialogContent sx={{ textAlign: "center", py: 5 }}>
            {resultType === "success" ? (
              <CheckCircleIcon sx={{ fontSize: 80, color: "#4caf50", mb: 2 }} />
            ) : (
              <CancelIcon sx={{ fontSize: 80, color: "#f44336", mb: 2 }} />
            )}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              {resultType === "success" ? "ดำเนินการสำเร็จ" : "ดำเนินการไม่สำเร็จ"}
            </Typography>
            <Typography color="text.secondary">{resultMessage}</Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 4 }}>
            <Button
              onClick={() => setOpenResultDialog(false)}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 4,
                bgcolor: resultType === "success" ? "#2E7D32" : "#D32F2F",
                "&:hover": { bgcolor: resultType === "success" ? "#276a2c" : "#b62828" },
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
