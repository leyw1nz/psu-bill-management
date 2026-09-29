import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/bills/shop/[shopId]?year=2024&month=10&all=true&meter=elect
 * Fetch shop bills for a specific shop and month
 * - If meter query is provided: returns previous meter reading (for admin record pages)
 * - If year and month are provided: returns specific bill with shop data
 * - If only year: returns all bills for that year
 * - If all=true: returns all bills (for history page)
 * - Otherwise: returns latest bill only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Check if this is a meter query (for admin record pages)
    const meterType = searchParams.get("meter"); // 'elect' | 'water'
    if (meterType) {
      return handleMeterQuery(shopId, searchParams, meterType);
    }

    // Otherwise handle bill query
    return handleBillQuery(shopId, searchParams);
  } catch (error) {
    console.error('Error in shop bill API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle meter query for admin record pages
 */
async function handleMeterQuery(
  shopId: string,
  searchParams: URLSearchParams,
  meterType: string
) {
  try {
    const reqYear = searchParams.get("year");
    const reqMonth = searchParams.get("month");
    const shopIdBigInt = BigInt(shopId);

    // 1. ดึงบิลทั้งหมดของร้านนี้
    const whereCondition: any = { shop_id: shopIdBigInt };
    if (meterType === "elect")
      whereCondition.elect_unit_current = { not: null };
    else if (meterType === "water")
      whereCondition.water_unit_current = { not: null };

    const allBills = await prisma.bill_shop.findMany({
      where: whereCondition,
      select: {
        year: true,
        month: true,
        elect_unit_current: true,
        water_unit_current: true,
      },
    });

    // 2. คำนวณ Score เพื่อเรียงลำดับ (ปี * 100 + เดือน)
    const getScore = (y: string | null, m: string | null) => {
      return parseInt(y || "0") * 100 + parseInt(m || "0");
    };

    // เรียงจาก ใหม่ -> เก่า
    allBills.sort(
      (a, b) => getScore(b.year, b.month) - getScore(a.year, a.month)
    );

    let previousMeter = "0";
    let targetBill = null;

    // 3. หาบิลที่ "เก่ากว่า" เดือนปัจจุบันที่เลือก
    if (reqYear && reqMonth) {
      const targetScore = getScore(reqYear, reqMonth);
      targetBill = allBills.find(
        (b) => getScore(b.year, b.month) < targetScore
      );
    } else {
      // ถ้าไม่ระบุเดือน (เพิ่งเข้าหน้าเว็บ) เอาล่าสุดเลย
      if (allBills.length > 0) targetBill = allBills[0];
    }

    // 4. ดึงค่า
    if (targetBill) {
      if (meterType === "elect") {
        previousMeter = targetBill.elect_unit_current?.toString() || "0";
      } else if (meterType === "water") {
        previousMeter = targetBill.water_unit_current?.toString() || "0";
      }
    }

    return NextResponse.json({ previousMeter });
  } catch (error) {
    console.error("Error fetching previous shop meter:", error);
    return NextResponse.json({ previousMeter: "0" });
  }
}

/**
 * Handle bill query for shop main and history pages
 */
async function handleBillQuery(shopId: string, searchParams: URLSearchParams) {
  try {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const all = searchParams.get('all') === 'true';

    const shopIdBigInt = BigInt(shopId);

    // Build where clause
    const where: any = {
      shop_id: shopIdBigInt,
    };

    if (year && year !== '*') {
      where.year = year;
    }

    if (month && month !== '*') {
      where.month = month;
    }

    // Determine how many bills to fetch
    const fetchOptions: any = {
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    };

    // Only limit to 1 if not fetching all and specific month/year is provided
    if (!all && year && month) {
      fetchOptions.take = 1;
    }

    // Fetch shop information and bills
    const [shop, bills] = await Promise.all([
      prisma.shop.findUnique({
        where: {
          shop_id: shopIdBigInt,
        },
      }),
      prisma.bill_shop.findMany(fetchOptions),
    ]);

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shop not found',
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const shopData = {
      ...shop,
      shop_id: shop.shop_id.toString(),
      member_id: shop.member_id?.toString(),
    };

    const billsData = bills.map((bill) => ({
      ...bill,
      bill_id: bill.bill_id.toString(),
      shop_id: bill.shop_id?.toString(),
      elect_unit_previous: bill.elect_unit_previous?.toString(),
      elect_unit_current: bill.elect_unit_current?.toString(),
      elect_amount: bill.elect_amount?.toString(),
      water_unit_previous: bill.water_unit_previous?.toString(),
      water_unit_current: bill.water_unit_current?.toString(),
      water_unit_diff: bill.water_unit_diff?.toString(),
      water_amount: bill.water_amount?.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        shop: shopData,
        bills: billsData,
        latestBill: billsData[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching shop bills:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shop bills',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
