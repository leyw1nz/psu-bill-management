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
  IconButton,
  Stack,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import MainLayout from "@/components/MainLayout";
import { houseService, memberService } from "@/lib/services";
import { House, Member } from "@/types";
import { houseTypeLabels, getHouseTypeLabel, getHouseTypeCode } from "@/lib/utils";

interface HouseWithMember extends House {
  member?: Member;
}

export default function AdminManageHousePage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    building: "",
    houseType: "ทั้งหมด",
    houseNumber: "",
    searchName: "",
  });
  const [houses, setHouses] = useState<HouseWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch houses and members data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all houses and members with role_id=3 (house users)
        const [housesResponse, membersResponse] = await Promise.all([
          houseService.getAll(), // Get all houses
          memberService.getAll(), // Get house members only
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

        // Join houses with their members
        const housesWithMembers: HouseWithMember[] = (housesResponse.data || []).map((house) => ({
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
  }, []);

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
      houseType: "ทั้งหมด",
      houseNumber: "",
      searchName: "",
    });
  };

  const handleSearch = () => {
    console.log("Search with filters:", filters);
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
      // If no building selected, show all house numbers
      return [
        ...new Set(houses.map((house) => house.house_no).filter(Boolean)),
      ].sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true }));
    }
    // Filter house numbers by selected building
    return [
      ...new Set(
        houses
          .filter((house) => house.zone_building === filters.building)
          .map((house) => house.house_no)
          .filter(Boolean)
      ),
    ].sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true }));
  }, [houses, filters.building]);

  // House type options with "All" option
  const houseTypeOptions = useMemo(() => ["ทั้งหมด", ...houseTypeLabels], []);

  const filteredHouses = useMemo(() => {
    return houses
      .filter((house) => {
        const building = house.zone_building || "";
        const houseNumber = house.house_no || "";
        const houseTypeCode = house.type || ""; // Database stores code (e.g., 'home', 'flat_fami')
        const member = house.member;
        const searchText = `${member?.name ?? ""} ${member?.surname ?? ""} ${
          member?.staff_id ?? ""
        }`.toLowerCase();
        const searchKeyword = filters.searchName.toLowerCase();

        // Exact match for building (using Autocomplete)
        const matchesBuilding =
          !filters.building || building === filters.building;

        // Exact match for house number (using Autocomplete)
        const matchesHouseNumber =
          !filters.houseNumber || houseNumber === filters.houseNumber;

        // Convert Thai label from filter to database code for comparison
        // "ทั้งหมด" is treated as empty filter (show all)
        const filterTypeCode = filters.houseType === "ทั้งหมด" ? "" : getHouseTypeCode(filters.houseType);
        const matchesHouseType =
          !filterTypeCode || houseTypeCode === filterTypeCode;

        const matchesSearchName =
          !filters.searchName || searchText.includes(searchKeyword);

        return (
          matchesBuilding &&
          matchesHouseNumber &&
          matchesHouseType &&
          matchesSearchName
        );
      })
      .sort((a, b) => {
        // Sort by อาคาร (zone_building) first
        const buildingA = a.zone_building || "";
        const buildingB = b.zone_building || "";
        const buildingCompare = buildingA.localeCompare(buildingB, undefined, { numeric: true });

        if (buildingCompare !== 0) {
          return buildingCompare;
        }

        // Then sort by เลขที่ (house_no)
        const houseNoA = a.house_no || "";
        const houseNoB = b.house_no || "";
        return houseNoA.localeCompare(houseNoB, undefined, { numeric: true });
      });
  }, [houses, filters]);

  // Show loading state
  if (loading) {
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
        {/* Error Alert */}
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
          <Box onClick={() => router.push('/admin/main')} className="breadcrumb-link">
            <Typography className="breadcrumb-text">หน้าผู้ดูแลระบบ</Typography>
          </Box>
          <Typography className="breadcrumb-current">จัดการข้อมูลบ้านพัก</Typography>
        </Breadcrumbs>

        {/* Filter Section */}
        <Paper
          elevation={3}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid #e7ebff",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              mb: 2,
              color: "#35373b",
            }}
          >
            ค้นหาข้อมูลบ้านพัก
          </Typography>

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
              label="ชื่อ/รหัสบุคลากร"
              placeholder="ค้นหาชื่อหรือรหัส"
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
                // Clear house number when building changes
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
              disabled={!filters.building && availableHouseNumbers.length > 50}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลขที่บ้าน"
                  placeholder={filters.building ? "เลือกเลขที่" : "เลือกอาคารก่อน"}
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
              options={houseTypeOptions}
              value={filters.houseType || "ทั้งหมด"}
              onChange={(_, newValue) =>
                setFilters({ ...filters, houseType: newValue || "ทั้งหมด" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ประเภทบ้านพัก"
                  placeholder="เลือกประเภทที่พัก"
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

          {/* Buttons Row */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="flex-end"
            sx={{
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: 18 }} />}
              onClick={handleClearFilters}
              sx={{
                bgcolor: "#9e9e9e",
                color: "white",
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#757575",
                },
              }}
            >
              ล้างตัวกรอง
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
              onClick={handleSearch}
              sx={{
                bgcolor: "#2196f3",
                color: "white",
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#1976d2",
                },
              }}
            >
              ค้นหา
            </Button>
          </Stack>
        </Paper>

        {/* Table */}
        <Paper
          elevation={3}
          sx={{
            p: 2.5,
            my: 1.5,
            width: "100%",
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid #e7ebff",
          }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                sx={{ fontSize: 16, my: 2, color: "#64696f", fontWeight: 500 }}
              >
                ผลการค้นหา:<b> {filteredHouses.length}</b> รายการ
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={() => router.push("/admin/manage/house_form?mode=add")}
                sx={{
                  bgcolor: "#4caf50",
                  color: "white",
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  textTransform: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#388e3c",
                  },
                }}
              >
                เพิ่มข้อมูลบ้านพัก
              </Button>
            </Box>
          </Stack>

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
                    ประเภทบ้านพัก
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
                    รหัสบุคลากร
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
                    ชื่อ-นามสกุล
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
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHouses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((house) => (
                    <TableRow
                      key={house.house_id}
                      sx={{
                        bgcolor: "white",
                        "&:hover": {
                          bgcolor: "#f5f5f5",
                        },
                      }}
                    >
                      {/* อาคาร */}
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        {house.zone_building || "-"}
                      </TableCell>

                      {/* เลขที่ */}
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        {house.house_no || "-"}
                      </TableCell>

                      {/* ประเภทบ้านพัก */}
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: "block",
                            width: "fit-content",
                            mx: "auto",
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {getHouseTypeLabel(house.type)}
                        </Box>
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        {house.member?.staff_id || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          fontSize: 15,
                          py: 2,
                        }}
                      >
                        {house.member ? `${house.member.name || ""} ${house.member.surname || ""}` : "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          py: 2,
                        }}
                      >
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(
                                `/admin/manage/house_form?mode=view&houseId=${house.house_id}`
                              )
                            }
                            sx={{
                              bgcolor: "#e3f2fd",
                              color: "#2196f3",
                              "&:hover": {
                                bgcolor: "#bbdefb",
                              },
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(
                                `/admin/manage/house_form?mode=edit&houseId=${house.house_id}`
                              )
                            }
                            sx={{
                              bgcolor: "#fff3e0",
                              color: "#f57c00",
                              "&:hover": {
                                bgcolor: "#ffe0b2",
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredHouses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontSize={16}>
                        ไม่พบข้อมูล
                      </Typography>
                    </TableCell>
                  </TableRow>
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
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
            sx={{
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#fafafa",
              ".MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel":
                {
                  color: "#64696f",
                  fontSize: 14,
                  fontWeight: 500,
                },
            }}
          />
        </Paper>
      </Container>
    </MainLayout>
  );
}
