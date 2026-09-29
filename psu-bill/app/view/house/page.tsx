"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import MainLayout from "@/components/MainLayout";
import { houseService, memberService } from "@/lib/services";
import { House, Member } from "@/types";
import { getCurrentUser } from "@/lib/auth";

interface HouseWithMember extends House {
  member?: Member;
}

export default function ViewHousePage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    building: "",
    houseNumber: "",
    searchName: "",
    faculty: "",
  });
  const [houses, setHouses] = useState<HouseWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  // Check authorization on mount
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Check if user has valid role_id (1, 2, or 4)
      if (currentUser.member_id) {
        const response = await memberService.getById(currentUser.member_id);

        if (response.success && response.data) {
          const roleId = response.data.role_id;

          // Allow only role_id 1 (admin), 2 (staff), or 4 (other authorized role)
          if (roleId === 1 || roleId === 2 || roleId === 4) {
            setAuthorized(true);
          } else {
            // Redirect unauthorized users
            router.push('/');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      } else {
        router.push('/login');
        return;
      }
    };

    checkAuth();
  }, [router]);

  // Fetch houses and members data
  useEffect(() => {
    if (!authorized) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all houses and members
        const [housesResponse, membersResponse] = await Promise.all([
          houseService.getAll(),
          memberService.getAll({ status: 'active' }),
        ]);

        if (!housesResponse.success) {
          throw new Error(housesResponse.error || 'Failed to fetch houses');
        }

        if (!membersResponse.success) {
          throw new Error(membersResponse.error || 'Failed to fetch members');
        }

        // Create a map of members by member_id for quick lookup
        const membersMap = new Map(
          (membersResponse.data || []).map((member) => [
            member.member_id,
            member,
          ])
        );

        // Join houses with their members and filter out deleted houses
        const housesWithMembers: HouseWithMember[] = (housesResponse.data || [])
          .filter((house) => !house.delete_date) // Only active houses
          .map((house) => ({
            ...house,
            member: house.member_id ? membersMap.get(house.member_id) : undefined,
          }));

        setHouses(housesWithMembers);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authorized]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      building: "",
      houseNumber: "",
      searchName: "",
      faculty: "",
    });
    setPage(0);
  };

  // Extract unique buildings from houses
  const uniqueBuildings = useMemo(() => {
    return [
      ...new Set(houses.map((house) => house.zone_building).filter(Boolean)),
    ].sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true }));
  }, [houses]);

  // Extract unique house numbers based on selected building
  const availableHouseNumbers = useMemo(() => {
    if (!filters.building) {
      return [
        ...new Set(houses.map((house) => house.house_no).filter(Boolean)),
      ].sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true }));
    }
    return [
      ...new Set(
        houses
          .filter((house) => house.zone_building === filters.building)
          .map((house) => house.house_no)
          .filter(Boolean)
      ),
    ].sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true }));
  }, [houses, filters.building]);

  // Extract unique faculties from members
  const uniqueFaculties = useMemo(() => {
    return [
      ...new Set(
        houses
          .map((house) => house.member?.faculty_name)
          .filter(Boolean)
      ),
    ].sort((a, b) => a!.localeCompare(b!, "th"));
  }, [houses]);

  const filteredHouses = useMemo(() => {
    return houses
      .filter((house) => {
        const building = house.zone_building || "";
        const houseNumber = house.house_no || "";
        const member = house.member;
        const faculty = member?.faculty_name || "";
        const searchText = `${member?.name ?? ""} ${member?.surname ?? ""} ${
          member?.phone ?? ""
        }`.toLowerCase();
        const searchKeyword = filters.searchName.toLowerCase();

        const matchesBuilding =
          !filters.building || building === filters.building;

        const matchesHouseNumber =
          !filters.houseNumber || houseNumber === filters.houseNumber;

        const matchesSearchName =
          !filters.searchName || searchText.includes(searchKeyword);

        const matchesFaculty =
          !filters.faculty || faculty === filters.faculty;

        return (
          matchesBuilding &&
          matchesHouseNumber &&
          matchesSearchName &&
          matchesFaculty
        );
      })
      .sort((a, b) => {
        const buildingA = a.zone_building || "";
        const buildingB = b.zone_building || "";
        const buildingCompare = buildingA.localeCompare(buildingB, undefined, { numeric: true });

        if (buildingCompare !== 0) {
          return buildingCompare;
        }

        const houseNoA = a.house_no || "";
        const houseNoB = b.house_no || "";
        return houseNoA.localeCompare(houseNoB, undefined, { numeric: true });
      });
  }, [houses, filters]);

  const paginatedHouses = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredHouses.slice(start, end);
  }, [filteredHouses, page, rowsPerPage]);

  // Show loading while checking auth or fetching data
  if (!authorized || loading) {
    return (
      <MainLayout IsMobile={false}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout IsMobile={false}>
      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
          <Typography className="breadcrumb-current">ข้อมูลบ้านพัก</Typography>
        </Breadcrumbs>

        {/* Page Title */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            border: "1px solid #e7ebff",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <HomeIcon sx={{ fontSize: 28, color: "#1976d2" }} />
            <Typography
              variant="h5"
              sx={{
                fontSize: 20,
                fontWeight: 600,
                color: "#35373b",
              }}
            >
              ข้อมูลบ้านพัก
            </Typography>
          </Stack>

          {/* Filter Section */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="ชื่อ/เบอร์โทร"
              placeholder="ค้นหาชื่อหรือเบอร์โทร"
              value={filters.searchName}
              onChange={(e) =>
                setFilters({ ...filters, searchName: e.target.value })
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={uniqueBuildings}
              value={filters.building || null}
              onChange={(_, newValue) => {
                setFilters({ ...filters, building: newValue || "", houseNumber: "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="อาคาร"
                  placeholder="เลือกหรือค้นหาอาคาร"
                />
              )}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={availableHouseNumbers}
              value={filters.houseNumber || null}
              onChange={(_, newValue) =>
                setFilters({ ...filters, houseNumber: newValue || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลขที่"
                  placeholder="เลือกหรือค้นหาเลขที่"
                />
              )}
              disabled={!filters.building}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: filters.building ? "white" : "#f5f5f5",
                },
              }}
            />
            <Autocomplete
              fullWidth
              size="small"
              options={uniqueFaculties}
              value={filters.faculty || null}
              onChange={(_, newValue) =>
                setFilters({ ...filters, faculty: newValue || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="คณะ/ส่วนงาน"
                  placeholder="เลือกหรือค้นหาคณะ"
                />
              )}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "white",
                },
              }}
            />
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                borderRadius: 1.5,
                textTransform: "none",
                borderColor: "#9e9e9e",
                color: "#9e9e9e",
                "&:hover": {
                  borderColor: "#757575",
                  bgcolor: "#f5f5f5",
                },
              }}
            >
              ล้างตัวกรอง
            </Button>
          </Stack>
        </Paper>

        {/* Table Section */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: "1px solid #e7ebff",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: "#f5f7fa" }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#35373b" }}>
              พบ {filteredHouses.length} รายการ
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#e4eef8" }}>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    อาคาร
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    เลขที่
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    ผู้อยู่อาศัย
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    เบอร์โทร
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    คณะ/ส่วนงาน
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      borderBottom: "2px solid #507494",
                      color: "#507494",
                      fontWeight: 600,
                      fontSize: 16,
                      py: 2,
                    }}
                  >
                    สถานะ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        ไม่พบข้อมูล
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHouses.map((house) => (
                    <TableRow
                      key={house.house_id}
                      sx={{
                        "&:hover": { bgcolor: "#f9fafb" },
                      }}
                    >
                      <TableCell>{house.zone_building || "-"}</TableCell>
                      <TableCell>{house.house_no || "-"}</TableCell>
                      <TableCell>
                        {house.member
                          ? `${house.member.title || ""} ${house.member.name || ""} ${
                              house.member.surname || ""
                            }`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell>{house.member?.phone || "-"}</TableCell>
                      <TableCell>{house.member?.faculty_name || "-"}</TableCell>
                      <TableCell>
                        {house.member ? (
                          <Chip
                            label="มีผู้อยู่อาศัย"
                            size="small"
                            sx={{
                              bgcolor: "#e8f5e9",
                              color: "#2e7d32",
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        ) : (
                          <Chip
                            label="ว่าง"
                            size="small"
                            sx={{
                              bgcolor: "#fff3e0",
                              color: "#ed6c02",
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredHouses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="แถวต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
            sx={{
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#fafafa",
            }}
          />
        </Paper>
      </Container>
    </MainLayout>
  );
}
