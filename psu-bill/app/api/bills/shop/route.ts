import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { thaiMonths } from "@/lib/utils";

// ✅ บังคับดึงข้อมูลใหม่จากฐานข้อมูลเสมอ (แก้ปัญหาลบข้อมูลแล้วในหน้าเว็บยังค้างอยู่)
export const dynamic = 'force-dynamic';

// ✅ Helper สำหรับแปลงค่า BigInt เป็น String เพื่อให้ส่งผ่าน JSON ได้
const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (value && typeof value === "object" && value.constructor.name === "Decimal")
        return value.toString();
      return value;
    })
  );
};

// ✅ Helper สำหรับสร้างเลขบิล (Format: S + ปี + เดือน + รหัสร้าน)
const generateBillNo = (year: string, month: string, shopId: string) => {
  const m = month.padStart(2, "0");
  const s = shopId.padStart(4, "0");
  return `S${year}${m}${s}`;
};

// ✅ Helper สำหรับการจัดการตัวเลขให้ปลอดภัย
const safeBigInt = (val: any) => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) return BigInt(0);
  return BigInt(Math.floor(Number(val)));
};

const safeDecimal = (val: any) => {
  if (!val) return "0";
  return parseFloat(val.toString()).toFixed(2);
};

// ==========================================
// 1. GET: ดึงประวัติการบันทึก (น้ำ/ไฟ)
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'water' | 'elect'

    const where: any = {};
    // กรองเอาเฉพาะรายการที่มีการบันทึกมิเตอร์จริง (ตรวจสอบจากวันที่บันทึก)
    if (type === "water") {
      where.water_record_date = { not: null };
    } else if (type === "elect") {
      where.elect_record_date = { not: null };
    }

    const bills = await prisma.bill_shop.findMany({
      where: where,
      orderBy: { bill_id: "desc" },
      include: {
        shop: {
          include: {
            member: true,
          },
        },
      },
    });

    const enrichedBills = bills.map((bill) => {
      const mInt = parseInt(bill.month || "0");
      const displayMonth = mInt >= 1 && mInt <= 12 ? thaiMonths[mInt - 1] : bill.month;

      return {
        bill_id: bill.bill_id.toString(),
        bill_no: bill.bill_no,
        year: bill.year,
        month: bill.month,
        displayMonth: displayMonth,
        // ข้อมูลมิเตอร์ไฟ
        elect_unit_previous: bill.elect_unit_previous?.toString(),
        elect_unit_current: bill.elect_unit_current?.toString(),
        elect_unit_diff: bill.elect_unit_diff,
        elect_amount: Number(bill.elect_amount),
        elect_record_date: bill.elect_record_date,
        elect_pay_status_id: bill.elect_pay_status_id,
        // ข้อมูลมิเตอร์น้ำ
        water_unit_previous: bill.water_unit_previous?.toString(),
        water_unit_current: bill.water_unit_current?.toString(),
        water_unit_diff: bill.water_unit_diff?.toString(),
        water_amount: Number(bill.water_amount),
        water_record_date: bill.water_record_date,
        water_pay_status_id: bill.water_pay_status_id,
        // ข้อมูลร้านค้า
        shop: {
          shop_no: bill.shop?.shop_no || "-",
          location: bill.shop?.location || "-",
        },
        member: {
          name: bill.shop?.member?.name || "-",
          surname: bill.shop?.member?.surname || "",
        },
        note: bill.note
      };
    });

    return NextResponse.json(serializeData(enrichedBills));
  } catch (error) {
    console.error("❌ GET Shop Bills Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: บันทึกข้อมูล (น้ำ/ไฟ)
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, month, year, note } = body;

    if (!shop_id) return NextResponse.json({ error: "Missing shop_id" }, { status: 400 });

    const shopIdBigInt = safeBigInt(shop_id);
    const targetBillNo = generateBillNo(year.toString(), month.toString(), shop_id.toString());

    // ตรวจสอบว่าเดือนนี้ ปีนี้ ร้านนี้มีบิลหรือยัง
    const existingBill = await prisma.bill_shop.findFirst({
      where: {
        OR: [
          { shop_id: shopIdBigInt, year: year.toString(), month: month.toString() },
          { bill_no: targetBillNo }
        ]
      },
    });

    const now = new Date();
    const updateData: any = { note: note || null };

    // จัดการข้อมูลไฟฟ้า (ถ้าส่งมา) พร้อมตั้งสถานะเป็น 1 (รอชำระเงิน)
    if (body.elect_unit_current !== undefined) {
      updateData.elect_unit_previous = safeBigInt(body.elect_unit_previous);
      updateData.elect_unit_current = safeBigInt(body.elect_unit_current);
      updateData.elect_unit_diff = parseInt(body.elect_unit_diff) || 0;
      updateData.elect_amount = safeDecimal(body.elect_amount);
      updateData.elect_record_date = now;
      updateData.elect_pay_status_id = 1; // ✅ ตั้งเป็นรอชำระเงิน
    }

    // จัดการข้อมูลน้ำประปา (ถ้าส่งมา) พร้อมตั้งสถานะเป็น 4 (ค้างชำระ)
    if (body.water_unit_current !== undefined) {
      updateData.water_unit_previous = safeBigInt(body.water_unit_previous);
      updateData.water_unit_current = safeBigInt(body.water_unit_current);
      updateData.water_unit_diff = safeBigInt(body.water_unit_diff);
      updateData.water_amount = safeDecimal(body.water_amount);
      updateData.water_record_date = now;
      updateData.water_pay_status_id = 4; // ✅ ค้างชำระ
    }

    // ✅ Amount Edited Flag (ถ้ามีการส่งมา)
    if (body.amount_edited !== undefined) {
      updateData.amount_edited = body.amount_edited;
    }

    if (existingBill) {
      // อัปเดตบิลเดิม
      await prisma.bill_shop.update({
        where: { bill_id: existingBill.bill_id },
        data: updateData,
      });
    } else {
      // สร้างบิลใหม่ (กรณีบันทึกน้ำหรือไฟอย่างใดอย่างหนึ่งก่อน อีกสถานะควรเป็น null หรือตาม Business Logic)
      await prisma.bill_shop.create({
        data: {
          bill_no: targetBillNo,
          year: year.toString(),
          month: month.toString(),
          shop_id: shopIdBigInt,
          ...updateData,
          // หากสร้างบิลใหม่แต่ส่งมาแค่อย่างเดียว ให้ค่าเริ่มต้นสถานะที่เหลือเป็น 1 ไปด้วย หรือใส่เฉพาะตัวที่ส่งมา
          elect_pay_status_id: updateData.elect_pay_status_id || 1,
          water_pay_status_id: updateData.water_pay_status_id || 1,
        },
      });
    }

    return NextResponse.json({ message: "Success" });
  } catch (error: any) {
    console.error("❌ POST Shop Bill Error:", error);
    return NextResponse.json({ error: error.message || "Save Failed" }, { status: 500 });
  }
}