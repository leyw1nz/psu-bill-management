import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const shopIdBigInt = BigInt(shopId);

    const now = new Date();
    const currentYear = (now.getFullYear() + 543).toString();
    const currentMonth = (now.getMonth() + 1).toString();

    const rows = await prisma.bill_shop.findMany({
      where: {
        shop_id: shopIdBigInt,
        AND: [
          { NOT: { AND: [{ year: currentYear }, { month: currentMonth }] } },
          {
            NOT: {
              AND: [{ elect_pay_status_id: 3 }, { water_pay_status_id: 3 }],
            },
          },
          {
            OR: [
              { elect_pay_status_id: 2 },
              { elect_pay_status_id: 4 },
              { water_pay_status_id: 2 },
              { water_pay_status_id: 4 },
            ],
          },
        ],
      },
    });

    const priority = (b: any) => {
      const s = [b.elect_pay_status_id, b.water_pay_status_id];
      if (s.includes(4)) return 0;
      if (s.includes(2)) return 1;
      return 2;
    };

    rows.sort((a: any, b: any) => {
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;

      const ay = Number(a.year) || 0;
      const by = Number(b.year) || 0;
      if (by !== ay) return by - ay;

      const am = Number(a.month) || 0;
      const bm = Number(b.month) || 0;
      return bm - am;
    });

    const data = rows.map((bill: any) => ({
      ...bill,
      bill_id: bill.bill_id?.toString?.() ?? bill.bill_id,
      shop_id: bill.shop_id?.toString?.() ?? bill.shop_id,

      elect_unit_previous:
        bill.elect_unit_previous?.toString?.() ?? bill.elect_unit_previous,
      elect_unit_current:
        bill.elect_unit_current?.toString?.() ?? bill.elect_unit_current,
      elect_unit_diff:
        bill.elect_unit_diff?.toString?.() ?? bill.elect_unit_diff,
      elect_amount: bill.elect_amount?.toString?.() ?? bill.elect_amount,

      water_unit_previous:
        bill.water_unit_previous?.toString?.() ?? bill.water_unit_previous,
      water_unit_current:
        bill.water_unit_current?.toString?.() ?? bill.water_unit_current,
      water_unit_diff:
        bill.water_unit_diff?.toString?.() ?? bill.water_unit_diff,
      water_amount: bill.water_amount?.toString?.() ?? bill.water_amount,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching unpaid bills:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch unpaid bills",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
