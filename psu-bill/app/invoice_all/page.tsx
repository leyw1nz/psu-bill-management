'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  LinearProgress,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField,
  Checkbox,
  TablePagination,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { thaiMonths } from '@/lib/utils';

interface ShopInvoiceData {
  billId: string;
  memberName: string;
  memberSurname: string;
  fullName: string;
  shopNo: string;
  location: string;
  shopId: string;
  month: string;
  year: string;
  electUnitPrevious: string;
  electUnitCurrent: string;
  electUnitDiff: string;
  electAmount: string;
  electRecordDate: string | null;
  electPayStatusId: number | null;
  electPayStatusName: string | null;
  waterUnitPrevious: string;
  waterUnitCurrent: string;
  waterUnitDiff: string;
  waterAmount: string;
  waterRecordDate: string | null;
  waterPayStatusId: number | null;
  waterPayStatusName: string | null;
  totalAmount: string;
}

interface PayStatus {
  pay_status_id: number;
  name: string | null;
}

export default function InvoiceAllPage() {
  // Get current year and month (Thai Buddhist year)
  const now = new Date();
  const currentYear = (now.getFullYear() + 543).toString();
  const currentMonth = (now.getMonth() + 1).toString();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [data, setData] = useState<ShopInvoiceData[]>([]);
  const [payStatuses, setPayStatuses] = useState<PayStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const invoiceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedPayStatus, setSelectedPayStatus] = useState<string>("");
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Generate year options (current year ± 2 years)
  const yearOptions = [
    (parseInt(currentYear) - 2).toString(),
    (parseInt(currentYear) - 1).toString(),
    currentYear,
    (parseInt(currentYear) + 1).toString(),
  ];

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role_id !== 1) {
      router.push('/');
    }
  }, [router]);

  // Fetch pay statuses and shops on mount
  useEffect(() => {
    const fetchPayStatuses = async () => {
      try {
        const response = await fetch('/api/pay-status');
        const result = await response.json();
        if (result.success) {
          setPayStatuses(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching pay statuses:', err);
      }
    };

    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops?status=active');
        const result = await response.json();
        if (result.success) {
          const shopsData = result.data || [];
          setShops(shopsData);
          // Default select all shops
          setSelectedShops(shopsData.map((shop: any) => shop.shop_id));
        }
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    fetchPayStatuses();
    fetchShops();
  }, []);

  // Fetch invoice data when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedYear) params.append('year', selectedYear);
        if (selectedPayStatus) {
          params.append('elect_status', selectedPayStatus);
          params.append('water_status', selectedPayStatus);
        }

        const response = await fetch(`/api/bills/shop/invoice?${params.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching invoice data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, selectedPayStatus]);

  // Format date for invoice
  const formatInvoiceDate = (dateStr: string | null) => {
    if (!dateStr) return new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format month for display
  const formatMonth = (month: string, year: string) => {
    const monthIndex = parseInt(month) - 1;
    const monthName = monthIndex >= 0 && monthIndex < 12 ? thaiMonths[monthIndex] : month;
    return `${monthName} ${year}`;
  };

  // --------------------------------------------------------------------------
  // Filter Logic For PDF Generation (ต้องครบทั้ง 2 ค่า)
  // --------------------------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = selectedShops.length === 0
      ? data
      : data.filter(invoice => selectedShops.includes(invoice.shopId));

    // กรองเฉพาะรายการที่บันทึกครบถ้วน (น้ำ AND ไฟ)
    result = result.filter(invoice => {
      const hasElectRecord = invoice.electRecordDate && invoice.electRecordDate !== "";
      const hasWaterRecord = invoice.waterRecordDate && invoice.waterRecordDate !== "";
      return hasElectRecord && hasWaterRecord;
    });

    return result;
  }, [data, selectedShops]);

  // --------------------------------------------------------------------------
  // [UPDATED] Filter Shops Logic For Table Display
  // --------------------------------------------------------------------------
  // แก้ไขให้ตารางแสดงเฉพาะร้านที่มีบิลที่สมบูรณ์ (มีทั้งน้ำและไฟ) เท่านั้น
  const filteredShops = useMemo(() => {
    // 1. หา ID ของร้านที่มีการบันทึกครบทั้ง น้ำ และ ไฟ แล้ว
    const validShopIds = data
      .filter(invoice => {
        const hasElect = invoice.electRecordDate && invoice.electRecordDate !== "";
        const hasWater = invoice.waterRecordDate && invoice.waterRecordDate !== "";
        return hasElect && hasWater;
      })
      .map(inv => inv.shopId);

    // 2. กรอง shops เอาเฉพาะร้านที่มี ID อยู่ในรายการที่ครบถ้วน (validShopIds)
    let displayShops = shops.filter(shop => validShopIds.includes(shop.shop_id));

    // 3. กรองตาม Search Query (Logic เดิม)
    if (!searchQuery.trim()) {
      return displayShops;
    }
    
    const query = searchQuery.toLowerCase();
    return displayShops.filter(shop =>
      shop.shop_no?.toLowerCase().includes(query) ||
      shop.location?.toLowerCase().includes(query) ||
      shop.member?.name?.toLowerCase().includes(query) ||
      shop.member?.surname?.toLowerCase().includes(query)
    );
  }, [shops, searchQuery, data]); // เพิ่ม data เป็น dependency

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    setSelectedPayStatus("");
    setSearchQuery("");
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setIsComplete(false);

    setTimeout(() => {
      generatePDF();
    }, 100);
  };

  const generatePDF = async () => {
    try {
      setGenerationProgress(0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      const batchSize = 10;
      const totalInvoices = filteredData.length;

      for (let i = 0; i < totalInvoices; i++) {
        const invoiceElement = invoiceRefs.current[i];
        if (!invoiceElement) continue;

        const scale = totalInvoices > 50 ? 1.5 : 2;
        const canvas = await html2canvas(invoiceElement, {
          scale: scale,
          useCORS: true,
          logging: false,
          imageTimeout: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

        canvas.width = 0;
        canvas.height = 0;

        const progress = Math.round(((i + 1) / totalInvoices) * 100);
        setGenerationProgress(progress);

        if ((i + 1) % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const monthIndex = parseInt(selectedMonth) - 1;
      const monthName = monthIndex >= 0 && monthIndex < 12 ? thaiMonths[monthIndex] : selectedMonth;
      const filename = `ใบแจ้งหนี้ทั้งหมด_${monthName}_${selectedYear}.pdf`;

      pdf.save(filename);
      setIsGenerating(false);
      setIsComplete(true);
      setGenerationProgress(0);

      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Invoice Template Component
  const InvoiceTemplate = ({ invoice, index }: { invoice: ShopInvoiceData; index: number }) => (
    <Box
      ref={(el: HTMLDivElement | null) => {
        invoiceRefs.current[index] = el;
      }}
      sx={{
        width: '210mm',
        minHeight: '297mm',
        position: 'absolute',
        left: '-9999px',
        bgcolor: 'white',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 500, mb: 0.5 }}>
          มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่
        </Typography>
        <Typography sx={{ fontSize: 14, mb: 2 }}>
          ใบแจ้งหนี้และปริมาณการใช้กระแสไฟฟ้าและน้ำประปา
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 500, mt: 2, textAlign: 'right' }}>
          {formatInvoiceDate(invoice.electRecordDate || invoice.waterRecordDate)}
        </Typography>
      </Box>

      {/* Recipient Info */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 14 }}>ชื่อ - สกุล :</Typography>
          <Typography sx={{ fontSize: 14, flex: 1, fontWeight: 600 }}>{invoice.fullName}</Typography>
          <Typography sx={{ fontSize: 14 }}>สถานที่ : {invoice.shopNo} {invoice.location}</Typography>
        </Stack>
        <Typography sx={{ fontSize: 14 }}>
          ค่ากระแสไฟฟ้า - น้ำประปา ประจำเดือน : <b>{formatMonth(invoice.month, invoice.year)}</b>
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Main Invoice Table */}
      <TableContainer sx={{ mb: 3 }}>
        <Table sx={{ border: '1px solid #000' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#d3d3d3' }}>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                รายการ
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                จดครั้งก่อน
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                จดครั้งหลัง
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                ผลต่าง
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                จำนวนเงิน
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}>
                หมายเหตุ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Electricity Row */}
            <TableRow sx={{ bgcolor: '#e8e8e8' }}>
              <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                ค่ากระแสไฟฟ้า
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.electUnitPrevious}
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.electUnitCurrent}
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.electUnitDiff}
              </TableCell>
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5, pr: 2 }}>
                {parseFloat(invoice.electAmount).toFixed(2)}
              </TableCell>
              <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}></TableCell>
            </TableRow>

            {/* Water Row */}
            <TableRow sx={{ bgcolor: '#e8e8e8' }}>
              <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                ค่าน้ำประปา
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.waterUnitPrevious}
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.waterUnitCurrent}
              </TableCell>
              <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                {invoice.waterUnitDiff}
              </TableCell>
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5, pr: 2 }}>
                {parseFloat(invoice.waterAmount).toFixed(2)}
              </TableCell>
              <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}></TableCell>
            </TableRow>

            {/* Total Row */}
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1.5 }}>
                รวม
              </TableCell>
              <TableCell align="right" sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1.5, pr: 2 }}>
                {parseFloat(invoice.totalAmount).toFixed(2)}
              </TableCell>
              <TableCell sx={{ border: '1px solid #000', py: 1.5 }}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Signature Section */}
      <Box sx={{ mt: 5, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ px: 4 }}>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Box sx={{ height: 60, mb: 1, borderBottom: '1px dotted #000' }}></Box>
            <Typography sx={{ fontSize: 13 }}>ตัวแทนมหาวิทยาลัย</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Box sx={{ height: 60, mb: 1, borderBottom: '1px dotted #000' }}></Box>
            <Typography sx={{ fontSize: 13 }}>ตัวแทน/ผู้ใช้กระแสไฟฟ้า</Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Payment History Section */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'center', mb: 2 }}>
          รายการค้างชำระ (ขออภัยหากมีการชำระเงินแล้ว)
        </Typography>

        <TableContainer>
          <Table sx={{ border: '1px solid #000' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}>
                  เดือน
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}>
                  ค่ากระแสไฟฟ้า
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}>
                  ค่าน้ำประปา
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}>
                  จำนวนเงิน
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}>
                  หมายเหตุ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', height: 80, py: 1 }}></TableCell>
                <TableCell sx={{ border: '1px solid #000', py: 1 }}></TableCell>
                <TableCell sx={{ border: '1px solid #000', py: 1 }}></TableCell>
                <TableCell sx={{ border: '1px solid #000', py: 1 }}></TableCell>
                <TableCell sx={{ border: '1px solid #000', py: 1 }}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1.5 }}>
                  รวม
                </TableCell>
                <TableCell colSpan={2} sx={{ border: '1px solid #000', py: 1.5 }}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            my: 1.5,
            mb: 3,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid #e7ebff',
          }}
        >
          <Breadcrumbs separator="/">
            <Link href="/admin/main" style={{ textDecoration: 'none' }}>
              <Typography
                color="#2fa4da"
                sx={{
                  fontSize: 16,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                หน้าหลัก
              </Typography>
            </Link>
            <Typography color="text.primary" sx={{ fontSize: 16 }}>
              พิมพ์ใบแจ้งหนี้
            </Typography>
          </Breadcrumbs>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid #e7ebff',
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                fontWeight: 600,
                mb: 2,
                color: '#35373b',
              }}
            >
              ค้นหาข้อมูลใบแจ้งหนี้
            </Typography>

            {/* Filter Section */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2,
                mb: 2,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>เดือน</InputLabel>
                <Select
                  value={selectedMonth}
                  label="เดือน"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={isLoading || isGenerating}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'white',
                    }
                  }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {thaiMonths.map((month, index) => (
                    <MenuItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>ปี (พ.ศ.)</InputLabel>
                <Select
                  value={selectedYear}
                  label="ปี (พ.ศ.)"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={isLoading || isGenerating}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'white',
                    }
                  }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>สถานะการชำระ</InputLabel>
                <Select
                  value={selectedPayStatus}
                  label="สถานะการชำระ"
                  onChange={(e) => setSelectedPayStatus(e.target.value)}
                  disabled={isLoading || isGenerating}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'white',
                    }
                  }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {payStatuses.map((status) => (
                    <MenuItem key={status.pay_status_id} value={status.pay_status_id.toString()}>
                      {status.name || `สถานะ ${status.pay_status_id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="ค้นหาร้านค้า (รหัสร้าน, สถานที่, ชื่อผู้เช่า)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading || isGenerating}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: 20 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            {/* Buttons Row */}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              sx={{
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Button
                variant="contained"
                size="small"
                startIcon={<ClearIcon sx={{ fontSize: 18 }} />}
                onClick={handleClearFilters}
                sx={{
                  bgcolor: '#9e9e9e',
                  color: 'white',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#757575',
                  },
                }}
              >
                ล้างตัวกรอง
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
                onClick={handleSearch}
                sx={{
                  bgcolor: '#2196f3',
                  color: 'white',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  textTransform: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#1976d2',
                  },
                }}
              >
                ค้นหา
              </Button>
            </Stack>

            {/* Shop Search and Selection */}
            <Stack spacing={2}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 1.5,
                  border: '1px solid #e0e0e0'
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e4eef8' }}>
                      <TableCell
                        padding="checkbox"
                        align="center"
                        sx={{
                          borderBottom: '2px solid #507494',
                          color: '#507494',
                          fontWeight: 600,
                          py: 2,
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedShops.length === filteredShops.length && filteredShops.length > 0} // Check against filteredShops
                          indeterminate={selectedShops.length > 0 && selectedShops.length < filteredShops.length} // Check against filteredShops
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedShops(filteredShops.map(shop => shop.shop_id)); // Select all FILTERED shops
                            } else {
                              setSelectedShops([]);
                            }
                          }}
                          disabled={isLoading || isGenerating}
                        />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: '2px solid #507494',
                          color: '#507494',
                          fontWeight: 600,
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        รหัสร้าน
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: '2px solid #507494',
                          color: '#507494',
                          fontWeight: 600,
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        สถานที่
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: '2px solid #507494',
                          color: '#507494',
                          fontWeight: 600,
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        ชื่อผู้เช่า
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredShops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary" fontSize={16}>
                            ไม่พบร้านค้าที่มีข้อมูลครบถ้วน
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShops
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((shop) => {
                          const isSelected = selectedShops.includes(shop.shop_id);
                          return (
                            <TableRow
                              key={shop.shop_id}
                              onClick={() => {
                                if (isLoading || isGenerating) return;
                                setSelectedShops(prev =>
                                  isSelected
                                    ? prev.filter(id => id !== shop.shop_id)
                                    : [...prev, shop.shop_id]
                                );
                              }}
                              sx={{
                                bgcolor: 'white',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: '#f5f5f5'
                                },
                              }}
                            >
                              <TableCell
                                padding="checkbox"
                                align="center"
                                sx={{
                                  borderBottom: '1px solid #e0e0e0',
                                  py: 2,
                                }}
                              >
                                <Checkbox
                                  size="small"
                                  checked={isSelected}
                                  disabled={isLoading || isGenerating}
                                />
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  borderBottom: '1px solid #e0e0e0',
                                  fontSize: 15,
                                  py: 2,
                                }}
                              >
                                {shop.shop_no || '-'}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  borderBottom: '1px solid #e0e0e0',
                                  fontSize: 15,
                                  py: 2,
                                }}
                              >
                                {shop.location || '-'}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  borderBottom: '1px solid #e0e0e0',
                                  fontSize: 15,
                                  py: 2,
                                }}
                              >
                                {shop.member
                                  ? `${shop.member.name || ''} ${shop.member.surname || ''}`.trim() || '-'
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredShops.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
                }
                sx={{
                  borderTop: '1px solid #e0e0e0',
                  bgcolor: '#fafafa',
                  '.MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel': {
                    color: '#64696f',
                    fontSize: 14,
                    fontWeight: 500,
                  },
                }}
              />

              <Box sx={{ textAlign: 'center' }}>
                {/* Show loading state */}
                {isLoading && (
                  <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                    <Stack spacing={2} alignItems="center">
                      <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 14 }}>
                        กำลังโหลดข้อมูล...
                      </Typography>
                      <LinearProgress sx={{ width: '100%', borderRadius: 1, height: 4 }} />
                    </Stack>
                  </Box>
                )}

                {/* Show error state */}
                {error && !isLoading && (
                  <Alert
                    severity="error"
                    sx={{
                      maxWidth: 600,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: 1,
                      '& .MuiAlert-icon': { fontSize: 20 }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {/* Show generate button when data is loaded */}
                {!isLoading && !error && !isGenerating && !isComplete && (
                  <Stack spacing={2} alignItems="center">
                    {selectedShops.length > 0 && filteredData.length < selectedShops.length && (
                      <Alert
                        severity="info"
                        sx={{
                          maxWidth: 600,
                          borderRadius: 1,
                          fontSize: 14,
                          '& .MuiAlert-icon': { fontSize: 20 }
                        }}
                      >
                        พบใบแจ้งหนี้ {filteredData.length} ใบจาก {selectedShops.length} ร้านที่เลือก
                        (แสดงเฉพาะร้านที่บันทึกเลขมิเตอร์ครบแล้วเท่านั้น)
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />}
                      onClick={handleGeneratePDF}
                      disabled={filteredData.length === 0}
                      sx={{
                        bgcolor: '#4caf50',
                        color: 'white',
                        borderRadius: 1.5,
                        px: 2,
                        py: 0.5,
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: '#388e3c',
                        },
                      }}
                    >
                      สร้างไฟล์ PDF ({filteredData.length} รายการ)
                    </Button>
                  </Stack>
                )}

                {isGenerating && (
                  <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                    <Stack spacing={2} alignItems="center">
                      <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 14 }}>
                        กำลังสร้างไฟล์ PDF... ({generationProgress}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={generationProgress}
                        sx={{
                          width: '100%',
                          borderRadius: 1,
                          height: 6,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 1
                          }
                        }}
                      />
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        กรุณารอสักครู่ อาจใช้เวลาหลายนาทีสำหรับเอกสารจำนวนมาก
                      </Typography>
                    </Stack>
                  </Box>
                )}

                {isComplete && (
                  <Stack spacing={2} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
                    <Typography sx={{ color: 'success.main', fontWeight: 600, fontSize: 16 }}>
                      สร้างไฟล์ PDF สำเร็จ!
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      ไฟล์ถูกบันทึกลงในเครื่องของคุณแล้ว
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Hidden Invoice Templates for PDF Generation */}
        {filteredData.map((invoice, index) => (
          <InvoiceTemplate key={invoice.billId} invoice={invoice} index={index} />
        ))}
      </Container>
    </MainLayout>
  );
}