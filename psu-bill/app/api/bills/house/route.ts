import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { thaiMonths } from "@/lib/utils";

// ✅ Helper: แปลงค่าปลอดภัย (รองรับ String จาก Frontend)
const safeBigInt = (val: any) => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return BigInt(0);
  }
  return BigInt(Math.floor(Number(val)));
};

const safeInt = (val: any) => {
  if (!val || isNaN(Number(val))) return 0;
  return parseInt(val);
};

const safeDecimal = (val: any) => {
  if (!val) return "0";
  return parseFloat(val.toString()).toFixed(2);
};

// ✅ Helper: Serialize BigInt/Decimal ก่อนส่งกลับ JSON
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

// ✅ Helper: สร้างเลขบิล (Format: H + ปี + เดือน + รหัสบ้าน)
const generateBillNo = (year: string, month: string, houseId: string) => {
  const m = month.toString().padStart(2, "0");
  const h = houseId.toString().padStart(4, "0");
  return `H${year}${m}${h}`;
};

// ================= GET Method (ใช้คู่กับ getRecentBills/WaterBills) =================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const where: any = {};

    // กรองประเภท (ตรวจสอบจากวันที่บันทึก)
    if (type === "water") where.water_record_date = { not: null };
    else if (type === "elect") where.elect_record_date = { not: null };

    const bills = await prisma.bill_house.findMany({
      where: where,
      orderBy: { bill_id: "desc" },
      // ✅ Join ตารางแบบ Nested เพื่อให้ตรงกับ Type BillRecordDisplay
      include: {
        house: {
          include: {
            member: true,
          },
        },
      },
    });

    const enrichedBills = bills.map((bill) => {
      const mInt = parseInt(bill.month || "0");
      const displayMonth =
        mInt >= 1 && mInt <= 12 ? thaiMonths[mInt - 1] : bill.month;

      return {
        ...bill,
        month: displayMonth, // แปลงเป็นชื่อเดือนไทยส่งกลับไป
        house: {
          house_no: bill.house?.house_no || "-",
          zone_building: bill.house?.zone_building || "-",
        },
        member: {
          name: bill.house?.member?.name || "ไม่ระบุ",
          surname: bill.house?.member?.surname || "",
        },
      };
    });

    return NextResponse.json(serializeData(enrichedBills));
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ================= POST Method (ใช้คู่กับ saveBill) =================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📥 House Payload:", body);

    if (!body.house_id) throw new Error("Missing house_id");

    const houseIdBigInt = safeBigInt(body.house_id);
    const yearStr = body.year.toString();
    const monthStr = body.month.toString();
    const targetBillNo = generateBillNo(
      yearStr,
      monthStr,
      body.house_id.toString()
    );

    // เช็คบิลซ้ำ
    const existingBill = await prisma.bill_house.findFirst({
      where: {
        OR: [
          { house_id: houseIdBigInt, year: yearStr, month: monthStr },
          { bill_no: targetBillNo },
        ],
      },
    });

    const updateData: any = {};
    const now = new Date(); // เวลา UTC (ถูกต้องแล้ว)

    // --- ไฟฟ้า ---
    if (body.elect_unit_current !== undefined) {
      updateData.elect_unit_previous = safeBigInt(body.elect_unit_previous);
      updateData.elect_unit_current = safeBigInt(body.elect_unit_current);
      updateData.elect_unit_diff = safeInt(body.elect_unit_diff);
      updateData.elect_amount = safeDecimal(body.elect_amount);
      updateData.elect_record_date = now;
    }

    // --- น้ำประปา ---
    if (body.water_unit_current !== undefined) {
      updateData.water_unit_previous = safeBigInt(body.water_unit_previous);
      updateData.water_unit_current = safeBigInt(body.water_unit_current);
      updateData.water_unit_diff = safeBigInt(body.water_unit_diff);
      updateData.water_amount = safeDecimal(body.water_amount);
      updateData.water_record_date = now;
    }

    // ✅ Amount Edited Flag (ถ้ามีการส่งมา)
    if (body.amount_edited !== undefined) {
      updateData.amount_edited = body.amount_edited;
    }

    if (existingBill) {
      // Update
      await prisma.bill_house.update({
        where: { bill_id: existingBill.bill_id },
        data: { ...updateData }, // ไม่ต้อง update note
      });
    } else {
      // Create
      await prisma.bill_house.create({
        data: {
          bill_no: targetBillNo,
          year: yearStr,
          month: monthStr,
          house_id: houseIdBigInt,
          // Default Values
          elect_unit_previous: BigInt(0),
          elect_unit_current: BigInt(0),
          elect_unit_diff: 0,
          elect_amount: 0,
          water_unit_previous: BigInt(0),
          water_unit_current: BigInt(0),
          water_unit_diff: BigInt(0),
          water_amount: 0,
          ...updateData,
        },
      });
    }

    return NextResponse.json({ message: "Save success" });
  } catch (error: any) {
    console.error("❌ SAVE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
