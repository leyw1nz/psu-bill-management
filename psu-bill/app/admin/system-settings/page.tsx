'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { getCurrentUser } from '@/lib/auth';
import { memberService } from '@/lib/services';

interface ElectricityTier {
  min: number;
  max: number | null; // null means unlimited
  rate: string;
}

interface SystemSettings {
  house_electricity_rate: string;
  house_water_rate: string;
  shop_electricity_tiers: ElectricityTier[];
  shop_water_rate: string;
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    house_electricity_rate: '',
    house_water_rate: '',
    shop_electricity_tiers: [
      { min: 1, max: 150, rate: '5' },
      { min: 151, max: 500, rate: '6' },
      { min: 501, max: null, rate: '7' },
    ],
    shop_water_rate: '',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
  const [dialogMessage, setDialogMessage] = useState('');

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/');
          return;
        }

        // Check if user is admin
        if (currentUser.member_id) {
          const response = await memberService.getById(currentUser.member_id);

          if (response.success && response.data) {
            if (response.data.role_id === 1) {
              setIsAdmin(true);
              await fetchSettings();
            } else {
              console.error('Access denied: User is not an admin');
              router.push('/');
              return;
            }
          } else {
            console.error('Failed to fetch member data:', response.error);
            router.push('/');
            return;
          }
        } else {
          console.error('No member_id found');
          router.push('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in admin check:', error);
        router.push('/');
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/system-settings');
      const data = await response.json();

      if (data.success && data.data) {
        setSettings({
          house_electricity_rate: data.data.house_electricity_rate || '',
          house_water_rate: data.data.house_water_rate || '',
          shop_electricity_tiers: data.data.shop_electricity_tiers || [
            { min: 1, max: 150, rate: '5' },
            { min: 151, max: 500, rate: '6' },
            { min: 501, max: null, rate: '7' },
          ],
          shop_water_rate: data.data.shop_water_rate || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setDialogType('error');
      setDialogMessage('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
      setDialogOpen(true);
    }
  };

  const handleSave = async () => {
    // Validate all rates before saving
    const houseElectRate = parseFloat(settings.house_electricity_rate);
    const houseWaterRate = parseFloat(settings.house_water_rate);
    const shopWaterRate = parseFloat(settings.shop_water_rate);

    // Check if any rate is invalid (negative or > 999)
    if (
      isNaN(houseElectRate) || houseElectRate < 0 || houseElectRate > 999 ||
      isNaN(houseWaterRate) || houseWaterRate < 0 || houseWaterRate > 999 ||
      isNaN(shopWaterRate) || shopWaterRate < 0 || shopWaterRate > 999
    ) {
      setDialogType('error');
      setDialogMessage('กรุณากรอกอัตราค่าใช้จ่ายให้ถูกต้อง (0-999)');
      setDialogOpen(true);
      return;
    }

    // Check shop electricity tiers
    for (const tier of settings.shop_electricity_tiers) {
      const rate = parseFloat(tier.rate);
      if (isNaN(rate) || rate < 0 || rate > 999) {
        setDialogType('error');
        setDialogMessage('กรุณากรอกอัตราค่าไฟฟ้าร้านค้าให้ถูกต้อง (0-999)');
        setDialogOpen(true);
        return;
      }
      if (tier.min < 0) {
        setDialogType('error');
        setDialogMessage('จำนวนหน่วยต้องไม่เป็นค่าลบ');
        setDialogOpen(true);
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setDialogType('success');
        setDialogMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        setDialogOpen(true);
      } else {
        setDialogType('error');
        setDialogMessage(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setDialogType('error');
      setDialogMessage('เกิดข้อผิดพลาดในการบันทึก');
      setDialogOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await fetchSettings();
    setDialogType('success');
    setDialogMessage('รีเซ็ตค่ากลับไปเป็นค่าเดิมแล้ว');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Validation helper function
  const validateRate = (value: string): string => {
    // Remove any negative signs
    let cleanValue = value.replace(/-/g, '');

    // Parse the number
    const numValue = parseFloat(cleanValue);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return '';
    }

    // Cap at 999
    if (numValue > 999) {
      return '999';
    }

    // Ensure non-negative
    if (numValue < 0) {
      return '0';
    }

    return cleanValue;
  };

  if (loading) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <Typography>กำลังตรวจสอบสิทธิ์...</Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="lg">
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
          <Typography className="breadcrumb-current">ตั้งค่าระบบ</Typography>
        </Breadcrumbs>

        {/* Success/Error Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: dialogType === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {dialogType === 'success' ? (
              <CheckCircleIcon sx={{ fontSize: 28 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 28 }} />
            )}
            <Typography variant="h6" component="span">
              {dialogType === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 3, pb: 2 }}>
            <Typography sx={{ fontSize: 16, color: '#35373b', textAlign: 'center' }}>
              {dialogMessage}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={handleCloseDialog}
              sx={{
                bgcolor: dialogType === 'success' ? '#10b981' : '#ef4444',
                color: 'white',
                px: 4,
                '&:hover': {
                  bgcolor: dialogType === 'success' ? '#059669' : '#dc2626',
                },
              }}
            >
              ตกลง
            </Button>
          </DialogActions>
        </Dialog>

        {/* Main Content */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 4,
            borderRadius: 3,
            border: '1px solid #e7ebff',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <SettingsIcon sx={{ fontSize: 32, color: '#64748b' }} />
            <Typography
              variant="h5"
              sx={{
                fontSize: 24,
                fontWeight: 600,
                color: '#35373b',
              }}
            >
              ตั้งค่าระบบ
            </Typography>
          </Stack>

          <Divider sx={{ mb: 4 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: 3,
              mb: 3,
            }}
          >
            {/* House Electricity Rate */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, color: '#334155' }}
              >
                อัตราค่าไฟฟ้า (บ้านพัก)
              </Typography>
              <TextField
                fullWidth
                size="medium"
                label="บาท/หน่วย"
                type="number"
                value={settings.house_electricity_rate}
                onChange={(e) => {
                  const validatedValue = validateRate(e.target.value);
                  setSettings({ ...settings, house_electricity_rate: validatedValue });
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white',
                  },
                }}
                inputProps={{
                  step: '0.01',
                  min: '0',
                  max: '999',
                }}
              />
            </Box>

            {/* House Water Rate */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, color: '#334155' }}
              >
                อัตราค่าน้ำประปา (บ้านพัก)
              </Typography>
              <TextField
                fullWidth
                size="medium"
                label="บาท/หน่วย"
                type="number"
                value={settings.house_water_rate}
                onChange={(e) => {
                  const validatedValue = validateRate(e.target.value);
                  setSettings({ ...settings, house_water_rate: validatedValue });
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white',
                  },
                }}
                inputProps={{
                  step: '0.01',
                  min: '0',
                  max: '999',
                }}
              />
            </Box>

            {/* Shop Electricity Tiered Rates */}
            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, fontWeight: 600, color: '#334155' }}
              >
                อัตราค่าไฟฟ้า (ร้านค้า) - แบบขั้นบันได
              </Typography>
              <Stack spacing={2}>
                {settings.shop_electricity_tiers.map((tier, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 2fr 3fr',
                      gap: 2,
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      size="small"
                      label="จากหน่วยที่"
                      type="number"
                      value={tier.min}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        // Prevent negative values
                        if (value < 0) return;
                        const newTiers = [...settings.shop_electricity_tiers];
                        newTiers[index].min = value || 0;
                        setSettings({ ...settings, shop_electricity_tiers: newTiers });
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                        },
                      }}
                      inputProps={{ min: '0' }}
                    />
                    <TextField
                      size="small"
                      label={tier.max === null ? 'เป็นต้นไป' : 'ถึงหน่วยที่'}
                      type="number"
                      value={tier.max === null ? '' : tier.max}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          const newTiers = [...settings.shop_electricity_tiers];
                          newTiers[index].max = null;
                          setSettings({ ...settings, shop_electricity_tiers: newTiers });
                          return;
                        }
                        const value = parseInt(e.target.value);
                        // Prevent negative values and ensure it's >= min
                        if (value < 0 || value < tier.min) return;
                        const newTiers = [...settings.shop_electricity_tiers];
                        newTiers[index].max = value;
                        setSettings({ ...settings, shop_electricity_tiers: newTiers });
                      }}
                      disabled={tier.max === null}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: tier.max === null ? '#f5f5f5' : 'white',
                        },
                      }}
                      inputProps={{ min: tier.min }}
                    />
                    <TextField
                      size="small"
                      label="อัตราค่าไฟฟ้า (บาท/หน่วย)"
                      type="number"
                      value={tier.rate}
                      onChange={(e) => {
                        const validatedValue = validateRate(e.target.value);
                        const newTiers = [...settings.shop_electricity_tiers];
                        newTiers[index].rate = validatedValue;
                        setSettings({ ...settings, shop_electricity_tiers: newTiers });
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                        },
                      }}
                      inputProps={{ step: '0.01', min: '0', max: '999' }}
                    />
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748b' }}>
                ระบบจะคำนวณค่าไฟฟ้าตามขั้นบันได เช่น ใช้ 200 หน่วย = (150 × {settings.shop_electricity_tiers[0]?.rate}) + (50 × {settings.shop_electricity_tiers[1]?.rate})
              </Typography>
            </Box>

            {/* Shop Water Rate */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, color: '#334155' }}
              >
                อัตราค่าน้ำประปา (ร้านค้า)
              </Typography>
              <TextField
                fullWidth
                size="medium"
                label="บาท/หน่วย"
                type="number"
                value={settings.shop_water_rate}
                onChange={(e) => {
                  const validatedValue = validateRate(e.target.value);
                  setSettings({ ...settings, shop_water_rate: validatedValue });
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white',
                  },
                }}
                inputProps={{
                  step: '0.01',
                  min: '0',
                  max: '999',
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#9e9e9e',
                color: '#9e9e9e',
                px: 3,
                py: 1,
                '&:hover': {
                  borderColor: '#757575',
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              รีเซ็ต
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: '#10b981',
                px: 3,
                py: 1,
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </Stack>
        </Paper>

        {/* Information Box */}
        <Paper
          elevation={1}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155', mb: 2 }}>
            ℹ️ หมายเหตุ
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            • การตั้งค่าอัตราจะมีผลกับการคำนวณบิลใหม่ที่สร้างขึ้นหลังจากบันทึกการตั้งค่า
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            • บิลที่สร้างไว้แล้วจะไม่ได้รับผลกระทบจากการเปลี่ยนแปลงอัตรา
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            • กรุณาตรวจสอบความถูกต้องก่อนบันทึกการตั้งค่า
          </Typography>
        </Paper>
      </Container>
    </MainLayout>
  );
}
