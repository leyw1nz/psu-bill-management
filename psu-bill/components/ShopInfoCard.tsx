"use client";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Box,
  Divider,
} from "@mui/material";
import { Store, Person, ListAlt } from "@mui/icons-material";
import { ShopInfoCardProps } from "@/types";

export default function ShopInfoCard({
  user,
  shop,
  mode = "default",
  totalUnpaidAmount = 0,
}: ShopInfoCardProps) {
  const isPendingMode = mode === "pending";

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "#898888",
        mx: { xs: 1.5, sm: 0 },
      }}
    >
      <CardContent
        sx={{
          px: { xs: 2, sm: 2 },
          py: { xs: 1.5, sm: 1.5 },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          sx={{ mb: 1.5 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: 17, fontWeight: 600, opacity: 0.8 }}
            >
              ข้อมูลร้านค้า
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{ mb: 1.5 }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(30, 118, 227, 0.1)",
                  border: "1px solid #ffffff",
                  width: { xs: 44, sm: 50 },
                  height: { xs: 44, sm: 50 },
                }}
              >
                <Store
                  sx={{ fontSize: { xs: 34, sm: 40 }, color: "#2fa4da" }}
                />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{ fontSize: 17, fontWeight: 500, mb: 0.3 }}
                >
                  รหัสร้าน:{" "}
                  {shop?.shop_no || user?.address?.shopNumber || "..."}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 15, color: "text.secondary" }}
                >
                  {shop?.location || user?.address?.building || "......."}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: 17, fontWeight: 600, opacity: 0.8 }}
            >
              {isPendingMode ? "ยอดค้างชำระทั้งหมด" : "ผู้ประกอบการ"}
            </Typography>
            <Divider sx={{ mb: 1.5 }} />

            {isPendingMode ? (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{ mb: 1.5 }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid #dbeafe",
                    width: { xs: 44, sm: 50 },
                    height: { xs: 44, sm: 50 },
                  }}
                >
                  <ListAlt
                    sx={{ fontSize: { xs: 34, sm: 40 }, color: "#ec4444ff" }}
                  />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: 19,
                      fontWeight: 600,
                      color: "#960b0bff",
                      mb: 0.3,
                    }}
                  >
                    {totalUnpaidAmount.toLocaleString()} รายการ
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 15, color: "text.secondary" }}
                  >
                    จำนวนรายการค้างชำระทั้งหมด
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
                sx={{ mb: 1.5 }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(30, 118, 227, 0.1)",
                    border: "1px solid #ffffff",
                    width: { xs: 44, sm: 50 },
                    height: { xs: 44, sm: 50 },
                  }}
                >
                  <Person
                    sx={{ fontSize: { xs: 34, sm: 40 }, color: "#2fa4da" }}
                  />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontSize: 17 }}>
                    {user?.firstName || "..."} {user?.lastName || ""}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 15, color: "text.secondary" }}
                  >
                    {user?.phoneNumber || "..."}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
