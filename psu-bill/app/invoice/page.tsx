'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { formatThaiDate, parseNumber, parseInt as parseIntSafe } from '@/lib/utils';
import {
    Box,
    Typography,
    Container,
    Paper,
    Button,
    Stack,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Breadcrumbs,
    Link,
    Alert,
} from '@mui/material';
import {
    Print as PrintIcon,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import MainLayout from '@/components/MainLayout';

interface InvoiceData {
    type: 'house' | 'shop';
    date: string;
    recipient: string;
    address: string;
    month: string;
    propertyInfo: {
        houseNo?: string;
        zoneBuilding?: string;
        shopNo?: string;
        location?: string;
    };
    electricity: {
        previousMeter: string;
        currentMeter: string;
        units: string;
        amount: string;
    };
    water: {
        previousMeter: string;
        currentMeter: string;
        units: string;
        amount: string;
    };
    total: string;
}

export default function InvoicePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<InvoiceData | null>(null);
    const router = useRouter();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const loadInvoiceData = async () => {
        try {
            setLoading(true);
            setError('');

            // Check which type to load based on the referring page or explicit type in localStorage
            const invoiceTypePreference = localStorage.getItem('invoiceType'); // 'house' or 'shop'
            const houseId = localStorage.getItem('selectedHouseId');
            const shopId = localStorage.getItem('selectedShopId');

            let response;
            let invoiceType: 'house' | 'shop';

            // Determine which invoice to load based on preference or availability
            if (invoiceTypePreference === 'shop' && shopId) {
                invoiceType = 'shop';
            } else if (invoiceTypePreference === 'house' && houseId) {
                invoiceType = 'house';
            } else if (shopId && !houseId) {
                invoiceType = 'shop';
            } else if (houseId && !shopId) {
                invoiceType = 'house';
            } else if (!houseId && !shopId) {
                setError('ไม่พบข้อมูล กรุณาเลือกบ้านพักหรือร้านค้าจากหน้าหลัก');
                setLoading(false);
                return;
            } else {
                // Both exist, default to the preference or shop
                invoiceType = invoiceTypePreference === 'house' ? 'house' : 'shop';
            }

            // Get year and month - use selected bill if available, otherwise use current date
            const selectedBillYear = localStorage.getItem('selectedBillYear');
            const selectedBillMonth = localStorage.getItem('selectedBillMonth');

            let year: string;
            let month: string;

            if (selectedBillYear && selectedBillMonth) {
                year = selectedBillYear;
                month = selectedBillMonth;
                console.log('Using selected bill:', { year, month });
            } else {
                // Default to current month (Thai Buddhist calendar)
                const now = new Date();
                year = (now.getFullYear() + 543).toString();
                month = (now.getMonth() + 1).toString();
                console.log('Using current month:', { year, month });
            }

            if (invoiceType === 'house') {
                response = await fetch(`/api/bills/house/${houseId}?year=${year}&month=${month}`);
            } else {
                response = await fetch(`/api/bills/shop/${shopId}?year=${year}&month=${month}`);
            }

            if (!response.ok) {
                setError('ไม่สามารถโหลดข้อมูลได้');
                setLoading(false);
                return;
            }

            const result = await response.json();

            if (!result.success) {
                setError(result.error || 'ไม่พบข้อมูลบิล');
                setLoading(false);
                return;
            }

            const bill = result.data.latestBill;
            const property = invoiceType === 'house' ? result.data.house : result.data.shop;

            if (!bill) {
                setError('ไม่พบข้อมูลบิลสำหรับเดือนปัจจุบัน');
                setLoading(false);
                return;
            }

            // Format invoice data
            const electPrevious = parseIntSafe(bill.elect_unit_previous || '0');
            const electCurrent = parseIntSafe(bill.elect_unit_current || '0');
            const electDiff = bill.elect_unit_diff || (electCurrent - electPrevious);
            const electAmount = parseNumber(bill.elect_amount || '0');

            const waterPrevious = parseIntSafe(bill.water_unit_previous || '0');
            const waterCurrent = parseIntSafe(bill.water_unit_current || '0');
            const waterDiff = parseIntSafe(bill.water_unit_diff || '0');
            const waterAmount = parseNumber(bill.water_amount || '0');

            const total = electAmount + waterAmount;

            // Get member name if available
            let recipientName = 'ไม่ระบุชื่อ';
            if (property.member_id) {
                const memberResponse = await fetch(`/api/members/${property.member_id}/properties`);
                if (memberResponse.ok) {
                    const memberData = await memberResponse.json();
                    if (memberData.success && memberData.data.member) {
                        const member = memberData.data.member;
                        recipientName = `${member.name} ${member.surname}`;
                    }
                }
            }

            const invoiceData: InvoiceData = {
                type: invoiceType,
                date: new Date().toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                recipient: recipientName,
                address: invoiceType === 'house'
                    ? `บ้านเลขที่ ${property.house_no} (อาคาร ${property.zone_building})`
                    : `ร้านเลขที่ ${property.shop_no} (${property.location})`,
                month: formatThaiDate(bill.year, bill.month),
                propertyInfo: invoiceType === 'house'
                    ? {
                        houseNo: property.house_no,
                        zoneBuilding: property.zone_building,
                    }
                    : {
                        shopNo: property.shop_no,
                        location: property.location,
                    },
                electricity: {
                    previousMeter: electPrevious.toLocaleString(),
                    currentMeter: electCurrent.toLocaleString(),
                    units: electDiff.toLocaleString(),
                    amount: electAmount.toFixed(2),
                },
                water: {
                    previousMeter: waterPrevious.toLocaleString(),
                    currentMeter: waterCurrent.toLocaleString(),
                    units: waterDiff.toLocaleString(),
                    amount: waterAmount.toFixed(2),
                },
                total: total.toFixed(2),
            };

            setData(invoiceData);

            // Clear the selected bill after successfully loading
            localStorage.removeItem('selectedBillYear');
            localStorage.removeItem('selectedBillMonth');
            localStorage.removeItem('selectedBillId');
        } catch (err) {
            console.error('Error loading invoice data:', err);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.push('/');
            return;
        }

        loadInvoiceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const documentTitle = useMemo(() => {
        if (typeof window === 'undefined' || !data) return 'ใบแจ้งหนี้';
        return `ใบแจ้งหนี้_${data.recipient}_${new Date().toLocaleDateString('th-TH')}`;
    }, [data]);

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle,
    });

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <MainLayout IsMobile={true}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={() => router.back()}
                        sx={{ mt: 2 }}
                    >
                        กลับ
                    </Button>
                </Container>
            </MainLayout>
        );
    }

    if (!data) {
        return (
            <MainLayout IsMobile={true}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Alert severity="warning">ไม่พบข้อมูลใบแจ้งหนี้</Alert>
                </Container>
            </MainLayout>
        );
    }

    return (
        <MainLayout IsMobile={true}>
            <Container maxWidth="md">

                {/* Breadcrumbs */}
                <Paper
                    sx={{
                        borderRadius: 1,
                        bgcolor: '#f8f9fa',
                        border: '1px solid #e3e6ea',
                        p: 2,
                        my: 2,
                        '@media print': { display: 'none' }
                    }}
                >
                    <Breadcrumbs>
                        <Link href={'/main'}>
                            <Typography color="#2fa4da">หน้าหลัก</Typography>
                        </Link>
                        <Link href={data.type === 'shop' ? '/shop/main' : '/house/main'}>
                            <Typography color="#2fa4da">
                                {data.type === 'shop'
                                    ? data.propertyInfo.shopNo
                                        ? `ร้านเลขที่ ${data.propertyInfo.shopNo}`
                                        : 'ค่าน้ำค่าไฟร้านค้า'
                                    : data.propertyInfo.houseNo
                                        ? `บ้านเลขที่ ${data.propertyInfo.houseNo} (อาคาร ${data.propertyInfo.zoneBuilding})`
                                        : 'ค่าน้ำค่าไฟบ้านพัก'
                                }
                            </Typography>
                        </Link>
                        <Typography color="dark">พิมพ์ใบแจ้งหนี้</Typography>
                    </Breadcrumbs>
                </Paper>

                {/* Print Button */}
                <Paper
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        borderRadius: 1,
                        bgcolor: '#f8f9fa',
                        border: '1px solid #e3e6ea',
                        p: 2,
                        my: 2,
                        '@media print': { display: 'none' }
                    }}
                >
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        sx={{
                            bgcolor: '#1976d2',
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: '#1565c0',
                            },
                        }}
                    >
                        พิมพ์ / บันทึก PDF
                    </Button>
                </Paper>

                {/* Invoice Content */}
                <Box
                    sx={{
                        overflow: 'none',
                        '@media print': {
                            overflow: 'visible',
                        },
                        mb: 4,
                    }}
                >
                    <Paper
                        ref={invoiceRef}
                        elevation={3}
                        sx={{
                            p: 4,
                            bgcolor: 'white',
                            minWidth: { xs: '210mm', print: 'auto' },
                            transform: { xs: 'scale(0.4)', sm: 'scale(0.6)', md: 'scale(1)' },
                            transformOrigin: 'top left',
                            width: { xs: '250%', sm: '166.67%', md: '100%' },
                            '@media print': {
                                boxShadow: 'none',
                                m: 0,
                                p: 3,
                                transform: 'none',
                                width: '100%',
                                minWidth: 'auto',
                            },
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
                                {data.date}
                            </Typography>
                        </Box>

                        {/* Recipient Info */}
                        <Box sx={{ mb: 3 }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: 14 }}>ชื่อ - สกุล :</Typography>
                                <Typography sx={{ fontSize: 14, flex: 1, fontWeight: 600 }}>{data.recipient}</Typography>
                                <Typography sx={{ fontSize: 14 }}>สถานที่ : <b>{data.address}</b></Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 14 }}>
                                ค่ากระแสไฟฟ้า - น้ำประปา ประจำเดือน : <b>{data.month}</b>
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Main Invoice Table */}
                        <TableContainer sx={{ mb: 3 }}>
                            <Table sx={{ border: '1px solid #000' }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#d3d3d3' }}>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
                                            รายการ
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
                                            จดครั้งก่อน
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
                                            จดครั้งหลัง
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
                                            ผลต่าง
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
                                            จำนวนเงิน
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1 }}
                                        >
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
                                            {data.electricity.previousMeter}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            {data.electricity.currentMeter}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            {data.electricity.units}
                                        </TableCell>
                                        <TableCell align="right" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5, pr: 2 }}>
                                            {data.electricity.amount}
                                        </TableCell>
                                        <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}></TableCell>
                                    </TableRow>

                                    {/* Water Row */}
                                    <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                                        <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            ค่าน้ำประปา
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            {data.water.previousMeter}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            {data.water.currentMeter}
                                        </TableCell>
                                        <TableCell align="center" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}>
                                            {data.water.units}
                                        </TableCell>
                                        <TableCell align="right" sx={{ border: '1px solid #000', fontSize: 13, py: 1.5, pr: 2 }}>
                                            {data.water.amount}
                                        </TableCell>
                                        <TableCell sx={{ border: '1px solid #000', fontSize: 13, py: 1.5 }}></TableCell>
                                    </TableRow>

                                    {/* Total Row */}
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            align="center"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1.5 }}
                                        >
                                            รวม
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ border: '1px solid #000', fontSize: 14, fontWeight: 600, py: 1.5, pr: 2 }}
                                        >
                                            {data.total}
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
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    mb: 2,
                                }}
                            >
                                รายการค้างชำระ (ขออภัยหากมีการชำระเงินแล้ว)
                            </Typography>

                            <TableContainer>
                                <Table sx={{ border: '1px solid #000' }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                                            <TableCell
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}
                                            >
                                                เดือน
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}
                                            >
                                                ค่ากระแสไฟฟ้า
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}
                                            >
                                                ค่าน้ำประปา
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}
                                            >
                                                จำนวนเงิน
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1 }}
                                            >
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
                                            <TableCell
                                                colSpan={3}
                                                align="center"
                                                sx={{ border: '1px solid #000', fontSize: 13, fontWeight: 600, py: 1.5 }}
                                            >
                                                รวม
                                            </TableCell>
                                            <TableCell
                                                colSpan={2}
                                                sx={{ border: '1px solid #000', py: 1.5 }}
                                            ></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </MainLayout>
    );
}
