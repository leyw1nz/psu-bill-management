"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import type { AppDialogSeverity } from "@/types";

type Props = {
  open: boolean;
  severity: AppDialogSeverity;
  title: string;
  message: string;
  onClose: () => void;

  primaryText?: string;
  onPrimary?: () => void;

  secondaryText?: string;
  onSecondary?: () => void;
};

const iconBySeverity = (s: AppDialogSeverity) => {
  if (s === "error") return <ErrorOutlineIcon />;
  if (s === "warning") return <WarningAmberIcon />;
  if (s === "success") return <CheckCircleOutlineIcon />;
  return <InfoOutlinedIcon />;
};

const colorBySeverity = (s: AppDialogSeverity) => {
  if (s === "error") return "#dc2626";
  if (s === "warning") return "#d97706";
  if (s === "success") return "#16a34a";
  return "#2563eb";
};

export default function MessageDialog({
  open,
  severity,
  title,
  message,
  onClose,
  primaryText = "ตกลง",
  onPrimary,
  secondaryText,
  onSecondary,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const color = colorBySeverity(severity);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ color }}>{iconBySeverity(severity)}</Box>
          <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {secondaryText && (
          <Button
            variant="outlined"
            onClick={onSecondary || onClose}
            sx={{ textTransform: "none" }}
          >
            {secondaryText}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onPrimary || onClose}
          sx={{ textTransform: "none" }}
        >
          {primaryText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
