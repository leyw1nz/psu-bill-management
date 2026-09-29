import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { AdminSlipRow } from "@/types";

const prisma = new PrismaClient();

// ✅ Mapping สถานะตาม DB
// 1=รอชำระ, 2=รอตรวจสอบ, 3=ชำระแล้ว, 4=ค้างชำระ
// ✅ requirement: "รอชำระ ให้ดึงข้อมูลที่ค้างชำระมาแสดง"
// => unpaid ต้องรวม 1 และ 4
const STATUS_MAP: Record<string, number | number[]> = {
  unpaid: [1, 4],
  pending: 2,
  paid: 3,
  all: 0,
};

type KindFilter = "ALL" | "ELECT" | "WATER";
type StatusFilter = "all" | "unpaid" | "pending" | "paid";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = (searchParams.get("q") || "").trim();
    const statusFilter = (searchParams.get("status") || "all").toLowerCase() as StatusFilter;
    const kind = (searchParams.get("kind") || "ALL").toUpperCase() as KindFilter;

    console.log(`🔎 API Search: q=${q}, status=${statusFilter}, kind=${kind}`);

    // ✅ ทำ where แบบ AND แยกเงื่อนไขชัดเจน (กัน OR ปนกันจน logic เพี้ยน)
    const whereClause: any = { AND: [] };

    // 1) Search
    if (q) {
      whereClause.AND.push({
        OR: [
          { shop: { shop_no: { contains: q, mode: "insensitive" } } },
          { bill_no: { contains: q, mode: "insensitive" } },
          { shop: { location: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    // 2) Filter Status
    // unpaid => (elect IN [1,4] OR water IN [1,4]) ตาม kind
    if (statusFilter !== "all") {
      const mapped = STATUS_MAP[statusFilter];

      const statusConditions: any[] = [];

      if (Array.isArray(mapped)) {
        if (kind === "ELECT" || kind === "ALL") {
          statusConditions.push({ elect_pay_status_id: { in: mapped } });
        }
        if (kind === "WATER" || kind === "ALL") {
          statusConditions.push({ water_pay_status_id: { in: mapped } });
        }
      } else if (typeof mapped === "number" && mapped > 0) {
        if (kind === "ELECT" || kind === "ALL") {
          statusConditions.push({ elect_pay_status_id: mapped });
        }
        if (kind === "WATER" || kind === "ALL") {
          statusConditions.push({ water_pay_status_id: mapped });
        }
      }

      if (statusConditions.length > 0) {
        whereClause.AND.push({ OR: statusConditions });
      }
    }

    // 3) Filter Kind + “ต้องมีสลิปไหม?”
    // ✅ เฉพาะ pending/paid เท่านั้นที่ควรบังคับมีสลิป
    const requireSlip = statusFilter === "pending" || statusFilter === "paid";

    if (kind === "ELECT") {
      // ต้องมีบิลไฟจริง
      whereClause.AND.push({ elect_amount: { gt: 0 } });

      // บังคับสลิปเฉพาะตอนรอตรวจ/ชำระแล้ว
      if (requireSlip) whereClause.AND.push({ elect_pay_slip_image: { not: null } });
    } else if (kind === "WATER") {
      whereClause.AND.push({ water_amount: { gt: 0 } });
      if (requireSlip) whereClause.AND.push({ water_pay_slip_image: { not: null } });
    } else {
      // ALL
      whereClause.AND.push({
        OR: [{ elect_amount: { gt: 0 } }, { water_amount: { gt: 0 } }],
      });

      // ✅ ถ้าเป็น pending/paid -> ต้องมีสลิปอย่างน้อยหนึ่งฝั่ง
      if (requireSlip) {
        whereClause.AND.push({
          OR: [
            { elect_pay_slip_image: { not: null } },
            { water_pay_slip_image: { not: null } },
          ],
        });
      }
      // ✅ ถ้า unpaid/all -> ไม่บังคับสลิป (เพื่อให้ “รอชำระ/ค้างชำระ” โผล่)
    }

    const bills = await prisma.bill_shop.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            shop_no: true,
            location: true,
          },
        },
        pay_status_bill_shop_elect_pay_status_idTopay_status: {
          select: {
            name: true,
          },
        },
        pay_status_bill_shop_water_pay_status_idTopay_status: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { bill_id: "desc" },
    });

    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === "bigint") return Number(val);
      if (typeof val === "object" && typeof val.toNumber === "function") return val.toNumber(); // Prisma.Decimal
      return Number(val);
    };

    const formatDate = (date: Date | null) => {
      if (!date) return null;
      return new Date(date).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const formattedData: AdminSlipRow[] = bills.map((bill: any) => {
      const recordDate = bill.elect_record_date || bill.water_record_date;

      return {
        bill_id: toNum(bill.bill_id),
        bill_month: toNum(bill.month),
        bill_year: toNum(bill.year),

        shop_id: bill.shop?.shop_no ?? "-",
        shop_name: bill.shop?.location ?? "",
        zone: bill.shop?.location ?? "-",

        // ไฟฟ้า
        elect_amount: toNum(bill.elect_amount),
        elect_status_name:
          bill.pay_status_bill_shop_elect_pay_status_idTopay_status?.name || "รอชำระ",
        elect_pay_slip_image: bill.elect_pay_slip_image ?? null,

        // น้ำ
        water_amount: toNum(bill.water_amount),
        water_status_name:
          bill.pay_status_bill_shop_water_pay_status_idTopay_status?.name || "รอชำระ",
        water_pay_slip_image: bill.water_pay_slip_image ?? null,

        submit_date: formatDate(recordDate),
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("❌ GET Slips Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
