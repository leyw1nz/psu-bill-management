'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link,
  Button,
  LinearProgress,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import * as XLSX from 'xlsx-js-style';
import { thaiMonths } from '@/lib/utils';

interface HouseBillData {
  employeeId: string;
  fullName: string;
  title: string;
  firstName: string;
  lastName: string;
  houseNo: string;
  zoneBuilding: string;
  zoneHouseNo: string;
  houseType: string;
  fee: string;
  electAmount: string;
  waterAmount: string;
  idCard: string;
  month: string;
  year: string;
}

export default function ExportExcelPage() {
  // Get current year and month (Thai Buddhist year)
  const now = new Date();
  const currentYear = (now.getFullYear() + 543).toString();
  const currentMonth = (now.getMonth() + 1).toString();

  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [data, setData] = useState<HouseBillData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Generate year options (current year ± 2 years)
  const yearOptions = [
    (parseInt(currentYear) - 2).toString(),
    (parseInt(currentYear) - 1).toString(),
    currentYear,
    (parseInt(currentYear) + 1).toString(),
  ];

  // Fetch data from API when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedYear) params.append('year', selectedYear);

        const response = await fetch(`/api/bills/house/export?${params.toString()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching export data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleExport = async () => {
    setIsExporting(true);
    setIsComplete(false);

    // Use setTimeout to allow UI to update before heavy Excel generation
    setTimeout(() => {
      generateExcel();
    }, 100);
  };

  const generateExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = data.map((row) => ({
        'รหัสบุคลากร': row.employeeId,
        'ชื่อ-นามสกุล': row.fullName,
        'คำนำหน้า': row.title,
        'ชื่อ': row.firstName,
        'สกุล': row.lastName,
        'โซน-บ้านเลขที่': row.zoneHouseNo,
        'ค่าธรรมเนียม': row.fee,
        'ประเภทบ้าน': row.houseType,
        'ค่าไฟฟ้า': row.electAmount,
        'ค่าน้ำประปา': row.waterAmount,
        'เลขบัตรประชาชน': row.idCard,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // รหัสบุคลากร
        { wch: 30 }, // ชื่อ-นามสกุล
        { wch: 12 }, // คำนำหน้า
        { wch: 15 }, // ชื่อ
        { wch: 15 }, // สกุล
        { wch: 18 }, // โซน-บ้านเลขที่
        { wch: 12 }, // ค่าธรรมเนียม
        { wch: 15 }, // ประเภทบ้าน
        { wch: 12 }, // ค่าไฟฟ้า
        { wch: 12 }, // ค่าน้ำประปา
        { wch: 18 }, // เลขบัตรประชาชน
      ];

      // Define border style
      const borderStyle = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      };

      // Define header style (dark background, bold, white text)
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle,
      };

      // Define pastel highlight style for specific columns
      const pastelYellowStyle = {
        fill: { fgColor: { rgb: 'FFF4CC' } }, // Pastel yellow
        border: borderStyle,
        alignment: { vertical: 'center' },
      };

      const pastelBlueStyle = {
        fill: { fgColor: { rgb: 'D9E9FF' } }, // Pastel blue
        border: borderStyle,
        alignment: { vertical: 'center' },
      };

      // Default cell style with border
      const defaultCellStyle = {
        border: borderStyle,
        alignment: { vertical: 'center' },
      };

      // Get the range of the worksheet
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      // Apply styles to all cells
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          // Header row (row 0)
          if (R === 0) {
            ws[cellAddress].s = headerStyle;
          } else {
            // Data rows
            // Column B (index 1) - ชื่อ-นามสกุล - Pastel yellow
            if (C === 1) {
              ws[cellAddress].s = pastelYellowStyle;
            }
            // Column F (index 5) - โซน-บ้านเลขที่ - Pastel blue
            else if (C === 5) {
              ws[cellAddress].s = pastelBlueStyle;
            }
            // Other columns - default border
            else {
              ws[cellAddress].s = defaultCellStyle;
            }
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'ค่าน้ำค่าไฟบ้านพัก');

      // Generate filename with month and year
      const monthIndex = parseInt(selectedMonth) - 1;
      const monthName = monthIndex >= 0 && monthIndex < 12 ? thaiMonths[monthIndex] : selectedMonth;
      const filename = `ค่าน้ำค่าไฟบ้านพัก_${monthName}_${selectedYear}.xlsx`;

      // Generate file
      XLSX.writeFile(wb, filename);

      setIsExporting(false);
      setIsComplete(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    } catch (err) {
      console.error('Error generating Excel:', err);
      setError('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel');
      setIsExporting(false);
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
          <Typography className="breadcrumb-current">ส่งออกข้อมูลเป็นไฟล์ Excel</Typography>
        </Breadcrumbs>

        <Paper elevation={3} sx={{ my: 2, p: 4, borderRadius: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#35373b', textAlign: 'center' }}>
              ส่งออกข้อมูลค่าน้ำค่าไฟบ้านพัก
            </Typography>
            <Typography sx={{ mb: 4, color: '#666', textAlign: 'center' }}>
              เลือกเดือนและปีที่ต้องการส่งออกข้อมูล
            </Typography>

            {/* Filter Section */}
            <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>เดือน</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="เดือน"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={isLoading || isExporting}
                  >
                    <MenuItem value="">ทั้งหมด</MenuItem>
                    {thaiMonths.map((month, index) => (
                      <MenuItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>ปี (พ.ศ.)</InputLabel>
                  <Select
                    value={selectedYear}
                    label="ปี (พ.ศ.)"
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={isLoading || isExporting}
                  >
                    <MenuItem value="">ทั้งหมด</MenuItem>
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Box sx={{ textAlign: 'center' }}>

            {/* Show loading state */}
            {isLoading && (
              <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Typography sx={{ color: '#1976d2', fontWeight: 500 }}>
                    กำลังโหลดข้อมูล...
                  </Typography>
                  <LinearProgress sx={{ width: '100%', borderRadius: 5 }} />
                </Stack>
              </Box>
            )}

            {/* Show error state */}
            {error && !isLoading && (
              <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Show export button when data is loaded */}
            {!isLoading && !error && !isExporting && !isComplete && (
              <Button
                variant="contained"
                size="large"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={data.length === 0}
                sx={{
                  bgcolor: '#1976d2',
                  px: 6,
                  py: 1.5,
                  fontSize: 16,
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#1565c0',
                  },
                }}
              >
                ส่งออก ({data.length} รายการ)
              </Button>
            )}

            {isExporting && (
              <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Typography sx={{ color: '#1976d2', fontWeight: 500 }}>
                    กำลังสร้างไฟล์ Excel...
                  </Typography>
                  <LinearProgress sx={{ width: '100%', borderRadius: 5 }} />
                </Stack>
              </Box>
            )}

            {isComplete && (
              <Stack spacing={2} alignItems="center">
                <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50' }} />
                <Typography sx={{ color: '#4caf50', fontWeight: 600, fontSize: 18 }}>
                  ส่งออกเรียบร้อยแล้ว!
                </Typography>
                <Typography sx={{ color: '#666', fontSize: 14 }}>
                  ไฟล์ถูกบันทึกลงในเครื่องของคุณแล้ว
                </Typography>
              </Stack>
            )}
            </Box>

            {/* Info Section */}
            <Paper
              elevation={1}
              sx={{
                mt: 6,
                p: 3,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 2, color: '#35373b' }}>
                ข้อมูลที่จะส่งออก
              </Typography>
              <Stack spacing={1} sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: '#666' }}>ช่วงเวลา:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {isLoading ? 'กำลังโหลด...' : (
                      selectedMonth && selectedYear
                        ? `${thaiMonths[parseInt(selectedMonth) - 1]} ${selectedYear}`
                        : selectedYear
                        ? `ปี ${selectedYear}`
                        : selectedMonth
                        ? `เดือน ${thaiMonths[parseInt(selectedMonth) - 1]}`
                        : 'ทั้งหมด'
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: '#666' }}>จำนวนรายการ:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {isLoading ? 'กำลังโหลด...' : `${data.length} รายการ`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: '#666' }}>รูปแบบไฟล์:</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Excel (.xlsx)</Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
