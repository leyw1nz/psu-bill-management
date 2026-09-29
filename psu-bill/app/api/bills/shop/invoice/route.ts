import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper: Serialize BigInt/Decimal for JSON response
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
 * GET /api/bills/shop/invoice
 * Returns shop bills with member and shop data for invoice generation
 * Query params:
 * - month: optional filter by month (1-12)
 * - year: optional filter by year (e.g., "2568")
 * - elect_status: optional filter by electricity payment status ID
 * - water_status: optional filter by water payment status ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const electStatus = searchParams.get("elect_status");
    const waterStatus = searchParams.get("water_status");

    const where: any = {};

    // Filter by month and year if provided
    if (month) where.month = month;
    if (year) where.year = year;
    if (electStatus) where.elect_pay_status_id = parseInt(electStatus);
    if (waterStatus) where.water_pay_status_id = parseInt(waterStatus);

    // Fetch all bill_shop records with related shop and member data
    const bills = await prisma.bill_shop.findMany({
      where,
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { shop_id: "asc" },
      ],
      include: {
        shop: {
          include: {
            member: true,
          },
        },
        pay_status_bill_shop_elect_pay_status_idTopay_status: true,
        pay_status_bill_shop_water_pay_status_idTopay_status: true,
      },
    });

    // Transform data for invoice generation
    const invoiceData = bills.map((bill) => {
      const shop = bill.shop;
      const member = shop?.member;

      return {
        // Bill ID
        billId: bill.bill_id.toString(),

        // Member info
        memberName: member?.name || "",
        memberSurname: member?.surname || "",
        fullName: `${member?.title || ""}${member?.name || ""} ${member?.surname || ""}`.trim() || "-",

        // Shop info
        shopNo: shop?.shop_no || "-",
        location: shop?.location || "-",
        shopId: shop?.shop_id?.toString() || "-",

        // Bill period
        month: bill.month || "-",
        year: bill.year || "-",

        // Electricity data
        electUnitPrevious: bill.elect_unit_previous?.toString() || "0",
        electUnitCurrent: bill.elect_unit_current?.toString() || "0",
        electUnitDiff: bill.elect_unit_diff?.toString() || "0",
        electAmount: bill.elect_amount?.toString() || "0",
        electRecordDate: bill.elect_record_date?.toISOString() || null,
        electPayStatusId: bill.elect_pay_status_id || null,
        electPayStatusName: bill.pay_status_bill_shop_elect_pay_status_idTopay_status?.name || null,

        // Water data
        waterUnitPrevious: bill.water_unit_previous?.toString() || "0",
        waterUnitCurrent: bill.water_unit_current?.toString() || "0",
        waterUnitDiff: bill.water_unit_diff?.toString() || "0",
        waterAmount: bill.water_amount?.toString() || "0",
        waterRecordDate: bill.water_record_date?.toISOString() || null,
        waterPayStatusId: bill.water_pay_status_id || null,
        waterPayStatusName: bill.pay_status_bill_shop_water_pay_status_idTopay_status?.name || null,

        // Totals
        totalAmount: (
          parseFloat(bill.elect_amount?.toString() || "0") +
          parseFloat(bill.water_amount?.toString() || "0")
        ).toFixed(2),
      };
    });

    return NextResponse.json({
      success: true,
      data: serializeData(invoiceData),
      count: invoiceData.length,
    });
  } catch (error) {
    console.error("GET /api/bills/shop/invoice Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
