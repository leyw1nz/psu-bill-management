// app/api/slips/change-status/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BodyLoose = {
  billId?: number | string;
  bill_id?: number | string;
  id?: number | string;

  kind?: string; // ELECT | WATER
  billKind?: string;
  bill_kind?: string;

  statusId?: number | string; // 1=รอชำระ, 2=รอตรวจสอบ, 3=ชำระแล้ว, 4=ไม่ผ่าน
  status_id?: number | string;
  pay_status_id?: number | string;
};

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => ({}))) as BodyLoose;

    const billId = Number(raw.billId ?? raw.bill_id ?? raw.id);
    const kind = String(raw.kind ?? raw.billKind ?? raw.bill_kind ?? "")
      .toUpperCase()
      .trim();
    const statusId = Number(raw.statusId ?? raw.status_id ?? raw.pay_status_id);

    // -------- validate --------
    if (!billId || !kind || !statusId) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลไม่ครบถ้วน",
          debug: { billId, kind, statusId, raw },
        },
        { status: 400 }
      );
    }

    if (kind !== "ELECT" && kind !== "WATER") {
      return NextResponse.json(
        { success: false, message: "kind ต้องเป็น ELECT หรือ WATER" },
        { status: 400 }
      );
    }

    // Valid status IDs: 1=รอชำระ, 2=รอตรวจสอบ, 3=ชำระแล้ว, 4=ไม่ผ่าน
    if (![1, 2, 3, 4].includes(statusId)) {
      return NextResponse.json(
        { success: false, message: "statusId ต้องเป็น 1, 2, 3, หรือ 4" },
        { status: 400 }
      );
    }

    const changedAt = new Date();

    // -------- update --------
    if (kind === "ELECT") {
      await prisma.bill_shop.update({
        where: { bill_id: BigInt(billId) },
        data: {
          elect_pay_status_id: statusId,
          elect_approve_date: changedAt,
        },
      });
    } else {
      await prisma.bill_shop.update({
        where: { bill_id: BigInt(billId) },
        data: {
          water_pay_status_id: statusId,
          water_approve_date: changedAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        billId,
        kind,
        statusId,
        changedAt: changedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ POST /api/slips/change-status error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
