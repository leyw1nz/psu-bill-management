'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e76e3',
    },
    secondary: {
      main: '#f5f6fa',
    },
  },
  typography: {
    fontFamily: 'var(--font-bai-jamjuree), "Bai Jamjuree", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
});

export default theme;
