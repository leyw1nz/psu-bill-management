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
import { Home, Person } from "@mui/icons-material";
import { HouseInfoCardProps } from "@/types";

export default function HouseInfoCard({ user }: HouseInfoCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "#898888",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          sx={{ mb: 2 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: 18, fontWeight: 600, opacity: 0.8 }}
            >
              ข้อมูลบ้านพัก
            </Typography>
            <Divider sx={{ mb: 2 }}></Divider>
            <Stack
              direction="row"
              spacing={2}
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(30, 118, 227, 0.1)",
                  border: "1px solid #ede2e2",
                  width: { xs: 50, sm: 60 },
                  height: { xs: 50, sm: 60 },
                }}
              >
                <Home sx={{ fontSize: { xs: 40, sm: 50 }, color: "#2fa4da" }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{ fontSize: 18, fontWeight: 500, mb: 0.5 }}
                >
                  ห้องที่/บ้านเลขที่: {user.address?.houseNumber || "..."}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 16, color: "text.secondary" }}
                >
                  {user.address?.building || "......."}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: 18, fontWeight: 600, opacity: 0.8 }}
            >
              ผู้พักอาศัย
            </Typography>
            <Divider sx={{ mb: 2 }}></Divider>
            <Stack
              direction="row"
              spacing={2}
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(30, 118, 227, 0.1)",
                  border: "1px solid #ede2e2",
                  width: { xs: 50, sm: 60 },
                  height: { xs: 50, sm: 60 },
                }}
              >
                <Person
                  sx={{ fontSize: { xs: 40, sm: 50 }, color: "#2fa4da" }}
                />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontSize: 18 }}>
                  คุณ{user.firstName} {user.lastName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 16, color: "text.secondary" }}
                >
                  {user.phoneNumber}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
