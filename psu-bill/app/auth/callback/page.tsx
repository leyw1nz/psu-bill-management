'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Paper,
  Container,
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import Image from 'next/image';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for error from OIDC provider
        if (errorParam) {
          setError(errorDescription || errorParam);
          setProcessing(false);
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setError('ไม่พบข้อมูลการยืนยันตัวตน');
          setProcessing(false);
          return;
        }

        // Call backend API to complete authentication
        const response = await fetch('/api/auth/oidc/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
          setProcessing(false);
          return;
        }

        // Authentication successful
        if (data.success && data.user) {
          // Store user data in localStorage (client-side session)
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Store member_id if available (from database lookup)
          if (data.user.member_id) {
            localStorage.setItem('member_id', data.user.member_id);
          }

          // Redirect to main page where user can choose their menu
          // The main page will determine available options based on member_id
          router.push('/main');
        } else {
          setError('ไม่สามารถเข้าสู่ระบบได้');
          setProcessing(false);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom right, #5DD5D5, #4EC8E8, #4AB8F5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: { xs: 4, sm: 5, md: 6 },
            p: { xs: 3, sm: 4, md: 5 },
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image
              src="/PSUBill_logo.png"
              alt="PSU Bill Logo"
              width={180}
              height={180}
              style={{
                objectFit: 'contain',
                width: '100%',
                maxWidth: '120px',
                height: 'auto',
              }}
              priority
            />
          </Box>

          {processing ? (
            <>
              <CircularProgress
                size={60}
                sx={{
                  color: '#2196f3',
                  mb: 3,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#35373b',
                  mb: 1,
                }}
              >
                กำลังตรวจสอบข้อมูล
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64696f',
                }}
              >
                กรุณารอสักครู่...
              </Typography>
            </>
          ) : error ? (
            <>
              <ErrorIcon
                sx={{
                  fontSize: 60,
                  color: '#d32f2f',
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#35373b',
                  mb: 2,
                }}
              >
                เกิดข้อผิดพลาด
              </Typography>
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  textAlign: 'left',
                }}
              >
                {error}
              </Alert>
              <Typography
                variant="body2"
                sx={{
                  color: '#2196f3',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#1976d2',
                  },
                }}
                onClick={() => router.push('/')}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Typography>
            </>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            width: '100%',
            background: 'linear-gradient(to bottom right, #5DD5D5, #4EC8E8, #4AB8F5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={60} sx={{ color: '#fff' }} />
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
