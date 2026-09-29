import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ป้องกันการ Cache หน้า API เพื่อให้ได้ข้อมูลล่าสุดเสมอ
export const dynamic = 'force-dynamic';

// สร้าง Prisma Client (Best Practice สำหรับ Next.js เพื่อป้องกัน Connection เต็มใน Dev)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// กำหนด Interface เพื่อความชัดเจนของ Type
interface MonthlyStats {
  name: string;
  month: string;      // '01', '02'
  year: string;       // '2569'
  electric: number;
  water: number;
  totalCost: number;
}

// ฟังก์ชันแปลงเลขเดือนเป็นชื่อย่อภาษาไทย
const getThaiMonthName = (monthStr: string) => {
  const months = [
    '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const monthInt = parseInt(monthStr, 10); // ใส่ radix 10 เพื่อความชัวร์
  return months[monthInt] || monthStr;
};

export async function GET() {
  try {
    const today = new Date();
    
    // ✅ 1. เตรียมข้อมูล 6 เดือนย้อนหลัง (ใช้ปี พ.ศ.)
    const targetMonths: MonthlyStats[] = [];
    
    // วนลูปย้อนหลัง 5 เดือน + เดือนปัจจุบัน = 6 เดือน
    for (let i = 5; i >= 0; i--) {
      // เซ็ตวันที่เป็นวันที่ 1 ของเดือน เพื่อป้องกันบั๊กข้ามเดือน (เช่น 31 ก.พ. ไม่มีจริง)
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      
      // เดือน: '01' - '12'
      let m = (d.getMonth() + 1).toString().padStart(2, '0');
      
      // ปี: พ.ศ. (+543)
      let y = (d.getFullYear() + 543).toString(); 

      targetMonths.push({
        name: getThaiMonthName(m),
        month: m,
        year: y,
        electric: 0,
        water: 0,
        totalCost: 0
      });
    }

    // ดึงรายชื่อปีที่ต้องค้นหาเพื่อใช้ใน Query (เช่น ['2568', '2569'])
    const targetYears = [...new Set(targetMonths.map(t => t.year))];

    // ✅ 2. Query ข้อมูลบ้านพัก
    const houseBills = await prisma.bill_house.findMany({
      where: { year: { in: targetYears } },
      select: {
        month: true,
        year: true,
        elect_unit_diff: true,
        water_unit_diff: true,
        elect_amount: true,
        water_amount: true
      }
    });

    // ✅ 3. Query ข้อมูลร้านค้า
    const shopBills = await prisma.bill_shop.findMany({
      where: { year: { in: targetYears } },
      select: {
        month: true,
        year: true,
        elect_unit_diff: true,
        water_unit_diff: true,
        elect_amount: true,
        water_amount: true
      }
    });

    // ✅ 4. ฟังก์ชันรวมข้อมูล
    const processBill = (bill: any) => {
      // ถ้าไม่มีเดือน/ปี ให้ข้าม
      if (!bill.month || !bill.year) return;

      // ค้นหาว่าบิลนี้ตรงกับเดือนไหนใน targetMonths
      const target = targetMonths.find(t => {
        // แปลงเป็น Int ก่อนเทียบ เพื่อแก้ปัญหา '01' กับ '1'
        return t.year === bill.year && parseInt(t.month) === parseInt(bill.month);
      });

      if (target) {
        // แปลงค่าจาก Database (BigInt/Decimal) เป็น Number
        // ใช้ Number() ครอบเพื่อความปลอดภัยและรองรับค่า null (จะเป็น 0)
        
        // หน่วยการใช้ (Units)
        if (bill.elect_unit_diff) target.electric += Number(bill.elect_unit_diff);
        if (bill.water_unit_diff) target.water += Number(bill.water_unit_diff);
        
        // จำนวนเงิน (Amount)
        if (bill.elect_amount) target.totalCost += Number(bill.elect_amount);
        if (bill.water_amount) target.totalCost += Number(bill.water_amount);
      }
    };

    // เริ่มประมวลผลรวมยอด
    houseBills.forEach(processBill);
    shopBills.forEach(processBill);

    // ✅ 5. จัดรูปแบบ JSON ส่งกลับ (ส่งตัวเลขดิบตามที่ Frontend ต้องการ)
    const trendData = targetMonths.map(t => ({
      name: t.name,
      electric: t.electric,
      water: t.water
    }));

    const costData = targetMonths.map(t => ({
      name: t.name,
      total: t.totalCost
    }));

    return NextResponse.json({
      success: true,
      data: {
        trendData,
        costData
      }
    });

  } catch (error: any) {
    console.error("Chart API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}