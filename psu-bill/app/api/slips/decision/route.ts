// app/api/slips/decision/route.ts
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

  action?: string; // approve | deny
  decision?: string;
  status?: string;
};

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => ({}))) as BodyLoose;

    const billId = Number(raw.billId ?? raw.bill_id ?? raw.id);
    const kind = String(raw.kind ?? raw.billKind ?? raw.bill_kind ?? "")
      .toUpperCase()
      .trim();
    const action = String(raw.action ?? raw.decision ?? raw.status ?? "")
      .toLowerCase()
      .trim();

    // -------- validate --------
    if (!billId || !kind || !action) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลไม่ครบถ้วน",
          debug: { billId, kind, action, raw },
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

    if (action !== "approve" && action !== "deny") {
      return NextResponse.json(
        { success: false, message: "action ต้องเป็น approve หรือ deny" },
        { status: 400 }
      );
    }

    // ✅ status id: 3 = ชำระแล้ว, 4 = ไม่ผ่าน
    const nextStatusId = action === "approve" ? 3 : 4;

    // ✅ เวลา ณ ตอนแอดมินกดตัดสินใจ
    const decidedAt = new Date();

    // -------- update --------
    // NOTE: ต้องมีคอลัมน์เวลาใน Prisma/DB:
    // - elect_verified_at / water_verified_at
    // ถ้าชื่อคอลัมน์คุณไม่ตรง ให้แก้ชื่อ field ตรงนี้ให้ตรงกับ schema.prisma ของคุณ

    if (kind === "ELECT") {
      await prisma.bill_shop.update({
        where: { bill_id: BigInt(billId) },
        data: {
          elect_pay_status_id: nextStatusId,
          elect_approve_date: decidedAt, // ✅ บันทึกเวลา
        },
      });
    } else {
      await prisma.bill_shop.update({
        where: { bill_id: BigInt(billId) },
        data: {
          water_pay_status_id: nextStatusId,
          water_approve_date: decidedAt, // ✅ บันทึกเวลา
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        billId,
        kind,
        action,
        nextStatusId,
        decidedAt: decidedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ POST /api/slips/decision error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
