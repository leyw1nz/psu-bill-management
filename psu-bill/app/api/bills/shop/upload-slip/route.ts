// app/api/bills/shop/upload-slip/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;
const PENDING_STATUS_ID = 2;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { bill_id: billIdRaw, bill_kind, slip_base64 } = body;

    if (!billIdRaw || typeof billIdRaw !== "string") {
      return NextResponse.json(
        { success: false, error: "bill_id is required" },
        { status: 400 }
      );
    }

    if (bill_kind !== "ELECT" && bill_kind !== "WATER") {
      return NextResponse.json(
        { success: false, error: "bill_kind must be ELECT or WATER" },
        { status: 400 }
      );
    }

    if (!slip_base64 || typeof slip_base64 !== "string") {
      return NextResponse.json(
        { success: false, error: "slip_base64 is required" },
        { status: 400 }
      );
    }

    // Validate base64 format (should start with data:image/)
    if (!slip_base64.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "รองรับเฉพาะ JPG/PNG" },
        { status: 400 }
      );
    }

    // Check file size from base64 (approximate: base64 is ~1.37x original size)
    const base64Data = slip_base64.split(",")[1] || "";
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "ไฟล์ต้องไม่เกิน 5MB" },
        { status: 400 }
      );
    }

    const bill_id = BigInt(billIdRaw);

    // ✅ เวลาไทย (กันเพี้ยนจากการ parse string)
    const nowBangkok = new Date(Date.now() + 7 * 60 * 60 * 1000);

    const data =
      bill_kind === "ELECT"
        ? {
            elect_pay_slip_image: slip_base64,
            elect_pay_status_id: PENDING_STATUS_ID,
            elect_pay_date: nowBangkok, // เวลาแจ้งชำระ (ไฟฟ้า)
            elect_record_date: nowBangkok, // ✅ เวลา/วันที่บันทึก (ไฟฟ้า) ตามที่ขอ
          }
        : {
            water_pay_slip_image: slip_base64,
            water_pay_status_id: PENDING_STATUS_ID,
            water_pay_date: nowBangkok, // เวลาแจ้งชำระ (น้ำ)
            water_record_date: nowBangkok, // ✅ เวลา/วันที่บันทึก (น้ำ) ตามที่ขอ
          };

    const updated = await prisma.bill_shop.update({
      where: { bill_id },
      data,
      select: {
        bill_id: true,
        elect_pay_date: true,
        water_pay_date: true,
        elect_record_date: true,
        water_record_date: true,
        elect_pay_slip_image: true,
        water_pay_slip_image: true,
        elect_pay_status_id: true,
        water_pay_status_id: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกสลิปสำเร็จ (รอตรวจสอบ)",
      data: { ...updated, bill_id: updated.bill_id.toString() },
    });
  } catch (err: any) {
    console.error("upload-slip POST error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload slip",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
