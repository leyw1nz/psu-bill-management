"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Stack,
  Breadcrumbs,
  Button,
  Collapse,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Info as InfoIcon,
  Home as HouseIcon,
  Store as ShopIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  PriceCheck as PaymentCheckIcon,
  Topic as DocumentIcon,
  NavigateNext as NavigateNextIcon,
  KeyboardReturn as ReturnIcon,
  ElectricBolt as MeterIcon,
  Dashboard as DashboardIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import MainLayout from "@/components/MainLayout";

// ----------------------------------------------------------------------
// 1. Mapping ID จาก Database (role_id) -> ชื่อ Role (string)
// ----------------------------------------------------------------------
const ROLE_MAP: Record<number, string> = {
  1: "admin",    // ผู้ดูแลระบบ
  2: "shop",     // ผู้จัดการข้อมูลร้านค้า
  3: "general",  // ผู้ใช้งานทั่วไป (House & Shop)
  4: "house",    // ผู้มีสิทธิดูข้อมูลบ้านพัก
};

// ----------------------------------------------------------------------
// 2. ตั้งค่าเมนู (Admin อยู่ด้านบนสุด)
// ----------------------------------------------------------------------
const menuConfig = [
  {
    category: "เจ้าหน้าที่ (Admin)",
    allowedRoles: ["admin"],
    items: [
      { title: "หน้าหลัก (Dashboard)", path: "/manual/admin/dashboard", icon: <DashboardIcon /> },
      { title: "จัดการข้อมูลหลัก", path: "/manual/admin/manage", icon: <AdminIcon /> },
      { title: "บันทึกมิเตอร์", path: "/manual/admin/record", icon: <MeterIcon /> },
      { title: "ตรวจสอบการชำระ", path: "/manual/admin/payment", icon: <PaymentCheckIcon /> },
      { title: "เอกสารและรายงาน", path: "/manual/admin/document", icon: <DocumentIcon /> },
    ],
  },
  {
    category: "เจ้าของบ้านพัก (House)",
    allowedRoles: ["general", "house","admin"],
    items: [
      { title: "การเข้าสู่ระบบ", path: "/manual/house/login", icon: <LoginIcon /> },
      { title: "หน้าหลัก & บิล", path: "/manual/house/dashboard", icon: <HouseIcon /> },
      { title: "ดูประวัติย้อนหลัง", path: "/manual/house/history", icon: <HistoryIcon /> },
    ],
  },
  {
    category: "เจ้าของร้านค้า (Shop)",
    allowedRoles: ["general", "shop","admin"],
    items: [
      { title: "การเข้าสู่ระบบ", path: "/manual/shop/login", icon: <LoginIcon /> },
      { title: "หน้าหลัก & ยอดค้าง", path: "/manual/shop/dashboard", icon: <ShopIcon /> },
      { title: "การแจ้งชำระเงิน", path: "/manual/shop/payment", icon: <PaymentIcon /> },
      { title: "ประวัติย้อนหลัง", path: "/manual/shop/history", icon: <HistoryIcon /> },
      { title: "พิมพ์ใบแจ้งหนี้", path: "/manual/shop/invoice", icon: <ReceiptIcon /> },
    ],
  },
];

const SidebarContent = ({
  currentPath,
  userRole,
  onClose,
}: {
  currentPath: string;
  userRole: string | null;
  onClose?: () => void;
}) => {
  const router = useRouter();

  // State for collapsible menu sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "เจ้าหน้าที่ (Admin)": true,
    "เจ้าของบ้านพัก (House)": true,
    "เจ้าของร้านค้า (Shop)": true,
  });

  const handleToggleSection = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Logic ปุ่มกลับสู่หน้าใช้งาน
  const handleBackToApp = () => {
    if (!userRole) {
      router.push("/");
      return;
    }
    const role = userRole.toLowerCase();

    if (role === "admin") {
        router.push("/admin/main"); // แก้ไข path ให้ตรงกับ admin
    } else if (role === "general") {
        router.push("/main");
    } else if (role === "shop") {
        router.push("/shop/main");
    } else if (role === "house") {
        router.push("/house/main");
    } else {
        router.push("/main");
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ px: 2, mb: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={handleBackToApp}
          startIcon={<ReturnIcon />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "white",
            "&:hover": { bgcolor: "#f0f7ff" },
          }}
        >
          กลับสู่หน้าใช้งาน
        </Button>
      </Box>

      <Box sx={{ px: 3, mb: 1, mt: 2 }}>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          คู่มือการใช้งาน
        </Typography>
      </Box>
      <Divider />

      <List component="nav" sx={{ px: 2 }}>
        {menuConfig.map((section, index) => {
          const currentRole = userRole ? userRole.toLowerCase() : "";

          const isAllowed =
             section.allowedRoles.includes("all") ||
             (currentRole && section.allowedRoles.includes(currentRole));

          if (!isAllowed) return null;

          const isExpanded = expandedSections[section.category];

          return (
            <Box key={index} sx={{ mb: 2 }}>
              <ListSubheader
                onClick={() => handleToggleSection(section.category)}
                sx={{
                  bgcolor: "transparent",
                  fontWeight: 700,
                  color: "#2c3e50",
                  lineHeight: "2.5rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 1,
                  transition: "0.2s",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <span>{section.category}</span>
                <IconButton
                  size="small"
                  sx={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "0.3s",
                    p: 0.5,
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </ListSubheader>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                {section.items.map((item) => {
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <ListItemButton
                        selected={isActive}
                        onClick={onClose}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          "&.Mui-selected": {
                            bgcolor: "rgba(25, 118, 210, 0.08)",
                            color: "primary.main",
                            "&:hover": { bgcolor: "rgba(25, 118, 210, 0.12)" },
                            "& .MuiListItemIcon-root": { color: "primary.main" },
                          },
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isActive ? "primary.main" : "text.secondary",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </Link>
                  );
                })}
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
};

export default function ManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    
    // แปลง ID เป็น Role string
    if (user && user.role_id) {
      // Cast เป็น number เพื่อแก้ Error TypeScript
      const roleId = user.role_id as number;
      const mappedRole = ROLE_MAP[roleId] || "general";
      setUserRole(mappedRole);
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const currentPageTitle = useMemo(() => {
    for (const section of menuConfig) {
      const found = section.items.find((item) => item.path === pathname);
      if (found) return found.title;
    }
    return "รายละเอียด";
  }, [pathname]);

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl" sx={{ py: 4, pb: 12 }}>
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              color="primary"
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="span"
              variant="h6"
              sx={{ ml: 1, verticalAlign: "middle" }}
            >
              เมนูคู่มือ
            </Typography>
          </Box>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems="flex-start"
        >
          {!isMobile && (
            <Box
              component="aside"
              sx={{
                width: 280,
                flexShrink: 0,
                position: "sticky",
                top: 24,
                alignSelf: "flex-start",
                maxHeight: "calc(100vh - 48px)",
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#ddd",
                  borderRadius: "3px",
                },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <SidebarContent currentPath={pathname} userRole={userRole} />
              </Paper>
            </Box>
          )}

          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: 280 },
            }}
          >
            <SidebarContent
              currentPath={pathname}
              userRole={userRole}
              onClose={handleDrawerToggle}
            />
          </Drawer>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: "100%",
              minWidth: 0,
            }}
          >
            <Box sx={{ minHeight: "60vh" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: "white",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Breadcrumbs
                  separator={<NavigateNextIcon fontSize="small" />}
                  aria-label="breadcrumb"
                >
                  <Link href="/manual" style={{ textDecoration: "none" }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      <InfoIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={500}>
                        คู่มือการใช้งาน
                      </Typography>
                    </Stack>
                  </Link>

                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={700}
                  >
                    {currentPageTitle}
                  </Typography>
                </Breadcrumbs>
              </Paper>

              {children}
            </Box>
          </Box>
        </Stack>
      </Container>
    </MainLayout>
  );
}