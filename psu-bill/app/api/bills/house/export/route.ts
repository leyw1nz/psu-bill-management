import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Helper: Serialize BigInt/Decimal for JSON response
const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (
        value &&
        typeof value === "object" &&
        value.constructor.name === "Decimal"
      )
        return value.toString();
      return value;
    })
  );
};

/**
 * GET /api/bills/house/export
 * Returns all house bills with member data for Excel export
 * Query params:
 * - month: optional filter by month (1-12)
 * - year: optional filter by year (e.g., "2568")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {};

    // Filter by month and year if provided
    if (month) where.month = month;
    if (year) where.year = year;

    // Fetch all bill_house records with related house and member data
    const bills = await prisma.bill_house.findMany({
      where,
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { house_id: "asc" },
      ],
      include: {
        house: {
          include: {
            member: true,
          },
        },
      },
    });

    // Transform data to match the Excel export format
    const exportData = bills.map((bill) => {
      const house = bill.house;
      const member = house?.member;

      return {
        // Member info
        employeeId: member?.staff_id || member?.citizen_id || "-",
        title: member?.title || "",
        firstName: member?.name || "",
        lastName: member?.surname || "",
        fullName: `${member?.title || ""}${member?.name || ""} ${member?.surname || ""}`.trim() || "-",
        idCard: member?.citizen_id || "-",

        // House info
        houseNo: house?.house_no || "-",
        zoneBuilding: house?.zone_building || "-",
        zoneHouseNo: house?.zone_building && house?.house_no
          ? `${house.zone_building}-${house.house_no}`
          : house?.zone_building || house?.house_no || "-",
        houseType: house?.type || "-",
        fee: house?.fee?.toString() || "0",

        // Bill info
        billId: bill.bill_id.toString(),
        month: bill.month || "-",
        year: bill.year || "-",

        // Electric costs
        electUnitPrevious: bill.elect_unit_previous?.toString() || "0",
        electUnitCurrent: bill.elect_unit_current?.toString() || "0",
        electUnitDiff: bill.elect_unit_diff?.toString() || "0",
        electAmount: bill.elect_amount?.toString() || "0",

        // Water costs
        waterUnitPrevious: bill.water_unit_previous?.toString() || "0",
        waterUnitCurrent: bill.water_unit_current?.toString() || "0",
        waterUnitDiff: bill.water_unit_diff?.toString() || "0",
        waterAmount: bill.water_amount?.toString() || "0",

        // Record dates
        electRecordDate: bill.elect_record_date?.toISOString() || null,
        waterRecordDate: bill.water_record_date?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: serializeData(exportData),
      count: exportData.length,
    });
  } catch (error) {
    console.error("GET /api/bills/house/export Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch export data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
